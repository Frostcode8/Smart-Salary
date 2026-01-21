import React, { useState } from 'react';
import { 
  User,
  Mail, 
  Key, 
  ArrowLeft, 
  PieChart, 
  Wallet, 
  TrendingUp,
  Shield
} from 'lucide-react';

export default function Register({ onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = (e) => {
    e.preventDefault();
    console.log('Register:', { name, email, password });
    alert('Register functionality - Connect to Firebase!');
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
        <div className="absolute top-20 right-20 text-violet-500/10 animate-float">
          <PieChart size={120} />
        </div>
        <div className="absolute bottom-40 left-20 text-fuchsia-500/10 animate-float-delayed">
          <Shield size={100} />
        </div>
      </div>

      {/* Main Register Card */}
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
                Join the Club
              </h2>
              <p className="text-gray-400">
                Start mastering your money today
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="group/input">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/input:text-violet-400 transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:ring-0"
                    placeholder="Full Name"
                    required
                  />
                </div>
              </div>

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

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-lg text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden"
              >
                <span className="relative z-10">Create Account</span>
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => onNavigate('login')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Already registered? <span className="text-violet-400 font-medium">Log in</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}