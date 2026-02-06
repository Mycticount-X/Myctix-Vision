import './Dashboard.css';
// Import Icon
import { LuCamera, LuGamepad2, LuCpu, LuActivity, LuServer } from "react-icons/lu";
import { SiReact, SiFastapi, SiGoogle, SiSocketdotio } from "react-icons/si";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="dashboard-container">
      
      {/* Hero Section */}
      <section className="hero-section">
        <h1>Myctix Vision</h1>
        <p className="hero-subtitle">
          Eksplorasi kemampuan Hand Tracking Real-time menggunakan MediaPipe & FastAPI.
        </p>
      </section>

      {/* Grid Menu */}
      <div className="dashboard-grid">
        
        {/* Card 1: Testing */}
        <div className="dash-card action-card" onClick={() => onNavigate('testing')}>
          <div className="card-icon icon-blue">
            <LuCamera />
          </div>
          <h3>Uji Coba Model</h3>
          <p>Tes deteksi tangan secara real-time melalui webcam Anda.</p>
          <button className="card-btn">Mulai Kamera →</button>
        </div>

        {/* Card 2: Game */}
        <div className="dash-card action-card" onClick={() => onNavigate('game')}>
          <div className="card-icon icon-purple">
            <LuGamepad2 />
          </div>
          <h3>Mini Game</h3>
          <p>Mainkan game sederhana menggunakan gerakan tangan Anda.</p>
          <button className="card-btn">Main Sekarang →</button>
        </div>

        {/* Card 3: Info Tech */}
        <div className="dash-card info-card">
          <div className="card-icon icon-green">
            <LuCpu />
          </div>
          <h3>Teknologi</h3>
          <ul className="tech-list">
            <li>
              <SiReact className="tech-icon react" /> React + Vite
            </li>
            <li>
              <SiFastapi className="tech-icon python" /> FastAPI (Python)
            </li>
            <li>
              <SiGoogle className="tech-icon google" /> Google MediaPipe
            </li>
            <li>
              <SiSocketdotio className="tech-icon socket" /> WebSocket
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;