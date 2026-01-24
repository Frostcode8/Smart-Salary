import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, TrendingUp, Shield, Sparkles, ArrowRight, 
  Lock, CreditCard, MousePointer2, Briefcase, Zap, CheckCircle2
} from 'lucide-react';

// 🔢 Animated Counter Component
const CountUp = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // Easing function for smooth stop
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span className="tabular-nums">₹{count.toLocaleString('en-IN')}</span>;
};

export default function LandingPage({ onNavigate }) {
  const [salary, setSalary] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState('');
  const [goal, setGoal] = useState('save'); // 'save', 'debt', 'invest'
  const [showTeaser, setShowTeaser] = useState(false);
  const [potentialSavings, setPotentialSavings] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 🖱️ Interactive Background Logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize coordinates (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const calculateTeaser = () => {
    if (!salary) return;
    const salaryNum = parseFloat(salary);
    const expenseNum = parseFloat(fixedExpenses) || 0;
    
    if (isNaN(salaryNum) || salaryNum < 1000) return;

    // 🧮 Logic: Target 20% savings minimum, adjusted by reality
    let projected = salaryNum * 0.20;
    const remaining = salaryNum - expenseNum;
    
    // Safety cap: Don't promise more than 50% of remaining cash
    if (projected > remaining) {
      projected = Math.max(0, remaining * 0.5);
    }

    setPotentialSavings(Math.round(projected));
    setShowTeaser(true);
  };

  const getTeaserText = () => {
    if (goal === 'debt') return <>Free up <span className="text-emerald-400 font-bold"><CountUp end={potentialSavings} /></span> monthly to crush loans.</>;
    if (goal === 'invest') return <>Invest <span className="text-emerald-400 font-bold"><CountUp end={potentialSavings} /></span> monthly for early retirement.</>;
    return <>Save <span className="text-emerald-400 font-bold"><CountUp end={potentialSavings} /></span> more every single month.</>;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden selection:bg-violet-500/30 font-sans relative flex flex-col">
      
      {/* 🌌 Interactive Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-violet-600/20 rounded-full blur-[100px] transition-transform duration-100 ease-out"
          style={{ transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-fuchsia-600/20 rounded-full blur-[100px] transition-transform duration-100 ease-out"
          style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}
        />
      </div>

      {/* 🧭 Navbar */}
      <nav className="relative z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
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

      {/* 🏗️ Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 flex-grow flex flex-col justify-center w-full pb-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
          
          {/* 👈 Left Column: Text & Steps */}
          <div className="space-y-10 text-center lg:text-left">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-violet-500/20 text-violet-300 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                Stop guessing. Get a personalized financial roadmap powered by smart algorithms to hit your goals faster.
              </p>
            </div>

            {/* 👇 How it works Icons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 sm:gap-12 pt-4">
              {[
                { icon: Briefcase, label: "Enter Salary" },
                { icon: Zap, label: "AI Analysis" },
                { icon: CheckCircle2, label: "Get Roadmap" }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-3 group">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-violet-500/20 group-hover:border-violet-500/50 transition-all duration-300">
                     <step.icon className="w-5 h-5 text-gray-400 group-hover:text-violet-300" />
                   </div>
                   <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 👉 Right Column: The Form Card */}
          <div className="relative perspective-1000">
            {/* 🖼️ Dashboard Preview Blur (The "What you get") */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[30px] opacity-40 blur-sm transform scale-95 translate-y-4 -z-10 border border-white/10 flex flex-col p-4 overflow-hidden pointer-events-none">
               {/* Fake UI Elements */}
               <div className="h-8 w-1/3 bg-white/10 rounded-lg mb-4"></div>
               <div className="flex gap-4 mb-4">
                 <div className="h-32 w-1/2 bg-emerald-500/20 rounded-xl"></div>
                 <div className="h-32 w-1/2 bg-blue-500/20 rounded-xl"></div>
               </div>
               <div className="h-full w-full bg-white/5 rounded-xl"></div>
            </div>

            {/* Main Card */}
            <div className="bg-[#0f111a]/90 backdrop-blur-xl border border-white/10 rounded-[30px] p-8 shadow-2xl relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
              
              {/* 🎯 Goal Selector */}
              <div className="mb-8">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">What is your primary goal?</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-black/20 rounded-xl">
                  {[
                    { id: 'save', label: 'Save Money', icon: DollarSign },
                    { id: 'debt', label: 'Clear Debt', icon: Shield },
                    { id: 'invest', label: 'Invest', icon: TrendingUp }
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg text-xs font-medium transition-all ${
                        goal === g.id 
                          ? 'bg-white/10 text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <g.icon className={`w-4 h-4 ${goal === g.id ? 'text-violet-400' : ''}`} />
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {/* 💰 Salary Input & Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-gray-300">Monthly Income</label>
                    <span className="text-xs text-violet-400 font-mono bg-violet-500/10 px-2 py-0.5 rounded">₹{Number(salary).toLocaleString()}</span>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-xl font-semibold text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-all"
                      placeholder="50000"
                    />
                  </div>
                  <input 
                    type="range" 
                    min="10000" max="500000" step="5000" 
                    value={salary || 10000} 
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                </div>

                {/* 🏠 Expenses Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Fixed Expenses (EMI / Rent)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
                    <input
                      type="number"
                      value={fixedExpenses}
                      onChange={(e) => setFixedExpenses(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-xl font-semibold text-white placeholder-gray-600 outline-none focus:border-violet-500/50 transition-all"
                      placeholder="15000"
                    />
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={calculateTeaser}
                  disabled={!salary}
                  className="w-full mt-2 py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-100 transform hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group"
                >
                  Generate Plan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* 🔒 Privacy Micro-copy */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider">
                  <Lock className="w-3 h-3" />
                  No Spam. Data stays private.
                </div>
              </div>

              {/* ✨ Teaser Overlay */}
              {showTeaser && (
                <div className="absolute inset-0 z-20 backdrop-blur-xl bg-[#0f111a]/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                   {/* Confetti-like glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-transparent animate-pulse" />
                  
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30 scale-110">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">Plan Ready!</h3>
                  <p className="text-gray-300 mb-8 max-w-xs text-lg leading-relaxed">
                    {getTeaserText()}
                  </p>

                  <button
                    onClick={() => onNavigate('register')}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all relative z-10"
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
      </main>

      {/* 🦶 Minimal Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-gray-600 border-t border-white/5">
         <div className="flex justify-center gap-6">
            <span className="cursor-pointer hover:text-gray-400">Privacy Policy</span>
            <span className="cursor-pointer hover:text-gray-400">Terms of Service</span>
            <span>© 2024 SmartSalary</span>
         </div>
      </footer>
    </div>
  );
}