import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError

from backend.app.core.database import get_db, current_tenant_ctx
from backend.app.core.security import get_password_hash
from backend.app.core.multitenancy import DEFAULT_TENANT_ID
from backend.app.models.tenant import Tenant
from backend.app.models.user import User, Role
from backend.app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse
from backend.app.schemas.user import UserCreate, UserUpdate, UserResponse, RoleResponse
from backend.app.api.deps import (
    get_current_user,
    get_current_active_admin,
    get_current_superadmin
)

router = APIRouter()

# --- 1. Perfis de Acesso (Roles) do Sistema ---
@router.get("/roles", response_model=List[RoleResponse])
async def list_available_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna a lista de perfis de acesso (Roles) cadastrados na plataforma.
    """
    stmt = select(Role).order_by(Role.name.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

# --- 2. Listagem de Laboratórios ---
@router.get("/", response_model=List[TenantResponse])
async def list_tenants(
    db: AsyncSession = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """
    Lista todos os laboratórios (tenants) cadastrados na plataforma.
    Acesso exclusivo para SuperAdmins.
    """
    stmt = select(Tenant).order_by(Tenant.name.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

# --- 3. Criação de Laboratório ---
@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    payload: TenantCreate,
    db: AsyncSession = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """
    Cria um novo laboratório (tenant) e opcionalmente provisiona o usuário administrador inicial.
    Acesso exclusivo para SuperAdmins.
    """
    slug_clean = payload.slug.strip().lower()
    
    # Verifica se o slug já está em uso
    existing = await db.execute(select(Tenant).where(Tenant.slug == slug_clean))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"O identificador único (slug) '{slug_clean}' já está em uso por outro laboratório."
        )

    # Cria a entidade do Tenant
    new_tenant = Tenant(
        name=payload.name.strip(),
        slug=slug_clean,
        cnpj=payload.cnpj.strip() if payload.cnpj else None,
        telephone=payload.telephone.strip() if payload.telephone else None,
        address=payload.address.strip() if payload.address else None,
        cep=payload.cep.strip() if payload.cep else None,
        ie=payload.ie.strip() if payload.ie else None,
        plan_tier=payload.plan_tier or "enterprise",
        is_active=payload.is_active if payload.is_active is not None else True
    )
    db.add(new_tenant)
    await db.flush()

    # Se fornecidas credenciais do administrador inicial
    if payload.admin_email and payload.admin_password:
        admin_email_clean = payload.admin_email.strip().lower()
        existing_user = await db.execute(
            select(User)
            .where(func.lower(User.email) == admin_email_clean)
            .execution_options(include_all_tenants=True)
        )
        if not existing_user.scalars().first():
            # Busca a role de Administrador
            role_res = await db.execute(select(Role).where(Role.name == "Administrador"))
            admin_role = role_res.scalars().first()

            initial_user = User(
                name=payload.admin_name.strip() if payload.admin_name else f"Admin {payload.name}",
                email=admin_email_clean,
                hashed_password=get_password_hash(payload.admin_password.strip()),
                is_active=True,
                role_id=admin_role.id if admin_role else None,
                tenant_id=new_tenant.id,
                is_superadmin=False,
                must_change_password=True
            )
            db.add(initial_user)

    await db.commit()
    await db.refresh(new_tenant)
    return new_tenant

# --- 4. Laboratório Atual (Sessão Ativa) ---
@router.get("/current", response_model=TenantResponse)
async def get_current_tenant_details(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna os dados cadastrais do laboratório ativo na sessão atual.
    """
    active_tenant_id = getattr(current_user, "active_tenant_id", current_user.tenant_id or DEFAULT_TENANT_ID)
    stmt = select(Tenant).where(Tenant.id == active_tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratório não encontrado."
        )
    return tenant

@router.put("/current", response_model=TenantResponse)
async def update_current_tenant_details(
    payload: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Atualiza os dados do laboratório ativo na sessão atual.
    Permitido para Administradores do laboratório e SuperAdmins.
    """
    active_tenant_id = getattr(current_user, "active_tenant_id", current_user.tenant_id or DEFAULT_TENANT_ID)
    stmt = select(Tenant).where(Tenant.id == active_tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratório não encontrado."
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "slug" and value:
            # Apenas superadmin pode alterar o slug
            if not current_user.is_superadmin:
                continue
            value = value.strip().lower()
        if value is not None:
            setattr(tenant, field, value)

    await db.commit()
    await db.refresh(tenant)
    return tenant

# --- 5. Detalhes de um Laboratório Específico ---
@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant_by_id(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """
    Obtém informações de um tenant específico. Exclusivo para SuperAdmins.
    """
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratório não encontrado."
        )
    return tenant

@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant_by_id(
    tenant_id: uuid.UUID,
    payload: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """
    Atualiza os dados cadastrais de qualquer laboratório cadastrado. Exclusivo para SuperAdmins.
    """
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laboratório não encontrado."
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "slug" and value:
            slug_clean = value.strip().lower()
            slug_check = await db.execute(select(Tenant).where(Tenant.slug == slug_clean, Tenant.id != tenant_id))
            if slug_check.scalars().first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"O identificador único '{slug_clean}' já está em uso por outro laboratório."
                )
            setattr(tenant, "slug", slug_clean)
        elif value is not None:
            setattr(tenant, field, value)

    await db.commit()
    await db.refresh(tenant)
    return tenant

# --- 6. Gestão de Usuários do Laboratório (SuperAdmin) ---
@router.get("/{tenant_id}/users", response_model=List[UserResponse])
async def list_tenant_users(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """
    Lista todos os usuários vinculados a um laboratório específico.
    Exclusivo para SuperAdmins.
    """
    t_res = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    if not t_res.scalars().first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Laboratório não encontrado.")

    stmt = (
        select(User)
        .where(User.tenant_id == tenant_id)
        .options(selectinload(User.role))
        .order_by(User.name.asc())
        .execution_options(include_all_tenants=True)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/{tenant_id}/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant_user(
    tenant_id: uuid.UUID,
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """
    Cria um novo usuário para o laboratório especificado respeitando o perfil de acesso selecionado.
    Exclusivo para SuperAdmins.
    """
    t_res = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    if not t_res.scalars().first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Laboratório não encontrado.")

    email_clean = payload.email.strip().lower()
    user_check = await db.execute(
        select(User)
        .where(func.lower(User.email) == email_clean)
        .execution_options(include_all_tenants=True)
    )
    if user_check.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe um usuário cadastrado com o login/e-mail '{email_clean}'."
        )

    # Valida o perfil de acesso
    if payload.role_id:
        role_res = await db.execute(select(Role).where(Role.id == payload.role_id))
        if not role_res.scalars().first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Perfil de acesso selecionado é inválido.")

    new_user = User(
        name=payload.name.strip(),
        email=email_clean,
        hashed_password=get_password_hash(payload.password.strip()),
        is_active=payload.is_active if payload.is_active is not None else True,
        must_change_password=payload.must_change_password if payload.must_change_password is not None else False,
        tenant_id=tenant_id,
        role_id=payload.role_id,
        is_superadmin=False
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    query = (
        select(User)
        .where(User.id == new_user.id)
        .options(selectinload(User.role))
        .execution_options(include_all_tenants=True)
    )
    refreshed = await db.execute(query)
    return refreshed.scalars().first()

@router.put("/{tenant_id}/users/{user_id}", response_model=UserResponse)
async def update_tenant_user(
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """
    Atualiza os dados de um usuário do laboratório (nome, login, senha, perfil de acesso, status).
    Exclusivo para SuperAdmins.
    """
    stmt = (
        select(User)
        .where(User.id == user_id, User.tenant_id == tenant_id)
        .options(selectinload(User.role))
        .execution_options(include_all_tenants=True)
    )
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado neste laboratório.")

    if payload.email is not None:
        email_clean = payload.email.strip().lower()
        if email_clean != user.email.lower():
            dup = await db.execute(
                select(User)
                .where(func.lower(User.email) == email_clean, User.id != user_id)
                .execution_options(include_all_tenants=True)
            )
            if dup.scalars().first():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"O login '{email_clean}' já está em uso.")
            user.email = email_clean

    if payload.name is not None:
        user.name = payload.name.strip()

    if payload.password and payload.password.strip():
        user.hashed_password = get_password_hash(payload.password.strip())

    if payload.role_id is not None:
        role_res = await db.execute(select(Role).where(Role.id == payload.role_id))
        if not role_res.scalars().first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Perfil de acesso selecionado é inválido.")
        user.role_id = payload.role_id

    if payload.is_active is not None:
        user.is_active = payload.is_active

    if payload.must_change_password is not None:
        user.must_change_password = payload.must_change_password

    await db.commit()
    await db.refresh(user)

    query = (
        select(User)
        .where(User.id == user.id)
        .options(selectinload(User.role))
        .execution_options(include_all_tenants=True)
    )
    refreshed = await db.execute(query)
    return refreshed.scalars().first()

@router.delete("/{tenant_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant_user(
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """
    Exclui um usuário de um laboratório específico.
    Exclusivo para SuperAdmins.
    """
    if superadmin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é permitido excluir o usuário SuperAdmin conectado."
        )

    stmt = (
        select(User)
        .where(User.id == user_id, User.tenant_id == tenant_id)
        .execution_options(include_all_tenants=True)
    )
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado neste laboratório.")

    try:
        await db.delete(user)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível excluir este usuário pois ele possui históricos vinculados. Recomendamos inativá-lo."
        )
    return

# --- 7. Migrações Manuais ---
@router.post("/run-migrations")
async def trigger_multitenant_migrations(
    db: AsyncSession = Depends(get_db),
    superadmin: User = Depends(get_current_superadmin)
):
    """
    Executa manualmente as migrações Multi-Tenant e o backfill retroativo.
    Acesso restrito ao SuperAdmin.
    """
    from backend.app.core.multitenancy import run_multitenant_migrations
    await run_multitenant_migrations(db)
    await db.commit()
    return {"status": "success", "message": "Migrações Multi-Tenant e backfill executados com sucesso!"}
