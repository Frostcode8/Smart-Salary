import React, { useState, useEffect } from 'react';
import { X, Briefcase, TrendingUp, Target, Loader2, Info, Sparkles, AlertTriangle, CheckCircle, BarChart3, Edit2, Clock, Zap, Lock, Unlock } from 'lucide-react';
import ReactGA from "react-ga4";

ReactGA.event({
  category: "AI",
  action: "Generate Roadmap",
});

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY3;

export default function CareerCoach({ income ,open, onClose, userProfile, monthData, onEditProfile }) {
  const [loading, setLoading] = useState(false);
  const [careerInsight, setCareerInsight] = useState(null);
  const [error, setError] = useState(null);

  // ✅ FIX: Reset insight when userProfile changes OR when modal opens
  useEffect(() => {
    if (open && userProfile) {
      // Clear previous insight to force regeneration
      setCareerInsight(null);
      setError(null);
    }
  }, [open, userProfile]);

  // ✅ FIX: Generate insight whenever we have userProfile but no insight
  useEffect(() => {
    if (open && userProfile && !careerInsight && !loading && !error) {
      generateCareerInsight();
    }
  }, [open, userProfile, careerInsight, loading, error]);

  const generateCareerInsight = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();
      const salary = parseFloat(monthData?.income || userProfile.currentSalary || 0);

      // Calculate available hours for side hustle
      const workingHours = parseFloat(userProfile.workingHours || 40);
      const availableHours = Math.max(0, 168 - workingHours - 56); // Total hours - work - sleep(8h*7)

      // ✅ NEW: Calculate growth multiplier based on job switching willingness
      const growthMultiplier = userProfile.willingToSwitch ? 1.4 : 1.0;
      const marketAccessLevel = userProfile.willingToSwitch ? "top 25%" : "conservative";
      const growthSpeed = userProfile.willingToSwitch ? "faster" : "slower";
      const strategyType = userProfile.willingToSwitch ? "Company switch or role upgrade" : "Skill upgrade within current role";
      const riskLevel = userProfile.willingToSwitch ? "lower stagnation risk" : "higher stagnation risk";

      const prompt = `

You are a career intelligence AI. Analyze this professional profile and provide dual career insights PLUS side hustle opportunities.

IMPORTANT RULES:
1. All salary values must be MONTHLY (₹/month)
2. Do NOT return annual or CTC values
3. Return ranges in ₹ per month only
4. Consider the job switching willingness as a CRITICAL FACTOR

Profile:
- Job Title: ${userProfile.jobTitle}
- Industry: ${userProfile.industry}
- Experience: ${userProfile.experience} years
- Current Salary: ₹${salary.toLocaleString()}/month
- Skills: ${userProfile.primarySkills?.join ? userProfile.primarySkills.join(', ') : userProfile.primarySkills || 'Not specified'}
- Learning Hours/Week: ${userProfile.learningHours || 0}
- Willing to Switch Jobs: ${userProfile.willingToSwitch ? 'YES' : 'NO'}
- Working Hours/Week: ${workingHours}
- Available Hours/Week: ${availableHours}
- Interests: ${userProfile.interests || 'Not specified'}
- User monthly salary: ₹${income} (per month)

🎛️ CAREER MOBILITY SETTINGS (CRITICAL):
- Willing to Switch: ${userProfile.willingToSwitch ? 'YES' : 'NO'}
- Growth Multiplier: ${growthMultiplier}x
- Market Access Level: ${marketAccessLevel}
- Expected Growth Speed: ${growthSpeed}
- Primary Strategy: ${strategyType}
- Career Risk: ${riskLevel}

INSTRUCTIONS BASED ON JOB SWITCHING WILLINGNESS:

${userProfile.willingToSwitch ? `
🟢 USER IS WILLING TO SWITCH JOBS - Apply these rules:
- Market Salary Range: Use TOP 25% of market (higher-paying companies accessible)
- Salary Growth: FASTER timeline (18-24 months to significant jump)
- Target Roles: Include roles at BETTER companies/startups/product companies
- Strategy: Emphasize "switch to X company" or "move to Y role at better firm"
- Salary Ceiling: HIGHER potential (1.5-2x current in 2 years possible)
- Bottlenecks: Focus on "interview prep" and "building portfolio" rather than internal politics
- Side Hustles: Can be used as "proof of work" for job applications
- 6-month target: Should suggest ACTIVE job search or company switch
- Risk: LOWER stagnation risk
- Tone: Optimistic, growth-focused, expansion-minded

Example phrasing:
- "You can reach ₹1L/month in 18 months by switching to a mid-sized product company"
- "Target companies: Razorpay, Zerodha, Cure.fit (product-based firms)"
- "Your salary can grow 40-60% with a strategic company switch"
` : `
🔴 USER IS NOT WILLING TO SWITCH JOBS - Apply these rules:
- Market Salary Range: Use CONSERVATIVE bands (internal promotions only)
- Salary Growth: SLOWER timeline (24-36 months for significant growth)
- Target Roles: Suggest INTERNAL role changes or promotions within same company
- Strategy: Emphasize "upskill within current role" or "internal transfer"
- Salary Ceiling: LOWER potential (1.2-1.3x current in 2 years realistic)
- Bottlenecks: Focus on "limited by company salary bands" and "need internal visibility"
- Side Hustles: Position as "income supplement" since main salary growth is capped
- 6-month target: Should focus on INTERNAL improvements, certifications
- Risk: HIGHER stagnation risk
- Tone: Realistic, grounded, focus on maximizing current position

Example phrasing:
- "At your current company type, salary growth is capped unless you change roles internally"
- "Focus on becoming indispensable in your team to secure the next promotion"
- "Side income will be crucial since company-based growth may be limited"
`}

Task: Provide a realistic career analysis using current ${currentYear} India job market data AND suggest practical side hustles.

Return ONLY valid JSON (no markdown, no backticks):
{
  "current": {
    "healthScore": <number 0-100>,
    "marketSalaryRange": {
      "min": <number, ${userProfile.willingToSwitch ? 'higher range' : 'conservative range'}>,
      "median": <number>,
      "max": <number, ${userProfile.willingToSwitch ? 'top 25% companies' : 'typical max for non-switchers'}>
    },
    "salaryGap": <number percentage, negative if underpaid>,
    "positionPercentile": <number 0-100>,
    "bottlenecks": [<string array, max 3 items, ${userProfile.willingToSwitch ? 'focus on interview skills, portfolio' : 'focus on internal constraints, company limits'}>],
    "strengths": [<string array, max 2 items>],
    "reasoning": "<brief explanation mentioning ${userProfile.willingToSwitch ? 'market opportunities available through switching' : 'growth limited to internal progression'}>"
  },
  "potential": {
    "sixMonths": {
      "targetRole": "<realistic role name, ${userProfile.willingToSwitch ? 'at better companies' : 'internal promotion'}>",
      "salaryRange": "<₹XX,000 - ₹YY,000 format, ${userProfile.willingToSwitch ? 'optimistic' : 'conservative'}>",
      "probability": <number 0-1, ${userProfile.willingToSwitch ? 'higher for switchers' : 'lower for non-switchers'}>,
      "actions": [<string array, max 3 specific actions, ${userProfile.willingToSwitch ? 'include job search tactics' : 'include internal networking'}>]
    },
    "twoYears": {
      "targetRole": "<realistic role name>",
      "salaryRange": "<₹X.XL - ₹Y.YL format, apply ${growthMultiplier}x multiplier>",
      "probability": <number 0-1>,
      "actions": [<string array, max 2 strategic actions>]
    },
    "reasoning": "<brief explanation of growth path, explicitly mention ${userProfile.willingToSwitch ? 'company switching as key accelerator' : 'internal growth as slower but stable path'}>"
  },
  "sideHustles": [
    {
      "title": "<side hustle name>",
      "description": "<2-3 line description, ${userProfile.willingToSwitch ? 'mention as portfolio builder' : 'emphasize as income supplement due to limited main salary growth'}>",
      "timeRequired": "<X hours/week>",
      "potentialIncome": "<₹X,000 - ₹Y,000/month>",
      "difficulty": "<Easy/Medium/Hard>",
      "skills": [<string array, required skills>],
      "platforms": [<string array, where to start>]
    }
  ],
  "mobilityInsight": {
    "status": "${userProfile.willingToSwitch ? 'Open to Switch' : 'Not Switching'}",
    "impact": "<1-2 sentence explanation of how this affects their career trajectory>",
    "recommendation": "<Should they reconsider? What's the trade-off?>"
  }
}

Rules:
1. Base salary data on real ${currentYear} India market rates
2. Be realistic - don't over-promise
3. Consider industry, experience, and current economic conditions
4. CRITICAL: Apply the ${growthMultiplier}x multiplier to all growth projections
5. Side hustles should be practical and match user's skills/interests
6. Suggest 3-5 side hustles that fit available hours (${availableHours} hours/week)
7. ${userProfile.willingToSwitch ? 'Emphasize that switching jobs is the fastest path to salary growth' : 'Emphasize maximizing current role and side income since switching is not an option'}
8. Return ONLY the JSON object
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.95,
          }
        })
      });

      const data = await response.json();
      let text = data.candidates[0].content.parts[0].text;
      
      // Clean response
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const insight = JSON.parse(text);
      setCareerInsight(insight);

    } catch (err) {
      console.error("Career analysis error:", err);
      setError("Failed to generate career insight. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (onEditProfile) {
      onEditProfile();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-[#0f111a] border border-white/10 rounded-none sm:rounded-[2rem] w-full max-w-6xl h-full sm:h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#121215]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-violet-400" />
              AI Career Coach
            </h2>
            <p className="text-xs text-gray-400 mt-1">Industry-realistic career analysis + side hustle opportunities</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleEdit}
              className="p-2 hover:bg-violet-500/20 rounded-full transition-colors border border-violet-500/30"
              title="Edit Career Profile"
            >
              <Edit2 className="w-5 h-5 text-violet-400" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
              <p className="text-gray-400 text-sm">Analyzing your career trajectory...</p>
              <p className="text-gray-500 text-xs">Considering your job switching preferences...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <AlertTriangle className="w-12 h-12 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
              <button 
                onClick={generateCareerInsight}
                className="px-4 py-2 bg-violet-600 rounded-lg text-white text-sm hover:bg-violet-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : careerInsight ? (
            <div className="space-y-6">
              
              {/* Profile Summary with Mobility Status */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-violet-400" />
                    <h3 className="text-base font-bold text-white">Your Profile</h3>
                  </div>
                  {/* ✅ NEW: Mobility Badge */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    userProfile.willingToSwitch 
                      ? 'bg-emerald-500/20 border border-emerald-500/30' 
                      : 'bg-amber-500/20 border border-amber-500/30'
                  }`}>
                    {userProfile.willingToSwitch ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-300">Open to Switch</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-300">Current Role Focus</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Role</p>
                    <p className="text-gray-300 font-semibold">{userProfile.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Industry</p>
                    <p className="text-gray-300 font-semibold">{userProfile.industry}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Experience</p>
                    <p className="text-gray-300 font-semibold">{userProfile.experience} years</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Working Hours</p>
                    <p className="text-gray-300 font-semibold">{userProfile.workingHours || 40} hrs/week</p>
                  </div>
                </div>
              </div>

              {/* ✅ NEW: Mobility Insight Box */}
              {careerInsight.mobilityInsight && (
                <div className={`p-5 rounded-2xl border ${
                  userProfile.willingToSwitch 
                    ? 'bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border-emerald-500/30' 
                    : 'bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-500/30'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      userProfile.willingToSwitch ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                    }`}>
                      {userProfile.willingToSwitch ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Target className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-bold mb-1 ${
                        userProfile.willingToSwitch ? 'text-emerald-300' : 'text-amber-300'
                      }`}>
                        Career Mobility: {careerInsight.mobilityInsight.status}
                      </h4>
                      <p className="text-xs text-gray-400 mb-2">{careerInsight.mobilityInsight.impact}</p>
                      <p className="text-xs text-gray-300 italic">💡 {careerInsight.mobilityInsight.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Two-Column Layout */}
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* LEFT: Current State */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-bold text-white">Current State</h3>
                  </div>

                  {/* Health Score */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-900/20 to-blue-900/20 border border-violet-500/30 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-violet-300">Career Health Score</h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${careerInsight.current.healthScore >= 70 ? 'bg-emerald-400' : careerInsight.current.healthScore >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                        <span className="text-xs text-gray-400">
                          {careerInsight.current.healthScore >= 70 ? 'Good' : careerInsight.current.healthScore >= 50 ? 'Average' : 'Needs Attention'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                          <circle 
                            cx="48" 
                            cy="48" 
                            r="40" 
                            stroke="currentColor" 
                            strokeWidth="8" 
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - careerInsight.current.healthScore / 100)}`}
                            className={careerInsight.current.healthScore >= 70 ? 'text-emerald-400' : careerInsight.current.healthScore >= 50 ? 'text-yellow-400' : 'text-red-400'}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">{careerInsight.current.healthScore}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Percentile</span>
                            <span className="text-white font-semibold">{careerInsight.current.positionPercentile}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Salary Gap</span>
                            <span className={`font-semibold ${careerInsight.current.salaryGap >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {careerInsight.current.salaryGap >= 0 ? '+' : ''}{careerInsight.current.salaryGap}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Market Salary */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-blue-300">Market Salary Range</h4>
                      {/* ✅ NEW: Market Access Indicator */}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        userProfile.willingToSwitch 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {userProfile.willingToSwitch ? 'Top 25% Access' : 'Conservative'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Minimum</span>
                        <span className="text-sm font-bold text-gray-300">₹{careerInsight.current.marketSalaryRange.min.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Median</span>
                        <span className="text-lg font-bold text-blue-400">₹{careerInsight.current.marketSalaryRange.median.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Maximum</span>
                        <span className="text-sm font-bold text-gray-300">₹{careerInsight.current.marketSalaryRange.max.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Bottlenecks */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-emerald-300">Strengths</h4>
                      </div>
                      <ul className="space-y-1.5">
                        {careerInsight.current.strengths.map((strength, idx) => (
                          <li key={idx} className="text-[11px] text-gray-300 leading-tight">{strength}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <h4 className="text-xs font-bold text-red-300">Bottlenecks</h4>
                      </div>
                      <ul className="space-y-1.5">
                        {careerInsight.current.bottlenecks.map((bottleneck, idx) => (
                          <li key={idx} className="text-[11px] text-gray-300 leading-tight">{bottleneck}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-400 leading-relaxed">{careerInsight.current.reasoning}</p>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Potential Future */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">Potential Future</h3>
                  </div>

                  {/* 6 Months Timeline */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-emerald-300">6 Months Target</h4>
                      <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {Math.round(careerInsight.potential.sixMonths.probability * 100)}% Probability
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Target Role</p>
                        <p className="text-lg font-bold text-white">{careerInsight.potential.sixMonths.targetRole}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Expected Salary</p>
                        <p className="text-xl font-bold text-emerald-400">{careerInsight.potential.sixMonths.salaryRange}</p>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-gray-400 mb-2">Required Actions:</p>
                        <ul className="space-y-2">
                          {careerInsight.potential.sixMonths.actions.map((action, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                              <Target className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 2 Years Timeline */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-violet-300">2 Years Vision</h4>
                      <span className="px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold">
                        {Math.round(careerInsight.potential.twoYears.probability * 100)}% Probability
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Target Role</p>
                        <p className="text-lg font-bold text-white">{careerInsight.potential.twoYears.targetRole}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Expected Salary</p>
                        <p className="text-xl font-bold text-violet-400">{careerInsight.potential.twoYears.salaryRange}</p>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-gray-400 mb-2">Strategic Actions:</p>
                        <ul className="space-y-2">
                          {careerInsight.potential.twoYears.actions.map((action, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                              <Target className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Growth Path Reasoning */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-400 leading-relaxed">{careerInsight.potential.reasoning}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Side Hustles Section */}
              {careerInsight.sideHustles && careerInsight.sideHustles.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-bold text-white">Side Hustle Opportunities</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Based on your {userProfile.workingHours || 40} hours/week work schedule, 
                    you have approximately {Math.max(0, 168 - parseFloat(userProfile.workingHours || 40) - 56)} hours/week available for side projects
                    {!userProfile.willingToSwitch && <span className="text-amber-400 font-semibold"> • Extra important since main salary growth is limited</span>}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {careerInsight.sideHustles.map((hustle, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/30 hover:border-amber-500/50 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-base font-bold text-amber-200">{hustle.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            hustle.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-300' :
                            hustle.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {hustle.difficulty}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-400 mb-3 leading-relaxed">{hustle.description}</p>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span className="text-xs text-gray-300">{hustle.timeRequired}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-emerald-400 font-semibold">{hustle.potentialIncome}</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/10">
                          <p className="text-[10px] text-gray-500 mb-1">Required Skills:</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {hustle.skills.map((skill, sidx) => (
                              <span key={sidx} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-gray-400">
                                {skill}
                              </span>
                            ))}
                          </div>
                          
                          <p className="text-[10px] text-gray-500 mb-1">Start Here:</p>
                          <div className="flex flex-wrap gap-1">
                            {hustle.platforms.map((platform, pidx) => (
                              <span key={pidx} className="px-2 py-0.5 bg-amber-500/10 rounded text-[10px] text-amber-300">
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="text-[10px] text-gray-600 text-center pt-4 pb-2 border-t border-white/5">
                Disclaimer: This analysis is AI-generated based on general market trends and your job switching preferences. 
                Actual career outcomes depend on individual performance, market conditions, and opportunities. 
                Consult with a career counselor for personalized guidance.
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Briefcase className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400">No career profile found</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}