import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import FinancialForm from './components/FinancialForm.jsx';
import Dashboard from './components/Dashboard.jsx';
// Import from the firebase file in the same directory
import { auth, db } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    // This listener automatically handles state when user logs in/out
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Logged in: Try to get their data
        await fetchUserData(currentUser.uid);
      } else {
        // Logged out
        setUserData(null);
        setCurrentPage('home');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (uid) => {
    setFetchError(null);
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().score !== undefined) {
        // User has completed the financial form
        setUserData(docSnap.data());
        setCurrentPage('dashboard');
      } else {
        // User exists but hasn't filled form yet (or only partial data)
        setCurrentPage('financial-form');
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (error.code === 'unavailable' || error.message.includes('offline')) {
         setFetchError('Network issue detected. Please check your connection.');
      }
      setCurrentPage('financial-form');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserData(null);
    setCurrentPage('home');
  };

  const handleFormComplete = () => {
    if (user) fetchUserData(user.uid);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
        <p className="text-slate-400">Loading SmartSalary...</p>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      case 'register':
        return <Register onNavigate={setCurrentPage} />;
      case 'financial-form':
        return user ? (
          <div className="relative">
            {fetchError && (
              <div className="absolute top-0 left-0 w-full bg-yellow-500/90 text-black p-2 text-center text-sm font-bold z-50">
                {fetchError} - Changes will sync when online.
              </div>
            )}
            <FinancialForm onComplete={handleFormComplete} />
          </div>
        ) : <Login onNavigate={setCurrentPage} />;
      case 'dashboard':
        return user && userData ? <Dashboard userData={userData} onLogout={handleLogout} /> : <LandingPage onNavigate={setCurrentPage} />;
      case 'home':
      default:
        // Logic to redirect if already logged in
        if (user && userData) return <Dashboard userData={userData} onLogout={handleLogout} />;
        if (user && !userData) return <FinancialForm onComplete={handleFormComplete} />;
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