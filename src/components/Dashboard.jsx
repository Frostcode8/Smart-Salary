import React from 'react';
import { PieChart, TrendingUp, AlertTriangle, CheckCircle, IndianRupee } from 'lucide-react';

export default function Dashboard({ userData, onLogout }) {
  const { score, income, expense, emi, savings } = userData;

  // Determine Status and Color based on logic
  let status = "Risky";
  let color = "text-red-500";
  let bgColor = "bg-red-500/10";
  let borderColor = "border-red-500/20";

  if (score > 70) {
    status = "Good / Safe";
    color = "text-emerald-400";
    bgColor = "bg-emerald-500/10";
    borderColor = "border-emerald-500/20";
  } else if (score > 40) {
    status = "Average";
    color = "text-yellow-400";
    bgColor = "bg-yellow-500/10";
    borderColor = "border-yellow-500/20";
  }

  // Calculate percentages for display
  const incomeVal = parseFloat(income);
  const expensePercent = Math.round((parseFloat(expense) / incomeVal) * 100);
  const savingsPercent = Math.round((parseFloat(savings) / incomeVal) * 100);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <nav className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          SmartSalary Dashboard
        </h1>
        <button onClick={onLogout} className="text-slate-400 hover:text-white transition-colors">
          Logout
        </button>
      </nav>

      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
        {/* SCORE CARD */}
        <div className={`p-8 rounded-3xl border ${borderColor} ${bgColor} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="relative z-10">
            <h2 className="text-slate-400 mb-2">Money Health Score</h2>
            <div className="flex items-baseline gap-4">
              <span className={`text-6xl font-black ${color}`}>{score}%</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${borderColor} ${color}`}>
                {status}
              </span>
            </div>
            
            <p className="mt-4 text-slate-300 text-sm leading-relaxed">
              {score > 70 ? "Your finances are looking great! Keep maintaining your savings ratio." 
               : score > 40 ? "You're doing okay, but watch out for those expenses." 
               : "Critical! Your expenses or debts are too high relative to your income."}
            </p>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <IndianRupee className="w-4 h-4" /> Income
            </div>
            <p className="text-2xl font-bold">₹{parseInt(income).toLocaleString()}</p>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <TrendingUp className="w-4 h-4" /> Expenses
            </div>
            <p className="text-2xl font-bold text-rose-400">{expensePercent}%</p>
            <p className="text-xs text-slate-500">of income</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
             <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <PieChart className="w-4 h-4" /> Savings
            </div>
            <p className="text-2xl font-bold text-emerald-400">{savingsPercent}%</p>
            <p className="text-xs text-slate-500">of income</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
             <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <AlertTriangle className="w-4 h-4" /> EMI Load
            </div>
            <p className="text-2xl font-bold text-yellow-400">₹{parseInt(emi).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}