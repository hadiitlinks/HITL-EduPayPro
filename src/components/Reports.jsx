import React from 'react';
import { BarChart3, PieChart, Download, Filter, FileText, TrendingUp, ArrowDownCircle, ShieldCheck } from 'lucide-react';

const Reports = () => {
  const reportCategories = [
    { title: "Monthly Revenue", desc: "Total fee collection vs targets", icon: <TrendingUp size={20}/>, status: "Verified" },
    { title: "Deficit Analysis", desc: "Outstanding arrears and bad debts", icon: <ArrowDownCircle size={20}/>, status: "Critical" },
    { title: "Student Ledger", desc: "Individual payment history logs", icon: <FileText size={20}/>, status: "Updated" },
    { title: "System Audit", desc: "Security and transaction logs", icon: <ShieldCheck size={20}/>, status: "Secure" }
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* CONTROL BAR */}
      <div className="neon-card p-6 flex flex-wrap items-center justify-between gap-6 border-b-2 border-b-[#00d2ff]/20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#00d2ff]/10 rounded-xl text-[#00d2ff]">
            <BarChart3 size={24}/>
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Analytics Core</h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[3px]">Generate Financial Intelligence</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
            <Filter size={14}/> Filter Range
          </button>
          <button className="btn-neon flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest">
            <Download size={14}/> Export Data
          </button>
        </div>
      </div>

      {/* REPORT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((report, idx) => (
          <div key={idx} className="neon-card p-8 border border-white/5 group hover:border-[#00ff87]/30 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              {report.icon}
            </div>
            
            <div className="flex justify-between items-start mb-6">
              <div className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                report.status === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-[#00ff87]/10 text-[#00ff87]'
              }`}>
                {report.status}
              </div>
              <div className="text-slate-700 group-hover:text-[#00d2ff] transition-colors">
                <PieChart size={20}/>
              </div>
            </div>

            <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2 group-hover:glow-text">
              {report.title}
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
              {report.desc}
            </p>
            
            <div className="flex items-center gap-2 text-[10px] font-black text-[#00d2ff] uppercase tracking-widest">
              Access Detailed Report <TrendingUp size={14} className="ml-1"/>
            </div>
          </div>
        ))}
      </div>

      {/* DATA VISUALIZATION AREA (PREVIEW) */}
      <div className="neon-card p-10 border border-white/5">
        <div className="flex items-center justify-between mb-10">
           <h4 className="text-xs font-black uppercase tracking-[4px] text-white">Projected Collection vs Actual</h4>
           <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500"><span className="w-2 h-2 rounded-full bg-[#00d2ff]"></span> TARGET</div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500"><span className="w-2 h-2 rounded-full bg-[#00ff87]"></span> ACTUAL</div>
           </div>
        </div>
        
        <div className="h-48 flex items-end gap-4 px-4">
          {[40, 70, 45, 90, 65, 80, 50, 95].map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
              <div className="w-full bg-slate-800/50 rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
                <div 
                  className="absolute bottom-0 w-full bg-gradient-to-t from-[#00d2ff] to-[#00ff87] transition-all duration-1000 ease-out group-hover:brightness-125" 
                  style={{ height: `${height}%` }}
                ></div>
              </div>
              <span className="text-[8px] font-black text-slate-600 uppercase">Batch {i+1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;