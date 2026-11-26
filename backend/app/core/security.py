import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Any
import jwt
import bcrypt

logger = logging.getLogger("novalab.security")

# Configurações de segurança — SECRET_KEY DEVE ser definida via variável de ambiente em produção.
# Gere com: python -c "import secrets; print(secrets.token_hex(32))"
_DEFAULT_DEV_SECRET = "novalab-enterprise-secret-key-2026-secure-static"
_env_secret = os.getenv("SECRET_KEY", "").strip()
_app_env = os.getenv("APP_ENV", "production").strip().lower()
_require_strict = os.getenv("REQUIRE_STRICT_SECRET_KEY", "false").strip().lower() == "true"

if not _env_secret:
    if _require_strict and _app_env != "development":
        raise RuntimeError("SECRET_KEY obrigatória em produção quando REQUIRE_STRICT_SECRET_KEY=true.")
    if _app_env != "development":
        logger.warning(
            "[SECURITY] Variável SECRET_KEY não configurada no ambiente. "
            "Configure SECRET_KEY nas variáveis de ambiente de produção o quanto antes."
        )
    SECRET_KEY = _DEFAULT_DEV_SECRET
else:
    SECRET_KEY = _env_secret

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "360"))  # 6 horas padrão

def get_password_hash(password: str) -> str:
    """
    Gera o hash da senha usando bcrypt.
    """
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha em texto plano bate com o hash salvo.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    """
    Gera um token JWT com o subject (geralmente o ID ou email do usuário).
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica o token JWT e valida a assinatura.
    Retorna o payload se for válido, ou None caso contrário.
    """
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Verifica se o token expirou
        if decoded_token["exp"] < datetime.now(timezone.utc).timestamp():
            return None
        return decoded_token
    except jwt.PyJWTError:
        return None
