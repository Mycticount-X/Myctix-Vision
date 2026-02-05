# backend/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import random # Hanya untuk simulasi

app = FastAPI()

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DEFINISI DATA ---
# Kita mendefinisikan bentuk data yang diharapkan dari React
class ImagePayload(BaseModel):
    image: str # String Base64 dari webcam

# --- ENDPOINT API ---
@app.get("/")
def read_root():
    return {"message": "Server FastAPI Berjalan!"}

@app.post("/predict")
def predict_image(payload: ImagePayload):
    # 1. Terima data gambar (Base64)
    image_data = payload.image
    
    print(f"Menerima gambar! Panjang data: {len(image_data)} karakter")

    # --- DI SINI NANTI LOGIKA COMPUTER VISION NYATA ---
    # Contoh: Decode base64 -> OpenCV -> Proses -> Hasil
    # Untuk sekarang, kita simulasi saja dulu.
    
    dummy_count = random.randint(1, 5) # Angka acak 1-5
    dummy_confidence = round(random.uniform(0.8, 0.99), 2)

    # 2. Kirim balikan ke React
    return {
        "label": "Jari Terdeteksi",
        "count": dummy_count,
        "confidence": dummy_confidence
    }