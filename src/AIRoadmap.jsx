import React, { useEffect, useMemo, useState } from "react";
import { 
  X, Sparkles, CheckCircle, HelpCircle, Loader2, 
  Target, Shield, TrendingUp, RefreshCw, Lock, AlertTriangle, Calendar,
  Trophy, Flame, Clock, Swords
} from "lucide-react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase.js";

const GEMINI_API_KEY = "AIzaSyB8LuU9OMZpuiHLDVffQjOFQtAGyO6Utbo";

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

export default function AIRoadmap({
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
      .filter(r => ["Food", "Rent", "Bills", "Travel"].includes(r.category))
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    return expenses + emi; 
  }, [currentMonthExpenses, emi]);

  const wantsUsed = useMemo(() => currentMonthExpenses
    .filter(r => ["Shopping", "Entertainment", "Other"].includes(r.category))
    .reduce((s, r) => s + r.amount, 0), [currentMonthExpenses]);

  const shoppingTotal = useMemo(() => currentMonthExpenses
    .filter(r => r.category === "Shopping")
    .reduce((s, r) => s + r.amount, 0), [currentMonthExpenses]);

  const totalExpense = useMemo(() => currentMonthExpenses
    .reduce((sum, r) => sum + (r.amount || 0), 0), [currentMonthExpenses]);

  const realSavings = income - needsUsed - wantsUsed;
  const savingsGap = savingsTarget - realSavings;
  const impulseCount = safeMonthData.impulseHistory?.length || 0;

  // ⏱️ Time Left
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonthKey.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonthKey]);

  const todayDate = new Date().getDate();
  
  // Logic: If past month, days left is 0. If current month, calc remaining.
  const isCurrentMonth = selectedMonthKey === new Date().toISOString().slice(0,7);
  const daysLeft = isCurrentMonth ? Math.max(0, daysInMonth - todayDate) : 0;
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

        {/* ⏱️ 5. Time Left Bar */}
        <div className="px-6 py-2 bg-black/40 border-b border-white/5 flex items-center gap-4">
            <span className="text-xs text-gray-400 flex items-center gap-1 min-w-fit">
                <Clock className="w-3 h-3" /> 
                {daysLeft > 0 ? `${daysLeft} days left` : "Month Ended"}
            </span>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${daysLeft < 5 ? "bg-red-500" : "bg-violet-500"}`} 
                    style={{ width: `${isCurrentMonth ? (100 - monthProgress) : 0}%` }} // shrinking bar
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

// Helper for date suffixes (1st, 2nd, 3rd)
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}