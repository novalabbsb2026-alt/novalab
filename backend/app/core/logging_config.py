import logging
import os
import sys


def setup_logging() -> logging.Logger:
    """
    Configura logging estruturado padronizado para toda a aplicação NovaLab / OptiMind
    e inicializa o Sentry automaticamente quando SENTRY_DSN estiver definida.
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

    sentry_dsn = os.getenv("SENTRY_DSN", "").strip()
    if sentry_dsn:
        try:
            import sentry_sdk  # type: ignore

            sentry_sdk.init(
                dsn=sentry_dsn,
                environment=os.getenv("APP_ENV", "production"),
                traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
            )
            root_logger.info("[OBSERVABILITY] Sentry inicializado com sucesso.")
        except ImportError:
            root_logger.warning("[OBSERVABILITY] SENTRY_DSN definida, mas pacote 'sentry-sdk' não está instalado.")
        except Exception as err:
            root_logger.warning(f"[OBSERVABILITY] Falha ao inicializar Sentry: {err}")

    return root_logger


logger = setup_logging()
