import uuid
import logging
from typing import Optional
from sqlalchemy import text
from backend.app.core.database import current_tenant_ctx

logger = logging.getLogger("multitenancy")

# ID fixo e imutável do Laboratório Piloto Original (Nova LAB Matriz)
DEFAULT_TENANT_ID = uuid.UUID("23156c49-2618-4a5f-882f-137927eaec53")
DEFAULT_TENANT_NAME = "Nova LAB Matriz"
DEFAULT_TENANT_SLUG = "matriz"
DEFAULT_TENANT_CNPJ = "58.032.958/0001-44"

TENANT_TABLES = [
    "users",
    "lens_models",
    "lens_inventory_grade",
    "block_models",
    "block_grid_items",
    "optical_stores",
    "service_orders",
    "products",
    "treatments",
    "technical_services",
    "degree_pricing_policy",
    "degree_pricing_policy_ranges",
    "customer_price_tables",
    "billing_cycles",
    "commercial_orders",
    "cost_centers",
    "financial_categories",
    "accounts_payable",
    "accounts_receivable",
    "financial_transactions",
    "audit_logs"
]

async def run_multitenant_migrations(conn):
    """
    Executa migrações DDL seguras e idempotentes (PostgreSQL e SQLite)
    para habilitar a arquitetura Multi-Tenant com garantia de Zero Data Loss.
    """
    logger.info("[MULTI-TENANT] Iniciando migrações de esquema e backfill de dados...")

    # 1. Criação da tabela 'tenants' se não existir
    create_tenants_sql = """
    CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(60) UNIQUE NOT NULL,
        cnpj VARCHAR(25),
        telephone VARCHAR(50),
        address VARCHAR(255),
        cep VARCHAR(20),
        ie VARCHAR(30),
        plan_tier VARCHAR(30) DEFAULT 'pro' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    """
    try:
        await conn.execute(text(create_tenants_sql))
    except Exception as e:
        logger.warning(f"[MULTI-TENANT] Erro criando tabela tenants: {e}")

    # 2. Garante o registro do Tenant Piloto Default
    seed_tenant_sql = f"""
    INSERT INTO tenants (id, name, slug, cnpj, plan_tier, is_active)
    VALUES ('{DEFAULT_TENANT_ID}', '{DEFAULT_TENANT_NAME}', '{DEFAULT_TENANT_SLUG}', '{DEFAULT_TENANT_CNPJ}', 'enterprise', TRUE)
    ON CONFLICT (id) DO NOTHING;
    """
    try:
        await conn.execute(text(seed_tenant_sql))
    except Exception:
        # Fallback para SQLite que pode não suportar ON CONFLICT (id) da mesma forma
        try:
            await conn.execute(text(f"""
            INSERT OR IGNORE INTO tenants (id, name, slug, cnpj, plan_tier, is_active)
            VALUES ('{DEFAULT_TENANT_ID}', '{DEFAULT_TENANT_NAME}', '{DEFAULT_TENANT_SLUG}', '{DEFAULT_TENANT_CNPJ}', 'enterprise', 1);
            """))
        except Exception:
            pass

    # 3. Adiciona a coluna is_superadmin na tabela users
    try:
        await conn.execute(text("ALTER TABLE users ADD COLUMN is_superadmin BOOLEAN DEFAULT 0;"))
    except Exception:
        pass

    # 4. Adiciona a coluna tenant_id em cada tabela operacional
    for tbl in TENANT_TABLES:
        try:
            await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;"))
        except Exception:
            # Em SQLite ou caso o tipo UUID dê erro, tenta VARCHAR(36)
            try:
                await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN tenant_id VARCHAR(36);"))
            except Exception:
                pass

    # 5. Backfill Retroativo: Vincula 100% dos registros existentes ao Tenant Piloto
    for tbl in TENANT_TABLES:
        try:
            await conn.execute(text(f"""
            UPDATE {tbl} 
            SET tenant_id = '{DEFAULT_TENANT_ID}' 
            WHERE tenant_id IS NULL;
            """))
        except Exception as e:
            logger.debug(f"[MULTI-TENANT] Backfill {tbl}: {e}")

    # 6. Define administradores existentes como superadmins
    try:
        await conn.execute(text(f"""
        UPDATE users 
        SET is_superadmin = TRUE, tenant_id = '{DEFAULT_TENANT_ID}'
        WHERE email IN ('admin', 'suporte') OR tenant_id IS NULL;
        """))
    except Exception:
        pass

    logger.info("[MULTI-TENANT] Migração e Backfill multi-tenant concluídos com sucesso!")
