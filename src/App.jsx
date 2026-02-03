import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { auth, db } from './firebase.js'; 
import { Loader2 } from 'lucide-react';

import LandingPage from './LandingPage';
import Login from './Login';
import Register from './Register';
import FinancialForm from './FinancialForm';
import Dashboard from './Dashboard';
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";


function App() {
  const location = useLocation();
  useEffect(() => {
  ReactGA.send({
    hitType: "pageview",
    page: location.pathname,
  });
}, [location]);
  
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [monthSetupComplete, setMonthSetupComplete] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  
  // ✅ Get current month key (YYYY-MM)
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    let monthUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // ✅ NEW LOGIC: Check if THIS month's plan exists
        const monthDocRef = doc(db, 'users', currentUser.uid, 'months', currentMonthKey);
        
        monthUnsubscribe = onSnapshot(monthDocRef, (docSnap) => {
          // If the document for this month exists, the user has done the setup
          if (docSnap.exists()) {
            setMonthSetupComplete(true);
          } else {
            setMonthSetupComplete(false);
          }
        }, (error) => {
          console.warn("Month check failed:", error);
          setMonthSetupComplete(false);
        });
      } else {
        // Cleanup if logged out
        if (monthUnsubscribe) {
          monthUnsubscribe();
          monthUnsubscribe = null;
        }
        setMonthSetupComplete(false);
        setCurrentPage('home'); 
      }
    });

    return () => {
      authUnsubscribe();
      if (monthUnsubscribe) monthUnsubscribe();
    };
  }, [currentMonthKey]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (user) {
    // ✅ If this month is not set up, show the Form
    if (!monthSetupComplete) {
      return <FinancialForm />;
    }
    // ✅ Otherwise, show Dashboard for the current month
    return <Dashboard user={user} currentMonthKey={currentMonthKey} onLogout={() => auth.signOut()} />;
  }

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
  
  return <>{renderPage()}</>;
}

export default App;