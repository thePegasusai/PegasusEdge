import os
import uuid
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import torch
from audiocraft.models import MusicGen, AudioGen # Added AudioGen
from audiocraft.data.audio import audio_write
import uvicorn

# --- Configuration ---
MUSICGEN_MODEL_NAME = os.getenv("MUSICGEN_MODEL_NAME", "facebook/musicgen-small")
AUDIOGEN_MODEL_NAME = os.getenv("AUDIOGEN_MODEL_NAME", "facebook/audiogen-medium") # New config for AudioGen
# Use "cuda" if you have a GPU, otherwise "cpu". 
# Ensure PyTorch is installed with CUDA support if using "cuda".
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
GENERATED_AUDIO_DIR = "generated_audio"
DEFAULT_MUSIC_DURATION_S = 8
DEFAULT_SFX_DURATION_S = 5 # Default duration for SFX

# Create directory for generated audio if it doesn't exist
os.makedirs(GENERATED_AUDIO_DIR, exist_ok=True)

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# --- Pydantic Models for Request Bodies ---
class MusicGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt to generate music from.")
    duration: int = Field(DEFAULT_MUSIC_DURATION_S, gt=0, le=30, description="Duration of the generated audio in seconds (1-30s).")

class SFXGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt to generate sound effect from.")
    duration: int = Field(DEFAULT_SFX_DURATION_S, gt=0, le=15, description="Duration of the generated SFX in seconds (1-15s).")


# --- FastAPI App Initialization ---
app = FastAPI(
    title="AudioCraft API (MusicGen & AudioGen)",
    description="Generate music and sound effects using Meta's AudioCraft models.",
    version="0.2.0", # Updated version
)

# --- CORS Middleware ---
# Allows requests from any origin. For production, restrict this to your frontend's domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify origins like ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Static Files ---
# Serve generated audio files from the GENERATED_AUDIO_DIR directory
app.mount(f"/audio_files", StaticFiles(directory=GENERATED_AUDIO_DIR), name="audio_files")

# --- Load Models ---
musicgen_model = None
audiogen_model = None

# Load MusicGen Model
logger.info(f"Loading MusicGen model: {MUSICGEN_MODEL_NAME} on device: {DEVICE}")
try:
    musicgen_model = MusicGen.get_pretrained(MUSICGEN_MODEL_NAME, device=DEVICE)
    musicgen_model.set_generation_params(duration=DEFAULT_MUSIC_DURATION_S) 
    logger.info("MusicGen model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load MusicGen model: {e}")
    musicgen_model = None 

# Load AudioGen Model
logger.info(f"Loading AudioGen model: {AUDIOGEN_MODEL_NAME} on device: {DEVICE}")
try:
    audiogen_model = AudioGen.get_pretrained(AUDIOGEN_MODEL_NAME, device=DEVICE)
    # AudioGen doesn't use set_generation_params in the same way for a global default duration
    # Duration is typically controlled per-request more directly or is inherent to the prompt for SFX.
    # We can still set a default if desired for the API, but it's applied during generation.
    logger.info("AudioGen model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load AudioGen model: {e}")
    audiogen_model = None

# --- API Endpoints ---
@app.get("/", tags=["Status"])
async def root():
    """
    Root endpoint to check if the API is running.
    """
    return {"message": "AudioCraft API (MusicGen & AudioGen) is running"}

@app.post("/generate_music/", tags=["Music Generation"])
async def generate_music_endpoint(request: Request, music_request: MusicGenerationRequest):
    """
    Generate music based on a text prompt using MusicGen.
    """
    if musicgen_model is None:
        logger.error("MusicGen model is not loaded. Cannot generate music.")
        raise HTTPException(status_code=503, detail="MusicGen model is not available. Please check server logs.")

    logger.info(f"Received music generation request: Prompt='{music_request.prompt}', Duration={music_request.duration}s")

    try:
        musicgen_model.set_generation_params(duration=music_request.duration)
        
        logger.info(f"Generating music for prompt: '{music_request.prompt}'...")
        wav = musicgen_model.generate([music_request.prompt], progress=True)
        logger.info("Music generation completed.")

        if wav is None or wav.shape[0] == 0:
            logger.error("Music generation failed: No audio output from model.")
            raise HTTPException(status_code=500, detail="Music generation failed: No audio output.")

        filename_prefix = "music_"
        filename = f"{filename_prefix}{uuid.uuid4()}.wav"
        output_path = os.path.join(GENERATED_AUDIO_DIR, filename)

        logger.info(f"Saving generated music to: {output_path}")
        audio_write(
            output_path, 
            wav[0].cpu(), 
            musicgen_model.sample_rate, 
            strategy="loudness", 
            loudness_compressor=True
        )
        logger.info(f"Music saved successfully: {filename}")

        audio_url = str(request.base_url).rstrip('/') + f"/audio_files/{filename}"
        
        return {
            "audio_url": audio_url,
            "prompt": music_request.prompt,
            "duration": music_request.duration,
            "filename": filename,
            "message": "Music generated successfully."
        }
    except RuntimeError as e:
        if "out of memory" in str(e).lower():
            logger.error(f"CUDA out of memory during music generation: {e}")
            raise HTTPException(status_code=500, detail="CUDA out of memory. Try a shorter duration or a less complex prompt.")
        else:
            logger.error(f"An unexpected runtime error occurred during music generation: {e}")
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred during music generation: {str(e)}")
    except Exception as e:
        logger.error(f"An unexpected error occurred during music generation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@app.post("/generate_sfx/", tags=["SFX Generation"])
async def generate_sfx_endpoint(request: Request, sfx_request: SFXGenerationRequest):
    """
    Generate a sound effect based on a text prompt using AudioGen.
    """
    if audiogen_model is None:
        logger.error("AudioGen model is not loaded. Cannot generate SFX.")
        raise HTTPException(status_code=503, detail="AudioGen model is not available. Please check server logs.")

    logger.info(f"Received SFX generation request: Prompt='{sfx_request.prompt}', Duration={sfx_request.duration}s")

    try:
        # For AudioGen, duration is often set directly in generate or via set_generation_params
        # if the model supports it explicitly for this purpose.
        # Let's assume we want to honor the request's duration, similar to MusicGen.
        audiogen_model.set_generation_params(duration=sfx_request.duration)

        logger.info(f"Generating SFX for prompt: '{sfx_request.prompt}'...")
        wav = audiogen_model.generate([sfx_request.prompt], progress=True)
        logger.info("SFX generation completed.")

        if wav is None or wav.shape[0] == 0:
            logger.error("SFX generation failed: No audio output from model.")
            raise HTTPException(status_code=500, detail="SFX generation failed: No audio output.")

        filename_prefix = "sfx_"
        filename = f"{filename_prefix}{uuid.uuid4()}.wav"
        output_path = os.path.join(GENERATED_AUDIO_DIR, filename)

        logger.info(f"Saving generated SFX to: {output_path}")
        audio_write(
            output_path, 
            wav[0].cpu(), 
            audiogen_model.sample_rate, 
            strategy="loudness", # Using loudness normalization, good for SFX too
            loudness_compressor=True
        )
        logger.info(f"SFX saved successfully: {filename}")

        audio_url = str(request.base_url).rstrip('/') + f"/audio_files/{filename}"
        
        return {
            "audio_url": audio_url,
            "prompt": sfx_request.prompt,
            "duration": sfx_request.duration, # Return the actual duration used
            "filename": filename,
            "message": "SFX generated successfully."
        }
    except RuntimeError as e:
        if "out of memory" in str(e).lower():
            logger.error(f"CUDA out of memory during SFX generation: {e}")
            raise HTTPException(status_code=500, detail="CUDA out of memory. Try a shorter duration or a less complex prompt.")
        else:
            logger.error(f"An unexpected runtime error occurred during SFX generation: {e}")
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred during SFX generation: {str(e)}")
    except Exception as e:
        logger.error(f"An unexpected error occurred during SFX generation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


# --- Uvicorn Runner (for local testing) ---
if __name__ == "__main__":
    logger.info("Starting Uvicorn server for local development...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) # Added reload=True for dev
