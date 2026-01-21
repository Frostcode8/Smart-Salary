import React, { useState } from 'react';
import LandingPage from './components/LandingPage.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      case 'register':
        return <Register onNavigate={setCurrentPage} />;
      case 'home':
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <>
      {renderPage()}
    </>
  );
}

export default App;