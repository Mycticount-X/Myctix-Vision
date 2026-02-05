import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import './App.css';

const videoConstraints = {
  width: 720,
  height: 480,
  facingMode: "user"
};

function App() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [processedFrame, setProcessedFrame] = useState<string | null>(null);

  const [serverStatus, setServerStatus] = useState<
    "UNKNOWN" | "CHECKING" | "OK" | "ERROR"
  >("UNKNOWN");

  const handleUserMedia = () => {
    setIsCameraReady(true);
    setCameraError(null);
  };

  const handleUserMediaError = () => {
    setIsCameraReady(false);
    setCameraError("Gagal mengakses kamera. Pastikan izin diberikan.");
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      setIsCameraOn(false);
      setIsCameraReady(false);
      setIsDetectionActive(false);
      setCameraError(null);
      setProcessedFrame(null);
    } else {
      setIsCameraOn(true);
    }
  };

  const toggleDetection = () => {
    setIsDetectionActive(!isDetectionActive);
    if (isDetectionActive) {
      setProcessedFrame(null);
    }
  };

  const checkConnection = async () => {
    setServerStatus("CHECKING");
    try {
      const response = await fetch('http://localhost:8000/');
      setServerStatus(response.ok ? "OK" : "ERROR");
    } catch {
      setServerStatus("ERROR");
    }
  };

  const processFrameContinuously = useCallback(async () => {
    if (!isDetectionActive || !webcamRef.current) {
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    
    if (!imageSrc) {
      animationFrameRef.current = requestAnimationFrame(processFrameContinuously);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/process_frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc })
      });

      if (!response.ok) throw new Error();

      const result = await response.json();
      
      if (result.success && result.processed_frame) {
        setProcessedFrame(result.processed_frame);
        setServerStatus("OK");
      }
    } catch (error) {
      console.error("Error processing frame:", error);
      setServerStatus("ERROR");
    }

    animationFrameRef.current = requestAnimationFrame(processFrameContinuously);
  }, [isDetectionActive]);

  useEffect(() => {
    if (isDetectionActive && isCameraReady) {
      processFrameContinuously();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDetectionActive, isCameraReady, processFrameContinuously]);

  return (
    <div className="app-container">
      
      <div className="connection-check-corner">
        <button onClick={checkConnection} className="check-btn-mini" title="Cek Koneksi Backend">
          📡
        </button>
        {serverStatus === "CHECKING" && (
          <span className="status-indicator checking"></span>
        )}
        {serverStatus === "OK" && (
          <span className="status-indicator success"></span>
        )}
        {serverStatus === "ERROR" && (
          <span className="status-indicator error"></span>
        )}
      </div>

      <header className="app-header">
        <h1>React Computer Vision App</h1>
        <p>Hand Tracking dengan MediaPipe</p>
      </header>

      <main className="camera-container">
        <div className="camera-wrapper">
          {!isCameraOn && (
            <div className="camera-off-message">
              <p>📷</p>
              <p>Kamera Mati</p>
            </div>
          )}

          {isCameraOn && cameraError && (
            <div className="error-message">⚠️ {cameraError}</div>
          )}
          
          {isCameraOn && !isCameraReady && !cameraError && (
            <div className="loading-message">Menyiapkan kamera...</div>
          )}

          {isCameraOn && isDetectionActive && processedFrame ? (
            <img 
              src={processedFrame} 
              alt="Processed with skeleton"
              className="processed-frame-view"
            />
          ) : (
            isCameraOn && (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
                style={{ 
                  visibility: isCameraReady ? "visible" : "hidden",
                  display: isDetectionActive && processedFrame ? "none" : "block"
                }}
                className="react-webcam-view"
                mirrored
              />
            )
          )}
        </div>

        <div className="controls">
          <button
            onClick={toggleCamera}
            className={`camera-toggle-btn ${isCameraOn ? 'camera-on' : 'camera-off'}`}
          >
            {isCameraOn ? '📷 Matikan Kamera' : '📷 Nyalakan Kamera'}
          </button>

          {isCameraOn && isCameraReady && (
            <button
              onClick={toggleDetection}
              className={`detection-toggle-btn ${isDetectionActive ? 'detection-on' : 'detection-off'}`}
            >
              {isDetectionActive ? '⏹️ Matikan Deteksi' : '▶️ Aktifkan Deteksi'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;