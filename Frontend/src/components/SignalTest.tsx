import { useState } from 'react';
import './SignalTest.css';

interface SignalTestProps {
  wsStatus: "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";
  isDetectionActive: boolean;
}

function SignalTest({ wsStatus, isDetectionActive }: SignalTestProps) {
  const [serverStatus, setServerStatus] = useState<
    "UNKNOWN" | "CHECKING" | "OK" | "ERROR"
  >("UNKNOWN");

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
  );
}

export default SignalTest;