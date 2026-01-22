import React, { useState } from 'react';
// Fixed import path: Added .js extension to ensure resolution
import { db, auth } from '../firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import { Calculator, ArrowRight, IndianRupee } from 'lucide-react';

export default function FinancialForm({ onComplete }) {
  const [formData, setFormData] = useState({
    income: '',
    expense: '',
    emi: '',
    savings: ''
  });
  const [loading, setLoading] = useState(false);

  const calculateScore = (income, expense, emi, savings) => {
    let score = 100;
    
    // Convert string inputs to numbers
    const numIncome = parseFloat(income);
    const numExpense = parseFloat(expense);
    const numEmi = parseFloat(emi) || 0;
    const numSavings = parseFloat(savings) || 0;

    // Percentages
    const expensePercent = (numExpense / numIncome) * 100;
    const savingsPercent = (numSavings / numIncome) * 100;
    const emiPercent = (numEmi / numIncome) * 100;

    // 1. Expense Penalty
    if (expensePercent > 50) {
      score -= (expensePercent - 50);
    }

    // 2. Savings Penalty
    if (savingsPercent < 25) {
      score -= (25 - savingsPercent);
    }

    // 3. EMI Penalty
    if (emiPercent > 30) {
      score -= 10;
    }

    // Clamp score between 0 and 100
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

      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), {
        ...formData,
        score: score,
        updatedAt: new Date()
      });

      onComplete(); // Navigate to Dashboard
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-violet-500/10 rounded-xl">
            <Calculator className="w-6 h-6 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Financial Health Check</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {['income', 'expense', 'emi', 'savings'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-400 mb-2 capitalize">
                Monthly {field === 'emi' ? 'EMI' : field}
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  required={field !== 'emi' && field !== 'savings'}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="0"
                  value={formData[field]}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                />
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Analyzing...' : 'Generate My Score'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}