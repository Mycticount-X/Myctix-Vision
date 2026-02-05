from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import mediapipe as mp
import base64
import os
import asyncio

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

# Setup
BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

MODEL_PATH = './models/landmark.task'

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"File model '{MODEL_PATH}' tidak ditemukan. Silakan download dari Google MediaPipe.")

# Inisialisasi
options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=VisionRunningMode.IMAGE, 
    num_hands=2,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
    min_tracking_confidence=0.5
)

landmarker = HandLandmarker.create_from_options(options)

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4), # Thumb
    (0, 5), (5, 6), (6, 7), (7, 8), # Index
    (5, 9), (9, 10), (10, 11), (11, 12), # Middle
    (9, 13), (13, 14), (14, 15), (15, 16), # Ring
    (13, 17), (0, 17), (17, 18), (18, 19), (19, 20) # Pinky
]

def draw_landmarks_on_image(rgb_image, detection_result):
    hand_landmarks_list = detection_result.hand_landmarks
    annotated_image = np.copy(rgb_image)

    for hand_landmarks in hand_landmarks_list:
        
        # 1. Gambar Garis (Connections)
        for connection in HAND_CONNECTIONS:
            start_idx = connection[0]
            end_idx = connection[1]
            
            start_point = hand_landmarks[start_idx]
            end_point = hand_landmarks[end_idx]
            
            x1 = int(start_point.x * annotated_image.shape[1])
            y1 = int(start_point.y * annotated_image.shape[0])
            x2 = int(end_point.x * annotated_image.shape[1])
            y2 = int(end_point.y * annotated_image.shape[0])
            
            cv2.line(annotated_image, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # 2. Gambar Titik (Landmarks)
        for landmark in hand_landmarks:
            x = int(landmark.x * annotated_image.shape[1])
            y = int(landmark.y * annotated_image.shape[0])
            cv2.circle(annotated_image, (x, y), 5, (0, 0, 255), -1)

    return annotated_image

def base64_to_cv2(base64_string):
    if "base64," in base64_string:
        base64_string = base64_string.split("base64,")[1]
    
    img_bytes = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def cv2_to_base64(img):
    if img.shape[2] == 3: # Cek jika color image
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        
    _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    img_str = f"data:image/jpeg;base64,{img_base64}"
    return img_str

class ImagePayload(BaseModel):
    image: str

@app.get("/")
def read_root():
    return {"message": "Server FastAPI Berjalan dengan MediaPipe Tasks API (New)!"}

@app.post("/process_frame")
def process_frame(payload: ImagePayload):
    try:
        # 1. Konversi Base64 ke OpenCV (BGR)
        img_bgr = base64_to_cv2(payload.image)
        
        if img_bgr is None:
            return {"success": False, "error": "Gagal decode gambar"}
        
        # 2. Konversi ke RGB (Wajib untuk MediaPipe)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        
        # 3. Buat Object mp.Image (Format Baru)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        
        # 4. Deteksi (Gunakan method detect, bukan process)
        detection_result = landmarker.detect(mp_image)
        
        # 5. Cek hasil dan Gambar
        hand_detected = False
        num_hands = len(detection_result.hand_landmarks)
        
        annotated_image = img_rgb 
        
        if num_hands > 0:
            hand_detected = True
            annotated_image = draw_landmarks_on_image(img_rgb, detection_result)
        
        # 6. Konversi kembali ke Base64 (Function kita akan handle RGB->BGR balik)
        processed_image_str = cv2_to_base64(annotated_image)
        
        return {
            "success": True,
            "hand_detected": hand_detected,
            "num_hands": num_hands,
            "processed_frame": processed_image_str
        }
        
    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }
    
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # 1. Terima data (text base64)
            data = await websocket.receive_text()
            
            # 2. Proses Gambar (Synchronous code harus hati-hati di async)
            # Karena processing CPU bound, idealnya pakai run_in_executor, 
            # tapi untuk simple setup, langsung call function tidak masalah jika cepat.
            
            try:
                img_bgr = base64_to_cv2(data)
                img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
                
                detection_result = landmarker.detect(mp_image)
                
                annotated_image = img_rgb
                if len(detection_result.hand_landmarks) > 0:
                    annotated_image = draw_landmarks_on_image(img_rgb, detection_result)
                
                # 3. Kirim balik hasil
                processed_base64 = cv2_to_base64(annotated_image)
                await websocket.send_text(processed_base64)
                
            except Exception as e:
                print(f"Error processing: {e}")
                # Kirim balik original jika error biar gak blank
                await websocket.send_text(data)

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Connection error: {e}")