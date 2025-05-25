# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# We'll install PyTorch and related libraries first, as they can be large and have specific needs.
# Using --no-cache-dir to reduce image size.
# Explicitly find links for torch, torchaudio, and torchvision to ensure CUDA compatibility if needed,
# or to get specific versions. Adjust a_CUDA_VERSION according to your target environment or remove if CPU only.
# For CPU-only, you can simplify the torch installation.
# Example for CUDA 11.8:
# RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
# Example for CPU:
# Install ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variable
ENV MODEL_NAME="facebook/musicgen-small"
ENV DEVICE="cpu" # Default to CPU, can be overridden at runtime if a GPU is available
ENV GENERATED_AUDIO_DIR="generated_audio"
ENV PYTHONUNBUFFERED=1

# Create the directory for generated audio
RUN mkdir -p ${GENERATED_AUDIO_DIR}

# Run main.py when the container launches
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
