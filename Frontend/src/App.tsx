import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import './App.css';

const videoConstraints = {
  width: 720,
  height: 480,
  facingMode: "user"
};

function App() {
  const webcamRef = useRef<Webcam>(null);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [backendResult, setBackendResult] = useState<any>(null);

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

  const checkConnection = async () => {
    setServerStatus("CHECKING");
    try {
      const response = await fetch('http://localhost:8000/');
      setServerStatus(response.ok ? "OK" : "ERROR");
    } catch {
      setServerStatus("ERROR");
    }
  };

  const captureAndSend = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) return;

    setIsProcessing(true);
    setBackendResult(null);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc })
      });

      if (!response.ok) throw new Error();

      const result = await response.json();
      setBackendResult(result);
      setServerStatus("OK");
    } catch {
      setServerStatus("ERROR");
      alert("Gagal terhubung ke backend.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return (
    <div className="app-container">
      
      <header className="app-header">
        <h1>React Computer Vision App</h1>

        {/* Uji Coba */}
        <div className="connection-check">
          <button onClick={checkConnection} className="check-btn">
            📡 Cek Koneksi Backend
          </button>

          {serverStatus === "CHECKING" && (
            <span className="status-badge checking">Mengecek...</span>
          )}
          {serverStatus === "OK" && (
            <span className="status-badge success">✅ Terhubung</span>
          )}
          {serverStatus === "ERROR" && (
            <span className="status-badge error">❌ Putus / Offline</span>
          )}
        </div>
      </header>

      <main className="camera-container">
        {backendResult && (
          <div
            className="result-card"
            style={{
              marginBottom: '20px',
              padding: '20px',
              background: '#333',
              borderRadius: '8px'
            }}
          >
            <h2>Hasil Backend:</h2>
            <p style={{ fontSize: '2rem', margin: '10px 0', color: '#646cff' }}>
              {backendResult.count} Jari
            </p>
            <small>Confidence: {backendResult.confidence * 100}%</small>
          </div>
        )}

        <div className="camera-wrapper">
          {cameraError && (
            <div className="error-message">⚠️ {cameraError}</div>
          )}
          {!isCameraReady && !cameraError && (
            <div className="loading-message">Menyiapkan kamera...</div>
          )}

          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            style={{ visibility: isCameraReady ? "visible" : "hidden" }}
            className="react-webcam-view"
            mirrored
          />
        </div>

        <div className="controls">
          <button
            disabled={!isCameraReady || isProcessing}
            onClick={captureAndSend}
            className="capture-btn"
          >
            {isProcessing ? "Mengirim ke Backend..." : "Ambil & Analisa"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
