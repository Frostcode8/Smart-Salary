import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Key, 
  ArrowLeft, 
  PieChart, 
  Wallet
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup
} from "firebase/auth";

// Hardcoded config from your firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyDnanZQ6m9qg6QmRm52UEzZtPIZzbYfwt0",
  authDomain: "smartsalary-31bb7.firebaseapp.com",
  projectId: "smartsalary-31bb7",
  storageBucket: "smartsalary-31bb7.firebasestorage.app",
  messagingSenderId: "566475425090",
  appId: "1:566475425090:web:8769bea42e5f2a6694f4db",
  measurementId: "G-LWMZ3GRMH4"
};

export default function Login({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      setAuth(authInstance);
    } catch (err) {
      // Firebase might already be initialized, which is fine
      if (err.code === 'app/duplicate-app') {
          const authInstance = getAuth(); // get default app auth
          setAuth(authInstance);
      } else {
          console.error("Error initializing Firebase:", err);
          setError("Error initializing application.");
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!auth) {
        setError("Authentication service not ready.");
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful with email:', email);
      onNavigate('home'); 
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to sign in. Please check your credentials.");
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    if (!auth) {
        setError("Authentication service not ready.");
        return;
    }
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Google Login successful:', user);
      onNavigate('home');
    } catch (err) {
      console.error("Google Login error:", err);
      setError("Failed to sign in with Google.");
    }
  };

  // Consistent Styles
  const customStyles = `
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
      100% { transform: translateY(0px); }
    }
    @keyframes float-delayed {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
      100% { transform: translateY(0px); }
    }
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.1); }
    }
    .animate-float { animation: float 6s ease-in-out infinite; }
    .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; }
    .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
    .glass-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    }
    .glass-input {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }
    .glass-input:focus {
      background: rgba(0, 0, 0, 0.4);
      border-color: rgba(139, 92, 246, 0.5);
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
    }
  `;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden selection:bg-violet-500/30 font-sans relative flex items-center justify-center">
      <style>{customStyles}</style>

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-violet-600/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        
        {/* Floating Icons */}
        <div className="absolute top-20 left-20 text-violet-500/10 animate-float">
          <PieChart size={120} />
        </div>
        <div className="absolute bottom-40 right-20 text-fuchsia-500/10 animate-float-delayed">
          <Wallet size={100} />
        </div>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass-card p-10 rounded-3xl w-full relative overflow-hidden group">
          
          {/* Back Button */}
          <button 
            onClick={() => onNavigate('home')}
            className="absolute top-6 left-6 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Decorative glows inside card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-[50px] -mr-16 -mt-16 transition-all duration-700 group-hover:bg-violet-500/30" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/20 blur-[50px] -ml-16 -mb-16 transition-all duration-700 group-hover:bg-fuchsia-500/30" />

          <div className="relative mt-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Welcome Back
              </h2>
              <p className="text-gray-400">
                Continue your financial journey
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="group/input">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/input:text-violet-400 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:ring-0"
                    placeholder="hello@example.com"
                    required
                  />
                </div>
              </div>

              <div className="group/input">
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/input:text-violet-400 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass-input rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:ring-0"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-lg text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden"
              >
                <span className="relative z-10">Sign In</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400">Or continue with</span>
                <div className="flex-grow border-t border-gray-600"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 border border-white/10"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => onNavigate('register')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Don't have an account? <span className="text-violet-400 font-medium">Sign up</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}