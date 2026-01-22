import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { db } from './firebase.js'; 
import { LayoutDashboard, LogOut, Plus, Loader2, TrendingUp, DollarSign, X, Activity, Wallet, AlertTriangle, CheckCircle } from 'lucide-react';

const Dashboard = ({ user, onLogout }) => {
  const [records, setRecords] = useState([]);
  const [userData, setUserData] = useState(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense'
  });

  useEffect(() => {
    if (!user) return;

    console.log(`[Dashboard] Listening to user profile at: users/${user.uid}`);
    console.log(`[Dashboard] Listening to transactions at: users/${user.uid}/financial_records`);

    // ✅ FIXED: Correct path structure
    const userDocRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    });

    const q = query(
      collection(db, 'users', user.uid, 'financial_records'),
      orderBy('createdAt', 'desc')
    );

    const unsubRecords = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecords(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching records:", error);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubRecords();
    };
  }, [user]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.amount || !newTransaction.description) return;

    try {
      await addDoc(collection(db, 'users', user.uid, 'financial_records'), {
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        type: newTransaction.type,
        createdAt: serverTimestamp()
      });
      setShowTransactionForm(false);
      setNewTransaction({ description: '', amount: '', type: 'expense' });
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const getScoreDetails = (score) => {
    if (score >= 71) return { status: 'Good / Safe', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: CheckCircle };
    if (score >= 41) return { status: 'Average', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: AlertTriangle };
    return { status: 'Risky', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', icon: Activity };
  };

  const totals = records.reduce((acc, curr) => {
    if (curr.type === 'income') acc.income += curr.amount;
    else acc.expense += curr.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const balance = totals.income - totals.expense;
  const scoreData = userData ? getScoreDetails(userData.score || 0) : { status: 'Calculating...', color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700', icon: Loader2 };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-violet-500/30">
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2 rounded-xl shadow-lg shadow-violet-500/20">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
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

      <main className="max-w-6xl mx-auto p-6 lg:p-8 space-y-8">
        {userData && (
          <div className={`rounded-3xl p-8 border ${scoreData.border} ${scoreData.bg} relative overflow-hidden`}>
             <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
             
             <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
               <div className="flex items-center gap-6">
                 <div className={`w-24 h-24 rounded-full border-4 ${scoreData.border} flex items-center justify-center bg-[#0a0a0f]`}>
                    <span className={`text-3xl font-bold ${scoreData.color}`}>{userData.score}%</span>
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
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Total Balance
              </span>
              <span className={`text-3xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                ₹{balance.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Total Income
              </span>
              <span className="text-3xl font-bold text-emerald-400">
                +₹{totals.income.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-[#0f111a] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-red-400" /> Total Expenses
              </span>
              <span className="text-3xl font-bold text-red-400">
                -₹{totals.expense.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              Recent Transactions
            </h2>
            <button 
              onClick={() => setShowTransactionForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New</span>
            </button>
          </div>

          <div className="bg-[#0f111a] border border-white/5 rounded-2xl overflow-hidden min-h-[300px]">
            {loading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col h-[300px] items-center justify-center text-gray-500">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 opacity-50" />
                </div>
                <p>No transactions yet. Add your first one!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {records.map((record) => (
                  <div key={record.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        record.type === 'income' 
                          ? 'bg-emerald-400/10 text-emerald-400 group-hover:bg-emerald-400/20' 
                          : 'bg-red-400/10 text-red-400 group-hover:bg-red-400/20'
                      } transition-colors`}>
                        {record.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-violet-200 transition-colors">{record.description}</p>
                        <p className="text-xs text-gray-500">
                          {record.createdAt ? new Date(record.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold font-mono ${
                      record.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {record.type === 'income' ? '+' : '-'}₹{record.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showTransactionForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0f111a] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add Transaction</h3>
                <button onClick={() => setShowTransactionForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="e.g. Grocery"
                    value={newTransaction.description}
                    onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
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
                    onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                      className={`p-3 rounded-xl border font-medium transition-all ${
                        newTransaction.type === 'expense' 
                        ? 'bg-red-500/20 border-red-500 text-red-400' 
                        : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                      className={`p-3 rounded-xl border font-medium transition-all ${
                        newTransaction.type === 'income' 
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                        : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5'
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
                  Save Transaction
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