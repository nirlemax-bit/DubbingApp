# 1. Start with a lightweight version of Python
FROM python:3.9-slim

# 2. Install FFmpeg (this tells the cloud server to install it automatically!)
RUN apt-get update && apt-get install -y ffmpeg

# 3. Create a folder inside the cloud server for our app
WORKDIR /app

# 4. Copy the requirements file and install the Python libraries
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy your main.py file into the cloud server
COPY . .

# 6. Open port 8000 so the internet can talk to your app
EXPOSE 8000

# 7. Start the FastAPI server when the cloud computer turns on
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
