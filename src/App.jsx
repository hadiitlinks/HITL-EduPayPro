import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { LayoutDashboard, Users, Receipt, PlusCircle, Search } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', rollNo: '', class: '', fee: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Data Fetching (Loop-safe)
  const fetchData = useCallback(async () => {
    try {
      const sSnap = await getDocs(collection(db, "students"));
      setStudents(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error("Firebase Fetch Error:", e); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, activeTab]);

  // 2. Student Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "students"), {
        ...newStudent,
        status: 'Unpaid',
        createdAt: new Date()
      });
      alert("Student Registered Successfully!");
      setNewStudent({ name: '', rollNo: '', class: '', fee: '' });
      fetchData();
    } catch (err) { alert("Error: " + err.message); }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col shadow-xl">
        <h1 className="text-2xl font-black text-yellow-400 mb-10 tracking-tighter italic">EDU-PAY PRO</h1>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('Dashboard')} className={`w-full flex items-center p-4 rounded-xl transition ${activeTab === 'Dashboard' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} className="mr-3"/> Dashboard
          </button>
          <button onClick={() => setActiveTab('Students')} className={`w-full flex items-center p-4 rounded-xl transition ${activeTab === 'Students' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
            <PlusCircle size={20} className="mr-3"/> Registration
          </button>
          <button onClick={() => setActiveTab('Fees')} className={`w-full flex items-center p-4 rounded-xl transition ${activeTab === 'Fees' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Receipt size={20} className="mr-3"/> Fee Collection
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tight">{activeTab}</h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Database Linked</span>
          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border-b-8 border-indigo-600">
              <p className="text-slate-400 font-bold text-xs uppercase mb-1">Total Students</p>
              <h3 className="text-6xl font-black text-slate-900">{students.length}</h3>
            </div>
            <div className="bg-white p-10 rounded-[40px] shadow-sm border-b-8 border-red-500">
              <p className="text-slate-400 font-bold text-xs uppercase mb-1">Pending Fees</p>
              <h3 className="text-6xl font-black text-red-600">{students.filter(s => s.status === 'Unpaid').length}</h3>
            </div>
          </div>
        )}

        {activeTab === 'Students' && (
          <div className="bg-white p-10 rounded-[40px] shadow-2xl border max-w-2xl">
            <h3 className="text-2xl font-bold mb-8">Naya Student Register Karen</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <input className="w-full bg-slate-50 p-5 rounded-2xl outline-none focus:ring-2 ring-indigo-500 border" placeholder="Student Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-slate-50 p-5 rounded-2xl outline-none border" placeholder="Roll No" value={newStudent.rollNo} onChange={e => setNewStudent({...newStudent, rollNo: e.target.value})} required />
                <input className="bg-slate-50 p-5 rounded-2xl outline-none border" placeholder="Class" value={newStudent.class} onChange={e => setNewStudent({...newStudent, class: e.target.value})} required />
              </div>
              <input className="w-full bg-slate-50 p-5 rounded-2xl outline-none border" type="number" placeholder="Monthly Fee (Rs.)" value={newStudent.fee} onChange={e => setNewStudent({...newStudent, fee: e.target.value})} required />
              <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-indigo-600 transition-all shadow-lg text-lg uppercase">Confirm Registration</button>
            </form>
          </div>
        )}

        {activeTab === 'Fees' && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border overflow-hidden">
            <div className="relative mb-8">
              <Search className="absolute left-4 top-4 text-slate-400" size={20} />
              <input className="w-full bg-slate-100 pl-12 p-4 rounded-2xl outline-none focus:ring-2 ring-indigo-500 font-medium" placeholder="Search Roll Number or Name..." onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <table className="w-full text-left">
              <thead><tr className="border-b text-slate-400 text-xs font-black uppercase">
                <th className="pb-4">Name</th><th className="pb-4">Roll No</th><th className="pb-4">Amount</th><th className="pb-4 text-right">Action</th>
              </tr></thead>
              <tbody>
                {students.filter(s => s.rollNo.includes(searchQuery) || s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                  <tr key={s.id} className="border-b hover:bg-slate-50 transition">
                    <td className="py-5 font-bold text-slate-800">{s.name}</td>
                    <td><span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-600">{s.rollNo}</span></td>
                    <td className="font-bold text-indigo-600">Rs. {s.fee}</td>
                    <td className="text-right"><button className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition uppercase">Mark Paid</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;