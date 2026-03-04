import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { LayoutDashboard, Users, CreditCard, Wallet, Menu, X, PlusCircle } from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [students, setStudents] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [newStudent, setNewStudent] = useState({ name: '', rollNo: '', class: '', fee: '' });

  // FIXED: fetchData wrapped in useCallback to prevent re-renders
  const fetchData = useCallback(async () => {
    try {
      const sSnap = await getDocs(collection(db, "students"));
      setStudents(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const eSnap = await getDocs(query(collection(db, "expenses"), orderBy("createdAt", "desc")));
      setExpenses(eSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error("Firebase Error:", e); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, activeTab]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "students"), { ...newStudent, createdAt: new Date() });
      alert("Student Added!");
      setNewStudent({ name: '', rollNo: '', class: '', fee: '' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <aside className={`${isMenuOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 p-4`}>
        <div className="flex items-center justify-between mb-10">
          {isMenuOpen && <span className="font-bold text-xl text-yellow-500 tracking-tighter">EDU-PAY</span>}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-slate-800 rounded-lg"><Menu size={18} /></button>
        </div>
        <nav className="space-y-2">
          {['Dashboard', 'Students', 'Expenses'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center p-3 rounded-xl ${activeTab === tab ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}>
              <PlusCircle size={20} /> {isMenuOpen && <span className="ml-3 font-medium">{tab}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border">
          <h2 className="text-3xl font-black text-slate-800">{activeTab}</h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-green-700 uppercase">Live Cloud</span>
          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-10 rounded-[35px] shadow-sm border-b-4 border-indigo-500">
              <p className="text-slate-400 font-bold text-xs uppercase mb-1">Total Students</p>
              <h3 className="text-5xl font-black text-indigo-600 tracking-tighter">{students.length}</h3>
            </div>
            <div className="bg-white p-10 rounded-[35px] shadow-sm border-b-4 border-red-500">
              <p className="text-slate-400 font-bold text-xs uppercase mb-1">Total Outflow</p>
              <h3 className="text-5xl font-black text-red-600 tracking-tighter">Rs. 0</h3>
            </div>
          </div>
        )}

        {activeTab === 'Students' && (
          <div className="bg-white p-10 rounded-[40px] shadow-xl border max-w-2xl">
            <h3 className="text-xl font-bold mb-8">Register New Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <input className="w-full bg-slate-50 p-5 rounded-2xl outline-none focus:ring-2 ring-indigo-500 transition-all" placeholder="Full Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-slate-50 p-5 rounded-2xl outline-none focus:ring-2 ring-indigo-500 transition-all" placeholder="Roll No" value={newStudent.rollNo} onChange={e => setNewStudent({...newStudent, rollNo: e.target.value})} required />
                <input className="bg-slate-50 p-5 rounded-2xl outline-none focus:ring-2 ring-indigo-500 transition-all" placeholder="Class" value={newStudent.class} onChange={e => setNewStudent({...newStudent, class: e.target.value})} required />
              </div>
              <input className="w-full bg-slate-50 p-5 rounded-2xl outline-none focus:ring-2 ring-indigo-500 transition-all" type="number" placeholder="Monthly Fee" value={newStudent.fee} onChange={e => setNewStudent({...newStudent, fee: e.target.value})} required />
              <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-indigo-600 transition-all shadow-lg">Confirm Registration</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;