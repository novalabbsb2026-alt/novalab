import os
import sys

# Garante que a raiz do repositório e o diretório backend estejam no sys.path para o ambiente Serverless da Vercel
_current_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_current_dir)
_backend_dir = os.path.join(_project_root, "backend")

for _p in (_project_root, _backend_dir):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from backend.app.main import app

