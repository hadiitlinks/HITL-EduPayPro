import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { 
  LayoutDashboard, Users, Receipt, PlusCircle, Search, 
  Printer, Wallet, Camera, ShieldCheck, X, CreditCard, 
  TrendingUp, History, FileText, CheckCircle2, IndianRupee 
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // States
  const [newClass, setNewClass] = useState({ name: '', monthlyFee: '' });
  const [newStudent, setNewStudent] = useState({ 
    picture: '', name: '', fName: '', rollNo: '', regNo: '', contact: '', className: '', monthlyFee: 0 
  });
  const [feeForm, setFeeForm] = useState({ 
    paid: 0, examFee: 0, fine: 0, svt: 0, arrears: 0, month: new Date().toLocaleString('default', { month: 'long' }) 
  });

  const fetchData = useCallback(async () => {
    try {
      const cSnap = await getDocs(collection(db, "classes"));
      setClasses(cSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const sSnap = await getDocs(query(collection(db, "students"), orderBy("createdAt", "desc")));
      setStudents(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, activeTab]);

  const handleRegister = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "students"), { 
      ...newStudent, 
      remainingBalance: 0, 
      status: 'Unpaid', 
      createdAt: new Date() 
    });
    alert("Admission Confirmed!");
    setNewStudent({ picture: '', name: '', fName: '', rollNo: '', regNo: '', contact: '', className: '', monthlyFee: 0 });
    fetchData();
  };

  const handleCollectFee = async () => {
    const totalDue = Number(selectedStudent.monthlyFee) + Number(feeForm.examFee) + 
                     Number(feeForm.fine) + Number(feeForm.svt) + Number(feeForm.arrears);
    const remaining = totalDue - Number(feeForm.paid);
    
    // Save to History Collection
    await addDoc(collection(db, "feeHistory"), {
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      ...feeForm,
      totalDue,
      remaining,
      date: new Date()
    });

    // Update Student Main Record
    await updateDoc(doc(db, "students", selectedStudent.id), {
      remainingBalance: remaining,
      status: remaining <= 0 ? 'Paid' : 'Partial'
    });
    
    alert("Transaction Successful!");
    printVoucher(selectedStudent, feeForm, totalDue, remaining);
    setSelectedStudent(null);
    fetchData();
  };

  const printVoucher = (student, form, total, bal) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><style>
          body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; }
          .voucher { border: 3px double #000; padding: 20px; max-width: 500px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px; }
          .row { display: flex; justify-content: space-between; margin: 10px 0; border-bottom: 1px dashed #ccc; }
          .total-box { background: #f4f4f4; padding: 10px; margin-top: 20px; border-radius: 8px; }
          .footer { font-size: 10px; text-align: center; margin-top: 20px; color: #777; }
        </style></head>
        <body>
          <div class="voucher">
            <div class="header">
              <h1 style="margin:0">EDU-PAY PRO</h1>
              <p style="margin:0; font-size:12px">Official Fee Receipt</p>
            </div>
            <div class="row"><span>Roll No:</span> <strong>${student.rollNo}</strong></div>
            <div class="row"><span>Name:</span> <strong>${student.name}</strong></div>
            <div class="row"><span>Class:</span> <strong>${student.className}</strong></div>
            <div class="row"><span>Fee Month:</span> <strong>${form.month}</strong></div>
            <div style="margin-top:20px">
              <div class="row"><span>Tuition Fee:</span> <span>${student.monthlyFee}</span></div>
              <div class="row"><span>Exam/Fine:</span> <span>${Number(form.examFee) + Number(form.fine)}</span></div>
              <div class="row"><span>SVT/Arrears:</span> <span>${Number(form.svt) + Number(form.arrears)}</span></div>
            </div>
            <div class="total-box">
              <div class="row"><strong>Grand Total:</strong> <strong>Rs. ${total}</strong></div>
              <div class="row" style="color:green"><strong>Paid Amount:</strong> <strong>Rs. ${form.paid}</strong></div>
              <div class="row" style="color:red"><strong>Remaining Bal:</strong> <strong>Rs. ${bal}</strong></div>
            </div>
            <div class="footer italic">Issued on: ${new Date().toLocaleString()}<br/>Software Generated Receipt - No Signature Required</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex h-screen bg-[#F0F2F5] font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#1C1F2E] text-white p-8 flex flex-col shadow-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent italic">EDU-PAY</h1>
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-[3px]">Enterprise Edition</p>
        </div>
        <nav className="space-y-2 flex-1">
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={18}/>, label: 'Control Center' },
            { id: 'Classes', icon: <ShieldCheck size={18}/>, label: 'Manage Grades' },
            { id: 'Students', icon: <Users size={18}/>, label: 'New Admission' },
            { id: 'Fees', icon: <Receipt size={18}/>, label: 'Fee Invoicing' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>
              {item.icon} <span className="ml-4 font-bold text-sm uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-12">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{activeTab}</h2>
          <div className="flex gap-4">
             <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                <span className="text-xs font-black text-slate-600 uppercase">Server Online</span>
             </div>
          </div>
        </header>

        {activeTab === 'Dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[40px] text-white shadow-xl">
               <p className="text-blue-100 font-bold text-[10px] uppercase">Students</p>
               <h3 className="text-5xl font-black mt-2">{students.length}</h3>
            </div>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
               <p className="text-slate-400 font-bold text-[10px] uppercase">Recoverables</p>
               <h3 className="text-4xl font-black text-red-500 mt-2">Rs. {students.reduce((a, s) => a + (s.remainingBalance || 0), 0)}</h3>
            </div>
          </div>
        )}

        {/* --- ADMISSION FORM --- */}
        {activeTab === 'Students' && (
          <div className="bg-white p-12 rounded-[50px] shadow-2xl max-w-4xl mx-auto border-t-8 border-blue-600">
             <div className="mb-10 border-b pb-6 flex justify-between">
                <h3 className="text-2xl font-black uppercase text-slate-700">Admission Registration</h3>
                <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase italic">Academic Year 2026</span>
             </div>
             <form onSubmit={handleRegister} className="grid grid-cols-2 gap-8">
                <div className="col-span-2 flex gap-4 bg-slate-50 p-6 rounded-3xl border-2 border-dashed">
                   <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-slate-300 border shadow-sm"><Camera/></div>
                   <input className="flex-1 bg-transparent outline-none font-bold" placeholder="Paste Student Image URL (Compulsory)*" value={newStudent.picture} onChange={e => setNewStudent({...newStudent, picture: e.target.value})} required />
                </div>
                <input className="bg-slate-50 p-5 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold" placeholder="Student Full Name *" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
                <input className="bg-slate-50 p-5 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold" placeholder="Father's Name *" value={newStudent.fName} onChange={e => setNewStudent({...newStudent, fName: e.target.value})} required />
                <input className="bg-slate-50 p-5 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold" placeholder="Roll Number *" value={newStudent.rollNo} onChange={e => setNewStudent({...newStudent, rollNo: e.target.value})} required />
                <input className="bg-slate-50 p-5 rounded-2xl border-none outline-none focus:ring-4 ring-blue-500/10 font-bold" placeholder="Contact Details *" value={newStudent.contact} onChange={e => setNewStudent({...newStudent, contact: e.target.value})} required />
                <select className="bg-slate-50 p-5 rounded-2xl border-none font-bold" onChange={e => {
                   const c = classes.find(x => x.name === e.target.value);
                   setNewStudent({...newStudent, className: e.target.value, monthlyFee: c?.monthlyFee || 0});
                }} required>
                  <option value="">Select Grade Level *</option>
                  {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <div className="bg-blue-50 p-5 rounded-2xl flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Monthly Fee</span>
                   <span className="text-xl font-black text-blue-700">Rs. {newStudent.monthlyFee}</span>
                </div>
                <button className="col-span-2 bg-[#1C1F2E] text-white py-6 rounded-3xl font-black shadow-xl hover:bg-blue-600 transition-all uppercase tracking-[4px]">Submit Admission</button>
             </form>
          </div>
        )}

        {/* --- FEE COLLECTION LIST --- */}
        {activeTab === 'Fees' && (
          <div className="bg-white p-10 rounded-[50px] shadow-sm border">
            <div className="flex gap-4 mb-10">
               <div className="flex-1 relative">
                  <Search className="absolute left-6 top-5 text-slate-300"/>
                  <input className="w-full bg-slate-50 pl-16 p-5 rounded-3xl outline-none font-bold border-none" placeholder="Search by student name or roll..." onChange={e => setSearchQuery(e.target.value)} />
               </div>
            </div>
            <table className="w-full text-left">
               <thead className="text-[10px] font-black uppercase text-slate-400 border-b">
                 <tr><th className="pb-6">Student Bio</th><th>Grade</th><th>Balance Sheet</th><th className="text-right pb-6">Actions</th></tr>
               </thead>
               <tbody className="divide-y">
                 {students.filter(s => s.rollNo.includes(searchQuery) || s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                   <tr key={s.id} className="hover:bg-slate-50 transition group">
                     <td className="py-6 flex items-center gap-4">
                        <img src={s.picture} className="w-14 h-14 rounded-2xl object-cover shadow-sm border-2 border-white" alt="student"/>
                        <div>
                           <p className="font-black text-slate-800 leading-tight">{s.name}</p>
                           <p className="text-[10px] text-slate-400 uppercase font-bold">Roll: {s.rollNo}</p>
                        </div>
                     </td>
                     <td><span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-600 uppercase">{s.className}</span></td>
                     <td>
                        <p className="text-xs font-black text-slate-700">M. Fee: {s.monthlyFee}</p>
                        <p className={`text-[10px] font-black uppercase ${s.remainingBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>Balance: Rs. {s.remainingBalance || 0}</p>
                     </td>
                     <td className="text-right">
                        <button onClick={() => setSelectedStudent(s)} className="bg-[#1C1F2E] text-white px-6 py-3 rounded-2xl text-[10px] font-black hover:bg-blue-600 shadow-md">COLLECT</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        )}

        {/* --- INVOICE MODAL --- */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-2xl rounded-[50px] p-12 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button onClick={() => setSelectedStudent(null)} className="absolute top-10 right-10 text-slate-300 hover:text-red-500"><X/></button>
                <div className="flex gap-6 mb-10 pb-10 border-b">
                   <img src={selectedStudent.picture} className="w-20 h-20 rounded-3xl shadow-lg border-4 border-slate-50" alt="student"/>
                   <div>
                      <h4 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{selectedStudent.name}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase">Roll: {selectedStudent.rollNo} • Father: {selectedStudent.fName}</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-slate-50 p-5 rounded-3xl">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Standard Monthly Fee</p>
                      <p className="text-xl font-black text-slate-800">Rs. {selectedStudent.monthlyFee}</p>
                   </div>
                   <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
                      <p className="text-[10px] font-black uppercase text-blue-500 mb-1">Amount Paid (Deposit) *</p>
                      <input type="number" className="bg-transparent text-xl font-black text-blue-800 outline-none w-full" placeholder="0" onChange={e => setFeeForm({...feeForm, paid: e.target.value})} autoFocus />
                   </div>
                   <div className="grid grid-cols-2 gap-4 col-span-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Exam Fee</label>
                        <input className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none font-bold" placeholder="0" onChange={e => setFeeForm({...feeForm, examFee: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Fine</label>
                        <input className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none font-bold" placeholder="0" onChange={e => setFeeForm({...feeForm, fine: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">SVT</label>
                        <input className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none font-bold" placeholder="0" onChange={e => setFeeForm({...feeForm, svt: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-red-400 uppercase ml-2 font-black italic underline">Prev Arrears (Manual)</label>
                        <input className="w-full bg-red-50 p-4 rounded-2xl border-none outline-none font-bold text-red-600" placeholder="0" onChange={e => setFeeForm({...feeForm, arrears: e.target.value})} />
                      </div>
                   </div>
                   <button onClick={handleCollectFee} className="col-span-2 bg-blue-600 text-white py-6 rounded-3xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest uppercase">
                     <CheckCircle2 size={22}/> Process Payment & Print
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* CLASSES */}
        {activeTab === 'Classes' && (
          <div className="bg-white p-12 rounded-[50px] shadow-sm border max-w-4xl mx-auto">
             <h3 className="text-2xl font-black text-slate-800 mb-8 uppercase italic">Class Fee Definition</h3>
             <div className="flex gap-4">
                <input className="flex-1 bg-slate-50 p-5 rounded-3xl border-none font-bold" placeholder="Class Level (e.g. Nursery)" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} />
                <input className="flex-1 bg-slate-50 p-5 rounded-3xl border-none font-bold" type="number" placeholder="Attached Monthly Fee" value={newClass.monthlyFee} onChange={e => setNewClass({...newClass, monthlyFee: e.target.value})} />
                <button onClick={() => {
                   if(newClass.name && newClass.monthlyFee) {
                      addDoc(collection(db, "classes"), newClass);
                      setNewClass({name:'', monthlyFee:''});
                      fetchData();
                   }
                }} className="bg-blue-600 text-white px-10 rounded-3xl font-black hover:bg-blue-700">DEFINE</button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;