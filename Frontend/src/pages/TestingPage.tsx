import { useState } from 'react';
import SignalTest from '../components/SignalTest';
import Camera from '../components/Camera';
import './TestingPage.css';

function TestingPage() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [wsStatus, setWsStatus] = useState<
    "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR"
  >("DISCONNECTED");

  const handleCameraReady = () => {
    setIsCameraReady(true);
    setCameraError(null);
  };

  const handleCameraError = (errorMsg: string) => {
    setIsCameraReady(false);
    setCameraError(errorMsg);
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      setIsCameraOn(false);
      setIsCameraReady(false);
      setIsDetectionActive(false);
      setCameraError(null);
    } else {
      setIsCameraOn(true);
    }
  };

  const toggleDetection = () => {
    setIsDetectionActive(!isDetectionActive);
  };

  return (
    <div className="app-container">
      <SignalTest 
        wsStatus={wsStatus} 
        isDetectionActive={isDetectionActive} 
      />

      <header className="app-header">
        <h1>React Computer Vision App</h1>
        <p>Hand Tracking dengan MediaPipe</p>
      </header>

      <main className="camera-container">
        <Camera 
          isCameraOn={isCameraOn}
          isDetectionActive={isDetectionActive}
          isCameraReady={isCameraReady}
          cameraError={cameraError}
          onCameraReady={handleCameraReady}
          onCameraError={handleCameraError}
          onWsStatusChange={setWsStatus}
        />

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
