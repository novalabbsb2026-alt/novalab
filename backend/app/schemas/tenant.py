import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class TenantBase(BaseModel):
    name: str
    slug: str
    cnpj: Optional[str] = None
    telephone: Optional[str] = None
    address: Optional[str] = None
    cep: Optional[str] = None
    ie: Optional[str] = None
    plan_tier: Optional[str] = "pro"
    is_active: Optional[bool] = True

class TenantCreate(TenantBase):
    # Opcional: credenciais para provisionar o primeiro usuário administrador do laboratório
    admin_name: Optional[str] = None
    admin_email: Optional[str] = None
    admin_password: Optional[str] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    cnpj: Optional[str] = None
    telephone: Optional[str] = None
    address: Optional[str] = None
    cep: Optional[str] = None
    ie: Optional[str] = None
    plan_tier: Optional[str] = None
    is_active: Optional[bool] = None

class TenantResponse(TenantBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

