import React, { useEffect, useMemo, useState } from "react";
import { 
  X, Sparkles, CheckCircle, HelpCircle, Loader2, 
  Target, Shield, TrendingUp, RefreshCw, Lock, AlertTriangle, Calendar
} from "lucide-react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase.js";

const GEMINI_API_KEY = "AIzaSyB8LuU9OMZpuiHLDVffQjOFQtAGyO6Utbo";

export default function AIRoadmap({
  open,
  onClose,
  user,
  monthData,
  records,
  selectedMonthKey
}) {
  // ✅ HOOKS ALWAYS RUN FIRST
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [mode, setMode] = useState(null);
  const [whyText, setWhyText] = useState("");
  const [whyLoading, setWhyLoading] = useState(false);
  const [activeStepInfo, setActiveStepInfo] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [showVerdict, setShowVerdict] = useState(false);

  // Safe data access for hooks even if monthData is null
  const safeMonthData = monthData || {};
  const safeBudgetPlan = safeMonthData.budgetPlan || {};

  // -----------------------------
  // 🧠 USER CONTEXT CALCULATIONS
  // -----------------------------
  const income = useMemo(() => parseFloat(safeMonthData.income || 0), [safeMonthData]);
  const emi = useMemo(() => parseFloat(safeMonthData.emi || 0), [safeMonthData]);
  const score = safeMonthData.score || 0;
  const isFirstSalary = safeMonthData.firstSalary === true;
  
  // Budget Plan Defaults
  const needsLimit = safeBudgetPlan.needs || 0;
  const wantsLimit = safeBudgetPlan.wants || 0;
  const savingsTarget = safeBudgetPlan.savings || 0;
  const emergencyTarget = safeBudgetPlan.emergency || 0;

  // Filter expenses for selected month
  const currentMonthExpenses = useMemo(() => {
    if (!records) return [];
    return records.filter(r => {
      const m = r.createdAt?.seconds
        ? new Date(r.createdAt.seconds * 1000).toISOString().slice(0, 7)
        : "";
      return m === selectedMonthKey && r.type === "expense";
    });
  }, [records, selectedMonthKey]);

  // Spending Categories
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

  const realSavings = useMemo(() => 
    income - needsUsed - wantsUsed,
  [income, needsUsed, wantsUsed]);

  const savingsGap = savingsTarget - realSavings;
  const impulseCount = safeMonthData.impulseHistory?.length || 0;

  // Days remaining in month
  const daysLeft = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.max(0, lastDay.getDate() - now.getDate());
  }, []);

  const todayDate = new Date().getDate();

  // -----------------------------
  // 📂 GENERATE OR LOAD ROADMAP
  // -----------------------------
  useEffect(() => {
    // Only fetch if modal is open and we have data
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
          
          // Load verdict if exists
          if (data.verdict) {
            setVerdict(data.verdict);
          }
          
          // Auto-check if month is over and verdict not generated
          const isMonthOver = daysLeft === 0;
          if (isMonthOver && data.weekly_roadmap && !data.verdict) {
            generateVerdict(data.weekly_roadmap, data.mode);
          }
        } else {
          setRoadmap(null); // Trigger generation UI
        }
      } catch (error) {
        console.error("Error loading roadmap:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [open, selectedMonthKey, user, monthData, daysLeft]); // Safe dependency array

  // -----------------------------
  // 🧠 AI GENERATION LOGIC
  // -----------------------------
  const generateRoadmap = async () => {
    setLoading(true);

    try {
      const promptData = {
        MONTH: selectedMonthKey,
        INCOME: income,
        EMI: emi,
        NEEDS_LIMIT: needsLimit,
        WANTS_LIMIT: wantsLimit,
        SAVINGS_TARGET: savingsTarget,
        EMERGENCY_TARGET: emergencyTarget,
        NEEDS_USED: needsUsed,
        WANTS_USED: wantsUsed,
        TOTAL_EXPENSE: totalExpense,
        REAL_SAVINGS: realSavings,
        SAVINGS_GAP: savingsGap,
        SCORE: score,
        FIRST_SALARY_BOOLEAN: isFirstSalary,
        SHOPPING_TOTAL: shoppingTotal,
        IMPULSE_COUNT: impulseCount,
        DAYS_LEFT: daysLeft,
        CURRENT_DAY: todayDate
      };

      // Construct the AI Prompt
      const prompt = `
        STRICT SYSTEM CONSTRAINTS (NON-NEGOTIABLE):

1. This roadmap is ONLY for the current month (${selectedMonthKey}).
   DO NOT reference next month, future planning, or past months.

2. You MUST generate exactly 4 weeks (Week 1, Week 2, Week 3, Week 4),
   even if some weeks are already past.

3. Every task MUST include a VALID absolute calendar deadline:
   - deadline_day MUST be an integer between 1 and 31
   - DO NOT use relative time like "6 days", "remaining days", or "end of month"

4. Tasks MUST be executable and verifiable inside a finance app:
   ALLOWED task types:
   - "Spend ≤ ₹X in CATEGORY"
   - "Spend ₹0 in CATEGORY"
   - "Total expenses ≤ ₹X"
   - "Savings ≥ ₹X"
   
   FORBIDDEN task types:
   - Analyze, reflect, review, write, plan, identify, list

5. If any task violates these rules, FIX IT internally and regenerate.
   OUTPUT ONLY VALID JSON.

        You are designing an AI-powered Monthly Financial Roadmap inside a React + Firebase app.
        The roadmap must be deterministic, explainable, numeric, and executable.
        Avoid generic advice. NO EMOJIS. NO EMOTIONAL LANGUAGE. NO MARKDOWN.

        USER FINANCIAL DATA:
        ${JSON.stringify(promptData, null, 2)}

        1️⃣ MODE DETECTION (VERY IMPORTANT - MUST CHOOSE EXACTLY ONE)
        Analyze the data and choose EXACTLY ONE mode based on these STRICT rules:
        
        1. "Foundation Mode" → IF (FIRST_SALARY_BOOLEAN === true) OR (no past roadmap exists)
        2. "Damage Control Mode" → IF (REAL_SAVINGS < 0) OR (SCORE < 40)
        3. "Correction Mode" → IF (WANTS_USED > WANTS_LIMIT) AND (REAL_SAVINGS >= 0)
        4. "Discipline Mode" → IF (IMPULSE_COUNT >= 3) OR (SHOPPING_TOTAL > WANTS_USED * 0.6)
        5. "Growth Mode" → IF (SCORE >= 75) AND (REAL_SAVINGS >= SAVINGS_TARGET * 0.9)
        
        Priority order: Damage Control > Foundation > Correction > Discipline > Growth
        You MUST choose the highest priority mode that matches.

      2️⃣ WEEKLY TASK PLAN (STRICT STRUCTURE – NON-NEGOTIABLE)

You MUST generate EXACTLY 4 weeks:
- Week 1
- Week 2
- Week 3
- Week 4

Rules:
- ALL 4 weeks MUST be present in the output, even if some weeks are already past.
- Each week MUST contain 2–3 tasks (no more, no less).
- Tasks MUST be directly verifiable by the app using expense data.
- ALLOWED task patterns ONLY:
  • "Spend ≤ ₹X in CATEGORY"
  • "Spend ₹0 in CATEGORY"
  • "Total expenses ≤ ₹X"
  • "Savings ≥ ₹X"
- FORBIDDEN task patterns:
  • analyze, review, reflect, identify, draft, plan, list
- If a week is already past, tasks must still exist and may be marked completed = true.
- DO NOT merge weeks, skip weeks, or create future-month tasks.


        3️⃣ DEADLINE-AWARE TASKS (TIME INTELLIGENCE)
        Each task MUST include deadline_day (1-31).
        Calculate realistic deadlines based on:
        - CURRENT_DAY = ${todayDate}
        - DAYS_LEFT = ${daysLeft}
        
        If CURRENT_DAY > suggested deadline, set deadline = CURRENT_DAY + 2

        4️⃣ SCORE IMPACT PER TASK (BEHAVIOR GAMIFICATION)
        Each task MUST include:
        - score_impact_if_completed: positive integer (2-8 range)
        - score_impact_if_ignored: negative integer (-2 to -6 range)
        
        Adjust impact based on mode:
        - Damage Control: Higher penalties, moderate rewards
        - Growth Mode: Higher rewards, lower penalties
        - Foundation: Balanced impacts

        5️⃣ END-OF-MONTH VERDICT LOGIC
        Define how verdict will be calculated at month end based on:
        - Task completion rate
        - Final score vs starting score
        - Savings achieved vs target

        REQUIRED OUTPUT FORMAT (STRICT JSON ONLY, NO MARKDOWN, NO BACKTICKS):
        {
          "mode": "string",
          "weekly_roadmap": [
            {
              "week": 1,
              "focus": "string",
              "actions": [
                {
                  "id": "W1-A1",
                  "task": "string",
                  "deadline_day": 10,
                  "success_condition": "string",
                  "score_impact_if_completed": 5,
                  "score_impact_if_ignored": -4,
                  "completed": false
                }
              ]
            }
          ],
          "end_of_month_verdict_logic": {
            "based_on": ["completion_rate", "final_score", "savings_change"]
          }
        }
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
      
      // Clean JSON string
      if (text) {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const aiPlan = JSON.parse(text);

        // Save to Firestore
        const ref = doc(db, "users", user.uid, "roadmaps", selectedMonthKey);
        await setDoc(ref, {
          ...aiPlan,
          createdAt: new Date().toISOString()
        });

        setMode(aiPlan.mode);
        setRoadmap(aiPlan.weekly_roadmap);
      } else {
        throw new Error("No response text from AI");
      }

    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 📊 GENERATE END-OF-MONTH VERDICT
  // -----------------------------
  const generateVerdict = async (roadmapData, modeData) => {
    try {
      // Calculate completion stats
      const allTasks = roadmapData.flatMap(week => week.actions);
      const completedTasks = allTasks.filter(t => t.completed).length;
      const completionRate = (completedTasks / allTasks.length) * 100;
      
      const startingScore = score;
      const scoreDiff = 0; // This should ideally track score change over month
      
      const verdictPrompt = `
        Generate end-of-month verdict for user in "${modeData}".
        
        DATA:
        - Starting Score: ${startingScore}
        - Task Completion: ${completionRate.toFixed(0)}% (${completedTasks}/${allTasks.length})
        - Savings Target: ₹${savingsTarget}
        - Actual Savings: ₹${realSavings}
        - Savings Gap: ₹${savingsGap}
        
        Choose ONE verdict:
        - "Recovered" → Completion >= 75% AND savings improved significantly
        - "Improved" → Completion >= 50% AND some positive change
        - "Neutral" → Completion 30-50% AND minimal change
        - "Failed" → Completion < 30% OR savings worsened
        
        STRICT JSON OUTPUT (NO MARKDOWN):
        {
          "verdict": "string",
          "completion_percentage": ${completionRate.toFixed(0)},
          "score_change": 0,
          "explanation": "One sentence max, no fluff, numeric focus"
        }
      `;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: verdictPrompt }] }] })
        }
      );

      const data = await res.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const verdictData = JSON.parse(text);
        
        // Save verdict to DB
        const ref = doc(db, "users", user.uid, "roadmaps", selectedMonthKey);
        await updateDoc(ref, { verdict: verdictData });
        
        setVerdict(verdictData);
        setShowVerdict(true);
      }
    } catch (error) {
      console.error("Verdict generation error:", error);
    }
  };

  // -----------------------------
  // 🔄 TOGGLE TASK STATUS
  // -----------------------------
  const toggleTask = async (weekIndex, actionIndex) => {
    if (!roadmap) return;

    const newRoadmap = [...roadmap];
    const task = newRoadmap[weekIndex].actions[actionIndex];
    
    // Toggle status
    task.completed = !task.completed;
    
    setRoadmap(newRoadmap);

    // Update DB
    const ref = doc(db, "users", user.uid, "roadmaps", selectedMonthKey);
    await updateDoc(ref, { weekly_roadmap: newRoadmap });
  };

  // -----------------------------
  // 🤖 AI "WHY THIS STEP?"
  // -----------------------------
  const explainWhy = async (text, id) => {
    if (activeStepInfo === id) {
      setActiveStepInfo(null);
      return;
    }
    
    setActiveStepInfo(id);
    setWhyLoading(true);
    setWhyText("");

    try {
      const prompt = `
        Act as a financial coach. Explain WHY this step is crucial for someone in "${mode}".
        Step: "${text}"
        Context: Income ₹${income}, Savings ₹${realSavings}, Score ${score}.
        Keep it under 20 words. No motivational fluff. Be direct.
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
      setWhyText(data.candidates?.[0]?.content?.parts?.[0]?.text || "Helps build financial discipline.");
    } catch (e) {
      setWhyText("Helps improve your financial health.");
    } finally {
      setWhyLoading(false);
    }
  };

  // -----------------------------
  // 🎨 UI RENDER
  // -----------------------------
  const getModeStyles = (m) => {
    switch(m) {
      case "Foundation Mode": return { icon: Sparkles, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" };
      case "Damage Control Mode": return { icon: Shield, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
      case "Correction Mode": return { icon: RefreshCw, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
      case "Discipline Mode": return { icon: Lock, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" };
      case "Growth Mode": return { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
      default: return { icon: Sparkles, color: "text-gray-400", bg: "bg-white/5", border: "border-white/10" };
    }
  };

  const style = getModeStyles(mode);
  const ModeIcon = style.icon;

  // ✅ EARLY RETURN AFTER HOOKS
  if (!open || !monthData) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#18181b]/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border ${style.bg} ${style.border}`}>
              <ModeIcon className={`w-6 h-6 ${style.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Monthly Mission</h2>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                {selectedMonthKey} 
                {mode && <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${style.bg} ${style.color} ${style.border} border`}>{mode}</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          {!roadmap ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Target className="w-10 h-10 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Ready to Plan?</h3>
              <p className="text-gray-400 max-w-sm mb-8 text-sm leading-relaxed">
                Based on your spending patterns, AI will build a custom 4-week execution plan.
              </p>
              <button
                onClick={generateRoadmap}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-bold text-white shadow-lg shadow-violet-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? "Generating..." : "Generate My Roadmap"}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Verdict Banner (if month ended) */}
              {verdict && (
                <div className={`p-5 rounded-2xl border ${
                  verdict.verdict === "Recovered" ? "bg-emerald-500/10 border-emerald-500/30" :
                  verdict.verdict === "Improved" ? "bg-blue-500/10 border-blue-500/30" :
                  verdict.verdict === "Neutral" ? "bg-gray-500/10 border-gray-500/30" :
                  "bg-red-500/10 border-red-500/30"
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      verdict.verdict === "Recovered" ? "bg-emerald-500/20" :
                      verdict.verdict === "Improved" ? "bg-blue-500/20" :
                      verdict.verdict === "Neutral" ? "bg-gray-500/20" :
                      "bg-red-500/20"
                    }`}>
                      {verdict.verdict === "Recovered" || verdict.verdict === "Improved" ? 
                        <CheckCircle className="w-6 h-6 text-emerald-400" /> :
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                      }
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white mb-1">Month End Verdict: {verdict.verdict}</h4>
                      <p className="text-sm text-gray-300 mb-3">{verdict.explanation}</p>
                      <div className="flex gap-4 text-xs">
                        <span className="text-gray-400">
                          Completion: <span className="font-bold text-white">{verdict.completion_percentage}%</span>
                        </span>
                        <span className="text-gray-400">
                          Score Change: <span className={`font-bold ${verdict.score_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {verdict.score_change >= 0 ? '+' : ''}{verdict.score_change}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Generate Verdict Button (if month ended and no verdict) */}
              {daysLeft === 0 && !verdict && (
                <button
                  onClick={() => generateVerdict(roadmap, mode)}
                  className="w-full p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-300 font-medium hover:bg-violet-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Generate Month-End Verdict
                </button>
              )}

              {/* Weeks List */}
              <div className="space-y-6">
                {roadmap.map((weekData, wIndex) => (
                  <div key={wIndex} className="relative pl-8 border-l border-white/10">
                    <div className="absolute -left-[17px] top-0 w-8 h-8 bg-[#121215] border border-white/20 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                      W{weekData.week}
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-white">{weekData.focus}</h4>
                    </div>

                    <div className="space-y-3">
                      {weekData.actions.map((action, aIndex) => {
                        // Time Pressure Logic
                        const isOverdue = !action.completed && todayDate > action.deadline_day;
                        
                        return (
                          <div 
                            key={aIndex} 
                            className={`
                              p-4 rounded-xl border transition-all duration-300 group
                              ${action.completed 
                                ? "bg-emerald-500/5 border-emerald-500/20" 
                                : isOverdue
                                  ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                                  : "bg-white/5 border-white/5 hover:border-violet-500/30"
                              }
                            `}
                          >
                            <div className="flex gap-4">
                              <button
                                onClick={() => toggleTask(wIndex, aIndex)} 
                                className={`
                                  w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors 
                                  ${action.completed 
                                    ? "bg-emerald-500 text-black shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)]" 
                                    : isOverdue 
                                      ? "bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500/20"
                                      : "bg-white/10 text-transparent border border-white/20 hover:border-violet-400"
                                  }
                                `}
                              >
                                {action.completed ? <CheckCircle className="w-4 h-4" /> : isOverdue ? <AlertTriangle className="w-3 h-3" /> : null}
                              </button>

                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <p className={`text-sm font-medium leading-relaxed ${action.completed ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                                    {action.task}
                                  </p>
                                  {/* Score Impact Badge */}
                                  <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${action.completed ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-gray-500 border-white/10 bg-white/5'}`}>
                                    {action.completed ? `+${action.score_impact_if_completed}` : `${action.score_impact_if_ignored}`}
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mt-3 items-center">
                                  {/* Deadline Badge */}
                                  <span className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1 ${
                                    isOverdue 
                                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                                      : action.completed
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : "bg-white/5 text-gray-400 border-white/10"
                                  }`}>
                                    <Calendar className="w-3 h-3" /> 
                                    {action.completed ? "Done" : isOverdue ? `Overdue (Day ${action.deadline_day})` : `By Day ${action.deadline_day}`}
                                  </span>

                                  <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-1 rounded border border-white/5">
                                    Target: {action.success_condition}
                                  </span>
                                  
                                  <button
                                    onClick={() => explainWhy(action.task, action.id)}
                                    className="text-[10px] flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 rounded hover:bg-violet-500/10 ml-auto"
                                  >
                                    <HelpCircle className="w-3 h-3" />
                                    Why?
                                  </button>
                                </div>

                                {activeStepInfo === action.id && (
                                  <div className="mt-3 bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 animate-in slide-in-from-top-2">
                                    {whyLoading ? (
                                      <div className="flex items-center gap-2 text-xs text-violet-300">
                                        <Loader2 className="w-3 h-3 animate-spin" /> AI is thinking...
                                      </div>
                                    ) : (
                                      <p className="text-xs text-violet-200 leading-relaxed">
                                        <span className="font-bold">💡 Insight:</span> {whyText}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

