from fastapi import FastAPI,UploadFile,File,HTTPException
from services.whisper_service import transcribe
import tempfile
import shutil
import os
from dotenv import load_dotenv

load_dotenv()

app=FastAPI()

@app.get("/health")
async def health():

    return{
        "status":"ok",
        "model":os.getenv("WHISPER_MODEL","small.en")
    }

@app.post("/transcribe")
async def transcribe_audio(audio:UploadFile=File(...)):

    suffix=os.path.splitext(audio.filename or ".webm")[1]

    temp_path=None

    try:

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            shutil.copyfileobj(
                audio.file,
                temp_file
            )

            temp_path=temp_file.name

        result=transcribe(temp_path)

        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )

        return result

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)