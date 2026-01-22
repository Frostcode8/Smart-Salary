import React, { useState } from 'react';
import { db, auth } from './firebase.js'; 
import { doc, setDoc } from 'firebase/firestore';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      const score = calculateScore(
        formData.income, 
        formData.expense, 
        formData.emi, 
        formData.savings
      );

      // ✅ FIXED: Correct path structure
      await setDoc(doc(db, 'users', user.uid), {
        ...formData,
        score: score,
        updatedAt: new Date()
      }, { merge: true });

    } catch (error) {
      console.error("Error saving data:", error);
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
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Analyzing...' : 'Generate Dashboard'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}