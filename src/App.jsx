import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { LayoutDashboard, Users, Receipt, CreditCard, Wallet, Menu, X, PlusCircle } from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', rollNo: '', class: '', fee: '' });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, "students"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(data);
      } catch (e) { console.error("Error fetching:", e); }
    };
    fetchStudents();
  }, [activeTab]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "students"), {
        ...newStudent,
        fee: parseFloat(newStudent.fee),
        createdAt: new Date()
      });
      alert("Student Registered Successfully!");
      setNewStudent({ name: '', rollNo: '', class: '', fee: '' });
      setActiveTab('Dashboard'); 
    } catch (error) {
      alert("Firebase Error: " + error.message);
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Students', icon: <Users size={20} /> },
    { name: 'Fee Collection', icon: <Receipt size={20} /> },
    { name: 'Expenses', icon: <CreditCard size={20} /> },
    { name: 'Petty Cash', icon: <Wallet size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className={`${isMenuOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl`}>
        <div className="p-6 flex justify-between items-center border-b border-slate-800">
          {isMenuOpen && <h1 className="font-black text-xl text-yellow-400 tracking-tighter">EDU-PAY PRO</h1>}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 mt-6 px-3">
          {menuItems.map((item) => (
            <button key={item.name} onClick={() => setActiveTab(item.name)} className={`w-full flex items-center p-4 my-1 rounded-xl transition-all ${activeTab === item.name ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800'}`}>
              {item.icon}
              {isMenuOpen && <span className="ml-4 font-semibold text-sm">{item.name}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white p-5 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">{activeTab}</h2>
          <div className="flex items-center bg-green-50 px-4 py-2 rounded-full border border-green-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Database Linked</span>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          {activeTab === 'Dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Total Active Students</p>
                <h3 className="text-4xl font-black text-indigo-600">{students.length}</h3>
              </div>
            </div>
          )}

          {activeTab === 'Students' && (
            <div className="max-w-4xl bg-white rounded-3xl shadow-sm p-10 border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                <PlusCircle className="text-indigo-600" /> Register Student
              </h3>
              <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all" placeholder="Student Name" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} required />
                <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all" placeholder="Roll No" value={newStudent.rollNo} onChange={(e) => setNewStudent({...newStudent, rollNo: e.target.value})} required />
                <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all" placeholder="Class" value={newStudent.class} onChange={(e) => setNewStudent({...newStudent, class: e.target.value})} required />
                <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all" type="number" placeholder="Fee" value={newStudent.fee} onChange={(e) => setNewStudent({...newStudent, fee: e.target.value})} required />
                <button className="md:col-span-2 bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-indigo-700 shadow-xl transition-all">Confirm Registration</button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;