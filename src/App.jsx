import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { LayoutDashboard, Users, Receipt, CreditCard, Wallet, Menu, X, PlusCircle } from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', rollNo: '', class: '', fee: '' });

  // 1. Firebase se data fetch karna
  useEffect(() => {
    const fetchStudents = async () => {
      const q = query(collection(db, "students"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    };
    fetchStudents();
  }, [activeTab]);

  // 2. Naya Student Add karna
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "students"), newStudent);
      alert("Student Added Successfully!");
      setNewStudent({ name: '', rollNo: '', class: '', fee: '' });
      setActiveTab('Students');
    } catch (error) {
      console.error("Error adding student: ", error);
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
      {/* Sidebar */}
      <aside className={`${isMenuOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-5 flex justify-between items-center border-b border-slate-800">
          {isMenuOpen && <h1 className="font-bold text-lg tracking-wider text-yellow-400">EDU-PAY PRO</h1>}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 hover:bg-slate-700 rounded transition-colors">
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        
        <nav className="flex-1 mt-6">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center p-4 hover:bg-slate-800 transition-all ${activeTab === item.name ? 'bg-indigo-600 border-r-4 border-yellow-400' : ''}`}
            >
              {item.icon}
              {isMenuOpen && <span className="ml-4 font-medium">{item.name}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-700">{activeTab}</h2>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-slate-500 uppercase">Live Database</span>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6">
          {activeTab === 'Dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <p className="text-gray-400 text-sm font-semibold uppercase">Total Students</p>
                <h3 className="text-3xl font-black text-indigo-600">{students.length}</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <p className="text-gray-400 text-sm font-semibold uppercase">Monthly Revenue</p>
                <h3 className="text-3xl font-black text-green-600">Rs. 0</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <p className="text-gray-400 text-sm font-semibold uppercase">Pending Fees</p>
                <h3 className="text-3xl font-black text-red-500">Rs. 0</h3>
              </div>
            </div>
          )}

          {activeTab === 'Students' && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PlusCircle className="text-indigo-600" /> Register New Student
              </h3>
              <form onSubmit={handleAddStudent} className="grid grid-cols-2 gap-4 mb-8">
                <input className="border p-3 rounded-lg outline-indigo-500" placeholder="Student Name" value={newStudent.name} onChange={(e) => setNewStudent({...newStudent, name: e.target.value})} required />
                <input className="border p-3 rounded-lg outline-indigo-500" placeholder="Roll No" value={newStudent.rollNo} onChange={(e) => setNewStudent({...newStudent, rollNo: e.target.value})} required />
                <input className="border p-3 rounded-lg outline-indigo-500" placeholder="Class" value={newStudent.class} onChange={(e) => setNewStudent({...newStudent, class: e.target.value})} required />
                <input className="border p-3 rounded-lg outline-indigo-500" type="number" placeholder="Monthly Fee" value={newStudent.fee} onChange={(e) => setNewStudent({...newStudent, fee: e.target.value})} required />
                <button className="col-span-2 bg-indigo-600 text-white font-bold p-3 rounded-lg hover:bg-indigo-700">Save Student</button>
              </form>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-3">Roll No</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold text-indigo-600">{s.rollNo}</td>
                      <td className="p-3 font-medium">{s.name}</td>
                      <td className="p-3">{s.class}</td>
                      <td className="p-3">Rs. {s.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Other tabs placeholder */}
          {['Fee Collection', 'Expenses', 'Petty Cash'].includes(activeTab) && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
              <p className="text-gray-400 font-medium italic">Developing {activeTab} Logic with Firebase Firestore...</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;