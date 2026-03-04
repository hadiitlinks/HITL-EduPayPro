import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { LayoutDashboard, Users, Receipt, PlusCircle, Search, CheckCircle, Printer } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', rollNo: '', class: '', fee: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const sSnap = await getDocs(collection(db, "students"));
      setStudents(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error("Firebase Error:", e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, activeTab]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "students"), { ...newStudent, status: 'Unpaid', createdAt: new Date() });
      alert("Registration Successful!");
      setNewStudent({ name: '', rollNo: '', class: '', fee: '' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleMarkPaid = async (studentId) => {
    try {
      await updateDoc(doc(db, "students", studentId), { status: 'Paid' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  // NEW: Print Receipt Function
  const printVoucher = (student) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Fee Receipt - ${student.rollNo}</title></head>
        <body style="font-family: sans-serif; padding: 40px; border: 2px solid #000;">
          <h1 style="text-align: center;">EDU-PAY PRO RECEIPT</h1>
          <hr/>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Student Name:</strong> ${student.name}</p>
          <p><strong>Roll Number:</strong> ${student.rollNo}</p>
          <p><strong>Class:</strong> ${student.class}</p>
          <h2 style="color: green;">Status: PAID</h2>
          <h3 style="background: #eee; padding: 10px;">Amount Received: Rs. ${student.fee}</h3>
          <br/><br/>
          <p style="text-align: right;">Signature: _________________</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const paidRevenue = students.filter(s => s.status === 'Paid').reduce((sum, s) => sum + Number(s.fee), 0);

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white p-6 shadow-2xl">
        <h1 className="text-2xl font-black text-yellow-400 mb-10 tracking-tight italic">EDU-PAY PRO</h1>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('Dashboard')} className={`w-full flex items-center p-4 rounded-xl transition ${activeTab === 'Dashboard' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={20} className="mr-3"/> Dashboard</button>
          <button onClick={() => setActiveTab('Students')} className={`w-full flex items-center p-4 rounded-xl transition ${activeTab === 'Students' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}><PlusCircle size={20} className="mr-3"/> Registration</button>
          <button onClick={() => setActiveTab('Fees')} className={`w-full flex items-center p-4 rounded-xl transition ${activeTab === 'Fees' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}><Receipt size={20} className="mr-3"/> Fee Collection</button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black text-slate-800 uppercase">{activeTab}</h2>
          <div className="bg-indigo-100 px-4 py-2 rounded-full border border-indigo-200">
             <span className="text-indigo-700 font-bold text-sm">Total Revenue: Rs. {paidRevenue}</span>
          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border-t-8 border-indigo-600 text-center">
              <p className="text-slate-400 font-bold text-xs uppercase mb-2">Total Students</p>
              <h3 className="text-6xl font-black">{students.length}</h3>
            </div>
            <div className="bg-white p-10 rounded-[40px] shadow-sm border-t-8 border-green-500 text-center">
              <p className="text-slate-400 font-bold text-xs uppercase mb-2">Paid Invoices</p>
              <h3 className="text-6xl font-black text-green-600">{students.filter(s => s.status === 'Paid').length}</h3>
            </div>
          </div>
        )}

        {activeTab === 'Students' && (
          <div className="bg-white p-10 rounded-[40px] shadow-2xl border max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-8">Admission Form</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <input className="w-full bg-slate-50 p-5 rounded-2xl border outline-none focus:ring-2 ring-indigo-500" placeholder="Student Full Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-slate-50 p-5 rounded-2xl border outline-none focus:ring-2 ring-indigo-500" placeholder="Roll No" value={newStudent.rollNo} onChange={e => setNewStudent({...newStudent, rollNo: e.target.value})} required />
                <input className="bg-slate-50 p-5 rounded-2xl border outline-none focus:ring-2 ring-indigo-500" placeholder="Class" value={newStudent.class} onChange={e => setNewStudent({...newStudent, class: e.target.value})} required />
              </div>
              <input className="w-full bg-slate-50 p-5 rounded-2xl border outline-none focus:ring-2 ring-indigo-500" type="number" placeholder="Monthly Fee (PKR)" value={newStudent.fee} onChange={e => setNewStudent({...newStudent, fee: e.target.value})} required />
              <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-indigo-600 transition shadow-lg uppercase tracking-wider">Register to Cloud</button>
            </form>
          </div>
        )}

        {activeTab === 'Fees' && (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border">
            <div className="flex gap-4 mb-10">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-4 text-slate-400" size={20} />
                <input className="w-full bg-slate-100 pl-12 p-4 rounded-2xl outline-none border focus:ring-2 ring-indigo-500" placeholder="Quick Search by Roll No..." onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <table className="w-full text-left">
              <thead><tr className="border-b text-slate-400 text-xs font-black uppercase">
                <th className="pb-4">Student</th><th className="pb-4 text-center">Status</th><th className="pb-4 text-right">Actions</th>
              </tr></thead>
              <tbody>
                {students.filter(s => s.rollNo.includes(searchQuery)).map(s => (
                  <tr key={s.id} className="border-b hover:bg-slate-50 transition">
                    <td className="py-5">
                      <p className="font-black text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">Roll: {s.rollNo} | Fee: Rs. {s.fee}</p>
                    </td>
                    <td className="text-center">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${s.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {s.status === 'Paid' ? (
                        <button onClick={() => printVoucher(s)} className="bg-slate-100 text-slate-600 p-3 rounded-xl hover:bg-indigo-600 hover:text-white transition"><Printer size={18}/></button>
                      ) : (
                        <button onClick={() => handleMarkPaid(s.id)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-indigo-200">MARK PAID</button>
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