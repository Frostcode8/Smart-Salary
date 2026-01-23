import React, { useState } from 'react';
import { db, auth } from './firebase.js'; 
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { Calculator, ArrowRight, IndianRupee, LogOut } from 'lucide-react';

export default function FinancialForm() {
  const [formData, setFormData] = useState({
    income: '',
    expense: '',
    emi: '',
    savings: ''
  });
  const [loading, setLoading] = useState(false);

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

  // Timeout wrapper for Firestore operations
  const withTimeout = (promise, timeoutMs = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out after ' + timeoutMs + 'ms')), timeoutMs)
      )
    ]);
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
        console.error("❌ No user logged in!");
        alert("Please log in first!");
        setLoading(false);
        return;
      }

      console.log("🔹 Saving data for user:", user.uid);

      const score = calculateScore(
        formData.income, 
        formData.expense, 
        formData.emi, 
        formData.savings
      );

      const docRef = doc(db, 'users', user.uid);
      
      const numIncome = toNum(formData.income);
const numExpense = toNum(formData.expense);
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

      const dataToSave = {
  income: formData.income,
  expense: formData.expense,
  emi: formData.emi || '0',
  savings: formData.savings,
  score: score,

  // ✅ NEW Calculations
  expensePercent,
  savingsPercent,
  emiPercent,

  // ✅ NEW Insights
  spenderType,
  adviceText: advice,
  suggestions,

  // ✅ NEW Budget Plan
  budgetPlan,

  updatedAt: new Date().toISOString()
};


      console.log("📦 Data to save:", dataToSave);
      console.log("📍 Document path:", `users/${user.uid}`);
      
      // Try with batch write instead (sometimes more reliable)
      console.log("⏳ Starting batch write...");
      const batch = writeBatch(db);
      batch.set(docRef, dataToSave, { merge: true });
      
      await withTimeout(batch.commit(), 10000);
      console.log("✅ Batch write completed successfully!");

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify the write
      console.log("⏳ Verifying with getDoc...");
      const verifyDoc = await withTimeout(getDoc(docRef), 10000);
      
      if (verifyDoc.exists()) {
        console.log("✅ VERIFIED: Data exists in Firestore:", verifyDoc.data());
        alert("Success! Your financial profile has been saved.");
      } else {
        console.error("❌ WARNING: Document not found after write!");
        alert("Warning: Data may not have been saved properly.");
      }
      
    } catch (error) {
      console.error("❌ Error saving data:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      
      if (error.message.includes('timed out')) {
        alert("The operation is taking too long. This might be due to network restrictions. Your data may still be saving in the background. Please refresh and check if your dashboard appears.");
      } else {
        alert("Error saving data: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
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

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl shadow-lg shadow-violet-500/20">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Financial Health Check</h2>
            <p className="text-gray-400 text-sm">Let's build your financial profile</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Monthly Income</label>
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
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Monthly Expenses</label>
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

              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Total EMI</label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                  <input
                    type="number"
                    min="0"
                    className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                    placeholder="Optional"
                    value={formData.emi}
                    onChange={(e) => setFormData({ ...formData, emi: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Monthly Savings</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full pl-11 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  placeholder="e.g. 10000"
                  value={formData.savings}
                  onChange={(e) => setFormData({ ...formData, savings: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Generate Dashboard'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}