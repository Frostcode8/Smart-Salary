import React, { useState } from "react";
import { 
  X, TrendingUp, Shield, DollarSign, PieChart, 
  ToggleLeft, ToggleRight, Info, Award
} from "lucide-react";

export default function InvestmentPlans({ open, onClose, income }) {
  const [showPersonalized, setShowPersonalized] = useState(true);

  if (!open) return null;

  // 💰 Calculations for User-Centric Data
  const monthlyInvestable = Math.round(income * 0.20); // 20% of income rule
  const sipAmount = Math.round(monthlyInvestable * 0.60); // 60% of savings to Equity
  const safeAmount = Math.round(monthlyInvestable * 0.30); // 30% to Debt/PPF
  const goldAmount = Math.round(monthlyInvestable * 0.10); // 10% to Gold

  // 📄 Content Data
  const plans = [
    {
      title: "Wealth Creation (High Growth)",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      desc: "Best for long-term goals (>5 years). Equity Mutual Funds offer high returns over time.",
      userAmount: `₹${sipAmount.toLocaleString()}/mo`,
      genericText: "Start an SIP with 10-15% of your salary in Index Funds or Flexi-cap Funds."
    },
    {
      title: "Safety Net (Risk-Free)",
      icon: Shield,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      desc: "Guaranteed returns. PPF (Public Provident Fund) or recurring deposits.",
      userAmount: `₹${safeAmount.toLocaleString()}/mo`,
      genericText: "Allocate 5-10% to PPF or Govt Bonds. Essential for stability."
    },
    {
      title: "Gold / Hedge",
      icon: Award,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      desc: "Hedge against inflation. Sovereign Gold Bonds (SGB) earn 2.5% interest + appreciation.",
      userAmount: `₹${goldAmount.toLocaleString()}/mo`,
      genericText: "Buy digital gold or SGBs with 5% of monthly income. Avoid jewelry for investment."
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f111a] border border-white/10 rounded-none sm:rounded-[2rem] w-full max-w-4xl h-full sm:h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#121215]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-violet-400" />
              Investment Strategy
            </h2>
            <p className="text-xs text-gray-400 mt-1">Smart allocation based on financial best practices</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Toggle Switch */}
            <button 
              onClick={() => setShowPersonalized(!showPersonalized)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs text-gray-300"
            >
              {showPersonalized ? <ToggleRight className="w-4 h-4 text-violet-400" /> : <ToggleLeft className="w-4 h-4 text-gray-500" />}
              {showPersonalized ? "User Centric Mode" : "General Mode"}
            </button>

            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Mobile Toggle (Visible only on small screens) */}
        <div className="sm:hidden px-6 py-3 border-b border-white/5 bg-[#121215]">
           <button 
              onClick={() => setShowPersonalized(!showPersonalized)}
              className="flex w-full justify-between items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-gray-300"
            >
              <span>{showPersonalized ? "Showing Your Numbers" : "Showing General Rules"}</span>
              {showPersonalized ? <ToggleRight className="w-5 h-5 text-violet-400" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f] space-y-6">
          
          {/* Summary Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border border-violet-500/20 text-center">
            <p className="text-sm text-violet-200 uppercase tracking-wider font-semibold mb-2">Total Monthly Investment Potential</p>
            <h3 className="text-4xl font-bold text-white mb-2">
              {showPersonalized ? `₹${monthlyInvestable.toLocaleString()}` : "20% of Salary"}
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              {showPersonalized 
                ? "Based on your income, this is the recommended amount to set aside for future growth." 
                : "Financial experts recommend saving at least 20% of your income strictly for investments."}
            </p>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div key={index} className={`p-5 rounded-2xl border ${plan.bg} ${plan.border} flex flex-col`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-black/20 ${plan.color}`}>
                    <plan.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">{plan.title}</h4>
                </div>
                
                <div className="mb-4">
                  <span className={`text-2xl font-bold ${plan.color}`}>
                    {showPersonalized ? plan.userAmount : "Allocation Rule"}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-4 flex-1">
                  {showPersonalized ? plan.desc : plan.genericText}
                </p>

                {showPersonalized && (
                  <div className="mt-auto pt-3 border-t border-white/5">
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Recommended Action
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="text-[10px] text-gray-600 text-center pt-8 pb-4">
            Disclaimer: This is generated advice based on standard financial principles. 
            Please consult a certified financial advisor before making actual investments.
          </div>

        </div>
      </div>
    </div>
  );
}