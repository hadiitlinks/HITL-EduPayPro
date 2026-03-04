import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { LayoutDashboard, Users, Receipt, PlusCircle, Search, CheckCircle } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', rollNo: '', class: '', fee: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Data from Firebase
  const fetchData = useCallback(async () => {
    try {
      const sSnap = await getDocs(collection(db, "students"));
      setStudents(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error("Firebase Fetch Error:", e); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, activeTab]);

  // 2. Register New Student
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "students"), {
        ...newStudent,
        status: 'Unpaid',
        createdAt: new Date()
      });
      alert("Student Registered!");
      setNewStudent({ name: '', rollNo: '', class: '', fee: '' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  // 3. NEW: Update Fee Status in Firebase
  const handleMarkPaid = async (studentId) => {
    try {
      const studentRef = doc(db, "students", studentId);
      await updateDoc(studentRef, { status: 'Paid' });
      fetchData(); // Refresh list
    } catch (err) { alert("Update failed: " + err.message); }
  };

  // 4. Calculations for Dashboard
  const paidCount = students.filter(s => s.status === 'Paid').length;
  const totalRevenue = students.filter(s => s.status === 'Paid').reduce((sum, s) => sum + Number(s.fee), 0);

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <h1 className="text-xl font-black text-yellow-500 mb-10 italic">EDU-PAY PRO</h1>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('Dashboard')} className={`w-full text-left p-4 rounded-xl flex gap-3 ${activeTab === 'Dashboard' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}><LayoutDashboard size={20}/> Dashboard</button>
          <button onClick={() => setActiveTab('Students')} className={`w-full text-left p-4 rounded-xl flex gap-3 ${activeTab === 'Students' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}><PlusCircle size={20}/> Registration</button>
          <button onClick={() => setActiveTab('Fees')} className={`w-full text-left p-4 rounded-xl flex gap-3 ${activeTab === 'Fees' ? 'bg-indigo-600' : 'hover:bg-slate-800'}`}><Receipt size={20}/> Fee Collection</button>
        </nav>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border-b-4 border-indigo-500">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Students</p>
              <h3 className="text-4xl font-black">{students.length}</h3>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border-b-4 border-green-500">
              <p className="text-xs font-bold text-slate-400 uppercase">Paid Students</p>
              <h3 className="text-4xl font-black text-green-600">{paidCount}</h3>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border-b-4 border-yellow-500">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Revenue</p>
              <h3 className="text-4xl font-black text-indigo-600">Rs. {totalRevenue}</h3>
            </div>
          </div>
        )}

        {activeTab === 'Students' && (
          <div className="bg-white p-8 rounded-3xl shadow-lg max-w-xl border">
            <h3 className="text-xl font-bold mb-6">Register Student</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <input className="w-full bg-slate-50 p-4 rounded-xl border outline-none" placeholder="Student Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
              <input className="w-full bg-slate-50 p-4 rounded-xl border outline-none" placeholder="Roll No" value={newStudent.rollNo} onChange={e => setNewStudent({...newStudent, rollNo: e.target.value})} required />
              <input className="w-full bg-slate-50 p-4 rounded-xl border outline-none" type="number" placeholder="Monthly Fee" value={newStudent.fee} onChange={e => setNewStudent({...newStudent, fee: e.target.value})} required />
              <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-indigo-600">Save Student</button>
            </form>
          </div>
        )}

        {activeTab === 'Fees' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border">
            <div className="flex items-center bg-slate-100 p-4 rounded-2xl mb-8">
              <Search className="text-slate-400 mr-3" size={20}/>
              <input className="bg-transparent w-full outline-none font-medium" placeholder="Search by Roll No..." onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <table className="w-full text-left">
              <thead><tr className="text-slate-400 text-xs font-bold uppercase border-b">
                <th className="pb-4">Name</th><th className="pb-4">Roll No</th><th className="pb-4">Fee</th><th className="pb-4 text-right">Action</th>
              </tr></thead>
              <tbody>
                {students.filter(s => s.rollNo.includes(searchQuery)).map(s => (
                  <tr key={s.id} className="border-b">
                    <td className="py-4 font-bold">{s.name}</td>
                    <td>{s.rollNo}</td>
                    <td className="font-bold text-indigo-600">Rs. {s.fee}</td>
                    <td className="text-right">
                      {s.status === 'Paid' ? (
                        <span className="text-green-600 font-bold flex items-center justify-end gap-1"><CheckCircle size={16}/> Paid</span>
                      ) : (
                        <button onClick={() => handleMarkPaid(s.id)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-xs font-black hover:bg-indigo-600 hover:text-white transition">Mark Paid</button>
                      )}
                    </td>
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