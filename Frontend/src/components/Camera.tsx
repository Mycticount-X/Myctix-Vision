import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import './Camera.css';

const videoConstraints = {
  width: 720,
  height: 480,
  facingMode: "user"
};

interface CameraProps {
  isCameraOn: boolean;
  isDetectionActive: boolean;
  onCameraReady: () => void;
  onCameraError: (error: string) => void;
  onWsStatusChange: (status: "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR") => void;
  isCameraReady: boolean;
  cameraError: string | null;
}

function Camera({
  isCameraOn,
  isDetectionActive,
  onCameraReady,
  onCameraError,
  onWsStatusChange,
  isCameraReady,
  cameraError
}: CameraProps) {
  const webcamRef = useRef<Webcam>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastFrameTime = useRef<number>(0);
  const FPS_LIMIT = 30;
  const animationFrameRef = useRef<number | null>(null);
  
  const [processedFrame, setProcessedFrame] = useState<string | null>(null);

  useEffect(() => {
    if (isDetectionActive) {
      onWsStatusChange("CONNECTING");
      
      const ws = new WebSocket('ws://localhost:8000/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket Connected");
        onWsStatusChange("CONNECTED");
      };
      
      ws.onmessage = (event) => {
        setProcessedFrame(event.data);
      };

      ws.onclose = () => {
        console.log("WebSocket Disconnected");
        onWsStatusChange("DISCONNECTED");
        setProcessedFrame(null);
      };
      
      ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
        onWsStatusChange("ERROR");
      };
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setProcessedFrame(null);
      onWsStatusChange("DISCONNECTED");
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDetectionActive]);

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
    
    if (isDetectionActive && isCameraReady) {
      animationFrameRef.current = requestAnimationFrame(sendFrame);
    }
  }, [isDetectionActive, isCameraReady]);

  useEffect(() => {
    if (isDetectionActive && isCameraReady) {
      animationFrameRef.current = requestAnimationFrame(sendFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDetectionActive, isCameraReady, sendFrame]);

  return (
    <div className="camera-container-inner">
        <div className="camera-wrapper">
          {!isCameraOn && (
            <div className="camera-off-message">
              <p>📷</p><p>Kamera Mati</p>
            </div>
          )}

          {isCameraOn && cameraError && (
            <div className="error-message">⚠️ {cameraError}</div>
          )}
          
          {isCameraOn && !isCameraReady && !cameraError && (
            <div className="loading-message">Menyiapkan kamera...</div>
          )}

          {isCameraOn && (
            <>
              {/* Webcam Asli */}
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMedia={onCameraReady}
                onUserMediaError={(err) => onCameraError("Gagal mengakses kamera. Pastikan izin diberikan.")}
                mirrored={true}
                style={{
                  visibility: (isDetectionActive && processedFrame) ? "hidden" : "visible",
                  position: (isDetectionActive && processedFrame) ? "absolute" : "relative",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%"
                }}
                className="react-webcam-view"
              />

              {/* Gambar Hasil */}
              {isDetectionActive && processedFrame && (
                <img
                  src={processedFrame}
                  alt="Processed"
                  className="processed-frame-view"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%"
                  }}
                />
              )}
            </>
          )}
        </div>
    </div>
  );
}

export default Camera;