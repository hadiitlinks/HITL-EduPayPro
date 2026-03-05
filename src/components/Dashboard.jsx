import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Users, Wallet, TrendingUp, ArrowUpRight, Clock, ArrowDownRight, Activity, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netBalance: 0
  });
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const studentSnap = await getDocs(collection(db, "students"));
        const txSnap = await getDocs(collection(db, "transactions"));
        let revenue = 0;
        txSnap.forEach(doc => revenue += doc.data().amount || 0);

        const expSnap = await getDocs(collection(db, "expenses"));
        let outflow = 0;
        expSnap.forEach(doc => outflow += doc.data().amount || 0);

        const qTx = query(collection(db, "transactions"), orderBy("createdAt", "desc"), limit(5));
        const recentSnap = await getDocs(qTx);
        
        setStats({
          totalStudents: studentSnap.size,
          totalRevenue: revenue,
          totalExpenses: outflow,
          netBalance: revenue - outflow
        });
        
        setRecentTx(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const cards = [
    { label: 'Students', value: stats.totalStudents, icon: <Users size={16}/>, color: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/10' },
    { label: 'Revenue', value: stats.totalRevenue, icon: <Wallet size={16}/>, color: 'text-[var(--secondary)]', bg: 'bg-[var(--secondary)]/10' },
    { label: 'Expenses', value: stats.totalExpenses, icon: <TrendingUp size={16}/>, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Profit', value: stats.netBalance, icon: <Activity size={16}/>, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  if (loading) return <div className="h-96 flex items-center justify-center text-[var(--primary)] font-black tracking-widest animate-pulse uppercase text-[10px]">Syncing Core...</div>;

  return (
    <div className="space-y-6 fade-in">
      
      {/* 4-COLUMN GRID (PC) / 2-COLUMN GRID (MOBILE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {cards.map((card, index) => (
          <div key={index} className="neon-card p-4 md:p-6 flex flex-col md:flex-row items-center justify-between border border-white/5 relative overflow-hidden group">
            <div className="text-center md:text-left relative z-10">
              <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-sm md:text-xl font-black text-white italic tracking-tighter">
                {typeof card.value === 'number' && card.label !== 'Students' ? `Rs. ${card.value.toLocaleString()}` : card.value}
              </h3>
            </div>
            <div className={`mt-3 md:mt-0 p-3 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform relative z-10`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* CASHFLOW MONITOR */}
        <div className="lg:col-span-2 neon-card p-6 md:p-8 flex flex-col border border-white/5">
          <div className="mb-8">
            <h4 className="text-[10px] font-black uppercase tracking-[3px] text-white">Cashflow Monitoring</h4>
            <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 italic">Financial Health Score</p>
          </div>
          
          <div className="space-y-6">
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5 p-0.5">
               <div className="h-full bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] rounded-full shadow-[0_0_15px_var(--primary)]" style={{ width: '85%' }}></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 text-center">
                  <p className="text-[8px] font-black text-slate-600 uppercase mb-1 tracking-widest">Efficiency</p>
                  <p className="text-lg font-black text-[var(--secondary)] italic">94%</p>
               </div>
               <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 text-center">
                  <p className="text-[8px] font-black text-slate-600 uppercase mb-1 tracking-widest">Stability</p>
                  <p className="text-lg font-black text-[var(--primary)] italic">High</p>
               </div>
            </div>
          </div>
        </div>

        {/* RECENT STREAMS */}
        <div className="neon-card p-6 md:p-8 border border-white/5">
          <h4 className="text-[10px] font-black uppercase tracking-[3px] text-white mb-6">Recent Streams</h4>
          <div className="space-y-3">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle size={14} className="text-[var(--primary)] opacity-50"/>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase">{tx.studentName.split(' ')[0]}</p>
                    <p className="text-[8px] text-slate-600 font-bold uppercase">{tx.date}</p>
                  </div>
                </div>
                <p className="text-[10px] font-black text-[var(--primary)]">+{tx.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;