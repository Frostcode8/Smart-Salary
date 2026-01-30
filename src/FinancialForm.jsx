import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, writeBatch, getDoc } from "firebase/firestore";
import { IndianRupee, LogOut, Sparkles, Calendar, History, ArrowDown, Layers, Bug } from 'lucide-react';

// 🔥 FIREBASE INITIALIZATION (Inline for Stability)
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function FinancialForm() {
  const [formData, setFormData] = useState({
    income: '',
    emi: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('User');

  // 🔄 New State for Previous Month Data
  const [prevMonthData, setPrevMonthData] = useState(null);
  const [checkingHistory, setCheckingHistory] = useState(true);

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  // Calculate Previous Month Key
  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonthKey = prevDate.toISOString().slice(0, 7);

  useEffect(() => {
    if (auth.currentUser?.displayName) {
      setUserName(auth.currentUser.displayName.split(' ')[0]); 
    }

    // 🕵️ Fetch Previous Month Data
    const fetchPrevMonth = async () => {
      if (!auth.currentUser) {
        setCheckingHistory(false);
        return;
      }
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid, 'months', prevMonthKey);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setPrevMonthData(snap.data());
        }
      } catch (error) {
        console.error("Error fetching prev month:", error);
      } finally {
        setCheckingHistory(false);
      }
    };
    
    fetchPrevMonth();
  }, []);

  const toNum = (v) => parseFloat(v || 0);

  // 📊 2️⃣ Income-Based Smart Allocation (Dynamic Model)
  // ✅ UPDATED: Now generates plan based on NET INCOME (Disposable), not Gross
  const generateBudgetPlan = (netIncome) => {
    let needsPct, wantsPct, savingsPct, emergencyPct;

    // Adjusted brackets since we are dealing with post-EMI money
    if (netIncome < 20000) {
      needsPct = 0.60; wantsPct = 0.15; savingsPct = 0.15; emergencyPct = 0.10;
    } else if (netIncome <= 50000) {
      needsPct = 0.50; wantsPct = 0.20; savingsPct = 0.20; emergencyPct = 0.10;
    } else {
      needsPct = 0.40; wantsPct = 0.20; savingsPct = 0.30; emergencyPct = 0.10;
    }

    const needs = Math.round(netIncome * needsPct);
    const wants = Math.round(netIncome * wantsPct);
    const savings = Math.round(netIncome * savingsPct);
    const emergency = Math.round(netIncome * emergencyPct);
    const investments = 0; 

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

      // ✅ CHANGE 1: Calculate Net Income (Spendable)
      const netIncome = Math.max(0, numIncome - numEmi);

      // ✅ CHANGE 1: Generate Plan based on Net Income
      const budgetPlan = generateBudgetPlan(netIncome);

      // 💰 NEW: Calculate Accumulated Savings & Emergency Fund
      let accumulatedSavings = budgetPlan.savings;
      let accumulatedEmergency = budgetPlan.emergency;

      // Check if previous month exists and has accumulated values
      if (prevMonthData?.budgetPlan) {
        const prevAccumSavings = prevMonthData.budgetPlan.accumulatedSavings || prevMonthData.budgetPlan.savings || 0;
        const prevAccumEmergency = prevMonthData.budgetPlan.accumulatedEmergency || prevMonthData.budgetPlan.emergency || 0;
        
        accumulatedSavings = prevAccumSavings + budgetPlan.savings;
        accumulatedEmergency = prevAccumEmergency + budgetPlan.emergency;
      }

      // Add accumulated values to budget plan
      budgetPlan.accumulatedSavings = accumulatedSavings;
      budgetPlan.accumulatedEmergency = accumulatedEmergency;

      // ✅ CHANGE 2: Save netIncome to DB
      const dataToSave = {
        income: formData.income,
        emi: formData.emi || '0',
        netIncome: netIncome, // Store this for easier dashboard math
        expense: 0, 
        score: 100, 
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

  // ⚡ Quick Fill Handlers
  const fillIncome = () => {
    if (prevMonthData?.income) setFormData(prev => ({ ...prev, income: prevMonthData.income }));
  };

  const fillEmi = () => {
    if (prevMonthData?.emi) setFormData(prev => ({ ...prev, emi: prevMonthData.emi }));
  };

  const fillBoth = () => {
    if (prevMonthData) {
        setFormData({
            income: prevMonthData.income || '',
            emi: prevMonthData.emi || ''
        });
    }
  };

  // 🧪 DEBUG: Simulate Returning User
  const toggleSimulation = () => {
    if (prevMonthData) {
      setPrevMonthData(null); 
      setFormData({ income: '', emi: '' });
    } else {
      setPrevMonthData({ income: '75000', emi: '12000' }); 
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

          {/* ⚡ NEW: Previous Month Buttons */}
          {!checkingHistory && prevMonthData && (
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 animate-in fade-in slide-in-from-right duration-300">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <History className="w-3 h-3 text-violet-400" />
                <span className="uppercase tracking-wider font-semibold">Quick Fill from Last Month</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    {prevMonthData.income && (
                    <button 
                        type="button"
                        onClick={fillIncome}
                        className="flex-1 py-2 px-3 bg-black/40 hover:bg-violet-500/20 hover:border-violet-500/30 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95 group"
                    >
                        <span>Income: ₹{prevMonthData.income}</span>
                        <ArrowDown className="w-3 h-3 text-gray-500 group-hover:text-violet-400" />
                    </button>
                    )}
                    {prevMonthData.emi && parseFloat(prevMonthData.emi) > 0 && (
                    <button 
                        type="button"
                        onClick={fillEmi}
                        className="flex-1 py-2 px-3 bg-black/40 hover:bg-violet-500/20 hover:border-violet-500/30 border border-white/10 rounded-lg text-xs text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95 group"
                    >
                        <span>EMI: ₹{prevMonthData.emi}</span>
                        <ArrowDown className="w-3 h-3 text-gray-500 group-hover:text-violet-400" />
                    </button>
                    )}
                </div>
                
                {/* Fill Both Button */}
                {prevMonthData.income && prevMonthData.emi && parseFloat(prevMonthData.emi) > 0 && (
                    <button 
                        type="button"
                        onClick={fillBoth}
                        className="w-full py-2 px-3 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 rounded-lg text-xs text-violet-300 hover:text-violet-200 flex items-center justify-center gap-2 transition-all active:scale-95 font-medium"
                    >
                        <Layers className="w-3 h-3" />
                        <span>Auto-Fill Everything</span>
                    </button>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Generate My AI Plan ✨'}
          </button>
        </form>

        {/* 🧪 DEV BUTTON */}
        <button 
          type="button" 
          onClick={toggleSimulation}
          className="w-full mt-4 flex items-center justify-center gap-1 text-[10px] text-gray-600 hover:text-white transition-colors"
        >
          <Bug className="w-3 h-3" />
          {prevMonthData ? 'Test: Switch to New User View' : 'Test: Switch to Returning User View'}
        </button>

      </div>
    </div>
  );
}