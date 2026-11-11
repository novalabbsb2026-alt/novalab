import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db, current_tenant_ctx
from backend.app.core.security import get_password_hash
from backend.app.core.multitenancy import DEFAULT_TENANT_ID
from backend.app.models.tenant import Tenant
from backend.app.models.user import User, Role
from backend.app.schemas.tenant import TenantCreate, TenantUpdate, TenantResponse
from backend.app.api.deps import (
    get_current_user,
    get_current_active_admin,
    get_current_superadmin
)

router = APIRouter()

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
        plan_tier=payload.plan_tier or "pro",
        is_active=payload.is_active if payload.is_active is not None else True
    )
    db.add(new_tenant)
    await db.flush()

    # Se fornecidas credenciais do administrador inicial
    if payload.admin_email and payload.admin_password:
        admin_email_clean = payload.admin_email.strip().lower()
        existing_user = await db.execute(select(User).where(func.lower(User.email) == admin_email_clean))
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

