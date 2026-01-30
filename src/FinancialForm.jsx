import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, writeBatch, getDoc, setDoc } from "firebase/firestore";
import { IndianRupee, LogOut, Sparkles, Calendar, History, ArrowDown, Layers, Bug, Briefcase, GraduationCap, Clock, Heart } from 'lucide-react';

// 🔥 FIREBASE INITIALIZATION (Inline for Stability)
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function FinancialForm() {
  // 🆕 Tab State
  const [activeTab, setActiveTab] = useState('financial'); // 'financial' or 'career'
  
  const [formData, setFormData] = useState({
    income: '',
    emi: ''
  });
  
  // 🆕 Career Profile State - UPDATED with workingHours and interests
  const [careerData, setCareerData] = useState({
    jobTitle: '',
    industry: 'IT',
    experience: '',
    primarySkills: '',
    learningHours: '',
    willingToSwitch: true,
    workingHours: '40', // NEW: Default 40 hours/week
    interests: '' // NEW: User interests for side hustles
  });
  
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('User');
  const [careerProfileExists, setCareerProfileExists] = useState(false);

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
        
        // 🆕 Check if career profile exists
        const careerRef = doc(db, 'users', auth.currentUser.uid, 'career', 'profile');
        const careerSnap = await getDoc(careerRef);
        if (careerSnap.exists()) {
          setCareerProfileExists(true);
          setCareerData(careerSnap.data());
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

  // 🆕 Career Form Submit Handler
  const handleCareerSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in first!");
        setLoading(false);
        return;
      }

      // Process skills array
      const skillsArray = careerData.primarySkills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const careerProfile = {
        jobTitle: careerData.jobTitle,
        industry: careerData.industry,
        experience: parseFloat(careerData.experience),
        primarySkills: skillsArray,
        learningHours: parseFloat(careerData.learningHours || 0),
        willingToSwitch: careerData.willingToSwitch,
        workingHours: parseFloat(careerData.workingHours || 40),
        interests: careerData.interests,
        currentSalary: parseFloat(formData.income || 0),
        updatedAt: new Date().toISOString()
      };

      console.log("💼 Saving Career Profile:", careerProfile);

      const careerRef = doc(db, 'users', user.uid, 'career', 'profile');
      await setDoc(careerRef, careerProfile);

      setCareerProfileExists(true);
      alert("Career profile saved successfully! 🎉");
      
      // Delay for UI effect
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error("❌ Error saving career data:", error);
      alert("Error saving career data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  // 🆕 Auto-fill Functions
  const fillIncome = () => {
    if (prevMonthData?.income) {
      setFormData({ ...formData, income: prevMonthData.income });
    }
  };

  const fillEmi = () => {
    if (prevMonthData?.emi) {
      setFormData({ ...formData, emi: prevMonthData.emi });
    }
  };

  const fillBoth = () => {
    if (prevMonthData) {
      setFormData({
        income: prevMonthData.income || '',
        emi: prevMonthData.emi || ''
      });
    }
  };

  // 🧪 DEV SIMULATION TOGGLE
  const toggleSimulation = () => {
    if (prevMonthData) {
      setPrevMonthData(null);
    } else {
      setPrevMonthData({
        income: '50000',
        emi: '10000',
        expense: 25000,
        budgetPlan: { savings: 8000, emergency: 4000 }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-500 text-sm">Setup your profile to get started</p>
        </div>

        {/* 🆕 Tab Navigation */}
        <div className="flex gap-2 mb-6 p-1 bg-black/40 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('financial')}
            className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'financial'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            Financial
          </button>
          <button
            onClick={() => setActiveTab('career')}
            className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'career'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Career
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-gradient-to-br from-zinc-900/80 to-black/90 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">

          {/* 📅 Month Badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
              <Calendar className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium">{currentMonthName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* 🆕 Financial Form */}
          {activeTab === 'financial' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Monthly Income (₹)</label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  placeholder="e.g. 50000"
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                />
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">
                  EMI / Fixed Payments (₹) <span className="text-gray-600 text-xs">(Optional)</span>
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  placeholder="e.g. 10000"
                  value={formData.emi}
                  onChange={(e) => setFormData({ ...formData, emi: e.target.value })}
                />
                <p className="text-[10px] text-gray-600 mt-1.5 ml-1">Your budget will be based on income after EMI</p>
              </div>
            </div>

            {/* 🔄 NEW: Auto-fill Section */}
            {!checkingHistory && prevMonthData && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-blue-300 font-medium">We found your previous data</p>
                </div>
                <div className="space-y-2">
                  {/* Individual Buttons */}
                  <div className="grid grid-cols-2 gap-2">
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
        )}

        {/* 🆕 Career Form */}
        {activeTab === 'career' && (
          <form onSubmit={handleCareerSubmit} className="space-y-6">
            {careerProfileExists && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-emerald-300 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Career profile exists! Update anytime to refine AI insights.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Job Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  placeholder="e.g. Software Engineer"
                  value={careerData.jobTitle}
                  onChange={(e) => setCareerData({ ...careerData, jobTitle: e.target.value })}
                />
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Industry</label>
                <select
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  value={careerData.industry}
                  onChange={(e) => setCareerData({ ...careerData, industry: e.target.value })}
                >
                  <option value="IT" className="bg-zinc-900">IT / Software</option>
                  <option value="Finance" className="bg-zinc-900">Finance / Banking</option>
                  <option value="Healthcare" className="bg-zinc-900">Healthcare</option>
                  <option value="Education" className="bg-zinc-900">Education</option>
                  <option value="Manufacturing" className="bg-zinc-900">Manufacturing</option>
                  <option value="Retail" className="bg-zinc-900">Retail</option>
                  <option value="Other" className="bg-zinc-900">Other</option>
                </select>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Years of Experience</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  placeholder="e.g. 2.5"
                  value={careerData.experience}
                  onChange={(e) => setCareerData({ ...careerData, experience: e.target.value })}
                />
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Key Skills <span className="text-gray-500 text-xs">(comma-separated)</span></label>
                <input
                  type="text"
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  placeholder="e.g. React, Node.js, Python"
                  value={careerData.primarySkills}
                  onChange={(e) => setCareerData({ ...careerData, primarySkills: e.target.value })}
                />
              </div>

              {/* 🆕 Working Hours Field */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  Working Hours/Week
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="168"
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  placeholder="e.g. 40"
                  value={careerData.workingHours}
                  onChange={(e) => setCareerData({ ...careerData, workingHours: e.target.value })}
                />
                <p className="text-[10px] text-gray-600 mt-1.5 ml-1">Used to suggest side hustles that fit your schedule</p>
              </div>

              {/* 🆕 Interests Field */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  Interests & Hobbies
                </label>
                <textarea
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all resize-none"
                  placeholder="e.g. Writing, Photography, Teaching, Gaming"
                  rows="2"
                  value={careerData.interests}
                  onChange={(e) => setCareerData({ ...careerData, interests: e.target.value })}
                />
                <p className="text-[10px] text-gray-600 mt-1.5 ml-1">Helps AI suggest side hustles aligned with your passions</p>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Learning Hours/Week <span className="text-gray-500 text-xs">(optional)</span></label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all"
                  placeholder="e.g. 5"
                  value={careerData.learningHours}
                  onChange={(e) => setCareerData({ ...careerData, learningHours: e.target.value })}
                />
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2 ml-1">Willing to Switch Jobs?</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCareerData({ ...careerData, willingToSwitch: true })}
                    className={`flex-1 py-3 rounded-xl border transition-all ${
                      careerData.willingToSwitch 
                        ? 'bg-violet-600 border-violet-500 text-white' 
                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setCareerData({ ...careerData, willingToSwitch: false })}
                    className={`flex-1 py-3 rounded-xl border transition-all ${
                      !careerData.willingToSwitch 
                        ? 'bg-violet-600 border-violet-500 text-white' 
                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : careerProfileExists ? 'Update Career Profile ✨' : 'Save Career Profile ✨'}
            </button>

            <p className="text-[10px] text-gray-600 text-center">
              This data powers your AI Career Coach insights in the dashboard
            </p>
          </form>
        )}

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
    </div>
  );
}