# Pegasus AudioCraft Backend (MusicGen & AudioGen)

This project provides a FastAPI backend for Meta's AudioCraft models, allowing you to generate:
- Music from text prompts using **MusicGen**.
- Sound effects (SFX) from text prompts using **AudioGen**.

## Features

- Generate music with specified duration.
- Generate sound effects with specified duration.
- Specify the duration of the generated audio.
- Serves generated audio files statically.
- Dockerized for easy deployment.

## Project Structure

```
pegasus-audiocraft-backend/
├── Dockerfile
├── README.md
├── generated_audio/      # Directory where generated audio files are stored
│   └── .gitkeep          # Ensures the directory is tracked by git
├── main.py               # FastAPI application code
└── requirements.txt      # Python dependencies
```

## Setup and Installation

### Prerequisites

- Python 3.8+
- Pip
- Docker (optional, for containerized deployment)

### Local Installation

1.  **Clone the repository (or create the files as described below):**

    ```bash
    # If you are cloning a repo (example)
    # git clone <your-repo-url>
    # cd pegasus-audiocraft-backend
    ```

2.  **Create and activate a virtual environment (recommended):**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```
    *Note: Installing PyTorch (`torch`) can take some time and disk space. If you have a CUDA-enabled GPU, ensure you install the correct PyTorch version for CUDA support. The `requirements.txt` by default lists CPU-only PyTorch. You might need to adjust it based on your system by visiting [PyTorch Get Started](https://pytorch.org/get-started/locally/).*

## Running the Application

### Using Uvicorn (for local development)

Once the dependencies are installed, you can run the FastAPI application using Uvicorn:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

-   `main:app`: Tells Uvicorn to look for an object named `app` in a file named `main.py`.
-   `--host 0.0.0.0`: Makes the server accessible from your local network.
-   `--port 8000`: Runs the server on port 8000.
-   `--reload`: Enables auto-reloading when code changes are detected (useful for development).

You should see output similar to:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using StatReload
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

The API will then be accessible at `http://localhost:8000` or `http://<your-local-ip>:8000`.

### Using Docker

1.  **Build the Docker image:**

    From the `pegasus-audiocraft-backend` directory (where the `Dockerfile` is located):

    ```bash
    docker build -t pegasus-audiocraft-backend .
    ```

2.  **Run the Docker container:**

    ```bash
    docker run -d -p 8000:8000 --name audiocraft-app -v ./generated_audio:/app/generated_audio pegasus-audiocraft-backend
    ```

    -   `-d`: Runs the container in detached mode.
    -   `-p 8000:8000`: Maps port 8000 of the container to port 8000 on your host machine.
    -   `--name audiocraft-app`: Assigns a name to the container for easier management.
    -   `-v ./generated_audio:/app/generated_audio`: Mounts the local `generated_audio` directory to `/app/generated_audio` inside the container. This ensures that generated audio files are saved on your host machine and persist even if the container is stopped or removed. **Make sure the local `./generated_audio` directory exists before running this command.**
    -   If you have a CUDA-enabled GPU and want to use it with Docker, you'll need to have the NVIDIA Container Toolkit installed and use the `--gpus all` flag (ensure your Dockerfile installs a GPU-enabled PyTorch):
        ```bash
        docker run -d -p 8000:8000 --gpus all --name audiocraft-app -v ./generated_audio:/app/generated_audio pegasus-audiocraft-backend
        ```
        You would also need to ensure your `Dockerfile` installs a GPU-enabled version of PyTorch. The current `Dockerfile` defaults to CPU.

    The API will then be accessible at `http://localhost:8000`.

    To view logs from the container:
    ```bash
    docker logs audiocraft-app
    ```

    To stop the container:
    ```bash
    docker stop audiocraft-app
    ```

    To remove the container:
    ```bash
    docker rm audiocraft-app
    ```

## API Endpoints

### `GET /`

-   **Description:** Root endpoint to check if the API is running.
-   **Response:**
    ```json
    {
      "message": "AudioCraft API (MusicGen & AudioGen) is running"
    }
    ```

### `POST /generate_music/`

-   **Description:** Generates music based on a text prompt using **MusicGen**.
-   **Request Body (JSON):**
    ```json
    {
      "prompt": "An upbeat electronic track with a catchy melody",
      "duration": 10
    }
    ```
    -   `prompt` (str, required): The text prompt to generate music from.
    -   `duration` (int, optional, default: 8, min: 1, max: 30): The desired duration of the audio in seconds.
-   **Success Response (200 OK):**
    ```json
    {
      "audio_url": "http://localhost:8000/audio_files/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.wav",
      "prompt": "An upbeat electronic track with a catchy melody",
      "duration": 10,
      "filename": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.wav",
      "message": "Music generated successfully."
    }
    ```
-   **Error Responses:**
    -   `422 Unprocessable Entity`: If the request body is invalid.
    -   `500 Internal Server Error`: If music generation fails or an unexpected error occurs.
    -   `503 Service Unavailable`: If the MusicGen model is not loaded.

### `POST /generate_sfx/`

-   **Description:** Generates a sound effect based on a text prompt using **AudioGen**.
-   **Request Body (JSON):**
    ```json
    {
      "prompt": "dog barking",
      "duration": 5
    }
    ```
    -   `prompt` (str, required): The text prompt to generate the SFX from.
    -   `duration` (int, optional, default: 5, min: 1, max: 15): The desired duration of the SFX in seconds.
-   **Success Response (200 OK):**
    ```json
    {
      "audio_url": "http://localhost:8000/audio_files/sfx_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.wav",
      "prompt": "dog barking",
      "duration": 5,
      "filename": "sfx_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.wav",
      "message": "SFX generated successfully."
    }
    ```
-   **Error Responses:**
    -   `422 Unprocessable Entity`: If the request body is invalid.
    -   `500 Internal Server Error`: If SFX generation fails or an unexpected error occurs.
    -   `503 Service Unavailable`: If the AudioGen model is not loaded.

### Accessing Generated Audio

Generated audio files are served statically from the `/audio_files/` path. For example, if the API returns a filename `my_song.wav`, you can access it at `http://localhost:8000/audio_files/my_song.wav`.

## Configuration

The application can be configured using environment variables (especially relevant for Docker deployment):

-   `MUSICGEN_MODEL_NAME`: The MusicGen model to use (e.g., `facebook/musicgen-small`, `facebook/musicgen-medium`). Default: `facebook/musicgen-small`.
-   `AUDIOGEN_MODEL_NAME`: The AudioGen model to use (e.g., `facebook/audiogen-medium`). Default: `facebook/audiogen-medium`.
-   `DEVICE`: The device to run the models on (`cuda` or `cpu`). Default: `cpu` in Dockerfile, auto-detects in `main.py` if not set.
-   `GENERATED_AUDIO_DIR`: The directory to store generated audio files. Default: `generated_audio`.
-   `PYTHONUNBUFFERED=1`: Ensures Python output (like logs) is sent directly to the terminal without buffering, which is useful for Docker logs.

## Development Notes

-   AudioCraft models (MusicGen and AudioGen) can be memory-intensive, especially larger versions or when generating longer audio clips. Ensure your machine has sufficient RAM and VRAM (if using a GPU).
-   Generation time can vary depending on the prompt complexity, audio duration, model size, and hardware.
-   For production, consider restricting `allow_origins` in the CORS middleware to your specific frontend domain(s).
-   The current `Dockerfile` installs the CPU version of PyTorch. To use a GPU with Docker, you'll need to:
    1.  Modify the `Dockerfile` to install a CUDA-enabled version of PyTorch (e.g., `pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118`).
    2.  Have the NVIDIA Container Toolkit installed on your Docker host.
    3.  Run the Docker container with the `--gpus all` flag.
    4.  Ensure the `DEVICE` environment variable is set to `cuda` when running the container.

```
This `README.md` provides a comprehensive guide to setting up, running, and using the AudioCraft backend.
I will now create the `.gitkeep` file in the `generated_audio` directory to ensure the directory is tracked by git.
