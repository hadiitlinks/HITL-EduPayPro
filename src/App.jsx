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
      } catch (e) { console.error("Fetch error:", e); }
    };
    fetchStudents();
  }, [activeTab]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      // FIXED LINE BELOW
      await addDoc(collection(db, "students"), {
        ...newStudent,
        fee: parseFloat(newStudent.fee)
      });
      alert("Student Added!");
      setNewStudent({ name: '', rollNo: '', class: '', fee: '' });
      setActiveTab('Dashboard'); // Refresh list
    } catch (error) {
      alert("Error: " + error.message);
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
      <aside className={`${isMenuOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-5 flex justify-between items-center border-b border-slate-800">
          {isMenuOpen && <h1 className="font-bold text-lg text-yellow-400 uppercase">EduPay Pro</h1>}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-slate-700 rounded transition-colors">
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <nav className="flex-1 mt-6">
          {menuItems.map((item) => (
            <button key={item.name} onClick={() => setActiveTab(item.name)} className={`w-full flex items-center p-4 hover:bg-slate-800 ${activeTab === item.name ? 'bg-indigo-600 border-r-4 border-yellow-400' : ''}`}>
              {item.icon}
              {isMenuOpen && <span className="ml-4 font-medium">{item.name}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-700">{activeTab}</h2>
          <span className="text-sm font-semibold text-green-600 uppercase flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
          </span>
        </header>

        <section className="flex-1 overflow-y-auto p-6">
          {activeTab === 'Dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-400 text-sm font-semibold uppercase">Total Students</p>
                <h3 className="text-3xl font-black text-indigo-600">{students.length}</h3>
              </div>
            </div>
          )}

          {activeTab === 'Students' && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Register Student</h3>
              <form onSubmit={handleAddStudent} className="grid grid-cols-2 gap-4">
                <input className="border p-3 rounded-lg" placeholder="Name" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} required />
                <input className="border p-3 rounded-lg" placeholder="Roll No" value={newStudent.rollNo} onChange={(e) => setNewStudent({...newStudent, rollNo: e.target.value})} required />
                <input className="border p-3 rounded-lg" placeholder="Class" value={newStudent.class} onChange={(e) => setNewStudent({...newStudent, class: e.target.value})} required />
                <input className="border p-3 rounded-lg" type="number" placeholder="Monthly Fee" value={newStudent.fee} onChange={(e) => setNewStudent({...newStudent, fee: e.target.value})} required />
                <button className="col-span-2 bg-indigo-600 text-white font-bold p-3 rounded-lg">Save Student</button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;