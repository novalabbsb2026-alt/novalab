from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from backend.app.core.config import settings
import os as _os

# Ativa log de queries SQL apenas em modo de desenvolvimento
_is_dev = _os.getenv("APP_ENV", "production").lower() == "development"
_is_vercel = bool(_os.getenv("VERCEL"))

# Normaliza a URL caso seja informada como postgres:// ou postgresql:// sem +asyncpg
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

_engine_kwargs = {
    "echo": _is_dev,
    "future": True,
}

if _is_vercel or "pooler.supabase.com" in _db_url:
    _engine_kwargs["poolclass"] = NullPool
    if _db_url.startswith("postgresql+asyncpg://"):
        _engine_kwargs["connect_args"] = {"statement_cache_size": 0}

# Cria o engine assíncrono para o PostgreSQL / SQLite
engine = create_async_engine(
    _db_url,
    **_engine_kwargs
)


# Cria a fábrica de sessões assíncronas
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Classe base para os modelos declarativos
class Base(DeclarativeBase):
    pass

import contextvars
import uuid
from sqlalchemy import event
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import get_history
import json
from datetime import datetime, timezone

# ContextVar para guardar informações do usuário atual (logado)
current_user_ctx: contextvars.ContextVar[dict] = contextvars.ContextVar("current_user", default=None)
# ContextVar para guardar informações do laboratório/tenant atual
current_tenant_ctx: contextvars.ContextVar[dict] = contextvars.ContextVar("current_tenant", default=None)

def _strip_tz(val):
    if isinstance(val, datetime) and val.tzinfo is not None:
        return val.astimezone(timezone.utc).replace(tzinfo=None)
    return val

@event.listens_for(engine.sync_engine, "before_cursor_execute", retval=True)
def _normalize_query_datetime_params(conn, cursor, statement, parameters, context, executemany):
    """
    Garante que nenhum datetime com timezone (offset-aware) seja enviado para colunas
    TIMESTAMP WITHOUT TIME ZONE no PostgreSQL (asyncpg).
    """
    if parameters:
        if isinstance(parameters, dict):
            parameters = {k: _strip_tz(v) for k, v in parameters.items()}
        elif isinstance(parameters, tuple):
            parameters = tuple(_strip_tz(v) for v in parameters)
        elif isinstance(parameters, list):
            new_params = []
            for item in parameters:
                if isinstance(item, dict):
                    new_params.append({k: _strip_tz(v) for k, v in item.items()})
                elif isinstance(item, tuple):
                    new_params.append(tuple(_strip_tz(v) for v in item))
                else:
                    new_params.append(_strip_tz(item))
            parameters = new_params
    return statement, parameters

@event.listens_for(Session, "do_orm_execute")
def receive_do_orm_execute(execute_state):
    """
    Interceptor do SQLAlchemy para particionamento Multi-Tenant seguro.
    Aplica automaticamente o critério de filtro WHERE tenant_id = :active_tenant_id
    em todas as consultas ORM para entidades que possuem a coluna tenant_id.
    """
    from sqlalchemy.orm import with_loader_criteria
    tenant_info = current_tenant_ctx.get()
    if (
        execute_state.is_select
        and not execute_state.is_column_load
        and not execute_state.is_relationship_load
        and tenant_info
        and tenant_info.get("id")
    ):
        if execute_state.execution_options.get("include_all_tenants", False):
            return

        active_t_id = tenant_info.get("id")

        for mapper in Base.registry.mappers:
            cls = mapper.class_
            if hasattr(cls, "tenant_id") and cls.__name__ != "Tenant":
                execute_state.statement = execute_state.statement.options(
                    with_loader_criteria(
                        cls,
                        lambda c: c.tenant_id == active_t_id,
                        include_aliases=True,
                        track_closure_variables=False
                    )
                )

@event.listens_for(Session, "before_flush")
def receive_before_flush(session, flush_context, instances):
    from backend.app.models.audit import AuditLog

    # Normaliza campos datetime com timezone em objetos novos ou modificados para compatibilidade com asyncpg
    for obj in list(session.new) + list(session.dirty):
        if hasattr(obj, "__mapper__"):
            for mapper_attr in obj.__mapper__.column_attrs:
                val = getattr(obj, mapper_attr.key, None)
                if isinstance(val, datetime) and val.tzinfo is not None:
                    setattr(obj, mapper_attr.key, val.astimezone(timezone.utc).replace(tzinfo=None))
    
    user_info = current_user_ctx.get()
    tenant_info = current_tenant_ctx.get()
    current_t_id = None
    if tenant_info and tenant_info.get("id"):
        raw_t_id = tenant_info.get("id")
        if isinstance(raw_t_id, str):
            try:
                current_t_id = uuid.UUID(raw_t_id)
            except Exception:
                current_t_id = raw_t_id
        else:
            current_t_id = raw_t_id

    user_id = None
    user_name = "Sistema"
    if user_info:
        # Se for um UUID em string, converte ou salva
        user_id_raw = user_info.get("id")
        if user_id_raw:
            if isinstance(user_id_raw, str):
                try:
                    user_id = uuid.UUID(user_id_raw)
                except Exception:
                    user_id = user_id_raw
            else:
                user_id = user_id_raw
        user_name = user_info.get("name") or user_info.get("email") or "Usuario"

    audit_logs_to_add = []
    
    # Processa inserções
    for obj in session.new:
        if obj.__class__.__name__ == "AuditLog":
            continue
        
        # Auto-popula tenant_id caso a entidade pertença a um tenant e não tenha sido informado explicitamente
        if current_t_id and hasattr(obj, "tenant_id") and getattr(obj, "tenant_id", None) is None:
            setattr(obj, "tenant_id", current_t_id)

        attrs = {}
        for mapper_attr in obj.__mapper__.column_attrs:
            val = getattr(obj, mapper_attr.key)
            if val is not None:
                if isinstance(val, (int, float, str, bool)):
                    attrs[mapper_attr.key] = val
                else:
                    attrs[mapper_attr.key] = str(val)
        
        record_id = "NEW"
        primary_key_keys = [key.name for key in obj.__mapper__.primary_key]
        if primary_key_keys:
            pks = []
            for pk_key in primary_key_keys:
                val = getattr(obj, pk_key, None)
                if val is not None:
                    pks.append(str(val))
            if pks:
                record_id = ",".join(pks)
        
        audit = AuditLog(
            tenant_id=getattr(obj, "tenant_id", current_t_id),
            user_id=user_id,
            user_name=user_name,
            action="CREATE",
            table_name=obj.__tablename__,
            record_id=record_id,
            old_values=None,
            new_values=json.dumps(attrs),
            created_at=datetime.now(timezone.utc).replace(tzinfo=None)
        )
        audit_logs_to_add.append(audit)
        
    # Processa atualizações
    for obj in session.dirty:
        if obj.__class__.__name__ == "AuditLog":
            continue
            
        old_attrs = {}
        new_attrs = {}
        
        for mapper_attr in obj.__mapper__.column_attrs:
            attr_name = mapper_attr.key
            hist = get_history(obj, attr_name)
            if hist.has_changes():
                old_val = hist.deleted[0] if hist.deleted else None
                new_val = hist.added[0] if hist.added else getattr(obj, attr_name)
                
                def clean_val(v):
                    if v is None:
                        return None
                    if isinstance(v, (int, float, str, bool)):
                        return v
                    return str(v)
                    
                old_attrs[attr_name] = clean_val(old_val)
                new_attrs[attr_name] = clean_val(new_val)
                
        if old_attrs or new_attrs:
            primary_key_keys = [key.name for key in obj.__mapper__.primary_key]
            record_id = "UNKNOWN"
            if primary_key_keys:
                pks = []
                for pk_key in primary_key_keys:
                    val = getattr(obj, pk_key, None)
                    if val is not None:
                        pks.append(str(val))
                if pks:
                    record_id = ",".join(pks)
                    
            audit = AuditLog(
                user_id=user_id,
                user_name=user_name,
                action="UPDATE",
                table_name=obj.__tablename__,
                record_id=record_id,
                old_values=json.dumps(old_attrs) if old_attrs else None,
                new_values=json.dumps(new_attrs) if new_attrs else None,
                created_at=datetime.now(timezone.utc).replace(tzinfo=None)
            )
            audit_logs_to_add.append(audit)

    # Processa exclusões
    for obj in session.deleted:
        if obj.__class__.__name__ == "AuditLog":
            continue
            
        attrs = {}
        for mapper_attr in obj.__mapper__.column_attrs:
            val = getattr(obj, mapper_attr.key)
            if val is not None:
                if isinstance(val, (int, float, str, bool)):
                    attrs[mapper_attr.key] = val
                else:
                    attrs[mapper_attr.key] = str(val)
                    
        primary_key_keys = [key.name for key in obj.__mapper__.primary_key]
        record_id = "UNKNOWN"
        if primary_key_keys:
            pks = []
            for pk_key in primary_key_keys:
                val = getattr(obj, pk_key, None)
                if val is not None:
                    pks.append(str(val))
            if pks:
                record_id = ",".join(pks)
                
        audit = AuditLog(
            user_id=user_id,
            user_name=user_name,
            action="DELETE",
            table_name=obj.__tablename__,
            record_id=record_id,
            old_values=json.dumps(attrs),
            new_values=None,
            created_at=datetime.now(timezone.utc).replace(tzinfo=None)
        )
        audit_logs_to_add.append(audit)
        
    for audit in audit_logs_to_add:
        session.add(audit)


from sqlalchemy import TypeDecorator, String
import json

class SafeVector(TypeDecorator):
    """
    Tipo de coluna que emula um Vector do pgvector no PostgreSQL,
    mas cai de forma transparente para uma representação JSON no SQLite.
    """
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            try:
                from pgvector.sqlalchemy import Vector
                return dialect.type_descriptor(Vector(512))
            except ImportError:
                pass
        return dialect.type_descriptor(String(4000))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == 'postgresql':
            return value
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name == 'postgresql':
            return value
        return json.loads(value)


# Dependência do FastAPI para obter a sessão do banco
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
