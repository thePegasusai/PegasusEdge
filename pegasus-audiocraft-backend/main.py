import logging
import os
import uuid
import torch
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from audiocraft.models import MusicGen
from audiocraft.data.audio import audio_write
import torchaudio # Required for getting audio duration

# --- Configuration ---
MODEL_NAME = "facebook/musicgen-small"
# For larger models, you might need to specify the device explicitly if CUDA is available
# and you have enough VRAM. For "small", CPU might be acceptable for non-realtime tasks.
# However, Hugging Face Transformers and Accelerate might handle device placement automatically.
# We'll let audiocraft/torch decide the device for now, or specify 'cuda' if available and desired.
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
GENERATED_AUDIO_DIR = "generated_audio"
os.makedirs(GENERATED_AUDIO_DIR, exist_ok=True)

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Pydantic Models ---
class MusicGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Text prompt for music generation.")
    duration: int = Field(8, description="Desired duration in seconds (approximate).", gt=0, le=30) # musicgen-small has limitations

class MusicGenerationResponse(BaseModel):
    audio_url: str
    prompt_used: str
    duration_generated_seconds: float
    message: str

# --- FastAPI Application Setup ---
app = FastAPI(title="Pegasus AudioCraft MusicGen API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# Static files for generated audio
app.mount(f"/audio_files", StaticFiles(directory=GENERATED_AUDIO_DIR), name="audio_files")

# --- Global Model Storage ---
# This dictionary will store loaded models. MusicGen model will be loaded at startup.
models = {}

# --- Application Event Handlers ---
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting up application on device: {DEVICE}")
    logger.info(f"Loading MusicGen model: {MODEL_NAME}...")
    try:
        # Using audiocraft's MusicGen class for loading
        models["musicgen"] = MusicGen.get_pretrained(MODEL_NAME, device=DEVICE)
        logger.info(f"MusicGen model '{MODEL_NAME}' loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load MusicGen model: {e}")
        # Depending on policy, you might want the app to not start or run in a degraded mode.
        # For now, we'll log the error. The endpoint will fail if the model isn't loaded.
        models["musicgen"] = None


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down application...")
    models.clear() # Clear models from memory
    logger.info("Models cleared. Shutdown complete.")

# --- API Endpoints ---
@app.get("/")
async def root():
    return {"message": "Welcome to the Pegasus AudioCraft MusicGen API. Visit /docs for API documentation."}

@app.post("/generate_music/", response_model=MusicGenerationResponse)
async def generate_music_endpoint(request_data: MusicGenerationRequest):
    logger.info(f"Received music generation request: Prompt='{request_data.prompt}', Duration={request_data.duration}s")
    
    musicgen_model = models.get("musicgen")
    if musicgen_model is None:
        logger.error("MusicGen model is not loaded. Cannot process request.")
        raise HTTPException(status_code=500, detail="MusicGen model not available. Service might be starting up or encountered an error.")

    try:
        # Set generation parameters
        # MusicGen model's generate method might not take duration directly in the way some other models do.
        # It often generates a fixed length based on the model's training or can be controlled by max_new_tokens or similar.
        # For MusicGen, the duration parameter to `set_generation_params` is a target.
        # The model will try to generate audio of that length, but it might be slightly different.
        musicgen_model.set_generation_params(duration=request_data.duration)
        logger.info(f"Set MusicGen generation params: duration={request_data.duration}s")

        # Generate audio
        # The generate method takes a list of descriptions (prompts)
        logger.info(f"Generating audio for prompt: '{request_data.prompt}'...")
        # The output tensor will be on the device the model is on.
        # Shape: [batch_size, num_channels, num_samples]
        output_tensor = musicgen_model.generate([request_data.prompt], progress=True)
        logger.info("Audio tensor generated.")

        # Move tensor to CPU for saving and further processing if it's not already
        audio_data = output_tensor.squeeze(0).cpu() # Remove batch dim, move to CPU
        
        # Save the audio to a file
        unique_filename = f"musicgen_{uuid.uuid4().hex}.wav"
        file_path = os.path.join(GENERATED_AUDIO_DIR, unique_filename)
        
        logger.info(f"Saving audio to: {file_path} with sample rate: {musicgen_model.sample_rate}")
        
        # Use audiocraft.data.audio.audio_write
        # audio_write expects [num_channels, num_samples]
        audio_write(
            file_path,
            audio_data, # This should be [channels, samples]
            sample_rate=musicgen_model.sample_rate,
            strategy="loudness",
            loudness_headroom_db=16,
            loudness_compressor=True,
            add_suffix=False 
        )
        logger.info(f"Audio successfully saved to {file_path}")

        # Get actual duration of the saved file
        # audio_data shape is [channels, samples].
        num_samples = audio_data.shape[-1]
        duration_generated_seconds = num_samples / musicgen_model.sample_rate
        logger.info(f"Actual duration of generated audio: {duration_generated_seconds:.2f}s")

        audio_url = f"/audio_files/{unique_filename}"
        
        return MusicGenerationResponse(
            audio_url=audio_url,
            prompt_used=request_data.prompt,
            duration_generated_seconds=duration_generated_seconds,
            message="Audio generated successfully"
        )

    except RuntimeError as e: # Catch specific PyTorch/CUDA errors
        if "CUDA out of memory" in str(e):
            logger.error(f"CUDA out of memory during generation: {e}")
            raise HTTPException(status_code=500, detail="CUDA out of memory. Try a shorter duration or a less demanding prompt.")
        logger.error(f"Runtime error during music generation: {e}")
        raise HTTPException(status_code=500, detail=f"Runtime error during music generation: {str(e)}")
    except Exception as e:
        logger.error(f"An unexpected error occurred during music generation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# --- Health Check Endpoint (Optional but good practice) ---
@app.get("/health")
async def health_check():
    if models.get("musicgen") is not None:
        return {"status": "ok", "model_loaded": True}
    else:
        return {"status": "degraded", "model_loaded": False, "message": "MusicGen model not loaded."}

if __name__ == "__main__":
    import uvicorn
    # Note: Uvicorn is usually run from the command line as specified in the README.
    # This block is for direct execution (e.g. `python main.py`), but not recommended for production.
    logger.info("Starting Uvicorn server directly from main.py (for development only)...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Developer Note:
# To run this application:
# 1. Ensure you have a Python environment with all dependencies from requirements.txt installed.
# 2. Make sure `ffmpeg` is installed and accessible in your system's PATH.
#    AudioCraft (and torchaudio, which it uses) relies on ffmpeg for loading/saving various audio formats
#    and for some audio processing tasks. Without it, you might encounter errors during audio processing
#    or model operations.
# 3. Run Uvicorn: `uvicorn pegasus-audiocraft-backend.main:app --reload --host 0.0.0.0 --port 8000`
#    (Adjust filename if your main.py is not inside a 'pegasus-audiocraft-backend' directory relative to where you run uvicorn)
#    Or, if running from the project root: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
#
# The `duration` parameter for MusicGen models (especially smaller ones like 'musicgen-small')
# is more of a target. The actual generated audio might be slightly shorter or longer.
# Precise duration control typically requires post-processing (trimming/padding) or more
# complex generation techniques not implemented in this basic version.
# The `model.generate()` output for `musicgen-small` for a given prompt and duration setting
# usually has a consistent length, but this can vary between models and versions.
# The code now correctly calculates the actual duration of the saved .wav file.
# `torchaudio` is a dependency of `audiocraft` and is used by `audio_write`.
#
# For `musicgen-small`, the maximum duration it can generate in one go is typically around 30 seconds,
# even if you set `set_generation_params(duration=...)` to a higher value.
# The `duration` field in MusicGenerationRequest has been capped at 30s for this reason.
# If you need longer audio, you'd typically use continuation features of the model, which is more advanced.
#
# Device selection: The code defaults to "cuda" if available, else "cpu". For CPU, generation
# will be significantly slower.
#
# Unique Filename: Using UUID ensures that filenames are unique, preventing overwrites.
#
# Error Handling: Basic error handling is in place for model loading and generation.
# More specific error handling can be added as needed.
#
# CORS: Enabled for all origins for development. Restrict this in production.
#
# Static Files: `/audio_files/` endpoint serves files from `./generated_audio/`.
#
# Model Loading: Model is loaded on startup and stored globally to avoid reloading on each request.
#
# `audio_write` usage:
# - `file_path`: Path to save the audio.
# - `audio_data`: The audio tensor, expected shape [channels, samples].
# - `sample_rate`: Model's sample rate.
# - `strategy`: "loudness" is a good default to normalize audio.
# - `add_suffix=False`: We handle the filename and extension.
#
# The `torchaudio` import was added as it's a common backend for `audio_write` and helps in understanding
# the audio processing chain, though `audiocraft` itself might manage the direct interaction.
# However, explicitly noting it is good as `audiocraft` depends on it.
# The code now uses `audio_data.shape[-1] / musicgen_model.sample_rate` for duration calculation,
# which is the standard way.
```
