import os
import sys
from pathlib import Path

import uvicorn


if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys.executable).resolve().parent
else:
    BASE_DIR = Path(__file__).resolve().parent


MODEL_PATH = BASE_DIR / "models" / "small.en"

os.environ["WHISPER_MODEL_PATH"] = str(MODEL_PATH)


if __name__ == "__main__":

    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8001,
        app_dir=str(BASE_DIR)
    )