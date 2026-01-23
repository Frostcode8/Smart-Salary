import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js'; 
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { Calculator, ArrowRight, IndianRupee, LogOut, Sparkles, Calendar } from 'lucide-react';

export default function FinancialForm() {
  const [formData, setFormData] = useState({
    income: '',
    expense: '',
    emi: '',
    savings: ''
  });
  const [isFirstSalary, setIsFirstSalary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('User');

  // Get current month name for display (e.g., "January")
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  // Get current month key for storage (e.g., "2023-10")
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (auth.currentUser?.displayName) {
      setUserName(auth.currentUser.displayName.split(' ')[0]); // First name
    }
  }, []);

  const calculateScore = (income, expense, emi, savings) => {
    let score = 100;
    
    const numIncome = parseFloat(income);
    const numExpense = parseFloat(expense);
    const numEmi = parseFloat(emi) || 0;
    const numSavings = parseFloat(savings) || 0;

    if (!numIncome || numIncome <= 0) return 0;

    const expensePercent = (numExpense / numIncome) * 100;
    const savingsPercent = (numSavings / numIncome) * 100;
    const emiPercent = (numEmi / numIncome) * 100;

    if (expensePercent > 50) {
      const extraExpense = expensePercent - 50;
      score -= extraExpense; 
    }

    if (savingsPercent < 25) {
      const shortfall = 25 - savingsPercent;
      score -= shortfall; 
    }

    if (emiPercent > 30) {
      score -= 10; 
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const toNum = (v) => parseFloat(v || 0);

  const calcPerc = (part, total) => {
    if (!total || total <= 0) return 0;
    return Math.round((part / total) * 100);
  };

  // ✅ Spender type detection
  const detectSpenderType = ({ expensePercent, savingsPercent }) => {
    if (savingsPercent >= 30 && expensePercent <= 50) return "Saver";
    if (expensePercent > 70 || savingsPercent < 10) return "Overspender";
    return "Balanced";
  };

  // ✅ Budget plan split (simple + GenZ friendly)
  const generateBudgetPlan = (income) => {
    const needs = Math.round(income * 0.50);
    const wants = Math.round(income * 0.20);
    const savings = Math.round(income * 0.20);
    const emergency = Math.round(income * 0.05);
    const investments = income - (needs + wants + savings + emergency);

    return {
      needs,
      wants,
      savings,
      emergency,
      investments: Math.max(0, investments),
    };
  };

  // ✅ Hinglish Advice + Suggestions
  const generateAdvice = ({ spenderType, expensePercent, savingsPercent, emiPercent }) => {
    let advice = "";
    const suggestions = [];

    if (spenderType === "Saver") {
      advice = "Bhai tu toh smart saver nikla ✅ Bas consistency maintain kar 💪";
      suggestions.push("Savings ko SIP / investment me convert karo 📈");
    }

    if (spenderType === "Balanced") {
      advice = "You are doing good 👍 Bas thoda aur saving push kar do.";
      if (savingsPercent < 20) suggestions.push("Savings ko minimum 20% target karo ✅");
      if (expensePercent > 60) suggestions.push("Kharcha thoda control karo 😬");
    }

    if (spenderType === "Overspender") {
      advice = "⚠️ Bhai kharcha zyada ho raha hai — ab control zaroori hai!";
      suggestions.push("Wants category me cut karo (food/online shopping) 🛒");
      suggestions.push("Daily spending limit set karo 📌");
    }

    // EMI warning
    if (emiPercent > 30) {
      suggestions.push("EMI bohot heavy hai ⚠️ Loan restructure / prepayment consider karo");
    }

    return { advice, suggestions };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in first!");
        setLoading(false);
        return;
      }

      // 1. Prepare Data
      // If first salary, expense is 0 (system learns later), otherwise user input
      const finalExpense = isFirstSalary ? 0 : formData.expense;
      
      const numIncome = toNum(formData.income);
      const numExpense = toNum(finalExpense);
      const numEmi = toNum(formData.emi);
      const numSavings = toNum(formData.savings);

      const expensePercent = calcPerc(numExpense, numIncome);
      const savingsPercent = calcPerc(numSavings, numIncome);
      const emiPercent = calcPerc(numEmi, numIncome);

      const spenderType = detectSpenderType({ expensePercent, savingsPercent });
      const budgetPlan = generateBudgetPlan(numIncome);
      const { advice, suggestions } = generateAdvice({
        spenderType,
        expensePercent,
        savingsPercent,
        emiPercent
      });

      const score = calculateScore(formData.income, finalExpense, formData.emi, formData.savings);

      const dataToSave = {
        income: formData.income,
        expense: isFirstSalary ? 0 : formData.expense,
        emi: formData.emi || '0',
        savings: formData.savings,
        firstSalary: isFirstSalary, // ✅ Stored as requested
        score: score,
        
        // Insights
        expensePercent,
        savingsPercent,
        emiPercent,
        spenderType,
        adviceText: advice,
        suggestions,
        budgetPlan,
        
        updatedAt: new Date().toISOString()
      };

      console.log("📦 Saving Monthly Data:", dataToSave);

      // 2. Dual Write (Batch)
      // We save to 'users/{uid}/months/{currentMonth}' as requested for history
      // AND 'users/{uid}' to ensure the Dashboard/App routing works correctly with latest profile.
      const batch = writeBatch(db);
      
      const monthRef = doc(db, 'users', user.uid, 'months', currentMonthKey);
      const userRef = doc(db, 'users', user.uid);

      batch.set(monthRef, dataToSave, { merge: true });
      batch.set(userRef, dataToSave, { merge: true });

      await batch.commit();
      
      console.log("✅ Batch write completed!");
      
      // Small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      // Force a reload if needed, but App.js listener should catch it
      // No explicit navigation needed if App.js is listening to userRef
      
    } catch (error) {
      console.error("❌ Error saving data:", error);
      alert("Error saving data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-fuchsia-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-lg bg-[#0f111a]/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/10 relative z-10">
        <button 
          onClick={() => auth.signOut()}
          className="absolute top-6 right-6 text-gray-400 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/5"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>

        {/* 🧠 Top Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Calendar className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome {userName} 👋</h2>
          </div>
          <p className="text-gray-400">Let’s set up your finances for <span className="text-white font-semibold">{currentMonthName}</span></p>
          <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full w-fit">
            <Sparkles className="w-3 h-3" />
            <span>This takes less than 30 seconds</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 🔘 First Salary Toggle (CRITICAL) */}
          <div className="bg-black/20 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:border-violet-500/30 transition-colors">
            <div>
              <p className="font-semibold text-white">This is my first salary</p>
              <p className="text-xs text-gray-400 mt-1">
                {isFirstSalary 
                  ? "We'll learn from your spending automatically" 
                  : "Turn this on if you just started earning"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isFirstSalary}
              onChange={() => setIsFirstSalary(!isFirstSalary)}
              className="w-6 h-6 accent-violet-500 cursor-pointer rounded bg-white/10 border-white/20"
            />
          </div>

          <div className="space-y-4">
            {/* Monthly Salary - Always Visible */}
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Monthly Salary</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  placeholder="e.g. 50000"
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {/* EMI - Always Visible */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">EMI <span className="text-gray-500 text-xs">(Optional)</span></label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                  <input
                    type="number"
                    min="0"
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                    placeholder="0"
                    value={formData.emi}
                    onChange={(e) => setFormData({ ...formData, emi: e.target.value })}
                  />
                </div>
              </div>

               {/* Savings - Always Visible */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                  {isFirstSalary ? "Savings Goal" : "Planned Savings"}
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                    placeholder="e.g. 5000"
                    value={formData.savings}
                    onChange={(e) => setFormData({ ...formData, savings: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 3️⃣ Hide Expense field when fresher */}
            {!isFirstSalary && (
              <div className="group animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Approx Monthly Expenses</label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                    placeholder="e.g. 20000"
                    value={formData.expense}
                    onChange={(e) => setFormData({ ...formData, expense: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 🎯 Button Logic */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up...' : (isFirstSalary ? 'Start My Financial Journey 🚀' : 'Generate My Smart Plan ✨')}
          </button>
        </form>
      </div>
    </div>
  );
}