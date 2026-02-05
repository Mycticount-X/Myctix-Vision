import base64
import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SETUP MEDIAPIPE ---
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5
)
mp_draw = mp.solutions.drawing_utils

class ImagePayload(BaseModel):
    image: str

# Fungsi Bantuan: Base64 ke OpenCV Image
def base64_to_cv2(base64_string):
    # Hapus header "data:image/jpeg;base64," jika ada
    if "base64," in base64_string:
        base64_string = base64_string.split(",")[1]
    
    decoded_data = base64.b64decode(base64_string)
    np_data = np.frombuffer(decoded_data, np.uint8)
    img = cv2.imdecode(np_data, cv2.IMREAD_COLOR)
    return img

# Fungsi Bantuan: OpenCV Image ke Base64
def cv2_to_base64(img):
    _, buffer = cv2.imencode('.jpg', img)
    base64_str = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{base64_str}"

@app.post("/process_frame")
def process_frame(payload: ImagePayload):
    # 1. Terima & Konversi Gambar
    img = base64_to_cv2(payload.image)
    
    # 2. Proses MediaPipe
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = hands.process(img_rgb)

    # 3. Gambar Skeleton jika tangan terdeteksi
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_draw.draw_landmarks(
                img, 
                hand_landmarks, 
                mp_hands.HAND_CONNECTIONS
            )

    # 4. Kirim balik gambar yang sudah digambar
    processed_image_str = cv2_to_base64(img)
    
    return {"processed_image": processed_image_str}