import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import './TestingPage.css';

const videoConstraints = {
  width: 720,
  height: 480,
  facingMode: "user"
};

function TestingPage() {
  const webcamRef = useRef<Webcam>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastFrameTime = useRef<number>(0);
  const FPS_LIMIT = 30;
  const animationFrameRef = useRef<number | null>(null);


  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [processedFrame, setProcessedFrame] = useState<string | null>(null);

  const [serverStatus, setServerStatus] = useState<
    "UNKNOWN" | "CHECKING" | "OK" | "ERROR"
  >("UNKNOWN");

  const [wsStatus, setWsStatus] = useState<
    "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR"
  >("DISCONNECTED");

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
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsStatus("DISCONNECTED");
    } else {
      setIsCameraOn(true);
    }
  };

  const toggleDetection = () => {
    if (isDetectionActive) {
      setIsDetectionActive(false);
      setProcessedFrame(null);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsStatus("DISCONNECTED");
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else {
      setIsDetectionActive(true);
      setWsStatus("CONNECTING");
      
      const ws = new WebSocket('ws://localhost:8000/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket Connected");
        setWsStatus("CONNECTED");
        setServerStatus("OK");
      };
      
      ws.onmessage = (event) => {
        setProcessedFrame(event.data);
      };

      ws.onclose = () => {
        console.log("WebSocket Disconnected");
        setWsStatus("DISCONNECTED");
        if (isDetectionActive) {
          setIsDetectionActive(false);
          setProcessedFrame(null);
        }
      };
      
      ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
        setWsStatus("ERROR");
        setServerStatus("ERROR");
      };
    }
  };

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

  // Main Loop
  useEffect(() => {
    if (isDetectionActive && isCameraReady) {
      animationFrameRef.current = requestAnimationFrame(sendFrame);
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
  }, [isDetectionActive, isCameraReady, sendFrame]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const checkConnection = async () => {
    setServerStatus("CHECKING");
    try {
      const response = await fetch('http://localhost:8000/');
      setServerStatus(response.ok ? "OK" : "ERROR");
    } catch {
      setServerStatus("ERROR");
    }
  };

  
  return (
    <div className="app-container">
      
      <div className="connection-check-corner">
        <button onClick={checkConnection} className="check-btn-mini" title="Tes Signal">
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

        {isDetectionActive && (
          <div className="ws-status-indicator" title={`WebSocket: ${wsStatus}`}>
            {wsStatus === "CONNECTED" && "🔗"}
            {wsStatus === "CONNECTING" && "🔄"}
            {wsStatus === "ERROR" && "❌"}
            {wsStatus === "DISCONNECTED" && "🔌"}
          </div>
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
              {/* 1. Webcam ASLI */}
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
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

              {/* 2. Gambar Hasil*/}
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

        <div className="controls">
          <button
            onClick={toggleCamera}
            className={`camera-toggle-btn ${isCameraOn ? 'camera-on' : 'camera-off'}`}
          >
            {isCameraOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
          </button>

          {isCameraOn && isCameraReady && (
            <button
              onClick={toggleDetection}
              className={`detection-toggle-btn ${isDetectionActive ? 'detection-on' : 'detection-off'}`}
            >
              {isDetectionActive ? 'Matikan Deteksi' : 'Aktifkan Deteksi'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default TestingPage;