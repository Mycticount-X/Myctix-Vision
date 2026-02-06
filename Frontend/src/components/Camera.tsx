import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import './HandTrackingCamera.css'; // Kita buat CSS terpisah nanti

const videoConstraints = {
  width: 720,
  height: 480,
  facingMode: "user"
};

// Props yang diterima dari Halaman Induk
interface HandTrackingCameraProps {
  isCameraOn: boolean;       // Perintah: Nyalakan Kamera?
  isDetectionActive: boolean;// Perintah: Mulai Deteksi?
  onWsStatusChange: (status: "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR") => void; // Laporan Status
}

function HandTrackingCamera({ 
  isCameraOn, 
  isDetectionActive, 
  onWsStatusChange 
}: HandTrackingCameraProps) {
  
  const webcamRef = useRef<Webcam>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastFrameTime = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const FPS_LIMIT = 30;

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [processedFrame, setProcessedFrame] = useState<string | null>(null);

  // --- 1. LOGIKA WEBCAM ---
  const handleUserMedia = () => {
    setIsCameraReady(true);
  };

  const handleUserMediaError = () => {
    setIsCameraReady(false);
    alert("Gagal mengakses kamera.");
  };

  // --- 2. LOGIKA WEBSOCKET (Otomatis jalan jika isDetectionActive = true) ---
  useEffect(() => {
    // Jika diminta deteksi tapi socket belum ada
    if (isDetectionActive) {
      onWsStatusChange("CONNECTING");
      
      const ws = new WebSocket('ws://localhost:8000/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WS Connected");
        onWsStatusChange("CONNECTED");
      };

      ws.onmessage = (event) => {
        setProcessedFrame(event.data);
      };

      ws.onclose = () => {
        console.log("WS Disconnected");
        onWsStatusChange("DISCONNECTED");
      };

      ws.onerror = (err) => {
        console.error("WS Error", err);
        onWsStatusChange("ERROR");
      };

      // Start Loop Pengiriman
      animationFrameRef.current = requestAnimationFrame(sendFrame);

    } else {
      // Jika isDetectionActive dimatikan, cleanup
      cleanupWebSocket();
      setProcessedFrame(null);
    }

    // Cleanup saat component unmount atau props berubah
    return () => {
      cleanupWebSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDetectionActive]); // Hanya jalan jika tombol deteksi ditekan

  const cleanupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // --- 3. LOOP PENGIRIMAN FRAME ---
  const sendFrame = useCallback(() => {
    if (
      isDetectionActive && 
      isCameraReady &&
      webcamRef.current && 
      wsRef.current && 
      wsRef.current.readyState === WebSocket.OPEN
    ) {
      const now = Date.now();
      if (now - lastFrameTime.current > (1000 / FPS_LIMIT)) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          wsRef.current.send(imageSrc);
          lastFrameTime.current = now;
        }
      }
    }
    
    if (isDetectionActive) {
      animationFrameRef.current = requestAnimationFrame(sendFrame);
    }
  }, [isDetectionActive, isCameraReady]);

  // --- 4. RENDER UI ---
  // Style agar Webcam dan Hasil tumpang tindih sempurna
  const commonStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  return (
    <div className="camera-wrapper">
      {!isCameraOn && (
        <div className="camera-off-message">
          <p>📷</p><p>Kamera Mati</p>
        </div>
      )}

      {isCameraOn && !isCameraReady && (
        <div className="loading-message">Menyiapkan kamera...</div>
      )}

      {isCameraOn && (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            mirrored={true}
            style={{
              ...commonStyle,
              // Sembunyikan webcam asli jika sedang ada hasil deteksi (biar tidak double)
              visibility: (isDetectionActive && processedFrame) ? "hidden" : "visible",
            }}
          />

          {isDetectionActive && processedFrame && (
            <img
              src={processedFrame}
              alt="Processed"
              style={{
                ...commonStyle,
                transform: "scaleX(-1)", // Mirror manual untuk gambar
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

export default HandTrackingCamera;