import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { 
  UserPlus, Camera, User, Save, Search, CreditCard, X, Download, Settings, 
  FileSpreadsheet, Edit3, Trash2, Layers, ImageIcon,
  School, Users, Tag, CheckSquare, Square, Eye, EyeOff
} from 'lucide-react';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const StudentRegistration = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState('registration');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [listSearch, setListSearch] = useState(''); 
  const [filterClass, setFilterClass] = useState('All');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showID, setShowID] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState([]);

  const [schoolSettings, setSchoolSettings] = useState({
    session: '2025-26',
    schoolLogo: '',
    schoolName: 'PROTOCOL SCHOOL SYSTEM',
    address: 'Your School Address Here',
    phone: '0300-0000000'
  });

  const [formData, setFormData] = useState({
    serialNo: '',
    regNo: '',
    fullName: '',
    fatherName: '',
    gender: 'Male',
    parentPhone: '',
    rollNo: '',
    class: '',
    originalFee: 0,
    discount: 0,
    monthlyFee: 0,
    address: '',
    dob: '',
    photo: '',
    registrationDate: new Date().toISOString().split('T')[0]
  });

  // --- ID Card Studio States ---
  const [cardSize, setCardSize] = useState({ width: 86, height: 54 }); // Standard CR80 Size
  const [cardSample, setCardSample] = useState(null);
  const [visibility, setVisibility] = useState({
    name: true, roll: true, class: true, father: true, address: true, photo: true, logo: true
  });
  const [positions, setPositions] = useState({
    name: { top: 110, left: 20, size: 14, color: '#000000' },
    roll: { top: 140, left: 20, size: 10, color: '#444444' },
    class: { top: 155, left: 20, size: 10, color: '#444444' },
    father: { top: 170, left: 20, size: 10, color: '#444444' },
    address: { top: 185, left: 20, size: 8, color: '#666666' },
    photo: { top: 40, left: 200, size: 70 }
  });
  const cardRef = useRef();

  useEffect(() => {
    fetchSettings();
    fetchData();
  }, []);

  useEffect(() => {
    if (!isEditing) generateAutoNumbers();
  }, [students, schoolSettings.session, isEditing]);

  const fetchData = async () => {
    const qClasses = query(collection(db, "classes"), orderBy("className", "asc"));
    const classSnap = await getDocs(qClasses);
    setClasses(classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const qStudents = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const studentSnap = await getDocs(qStudents);
    setStudents(studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchSettings = async () => {
    const docSnap = await getDoc(doc(db, "settings", "schoolConfig"));
    if (docSnap.exists()) setSchoolSettings(docSnap.data());
  };

  const generateAutoNumbers = () => {
    const serials = students.map(d => parseInt(d.serialNo)).filter(n => !isNaN(n));
    const nextNum = serials.length > 0 ? Math.max(...serials) + 1 : 1;
    setFormData(prev => ({
      ...prev,
      serialNo: nextNum.toString(),
      regNo: `REG-${nextNum.toString().padStart(3, '0')}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        fullName: formData.fullName.toUpperCase(),
        fatherName: formData.fatherName.toUpperCase(),
        schoolName: schoolSettings.schoolName,
        session: schoolSettings.session,
        updatedAt: new Date(),
      };
      if (isEditing && selectedStudent?.id) {
        await updateDoc(doc(db, "students", selectedStudent.id), dataToSave);
      } else {
        await addDoc(collection(db, "students"), { ...dataToSave, createdAt: new Date(), status: 'active' });
      }
      resetForm();
      fetchData();
      alert("Success!");
    } catch (err) { alert("Error saving."); }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      serialNo: '', regNo: '', fullName: '', fatherName: '', gender: 'Male',
      parentPhone: '', rollNo: '', class: '', originalFee: 0, discount: 0,
      monthlyFee: 0, address: '', dob: '', photo: '',
      registrationDate: new Date().toISOString().split('T')[0]
    });
    setIsEditing(false);
    setSelectedStudent(null);
    setSearchTerm('');
  };

  // --- Batch Actions ---
  const toggleSelect = (id) => {
    setSelectedBatch(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const batchDelete = async () => {
    if (!window.confirm(`Delete ${selectedBatch.length} students?`)) return;
    setLoading(true);
    const batch = writeBatch(db);
    selectedBatch.forEach(id => batch.delete(doc(db, "students", id)));
    await batch.commit();
    setSelectedBatch([]);
    fetchData();
    setLoading(false);
  };

  const batchExport = () => {
    const exportData = students.filter(s => selectedBatch.includes(s.id)).map(s => ({
      RegNo: s.regNo, Name: s.fullName, Father: s.fatherName, Class: s.class, Phone: s.parentPhone
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SelectedStudents");
    XLSX.writeFile(wb, "Batch_Export.xlsx");
  };

  const filteredStudents = students.filter(s => {
    const searchLower = listSearch.toLowerCase();
    return (
      (s.fullName?.toLowerCase().includes(searchLower) || s.rollNo?.includes(searchLower)) &&
      (filterClass === 'All' ? true : s.class === filterClass)
    );
  });

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 p-3 md:p-6 font-sans overflow-x-hidden">
      
      {/* 5. School Name Condition & Header */}
      <header className="flex flex-col md:flex-row items-center justify-between bg-slate-900/80 p-4 rounded-3xl border border-white/10 mb-6 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden">
            {schoolSettings.schoolLogo ? <img src={schoolSettings.schoolLogo} className="w-full h-full object-contain" /> : <School size={24}/>}
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black text-white italic tracking-tighter uppercase leading-tight">{schoolSettings.schoolName}</h1>
            <p className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">Session: {schoolSettings.session}</p>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="w-full md:w-auto p-3 bg-slate-800 rounded-xl border border-white/5 flex justify-center"><Settings size={18}/></button>
      </header>

      {/* 4. Tabs Alignment */}
      <nav className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-white/5 mb-6 w-full max-w-md mx-auto overflow-hidden">
        <button onClick={() => setActiveTab('registration')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'registration' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500'}`}>
          <UserPlus size={14}/> REG
        </button>
        <button onClick={() => setActiveTab('students')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500'}`}>
          <Users size={14}/> DATABASE
        </button>
      </nav>

      {activeTab === 'registration' ? (
        /* 7. Card Width Increase */
        <div className="max-w-5xl mx-auto animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-5 md:p-10 shadow-2xl backdrop-blur-md">
            <h2 className="text-xl font-black text-white italic mb-8 uppercase flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-500 rounded-full"></div> {isEditing ? 'Edit Student' : 'Student Enrollment'}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Photo Section */}
              <div className="md:col-span-2 lg:col-span-3 mb-4">
                <div className="relative w-full h-32 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center hover:bg-white/5 transition-all group cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => {
                    const reader = new FileReader();
                    reader.onload = () => setFormData({...formData, photo: reader.result});
                    reader.readAsDataURL(e.target.files[0]);
                  }} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {formData.photo ? <img src={formData.photo} className="h-24 w-24 object-cover rounded-2xl" /> : <Camera className="text-slate-600 group-hover:text-blue-500 transition-colors" />}
                  <p className="text-[9px] font-black uppercase mt-2 text-slate-500">Upload Photo</p>
                </div>
              </div>

              {/* 2. Reg No Field like Serial */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Serial & Reg #</label>
                <div className="flex gap-2">
                  <input value={formData.serialNo} onChange={e => setFormData({...formData, serialNo: e.target.value})} className="w-20 bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold text-xs" placeholder="S#" />
                  <input value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value})} className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold text-xs" placeholder="Registration #" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Full Name</label>
                <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold text-xs uppercase" placeholder="Enter Name" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Father Name</label>
                <input required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold text-xs uppercase" placeholder="Father Name" />
              </div>

              {/* Responsive Inputs */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Class</label>
                <input required value={searchTerm} onFocus={() => setShowDropdown(true)} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold text-xs" placeholder="Search Class" />
                {showDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/10 rounded-xl max-h-40 overflow-auto text-[10px] font-bold">
                    {classes.map(c => <div key={c.id} onClick={() => { setFormData({...formData, class: c.className, originalFee: c.monthlyFee, monthlyFee: c.monthlyFee - formData.discount}); setSearchTerm(c.className); setShowDropdown(false); }} className="p-3 border-b border-white/5 hover:bg-blue-600 hover:text-white cursor-pointer uppercase">{c.className}</div>)}
                  </div>
                )}
              </div>

              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Roll #</label><input value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold text-xs" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Phone</label><input value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white font-bold text-xs" placeholder="03xx-xxxxxxx" /></div>

              {/* 6. Fee Section Refined */}
              <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/20">
                   <label className="text-[10px] font-black text-blue-400 uppercase">Monthly Scholarship (Disc)</label>
                   <div className="flex items-center gap-3">
                     <span className="text-xl font-bold text-white/50">Rs.</span>
                     <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value, monthlyFee: formData.originalFee - e.target.value})} className="bg-transparent border-none text-2xl font-black text-white w-full focus:ring-0" />
                   </div>
                </div>
                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20">
                   <label className="text-[10px] font-black text-emerald-400 uppercase">Net Payable Fee</label>
                   <div className="text-2xl font-black text-white italic">Rs. {formData.monthlyFee}</div>
                </div>
              </div>

              <button disabled={loading} className="md:col-span-2 lg:col-span-3 mt-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black italic tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all">
                {loading ? "PROCESSING..." : <><Save size={16}/> FINALIZE ADMISSION</>}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Student Database Tab */
        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
          {/* 8. Filters Properly Show */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-900/50 p-3 rounded-2xl border border-white/5">
            <div className="md:col-span-7 flex items-center bg-black/40 px-4 py-3 rounded-xl border border-white/10 gap-3">
              <Search size={16} className="text-slate-500"/>
              <input value={listSearch} onChange={e => setListSearch(e.target.value)} className="bg-transparent text-[10px] font-bold text-white outline-none w-full" placeholder="SEARCH STUDENT..." />
            </div>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="md:col-span-5 bg-black/40 text-[10px] font-bold text-white p-3 rounded-xl border border-white/10 uppercase">
              <option value="All">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.className}>{c.className}</option>)}
            </select>
          </div>

          {/* Batch Action Bar */}
          {selectedBatch.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 p-3 rounded-2xl shadow-2xl flex items-center gap-4 z-[100] border border-white/20 animate-bounce-short">
              <span className="text-[10px] font-black text-white px-3">{selectedBatch.length} SELECTED</span>
              <button onClick={batchExport} className="p-2 bg-white/20 rounded-lg text-white"><FileSpreadsheet size={16}/></button>
              <button onClick={batchDelete} className="p-2 bg-red-500 rounded-lg text-white"><Trash2 size={16}/></button>
              <button onClick={() => setSelectedBatch([])} className="p-2 text-white/50"><X size={16}/></button>
            </div>
          )}

          {/* 9. Two Cards in Row Mobile */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredStudents.map(s => (
              <div key={s.id} className={`bg-slate-900 border ${selectedBatch.includes(s.id) ? 'border-blue-500 bg-blue-500/5' : 'border-white/5'} rounded-2xl p-3 relative group transition-all`}>
                {/* 10. Checkbox on card */}
                <button onClick={() => toggleSelect(s.id)} className="absolute top-2 right-2 z-10 text-blue-500 bg-black/50 rounded-md">
                   {selectedBatch.includes(s.id) ? <CheckSquare size={18}/> : <Square size={18} className="text-slate-700 opacity-50"/>}
                </button>
                
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-14 h-14 bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg">
                    {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-slate-800"/>}
                  </div>
                  <div className="w-full overflow-hidden">
                    <h4 className="text-[11px] font-black text-white uppercase italic truncate">{s.fullName}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase truncate">R: {s.rollNo} | {s.class}</p>
                  </div>
                </div>

                <div className="flex justify-between mt-3 pt-2 border-t border-white/5">
                   <button onClick={() => handleEdit(s)} className="p-1.5 text-blue-400"><Edit3 size={14}/></button>
                   <button onClick={() => { setSelectedStudent(s); setShowID(true); }} className="p-1.5 text-emerald-400"><CreditCard size={14}/></button>
                   <button onClick={() => deleteDoc(doc(db, "students", s.id)).then(fetchData)} className="p-1.5 text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. Studio Card Improvements */}
      {showID && selectedStudent && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel */}
          <div className="w-full md:w-80 bg-slate-900 border-r border-white/10 p-5 overflow-y-auto custom-scroll">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-black italic text-xs uppercase tracking-widest">Studio Panel</h3>
              <button onClick={() => setShowID(false)} className="text-red-500"><X/></button>
            </div>

            {/* Size & Background Control */}
            <div className="space-y-4 mb-6">
               <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                 <label className="text-[9px] font-black text-slate-500 uppercase">Card Dimensions (mm)</label>
                 <div className="flex gap-2 mt-2">
                    <input type="number" value={cardSize.width} onChange={e => setCardSize({...cardSize, width: e.target.value})} className="w-full bg-slate-800 p-2 rounded text-[10px] text-white" />
                    <input type="number" value={cardSize.height} onChange={e => setCardSize({...cardSize, height: e.target.value})} className="w-full bg-slate-800 p-2 rounded text-[10px] text-white" />
                 </div>
               </div>
               <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                 <label className="text-[9px] font-black text-slate-500 uppercase">Sample Background</label>
                 <label className="mt-2 flex items-center gap-2 p-2 bg-slate-800 rounded-lg cursor-pointer text-[10px] font-bold">
                   <ImageIcon size={14}/> {cardSample ? "Change" : "Import"}
                   <input type="file" hidden accept="image/*" onChange={e => {
                     const reader = new FileReader();
                     reader.onload = () => setCardSample(reader.result);
                     reader.readAsDataURL(e.target.files[0]);
                   }} />
                 </label>
               </div>
            </div>

            {/* Field Controls with Visibility */}
            {['name', 'roll', 'class', 'father', 'address', 'photo'].map(field => (
              <div key={field} className="mb-3 p-3 bg-black/20 rounded-xl border border-white/5 space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-blue-400 uppercase italic">{field}</span>
                   <button onClick={() => setVisibility({...visibility, [field]: !visibility[field]})} className="text-slate-500">
                     {visibility[field] ? <Eye size={14}/> : <EyeOff size={14}/>}
                   </button>
                 </div>
                 {visibility[field] && (
                   <div className="grid grid-cols-3 gap-1">
                      <input type="number" value={positions[field].top} onChange={e => setPositions({...positions, [field]: {...positions[field], top: parseInt(e.target.value)}})} className="bg-slate-800 p-1.5 rounded text-[10px] text-white" title="Top" />
                      <input type="number" value={positions[field].left} onChange={e => setPositions({...positions, [field]: {...positions[field], left: parseInt(e.target.value)}})} className="bg-slate-800 p-1.5 rounded text-[10px] text-white" title="Left" />
                      <input type="number" value={positions[field].size} onChange={e => setPositions({...positions, [field]: {...positions[field], size: parseInt(e.target.value)}})} className="bg-slate-800 p-1.5 rounded text-[10px] text-white" title="Size" />
                   </div>
                 )}
              </div>
            ))}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div ref={cardRef} style={{ width: `${cardSize.width}mm`, height: `${cardSize.height}mm`, position: 'relative', overflow: 'hidden', backgroundColor: '#fff' }} className="shadow-2xl">
               {cardSample && <img src={cardSample} className="absolute inset-0 w-full h-full object-fill z-0" />}
               <div className="relative z-10 w-full h-full font-sans">
                  {visibility.photo && (
                    <div style={{ position: 'absolute', top: positions.photo.top, left: positions.photo.left, width: positions.photo.size, height: positions.photo.size }} className="border border-black/10 overflow-hidden">
                      {selectedStudent.photo ? <img src={selectedStudent.photo} className="w-full h-full object-cover" /> : <div className="bg-slate-100 w-full h-full"/>}
                    </div>
                  )}
                  {visibility.name && <div style={{ position: 'absolute', top: positions.name.top, left: positions.name.left, fontSize: positions.name.size, color: positions.name.color }} className="font-black uppercase">{selectedStudent.fullName}</div>}
                  {visibility.roll && <div style={{ position: 'absolute', top: positions.roll.top, left: positions.roll.left, fontSize: positions.roll.size, color: positions.roll.color }} className="font-bold">Roll: {selectedStudent.rollNo}</div>}
                  {visibility.class && <div style={{ position: 'absolute', top: positions.class.top, left: positions.class.left, fontSize: positions.class.size, color: positions.class.color }} className="font-bold">Class: {selectedStudent.class}</div>}
                  {visibility.father && <div style={{ position: 'absolute', top: positions.father.top, left: positions.father.left, fontSize: positions.father.size, color: positions.father.color }} className="font-bold">Father: {selectedStudent.fatherName}</div>}
               </div>
            </div>
            <button onClick={async () => {
              const canvas = await html2canvas(cardRef.current, { scale: 4 });
              const link = document.createElement('a');
              link.download = `${selectedStudent.fullName}_Card.png`;
              link.href = canvas.toDataURL();
              link.click();
            }} className="mt-8 px-8 py-4 bg-blue-600 rounded-2xl text-[10px] font-black italic tracking-widest text-white flex items-center gap-3">
              <Download size={18}/> EXPORT HIGH-RES CARD
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal (Simplified for Mobile) */}
      {showSettings && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 border border-white/10 space-y-4">
             <div className="flex justify-between border-b border-white/5 pb-3">
               <h3 className="font-black text-xs italic">SYSTEM SETTINGS</h3>
               <button onClick={() => setShowSettings(false)}><X size={18}/></button>
             </div>
             <input value={schoolSettings.schoolName} onChange={e => setSchoolSettings({...schoolSettings, schoolName: e.target.value.toUpperCase()})} className="w-full bg-black/40 p-3 rounded-xl text-xs border border-white/10" placeholder="School Name" />
             <input value={schoolSettings.session} onChange={e => setSchoolSettings({...schoolSettings, session: e.target.value})} className="w-full bg-black/40 p-3 rounded-xl text-xs border border-white/10" placeholder="Session" />
             <button onClick={async () => { await setDoc(doc(db, "settings", "schoolConfig"), schoolSettings); setShowSettings(false); }} className="w-full py-4 bg-blue-600 rounded-xl text-[10px] font-black italic">UPDATE SETTINGS</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        @keyframes bounce-short {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -5px); }
        }
        .animate-bounce-short { animation: bounce-short 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default StudentRegistration;