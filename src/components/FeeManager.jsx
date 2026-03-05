import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
import { Receipt, Search, Printer, X, CheckCircle, User } from 'lucide-react';

const FeeManager = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTx, setLastTx] = useState(null);
  const [school, setSchool] = useState({});
  const printRef = useRef();

  useEffect(() => {
    const fetchSchool = async () => {
      const snap = await getDoc(doc(db, "settings", "schoolProfile"));
      if (snap.exists()) setSchool(snap.data());
    };
    fetchSchool();
  }, [showReceipt]);

  const handleSearch = async () => {
    const q = query(collection(db, "students"), where("fullName", "==", search));
    const snap = await getDocs(q);
    setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const submitFee = async () => {
    if (!selectedStudent || !amount) return;
    setLoading(true);
    const tx = {
      studentName: selectedStudent.fullName,
      fatherName: selectedStudent.fatherName,
      class: selectedStudent.class,
      amount: Number(amount),
      date: new Date().toLocaleDateString(),
      receiptNo: `FT-${Date.now().toString().slice(-6)}`
    };
    await addDoc(collection(db, "transactions"), { ...tx, createdAt: new Date() });
    setLastTx(tx);
    setShowReceipt(true);
    setLoading(false);
    setAmount('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 fade-in">
      {/* SEARCH BOX */}
      <div className="lg:col-span-1 space-y-4">
        <div className="neon-card p-6">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Student..." className="w-full bg-slate-900/50 p-4 rounded-xl text-white outline-none border border-white/5 focus:border-[var(--primary)]" />
          <button onClick={handleSearch} className="w-full mt-4 py-3 bg-[var(--primary)]/10 text-[var(--primary)] font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-[var(--primary)] hover:text-black transition-all">Search Database</button>
        </div>
        <div className="space-y-2">
          {students.map(s => (
            <div key={s.id} onClick={() => setSelectedStudent(s)} className={`p-4 rounded-2xl cursor-pointer border transition-all ${selectedStudent?.id === s.id ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-white/5 hover:border-white/10'}`}>
              <p className="text-xs font-black uppercase">{s.fullName}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">{s.class}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PAYMENT PANEL */}
      <div className="lg:col-span-2">
        {selectedStudent ? (
          <div className="neon-card p-10 border-t-4 border-t-[var(--primary)]">
            <h2 className="text-2xl font-black italic mb-8 uppercase">{selectedStudent.fullName}</h2>
            <div className="space-y-6">
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter Amount" className="w-full bg-slate-900/50 p-6 rounded-2xl text-3xl font-black text-[var(--primary)] outline-none border border-white/5" />
              <button onClick={submitFee} disabled={loading} className="btn-neon w-full py-6 flex items-center justify-center gap-3">
                <CheckCircle size={24}/> {loading ? 'Processing...' : 'Collect Fee & Generate Slip'}
              </button>
            </div>
          </div>
        ) : (
          <div className="h-96 border-2 border-dashed border-white/5 rounded-[3rem] flex items-center justify-center opacity-20">
            <p className="font-black uppercase tracking-[5px] text-xs">Ready for Transaction</p>
          </div>
        )}
      </div>

      {/* POPUP SLIP */}
      {showReceipt && lastTx && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div ref={printRef} className="p-8 text-slate-900">
              <div className="text-center border-b-2 border-dashed border-slate-100 pb-6 mb-6">
                <h1 className="text-2xl font-black italic tracking-tighter">{school.name || 'EDUPRO'}</h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{school.address}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{school.phone}</p>
              </div>
              <div className="space-y-3 mb-6">
                 <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>No: {lastTx.receiptNo}</span><span>{lastTx.date}</span></div>
                 <div className="text-xs font-bold bg-slate-50 p-4 rounded-xl space-y-1">
                    <div className="flex justify-between"><span>STUDENT:</span><span className="font-black">{lastTx.studentName}</span></div>
                    <div className="flex justify-between"><span>CLASS:</span><span className="font-black">{lastTx.class}</span></div>
                 </div>
                 <div className="flex justify-between items-center py-4 border-y-2 border-slate-50 mt-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Total Paid:</span>
                    <span className="text-2xl font-black italic">Rs. {lastTx.amount}</span>
                 </div>
              </div>
              <p className="text-[7px] text-center font-black uppercase text-slate-300 tracking-[3px]">Digital Confirmation System</p>
            </div>
            <div className="p-4 bg-slate-50 flex gap-2">
              <button onClick={() => window.print()} className="flex-1 py-4 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><Printer size={16}/> Print</button>
              <button onClick={() => setShowReceipt(false)} className="px-6 py-4 bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-[10px]"><X size={16}/></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManager;