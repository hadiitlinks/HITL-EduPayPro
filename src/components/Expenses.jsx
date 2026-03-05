import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { TrendingDown, Plus, DollarSign, Calendar, Tag, FileText } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'Utility', date: new Date().toISOString().split('T')[0] });

  const fetchExpenses = async () => {
    const q = query(collection(db, "expenses"), orderBy("date", "desc"));
    const snap = await getDocs(q);
    setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return alert("Fill all details!");
    setLoading(true);
    try {
      await addDoc(collection(db, "expenses"), { ...newExpense, amount: Number(newExpense.amount), createdAt: new Date() });
      setNewExpense({ title: '', amount: '', category: 'Utility', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (err) { alert("Error!"); }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in">
      {/* ADD EXPENSE FORM */}
      <div className="lg:col-span-1">
        <div className="neon-card p-8 border-t-4 border-t-red-500">
          <div className="flex items-center gap-3 mb-8">
            <TrendingDown className="text-red-500" size={20}/>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Record Outflow</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Expense Title</label>
              <input value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} placeholder="e.g. Electricity Bill" className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-red-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount (PKR)</label>
              <input type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} placeholder="0.00" className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-red-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
              <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none">
                <option>Utility</option>
                <option>Salary</option>
                <option>Rent</option>
                <option>Maintenance</option>
                <option>Other</option>
              </select>
            </div>
            <button disabled={loading} className="w-full py-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500/20 transition-all">
              {loading ? 'Syncing...' : 'Authorize Expense'}
            </button>
          </form>
        </div>
      </div>

      {/* EXPENSE LOGS */}
      <div className="lg:col-span-2">
        <div className="neon-card p-8 min-h-[500px]">
          <h4 className="text-xs font-black uppercase tracking-[4px] text-white mb-8">Audit Trail / Outflows</h4>
          <div className="space-y-3">
            {expenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:bg-red-500/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-800 rounded-xl text-red-500"><Tag size={16}/></div>
                  <div>
                    <p className="text-xs font-black text-white uppercase">{exp.title}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{exp.category} • {exp.date}</p>
                  </div>
                </div>
                <p className="text-sm font-black text-red-500 italic">- Rs. {exp.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;