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

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    let userUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // ✅ FIXED: Use currentUser.uid, not user.uid
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        userUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().income) {
            setOnboardingComplete(true);
          } else {
            setOnboardingComplete(false);
          }
        }, (error) => {
          console.warn("Profile check failed:", error);
          setOnboardingComplete(false);
        });
      } else {
        if (userUnsubscribe) {
          userUnsubscribe();
          userUnsubscribe = null;
        }
        setOnboardingComplete(false);
        setCurrentPage('home'); 
      }
    });

    return () => {
      authUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (user) {
    if (!onboardingComplete) {
      return <FinancialForm />;
    }
    return <Dashboard user={user} onLogout={() => auth.signOut()} />;
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