import uuid
from typing import Optional, List
from pydantic import BaseModel, Field

class OSBatchItemSchema(BaseModel):
    client_order_number: Optional[str] = Field(None, description="Número do pedido interno da ótica lojista")
    client_name: Optional[str] = Field("Consumidor Final", description="Nome do paciente / cliente")
    tray_number: Optional[str] = Field(None, description="Número da bandeja física")
    matrix_type: str = Field("LP_GRADE", description="Grade: LP_GRADE, GRADE_167, MF_ACB, MF_BLOCO, BLOCO_VS")
    lens_model_id: Optional[uuid.UUID] = Field(None, description="Modelo específico de lente (opcional)")
    eye_target: str = Field("OD_OE", description="Alvo da baixa de estoque e produção: OD_OE (Ambos/Par), OD (Direito) ou OE (Esquerdo)")
    has_prescription: bool = Field(True, description="Indica se o pedido possui receita médica informada")

    # Dioptrias Olho Direito (OD)
    od_spherical: float = Field(0.0, description="Grau esférico OD")
    od_cylindrical: float = Field(0.0, description="Grau cilíndrico OD")
    od_axis: int = Field(0, description="Eixo OD")
    od_addition: float = Field(0.0, description="Adição OD")
    od_base_curve: float = Field(0.0, description="Curva base OD")

    # Dioptrias Olho Esquerdo (OE)
    oe_spherical: float = Field(0.0, description="Grau esférico OE")
    oe_cylindrical: float = Field(0.0, description="Grau cilíndrico OE")
    oe_axis: int = Field(0, description="Eixo OE")
    oe_addition: float = Field(0.0, description="Adição OE")
    oe_base_curve: float = Field(0.0, description="Curva base OE")

    # Serviços e Tratamentos
    service_type: Optional[str] = Field("Montagem Padrão", description="Serviço técnico laboratorial")
    treatment: Optional[str] = Field("Incolor / Sem Tratamento", description="Tratamento da lente")
    
    # Preços discriminados
    lens_price: Optional[float] = Field(None, description="Preço da lente (par)")
    service_price: Optional[float] = Field(13.0, description="Preço do serviço de montagem")
    treatment_price: Optional[float] = Field(0.0, description="Preço do tratamento")
    total_amount: Optional[float] = Field(None, description="Valor total da OS")

    special_instructions: Optional[str] = Field(None, description="Observações técnicas de montagem")

class OSBatchCreateRequest(BaseModel):
    optical_store_id: uuid.UUID = Field(..., description="ID da ótica parceira")
    batch_reference: Optional[str] = Field(None, description="Identificador do malote / remessa")
    initial_status: Optional[str] = Field("EM_PRODUCAO", description="Status inicial na bancada ágil")
    auto_deduct_inventory: bool = Field(True, description="Realizar baixa automática de estoque nas lentes")
    items: List[OSBatchItemSchema] = Field(..., min_length=1, description="Lista de pedidos do malote")

class OSBatchItemResult(BaseModel):
    client_order_number: Optional[str] = None
    client_name: Optional[str] = None
    os_id: uuid.UUID
    os_number: str
    status: str
    total_amount: float
    grade_name: str
    lens_model_name: Optional[str] = None
    inventory_deducted: bool
    inventory_warning: Optional[str] = None

class OSBatchCreateResponse(BaseModel):
    success: bool
    batch_reference: str
    optical_store_id: uuid.UUID
    optical_store_name: Optional[str] = None
    total_orders_created: int
    total_amount: float
    results: List[OSBatchItemResult]
