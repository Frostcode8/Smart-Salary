import React, { useEffect, useMemo, useState } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  Timestamp,
  deleteDoc,
  updateDoc,
  setDoc,
  writeBatch,
  arrayUnion,
  getDoc,
  getDocs
} from "firebase/firestore";
import {
  LogOut,
  Plus,
  Loader2,
  TrendingUp,
  X,
  Activity,
  CheckCircle,
  Wallet,
  ArrowDown,
  Trash2,
  ShoppingBag,
  Coffee,
  Car,
  Film,
  Zap,
  Home,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  IndianRupee,
  Sparkles,
  ShoppingCart,
  Clock,
  Target,
  GraduationCap,
  History,
  Layers,
  HelpCircle,
  RefreshCw,
  Lock,
  Trophy,
  Flame,
  Swords,
  Shield,
  PieChart as IconPieChart,
  ToggleLeft,
  ToggleRight,
  Info,
  Award,
  DollarSign
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  YAxis,
  AreaChart,
  Area,
  ComposedChart,
  Line
} from "recharts";

// ------------------------------------------------------------------
// 🔥 FIREBASE INITIALIZATION (Inline for Single File Environment)
// ------------------------------------------------------------------
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// ✅ FIXED: Check if app already exists before initializing to prevent "duplicate-app" error
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const GEMINI_API_KEY = "AIzaSyAfiqB6IQz8R7Ftstjxc2EShKMs8vHU4dI";

// ------------------------------------------------------------------
// 🧩 COMPONENT: InvestmentPlans
// ------------------------------------------------------------------
function InvestmentPlans({ open, onClose, income }) {
  const [showPersonalized, setShowPersonalized] = useState(true);

  if (!open) return null;

  // 💰 Calculations for User-Centric Data
  const monthlyInvestable = Math.round(income * 0.20); // 20% of income rule
  const sipAmount = Math.round(monthlyInvestable * 0.60); // 60% of savings to Equity
  const safeAmount = Math.round(monthlyInvestable * 0.30); // 30% to Debt/PPF
  const goldAmount = Math.round(monthlyInvestable * 0.10); // 10% to Gold

  // 📄 Content Data
  const plans = [
    {
      title: "Wealth Creation (High Growth)",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      desc: "Best for long-term goals (>5 years). Equity Mutual Funds offer high returns over time.",
      userAmount: `₹${sipAmount.toLocaleString()}/mo`,
      genericText: "Start an SIP with 10-15% of your salary in Index Funds or Flexi-cap Funds."
    },
    {
      title: "Safety Net (Risk-Free)",
      icon: Shield,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      desc: "Guaranteed returns. PPF (Public Provident Fund) or recurring deposits.",
      userAmount: `₹${safeAmount.toLocaleString()}/mo`,
      genericText: "Allocate 5-10% to PPF or Govt Bonds. Essential for stability."
    },
    {
      title: "Gold / Hedge",
      icon: Award,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      desc: "Hedge against inflation. Sovereign Gold Bonds (SGB) earn 2.5% interest + appreciation.",
      userAmount: `₹${goldAmount.toLocaleString()}/mo`,
      genericText: "Buy digital gold or SGBs with 5% of monthly income. Avoid jewelry for investment."
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f111a] border border-white/10 rounded-none sm:rounded-[2rem] w-full max-w-4xl h-full sm:h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#121215]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <IconPieChart className="w-5 h-5 text-violet-400" />
              Investment Strategy
            </h2>
            <p className="text-xs text-gray-400 mt-1">Smart allocation based on financial best practices</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Toggle Switch */}
            <button 
              onClick={() => setShowPersonalized(!showPersonalized)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs text-gray-300"
            >
              {showPersonalized ? <ToggleRight className="w-4 h-4 text-violet-400" /> : <ToggleLeft className="w-4 h-4 text-gray-500" />}
              {showPersonalized ? "User Centric Mode" : "General Mode"}
            </button>

            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Mobile Toggle (Visible only on small screens) */}
        <div className="sm:hidden px-6 py-3 border-b border-white/5 bg-[#121215]">
           <button 
              onClick={() => setShowPersonalized(!showPersonalized)}
              className="flex w-full justify-between items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-gray-300"
            >
              <span>{showPersonalized ? "Showing Your Numbers" : "Showing General Rules"}</span>
              {showPersonalized ? <ToggleRight className="w-5 h-5 text-violet-400" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f] space-y-6">
          
          {/* Summary Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border border-violet-500/20 text-center">
            <p className="text-sm text-violet-200 uppercase tracking-wider font-semibold mb-2">Total Monthly Investment Potential</p>
            <h3 className="text-4xl font-bold text-white mb-2">
              {showPersonalized ? `₹${monthlyInvestable.toLocaleString()}` : "20% of Salary"}
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {showPersonalized 
                ? "Based on your income, this is the recommended amount to set aside for future growth." 
                : "Financial experts recommend saving at least 20% of your income strictly for investments."}
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div key={index} className={`p-5 rounded-2xl border ${plan.bg} ${plan.border} flex flex-col`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-black/20 ${plan.color}`}>
                    <plan.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">{plan.title}</h4>
                </div>
                
                <div className="mb-4">
                  <span className={`text-2xl font-bold ${plan.color}`}>
                    {showPersonalized ? plan.userAmount : "Allocation Rule"}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-4 flex-1">
                  {showPersonalized ? plan.desc : plan.genericText}
                </p>

                {showPersonalized && (
                  <div className="mt-auto pt-3 border-t border-white/5">
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Recommended Action
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="text-[10px] text-gray-600 text-center pt-8 pb-4">
            Disclaimer: This is generated advice based on standard financial principles. 
            Please consult a certified financial advisor before making actual investments.
          </div>

        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 🧩 COMPONENT: AIRoadmap
// ------------------------------------------------------------------

// 🎨 Circular Progress Component
const ProgressRing = ({ radius, stroke, progress, color }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg] absolute inset-0"
      >
        <circle
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s ease-in-out" }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={color}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className={`text-sm font-bold ${color}`}>{Math.round(progress)}%</span>
        <span className="text-[8px] text-gray-500 uppercase tracking-tighter">Progress</span>
      </div>
    </div>
  );
};

// Helper for date suffixes (1st, 2nd, 3rd)
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function AIRoadmap({
  open,
  onClose,
  user,
  monthData,
  records,
  selectedMonthKey
}) {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [mode, setMode] = useState(null);
  const [whyText, setWhyText] = useState("");
  const [whyLoading, setWhyLoading] = useState(false);
  const [activeStepInfo, setActiveStepInfo] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false); // New state for regeneration flow
  
  // 🎮 Difficulty State
  const [difficulty, setDifficulty] = useState("Normal");

  // Safe data access
  const safeMonthData = monthData || {};
  const safeBudgetPlan = safeMonthData.budgetPlan || {};

  // -----------------------------
  // 🧠 USER CONTEXT CALCULATIONS
  // -----------------------------
  const income = parseFloat(safeMonthData.income || 0);
  const emi = parseFloat(safeMonthData.emi || 0);
  const score = safeMonthData.score || 0;
  const isFirstSalary = safeMonthData.firstSalary === true;
  
  const needsLimit = safeBudgetPlan.needs || 0;
  const wantsLimit = safeBudgetPlan.wants || 0;
  const savingsTarget = safeBudgetPlan.savings || 0;
  const emergencyTarget = safeBudgetPlan.emergency || 0;

  const currentMonthExpenses = useMemo(() => {
    if (!records) return [];
    return records.filter(r => {
      const m = r.createdAt?.seconds
        ? new Date(r.createdAt.seconds * 1000).toISOString().slice(0, 7)
        : "";
      return m === selectedMonthKey && r.type === "expense";
    });
  }, [records, selectedMonthKey]);

  const needsUsed = useMemo(() => {
    const expenses = currentMonthExpenses
      .filter(r => (r.needType || "need") === "need")
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    return expenses + emi; 
  }, [currentMonthExpenses, emi]);

  const wantsUsed = useMemo(() => currentMonthExpenses
    .filter(r => r.needType === "want")
    .reduce((s, r) => s + r.amount, 0), [currentMonthExpenses]);

  const shoppingTotal = useMemo(() => currentMonthExpenses
    .filter(r => r.category === "Shopping")
    .reduce((s, r) => s + r.amount, 0), [currentMonthExpenses]);

  const totalExpense = useMemo(() => currentMonthExpenses
    .reduce((sum, r) => sum + (r.amount || 0), 0), [currentMonthExpenses]);

  const realSavings = income - needsUsed - wantsUsed;
  const savingsGap = savingsTarget - realSavings;
  const impulseCount = safeMonthData.impulseHistory?.length || 0;

  // ⏱️ Time Left Calculation (Fixed)
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonthKey.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonthKey]);

  const todayDate = new Date().getDate();
  
  // ✅ NEW LOGIC: Detect Past, Present, Future
  const currentMonthKey = new Date().toISOString().slice(0,7);
  const isCurrentMonth = selectedMonthKey === currentMonthKey;
  const isPastMonth = selectedMonthKey < currentMonthKey;
  const isFutureMonth = selectedMonthKey > currentMonthKey;

  const daysLeft = isCurrentMonth
    ? Math.max(0, daysInMonth - todayDate)
    : isFutureMonth
      ? daysInMonth // Future: Full month available
      : 0;          // Past: Month ended

  const monthProgress = Math.min(100, (todayDate / daysInMonth) * 100);

  // -----------------------------
  // 📂 GENERATE OR LOAD ROADMAP
  // -----------------------------
  useEffect(() => {
    if (!open || !monthData || !user) return;

    const fetchRoadmap = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "users", user.uid, "roadmaps", selectedMonthKey);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setMode(data.mode);
          setRoadmap(data.weekly_roadmap);
          // Set difficulty if it exists in saved data, else default
          if (data.difficulty) setDifficulty(data.difficulty);
          if (data.verdict) setVerdict(data.verdict);
        } else {
          setRoadmap(null);
        }
      } catch (error) {
        console.error("Error loading roadmap:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [open, selectedMonthKey, user, monthData]);

  // -----------------------------
  // 🧠 AI GENERATION LOGIC
  // -----------------------------
  const generateRoadmap = async () => {
    setLoading(true);
    try {
      const promptData = {
        MONTH: selectedMonthKey,
        INCOME: income,
        SAVINGS_GAP: savingsGap,
        SCORE: score,
        FIRST_SALARY: isFirstSalary,
        WANTS_USED: wantsUsed,
        WANTS_LIMIT: wantsLimit,
        IMPULSE_COUNT: impulseCount,
        DIFFICULTY: difficulty // 🎮 Passing Difficulty to AI
      };

      const prompt = `
        Create a 4-week financial roadmap JSON for month ${selectedMonthKey}.
        User Data: ${JSON.stringify(promptData)}

        STRICT RULES:
        1. Mode Logic (Pick ONE):
           - "Foundation Mode" (Blue) if first_salary=true or no history
           - "Damage Control Mode" (Red) if savings < 0 or score < 40
           - "Correction Mode" (Amber) if wants > limit
           - "Discipline Mode" (Violet) if impulse > 3
           - "Growth Mode" (Green) otherwise
        
        2. Difficulty Adjustment:
           - "Easy": Fewer tasks (max 3/week), very lenient limits. Focus on quick wins.
           - "Normal": Balanced (approx 4-5 tasks/week). Standard limits.
           - "Hard": Stricter limits (cut wants by 20%), more tasks (6/week). Score impact should be 1.5x higher.

        3. Output Format (JSON ONLY):
        {
          "mode": "String",
          "weekly_roadmap": [
            {
              "week": 1,
              "focus": "string",
              "actions": [
                {
                  "id": "W1-A1",
                  "task": "string (e.g. Spend ≤ ₹3000 in Food)",
                  "deadline_day": 7,
                  "success_condition": "string",
                  "score_impact_if_completed": 5, // Scale this based on Difficulty
                  "score_impact_if_ignored": -5,
                  "completed": false
                }
              ]
            }
          ]
        }
        
        4. Task Format: Use EXACT phrase "Spend ≤ ₹X in CATEGORY" so I can parse it for progress bars.
      `;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      const data = await res.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const aiPlan = JSON.parse(text);

        const ref = doc(db, "users", user.uid, "roadmaps", selectedMonthKey);
        await setDoc(ref, { 
          ...aiPlan, 
          difficulty, // Save difficulty preference
          createdAt: new Date().toISOString() 
        });

        setMode(aiPlan.mode);
        setRoadmap(aiPlan.weekly_roadmap);
        setIsRegenerating(false); // Reset regeneration state
      }
    } catch (error) {
      console.error("AI Gen Error", error);
      alert("AI Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (wIdx, aIdx) => {
    if (!roadmap) return;
    const newMap = [...roadmap];
    newMap[wIdx].actions[aIdx].completed = !newMap[wIdx].actions[aIdx].completed;
    setRoadmap(newMap);
    await updateDoc(doc(db, "users", user.uid, "roadmaps", selectedMonthKey), { weekly_roadmap: newMap });
  };

  const explainWhy = async (task, id) => {
    if (activeStepInfo === id) { setActiveStepInfo(null); return; }
    setActiveStepInfo(id);
    setWhyLoading(true);
    
    // Quick tailored response based on mode
    const text = mode === "Damage Control Mode" ? "Stops the bleeding immediately." : 
                 mode === "Growth Mode" ? "Accelerates your wealth compounding." :
                 "Builds the habit necessary for your next financial level.";
    
    // Simulate AI delay for trust
    setTimeout(() => {
        setWhyText(text);
        setWhyLoading(false);
    }, 800);
  };

  // -----------------------------
  // 🎨 STYLING & PARSING
  // -----------------------------
  const getModeInfo = (m) => {
    switch(m) {
      case "Foundation Mode": return { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/50 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]" };
      case "Damage Control Mode": return { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/50 shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]" };
      case "Correction Mode": return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/50 shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]" };
      case "Discipline Mode": return { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/50 shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)]" };
      case "Growth Mode": return { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]" };
      default: return { color: "text-gray-400", bg: "bg-gray-800", border: "border-gray-700" };
    }
  };

  const modeStyle = getModeInfo(mode);

  // 📊 Calculate Stats
  const totalTasks = roadmap ? roadmap.reduce((acc, w) => acc + w.actions.length, 0) : 0;
  const completedTasks = roadmap ? roadmap.reduce((acc, w) => acc + w.actions.filter(a => a.completed).length, 0) : 0;
  const progressPct = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
  
  const ringColor = progressPct > 70 ? "text-emerald-500" : progressPct > 40 ? "text-amber-500" : "text-red-500";

  const potentialReward = roadmap ? roadmap.reduce((acc, w) => acc + w.actions.reduce((s, a) => s + (a.score_impact_if_completed || 0), 0), 0) : 0;
  const potentialPenalty = roadmap ? roadmap.reduce((acc, w) => acc + w.actions.reduce((s, a) => s + (a.score_impact_if_ignored || 0), 0), 0) : 0;

  // 🕵️ Parse "Spend <= X in Category" to get progress
  const getTaskProgress = (taskStr) => {
    // Regex to find "Spend <= 3000 in Food" or similar
    const match = taskStr.match(/Spend\s*(?:≤|<=)\s*[₹]?([\d,]+)\s*in\s*(\w+)/i);
    if (match) {
        const limit = parseFloat(match[1].replace(/,/g, ''));
        const category = match[2];
        
        // Calculate used for this category
        const used = currentMonthExpenses
            .filter(r => r.category.toLowerCase() === category.toLowerCase())
            .reduce((s, r) => s + r.amount, 0);
            
        return { used, limit, category };
    }
    return null;
  };

  // 🎮 Difficulty Color Helper
  const getDifficultyColor = (level) => {
    switch (level) {
      case "Easy": return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_-2px_rgba(16,185,129,0.3)]";
      case "Normal": return "bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_-2px_rgba(59,130,246,0.3)]";
      case "Hard": return "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_10px_-2px_rgba(239,68,68,0.3)]";
      default: return "";
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f111a] border border-white/10 rounded-none sm:rounded-[2rem] w-full max-w-4xl h-full sm:h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* 🎯 1. Header with Mode Badge */}
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121215]">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors sm:hidden">
                <X className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Monthly Roadmap
                <span className="text-xs text-gray-500 font-normal bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {selectedMonthKey}
                </span>
              </h2>
              {mode && !isRegenerating && (
                <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${modeStyle.bg} ${modeStyle.color} ${modeStyle.border} animate-[pulse_3s_infinite]`}>
                  <Sparkles className="w-3 h-3" />
                  Current Mode: {mode}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
             {/* 📊 2. Progress Ring - Only show if not regenerating */}
             {!isRegenerating && (
               <div className="flex items-center gap-3">
                 <ProgressRing radius={28} stroke={4} progress={progressPct} color={ringColor} />
                 <div className="hidden sm:block">
                   <p className="text-xs text-gray-400">Tasks Completed</p>
                   <p className="text-sm font-bold text-white">{completedTasks} / {totalTasks}</p>
                 </div>
               </div>
             )}
             
             <div className="flex items-center gap-2">
                {/* 🔄 Regenerate Button */}
                {roadmap && !isRegenerating && (
                  <button 
                    onClick={() => setIsRegenerating(true)} 
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-violet-400 hover:text-violet-300"
                    title="Regenerate Roadmap"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
                {isRegenerating && (
                  <button 
                    onClick={() => setIsRegenerating(false)} 
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-gray-300"
                    title="Cancel Regeneration"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button onClick={onClose} className="hidden sm:block p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
             </div>
          </div>
        </div>

        {/* ⏱️ 5. Time Left Bar (Updated Logic) */}
        <div className="px-6 py-2 bg-black/40 border-b border-white/5 flex items-center gap-4">
            <span className="text-xs text-gray-400 flex items-center gap-1 min-w-fit">
                <Clock className="w-3 h-3" /> 
                {daysLeft > 0 
                  ? `${daysLeft} days ${isFutureMonth ? 'available' : 'left'}` 
                  : isPastMonth 
                    ? "Month Ended" 
                    : "Last Day"}
            </span>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${daysLeft < 5 && !isFutureMonth ? "bg-red-500" : "bg-violet-500"}`} 
                    style={{ width: `${isFutureMonth ? 100 : isCurrentMonth ? (100 - monthProgress) : 0}%` }} 
                />
            </div>
        </div>

        {/* 🏆 6 & 7. Rewards & Consequences */}
        {roadmap && !isRegenerating && (
            <div className="grid grid-cols-2 border-b border-white/5">
                <div className="p-3 text-center border-r border-white/5 bg-emerald-500/5">
                    <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-1 flex items-center justify-center gap-1">
                        <Trophy className="w-3 h-3" /> Reward Preview
                    </p>
                    <p className="text-xs text-gray-400">Complete all → <span className="text-white font-bold">+{potentialReward} Score</span></p>
                </div>
                <div className="p-3 text-center bg-red-500/5">
                    <p className="text-[10px] text-red-400 uppercase tracking-wider font-bold mb-1 flex items-center justify-center gap-1">
                        <Flame className="w-3 h-3" /> Failure Risk
                    </p>
                    <p className="text-xs text-gray-400">Miss 2 tasks → <span className="text-white font-bold">{potentialPenalty} Score</span></p>
                </div>
            </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-white/10 bg-[#0a0a0f]">
          {(!roadmap || isRegenerating) ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse ring-4 ring-violet-500/10">
                <Target className="w-10 h-10 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{isRegenerating ? "Regenerate Roadmap" : "Analyze & Plan"}</h3>
              <p className="text-gray-400 max-w-xs mb-6 text-sm">
                AI is ready to analyze your {selectedMonthKey} spending and build a winning strategy.
              </p>

              {/* 🎮 Difficulty Toggle */}
              <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-xl border border-white/10 w-full max-w-xs shadow-inner">
                {["Easy", "Normal", "Hard"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      difficulty === level
                        ? getDifficultyColor(level)
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <button
                onClick={generateRoadmap}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-bold text-white shadow-lg shadow-violet-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? "Analyzing..." : "Generate Roadmap"}
              </button>
            </div>
          ) : (
            <div className="space-y-8 pb-10">
              {/* Difficulty Indicator in Header */}
              <div className="flex justify-end mb-2">
                 <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${getDifficultyColor(difficulty)}`}>
                    {difficulty} Mode
                 </span>
              </div>

              {roadmap.map((weekData, wIdx) => (
                <div key={wIdx} className="relative pl-6 sm:pl-8 border-l border-white/10">
                  <div className={`absolute -left-[14px] top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                      weekData.actions.every(a => a.completed) 
                      ? "bg-emerald-500 border-emerald-400 text-black" 
                      : "bg-[#18181b] border-white/20 text-gray-500"
                  }`}>
                    {weekData.actions.every(a => a.completed) ? <CheckCircle className="w-4 h-4" /> : `W${weekData.week}`}
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-white">{weekData.focus}</h4>
                  </div>

                  {/* 📋 3. Task Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weekData.actions.map((action, aIdx) => {
                      const progressData = getTaskProgress(action.task);
                      const isOverdue = !action.completed && todayDate > action.deadline_day;
                      
                      // Card Status Logic
                      let statusText = "Pending";
                      let statusColor = "text-gray-400 bg-white/5 border-white/10";
                      
                      if (action.completed) {
                          statusText = "Completed";
                          statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                      } else if (isOverdue) {
                          statusText = "Failed";
                          statusColor = "text-red-400 bg-red-500/10 border-red-500/20";
                      } else if (progressData) {
                          // If we have data tracking, determine if 'On Track'
                          const pct = (progressData.used / progressData.limit) * 100;
                          if (pct > 100) {
                              statusText = "Failed"; // Strict rule: > 100% = Failed
                              statusColor = "text-red-400 bg-red-500/10 border-red-500/20";
                          } else {
                              statusText = "On Track";
                              statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                          }
                      }

                      return (
                        <div 
                          key={aIdx} 
                          className={`
                            p-4 rounded-2xl border transition-all duration-300 relative group overflow-hidden
                            ${action.completed ? "bg-emerald-900/10 border-emerald-500/30 opacity-75" : "bg-white/5 border-white/5 hover:border-violet-500/30 hover:bg-white/10"}
                          `}
                        >
                          {/* Top Row: Title & Checkbox */}
                          <div className="flex justify-between items-start mb-3">
                            <h5 className={`font-semibold text-sm leading-snug pr-8 ${action.completed ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                                {action.task}
                            </h5>
                            <button
                              onClick={() => toggleTask(wIdx, aIdx)}
                              className={`
                                absolute top-4 right-4 w-6 h-6 rounded-full border flex items-center justify-center transition-all
                                ${action.completed ? "bg-emerald-500 border-emerald-500" : "border-white/30 hover:border-white"}
                              `}
                            >
                              {action.completed && <CheckCircle className="w-4 h-4 text-black" />}
                            </button>
                          </div>

                          {/* 📊 Dynamic Progress Bar (If applicable) */}
                          {progressData && !action.completed && (
                              <div className="mb-3">
                                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                      <span>Spent: ₹{progressData.used.toLocaleString()}</span>
                                      <span>Limit: ₹{progressData.limit.toLocaleString()}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${progressData.used > progressData.limit ? "bg-red-500" : "bg-violet-500"}`}
                                        style={{ width: `${Math.min(100, (progressData.used / progressData.limit) * 100)}%` }}
                                      />
                                  </div>
                              </div>
                          )}

                          {/* Footer: Status, Deadline, Why */}
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                             <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${statusColor} font-medium`}>
                                    {statusText}
                                </span>
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {action.deadline_day}{getOrdinal(action.deadline_day)}
                                </span>
                             </div>

                             {/* 🧠 4. Why Panel Button */}
                             <button
                               onClick={() => explainWhy(action.task, action.id)}
                               className="text-gray-500 hover:text-violet-400 transition-colors"
                             >
                               <HelpCircle className="w-4 h-4" />
                             </button>
                          </div>

                          {/* Why Content Overlay */}
                          {activeStepInfo === action.id && (
                              <div className="absolute inset-0 bg-[#18181b] z-10 p-4 flex flex-col justify-center items-center text-center animate-in fade-in duration-200">
                                  {whyLoading ? (
                                      <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                                  ) : (
                                      <>
                                        <p className="text-sm text-gray-300 italic mb-3">"{whyText}"</p>
                                        <button 
                                          onClick={() => setActiveStepInfo(null)}
                                          className="text-xs text-violet-400 hover:underline"
                                        >
                                            Close
                                        </button>
                                      </>
                                  )}
                              </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 📊 MAIN COMPONENT: Dashboard
// ------------------------------------------------------------------

const Dashboard = ({ user, onLogout, currentMonthKey: initialMonthKey }) => {
  // 🗓️ Month Selection State
  const [selectedMonthKey, setSelectedMonthKey] = useState(initialMonthKey);
  const [firstMonthKey, setFirstMonthKey] = useState(null);
  
  const [monthData, setMonthData] = useState(null); 
  const [loadingMonthData, setLoadingMonthData] = useState(true); 

  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showMonthSetupForm, setShowMonthSetupForm] = useState(false); 
  const [showImpulseModal, setShowImpulseModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false); 
  const [checkingImpulse, setCheckingImpulse] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showInvestmentPlans, setShowInvestmentPlans] = useState(false); // ✅ Investment Modal State

  // 🆕 Change 1: New State Variables for Quick Fill
  const [lastFilledMonthData, setLastFilledMonthData] = useState(null);
  const [checkingLastMonth, setCheckingLastMonth] = useState(false);

  // Impulse State
  const [impulseItem, setImpulseItem] = useState({ name: "", price: "" });
  const [impulseResult, setImpulseResult] = useState(null);

  // Setup Form State
  const [setupFormData, setSetupFormData] = useState({
    income: '',
    emi: ''
  });
  const [setupLoading, setSetupLoading] = useState(false);

  // Format the selected month name
  const monthName = new Date(selectedMonthKey + "-01").toLocaleString('default', { month: 'long', year: 'numeric' });
  const userName = user.displayName ? user.displayName.split(' ')[0] : 'User';

  const categories = [
    { name: "Food", icon: Coffee, color: "text-amber-400", bg: "bg-amber-400/10" },
    { name: "Travel", icon: Car, color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Entertainment", icon: Film, color: "text-purple-400", bg: "bg-purple-400/10" },
    { name: "Shopping", icon: ShoppingBag, color: "text-pink-400", bg: "bg-pink-400/10" },
    { name: "Bills", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { name: "Rent", icon: Home, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { name: "Other", icon: MoreHorizontal, color: "text-gray-400", bg: "bg-gray-400/10" }
  ];

  // ✅ 1️⃣ Updated Transaction State with needType
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    category: "Food",
    needType: "need", // Default to need
    transactionDate: new Date().toISOString().split("T")[0],
  });

  // 🔄 Month Navigation Handlers
  const changeMonth = (offset) => {
    const date = new Date(selectedMonthKey + "-01");
    date.setMonth(date.getMonth() + offset);
    const newKey = date.toISOString().slice(0, 7);
    
    // ✅ Prevent going before first month
    if (firstMonthKey && newKey < firstMonthKey) {
      return; // Don't allow navigation before first month
    }
    
    setSelectedMonthKey(newKey);
  };

  const handleMonthInput = (e) => {
    setSelectedMonthKey(e.target.value);
  }

  // -----------------------------
  // 🔥 Firestore Listeners
  // -----------------------------
  
  // ✅ Fetch First Month Key
  useEffect(() => {
    if (!user) return;
    
    const fetchFirstMonth = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data()?.firstMonthKey) {
          setFirstMonthKey(userSnap.data().firstMonthKey);
        } else {
          // If not set, use the earliest month from months collection
          const monthsQuery = query(
            collection(db, 'users', user.uid, 'months'),
            orderBy('updatedAt', 'asc')
          );
          const monthsSnap = await getDocs(monthsQuery);
          
          if (!monthsSnap.empty) {
            const earliestMonthId = monthsSnap.docs[0].id;
            setFirstMonthKey(earliestMonthId);
            
            // Save it to user doc for future
            await updateDoc(userRef, { firstMonthKey: earliestMonthId });
          }
        }
      } catch (error) {
        console.error("Error fetching first month:", error);
      }
    };
    
    fetchFirstMonth();
  }, [user]);

  // 🆕 Change 3: Fetch Last Filled Month for Quick Fill
  useEffect(() => {
    if (!user || !showMonthSetupForm) return;

    const fetchLastFilledMonth = async () => {
      setCheckingLastMonth(true);
      try {
        // Get all months for this user, ordered by most recent
        const monthsQuery = query(
          collection(db, 'users', user.uid, 'months'),
          orderBy('updatedAt', 'desc')
        );
        const monthsSnap = await getDocs(monthsQuery);

        if (!monthsSnap.empty) {
          // Get the most recent month with data
          const lastMonth = monthsSnap.docs[0].data();
          const lastMonthKey = monthsSnap.docs[0].id;

          setLastFilledMonthData({
            ...lastMonth,
            monthKey: lastMonthKey,
            monthName: new Date(lastMonthKey + "-01").toLocaleString('default', {
               month: 'long',
               year: 'numeric'
             })
          });
        }
      } catch (error) {
        console.error("Error fetching last filled month:", error);
      } finally {
        setCheckingLastMonth(false);
      }
    };

    fetchLastFilledMonth();
  }, [user, showMonthSetupForm]);

  useEffect(() => {
    if (!user) return;

    setLoadingMonthData(true);
    const monthDocRef = doc(db, 'users', user.uid, 'months', selectedMonthKey);
    const unsubMonth = onSnapshot(monthDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setMonthData(docSnap.data());
      } else {
        setMonthData(null); 
      }
      setLoadingMonthData(false);
    });

    const q = query(
      collection(db, "users", user.uid, "financial_records"),
      orderBy("createdAt", "desc")
    );

    const unsubRecords = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setRecords(data);
      setLoadingRecords(false);
    });

    return () => {
      unsubMonth();
      unsubRecords();
    };
  }, [user, selectedMonthKey]); 

  // -----------------------------
  // 📊 Logic & Computations
  // -----------------------------

  const currentMonthRecords = useMemo(() => {
    return records.filter(r => {
      const recDate = r.createdAt?.seconds 
        ? new Date(r.createdAt.seconds * 1000).toISOString().slice(0,7) 
        : "";
      return recDate === selectedMonthKey && r.type === 'expense';
    });
  }, [records, selectedMonthKey]);

  const totalActualExpense = useMemo(() => {
    return currentMonthRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [currentMonthRecords]);

  // Derived values from Month Data
  const income = monthData ? parseFloat(monthData.income || 0) : 0;
  const emi = monthData ? parseFloat(monthData.emi || 0) : 0;
  const isFirstSalaryMode = monthData?.firstSalary === true;
  
  // Budget Limits
  const needsLimit = monthData?.budgetPlan?.needs || 0;
  const wantsLimit = monthData?.budgetPlan?.wants || 0;
  const savingsTarget = monthData?.budgetPlan?.savings || 0;
  const emergencyTarget = monthData?.budgetPlan?.emergency || 0;

  // 🧠 Smart Allocation Logic (Re-grouping expenses)
  // ✅ 4️⃣ & 6️⃣ Update Needs Calculation (Backward compatible)
  const needsUsed = useMemo(() => {
    const expenses = currentMonthRecords
      .filter(r => (r.needType || "need") === "need") // Defaults to 'need' if undefined
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    return expenses + emi; // EMI is a fixed need
  }, [currentMonthRecords, emi]);

  // ✅ 5️⃣ Update Wants Calculation
  const wantsUsed = useMemo(() => {
    return currentMonthRecords
      .filter(r => r.needType === "want")
      .reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [currentMonthRecords]);

  // Real Savings = Income - All Outflows
  const realSavings = income - needsUsed - wantsUsed;
  const savingsGap = savingsTarget - realSavings;
  const availableForSpending = Math.max(0, income - emi);
  const remainingSpendable = availableForSpending - totalActualExpense;
  
  // 🧠 Dynamic Score Calculation (Enforcing Behavior)
  const dynamicScore = useMemo(() => {
    if (!income || income <= 0) return 0;

    let score = 100;
    
    // 🥉 FIRST SALARY MODE: Score penalties are softer
    const penaltyMultiplier = isFirstSalaryMode ? 0.5 : 1; 

    // 1. Needs adherence (Over limit penalizes score)
    if (needsUsed > needsLimit) {
        const excessPercent = ((needsUsed - needsLimit) / (needsLimit || 1)) * 100;
        score -= Math.min(30, excessPercent * 0.5 * penaltyMultiplier); 
    }

    // 2. Wants adherence (Strict penalty)
    if (wantsUsed > wantsLimit) {
        const excessPercent = ((wantsUsed - wantsLimit) / (wantsLimit || 1)) * 100;
        score -= Math.min(40, excessPercent * 1.0 * penaltyMultiplier); 
    }

    // 3. Savings Gap (Penalty for missing target)
    if (realSavings < savingsTarget) {
        const gapPercent = ((savingsTarget - realSavings) / (income || 1)) * 100;
        score -= Math.min(30, gapPercent * 1.5 * penaltyMultiplier); 
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }, [income, needsUsed, needsLimit, wantsUsed, wantsLimit, realSavings, savingsTarget, isFirstSalaryMode]);

  // Update Score in DB
  useEffect(() => {
    if (monthData && Math.abs(monthData.score - dynamicScore) > 2) {
       const monthRef = doc(db, 'users', user.uid, 'months', selectedMonthKey);
       updateDoc(monthRef, { score: dynamicScore }).catch(console.error);
    }
  }, [dynamicScore, monthData, user.uid, selectedMonthKey]);

  const aiInsight = useMemo(() => {
    const safeDefault = { text: "Set up your plan to get started.", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" };
    if (!monthData) return safeDefault;
    
    // 🥉 FIRST SALARY MODE: Gentler Alerts
    if (isFirstSalaryMode) {
        if (realSavings < 0) return {
            text: "This month is for learning. Try reducing food spending next month to balance out.",
            color: "text-orange-300",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20"
        };
        if (wantsUsed > wantsLimit) return {
            text: "It's okay to enjoy your first salary, but keep an eye on subscriptions.",
            color: "text-blue-300",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        };
        if (dynamicScore >= 80) return {
            text: "Fantastic start! You're managing your first salary like a pro.",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        };
        return { 
            text: "First month is special. Observe where your money goes.", 
            color: "text-violet-200", 
            bg: "bg-white/5",
            border: "border-white/10"
        };
    }

    // 🚨 NORMAL MODE: Strict Alerts
    if (realSavings < 0) return { 
      text: "Warning: You are spending more than you earn!", 
      color: "text-red-400", 
      bg: "bg-red-500/10",
      border: "border-red-500/20"
    };
    if (wantsUsed > wantsLimit) return {
      text: "You've exceeded your wants budget. Cut back on discretionary spending.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    };
    if (dynamicScore >= 80) return {
      text: "Great job! You are hitting your savings goals perfectly.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    };
    return { 
      text: monthData?.aiAdviceText || "Track expenses to stay on target.", 
      color: "text-violet-200", 
      bg: "bg-white/5",
      border: "border-white/10"
    };
  }, [realSavings, wantsUsed, wantsLimit, dynamicScore, monthData, isFirstSalaryMode]);

  const expenseByCategory = useMemo(() => {
    const map = currentMonthRecords.reduce((acc, r) => {
      const cat = r.category || "Other";
      acc[cat] = (acc[cat] || 0) + (r.amount || 0);
      return acc;
    }, {});

    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthRecords]);

  // Trend Data
  const trendData = useMemo(() => {
    const map = {};
    records.forEach(r => {
      if (r.type !== 'expense') return;
      const date = r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : null;
      if (!date) return;
      
      const key = date.toLocaleString('default', { month: 'short' }); 
      const sortKey = date.toISOString().slice(0, 7); 
      
      if (!map[sortKey]) map[sortKey] = { month: key, amount: 0, sortKey };
      map[sortKey].amount += r.amount;
    });

    const sortedMonths = Object.values(map).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return sortedMonths.map((item, index) => {
      const prevItem = sortedMonths[index - 1];
      return {
        ...item,
        amount: Math.round(item.amount),
        prevAmount: prevItem ? Math.round(prevItem.amount) : 0 
      };
    }).slice(-6); 
  }, [records]);

  // -----------------------------
  // 📆 Calendar View Logic
  // -----------------------------
  const calendarData = useMemo(() => {
    if (!selectedMonthKey) return [];
    
    try {
        const parts = selectedMonthKey.split("-");
        if (parts.length !== 2) return [];
        
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        
        const daysInMonth = new Date(year, month, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        
        // Map spending per day
        const spendingMap = {};
        currentMonthRecords.forEach(r => {
          if (!r.createdAt) return;
          // Safe date parsing
          const seconds = r.createdAt.seconds || 0;
          const day = new Date(seconds * 1000).getDate();
          
          if (!spendingMap[day]) {
            spendingMap[day] = { amount: 0, items: [] };
          }
          spendingMap[day].amount += r.amount;
          spendingMap[day].items.push(`${r.description} (₹${r.amount})`);
        });
    
        return days.map(day => ({
          day,
          amount: spendingMap[day]?.amount || 0,
          items: spendingMap[day]?.items || []
        }));
    } catch (e) {
        console.error("Calendar Data Error", e);
        return [];
    }
  }, [currentMonthRecords, selectedMonthKey]);

  const getDayColor = (amount) => {
    if (amount === 0) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20";
    if (amount < 1000) return "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20";
    if (amount < 5000) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20";
  };

  // -----------------------------
  // 🧠 1️⃣ AI Impulse Tracker (Final Spec)
  // -----------------------------
  const handleCheckImpulse = async () => {
    if (!impulseItem.name || !impulseItem.price) return;
    if (!GEMINI_API_KEY) {
      alert("Please add GEMINI_API_KEY in code.");
      return;
    }
    setCheckingImpulse(true);

    try {
      const price = parseFloat(impulseItem.price);
      
      const prompt = `
        You are a strict financial lie detector.
        User context:
        - Monthly Income: ₹${income}
        - Savings Target: ₹${savingsTarget}
        - Emergency Fund Goal: ₹${emergencyTarget}
        - Current Real Savings: ₹${realSavings}
        - Money Health Score: ${dynamicScore}
        
        The user wants to buy "${impulseItem.name}" for ₹${price}.
        
        Calculate the impact and return ONLY JSON:
        {
          "savingsBefore": ${realSavings},
          "savingsAfter": ${realSavings - price},
          "scoreBefore": ${dynamicScore},
          "scoreAfter": ${Math.max(0, dynamicScore - Math.round((price/income)*20))}, 
          "emergencyDelayDays": ${Math.round(price / (income/30 || 1))},
          "tradeoffs": ["Tradeoff 1 (e.g. 2 weeks of groceries)", "Tradeoff 2"],
          "message": "A neutral short , factual statement about the impact."
        }
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) throw new Error("AI API Failed");

      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
         text = text.replace(/```json/g, "").replace(/```/g, "").trim();
         const result = JSON.parse(text);
         setImpulseResult(result);
         
         const historyItem = {
            ...result, 
            item: impulseItem.name,
            price: price,
            delayDays: result.emergencyDelayDays,
            scoreDrop: result.scoreBefore - result.scoreAfter,
            date: new Date().toISOString()
         };

         const monthRef = doc(db, 'users', user.uid, 'months', selectedMonthKey);
         
         await setDoc(monthRef, { 
            impulseHistory: arrayUnion(historyItem),
            lastImpulseCheck: `${impulseItem.name}: ${result.message}`
         }, { merge: true });
      }

    } catch (error) {
      console.error("Impulse Check Error:", error);
      alert("Could not analyze purchase. Please try again.");
    } finally {
      setCheckingImpulse(false);
    }
  };

  // -----------------------------
  // 🤖 AI Advice Generation
  // -----------------------------
  const handleGenerateAI = async () => {
    if (!GEMINI_API_KEY) return alert("Add API Key");
    setGeneratingAI(true);

    try {
        const promptData = {
            month: selectedMonthKey,
            income,
            emi,
            realSavings,
            totalExpense: totalActualExpense,
            breakdown: expenseByCategory.reduce((acc, curr) => { acc[curr.name] = curr.value; return acc; }, {})
        };

        const prompt = `
          You are an AI money coach.
          Data: ${JSON.stringify(promptData)}
          
          Analyze spending. Provide 1 harsh truth and 2 actionable tips.
          STRICT RULES:
          1. English only. No Hindi/Hinglish.
          2. No emojis.
          3. Max 2 short sentences for advice.
          
          Output JSON:
          {
            "aiAdviceText": "Your harsh truth here.",
            "aiSuggestions": ["Tip 1", "Tip 2"]
          }
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const aiResult = JSON.parse(text);

        const monthRef = doc(db, 'users', user.uid, 'months', selectedMonthKey);
        await setDoc(monthRef, {
            aiAdviceText: aiResult.aiAdviceText,
            aiSuggestions: aiResult.aiSuggestions,
            aiGeneratedAt: new Date().toISOString()
        }, { merge: true });

    } catch (error) {
        console.error("AI Error:", error);
    } finally {
        setGeneratingAI(false);
    }
  };

  // -----------------------------
  // 💾 Standard Actions
  // -----------------------------
  const handleSaveTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) return;
    setAddingExpense(true); 

    try {
      const selectedDate = new Date(newTransaction.transactionDate + "T12:00:00");
      const createdAt = Timestamp.fromDate(selectedDate);

      // ✅ 3️⃣ Save needType to Firestore
      await addDoc(collection(db, "users", user.uid, "financial_records"), {
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        type: "expense", 
        category: newTransaction.category,
        needType: newTransaction.needType, // Added needType
        createdAt,
      });

      setShowTransactionForm(false);
      setNewTransaction({ ...newTransaction, description: "", amount: "" });
      setTimeout(() => setAddingExpense(false), 1000);
    } catch (error) {
      console.error(error);
      setAddingExpense(false);
    }
  };

  const handleMonthSetup = async (e) => {
    e.preventDefault();
    setSetupLoading(true);

    try {
      const numIncome = parseFloat(setupFormData.income);
      const numEmi = parseFloat(setupFormData.emi) || 0;

      // 📊 Income-Based Smart Allocation
      let needsPct, wantsPct, savingsPct, emergencyPct;

      if (numIncome < 30000) {
        needsPct = 0.60; wantsPct = 0.15; savingsPct = 0.15; emergencyPct = 0.10;
      } else if (numIncome <= 70000) {
        needsPct = 0.50; wantsPct = 0.20; savingsPct = 0.20; emergencyPct = 0.10;
      } else {
        needsPct = 0.40; wantsPct = 0.20; savingsPct = 0.30; emergencyPct = 0.10;
      }

      const budgetPlan = {
        needs: Math.round(numIncome * needsPct),
        wants: Math.round(numIncome * wantsPct),
        savings: Math.round(numIncome * savingsPct),
        emergency: Math.round(numIncome * emergencyPct),
        investments: 0 
      };
      
      const dataToSave = {
        income: setupFormData.income,
        emi: setupFormData.emi || '0',
        // Change 4: Removed firstSalary: false logic
        score: 100, 
        budgetPlan,
        adviceText: "Plan created. Stick to your limits.",
        spenderType: "Balanced",
        updatedAt: new Date().toISOString()
      };

      const batch = writeBatch(db);
      const monthRef = doc(db, 'users', user.uid, 'months', selectedMonthKey);
      const userRef = doc(db, 'users', user.uid);

      batch.set(monthRef, dataToSave, { merge: true });
      batch.set(userRef, dataToSave, { merge: true }); 

      await batch.commit();
      
      setShowMonthSetupForm(false);
      setSetupFormData({ income: '', emi: '' });

    } catch (error) {
      console.error(error);
      alert("Failed to save setup.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this?")) await deleteDoc(doc(db, "users", user.uid, "financial_records", id));
  };

  // -----------------------------
  // 🎨 UI Helpers
  // -----------------------------
  const COLORS = ["#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#6b7280"];

  const getCategoryIcon = (catName) => {
    const category = categories.find(c => c.name === catName) || categories[categories.length - 1];
    const Icon = category.icon;
    return (
      <div className={`w-9 h-9 rounded-full ${category.bg} flex items-center justify-center ${category.color} shadow-sm`}>
        <Icon className="w-4 h-4" />
      </div>
    );
  };

  // 🌟 Smart Allocation Bar (Reactive)
  const AllocBar = ({ label, used, limit, type = "expense", note }) => {
    const safeLimit = limit || 1;
    const percent = Math.min(100, Math.max(0, (used / safeLimit) * 100));
    
    let color = "bg-emerald-500";
    let glow = "";
    
    if (type === 'savings') {
        // Savings Logic: Green if >= target, Red if negative/low
        if (used < 0) { color = "bg-red-600"; glow = "shadow-[0_0_10px_-2px_rgba(220,38,38,0.5)]"; }
        else if (used < limit) { color = "bg-amber-500"; glow = "shadow-[0_0_10px_-2px_rgba(245,158,11,0.5)]"; }
        else { color = "bg-emerald-500"; glow = "shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)]"; }
    } else {
        // Expenses Logic: Green if < 80%, Yellow if > 80%, Red if > 100%
        if (used > limit) { color = "bg-red-500"; glow = "shadow-[0_0_10px_-2px_rgba(239,68,68,0.5)]"; }
        else if (used > limit * 0.8) { color = "bg-yellow-500"; glow = "shadow-[0_0_10px_-2px_rgba(234,179,8,0.5)]"; }
        else { color = "bg-emerald-500"; }
    }

    return (
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400 font-medium flex items-center gap-1">
            {label} 
            {note && <span className="text-[10px] text-gray-500 hidden sm:inline">({note})</span>}
          </span>
          <span className={`font-semibold text-white`}>
            ₹{used.toLocaleString()} 
            {limit > 0 && <span className="text-[10px] text-gray-500 ml-1"> / ₹{limit.toLocaleString()}</span>}
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5">
          <div 
            className={`h-full rounded-full ${color} ${glow} transition-all duration-1000 ease-out relative`} 
            style={{ width: `${percent}%` }}
          >
            {/* Shimmer effect for active/high usage */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>
    );
  };

  const ParticleBackground = ({ score }) => {
    const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full opacity-20 ${color} blur-xl animate-float`}
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
    );
  };

  // 🆕 Change 5: Helper Functions for Quick Fill
  const fillIncomeFromLast = () => {
    if (lastFilledMonthData?.income) {
      setSetupFormData(prev => ({ ...prev, income: lastFilledMonthData.income }));
    }
  };

  const fillEmiFromLast = () => {
    if (lastFilledMonthData?.emi) {
      setSetupFormData(prev => ({ ...prev, emi: lastFilledMonthData.emi }));
    }
  };

  const fillBothFromLast = () => {
    if (lastFilledMonthData) {
      setSetupFormData({
        income: lastFilledMonthData.income || '',
        emi: lastFilledMonthData.emi || ''
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-violet-500/30 pb-24 relative overflow-hidden">
      
      {monthData && <ParticleBackground score={dynamicScore} />}

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-violet-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <div className="bg-[#0a0a0f]/80 border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Hello, {userName} 👋
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Financial health for <span className="text-violet-400 font-medium">{monthName}</span>
              {isFirstSalaryMode && (
                <span className="ml-2 inline-flex items-center gap-1 bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full text-[10px] border border-violet-500/20">
                  <GraduationCap className="w-3 h-3" /> First Salary Mode
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
             {/* Impulse Button Removed */}
             {monthData && (
               <>
                 {/* Calendar View Button */}
                 <button 
                   onClick={() => setShowCalendarModal(true)}
                   className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-all active:scale-95"
                 >
                   <Calendar className="w-4 h-4" /> Calendar
                 </button>

                 {/* ✅ Investment Plans Button */}
                 <button 
                   onClick={() => setShowInvestmentPlans(true)}
                   className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all active:scale-95"
                 >
                   <TrendingUp className="w-4 h-4" /> Investments
                 </button>

                 {/* 🧠 AI Roadmap Button */}
                 <button 
                   onClick={() => setShowRoadmap(true)}
                   className="hidden sm:flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-sm font-medium hover:bg-violet-500/20 transition-all active:scale-95"
                 >
                   <Sparkles className="w-4 h-4" /> AI Roadmap
                 </button>
               </>
             )}

             {/* Month Picker */}
             <div className="flex items-center bg-white/5 rounded-full border border-white/5 p-1 shadow-inner relative group">
                <input 
                  type="month" 
                  value={selectedMonthKey}
                  min={firstMonthKey || undefined}
                  onChange={handleMonthInput}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                />
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    changeMonth(-1); 
                  }} 
                  disabled={firstMonthKey && selectedMonthKey <= firstMonthKey}
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors relative z-20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-4 flex items-center gap-2 text-sm font-medium min-w-[140px] justify-center text-gray-200 pointer-events-none">
                  <Calendar className="w-3.5 h-3.5 text-violet-400" />
                  {monthName}
                </div>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    changeMonth(1); 
                  }} 
                  className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors relative z-20"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
             </div>

             <button onClick={onLogout} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-105 active:scale-95 border border-white/5 shadow-md"><LogOut className="w-4 h-4 text-gray-400" /></button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 relative z-10">
        
        {loadingMonthData ? (
           <div className="flex justify-center py-20">
             <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
           </div>
        ) : !monthData ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 border-2 border-dashed border-violet-500/30 rounded-3xl bg-violet-500/5 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4 ring-4 ring-violet-500/5">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Setup {monthName}</h2>
            <p className="text-gray-400 text-center max-w-md mb-8 px-4">
              It seems you haven't planned your finances for {monthName} yet. 
              Takes less than 30 seconds to set up!
            </p>
            <button
              onClick={() => setShowMonthSetupForm(true)}
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              Fill Setup for {monthName} <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
             {monthData && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* 1. Health Score */}
                  <div className="lg:col-span-4 bg-[#0f111a]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-violet-500/20 transition-all duration-500 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full animate-pulse"></div>
                      <div className="relative w-40 h-40 transition-transform duration-700 hover:scale-105">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * dynamicScore) / 100} className={`transition-all duration-1000 ease-out ${dynamicScore >= 70 ? "text-emerald-500" : dynamicScore >= 40 ? "text-amber-500" : "text-red-500"}`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-bold text-white tracking-tight animate-[fadeInUp_0.5s_ease-out]">{dynamicScore}</span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mt-1">Score</span>
                        </div>
                      </div>
                    </div>

                    <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold mb-3 border shadow-sm ${dynamicScore >= 70 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : dynamicScore >= 40 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                      {dynamicScore >= 70 ? <CheckCircle className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                      <span>{dynamicScore >= 70 ? "Excellent" : dynamicScore >= 40 ? "Average" : "Needs Care"}</span>
                    </div>
                    
                    {/* 🤖 AI Insight Box with Action */}
                    <div className="w-full mt-4 space-y-3 relative z-10">
                        <div className={`w-full p-4 rounded-2xl border ${monthData.aiAdviceText ? 'bg-violet-500/10 border-violet-500/20' : aiInsight.bg + ' ' + aiInsight.border} text-left`}>
                            <div className="flex gap-3 items-start">
                                <div className="p-1.5 rounded-full bg-black/20 shrink-0 mt-0.5">
                                    {monthData.aiAdviceText ? <Sparkles className="w-4 h-4 text-violet-400" /> : <AlertTriangle className={`w-3 h-3 ${aiInsight.color}`} />}
                                </div>
                                <div className="space-y-2">
                                    <p className={`text-xs ${monthData.aiAdviceText ? 'text-violet-200' : aiInsight.color} leading-relaxed`}>
                                        "{monthData.aiAdviceText || aiInsight.text}"
                                    </p>
                                    
                                    {/* 🎯 Impulse Impact on Dashboard - Updated to be dynamic */}
                                    {monthData.lastImpulseCheck && (
                                       <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-pink-300">
                                          🛍️ Last Impulse Check: {monthData.lastImpulseCheck}
                                       </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerateAI}
                            disabled={generatingAI}
                            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer relative z-20"
                        >
                            {generatingAI ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3 h-3 text-violet-400" />
                                    {monthData.aiAdviceText ? "Regenerate Advice" : "Get AI Coach Advice"}
                                </>
                            )}
                        </button>
                    </div>
                  </div>

                  {/* 2. Smart Allocation (Updated Logic) */}
                  <div className="lg:col-span-8 bg-[#0f111a]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 relative group hover:border-blue-500/20 transition-all duration-500 shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]"><Wallet className="w-6 h-6 text-blue-400" /></div>
                        <div><h2 className="font-bold text-xl text-white">Smart Allocation</h2><p className="text-sm text-gray-400">Budget vs Reality</p></div>
                      </div>
                      <div className="bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 text-right">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Available to Spend</p>
                        <p className="text-xl font-bold text-blue-300">₹{availableForSpending.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      {/* Needs Row (Includes EMI) */}
                      <div className="md:col-span-2">
                         <AllocBar 
                           label="Needs (Fixed + Essentials)" 
                           used={needsUsed} 
                           limit={needsLimit} 
                           type="needs"
                           note="Must be < 50%"
                         />
                      </div>

                      {/* Wants Row */}
                      <div className="md:col-span-2">
                         <AllocBar 
                           label="Wants (Lifestyle)" 
                           used={wantsUsed} 
                           limit={wantsLimit} 
                           type="wants"
                           note="Keep under 30%"
                         />
                      </div>

                      {/* Savings Row with Gap Message */}
                      <div className="md:col-span-2">
                        <AllocBar 
                          label="Real Savings" 
                          used={realSavings} 
                          limit={savingsTarget} 
                          type="savings" 
                          note="Target 20%"
                        />
                        
                        {/* 🌟 Powerful Gap Message */}
                        <div className={`mt-[-10px] mb-4 p-3 rounded-xl border flex items-center gap-3 ${savingsGap > 0 ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"}`}>
                           {savingsGap > 0 ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
                           <span className="font-semibold text-sm">
                             {savingsGap > 0 
                               ? `You are ₹${savingsGap.toLocaleString()} behind your saving target.`
                               : `You are ₹${Math.abs(savingsGap).toLocaleString()} ahead of your saving target!`}
                           </span>
                        </div>
                      </div>
                      
                      {/* Emergency Fund (Optional tracking, keeping separate bar for visualization) */}
                      <AllocBar 
                        label="Emergency Fund Goal" 
                        used={realSavings > savingsTarget ? realSavings - savingsTarget : 0} 
                        limit={emergencyTarget} 
                        type="savings" 
                        note="Extra cushion"
                      />
                    </div>
                  </div>

                  {/* 🆕 3. Impulse Purchase Checker (New Card) */}
                  <div className="lg:col-span-12 bg-[#0f111a]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all duration-500 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-pink-500/10 rounded-xl border border-pink-500/20 shadow-sm"><ShoppingCart className="w-5 h-5 text-pink-400" /></div>
                      <div><h2 className="font-bold text-lg text-white">Impulse Purchase Checker</h2><p className="text-xs text-gray-400">Financial Lie Detector</p></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Input Section */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider ml-1">Item Name</label>
                          <input type="text" placeholder="e.g. New Headphones" value={impulseItem.name} onChange={(e) => setImpulseItem({...impulseItem, name: e.target.value})} className="w-full mt-1 p-4 bg-black/30 border border-white/10 rounded-2xl text-white focus:border-pink-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 uppercase tracking-wider ml-1">Price</label>
                          <input type="number" placeholder="2000" value={impulseItem.price} onChange={(e) => setImpulseItem({...impulseItem, price: e.target.value})} className="w-full mt-1 p-4 bg-black/30 border border-white/10 rounded-2xl text-white focus:border-pink-500 outline-none" />
                        </div>
                        <button onClick={handleCheckImpulse} disabled={checkingImpulse} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 transition-colors mt-2 disabled:opacity-50">
                          {checkingImpulse ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Check Impact"}
                        </button>
                      </div>

                      {/* Result & History Section */}
                      <div className="flex flex-col h-full space-y-4 min-w-0">
                        {impulseResult ? (
                          <div className="bg-black/30 border border-white/10 rounded-2xl p-6 animate-in fade-in slide-in-from-right duration-300">
                            {/* A. Savings Drop Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Savings Impact</span><span>-₹{impulseItem.price}</span></div>
                              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
                                <div style={{width: `${(impulseResult.savingsAfter / Math.max(impulseResult.savingsBefore, 1)) * 100}%`}} className="h-full bg-emerald-500 transition-all duration-1000"></div>
                                <div className="h-full bg-red-500/50 flex-1"></div>
                              </div>
                              <div className="flex justify-between text-[10px] mt-1 text-gray-500">
                                <span>Before: ₹{impulseResult.savingsBefore.toLocaleString()}</span>
                                <span>After: ₹{impulseResult.savingsAfter.toLocaleString()}</span>
                              </div>
                            </div>

                            {/* B & C Metrics */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                <div className="text-xs text-gray-400 mb-1">Score Drop</div>
                                <div className="text-xl font-bold text-red-400 flex items-center justify-center gap-1">
                                  {impulseResult.scoreBefore} <ArrowDown className="w-4 h-4"/> {impulseResult.scoreAfter}
                                </div>
                              </div>
                              <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                <div className="text-xs text-gray-400 mb-1">Emergency Delay</div>
                                <div className="text-xl font-bold text-amber-400">+{impulseResult.emergencyDelayDays} days</div>
                              </div>
                            </div>

                            {/* D. Trade-offs */}
                            <div className="space-y-2">
                              {impulseResult.tradeoffs?.map((t, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-gray-300 bg-white/5 p-2 rounded-lg border border-white/5">
                                  <Target className="w-3 h-3 text-violet-400" /> {t}
                                </div>
                              ))}
                            </div>
                            
                            <p className="mt-4 text-xs text-center text-gray-400 italic border-t border-white/5 pt-3">"{impulseResult.message}"</p>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-2xl min-h-[150px]">
                            <ShoppingCart className="w-8 h-8 opacity-20 mb-2" />
                            <p className="text-sm">Enter item details to see impact</p>
                          </div>
                        )}

                        {/* History */}
                        {monthData?.impulseHistory?.length > 0 && (
                          <div className="pt-2 mt-auto">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 ml-1">Recent Checks (Click to view)</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {(monthData.impulseHistory || []).slice(-3).reverse().map((h, i) => (
                                <div 
                                  key={i} 
                                  onClick={() => {
                                    setImpulseItem({ name: h.item, price: h.price });
                                    setImpulseResult(h);
                                  }}
                                  className="min-w-[120px] bg-white/5 p-2 rounded-xl border border-white/5 text-[10px] cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                  <div className="font-bold text-white truncate">{h.item}</div>
                                  <div className="text-gray-400">₹{h.price}</div>
                                  <div className="text-red-400">Score: -{h.scoreDrop}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Reality Check */}
                  <div className="lg:col-span-5 bg-[#0f111a]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 flex flex-col hover:border-pink-500/20 transition-all duration-500 shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2.5 bg-pink-500/10 rounded-xl border border-pink-500/20 shadow-sm ${addingExpense ? 'animate-pulse ring-2 ring-pink-500/30' : ''}`}><Activity className="w-5 h-5 text-pink-400" /></div>
                      <div><h2 className="font-bold text-lg text-white">Spending Reality</h2></div>
                    </div>
                    
                    <div className="my-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-end mb-1">
                         <span className="text-xs text-gray-400 uppercase">Remaining to Spend</span>
                         <span className={`text-xl font-bold ${remainingSpendable < 0 ? 'text-red-400' : 'text-emerald-400'}`}>₹{remainingSpendable.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                         <div className={`h-full rounded-full ${remainingSpendable < 0 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.max(0, (remainingSpendable / availableForSpending) * 100))}%` }}></div>
                      </div>
                    </div>

                    <div className="my-2">
                      <span className={`text-3xl font-bold text-white tracking-tight inline-block transition-transform duration-300 ${addingExpense ? 'scale-110 text-pink-300' : ''}`}>₹{totalActualExpense.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-2">used so far</span>
                    </div>
                    <div className={`h-[250px] w-full mt-auto transition-all duration-700 ${addingExpense ? 'rotate-3 scale-105' : ''}`}>
                      {expenseByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                              {expenseByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} formatter={(value) => `₹${value.toLocaleString()}`} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-gray-400 text-xs ml-1">{value}</span>} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center"><TrendingUp className="w-6 h-6 opacity-30" /></div>
                          <p className="text-sm">No expenses recorded yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. The Trend */}
                  <div className="lg:col-span-7 bg-[#0f111a]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 flex flex-col hover:border-amber-500/20 transition-all duration-500 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-sm"><TrendingUp className="w-5 h-5 text-amber-400" /></div>
                      <div><h2 className="font-bold text-lg text-white">Spending Trend</h2><p className="text-xs text-gray-400">vs Previous Month (Ghost Bar)</p></div>
                    </div>
                    <div className="h-[300px] w-full mt-auto">
                      {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" tick={{fill: '#9ca3af', fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{fill: '#9ca3af', fontSize: 11}} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                            <Tooltip cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2}} contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }} />
                            <Bar dataKey="prevAmount" name="Last Month" fill="#374151" radius={[4, 4, 0, 0]} barSize={20} opacity={0.3} />
                            <Area type="monotone" dataKey="amount" name="This Month" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#8b5cf6)" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm">Start adding expenses to see your trend</div>
                      )}
                    </div>
                  </div>

                  {/* 6. Transactions List with ✅ Badge */}
                  <div className="lg:col-span-12 bg-[#0f111a]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all duration-500 shadow-xl">
                     <div className="flex items-center justify-between mb-6">
                      <h2 className="font-bold text-lg text-white">Recent Transactions</h2>
                      <button 
                        onClick={() => setShowTransactionForm(true)}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl transition active:scale-95 flex items-center gap-2 text-sm font-medium shadow-[0_4px_10px_-1px_rgba(0,0,0,0.3)]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {loadingRecords ? (
                        <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-violet-500"/></div>
                      ) : currentMonthRecords.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3"><Wallet className="w-6 h-6 text-gray-500" /></div>
                          <p className="text-gray-400 font-medium">No expenses yet this month</p>
                        </div>
                      ) : (
                        currentMonthRecords.map((record) => (
                          <div key={record.id} className="bg-[#18181b]/50 border border-white/5 p-4 rounded-2xl flex items-start justify-between group hover:bg-white/5 hover:border-white/10 transition-all duration-300 shadow-sm hover:shadow-md">
                            <div className="flex items-start gap-4">
                              {getCategoryIcon(record.category)}
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-white truncate pr-2">{record.description}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                   <p className="text-xs text-gray-500">{record.category}</p>
                                   {/* ✅ 7️⃣ Need/Want Badge */}
                                   <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                                     (record.needType || "need") === "need" 
                                       ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                       : "bg-pink-500/10 text-pink-400 border-pink-500/20"
                                   }`}>
                                     {(record.needType || "need") === "need" ? "Need" : "Want"}
                                   </span>
                                </div>
                                <p className="text-[10px] text-gray-600 mt-1 font-medium uppercase tracking-wide">{new Date(record.createdAt?.seconds * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="font-bold text-sm text-white whitespace-nowrap">-₹{record.amount.toLocaleString()}</span>
                              <button onClick={() => handleDelete(record.id)} className="text-gray-600 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
             )}
          </>
        )}
      </main>

      {monthData && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
           {/* Mobile Impulse Check */}
           <button
            onClick={() => setShowImpulseModal(true)}
            className="sm:hidden bg-pink-600 text-white p-4 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <ShoppingCart className="w-6 h-6" />
          </button>

          <button
            onClick={() => setShowTransactionForm(true)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-4 rounded-2xl shadow-[0_4px_20px_-1px_rgba(139,92,246,0.5)] hover:shadow-[0_4px_25px_0px_rgba(139,92,246,0.6)] hover:scale-105 active:scale-95 transition-all group"
          >
            <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      )}

      {/* ✅ Month Setup Modal (Change 6: New JSX) */}
      {showMonthSetupForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#121215] border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/20 rounded-full blur-[60px] -z-10" />
            <button onClick={() => setShowMonthSetupForm(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-2">Setup for {monthName}</h2>
            <p className="text-gray-400 mb-6 text-sm">
              Let's create your financial plan for this month.
            </p>

            <form onSubmit={handleMonthSetup} className="space-y-4">
              <div className="group">
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider ml-1">
                  Total Monthly Income
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                     type="number" 
                     required 
                     min="0" 
                     placeholder="e.g. 50000" 
                     value={setupFormData.income} 
                     onChange={(e) => setSetupFormData({...setupFormData, income: e.target.value})} 
                     className="w-full pl-11 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-violet-500 focus:bg-white/5 outline-none transition-all" 
                  />
                </div>
              </div>
              
              <div className="group">
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider ml-1">
                  Fixed EMI / Rent (Needs)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                     type="number" 
                     min="0" 
                     placeholder="0" 
                     value={setupFormData.emi} 
                     onChange={(e) => setSetupFormData({...setupFormData, emi: e.target.value})} 
                     className="w-full pl-11 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-violet-500 focus:bg-white/5 outline-none transition-all" 
                  />
                </div>
              </div>

              {/* ⚡ NEW: Auto-fill from Last Filled Month */}
              {checkingLastMonth ? (
                <div className="h-20 w-full bg-white/5 animate-pulse rounded-xl" />
              ) : lastFilledMonthData ? (
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 animate-in fade-in slide-in-from-right duration-300">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <History className="w-3 h-3 text-violet-400" />
                    <span className="uppercase tracking-wider font-semibold">
                      Quick Fill from {lastFilledMonthData.monthName}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {lastFilledMonthData.income && (
                        <button 
                          type="button"
                          onClick={fillIncomeFromLast}
                          className="flex-1 py-2 px-3 bg-black/40 hover:bg-violet-500/20 hover:border-violet-500/30 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95 group"
                        >
                          <span>Income: ₹{lastFilledMonthData.income}</span>
                          <ArrowDown className="w-3 h-3 text-gray-500 group-hover:text-violet-400" />
                        </button>
                      )}
                      {lastFilledMonthData.emi && parseFloat(lastFilledMonthData.emi) > 0 && (
                        <button 
                          type="button"
                          onClick={fillEmiFromLast}
                          className="flex-1 py-2 px-3 bg-black/40 hover:bg-violet-500/20 hover:border-violet-500/30 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95 group"
                        >
                          <span>EMI: ₹{lastFilledMonthData.emi}</span>
                          <ArrowDown className="w-3 h-3 text-gray-500 group-hover:text-violet-400" />
                        </button>
                      )}
                    </div>
                    
                    {/* Fill Both Button */}
                    {lastFilledMonthData.income && lastFilledMonthData.emi && parseFloat(lastFilledMonthData.emi) > 0 && (
                      <button 
                        type="button"
                        onClick={fillBothFromLast}
                        className="w-full py-2 px-3 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 rounded-lg text-xs text-violet-300 hover:text-violet-200 flex items-center justify-center gap-2 transition-all active:scale-95 font-medium"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Auto-Fill Everything</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : null}

              <button 
                 type="submit"
                 disabled={setupLoading} 
                 className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-95 transition-all mt-4 disabled:opacity-50"
              >
                {setupLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : "Generate AI Plan 🚀"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🆕 Impulse Check Modal (Replaced by on-dashboard card, removing this modal) */}
      {showImpulseModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#121215] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Logic Moved to Dashboard Card, kept here for mobile FAB support if needed, but primary UI is now the card */}
             <button onClick={() => setShowImpulseModal(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
             <div className="text-center text-gray-400">Please use the Impulse Checker card on the dashboard.</div>
          </div>
        </div>
      )}

      {/* 🗓️ Calendar View Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#121215] border border-white/10 rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowCalendarModal(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-sm">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Spending Calendar</h2>
                <p className="text-xs text-gray-400">Daily spending intensity</p>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 md:gap-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs text-gray-500 font-medium py-2">{day}</div>
              ))}
              {/* Offset for first day of month */}
              {Array.from({ length: new Date(selectedMonthKey + "-01").getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {calendarData.map(({ day, amount, items }) => (
                <div 
                  key={day} 
                  className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative group transition-all hover:scale-105 ${getDayColor(amount)}`}
                >
                  <span className="text-xs font-bold">{day}</span>
                  {amount > 0 && <span className="text-[10px] opacity-80">₹{amount >= 1000 ? (amount/1000).toFixed(1) + 'k' : amount}</span>}
                  
                  {/* Tooltip */}
                  {amount > 0 && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[200px] px-3 py-2 bg-gray-900 border border-white/10 rounded-xl text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-2xl">
                      <div className="font-bold border-b border-white/10 pb-1 mb-1 text-center">₹{amount.toLocaleString()}</div>
                      <div className="space-y-1">
                        {items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="truncate text-gray-300">{item}</div>
                        ))}
                        {items.length > 3 && <div className="text-gray-500 text-[10px] italic">+{items.length - 3} more</div>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal with ✅ 2️⃣ Need/Want Selector */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[#121215] border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] -z-10" />
            <div className="flex justify-between items-center mb-8">
              <div><h3 className="text-2xl font-bold text-white">Add Expense</h3><p className="text-sm text-gray-400">Track where your money goes</p></div>
              <button onClick={() => setShowTransactionForm(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-6">
              <div><label className="text-xs text-gray-400 font-medium uppercase tracking-wider ml-1">Title</label><input type="text" required className="w-full mt-2 p-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-violet-500 focus:bg-white/5 outline-none text-lg transition-all placeholder:text-gray-700 shadow-inner" placeholder="e.g. Starbucks" value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} /></div>
              
              <div>
                 <label className="text-xs text-gray-400 font-medium uppercase tracking-wider ml-1">Amount</label>
                 <div className="relative mt-2">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-light">₹</span>
                    <input type="number" required min="0" className="w-full p-4 pl-10 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-violet-500 focus:bg-white/5 outline-none text-xl font-bold transition-all placeholder:text-gray-700 shadow-inner" placeholder="0.00" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category Selector */}
                <div>
                   <label className="text-xs text-gray-400 font-medium uppercase tracking-wider ml-1">Category</label>
                   <div className="relative">
                      <select className="w-full mt-2 p-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-violet-500 focus:bg-white/5 outline-none appearance-none transition-all text-sm shadow-inner" value={newTransaction.category} onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}>
                         {categories.map(c => <option key={c.name} value={c.name} className="bg-zinc-900">{c.name}</option>)}
                      </select>
                      <ArrowDown className="absolute right-4 top-[60%] -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                   </div>
                </div>

                {/* ✅ New Need/Want Selector */}
                <div>
                   <label className="text-xs text-gray-400 font-medium uppercase tracking-wider ml-1">Type</label>
                   <div className="relative">
                      <select 
                        value={newTransaction.needType}
                        onChange={(e) => setNewTransaction({ ...newTransaction, needType: e.target.value })}
                        className="w-full mt-2 p-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-violet-500 focus:bg-white/5 outline-none appearance-none transition-all text-sm shadow-inner"
                      >
                         <option value="need" className="bg-zinc-900">Need (Essential)</option>
                         <option value="want" className="bg-zinc-900">Want (Lifestyle)</option>
                      </select>
                      <ArrowDown className="absolute right-4 top-[60%] -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                   </div>
                </div>
              </div>

              <div><label className="text-xs text-gray-400 font-medium uppercase tracking-wider ml-1">Date</label><input type="date" required className="w-full mt-2 p-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-violet-500 focus:bg-white/5 outline-none transition-all text-sm shadow-inner" value={newTransaction.transactionDate} onChange={(e) => setNewTransaction({ ...newTransaction, transactionDate: e.target.value })} /></div>
              
              <button onClick={handleSaveTransaction} className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold text-lg shadow-[0_4px_20px_-1px_rgba(139,92,246,0.5)] hover:shadow-[0_4px_25px_0px_rgba(139,92,246,0.6)] active:scale-[0.98] transition-all mt-4">Save Transaction</button>
            </div>
          </div>
        </div>
      )}
        {/* 🧠 AI Roadmap Modal */}
      <AIRoadmap
        open={showRoadmap}
        onClose={() => setShowRoadmap(false)}
        user={user}
        monthData={monthData}
        records={records}
        selectedMonthKey={selectedMonthKey}
      />

       {/* 📈 Investment Plans Modal */}
      <InvestmentPlans
        open={showInvestmentPlans}
        onClose={() => setShowInvestmentPlans(false)}
        income={income}
      />
    </div>
  );
};
export default Dashboard;