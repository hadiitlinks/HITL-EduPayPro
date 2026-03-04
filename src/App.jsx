import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { LayoutDashboard, Users, CreditCard, Wallet, Menu, X, PlusCircle } from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [students, setStudents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [pettyCash, setPettyCash] = useState([]);

  const [newStudent, setNewStudent] = useState({ name: '', rollNo: '', class: '', fee: '' });
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'Utility' });
  const [newPetty, setNewPetty] = useState({ item: '', amount: '' });

  // FIXED: useCallback used to wrap the fetch function
  const fetchData = useCallback(async () => {
    try {
      const sSnap = await getDocs(collection(db, "students"));
      setStudents(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const eSnap = await getDocs(query(collection(db, "expenses"), orderBy("createdAt", "desc")));
      setExpenses(eSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const pSnap = await getDocs(query(collection(db, "pettyCash"), orderBy("createdAt", "desc")));
      setPettyCash(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error("Fetch Error:", e); }
  }, []);

  // FIXED: Dependency array updated to prevent infinite loops
  useEffect(() => {
    fetchData();
  }, [fetchData, activeTab]);

  const handleAddData = async (e, collName, data, resetFn) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, collName), { ...data, createdAt: new Date() });
      alert(`${collName} Entry Saved!`);
      resetFn();
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const totalExpenseAmount = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0) + 
                             pettyCash.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className={`${isMenuOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex justify-between items-center border-b border-slate-800">
          {isMenuOpen && <h1 className="font-black text-xl text-yellow-400">EDU-PAY</h1>}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-slate-700 rounded-lg"><Menu size={20} /></button>
        </div>
        <nav className="flex-1 mt-6 px-3">
          {[
            { n: 'Dashboard', i: <LayoutDashboard size={20}/> },
            { n: 'Students', i: <Users size={20}/> },
            { n: 'Expenses', i: <CreditCard size={20}/> },
            { n: 'Petty Cash', i: <Wallet size={20}/> }
          ].map((item) => (
            <button key={item.n} onClick={() => setActiveTab(item.n)} className={`w-full flex items-center p-4 my-1 rounded-xl transition-all ${activeTab === item.n ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}>
              {item.i} {isMenuOpen && <span className="ml-4 font-semibold text-sm">{item.n}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white p-5 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">{activeTab}</h2>
          <div className="flex items-center bg-green-50 px-3 py-1 rounded-full border border-green-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
            <span className="text-[10px] font-black text-green-700 uppercase">Cloud Linked</span>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          {activeTab === 'Dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"><p className="text-slate-400 text-xs font-bold uppercase mb-2">Total Students</p><h3 className="text-4xl font-black text-indigo-600">{students.length}</h3></div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"><p className="text-slate-400 text-xs font-bold uppercase mb-2">Total Expenses</p><h3 className="text-4xl font-black text-red-500">Rs. {totalExpenseAmount}</h3></div>
            </div>
          )}

          {activeTab === 'Students' && (
            <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100 max-w-4xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><PlusCircle className="text-indigo-600" /> Register Student</h3>
              <form onSubmit={(e) => handleAddData(e, "students", newStudent, () => setNewStudent({name:'',rollNo:'',class:'',fee:''}))} className="grid grid-cols-2 gap-4">
                <input className="bg-slate-50 p-4 rounded-xl outline-none" placeholder="Name" value={newStudent.name} onChange={(e)=>setNewStudent({...newStudent, name: e.target.value})} required />
                <input className="bg-slate-50 p-4 rounded-xl outline-none" placeholder="Roll No" value={newStudent.rollNo} onChange={(e)=>setNewStudent({...newStudent, rollNo: e.target.value})} required />
                <input className="bg-slate-50 p-4 rounded-xl outline-none" placeholder="Class" value={newStudent.class} onChange={(e)=>setNewStudent({...newStudent, class: e.target.value})} required />
                <input className="bg-slate-50 p-4 rounded-xl outline-none" type="number" placeholder="Monthly Fee" value={newStudent.fee} onChange={(e)=>setNewStudent({...newStudent, fee: e.target.value})} required />
                <button className="col-span-2 bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-indigo-600 transition-all">Register Now</button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;