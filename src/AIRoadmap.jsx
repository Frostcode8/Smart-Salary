import React, { useEffect, useMemo, useState } from "react";
import { 
  X, Sparkles, CheckCircle, HelpCircle, Loader2, 
  Target, Clock, RefreshCw, Lock, Calendar
} from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, getFirestore } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";

// 🔥 FIREBASE INITIALIZATION (Inline for Stability)
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const GEMINI_API_KEY = "AIzaSyD-N7mbQrqS3slnzYTKaeGmoMADhAwpg_I";


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
  const [whyText, setWhyText] = useState("");
  const [whyLoading, setWhyLoading] = useState(false);
  const [activeStepInfo, setActiveStepInfo] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Safe data access
  const safeMonthData = monthData || {};
  const safeBudgetPlan = safeMonthData.budgetPlan || {};

  // -----------------------------
  // 🧠 USER CONTEXT CALCULATIONS
  // -----------------------------
  const income = parseFloat(safeMonthData.income || 0);
  const emi = parseFloat(safeMonthData.emi || 0);
  
  // NET INCOME LOGIC
  const netIncome = safeMonthData.netIncome || (income - emi);
  
  const wantsLimit = safeBudgetPlan.wants || 0;
  const savingsTarget = safeBudgetPlan.savings || 0;

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
    return currentMonthExpenses
      .filter(r => (r.needType || "need") === "need")
      .reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [currentMonthExpenses]);

  const wantsUsed = useMemo(() => currentMonthExpenses
    .filter(r => r.needType === "want")
    .reduce((s, r) => s + r.amount, 0), [currentMonthExpenses]);

  const realSavings = netIncome - needsUsed - wantsUsed;
  const savingsGap = savingsTarget - realSavings;
  const impulseCount = safeMonthData.impulseHistory?.length || 0;

  // 🎯 NEW: Category Analysis
  const expenseByCategory = useMemo(() => {
    const categoryMap = {};
    currentMonthExpenses.forEach(r => {
      const cat = r.category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + r.amount;
    });
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthExpenses]);

  const biggestCategory = expenseByCategory[0] || { name: "General", value: 0 };
  const wantsPercentage = wantsLimit > 0 ? (wantsUsed / wantsLimit * 100) : 0;

  // ⏱️ Time Left Calculation
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonthKey.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonthKey]);

  const todayDate = new Date().getDate();
  const currentMonthKey = new Date().toISOString().slice(0,7);
  const isCurrentMonth = selectedMonthKey === currentMonthKey;
  const isFutureMonth = selectedMonthKey > currentMonthKey;
  const isPastMonth = selectedMonthKey < currentMonthKey;

  const daysLeft = isCurrentMonth
    ? Math.max(0, daysInMonth - todayDate)
    : isFutureMonth
      ? daysInMonth 
      : 0;

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
          setRoadmap(data.weekly_roadmap);
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
  // 🧠 AI GENERATION LOGIC - ENHANCED
  // -----------------------------
  const generateRoadmap = async () => {
    setLoading(true);
    try {
      // 🎯 Calculate weekly limits
      const weeksLeft = Math.ceil(daysLeft / 7) || 4;
      const wantsRemaining = Math.max(0, wantsLimit - wantsUsed);
      const weeklyWantsLimit = Math.round(wantsRemaining / weeksLeft);
      const weeklyCategoryLimit = Math.round(biggestCategory.value / 4);
      const weeklySavingsTarget = Math.max(500, Math.round(Math.max(0, savingsGap) / weeksLeft)); // Minimum ₹500

      // 🎯 Determine roadmap mode
      let roadmapMode = "normal";
      if (wantsPercentage >= 80) roadmapMode = "wants_rescue";
      if (biggestCategory.value > netIncome * 0.4) roadmapMode = "category_control";
      if (wantsPercentage >= 80 && biggestCategory.value > netIncome * 0.4) roadmapMode = "dual_rescue";

      const promptData = {
        MONTH: selectedMonthKey,
        INCOME: income,
        NET_INCOME: netIncome,
        WANTS_USED: wantsUsed,
        WANTS_LIMIT: wantsLimit,
        WANTS_REMAINING: wantsRemaining,
        WANTS_PERCENTAGE: Math.round(wantsPercentage),
        WEEKLY_WANTS_LIMIT: weeklyWantsLimit,
        BIGGEST_CATEGORY: biggestCategory.name,
        BIGGEST_CATEGORY_AMOUNT: biggestCategory.value,
        WEEKLY_CATEGORY_LIMIT: weeklyCategoryLimit,
        SAVINGS_GAP: savingsGap,
        WEEKLY_SAVINGS_TARGET: weeklySavingsTarget,
        IMPULSE_COUNT: impulseCount,
        DAYS_LEFT: daysLeft,
        ROADMAP_MODE: roadmapMode
      };

      const prompt = `
You are a financial advisor creating a personalized 4-week spending roadmap.

USER DATA:
${JSON.stringify(promptData, null, 2)}

ROADMAP MODE: ${roadmapMode}

INSTRUCTIONS BASED ON MODE:

${roadmapMode === "wants_rescue" || roadmapMode === "dual_rescue" ? `
🚨 WANTS BUDGET RESCUE MODE (User spent ${Math.round(wantsPercentage)}% of wants budget!)
- Week 1: Alert user they've spent ₹${wantsUsed} of ₹${wantsLimit} (${Math.round(wantsPercentage)}%)
- Week 2-4: Strict wants control - max ₹${weeklyWantsLimit}/week
- Add specific tasks like "Skip online shopping", "Cancel subscriptions", "Use what you have"
- Focus: Prevent overspending, stay within remaining ₹${wantsRemaining}
` : ''}

${roadmapMode === "category_control" || roadmapMode === "dual_rescue" ? `
🎯 CATEGORY MONSTER SLAYER MODE (${biggestCategory.name} is ₹${biggestCategory.value}!)
- Week 1: Track current ${biggestCategory.name} spending (₹${biggestCategory.value})
- Week 2: Reduce ${biggestCategory.name} to ₹${Math.round(weeklyCategoryLimit * 0.9)}/week (10% cut)
- Week 3: Target ₹${Math.round(weeklyCategoryLimit * 0.8)}/week (20% cut)
- Week 4: Maintain ₹${Math.round(weeklyCategoryLimit * 0.75)}/week (25% cut)
- Add specific ${biggestCategory.name} alternatives (e.g., if Food: cook at home, meal prep)
` : ''}

${roadmapMode === "normal" ? `
📊 NORMAL MODE (Balanced approach)
- Mix of spending control, savings, and habit building
- Use category limits: ₹${weeklyCategoryLimit}/week for ${biggestCategory.name}
- Wants budget: ₹${weeklyWantsLimit}/week
- Savings target: ₹${weeklySavingsTarget}/week
` : ''}

STRICT RULES:
1. EXACTLY 3 tasks per week
2. Each task MUST have clear ₹ amounts from the data above (NEVER use ₹0)
3. Use format "Spend ≤ ₹X in Category" for tracking tasks
4. Week 1 Focus: Awareness & tracking
5. Week 2-3 Focus: Active reduction & control  
6. Week 4 Focus: Maintain habits (NOT generic celebration)
7. Keep task descriptions under 12 words
8. Be specific with rupee amounts, not percentages
9. Make tasks actionable and measurable
10. If weeklySavingsTarget is calculated as ₹0, use minimum ₹500 instead
11. NEVER use phrases like "celebrate wins", "review month", "final push" without specific amounts

TASK CATEGORIES (mix these):
- Spending Control: "Spend ≤ ₹${weeklyWantsLimit} on wants this week"
- Category Focus: "Spend ≤ ₹${weeklyCategoryLimit} in ${biggestCategory.name}"
- Savings: "Save ₹${weeklySavingsTarget} toward monthly target"
- Habits: "Track every expense", "No impulse buys for 7 days"
- Week 4 specific: "Transfer ₹${weeklySavingsTarget} to savings account", "Reduce ${biggestCategory.name} by ₹${Math.round(weeklyCategoryLimit * 0.2)}"

OUTPUT ONLY THIS JSON (no markdown, no explanation):

{
  "weekly_roadmap": [
    {
      "week": 1,
      "focus": "string (e.g., 'Spending Awareness')",
      "actions": [
        {
          "id": "W1-A1",
          "task": "string with specific ₹ amount",
          "deadline_day": 7,
          "completed": false
        }
      ]
    }
  ]
}

NEVER use these generic phrases in tasks:
- "Save ₹0 this week"
- "Final push - save ₹0"
- "Review month - celebrate savings wins!"
- "celebrate savings wins"
- Generic "celebrate" tasks

ALWAYS use:
- Specific rupee amounts from user data
- Actionable category names (Food, Transport, Shopping, etc.)
- Measurable spending limits
- Clear reduction targets

Generate the roadmap now using the mode: ${roadmapMode}
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
          createdAt: new Date().toISOString(),
          mode: roadmapMode,
          metadata: {
            wantsPercentage: Math.round(wantsPercentage),
            biggestCategory: biggestCategory.name,
            biggestCategoryAmount: biggestCategory.value
          }
        });

        setRoadmap(aiPlan.weekly_roadmap);
        setIsRegenerating(false);
      }
    } catch (error) {
      console.error("AI Gen Error", error);
      alert("AI Generation failed. Please try again.");
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
    
    // Smart explanations based on task type
    let explanation = "This task helps you build better money habits.";
    
    if (task.includes("Spend ≤") && task.includes("wants")) {
      explanation = `You've already spent ₹${wantsUsed} (${Math.round(wantsPercentage)}%) of your ₹${wantsLimit} wants budget. This limit prevents overspending.`;
    } else if (task.includes(biggestCategory.name)) {
      explanation = `${biggestCategory.name} is your biggest expense at ₹${biggestCategory.value}. Reducing it by 10-25% can save ₹${Math.round(biggestCategory.value * 0.15)}/month.`;
    } else if (task.includes("Save")) {
      explanation = `You need to save ₹${savingsGap} more to hit your target. Small weekly savings add up!`;
    } else if (task.includes("impulse")) {
      explanation = `You made ${impulseCount} impulse buys this month. Breaking this habit saves money and builds discipline.`;
    }
    
    setTimeout(() => {
        setWhyText(explanation);
        setWhyLoading(false);
    }, 600);
  };

  const totalTasks = roadmap ? roadmap.reduce((acc, w) => acc + w.actions.length, 0) : 0;
  const completedTasks = roadmap ? roadmap.reduce((acc, w) => acc + w.actions.filter(a => a.completed).length, 0) : 0;
  const progressPct = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
  const ringColor = progressPct > 70 ? "text-emerald-500" : progressPct > 40 ? "text-amber-500" : "text-red-500";

  // 🕵️ Enhanced Progress Tracking
  const getTaskProgress = (taskStr) => {
    // Match patterns like "Spend ≤ ₹X in Category" or "Spend ≤ ₹X on wants"
    const categoryMatch = taskStr.match(/Spend\s*(?:≤|<=)\s*[₹]?([\d,]+)\s*(?:in|on)\s*(\w+)/i);
    
    if (categoryMatch) {
        const limit = parseFloat(categoryMatch[1].replace(/,/g, ''));
        const keyword = categoryMatch[2].toLowerCase();
        
        let used = 0;
        let category = keyword;
        
        // Check if it's wants tracking
        if (keyword === "wants" || keyword === "want") {
            used = wantsUsed;
            category = "wants";
        } else {
            // Try to find matching category
            used = currentMonthExpenses
                .filter(r => r.category.toLowerCase().includes(keyword))
                .reduce((s, r) => s + r.amount, 0);
        }
        
        return { used, limit, category };
    }
    return null;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f111a] border border-white/10 rounded-none sm:rounded-[2rem] w-full max-w-4xl h-full sm:h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121215]">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors sm:hidden">
                <X className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                AI Roadmap
                <span className="text-xs text-gray-500 font-normal bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {selectedMonthKey}
                </span>
              </h2>
              {/* Smart Status Badge */}
              {roadmap && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                  {wantsPercentage >= 80 && (
                    <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      🚨 Wants Budget Alert
                    </span>
                  )}
                  {biggestCategory.value > netIncome * 0.4 && (
                    <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      ⚠️ High {biggestCategory.name} Spending
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
             {/* Progress Ring */}
             {!isRegenerating && roadmap && (
               <div className="flex items-center gap-3">
                 <ProgressRing radius={28} stroke={4} progress={progressPct} color={ringColor} />
                 <div className="hidden sm:block">
                   <p className="text-xs text-gray-400">Tasks Completed</p>
                   <p className="text-sm font-bold text-white">{completedTasks} / {totalTasks}</p>
                 </div>
               </div>
             )}
             
             <div className="flex items-center gap-2">
                {/* Regenerate Button */}
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

        {/* Time Left Bar */}
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-white/10 bg-[#0a0a0f]">
          {(!roadmap || isRegenerating) ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse ring-4 ring-violet-500/10">
                <Target className="w-10 h-10 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{isRegenerating ? "Regenerate Smart Roadmap" : "Generate Smart Roadmap"}</h3>
              <p className="text-gray-400 max-w-md mb-4 text-sm">
                AI will analyze your spending patterns and create a personalized plan.
              </p>
              
              {/* Smart Preview */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-w-md mb-6 text-left">
                <p className="text-xs text-gray-400 uppercase mb-2">Your Current Status</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Wants Budget Used:</span>
                    <span className={`text-sm font-bold ${wantsPercentage >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {Math.round(wantsPercentage)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Biggest Category:</span>
                    <span className="text-sm font-bold text-violet-400">{biggestCategory.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Impulse Buys:</span>
                    <span className={`text-sm font-bold ${impulseCount >= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {impulseCount}
                    </span>
                  </div>
                </div>
              </div>
              
              {isRegenerating && (
                 <p className="text-xs text-amber-500/80 mb-6 max-w-xs border border-amber-500/20 bg-amber-500/10 p-2 rounded-lg">
                    ⚠️ Generating a new roadmap will overwrite your existing progress for this month.
                 </p>
              )}

              <button
                onClick={generateRoadmap}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-bold text-white shadow-lg shadow-violet-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? "Analyzing Your Spending..." : isRegenerating ? "Confirm Regenerate" : "Generate Smart Roadmap"}
              </button>
            </div>
          ) : (
            <div className="space-y-8 pb-10">
              {/* Manual Regen Hint */}
              <div className="flex justify-center mb-2">
                 <p className="text-[10px] text-gray-500 flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full">
                    <Lock className="w-3 h-3" /> Roadmap locked. Regenerate only if needed.
                 </p>
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

                  {/* Task Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weekData.actions.map((action, aIdx) => {
                      const progressData = getTaskProgress(action.task);
                      
                      // Card Status Logic
                      let statusText = "Pending";
                      let statusColor = "text-gray-400 bg-white/5 border-white/10";
                      
                      if (action.completed) {
                          statusText = "Completed";
                          statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                      } else if (progressData) {
                          const pct = (progressData.used / progressData.limit) * 100;
                          if (pct > 100) {
                              statusText = "Over Budget"; 
                              statusColor = "text-red-400 bg-red-500/10 border-red-500/20";
                          } else if (pct > 80) {
                              statusText = "Warning";
                              statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                          } else {
                              statusText = "On Track";
                              statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
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

                          {/* Dynamic Progress Bar */}
                          {progressData && !action.completed && (
                              <div className="mb-3">
                                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                      <span>Spent: ₹{progressData.used.toLocaleString()}</span>
                                      <span>Limit: ₹{progressData.limit.toLocaleString()}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all ${
                                          progressData.used > progressData.limit 
                                            ? "bg-red-500" 
                                            : progressData.used > progressData.limit * 0.8
                                              ? "bg-amber-500"
                                              : "bg-emerald-500"
                                        }`}
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
                                        <p className="text-xs text-gray-300 mb-3">{whyText}</p>
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