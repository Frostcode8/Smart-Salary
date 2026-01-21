import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  PieChart, 
  Wallet, 
  CreditCard
} from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  const [salary, setSalary] = useState('');
  const [city, setCity] = useState('');
  const [showTeaser, setShowTeaser] = useState(false);

  // Floating icons animation state
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cities = [
    { name: 'Mumbai', avgSavings: 4800 },
    { name: 'Delhi', avgSavings: 5200 },
    { name: 'Bangalore', avgSavings: 6500 },
    { name: 'Hyderabad', avgSavings: 5800 },
    { name: 'Pune', avgSavings: 5000 },
    { name: 'Chennai', avgSavings: 4600 },
    { name: 'Kolkata', avgSavings: 3800 },
    { name: 'Other', avgSavings: 4000 }
  ];

  const calculateTeaser = () => {
    if (!salary || !city) return;
    const salaryNum = parseInt(salary);
    if (salaryNum < 10000) return;
    setShowTeaser(true);
  };

  const getCityData = () => {
    return cities.find(c => c.name === city) || cities[cities.length - 1];
  };

  // Custom CSS for floating animations
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
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden selection:bg-violet-500/30 font-sans relative">
      <style>{customStyles}</style>

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-violet-600/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        
        {/* Floating Background Icons */}
        <div className="absolute top-20 left-20 text-violet-500/10 animate-float">
          <PieChart size={120} />
        </div>
        <div className="absolute top-40 right-20 text-fuchsia-500/10 animate-float-delayed">
          <Wallet size={100} />
        </div>
        <div className="absolute bottom-40 left-1/4 text-blue-500/10 animate-float" style={{ animationDuration: '8s' }}>
          <TrendingUp size={140} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative bg-[#0f111a] p-2.5 rounded-xl border border-white/10">
              <DollarSign className="w-6 h-6 text-violet-400" />
            </div>
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
            SmartSalary
          </span>
        </div>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
        >
          Sign In
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column: Text */}
          <div className="space-y-8 text-center lg:text-left pt-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-violet-300 text-sm font-medium border-violet-500/20 animate-float-delayed">
              <Sparkles className="w-4 h-4" />
              <span>India's First AI Money Coach</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
              Master Your Money <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white">
                Like a Pro
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Stop guessing where your salary goes. Get a personalized financial roadmap powered by data from thousands of successful savers.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              {[
                { icon: Shield, text: "Bank-Grade Security" },
                { icon: TrendingUp, text: "Smart Growth" },
                { icon: CreditCard, text: "Expense Tracking" }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-gray-400 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                  <feature.icon className="w-4 h-4 text-violet-400" />
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Calculator */}
          <div className="relative">
            {/* Background Glow behind card */}
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/30 to-fuchsia-600/30 rounded-[30px] blur-2xl transform rotate-3 scale-105" />
            
            <div className="glass-card rounded-[30px] p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 opacity-50" />
              
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <TrendingUp className="w-6 h-6 text-violet-400" />
                </div>
                Salary Optimizer
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Monthly Income (₹)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full glass-input rounded-xl py-4 pl-10 pr-4 text-xl font-semibold text-white placeholder-gray-600 outline-none"
                      placeholder="50,000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Current City</label>
                  <div className="relative">
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full glass-input rounded-xl py-4 px-4 text-lg text-white outline-none appearance-none cursor-pointer"
                      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} // Darker bg for option visibility
                    >
                      <option value="" className="bg-slate-900 text-gray-400">Select your city</option>
                      {cities.map(c => (
                        <option key={c.name} value={c.name} className="bg-slate-900">{c.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={calculateTeaser}
                  disabled={!salary || !city}
                  className="w-full mt-4 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-100 transform hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Generate Plan
                </button>
              </div>

              {/* TEASER RESULT OVERLAY */}
              {showTeaser && (
                <div className="absolute inset-0 z-20 backdrop-blur-xl bg-[#0f111a]/90 flex flex-col items-center justify-center p-8 text-center animate-pulse-glow" style={{ animationDuration: '0.5s', animationIterationCount: 1 }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">Plan Ready!</h3>
                  <p className="text-gray-400 mb-8 max-w-xs">
                    We've analyzed data for {city}. You could be saving <span className="text-emerald-400 font-bold">₹{getCityData().avgSavings.toLocaleString('en-IN')}</span> more every month.
                  </p>

                  <button
                    onClick={() => onNavigate('register')}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all"
                  >
                    Unlock Full Report Free
                  </button>
                  
                  <p className="mt-4 text-xs text-gray-500">
                    Takes less than 30 seconds
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          {[
            { label: "Assets Managed", value: "₹2.4Cr+", color: "text-emerald-400" },
            { label: "Active Users", value: "10,000+", color: "text-violet-400" },
            { label: "App Rating", value: "4.9/5", color: "text-yellow-400" }
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl text-center hover:bg-white/5 transition-all cursor-default">
              <div className={`text-4xl font-bold mb-2 ${stat.color} drop-shadow-sm`}>{stat.value}</div>
              <div className="text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}