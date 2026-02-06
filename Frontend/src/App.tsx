import { useState } from 'react';
import Navbar from './components/Navbar';
// import BackendTester from './components/BackendTester';
import Dashboard from './pages/Dashboard';
import TestingPage from './pages/TestingPage';
import Game from './pages/Game';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'testing':
        return <TestingPage />;
      case 'game':
        return <Game />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-wrapper">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      {/* <BackendTester /> */}
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;