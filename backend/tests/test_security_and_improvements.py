import os
import uuid
import httpx
import pytest
from fastapi import HTTPException

# Garante modo produção para validar ocultação de traceback e CORS restrito
os.environ.setdefault("APP_ENV", "production")

from backend.app.main import app
from backend.app.core.database import current_user_ctx, current_tenant_ctx
from backend.app.api.endpoints.auth import (
    _check_login_rate_limit,
    _record_login_failure,
    _clear_login_failures,
    _RATE_LIMIT_MAX_ATTEMPTS,
)
from backend.app.schemas.os_batch import OSBatchItemSchema


@pytest.mark.asyncio
async def test_cors_blocks_untrusted_origin_and_allows_trusted():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Origem confiável (produção Vercel) deve ser aceita
        res_ok = await client.options(
            "/api/v1/db-health",
            headers={
                "Origin": "https://novalab-beige.vercel.app",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert res_ok.headers.get("access-control-allow-origin") == "https://novalab-beige.vercel.app"

        # Origem de preview da Vercel também deve ser aceita pela regex segura
        res_preview = await client.options(
            "/api/v1/db-health",
            headers={
                "Origin": "https://novalab-preview-123.vercel.app",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert res_preview.headers.get("access-control-allow-origin") == "https://novalab-preview-123.vercel.app"

        # Origem externa arbitrária NÃO deve receber access-control-allow-origin
        res_evil = await client.options(
            "/api/v1/db-health",
            headers={
                "Origin": "https://evil-attacker.example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert res_evil.headers.get("access-control-allow-origin") != "https://evil-attacker.example.com"


@pytest.mark.asyncio
async def test_db_health_hides_internal_details_in_production():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/v1/db-health")
        assert res.status_code == 200
        body = res.json()
        assert "status" in body
        assert "traceback" not in body
        assert "host" not in body


def test_login_rate_limiter_enforces_limit_and_resets():
    key = f"127.0.0.1:teste-{uuid.uuid4().hex}@novalab.com"
    _clear_login_failures(key)

    for _ in range(_RATE_LIMIT_MAX_ATTEMPTS):
        _check_login_rate_limit(key)
        _record_login_failure(key)

    with pytest.raises(HTTPException) as exc_info:
        _check_login_rate_limit(key)
    assert exc_info.value.status_code == 429

    _clear_login_failures(key)
    _check_login_rate_limit(key)


@pytest.mark.asyncio
async def test_context_vars_reset_after_request():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/v1/db-health")
        assert res.status_code == 200
        assert current_user_ctx.get() is None
        assert current_tenant_ctx.get() is None


def test_os_batch_item_schema_supports_new_fields():
    item = OSBatchItemSchema(
        client_order_number="1042",
        matrix_type="MF_BLOCO",
        eye_target="OD",
        has_prescription=False,
        od_base_curve=4.0,
        od_addition=2.25,
        total_amount=95.5,
    )
    assert item.eye_target == "OD"
    assert item.has_prescription is False
    assert item.od_base_curve == 4.0
    assert item.od_addition == 2.25
    assert item.total_amount == 95.5


@pytest.mark.asyncio
async def test_batch_malote_creates_orders_end_to_end():
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from backend.app.core.database import Base
    from backend.app.models.optical_store import OpticalStore
    from backend.app.models.lens import LensModel
    from backend.app.schemas.os_batch import OSBatchCreateRequest
    from backend.app.services.os_batch_service import OSBatchService

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as db:
        store = OpticalStore(
            id=uuid.uuid4(),
            corporate_name="ALISSON OTICA LTDA",
            trade_name="ALISSON",
            cnpj="00.000.000/0000-00",
        )
        model = LensModel(
            id=uuid.uuid4(),
            brand="BEST",
            name="BEST AR 1.56",
            material="Resina",
            refractive_index=1.56,
            treatment="AR",
            matrix_type="MF_BLOCO",
            sale_price=49.0,
        )
        db.add_all([store, model])
        await db.commit()

        payload = OSBatchCreateRequest(
            optical_store_id=store.id,
            batch_reference="MALOTE-20261126",
            initial_status="EM_PRODUCAO",
            auto_deduct_inventory=True,
            items=[
                OSBatchItemSchema(
                    client_order_number="1011",
                    matrix_type="MF_BLOCO",
                    lens_model_id=model.id,
                    eye_target="OD_OE",
                    has_prescription=True,
                    od_base_curve=2.0,
                    od_addition=1.0,
                    oe_base_curve=2.0,
                    oe_addition=1.0,
                    service_type="Montagem Padrão",
                    total_amount=111.0,
                ),
                OSBatchItemSchema(
                    client_order_number="1012",
                    matrix_type="MF_BLOCO",
                    lens_model_id=model.id,
                    eye_target="OD",
                    has_prescription=False,
                    od_base_curve=4.0,
                    od_addition=2.0,
                    service_type="Sem Montagem (Apenas Lentes)",
                    total_amount=49.0,
                ),
            ],
        )

        res = await OSBatchService.create_batch_orders(db=db, payload=payload)
        assert res.success is True
        assert res.total_orders_created == 2
        assert res.total_amount == 160.0
        assert res.results[0].os_number != res.results[1].os_number
        assert res.results[0].status == "Produção"

    await engine.dispose()
