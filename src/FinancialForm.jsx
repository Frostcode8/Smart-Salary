import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js'; 
import { doc, writeBatch } from 'firebase/firestore';
import { IndianRupee, LogOut, Sparkles, Calendar } from 'lucide-react';

export default function FinancialForm() {
  const [formData, setFormData] = useState({
    income: '',
    emi: ''
  });
  const [isFirstSalary, setIsFirstSalary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('User');

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (auth.currentUser?.displayName) {
      setUserName(auth.currentUser.displayName.split(' ')[0]); 
    }
  }, []);

  const toNum = (v) => parseFloat(v || 0);

  // 📊 2️⃣ Income-Based Smart Allocation (Dynamic Model)
  const generateBudgetPlan = (income) => {
    let needsPct, wantsPct, savingsPct, emergencyPct;

    if (income < 30000) {
      needsPct = 0.60; wantsPct = 0.15; savingsPct = 0.15; emergencyPct = 0.10;
    } else if (income <= 70000) {
      needsPct = 0.50; wantsPct = 0.20; savingsPct = 0.20; emergencyPct = 0.10;
    } else {
      needsPct = 0.40; wantsPct = 0.20; savingsPct = 0.30; emergencyPct = 0.10;
    }

    const needs = Math.round(income * needsPct);
    const wants = Math.round(income * wantsPct);
    const savings = Math.round(income * savingsPct);
    const emergency = Math.round(income * emergencyPct);
    const investments = 0; // Keeping it simple for initial setup

    return { needs, wants, savings, emergency, investments };
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

      const numIncome = toNum(formData.income);
      const numEmi = toNum(formData.emi);

      const budgetPlan = generateBudgetPlan(numIncome);

      const dataToSave = {
        income: formData.income,
        emi: formData.emi || '0',
        expense: 0, // Starts at 0
        firstSalary: isFirstSalary,
        score: 100, // Starts perfect
        
        budgetPlan,
        spenderType: "Balanced",
        adviceText: "Plan created! Start tracking expenses to get live insights.",
        
        updatedAt: new Date().toISOString()
      };

      console.log("📦 Saving Monthly Data:", dataToSave);

      const batch = writeBatch(db);
      
      const monthRef = doc(db, 'users', user.uid, 'months', currentMonthKey);
      const userRef = doc(db, 'users', user.uid);

      batch.set(monthRef, dataToSave, { merge: true });
      batch.set(userRef, dataToSave, { merge: true });

      await batch.commit();
      
      // Delay for UI effect
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error("❌ Error saving data:", error);
      alert("Error saving data: " + error.message);
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
            <span>AI Auto-Budgeting Active</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-black/20 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:border-violet-500/30 transition-colors">
            <div>
              <p className="font-semibold text-white">This is my first salary</p>
              <p className="text-xs text-gray-400 mt-1">
                {isFirstSalary 
                  ? "We'll be extra gentle with the plan" 
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

            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Fixed EMI / Rent <span className="text-gray-500 text-xs">(Needs)</span></label>
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Generate My AI Plan ✨'}
          </button>
        </form>
      </div>
    </div>
  );
}