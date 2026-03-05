import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { BookOpen, Wallet, Plus, Trash2, ShieldCheck, Zap } from 'lucide-react';

const ClassManager = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newClass, setNewClass] = useState({ className: '', monthlyFee: '' });

  // Fetch Existing Sectors/Classes
  const fetchClasses = async () => {
    const q = query(collection(db, "classes"), orderBy("className", "asc"));
    const snap = await getDocs(q);
    setClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newClass.className || !newClass.monthlyFee) return alert("Fill all fields!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "classes"), {
        className: newClass.className.toUpperCase(),
        monthlyFee: Number(newClass.monthlyFee),
        createdAt: new Date()
      });
      setNewClass({ className: '', monthlyFee: '' });
      fetchClasses();
      alert("Sector Configured!");
    } catch (err) { alert("Error saving class."); }
    setLoading(false);
  };

  const deleteClass = async (id) => {
    if (window.confirm("Delete this sector? All linked student fee structures might be affected.")) {
      await deleteDoc(doc(db, "classes", id));
      fetchClasses();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 fade-in">
      
      {/* ADD NEW CLASS FORM */}
      <div className="lg:col-span-1">
        <div className="neon-card p-8 border-t-4 border-t-[#00d2ff]">
          <div className="flex items-center gap-3 mb-8">
            <Plus className="text-[#00d2ff]" size={20}/>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Configure Sector</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Class/Sector Name</label>
              <input 
                value={newClass.className}
                onChange={e => setNewClass({...newClass, className: e.target.value})}
                placeholder="e.g. GRADE-10" 
                className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-[#00d2ff] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Default Monthly Fee</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">Rs.</span>
                <input 
                  type="number"
                  value={newClass.monthlyFee}
                  onChange={e => setNewClass({...newClass, monthlyFee: e.target.value})}
                  placeholder="0.00" 
                  className="w-full bg-slate-900/50 p-4 pl-12 rounded-xl text-white border border-white/10 outline-none focus:border-[#00ff87]"
                />
              </div>
            </div>
            <button disabled={loading} className="btn-neon w-full py-5 flex items-center justify-center gap-3">
              <Zap size={18}/> {loading ? 'Syncing...' : 'Deploy Sector'}
            </button>
          </form>
        </div>
      </div>

      {/* CLASS LIST / REVENUE PREVIEW */}
      <div className="lg:col-span-2 space-y-6">
        <div className="neon-card p-8 border border-white/5">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="text-xs font-black uppercase tracking-[4px] text-white">Active Operational Sectors</h4>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">Master Fee Structure</p>
            </div>
            <ShieldCheck className="text-slate-700" size={20}/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((c) => (
              <div key={c.id} className="group relative bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-[#00d2ff]/5 hover:border-[#00d2ff]/30 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={14} className="text-[#00d2ff]"/>
                        <h5 className="text-sm font-black text-white uppercase italic">{c.className}</h5>
                    </div>
                    <div className="flex items-center gap-2">
                        <Wallet size={12} className="text-[#00ff87]"/>
                        <p className="text-xs font-black text-[#00ff87] tracking-tighter">Rs. {c.monthlyFee}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteClass(c.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {classes.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[5px]">No Sectors Deployed</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ClassManager;