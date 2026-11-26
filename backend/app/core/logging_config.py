import logging
import os
import sys


def setup_logging() -> logging.Logger:
    """
    Configura logging estruturado padronizado para toda a aplicação NovaLab / OptiMind.
    Em produção, evita ruído excessivo e registra erros com timestamp, nível e módulo.
    """
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    root_logger = logging.getLogger("novalab")
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        root_logger.addHandler(handler)

    root_logger.setLevel(level)
    return root_logger


logger = setup_logging()
