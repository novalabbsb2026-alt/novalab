import uuid
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db, current_user_ctx, current_tenant_ctx
from backend.app.core.security import decode_access_token
from backend.app.core.multitenancy import DEFAULT_TENANT_ID
from backend.app.models.user import User
from backend.app.models.tenant import Tenant

# Esquema de autenticação Bearer Token
security_scheme = HTTPBearer()

async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security_scheme),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependência que valida o token JWT e retorna o usuário autenticado.
    Configura tanto current_user_ctx (para logs de auditoria) quanto
    current_tenant_ctx (para particionamento Multi-Tenant seguro e automático).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token.credentials)
    if payload is None:
        raise credentials_exception
        
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
        
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception
        
    # Busca o usuário com a role e o tenant carregados
    query = (
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.role), selectinload(User.tenant))
    )
    result = await db.execute(query)
    user = result.scalars().first()
    
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este usuário está inativo no sistema."
        )
        
    # Auditoria de usuário
    current_user_ctx.set({
        "id": user.id,
        "name": user.name,
        "email": user.email
    })

    # Resolução do Tenant Ativo
    active_tenant_id = user.tenant_id or DEFAULT_TENANT_ID
    tenant_name = user.tenant.name if user.tenant else "Nova LAB Matriz"
    tenant_slug = user.tenant.slug if user.tenant else "matriz"

    # SuperAdmin pode alternar o tenant ativo via cabeçalho X-Tenant-ID
    if user.is_superadmin and x_tenant_id:
        try:
            target_tenant_uuid = uuid.UUID(x_tenant_id)
            tenant_stmt = select(Tenant).where(Tenant.id == target_tenant_uuid, Tenant.is_active == True)
            tenant_res = await db.execute(tenant_stmt)
            target_tenant = tenant_res.scalars().first()
            if target_tenant:
                active_tenant_id = target_tenant.id
                tenant_name = target_tenant.name
                tenant_slug = target_tenant.slug
        except Exception:
            pass

    # Injeta contexto do Tenant ativo para os hooks do SQLAlchemy e endpoints
    current_tenant_ctx.set({
        "id": active_tenant_id,
        "name": tenant_name,
        "slug": tenant_slug,
        "is_superadmin": user.is_superadmin
    })

    # Atribui dinamicamente ao objeto do usuário para fácil acesso
    user.active_tenant_id = active_tenant_id
    user.tenant_name = tenant_name
    user.tenant_slug = tenant_slug
    
    return user

async def get_current_active_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verifica se o usuário atual é Administrador do laboratório ou SuperAdmin.
    """
    if current_user.is_superadmin:
        return current_user

    if not current_user.role or current_user.role.name != "Administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operação permitida apenas para Administradores."
        )
    return current_user

async def get_current_active_operator(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verifica se o usuário atual é Operador, Administrador ou SuperAdmin.
    """
    if current_user.is_superadmin:
        return current_user

    if not current_user.role or current_user.role.name not in ["Operador", "Administrador"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Perfil de Operador ou Administrador exigido."
        )
    return current_user

async def get_current_superadmin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verifica se o usuário atual é SuperAdmin (Administrador da Plataforma Multi-Tenant).
    """
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito ao SuperAdmin da plataforma."
        )
    return current_user
