import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { LayoutDashboard, Users, Receipt, CreditCard, Wallet, Menu, X, PlusCircle } from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', rollNo: '', class: '', fee: '' });

  // 1. Fetch Students from Firebase
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

  // 2. Add Student Logic
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      // Collection reference passed correctly here
      await addDoc(collection(db, "students"), {
        ...newStudent,
        fee: parseFloat(newStudent.fee),
        createdAt: new Date()
      });
      alert("Student Added Successfully!");
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
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar Navigation */}
      <aside className={`${isMenuOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl`}>
        <div className="p-5 flex justify-between items-center border-b border-slate-800">
          {isMenuOpen && <h1 className="font-bold text-lg text-yellow-400 uppercase tracking-widest">EduPay Pro</h1>}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-slate-700 rounded transition-colors">
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <nav className="flex-1 mt-6">
          {menuItems.map((item) => (
            <button key={item.name} onClick={() => setActiveTab(item.name)} className={`w-full flex items-center p-4 hover:bg-slate-800 transition-all ${activeTab === item.name ? 'bg-indigo-600 border-r-4 border-yellow-400 font-bold' : 'opacity-70'}`}>
              {item.icon}
              {isMenuOpen && <span className="ml-4">{item.name}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-700">{activeTab}</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Live Database</span>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'Dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-indigo-500">
                <p className="text-gray-400 text-xs font-bold uppercase">Total Students</p>
                <h3 className="text-3xl font-black text-slate-800">{students.length}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
                <p className="text-gray-400 text-xs font-bold uppercase">Revenue Generated</p>
                <h3 className="text-3xl font-black text-slate-800">Rs. 0</h3>
              </div>
            </div>
          )}

          {activeTab === 'Students' && (
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <PlusCircle className="text-indigo-600" /> New Admission
              </h3>
              <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <input className="border-2 border-slate-100 p-3 rounded-xl focus:border-indigo-500 outline-none transition-all" placeholder="Student Name" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} required />
                <input className="border-2 border-slate-100 p-3 rounded-xl focus:border-indigo-500 outline-none transition-all" placeholder="Roll No" value={newStudent.rollNo} onChange={(e) => setNewStudent({...newStudent, rollNo: e.target.value})} required />
                <input className="border-2 border-slate-100 p-3 rounded-xl focus:border-indigo-500 outline-none transition-all" placeholder="Class" value={newStudent.class} onChange={(e) => setNewStudent({...newStudent, class: e.target.value})} required />
                <input className="border-2 border-slate-100 p-3 rounded-xl focus:border-indigo-500 outline-none transition-all" type="number" placeholder="Monthly Fee" value={newStudent.fee} onChange={(e) => setNewStudent({...newStudent, fee: e.target.value})} required />
                <button className="md:col-span-2 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">Register Student</button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;