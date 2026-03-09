from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse
import os
import yt_dlp
import whisper
from deep_translator import GoogleTranslator
from gtts import gTTS
from moviepy.editor import VideoFileClip, AudioFileClip
import uvicorn # Added: Needed to run the server!

# Initialize the Web Server
app = FastAPI()

# Allow your React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, put your React website URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define what the frontend will send us
class VideoRequest(BaseModel):
    url: str

# The core processing function (same as before)
def process_video(youtube_url: str, output_filename: str):
    print(f"Processing: {youtube_url}")
    ydl_opts = {'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4', 'outtmpl': 'temp_video.mp4'}
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])

    video = VideoFileClip("temp_video.mp4")
    video.audio.write_audiofile("temp_audio.wav", logger=None)

    model = whisper.load_model("base") 
    result = model.transcribe("temp_audio.wav")
    
    translator = GoogleTranslator(source='auto', target='en')
    english_text = translator.translate(result["text"])

    tts = gTTS(text=english_text, lang='en', slow=False)
    tts.save("temp_english.mp3")

    new_audio = AudioFileClip("temp_english.mp3")
    if new_audio.duration > video.duration:
        new_audio = new_audio.subclip(0, video.duration)

    final_video = video.set_audio(new_audio)
    final_video.write_videofile(output_filename, codec="libx264", audio_codec="aac")

    # Clean up
    os.remove("temp_audio.wav")
    os.remove("temp_english.mp3")
    os.remove("temp_video.mp4")

# The API Endpoint your React app will call
@app.post("/api/dub")
async def create_dubbed_video(request: VideoRequest):
    output_file = "final_dubbed_video.mp4"
    
    # Process the video
    process_video(request.url, output_file)
    
    # Send the finished MP4 file back to the user's browser
    return FileResponse(output_file, media_type="video/mp4", filename="english_dub.mp4")

# --- ADDED: This block actually starts the server when you run the file ---
if __name__ == "__main__":
    print("🚀 Starting the AI Dubbing Server...")
    print("Ensure you have installed: pip install fastapi uvicorn yt-dlp openai-whisper deep-translator gTTS moviepy")
    print("You also MUST have FFmpeg installed on your computer.")
    uvicorn.run(app, host="0.0.0.0", port=8000)
