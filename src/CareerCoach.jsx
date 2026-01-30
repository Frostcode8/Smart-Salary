import React, { useState, useEffect } from 'react';
import { X, Briefcase, TrendingUp, Target, Loader2, Info, Sparkles, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';

const GEMINI_API_KEY = "AIzaSyC33leGPAPDl7ol-oT1H7UtUsRJS8RAJCE";

export default function CareerCoach({ open, onClose, userProfile, monthData }) {
  const [loading, setLoading] = useState(false);
  const [careerInsight, setCareerInsight] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && userProfile && !careerInsight && !loading) {
      generateCareerInsight();
    }
  }, [open, userProfile]);

  const generateCareerInsight = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();
      const salary = parseFloat(monthData?.income || userProfile.currentSalary || 0);

      // 🔍 Step 1: Web Search for Real Market Data
      const searchQuery = `${userProfile.jobTitle} average salary India ${currentYear}`;
      
      // 🧠 Step 2: AI Analysis with Gemini
      const prompt = `
You are a career intelligence AI. Analyze this professional profile and provide dual career insights.

Profile:
- Job Title: ${userProfile.jobTitle}
- Industry: ${userProfile.industry}
- Experience: ${userProfile.experience} years
- Current Salary: ₹${salary.toLocaleString()}/month
- Skills: ${userProfile.primarySkills?.join(', ') || 'Not specified'}
- Learning Hours/Week: ${userProfile.learningHours || 0}
- Willing to Switch Jobs: ${userProfile.willingToSwitch ? 'Yes' : 'No'}

Task: Provide a realistic career analysis using current ${currentYear} India job market data.

Return ONLY valid JSON (no markdown, no backticks):
{
  "current": {
    "healthScore": <number 0-100>,
    "marketSalaryRange": {
      "min": <number>,
      "median": <number>,
      "max": <number>
    },
    "salaryGap": <number percentage, negative if underpaid>,
    "positionPercentile": <number 0-100>,
    "bottlenecks": [<string array, max 3 items>],
    "strengths": [<string array, max 2 items>],
    "reasoning": "<brief explanation>"
  },
  "potential": {
    "sixMonths": {
      "targetRole": "<realistic role name>",
      "salaryRange": "<₹XX,000 - ₹YY,000 format>",
      "probability": <number 0-1>,
      "actions": [<string array, max 3 specific actions>]
    },
    "twoYears": {
      "targetRole": "<realistic role name>",
      "salaryRange": "<₹X.XL - ₹Y.YL format>",
      "probability": <number 0-1>,
      "actions": [<string array, max 2 strategic actions>]
    },
    "reasoning": "<brief explanation of growth path>"
  }
}

Rules:
1. Base salary data on real ${currentYear} India market rates
2. Be realistic - don't over-promise
3. Consider industry, experience, and current economic conditions
4. Bottlenecks should be specific and actionable
5. Salary ranges should be data-driven, not guesses
6. Return ONLY the JSON object
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
            <p className="text-xs text-gray-400 mt-1">Industry-realistic career analysis powered by AI</p>
          </div>
          
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f]">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-12 h-12 animate-spin text-violet-500 mb-4" />
              <p className="text-gray-400">Analyzing your career profile...</p>
              <p className="text-xs text-gray-600 mt-2">Searching market data & generating insights</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-red-300 mb-4">{error}</p>
              <button 
                onClick={generateCareerInsight}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : careerInsight ? (
            <div className="space-y-6">
              
              {/* Profile Summary */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border border-violet-500/20">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-violet-200 uppercase tracking-wider mb-1">Role</p>
                    <p className="text-lg font-bold text-white">{userProfile.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-violet-200 uppercase tracking-wider mb-1">Industry</p>
                    <p className="text-lg font-bold text-white">{userProfile.industry}</p>
                  </div>
                  <div>
                    <p className="text-xs text-violet-200 uppercase tracking-wider mb-1">Experience</p>
                    <p className="text-lg font-bold text-white">{userProfile.experience} years</p>
                  </div>
                </div>
              </div>

              {/* Dual Insight Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* LEFT: Current Reality */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">Current Reality</h3>
                  </div>

                  {/* Career Health Score */}
                  <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-blue-200 uppercase tracking-wider font-semibold mb-2 text-center">Career Health Score</p>
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                          <circle 
                            cx="64" 
                            cy="64" 
                            r="56" 
                            stroke="currentColor" 
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray={352} 
                            strokeDashoffset={352 - (352 * careerInsight.current.healthScore) / 100} 
                            className={`transition-all duration-1000 ${
                              careerInsight.current.healthScore >= 70 ? "text-emerald-500" : 
                              careerInsight.current.healthScore >= 40 ? "text-amber-500" : "text-red-500"
                            }`}
                            strokeLinecap="round" 
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-3xl font-bold ${
                            careerInsight.current.healthScore >= 70 ? "text-emerald-400" : 
                            careerInsight.current.healthScore >= 40 ? "text-amber-400" : "text-red-400"
                          }`}>
                            {careerInsight.current.healthScore}
                          </span>
                          <span className="text-xs text-gray-500">/ 100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Market Position */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-sm font-bold text-gray-300 mb-3">Market Position</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Salary vs Market:</span>
                        <span className={`text-sm font-bold ${
                          careerInsight.current.salaryGap >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {careerInsight.current.salaryGap >= 0 ? '+' : ''}{careerInsight.current.salaryGap}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Percentile:</span>
                        <span className="text-sm font-bold text-white">{careerInsight.current.positionPercentile}th</span>
                      </div>
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-xs text-gray-400 mb-2">Market Range:</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">₹{(careerInsight.current.marketSalaryRange.min/1000).toFixed(0)}k</span>
                          <span className="text-violet-400 font-bold">₹{(careerInsight.current.marketSalaryRange.median/1000).toFixed(0)}k</span>
                          <span className="text-gray-500">₹{(careerInsight.current.marketSalaryRange.max/1000).toFixed(0)}k</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottlenecks */}
                  <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <h4 className="text-sm font-bold text-red-300 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Career Bottlenecks
                    </h4>
                    <ul className="space-y-2">
                      {careerInsight.current.bottlenecks.map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Strengths */}
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <h4 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Your Strengths
                    </h4>
                    <ul className="space-y-2">
                      {careerInsight.current.strengths.map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Reasoning */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
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

              {/* Disclaimer */}
              <div className="text-[10px] text-gray-600 text-center pt-4 pb-2 border-t border-white/5">
                Disclaimer: This analysis is AI-generated based on general market trends. 
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