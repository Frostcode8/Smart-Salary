import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  Timestamp,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "./firebase.js";

import {
  LogOut,
  Plus,
  Loader2,
  TrendingUp,
  X,
  Activity,
  CheckCircle,
  Wallet,
  ArrowDown,
  Trash2,
  ShoppingBag,
  Coffee,
  Car,
  Film,
  Zap,
  Home,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  YAxis,
  AreaChart,
  Area,
  ComposedChart,
  Line
} from "recharts";

const Dashboard = ({ user, onLogout, currentMonthKey: initialMonthKey }) => {
  // 🗓️ Month Selection State
  const [selectedMonthKey, setSelectedMonthKey] = useState(initialMonthKey);
  
  const [monthData, setMonthData] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  
  // Format the selected month name
  const monthName = new Date(selectedMonthKey + "-01").toLocaleString('default', { month: 'long', year: 'numeric' });
  const userName = user.displayName ? user.displayName.split(' ')[0] : 'User';

  const categories = [
    { name: "Food", icon: Coffee, color: "text-amber-400", bg: "bg-amber-400/10" },
    { name: "Travel", icon: Car, color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Entertainment", icon: Film, color: "text-purple-400", bg: "bg-purple-400/10" },
    { name: "Shopping", icon: ShoppingBag, color: "text-pink-400", bg: "bg-pink-400/10" },
    { name: "Bills", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { name: "Rent", icon: Home, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { name: "Other", icon: MoreHorizontal, color: "text-gray-400", bg: "bg-gray-400/10" }
  ];

  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    category: "Food",
    transactionDate: new Date().toISOString().split("T")[0],
  });

  // 🔄 Month Navigation Handlers
  const changeMonth = (offset) => {
    const date = new Date(selectedMonthKey + "-01");
    date.setMonth(date.getMonth() + offset);
    const newKey = date.toISOString().slice(0, 7);
    setSelectedMonthKey(newKey);
  };

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Plan for SELECTED month
    const monthDocRef = doc(db, 'users', user.uid, 'months', selectedMonthKey);
    const unsubMonth = onSnapshot(monthDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setMonthData(docSnap.data());
      } else {
        setMonthData(null); 
      }
    });

    // 2. Fetch ALL transactions
    const q = query(
      collection(db, "users", user.uid, "financial_records"),
      orderBy("createdAt", "desc")
    );

    const unsubRecords = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setRecords(data);
      setLoading(false);
    });

    return () => {
      unsubMonth();
      unsubRecords();
    };
  }, [user, selectedMonthKey]); 

  // Filter records for the selected month
  const currentMonthRecords = useMemo(() => {
    return records.filter(r => {
      const recDate = r.createdAt?.seconds 
        ? new Date(r.createdAt.seconds * 1000).toISOString().slice(0,7) 
        : "";
      return recDate === selectedMonthKey && r.type === 'expense';
    });
  }, [records, selectedMonthKey]);

  // 🔥 1. Calculate Real Totals (Loophole Fix #1 & #3)
  const totalActualExpense = useMemo(() => {
    return currentMonthRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [currentMonthRecords]);

  // Derived values from Month Data + Real Totals
  const income = monthData ? parseFloat(monthData.income || 0) : 0;
  const emi = monthData ? parseFloat(monthData.emi || 0) : 0;
  const savingsTarget = monthData ? parseFloat(monthData.savings || 0) : 0;
  
  // ✅ Loophole Fix #2: Real Savings Calculation
  const realSavings = income - totalActualExpense - emi;
  
  // Calculate Dynamic Score (Loophole Fix #1)
  const dynamicScore = useMemo(() => {
    if (!income || income <= 0) return 0;

    let score = 100;
    
    // Ratios based on ACTUAL spending
    const expensePercent = (totalActualExpense / income) * 100;
    const savingsPercent = (realSavings / income) * 100;
    const emiPercent = (emi / income) * 100;

    // Penalty for overspending ( >50% of income)
    if (expensePercent > 50) {
      score -= (expensePercent - 50); 
    }

    // Penalty for low savings ( <20% of income)
    if (savingsPercent < 20) {
      // If savings are negative (debt), heavy penalty
      if (savingsPercent < 0) score -= 40; 
      else score -= (20 - savingsPercent); 
    }

    // Penalty for high EMI
    if (emiPercent > 30) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }, [income, totalActualExpense, realSavings, emi]);

  // 🤖 Dynamic AI Insight based on Real-time data
  const aiInsight = useMemo(() => {
    if (realSavings < 0) return { 
      text: "⚠️ Bhai iss month overspending ho raha hai! Savings negative jaa rahi hai.", 
      color: "text-red-400", 
      bg: "bg-red-500/10",
      border: "border-red-500/20"
    };
    if (realSavings < savingsTarget) return { 
      text: `Target se ₹${(savingsTarget - realSavings).toLocaleString()} door ho. Thoda control karo!`, 
      color: "text-amber-400", 
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    };
    if (dynamicScore >= 80) return {
      text: "Gazab! You are on fire 🔥 Savings target met comfortably.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    };
    return { 
      text: monthData?.adviceText || "Keep tracking to stay on top.", 
      color: "text-violet-200", 
      bg: "bg-white/5",
      border: "border-white/10"
    };
  }, [realSavings, savingsTarget, dynamicScore, monthData]);


  const expenseByCategory = useMemo(() => {
    const map = currentMonthRecords.reduce((acc, r) => {
      const cat = r.category || "Other";
      acc[cat] = (acc[cat] || 0) + (r.amount || 0);
      return acc;
    }, {});

    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthRecords]);

  // 👻 Trend Data with Ghost Comparison
  const trendData = useMemo(() => {
    const map = {};
    records.forEach(r => {
      if (r.type !== 'expense') return;
      const date = r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : null;
      if (!date) return;
      
      const key = date.toLocaleString('default', { month: 'short' }); 
      const sortKey = date.toISOString().slice(0, 7); 
      
      if (!map[sortKey]) map[sortKey] = { month: key, amount: 0, sortKey };
      map[sortKey].amount += r.amount;
    });

    const sortedMonths = Object.values(map).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return sortedMonths.map((item, index) => {
      const prevItem = sortedMonths[index - 1];
      return {
        ...item,
        amount: Math.round(item.amount),
        prevAmount: prevItem ? Math.round(prevItem.amount) : 0 
      };
    }).slice(-6); 
  }, [records]);

  const COLORS = ["#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#6b7280"];

  const handleSaveTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) return;
    setAddingExpense(true); 

    try {
      const selectedDate = new Date(newTransaction.transactionDate + "T12:00:00");
      const createdAt = Timestamp.fromDate(selectedDate);

      // Save Transaction
      await addDoc(collection(db, "users", user.uid, "financial_records"), {
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        type: "expense", 
        category: newTransaction.category,
        createdAt,
      });

      // ✅ Update Score in Firestore (Optional but good for persistency)
      if (monthData) {
        const monthRef = doc(db, 'users', user.uid, 'months', selectedMonthKey);
        // We update score in DB just so other views might see it, but UI uses 'dynamicScore'
        updateDoc(monthRef, { score: dynamicScore }).catch(e => console.log("Score update diff deferred"));
      }

      setShowTransactionForm(false);
      setNewTransaction({
        description: "",
        amount: "",
        category: "Food",
        transactionDate: new Date().toISOString().split("T")[0],
      });
      
      setTimeout(() => setAddingExpense(false), 1000);

    } catch (error) {
      console.error("Error saving transaction:", error);
      setAddingExpense(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this transaction?")) {
      await deleteDoc(doc(db, "users", user.uid, "financial_records", id));
    }
  };

  const getCategoryIcon = (catName) => {
    const category = categories.find(c => c.name === catName) || categories[categories.length - 1];
    const Icon = category.icon;
    return (
      <div className={`w-9 h-9 rounded-full ${category.bg} flex items-center justify-center ${category.color} shadow-sm`}>
        <Icon className="w-4 h-4" />
      </div>
    );
  };

  const PlanBar = ({ label, amount, total, colorClass, isSavings }) => {
    if (!amount) return null;
    // For savings, we compare Real vs Income, or use the Amount passed
    const displayAmount = isSavings ? realSavings : amount;
    const percent = total ? Math.min(100, Math.max(0, Math.round((displayAmount / total) * 100))) : 0;
    
    // Color logic for savings: if negative, red; if below target, amber; else normal
    let finalColor = colorClass;
    if (isSavings) {
       if (displayAmount < 0) finalColor = "bg-red-500 shadow-[0_0_10px_-2px_rgba(239,68,68,0.5)]";
       else if (displayAmount < amount) finalColor = "bg-amber-500 shadow-[0_0_10px_-2px_rgba(245,158,11,0.5)]";
    }

    return (
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400 font-medium">{label}</span>
          <span className={`font-semibold ${isSavings && displayAmount < amount ? "text-amber-400" : "text-white"}`}>
            ₹{displayAmount.toLocaleString()} 
            {isSavings && displayAmount !== amount && (
               <span className="text-[10px] text-gray-500 ml-1">
                 (Target: ₹{amount.toLocaleString()})
               </span>
            )}
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-full rounded-full ${finalColor} transition-all duration-1000 ease-out origin-left scale-x-0 animate-[shimmer_2s_infinite]`} 
            style={{ 
              width: `${percent}%`,
              animation: 'growWidth 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' 
            }}
          ></div>
        </div>
      </div>
    );
  };

  // 🌟 Particle Background Component
  const ParticleBackground = ({ score }) => {
    const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full opacity-20 ${color} blur-xl animate-float`}
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-violet-500/30 pb-24 relative overflow-hidden">
      
      {/* 🌟 Particle Background */}
      <ParticleBackground score={dynamicScore} />

      {/* Static Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-violet-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <div className="bg-[#0a0a0f]/80 border-b border-white/5 sticky top-0 z-40 backdrop-blur-xl shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Hello, {userName} 👋
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Financial health for <span className="text-violet-400 font-medium">{monthName}</span>
            </p>
          </div>

          {/* 🗓️ MONTH SELECTOR */}
          <div className="flex items-center bg-white/5 rounded-full border border-white/5 p-1 shadow-inner">
            <button 
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 flex items-center gap-2 text-sm font-medium min-w-[140px] justify-center text-gray-200">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              {monthName}
            </div>
            <button 
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={onLogout} 
            className="hidden sm:block p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-105 active:scale-95 border border-white/5 shadow-md"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 relative z-10">
        
        {!monthData && !loading && (
           <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 text-amber-200 mb-2 backdrop-blur-md">
             <div className="p-2 bg-amber-500/20 rounded-full"><Activity className="w-4 h-4" /></div>
             <p className="text-sm">No budget plan found for {monthName}. You are viewing raw expenses only.</p>
           </div>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 1. Health Score (Left Column) */}
          <div className="lg:col-span-4 bg-[#0f111a]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-violet-500/20 transition-all duration-500 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full animate-pulse"></div>
              
              <div className="relative w-40 h-40 transition-transform duration-700 hover:scale-105">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * dynamicScore) / 100}
                    className={`transition-all duration-1000 ease-out ${
                      dynamicScore >= 70 ? "text-emerald-500" : dynamicScore >= 40 ? "text-amber-500" : "text-red-500"
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white tracking-tight animate-[fadeInUp_0.5s_ease-out]">{dynamicScore}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mt-1">Score</span>
                </div>
              </div>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold mb-3 border shadow-sm ${
              dynamicScore >= 70 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : dynamicScore >= 40 
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                  : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {dynamicScore >= 70 ? <CheckCircle className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
              <span>{dynamicScore >= 70 ? "Excellent" : dynamicScore >= 40 ? "Average" : "Needs Care"}</span>
            </div>
            
            {/* 🤖 AI Insight Box */}
            <div className={`w-full p-3 rounded-xl border ${aiInsight.bg} ${aiInsight.border} mt-2 text-left flex gap-3 items-start`}>
               <div className={`p-1.5 rounded-full bg-black/20 shrink-0 mt-0.5`}>
                  <AlertTriangle className={`w-3 h-3 ${aiInsight.color}`} />
               </div>
               <p className={`text-xs ${aiInsight.color} leading-relaxed`}>
                 "{aiInsight.text}"
               </p>
            </div>
          </div>

          {/* 2. Smart Allocation (Right Column) */}
          {monthData?.budgetPlan && (
            <div className="lg:col-span-8 bg-[#0f111a]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 relative group hover:border-blue-500/20 transition-all duration-500 shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors" />
              
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]">
                  <Wallet className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-white">Smart Allocation</h2>
                  <p className="text-sm text-gray-400">Actual vs Planned (Includes Fixed EMI)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                <PlanBar 
                  label="Fixed EMI" 
                  amount={emi} 
                  total={income} 
                  colorClass="bg-gradient-to-r from-gray-600 to-gray-500 shadow-[0_0_10px_-2px_rgba(107,114,128,0.5)]" 
                />
                <PlanBar 
                  label="Savings (Real vs Target)" 
                  amount={savingsTarget} 
                  total={income} 
                  isSavings={true}
                  colorClass="bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)]" 
                />
                 <PlanBar 
                  label="Needs (50%)" 
                  amount={monthData.budgetPlan.needs} 
                  total={income} 
                  colorClass="bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_-2px_rgba(59,130,246,0.5)]" 
                />
                <PlanBar 
                  label="Wants (20%)" 
                  amount={monthData.budgetPlan.wants} 
                  total={income} 
                  colorClass="bg-gradient-to-r from-pink-600 to-pink-400 shadow-[0_0_10px_-2px_rgba(236,72,153,0.5)]" 
                />
                <PlanBar 
                  label="Investments" 
                  amount={monthData.budgetPlan.investments} 
                  total={income} 
                  colorClass="bg-gradient-to-r from-violet-600 to-violet-400 shadow-[0_0_10px_-2px_rgba(139,92,246,0.5)]" 
                />
              </div>
            </div>
          )}

          {/* 3. Reality Check (Pie Chart) - With Micro-Interaction Pulse */}
          <div className="lg:col-span-5 bg-[#0f111a]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 flex flex-col hover:border-pink-500/20 transition-all duration-500 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2.5 bg-pink-500/10 rounded-xl border border-pink-500/20 shadow-sm ${addingExpense ? 'animate-pulse ring-2 ring-pink-500/30' : ''}`}>
                <Activity className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Spending Reality</h2>
                <p className="text-xs text-gray-400">Total Expenses (Excl. EMI)</p>
              </div>
            </div>

            <div className="my-6">
              <span className={`text-4xl font-bold text-white tracking-tight inline-block transition-transform duration-300 ${addingExpense ? 'scale-110 text-pink-300' : ''}`}>
                ₹{totalActualExpense.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 ml-2">total spent</span>
            </div>

            <div className={`h-[250px] w-full mt-auto transition-all duration-700 ${addingExpense ? 'rotate-3 scale-105' : ''}`}>
              {expenseByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span className="text-gray-400 text-xs ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 opacity-30" />
                  </div>
                  <p className="text-sm">No expenses recorded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. The Trend (Area Chart) - With Ghost Comparison */}
          <div className="lg:col-span-7 bg-[#0f111a]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 flex flex-col hover:border-amber-500/20 transition-all duration-500 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-sm">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Spending Trend</h2>
                <p className="text-xs text-gray-400">vs Previous Month (Ghost Bar)</p>
              </div>
            </div>

            <div className="h-[300px] w-full mt-auto">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{fill: '#9ca3af', fontSize: 11}} 
                      axisLine={false} 
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      tick={{fill: '#9ca3af', fontSize: 11}} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(value) => `₹${value/1000}k`}
                    />
                    <Tooltip 
                      cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2}}
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                    />
                    
                    {/* Ghost Bar (Previous Month) */}
                    <Bar dataKey="prevAmount" name="Last Month" fill="#374151" radius={[4, 4, 0, 0]} barSize={20} opacity={0.3} />
                    
                    {/* Current Trend Area */}
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      name="This Month"
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Start adding expenses to see your trend
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. Transactions List */}
        <div className="bg-[#0f111a]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all duration-500 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg text-white">Recent Transactions</h2>
            <button 
              onClick={() => setShowTransactionForm(true)}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl transition active:scale-95 flex items-center gap-2 text-sm font-medium shadow-[0_4px_10px_-1px_rgba(0,0,0,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>Add New</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500"/>
              </div>
            ) : currentMonthRecords.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <Wallet className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-400 font-medium">No expenses yet this month</p>
                <p className="text-gray-600 text-sm">Your wallet is safe... for now.</p>
              </div>
            ) : (
              currentMonthRecords.map((record) => (
                <div key={record.id} className="bg-[#18181b]/50 border border-white/5 p-4 rounded-2xl flex items-start justify-between group hover:bg-white/5 hover:border-white/10 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="flex items-start gap-4">
                    {getCategoryIcon(record.category)}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-white truncate pr-2">{record.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {record.category}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1 font-medium uppercase tracking-wide">
                        {new Date(record.createdAt?.seconds * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-bold text-sm text-white whitespace-nowrap">-₹{record.amount.toLocaleString()}</span>
                    <button 
                      onClick={() => handleDelete(record.id)}
                      className="text-gray-600 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button - Dark Mode Neumorphism */}
      <button
        onClick={() => setShowTransactionForm(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-4 rounded-2xl shadow-[0_4px_20px_-1px_rgba(139,92,246,0.5)] hover:shadow-[0_4px_25px_0px_rgba(139,92,246,0.6)] hover:scale-105 active:scale-95 transition-all z-50 group"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Add Expense Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[#121215] border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom duration-300 relative overflow-hidden">
            {/* Modal Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] -z-10" />
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white">Add Expense</h3>
                <p className="text-sm text-gray-400">Track where your money goes</p>
              </div>
              <button 
                onClick={() => setShowTransactionForm(false)} 
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider ml-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full mt-2 p-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-violet-500 focus:bg-white/5 outline-none text-lg transition-all placeholder:text-gray-700 shadow-inner"
                  placeholder="e.g. Starbucks, Uber, Groceries"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider ml-1">Amount</label>
                <div className="relative mt-2">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-light">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full p-4 pl-10 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-violet-500 focus:bg-white/5 outline-none text-xl font-bold transition-all placeholder:text-gray-700 shadow-inner"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wider ml-1">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full mt-2 p-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-violet-500 focus:bg-white/5 outline-none transition-all text-sm shadow-inner"
                    value={newTransaction.transactionDate}
                    onChange={(e) => setNewTransaction({ ...newTransaction, transactionDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wider ml-1">Category</label>
                  <div className="relative">
                    <select
                      className="w-full mt-2 p-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-violet-500 focus:bg-white/5 outline-none appearance-none transition-all text-sm shadow-inner"
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                    >
                      {categories.map(c => <option key={c.name} value={c.name} className="bg-zinc-900">{c.name}</option>)}
                    </select>
                    <ArrowDown className="absolute right-4 top-[60%] -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveTransaction}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-bold text-lg shadow-[0_4px_20px_-1px_rgba(139,92,246,0.5)] hover:shadow-[0_4px_25px_0px_rgba(139,92,246,0.6)] active:scale-[0.98] transition-all mt-4"
              >
                Save Transaction
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); opacity: 0.1; }
          25% { transform: translate(10px, -10px); opacity: 0.2; }
          50% { transform: translate(-5px, 15px); opacity: 0.15; }
          75% { transform: translate(-15px, -5px); opacity: 0.25; }
        }
        @keyframes shimmer {
          0% { opacity: 0.8; }
          50% { opacity: 1; box-shadow: 0 0 10px rgba(255,255,255,0.2); }
          100% { opacity: 0.8; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes growWidth {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;