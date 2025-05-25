# 1. Base Image
FROM python:3.9-slim

# 2. Environment Variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV APP_HOME=/app

# 3. System Dependencies
# Install ffmpeg (required by audiocraft/torchaudio)
# Also install git and ca-certificates, as some Python packages (including from Hugging Face / audiocraft)
# might need to download models or other assets during build or runtime,
# and git can sometimes be used for that. ca-certificates ensures HTTPS connections work.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ffmpeg \
       git \
       ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 4. Working Directory
WORKDIR ${APP_HOME}

# 5. Install Python Dependencies
# Copy requirements.txt first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies.
# The requirements.txt should specify CPU versions of torch and torchaudio
# if this Dockerfile is intended for CPU-only execution, or if building for a specific CUDA version
# is handled outside this generic Dockerfile.
# For example, requirements.txt might contain:
# torch==2.2.1+cpu
# torchaudio==2.2.1+cpu
# audiocraft==1.3.0
# fastapi==0.110.0
# uvicorn[standard]==0.27.1
# python-multipart==0.0.9
# If requirements.txt contains generic torch/torchaudio, pip will fetch compatible versions.
# Adding --extra-index-url for PyTorch CPU versions if not directly specified in requirements.txt
# RUN pip install --no-cache-dir -r requirements.txt \
#    --extra-index-url https://download.pytorch.org/whl/cpu # If CPU specific wheels are needed and not in reqs

# Assuming requirements.txt lists appropriate versions (CPU or general)
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy Application Code
# Copy the main application file
COPY main.py .
# Create the generated_audio directory and set permissions (optional, main.py creates it)
# If main.py creates it, this just ensures it exists for the COPY command or any early access.
# However, it's often better to let the application manage its own runtime directories.
# For this case, main.py creates it, so we don't strictly need to create it here.
# We'll copy it if it exists in the build context, mainly for completeness if one pre-creates it.
# The volume mount at runtime is more critical for persistence.
COPY generated_audio ./generated_audio/

# 7. Expose Port
EXPOSE ${PORT}

# 8. Command to run the application
# Use environment variable for port in CMD
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# Note: If you use ENV PORT in CMD, it should be ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", ENV_VAR_NAME_WITHOUT_BRACES]
# However, uvicorn's --port argument expects a literal number or a string that can be cast to one.
# FastAPI's default port is 8000, so hardcoding it in CMD is common unless advanced entrypoint scripts are used.
# For simplicity and directness, using "8000" here. If ENV PORT was to be used dynamically in CMD,
# it would typically be through an entrypoint script that substitutes the variable.
# Re-evaluating: The ENV PORT is available to the Python process, but not directly to the shell expansion in CMD's array form.
# The uvicorn command in main.py's `if __name__ == "__main__":` block also uses 8000.
# So, consistency dictates using 8000 directly in the CMD.
# If the Python code itself read ENV PORT to determine what uvicorn should bind to, then it would work.
# But `main.py` currently doesn't do that for the uvicorn.run() call within the `if __name__ == "__main__"` block,
# and the CMD here bypasses that block anyway.

# Final CMD using the hardcoded port, matching the exposed port and typical usage.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# --- Build and Run Instructions (for README or user documentation) ---
#
# To build the Docker image:
# (Navigate to the `pegasus-audiocraft-backend` directory first)
# ```
# docker build -t pegasus-audiocraft-backend .
# ```
#
# To run the Docker container:
# (This maps port 8000 of the container to port 8000 on the host)
# ```
# docker run -p 8000:8000 pegasus-audiocraft-backend
# ```
#
# To run with a volume for persistent audio storage:
# (This maps the `generated_audio` subdirectory of your current local directory
#  to `/app/generated_audio` inside the container)
# Make sure the local `generated_audio` directory exists: `mkdir -p generated_audio`
# ```
# docker run -p 8000:8000 -v "$(pwd)/generated_audio":/app/generated_audio pegasus-audiocraft-backend
# ```
#
# Note on PyTorch/AudioCraft versions for CPU:
# The `requirements.txt` file should ideally specify CPU-only versions of PyTorch and TorchAudio
# if the target is always CPU, to avoid pulling larger GPU-enabled binaries.
# For example:
# torch==2.2.1+cpu
# torchaudio==2.2.1+cpu
# audiocraft==1.3.0
# ...
# This can be achieved by installing them with `--extra-index-url https://download.pytorch.org/whl/cpu`
# when creating the `requirements.txt` file locally. If generic versions are in requirements.txt,
# pip will download whatever is standard, which might be larger if they include GPU stubs.
# The current Dockerfile assumes `requirements.txt` is already curated for this.
```
