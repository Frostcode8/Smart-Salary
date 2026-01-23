import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";

import {
  LayoutDashboard,
  LogOut,
  Plus,
  Loader2,
  TrendingUp,
  DollarSign,
  X,
  Activity,
  Wallet,
  AlertTriangle,
  CheckCircle,
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
  YAxis,
  CartesianGrid,
} from "recharts";

const Dashboard = ({ user, onLogout }) => {
  const [records, setRecords] = useState([]);
  const [userData, setUserData] = useState(null);

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const categories = ["Food", "Travel", "Entertainment", "Shopping", "Bills", "Other"];

  // ✅ Helper
  const formatINR = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const COLORS = [
    "#7c3aed", // violet
    "#ec4899", // pink
    "#22c55e", // green
    "#f59e0b", // amber
    "#3b82f6", // blue
    "#ef4444", // red
    "#14b8a6", // teal
    "#a855f7", // purple
  ];

  const renderPercentLabel = ({ percent }) => {
    if (!percent || percent < 0.06) return "";
    return `${Math.round(percent * 100)}%`;
  };

  // ✅ default month and default date
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM

  // ✅ NEW: Month Selector state
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "Food",
    transactionDate: todayStr,
  });

  // -----------------------------
  // Firestore listeners
  // -----------------------------
  useEffect(() => {
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });

    const q = query(
      collection(db, "users", user.uid, "financial_records"),
      orderBy("createdAt", "desc")
    );

    const unsubRecords = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setRecords(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching records:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubUser();
      unsubRecords();
    };
  }, [user]);

  // -----------------------------
  // Month options from all records
  // -----------------------------
  const monthOptions = useMemo(() => {
    const months = new Set();

    records.forEach((r) => {
      if (!r.createdAt?.seconds) return;
      const d = new Date(r.createdAt.seconds * 1000);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.add(m);
    });

    const arr = Array.from(months).sort((a, b) => b.localeCompare(a));
    // If no transactions yet, still show current month
    if (arr.length === 0) return [currentMonth];
    return arr;
  }, [records]);

  // if selectedMonth is not in options (ex: data deleted), fallback
  useEffect(() => {
    if (!monthOptions.includes(selectedMonth)) {
      setSelectedMonth(monthOptions[0] || currentMonth);
    }
  }, [monthOptions, selectedMonth, currentMonth]);

  // -----------------------------
  // Filter transactions by selected month
  // -----------------------------
  const selectedMonthRecords = useMemo(() => {
    return records.filter((r) => {
      if (!r.createdAt?.seconds) return false;
      const d = new Date(r.createdAt.seconds * 1000);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return m === selectedMonth;
    });
  }, [records, selectedMonth]);

  // -----------------------------
  // Totals for selected month ONLY
  // -----------------------------
  const monthTotals = useMemo(() => {
    return selectedMonthRecords.reduce(
      (acc, curr) => {
        if (curr.type === "income") acc.income += curr.amount || 0;
        else acc.expense += curr.amount || 0;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [selectedMonthRecords]);

  const monthBalance = monthTotals.income - monthTotals.expense;

  // -----------------------------
  // Score UI details
  // -----------------------------
  const getScoreDetails = (score) => {
    if (score >= 71)
      return {
        status: "Good / Safe",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        border: "border-emerald-400/20",
        icon: CheckCircle,
      };
    if (score >= 41)
      return {
        status: "Average",
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
        border: "border-yellow-400/20",
        icon: AlertTriangle,
      };
    return {
      status: "Risky",
      color: "text-red-400",
      bg: "bg-red-400/10",
      border: "border-red-400/20",
      icon: Activity,
    };
  };

  const scoreData = userData
    ? getScoreDetails(userData.score || 0)
    : {
        status: "Calculating...",
        color: "text-gray-400",
        bg: "bg-gray-800",
        border: "border-gray-700",
        icon: Loader2,
      };

  // -----------------------------
  // PIE chart (selected month expense breakdown)
  // -----------------------------
  const selectedMonthExpenseRecords = useMemo(() => {
    return selectedMonthRecords.filter((r) => r.type === "expense");
  }, [selectedMonthRecords]);

  const expenseByCategory = useMemo(() => {
    const map = selectedMonthExpenseRecords.reduce((acc, r) => {
      const cat = r.category || "Other";
      acc[cat] = (acc[cat] || 0) + (r.amount || 0);
      return acc;
    }, {});

    let arr = Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);

    // ✅ Top 5 + Others
    if (arr.length > 5) {
      const top5 = arr.slice(0, 5);
      const rest = arr.slice(5);
      const othersValue = rest.reduce((sum, x) => sum + x.value, 0);
      arr = [...top5, { name: "Others", value: othersValue }];
    }

    return arr;
  }, [selectedMonthExpenseRecords]);

  // -----------------------------
  // BAR chart (towers): all months expense totals
  // -----------------------------
  const monthlyExpenseBarData = useMemo(() => {
    const map = records.reduce((acc, r) => {
      if (r.type !== "expense") return acc;
      if (!r.createdAt?.seconds) return acc;

      const d = new Date(r.createdAt.seconds * 1000);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      acc[m] = (acc[m] || 0) + (r.amount || 0);
      return acc;
    }, {});

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({
        month,
        expense: Math.round(value),
      }));
  }, [records]);

  // -----------------------------
  // Suggest plan logic (from user profile)
  // -----------------------------
  const suggestedTotalExpense =
    userData?.budgetPlan
      ? (userData.budgetPlan.needs || 0) + (userData.budgetPlan.wants || 0)
      : 0;

  const currentExpenseProfile = parseFloat(userData?.expense || 0);
  const reduceBy =
    suggestedTotalExpense > 0
      ? Math.max(0, Math.round(currentExpenseProfile - suggestedTotalExpense))
      : 0;

  // -----------------------------
  // Tax logic (demo)
  // -----------------------------
  const monthlyIncomeProfile = parseFloat(userData?.income || 0);
  const yearlyIncome = Math.round(monthlyIncomeProfile * 12);

  const getTaxEstimate = () => {
    if (!yearlyIncome || yearlyIncome <= 0) return { label: "No income data", tax: 0 };
    if (yearlyIncome <= 700000) return { label: "Likely 0 tax (rebate zone)", tax: 0 };
    if (yearlyIncome <= 1000000)
      return { label: "Moderate tax range", tax: Math.round(yearlyIncome * 0.05) };
    if (yearlyIncome <= 1500000)
      return { label: "High tax range", tax: Math.round(yearlyIncome * 0.1) };
    return { label: "Very high tax range", tax: Math.round(yearlyIncome * 0.15) };
  };
  const taxEst = getTaxEstimate();

  // -----------------------------
  // Add / Edit transaction
  // -----------------------------
  const handleSaveTransaction = async (e) => {
    e.preventDefault();

    if (!newTransaction.amount || !newTransaction.description) return;

    try {
      // ✅ date -> timestamp
      const selectedDate = new Date(newTransaction.transactionDate + "T12:00:00");
      const createdAt = Timestamp.fromDate(selectedDate);

      if (editingRecord) {
        const recRef = doc(
          db,
          "users",
          user.uid,
          "financial_records",
          editingRecord.id
        );

        await updateDoc(recRef, {
          description: newTransaction.description,
          amount: parseFloat(newTransaction.amount),
          type: newTransaction.type,
          category: newTransaction.category,
          createdAt,
        });

        setEditingRecord(null);
      } else {
        await addDoc(collection(db, "users", user.uid, "financial_records"), {
          description: newTransaction.description,
          amount: parseFloat(newTransaction.amount),
          type: newTransaction.type,
          category: newTransaction.category,
          createdAt,
        });
      }

      // ✅ If user chose another month (while adding/editing), automatically switch dashboard to that month
      const monthOfTx = newTransaction.transactionDate.slice(0, 7);
      setSelectedMonth(monthOfTx);

      setShowTransactionForm(false);
      setNewTransaction({
        description: "",
        amount: "",
        type: "expense",
        category: "Food",
        transactionDate: todayStr,
      });
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-violet-500/30">
      {/* NAV */}
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2 rounded-xl shadow-lg shadow-violet-500/20">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">{user?.email}</span>
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* BODY */}
      <main className="max-w-6xl mx-auto p-6 lg:p-8 space-y-8">
        {/* WELCOME */}
        {userData && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-xl font-bold text-white">
              Hello {userData.name || "User"} 👋
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Welcome to{" "}
              <span className="text-violet-300 font-semibold">SmartSalary</span>. Plan smart, spend smart 💸
            </p>
          </div>
        )}

        {/* ✅ MONTH SELECTOR */}
        <div className="bg-[#0f111a] border border-white/5 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Select Month</h3>
            <p className="text-sm text-gray-500">
              Pie chart + transactions will update for selected month
            </p>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m} className="bg-[#0f111a]">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* SCORE CARD */}
        {userData && (
          <div className={`rounded-3xl p-8 border ${scoreData.border} ${scoreData.bg} relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className={`w-24 h-24 rounded-full border-4 ${scoreData.border} flex items-center justify-center bg-[#0a0a0f]`}>
                  <span className={`text-3xl font-bold ${scoreData.color}`}>{userData.score || 0}%</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <scoreData.icon className={`w-5 h-5 ${scoreData.color}`} />
                    <h2 className={`text-2xl font-bold ${scoreData.color}`}>{scoreData.status}</h2>
                  </div>
                  <p className="text-gray-400">Financial Health Score</p>
                </div>
              </div>

              <div className="flex gap-8 text-center md:text-right">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Monthly Income</p>
                  <p className="text-xl font-semibold">₹{userData.income}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Planned Savings</p>
                  <p className="text-xl font-semibold text-emerald-400">₹{userData.savings}</p>
                </div>
              </div>
            </div>

            {/* Spender Type + Advice */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
                <p className="text-sm text-gray-400 mb-2">Spender Type</p>
                <p className="text-2xl font-bold text-violet-300">{userData.spenderType || "N/A"}</p>

                <div className="mt-4 text-sm text-gray-400 space-y-1">
                  <p>Expenses: <span className="text-red-400 font-semibold">{userData.expensePercent || 0}%</span></p>
                  <p>Savings: <span className="text-emerald-400 font-semibold">{userData.savingsPercent || 0}%</span></p>
                  <p>EMI: <span className="text-yellow-400 font-semibold">{userData.emiPercent || 0}%</span></p>
                </div>
              </div>

              <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
                <p className="text-sm text-gray-400 mb-2">Personal Advice</p>
                <p className="text-lg font-semibold text-white">{userData.adviceText || "No advice yet"}</p>

                {userData.suggestions && userData.suggestions.length > 0 && (
                  <ul className="mt-4 space-y-2 text-sm text-gray-400 list-disc list-inside">
                    {userData.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Suggest plan */}
            {userData.budgetPlan && (
              <div className="mt-8 bg-black/20 border border-white/10 rounded-2xl p-6 relative z-10">
                <h3 className="font-bold text-lg">Suggest Plan</h3>

                <p className="text-sm text-gray-400 mt-2">
                  Ideal expenses (Needs + Wants):{" "}
                  <span className="text-white font-semibold">₹{suggestedTotalExpense}</span>
                </p>

                <p className="text-sm text-gray-400 mt-1">
                  Your current expense:{" "}
                  <span className="text-red-400 font-semibold">₹{currentExpenseProfile}</span>
                </p>

                <p className="text-sm mt-3 font-semibold text-violet-300">
                  {reduceBy > 0
                    ? `⚠️ Bhai expenses reduce karo: ₹${reduceBy} (then savings will improve ✅)`
                    : `✅ Great! You are within suggested plan 💪`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ✅ MONTH TOTALS (Selected Month) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl group hover:border-white/10 transition-all">
            <span className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Balance ({selectedMonth})
            </span>
            <span className={`text-3xl font-bold ${monthBalance >= 0 ? "text-white" : "text-red-400"}`}>
              ₹{monthBalance.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl group hover:border-white/10 transition-all">
            <span className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Income ({selectedMonth})
            </span>
            <span className="text-3xl font-bold text-emerald-400">
              +₹{monthTotals.income.toFixed(2)}
            </span>
          </div>

          <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl group hover:border-white/10 transition-all">
            <span className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-400" /> Expense ({selectedMonth})
            </span>
            <span className="text-3xl font-bold text-red-400">
              -₹{monthTotals.expense.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ✅ PIE (Selected month) */}
        <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-400" />
            Expense Breakdown ({selectedMonth})
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Only selected month expense categories are shown here.
          </p>

          {expenseByCategory.length === 0 ? (
            <p className="text-gray-500">No expense data for {selectedMonth}.</p>
          ) : (
            <div className="w-full h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={3}
                    labelLine={false}
                    label={renderPercentLabel}
                  >
                    {expenseByCategory.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="rgba(255,255,255,0.10)"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value, name) => [formatINR(value), name]}
                    contentStyle={{
                      background: "#0b0c12",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "14px",
                    }}
                  />

                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ color: "#cbd5e1", fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ✅ BAR (towers of months expenses) */}
        <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Monthly Expense Towers
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Shows total expense per month (all months).
          </p>

          {monthlyExpenseBarData.length === 0 ? (
            <p className="text-gray-500">No monthly expense data yet.</p>
          ) : (
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyExpenseBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(val) => formatINR(val)} />
                  <Bar dataKey="expense" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ✅ TRANSACTIONS (Selected Month) */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              Transactions ({selectedMonth})
            </h2>

            <button
              onClick={() => {
                setEditingRecord(null);
                setNewTransaction({
                  description: "",
                  amount: "",
                  type: "expense",
                  category: "Food",
                  transactionDate: `${selectedMonth}-01`, // ✅ starts with selected month
                });
                setShowTransactionForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New</span>
            </button>
          </div>

          <div className="bg-[#0f111a] border border-white/5 rounded-2xl overflow-hidden min-h-[260px]">
            {loading ? (
              <div className="flex h-[260px] items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : selectedMonthRecords.length === 0 ? (
              <div className="flex flex-col h-[260px] items-center justify-center text-gray-500">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 opacity-50" />
                </div>
                <p>No transactions found for {selectedMonth}.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {selectedMonthRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${
                          record.type === "income"
                            ? "bg-emerald-400/10 text-emerald-400 group-hover:bg-emerald-400/20"
                            : "bg-red-400/10 text-red-400 group-hover:bg-red-400/20"
                        } transition-colors`}
                      >
                        {record.type === "income" ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <DollarSign className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-white group-hover:text-violet-200 transition-colors">
                          {record.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.category ? `${record.category} • ` : ""}
                          {record.createdAt?.seconds
                            ? new Date(record.createdAt.seconds * 1000).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const recDate =
                            record.createdAt?.seconds
                              ? new Date(record.createdAt.seconds * 1000).toISOString().split("T")[0]
                              : todayStr;

                          setEditingRecord(record);
                          setNewTransaction({
                            description: record.description || "",
                            amount: record.amount || "",
                            type: record.type || "expense",
                            category: record.category || "Other",
                            transactionDate: recDate,
                          });
                          setShowTransactionForm(true);
                        }}
                        className="text-xs px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                      >
                        Edit
                      </button>

                      <span
                        className={`font-bold font-mono ${
                          record.type === "income" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {record.type === "income" ? "+" : "-"}₹{(record.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TAX LOGIC */}
        {userData && (
          <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-2">Tax Logic (Basic)</h2>

            <p className="text-gray-400 text-sm">
              Yearly income estimate:{" "}
              <span className="text-white font-semibold">{formatINR(yearlyIncome)}</span>
            </p>

            <p className="text-violet-300 font-semibold mt-3">{taxEst.label}</p>

            <p className="text-gray-400 text-sm mt-1">
              Estimated tax (demo):{" "}
              <span className="text-white font-semibold">{formatINR(taxEst.tax)}</span>
            </p>

            <div className="mt-4 text-sm text-gray-400 space-y-1">
              <p>✅ Tip: Use 80C (PPF/ELSS) to save tax</p>
              <p>✅ Tip: NPS can reduce taxable income</p>
              <p className="text-xs text-gray-600 mt-2">
                *This is a demo estimate, not official tax filing.
              </p>
            </div>
          </div>
        )}

        {/* MODAL */}
        {showTransactionForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0f111a] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {editingRecord ? "Update Transaction" : "Add Transaction"}
                </h3>

                <button
                  onClick={() => {
                    setShowTransactionForm(false);
                    setEditingRecord(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="e.g. Grocery"
                    value={newTransaction.description}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, amount: e.target.value })
                    }
                  />
                </div>

                {/* ✅ DATE FIELD */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                    value={newTransaction.transactionDate}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, transactionDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <select
                    value={newTransaction.category}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, category: e.target.value })
                    }
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-[#0f111a]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewTransaction({ ...newTransaction, type: "expense" })}
                      className={`p-3 rounded-xl border font-medium transition-all ${
                        newTransaction.type === "expense"
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : "bg-black/20 border-white/10 text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      Expense
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewTransaction({ ...newTransaction, type: "income" })}
                      className={`p-3 rounded-xl border font-medium transition-all ${
                        newTransaction.type === "income"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-black/20 border-white/10 text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      Income
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors mt-4"
                >
                  {editingRecord ? "Update" : "Save Transaction"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
