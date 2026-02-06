import { useState } from 'react';
import './NavBar.css';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'testing', label: 'Testing Page' },
    { id: 'game', label: 'Game' }
  ];

  const handlePageChange = (pageId: string) => {
    onPageChange(pageId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button 
        className={`hamburger-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
        </div>
        
        <div className="sidebar-menu">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handlePageChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

export default Navbar;