import React, { useState } from 'react';
import { Mail, Key, PieChart, ArrowLeft, Lock } from 'lucide-react';
// Explicitly using .js extension
import { auth } from './firebase.js'; 
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation handled by App.jsx
    } catch (err) {
      console.error(err);
      setError("Invalid Email or Password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
       {/* 🌌 Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-[#0f111a]/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/10 relative z-10 animate-in fade-in zoom-in duration-300">
        <button 
          onClick={() => onNavigate('home')} 
          className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-white mb-2">Welcome Back</h2>
        <p className="text-gray-400 text-center mb-8">Access your personalized financial roadmap</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6 text-center flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"/> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="email"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="password"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-100 transform hover:-translate-y-0.5 transition-all duration-300 shadow-xl shadow-white/5 mt-4 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-400 text-sm">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('register')} className="text-violet-400 hover:text-violet-300 font-semibold hover:underline decoration-violet-500/30 underline-offset-4 transition-all">
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}