import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from backend.app.models.os import ServiceOrder, OSStatus, OSWorkflowHistory, ServiceOrderItem
from backend.app.models.lens import LensModel, MatrixType
from backend.app.models.optical_store import OpticalStore
from backend.app.schemas.os_batch import (
    OSBatchCreateRequest, OSBatchCreateResponse, OSBatchItemResult
)
from backend.app.services.allocation import allocate_and_deduct_inventory
from backend.app.crud.os import generate_os_number

GRADE_MAP = {
    "LP_GRADE": "Visão Simples",
    "GRADE_167": "1.67",
    "MF_ACB": "Multifocal Acabado",
    "MF_BLOCO": "Multifocal",
    "BLOCO_VS": "Bloco Visão Simples",
}

DEFAULT_GRADE_PRICES = {
    "LP_GRADE": 67.0,
    "GRADE_167": 110.0,
    "MF_ACB": 85.0,
    "MF_BLOCO": 95.0,
    "BLOCO_VS": 75.0,
}

class OSBatchService:

    @classmethod
    async def create_batch_orders(
        cls,
        db: AsyncSession,
        payload: OSBatchCreateRequest,
        current_user_id: Optional[uuid.UUID] = None
    ) -> OSBatchCreateResponse:
        """
        Cria em lote múltiplas Ordens de Serviço a partir de um malote/remessa da mesma ótica.
        Executa baixas atômicas de estoque para cada lente informada,
        registra serviços laboratoriais e calcula valores para faturamento unificado.
        """
        # 1. Validação da Ótica
        store_res = await db.execute(select(OpticalStore).where(OpticalStore.id == payload.optical_store_id))
        store = store_res.scalars().first()
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ótica parceira não encontrada."
            )

        batch_ref = payload.batch_reference or f"MALOTE-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')}"
        results: List[OSBatchItemResult] = []
        total_batch_amount = 0.0

        # Cache de Modelos de Lentes ativos por matrix_type
        all_models_res = await db.execute(select(LensModel))
        available_models = all_models_res.scalars().all()
        models_by_matrix: Dict[str, LensModel] = {}
        for m in available_models:
            mt = str(m.matrix_type or "LP_GRADE").upper()
            if mt not in models_by_matrix:
                models_by_matrix[mt] = m

        # Status inicial configurado (padrão EM_PRODUCAO para a bancada ágil)
        status_raw = payload.initial_status or "EM_PRODUCAO"
        if hasattr(OSStatus, status_raw):
            init_status_val = getattr(OSStatus, status_raw).value if hasattr(getattr(OSStatus, status_raw), 'value') else status_raw
        else:
            init_status_val = status_raw

        for item_in in payload.items:
            os_number = await generate_os_number(db)
            mt_key = (item_in.matrix_type or "LP_GRADE").upper()
            grade_label = GRADE_MAP.get(mt_key, "Visão Simples")

            # Localiza modelo de lente
            chosen_model: Optional[LensModel] = None
            if item_in.lens_model_id:
                chosen_model = next((m for m in available_models if m.id == item_in.lens_model_id), None)
            if not chosen_model:
                chosen_model = models_by_matrix.get(mt_key) or (available_models[0] if available_models else None)

            # Cálculo de preços
            base_lens_price = item_in.lens_price
            if base_lens_price is None or base_lens_price < 0:
                base_lens_price = float(chosen_model.sale_price) if chosen_model and chosen_model.sale_price else DEFAULT_GRADE_PRICES.get(mt_key, 67.0)

            serv_price = float(item_in.service_price or 0.0)
            treat_price = float(item_in.treatment_price or 0.0)

            if item_in.total_amount is not None and item_in.total_amount > 0:
                os_total = float(item_in.total_amount)
            else:
                os_total = base_lens_price + serv_price + treat_price

            total_batch_amount += os_total

            # 2. Criação da Ordem de Serviço
            new_os = ServiceOrder(
                id=uuid.uuid4(),
                os_number=os_number,
                optical_store_id=payload.optical_store_id,
                client_order_number=item_in.client_order_number.strip() if item_in.client_order_number else None,
                client_name=item_in.client_name or "Consumidor Final",
                tray_number=item_in.tray_number or item_in.client_order_number,
                status=init_status_val,
                os_type="PADRAO",
                priority="NORMAL",
                service_type=item_in.service_type or "Montagem Padrão",
                lens_model_id=chosen_model.id if chosen_model else None,
                
                # Dioptrias OD
                od_spherical=Decimal(str(round(item_in.od_spherical, 2))),
                od_cylindrical=Decimal(str(round(item_in.od_cylindrical, 2))),
                od_axis=int(item_in.od_axis or 0),
                od_addition=Decimal(str(round(item_in.od_addition, 2))) if item_in.od_addition else Decimal("0.0"),
                
                # Dioptrias OE
                oe_spherical=Decimal(str(round(item_in.oe_spherical, 2))),
                oe_cylindrical=Decimal(str(round(item_in.oe_cylindrical, 2))),
                oe_axis=int(item_in.oe_axis or 0),
                oe_addition=Decimal(str(round(item_in.oe_addition, 2))) if item_in.oe_addition else Decimal("0.0"),

                total_amount=Decimal(str(round(os_total, 2))),
                special_instructions=item_in.special_instructions or f"Entrada Lote Malote: {batch_ref}",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )

            db.add(new_os)
            await db.flush()

            # 3. Baixa Automática de Estoque (se solicitada)
            deducted = False
            inv_warning = None

            if payload.auto_deduct_inventory and chosen_model:
                rx_data_prepared = {
                    "OD": {
                        "esferico": item_in.od_spherical,
                        "cilindrico": item_in.od_cylindrical,
                        "adicao": item_in.od_addition,
                        "curva_base": item_in.od_base_curve
                    },
                    "OE": {
                        "esferico": item_in.oe_spherical,
                        "cilindrico": item_in.oe_cylindrical,
                        "adicao": item_in.oe_addition,
                        "curva_base": item_in.oe_base_curve
                    }
                }
                try:
                    await allocate_and_deduct_inventory(
                        db=db,
                        os_id=new_os.id,
                        lens_model_id=chosen_model.id,
                        rx_data=rx_data_prepared
                    )
                    deducted = True
                except Exception as alloc_err:
                    inv_warning = str(alloc_err)

            # 4. Gravação dos itens da OS para faturamento e Anexo 1
            # Item da Lente
            if chosen_model and base_lens_price > 0:
                unit_lens_p = round(base_lens_price / 2.0, 2)
                db.add(ServiceOrderItem(
                    id=uuid.uuid4(),
                    service_order_id=new_os.id,
                    entity_type="product",
                    entity_id=chosen_model.id,
                    quantity=2,
                    unit_price=Decimal(str(unit_lens_p)),
                    total_price=Decimal(str(base_lens_price)),
                    custom_price_applied=False,
                    created_at=datetime.now(timezone.utc)
                ))

            # Item de Serviço de Montagem
            if serv_price > 0:
                db.add(ServiceOrderItem(
                    id=uuid.uuid4(),
                    service_order_id=new_os.id,
                    entity_type="service",
                    entity_id=uuid.uuid4(), # ID virtual de serviço
                    quantity=1,
                    unit_price=Decimal(str(serv_price)),
                    total_price=Decimal(str(serv_price)),
                    custom_price_applied=False,
                    created_at=datetime.now(timezone.utc)
                ))

            # Item de Tratamento
            if treat_price > 0 and item_in.treatment and "Incolor" not in item_in.treatment:
                db.add(ServiceOrderItem(
                    id=uuid.uuid4(),
                    service_order_id=new_os.id,
                    entity_type="treatment",
                    entity_id=uuid.uuid4(),
                    quantity=1,
                    unit_price=Decimal(str(treat_price)),
                    total_price=Decimal(str(treat_price)),
                    custom_price_applied=False,
                    created_at=datetime.now(timezone.utc)
                ))

            # 5. Histórico do Workflow
            note = f"Entrada em Lote / Malote ({batch_ref})."
            if deducted:
                note += " Baixa de estoque de lentes (OD e OE) realizada com sucesso."
            elif inv_warning:
                note += f" Alerta de estoque: {inv_warning}"

            db.add(OSWorkflowHistory(
                id=uuid.uuid4(),
                service_order_id=new_os.id,
                previous_status=None,
                new_status=init_status_val,
                sector="Bancada de Produção",
                operator_id=current_user_id,
                operator_notes=note,
                changed_at=datetime.now(timezone.utc)
            ))

            results.append(OSBatchItemResult(
                client_order_number=new_os.client_order_number,
                client_name=new_os.client_name,
                os_id=new_os.id,
                os_number=new_os.os_number,
                status=new_os.status,
                total_amount=os_total,
                grade_name=grade_label,
                lens_model_name=(f"{chosen_model.brand} - {chosen_model.name}") if (chosen_model and chosen_model.name) else (chosen_model.brand if chosen_model else grade_label),
                inventory_deducted=deducted,
                inventory_warning=inv_warning
            ))

        await db.commit()

        return OSBatchCreateResponse(
            success=True,
            batch_reference=batch_ref,
            optical_store_id=payload.optical_store_id,
            optical_store_name=store.trade_name or store.corporate_name,
            total_orders_created=len(results),
            total_amount=round(total_batch_amount, 2),
            results=results
        )
