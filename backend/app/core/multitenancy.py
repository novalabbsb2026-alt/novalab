import uuid
import logging
from typing import Optional
from sqlalchemy import text
from backend.app.core.security import get_password_hash

logger = logging.getLogger("multitenancy")

# ID fixo e imutável do Laboratório Piloto Original (Nova LAB Matriz)
DEFAULT_TENANT_ID = uuid.UUID("23156c49-2618-4a5f-882f-137927eaec53")
DEFAULT_TENANT_NAME = "Nova LAB Matriz"
DEFAULT_TENANT_SLUG = "matriz"
DEFAULT_TENANT_CNPJ = "58.032.958/0001-44"

# Superusuário da plataforma
SUPERADMIN_EMAIL = "rafa.busy@gmail.com"
SUPERADMIN_PASSWORD_HASH = get_password_hash("Dio@sup.2203")

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

_migrations_done = False

async def run_multitenant_migrations(conn):
    """
    Executa migrações DDL seguras e idempotentes (PostgreSQL e SQLite)
    para habilitar a arquitetura Multi-Tenant com garantia de Zero Data Loss.
    """
    global _migrations_done
    logger.info("[MULTI-TENANT] Iniciando migrações de esquema e backfill de dados...")

    # Detecta se é PostgreSQL
    is_postgres = False
    try:
        dialect_name = conn.dialect.name
        is_postgres = (dialect_name == "postgresql")
    except Exception:
        pass

    # 1. Criação da tabela 'tenants' se não existir
    if is_postgres:
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
    else:
        create_tenants_sql = """
        CREATE TABLE IF NOT EXISTS tenants (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            slug VARCHAR(60) UNIQUE NOT NULL,
            cnpj VARCHAR(25),
            telephone VARCHAR(50),
            address VARCHAR(255),
            cep VARCHAR(20),
            ie VARCHAR(30),
            plan_tier VARCHAR(30) DEFAULT 'pro' NOT NULL,
            is_active BOOLEAN DEFAULT 1 NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        """

    try:
        await conn.execute(text(create_tenants_sql))
    except Exception as e:
        logger.warning(f"[MULTI-TENANT] Erro criando tabela tenants: {e}")

    # 2. Garante o registro do Tenant Piloto Default (Nova LAB Matriz)
    if is_postgres:
        seed_tenant_sql = f"""
        INSERT INTO tenants (id, name, slug, cnpj, plan_tier, is_active)
        VALUES ('{DEFAULT_TENANT_ID}', '{DEFAULT_TENANT_NAME}', '{DEFAULT_TENANT_SLUG}', '{DEFAULT_TENANT_CNPJ}', 'enterprise', TRUE)
        ON CONFLICT (id) DO NOTHING;
        """
    else:
        seed_tenant_sql = f"""
        INSERT OR IGNORE INTO tenants (id, name, slug, cnpj, plan_tier, is_active)
        VALUES ('{DEFAULT_TENANT_ID}', '{DEFAULT_TENANT_NAME}', '{DEFAULT_TENANT_SLUG}', '{DEFAULT_TENANT_CNPJ}', 'enterprise', 1);
        """
    try:
        await conn.execute(text(seed_tenant_sql))
    except Exception as e:
        logger.warning(f"[MULTI-TENANT] Erro inserindo tenant default: {e}")

    # 2.1 Garante que os Perfis de Acesso padrão (Roles) existam
    admin_role_id = uuid.uuid4()
    operador_role_id = uuid.uuid4()
    if is_postgres:
        seed_roles_sql = f"""
        INSERT INTO roles (id, name, description)
        VALUES 
            ('{admin_role_id}', 'Administrador', 'Perfil com acesso irrestrito ao sistema.'),
            ('{operador_role_id}', 'Operador', 'Perfil com acesso a operação e movimentação de estoque.')
        ON CONFLICT (name) DO NOTHING;
        """
    else:
        seed_roles_sql = f"""
        INSERT OR IGNORE INTO roles (id, name, description)
        VALUES 
            ('{admin_role_id}', 'Administrador', 'Perfil com acesso irrestrito ao sistema.'),
            ('{operador_role_id}', 'Operador', 'Perfil com acesso a operação e movimentação de estoque.');
        """
    try:
        await conn.execute(text(seed_roles_sql))
    except Exception as e:
        logger.warning(f"[MULTI-TENANT] Erro inserindo roles padrão: {e}")

    # 2.2 Cria tabelas para Broadcast e Tickets de Suporte
    if is_postgres:
        extra_sql = """
        CREATE TABLE IF NOT EXISTS broadcast_messages (
            id UUID PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(30) DEFAULT 'info' NOT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL,
            target_tenant_id UUID,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS support_tickets (
            id UUID PRIMARY KEY,
            tenant_id UUID,
            tenant_name VARCHAR(150),
            subject VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            priority VARCHAR(30) DEFAULT 'MEDIA' NOT NULL,
            status VARCHAR(30) DEFAULT 'ABERTO' NOT NULL,
            assigned_to VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        """
    else:
        extra_sql = """
        CREATE TABLE IF NOT EXISTS broadcast_messages (
            id VARCHAR(36) PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(30) DEFAULT 'info' NOT NULL,
            is_active BOOLEAN DEFAULT 1 NOT NULL,
            target_tenant_id VARCHAR(36),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS support_tickets (
            id VARCHAR(36) PRIMARY KEY,
            tenant_id VARCHAR(36),
            tenant_name VARCHAR(150),
            subject VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            priority VARCHAR(30) DEFAULT 'MEDIA' NOT NULL,
            status VARCHAR(30) DEFAULT 'ABERTO' NOT NULL,
            assigned_to VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        """
    try:
        for stmt in extra_sql.strip().split(';'):
            if stmt.strip():
                await conn.execute(text(stmt))
    except Exception as e:
        logger.warning(f"[MULTI-TENANT] Erro criando tabelas broadcast/tickets: {e}")

    # 3. Adiciona colunas na tabela users
    if is_postgres:
        for u_col in [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;"
        ]:
            try:
                await conn.execute(text(u_col))
            except Exception as e:
                logger.debug(f"[MULTI-TENANT] users col: {e}")
    else:
        for u_col in [
            "ALTER TABLE users ADD COLUMN is_superadmin BOOLEAN DEFAULT 0;",
            "ALTER TABLE users ADD COLUMN tenant_id VARCHAR(36);"
        ]:
            try:
                await conn.execute(text(u_col))
            except Exception:
                pass

    # 4. Adiciona a coluna tenant_id em cada tabela operacional
    for tbl in TENANT_TABLES:
        if tbl == "users":
            continue
        if is_postgres:
            try:
                await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;"))
            except Exception:
                try:
                    await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS tenant_id UUID;"))
                except Exception:
                    pass
        else:
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

    # 6. Configura o usuário 'admin' para ser SOMENTE administrador do laboratório Nova LAB (não SuperAdmin)
    try:
        if is_postgres:
            await conn.execute(text(f"""
            UPDATE users 
            SET is_superadmin = FALSE, tenant_id = '{DEFAULT_TENANT_ID}'
            WHERE lower(email) = 'admin';
            """))
        else:
            await conn.execute(text(f"""
            UPDATE users 
            SET is_superadmin = 0, tenant_id = '{DEFAULT_TENANT_ID}'
            WHERE lower(email) = 'admin';
            """))
    except Exception as e:
        logger.warning(f"[MULTI-TENANT] Erro configurando admin: {e}")

    # 7. Cria ou atualiza o SuperUsuário rafa.busy@gmail.com
    try:
        check_res = await conn.execute(text(f"SELECT id FROM users WHERE lower(email) = '{SUPERADMIN_EMAIL.lower()}';"))
        existing_super = check_res.scalar()

        if existing_super:
            # Atualiza senha e privilégios
            if is_postgres:
                await conn.execute(text(f"""
                UPDATE users
                SET hashed_password = '{SUPERADMIN_PASSWORD_HASH}',
                    is_superadmin = TRUE,
                    is_active = TRUE,
                    tenant_id = '{DEFAULT_TENANT_ID}'
                WHERE id = '{existing_super}';
                """))
            else:
                await conn.execute(text(f"""
                UPDATE users
                SET hashed_password = '{SUPERADMIN_PASSWORD_HASH}',
                    is_superadmin = 1,
                    is_active = 1,
                    tenant_id = '{DEFAULT_TENANT_ID}'
                WHERE id = '{existing_super}';
                """))
            logger.info(f"[MULTI-TENANT] SuperAdmin {SUPERADMIN_EMAIL} atualizado com sucesso!")
        else:
            # Cria novo usuário SuperAdmin
            new_super_id = uuid.uuid4()
            # Tenta pegar role_id do Administrador se existir
            r_res = await conn.execute(text("SELECT id FROM roles WHERE name = 'Administrador' LIMIT 1;"))
            role_id = r_res.scalar()
            role_val = f"'{role_id}'" if role_id else "NULL"

            if is_postgres:
                insert_super_sql = f"""
                INSERT INTO users (id, name, email, hashed_password, is_active, must_change_password, is_superadmin, tenant_id, role_id)
                VALUES ('{new_super_id}', 'SuperAdmin Raphael', '{SUPERADMIN_EMAIL.lower()}', '{SUPERADMIN_PASSWORD_HASH}', TRUE, FALSE, TRUE, '{DEFAULT_TENANT_ID}', {role_val});
                """
            else:
                insert_super_sql = f"""
                INSERT INTO users (id, name, email, hashed_password, is_active, must_change_password, is_superadmin, tenant_id, role_id)
                VALUES ('{new_super_id}', 'SuperAdmin Raphael', '{SUPERADMIN_EMAIL.lower()}', '{SUPERADMIN_PASSWORD_HASH}', 1, 0, 1, '{DEFAULT_TENANT_ID}', {role_val});
                """
            await conn.execute(text(insert_super_sql))
            logger.info(f"[MULTI-TENANT] SuperAdmin {SUPERADMIN_EMAIL} criado com sucesso!")
    except Exception as e:
        logger.warning(f"[MULTI-TENANT] Erro criando/atualizando SuperAdmin {SUPERADMIN_EMAIL}: {e}")

    _migrations_done = True
    logger.info("[MULTI-TENANT] Migração e Backfill multi-tenant concluídos com sucesso!")
