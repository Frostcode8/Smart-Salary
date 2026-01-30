import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// A "Dumb" presentation component for the PDF report
// It receives data and renders the layout. The Dashboard handles the actual PDF generation.
export default function MonthlyReport({
    monthData,
    records,
    userName,
    selectedMonthKey,
    id // Receive ID from parent to identify this element for PDF generation
}) {
    /* ---------- DATA PREP ---------- */
    const safe = monthData || {};
    const income = parseFloat(safe.income || 0);
    const emi = parseFloat(safe.emi || 0);
    const score = safe.score || 0;
    
    // Budget Plans
    const bp = safe.budgetPlan || {};
    const needsL = bp.needs || 0;
    const wantsL = bp.wants || 0;
    const saveL = bp.savings || 0;

    // Filter Records for this month
    const monthRecs = useMemo(() => {
        if (!records) return [];
        return records.filter(r => {
            const d = r.createdAt?.seconds
                ? new Date(r.createdAt.seconds * 1000).toISOString().slice(0, 7)
                : "";
            return d === selectedMonthKey && r.type === "expense";
        });
    }, [records, selectedMonthKey]);

    // Calculate Totals
    const needsUsed = monthRecs.filter(r => (r.needType || "need") !== "want")
        .reduce((s, r) => s + (r.amount || 0), 0) + emi;

    const wantsUsed = monthRecs.filter(r => r.needType === "want")
        .reduce((s, r) => s + (r.amount || 0), 0);

    const spent = needsUsed + wantsUsed;
    const saved = income - spent;
    const savingsRate = income > 0 ? ((saved / income) * 100).toFixed(1) : 0;
    const dailyAverage = spent / 30; // Approx daily spend

    // Pie Chart Data
    const pie = useMemo(() => {
        const map = {};
        monthRecs.forEach(r => {
            map[r.category || "Other"] = (map[r.category || "Other"] || 0) + r.amount;
        });
        return Object.entries(map)
            .map(([n, v]) => ({ name: n, value: v }))
            .sort((a, b) => b.value - a.value); // Sort by value for better chart look
    }, [monthRecs]);

    const COLORS = ["#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#6b7280", "#ef4444"];

    /* ---------- STYLES ---------- */
    // Using inline styles ensures they are captured correctly by the PDF engine
    const styles = {
        page: {
            width: "794px", // A4 width at 96 DPI
            minHeight: "1123px", // A4 height
            padding: "40px",
            background: "#ffffff",
            color: "#111827",
            fontFamily: "Helvetica, Arial, sans-serif",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            position: "relative" 
        },
        header: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderBottom: "2px solid #e5e7eb",
            paddingBottom: "20px",
            marginBottom: "30px"
        },
        brand: {
            fontSize: "24px",
            fontWeight: "800",
            color: "#7c3aed",
            letterSpacing: "-0.5px"
        },
        sub: { fontSize: "14px", color: "#6b7280", letterSpacing: "1px", textTransform: "uppercase" },
        section: { marginBottom: "30px" },
        sectionTitle: { fontSize: "16px", fontWeight: "bold", borderBottom: "1px solid #e5e7eb", paddingBottom: "5px", marginBottom: "15px", color: "#374151" },
        grid: { display: "flex", gap: "15px", marginBottom: "20px" }, // Reduced gap slightly to fit 4 items
        card: { flex: 1, padding: "12px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" },
        label: { fontSize: "11px", color: "#6b7280", marginBottom: "4px", textTransform: "uppercase", fontWeight: "600" },
        value: { fontSize: "18px", fontWeight: "bold", color: "#111827" },
        subValue: { fontSize: "10px", color: "#6b7280", marginTop: "4px" },
        table: { width: "100%", borderCollapse: "collapse", fontSize: "11px" },
        th: { textAlign: "left", borderBottom: "1px solid #9ca3af", padding: "8px", color: "#4b5563", fontWeight: "bold" },
        td: { borderBottom: "1px solid #e5e7eb", padding: "8px", color: "#1f2937" },
        footer: { marginTop: "auto", textAlign: "center", fontSize: "10px", color: "#9ca3af", borderTop: "1px solid #e5e7eb", paddingTop: "10px" },
        legendItem: { display: 'flex', alignItems: 'center', fontSize: '10px', marginBottom: '4px' },
        colorBox: { width: '8px', height: '8px', borderRadius: '2px', marginRight: '6px' }
    };

    // Custom Legend to ensure it renders in PDF
    const renderLegend = () => (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
            {pie.map((entry, index) => (
                <div key={`item-${index}`} style={styles.legendItem}>
                    <div style={{ ...styles.colorBox, background: COLORS[index % COLORS.length] }} />
                    <span style={{color: '#374151'}}>{entry.name} ({Math.round((entry.value / spent) * 100)}%)</span>
                </div>
            ))}
        </div>
    );

    return (
        /* The ID here matches what Dashboard looks for */
        <div id={id} style={styles.page}>
            {/* HEADER */}
            <div style={styles.header}>
                <div>
                    <div style={styles.brand}>SmartSalary.</div>
                    <div style={styles.sub}>
                        {new Date(selectedMonthKey + "-01").toLocaleString("default", { month: "long", year: "numeric" })} Financial Report
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Prepared for</div>
                    <div style={{ fontWeight: "bold", color: "#111827", fontSize: "16px" }}>{userName || "User"}</div>
                </div>
            </div>

            {/* FINANCIAL HEALTH & OVERVIEW */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>Financial Health & Overview</div>
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <div style={styles.label}>Total Income</div>
                        <div style={{...styles.value, color: "#10b981"}}>₹{income.toLocaleString()}</div>
                        <div style={styles.subValue}>Monthly Inflow</div>
                    </div>
                    <div style={styles.card}>
                        <div style={styles.label}>Total Expenses</div>
                        <div style={{...styles.value, color: "#ef4444"}}>₹{spent.toLocaleString()}</div>
                        <div style={styles.subValue}>~₹{Math.round(dailyAverage).toLocaleString()} per day</div>
                    </div>
                    <div style={styles.card}>
                        <div style={styles.label}>Net Savings</div>
                        <div style={{...styles.value, color: saved >= 0 ? "#8b5cf6" : "#ef4444"}}>₹{saved.toLocaleString()}</div>
                        <div style={styles.subValue}>{savingsRate}% Savings Rate</div>
                    </div>
                    <div style={{...styles.card, background: '#f5f3ff', borderColor: '#ddd6fe'}}>
                        <div style={styles.label}>Health Score</div>
                        <div style={{...styles.value, color: "#7c3aed"}}>{score} / 100</div>
                        <div style={styles.subValue}>{score >= 80 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Action'}</div>
                    </div>
                </div>
            </div>

            {/* BUDGET PERFORMANCE */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>Budget Performance</div>
                <div style={{...styles.grid, gap: '15px'}}>
                    <div style={{...styles.card, background: '#fff'}}>
                        <div style={styles.label}>Needs (Limit: ₹{needsL.toLocaleString()})</div>
                        <div style={{fontSize: '16px', fontWeight: '600'}}>₹{needsUsed.toLocaleString()}</div>
                        <div style={{height: '4px', width: '100%', background: '#f3f4f6', marginTop: '5px', borderRadius: '2px'}}>
                             <div style={{height: '100%', width: `${Math.min(100, (needsUsed/needsL)*100)}%`, background: needsUsed > needsL ? '#ef4444' : '#10b981', borderRadius: '2px'}}></div>
                        </div>
                        <div style={{fontSize: '10px', color: needsUsed > needsL ? '#ef4444' : '#10b981', marginTop: '2px'}}>
                            {needsUsed > needsL ? 'Over Budget' : `${Math.round((needsUsed/needsL)*100)}% Used`}
                        </div>
                    </div>
                    <div style={{...styles.card, background: '#fff'}}>
                        <div style={styles.label}>Wants (Limit: ₹{wantsL.toLocaleString()})</div>
                        <div style={{fontSize: '16px', fontWeight: '600'}}>₹{wantsUsed.toLocaleString()}</div>
                        <div style={{height: '4px', width: '100%', background: '#f3f4f6', marginTop: '5px', borderRadius: '2px'}}>
                             <div style={{height: '100%', width: `${Math.min(100, (wantsUsed/wantsL)*100)}%`, background: wantsUsed > wantsL ? '#ef4444' : '#f59e0b', borderRadius: '2px'}}></div>
                        </div>
                        <div style={{fontSize: '10px', color: wantsUsed > wantsL ? '#ef4444' : '#f59e0b', marginTop: '2px'}}>
                            {wantsUsed > wantsL ? 'Over Budget' : `${Math.round((wantsUsed/wantsL)*100)}% Used`}
                        </div>
                    </div>
                    <div style={{...styles.card, background: '#fff'}}>
                        <div style={styles.label}>Savings Goal (Target: ₹{saveL.toLocaleString()})</div>
                        <div style={{fontSize: '16px', fontWeight: '600'}}>₹{saved.toLocaleString()}</div>
                         <div style={{height: '4px', width: '100%', background: '#f3f4f6', marginTop: '5px', borderRadius: '2px'}}>
                             <div style={{height: '100%', width: `${Math.min(100, (saved/saveL)*100)}%`, background: saved < saveL ? '#f59e0b' : '#10b981', borderRadius: '2px'}}></div>
                        </div>
                        <div style={{fontSize: '10px', color: saved < saveL ? '#f59e0b' : '#10b981', marginTop: '2px'}}>
                            {saved < saveL ? `₹${(saveL - saved).toLocaleString()} Short` : 'Target Met'}
                        </div>
                    </div>
                </div>
            </div>

            {/* CHARTS & DETAILS GRID */}
            <div style={{...styles.grid, alignItems: 'flex-start'}}>
                {/* SPENDING BREAKDOWN (Donut Chart) */}
                <div style={{ flex: 1, paddingRight: '10px' }}>
                    <div style={styles.sectionTitle}>Spending Breakdown</div>
                    <div style={{ height: "220px", position: "relative", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {pie.length > 0 ? (
                            <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie 
                                        data={pie} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={50} // Donut Effect
                                        outerRadius={80} 
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="#fff"
                                        strokeWidth={2}
                                    >
                                        {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value) => `₹${value.toLocaleString()}`}
                                        contentStyle={{borderRadius: '8px', fontSize: '12px'}}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {renderLegend()}
                            </>
                        ) : (
                            <div style={{textAlign: 'center', padding: '50px', color: '#9ca3af', fontSize: '12px'}}>No expenses recorded yet.</div>
                        )}
                    </div>
                </div>

                {/* TOP EXPENSES LIST */}
                <div style={{ flex: 1.2 }}>
                    <div style={styles.sectionTitle}>Top Expenses</div>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Description</th>
                                <th style={styles.th}>Cat.</th>
                                <th style={{...styles.th, textAlign: 'right'}}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthRecs.sort((a,b) => b.amount - a.amount).slice(0, 10).map((r, i) => (
                                <tr key={i}>
                                    <td style={styles.td}>{new Date(r.createdAt?.seconds * 1000).getDate()}th</td>
                                    <td style={{...styles.td, fontWeight: '500'}}>{r.description}</td>
                                    <td style={styles.td}>
                                        <span style={{fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: '#f3f4f6', color: '#4b5563'}}>
                                            {r.category}
                                        </span>
                                    </td>
                                    <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold'}}>₹{r.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                            {monthRecs.length === 0 && (
                                <tr><td colSpan="4" style={{...styles.td, textAlign: 'center', color: '#9ca3af'}}>No records found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FOOTER */}
            <div style={styles.footer}>
                Generated automatically by SmartSalary on {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()} <br/>
                Keep this document for your personal financial records.
            </div>
        </div>
    );
}