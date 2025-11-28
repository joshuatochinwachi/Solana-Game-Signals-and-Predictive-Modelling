FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Create directories for cache and models
RUN mkdir -p raw_data_cache ml_models

EXPOSE 8000

# Run the application
CMD uvicorn main:app --host 0.0.0.0 --port $PORT