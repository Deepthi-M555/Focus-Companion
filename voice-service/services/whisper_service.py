import os
from faster_whisper import WhisperModel
from dotenv import load_dotenv

load_dotenv()
MODEL_NAME=os.getenv("WHISPER_MODEL","small.en")
DEVICE=os.getenv("WHISPER_DEVICE","cpu")
COMPUTE_TYPE=os.getenv("WHISPER_COMPUTE_TYPE","int8")

model=WhisperModel(
    MODEL_NAME,
    device=DEVICE,
    compute_type=COMPUTE_TYPE
)

def transcribe(audio_path):

    try:

        segments,info=model.transcribe(audio_path)

        text=" ".join(
            segment.text.strip()
            for segment in segments
            if segment.text.strip()
        )

        return{
            "text":text,
            "language":info.language,
            "language_probability":info.language_probability
        }

    except Exception as e:

        return{
            "error":str(e)
        }