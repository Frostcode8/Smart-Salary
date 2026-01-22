import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import FinancialForm from './components/FinancialForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import { auth, db } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { RefreshCw, WifiOff } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // User logged in, check their data
        await fetchUserData(currentUser.uid);
      } else {
        // User logged out, go to Login
        setUserData(null);
        setCurrentPage('login');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (uid) => {
    setFetchError(null);
    setLoading(true); 
    
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      
      // If doc exists AND has a score, go to Dashboard
      if (docSnap.exists() && docSnap.data().score !== undefined) {
        setUserData(docSnap.data());
        setCurrentPage('dashboard');
      } else {
        // Doc missing or no score -> Form
        setCurrentPage('financial-form');
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setFetchError("Unable to connect to database. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserData(null);
    setCurrentPage('login');
  };

  const handleFormComplete = () => {
    if (user) fetchUserData(user.uid);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
        <p className="text-slate-400">Loading your profile...</p>
      </div>
    );
  }

  // Error UI
  if (fetchError && user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
        <div className="bg-slate-800 p-8 rounded-2xl border border-red-500/20 max-w-sm text-center">
          <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Connection Issue</h3>
          <p className="text-slate-400 mb-6 text-sm">{fetchError}</p>
          <button 
            onClick={() => fetchUserData(user.uid)}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry Connection
          </button>
          <button 
            onClick={handleLogout}
            className="w-full mt-3 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium transition-colors"
          >
            Logout
          </button>
        </div>
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
          <FinancialForm onComplete={handleFormComplete} />
        ) : <Login onNavigate={setCurrentPage} />;
      case 'dashboard':
        return user && userData ? (
          <Dashboard userData={userData} onLogout={handleLogout} />
        ) : <Login onNavigate={setCurrentPage} />;
      case 'home':
        return <LandingPage onNavigate={setCurrentPage} />;
      default:
        return <Login onNavigate={setCurrentPage} />;
    }
  };

  return <>{renderPage()}</>;
}

export default App;