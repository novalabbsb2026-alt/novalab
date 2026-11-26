import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token
from backend.app.models.user import User
from backend.app.schemas.user import LoginPayload, Token, UserResponse
from backend.app.api.deps import get_current_user

router = APIRouter()

# Rate limiter leve em memória (janela deslizante de 5 minutos, máx. 15 tentativas falhas por IP+e-mail)
_LOGIN_ATTEMPTS: dict[str, list[float]] = defaultdict(list)
_RATE_LIMIT_MAX_ATTEMPTS = 15
_RATE_LIMIT_WINDOW_SEC = 300


def _check_login_rate_limit(key: str) -> None:
    now = time.monotonic()
    recent = [ts for ts in _LOGIN_ATTEMPTS[key] if (now - ts) < _RATE_LIMIT_WINDOW_SEC]
    _LOGIN_ATTEMPTS[key] = recent
    if len(recent) >= _RATE_LIMIT_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente."
        )


def _record_login_failure(key: str) -> None:
    _LOGIN_ATTEMPTS[key].append(time.monotonic())


def _clear_login_failures(key: str) -> None:
    _LOGIN_ATTEMPTS.pop(key, None)


@router.post("/login", response_model=Token)
async def login(
    payload: LoginPayload,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Realiza o login de funcionários da fábrica (Operadores e Administradores)
    utilizando e-mail e senha. Retorna o token JWT e as informações do perfil.
    """
    email_clean = payload.email.strip().lower() if payload.email else ""
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{client_ip}:{email_clean}"
    _check_login_rate_limit(rate_key)

    # Garante que as migrações Multi-Tenant rodaram antes da consulta de autenticação
    from backend.app.core.multitenancy import run_multitenant_migrations, _migrations_done
    if not _migrations_done:
        try:
            await run_multitenant_migrations(db)
            await db.commit()
        except Exception:
            pass

    # Busca o usuário pelo e-mail (insensível a maiúsculas e sem espaços extras)
    query = (
        select(User)
        .where(func.lower(User.email) == email_clean)
        .options(selectinload(User.role), selectinload(User.tenant))
    )
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        _record_login_failure(rate_key)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail ou senha incorretos."
        )
        
    # Verifica a senha
    if not verify_password(payload.password.strip(), user.hashed_password):
        _record_login_failure(rate_key)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail ou senha incorretos."
        )

    _clear_login_failures(rate_key)

        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuário está inativo no sistema."
        )
        
    # Cria o token de acesso
    access_token = create_access_token(subject=user.id)
    
    # Obtém o nome da role
    role_name = user.role.name if user.role else "Operador"
    
    tenant_id = user.tenant_id
    tenant_name = user.tenant.name if user.tenant else "Nova LAB Matriz"
    tenant_slug = user.tenant.slug if user.tenant else "matriz"

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=role_name,
        name=user.name,
        must_change_password=user.must_change_password,
        tenant_id=tenant_id,
        tenant_name=tenant_name,
        tenant_slug=tenant_slug,
        is_superadmin=bool(user.is_superadmin)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Retorna as informações do usuário autenticado no momento.
    """
    return current_user

from backend.app.schemas.user import ChangePasswordPayload

@router.post("/change-password", response_model=UserResponse)
async def change_password(
    payload: ChangePasswordPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Permite ao usuário logado alterar sua própria senha.
    Limpa a flag 'must_change_password' (definindo como False).
    """
    from backend.app.core.security import get_password_hash
    
    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.must_change_password = False
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    # Recarrega a role e permissões
    from backend.app.models.user import Role
    query = (
        select(User)
        .where(User.id == current_user.id)
        .options(selectinload(User.role).selectinload(Role.permissions))
    )
    result = await db.execute(query)
    return result.scalars().first()
