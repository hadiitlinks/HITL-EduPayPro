import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { 
  UserPlus, Camera, User, Save, Search, CreditCard, X, Download, Settings, 
  FileSpreadsheet, Edit3, Trash2, Layers, ImageIcon, Type, Filter, MapPin,
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

  // --- GLOBAL SETTINGS (Restored) ---
  const [schoolSettings, setSchoolSettings] = useState({
    session: '2025-26',
    schoolLogo: '',
    schoolName: 'PROTOCOL SCHOOL SYSTEM',
    address: 'Your School Address Here',
    phone: '0300-0000000'
  });

  // --- Form Data (Restored All Fields) ---
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

  // --- ID Card Studio States (Enhanced) ---
  const [cardSize, setCardSize] = useState({ width: 86, height: 54 }); 
  const [cardSample, setCardSample] = useState(null);
  const [visibility, setVisibility] = useState({
    name: true, roll: true, class: true, father: true, address: true, photo: true, schoolName: true, logo: true
  });
  const [positions, setPositions] = useState({
    name: { top: 110, left: 140, size: 18, color: '#000000' },
    roll: { top: 150, left: 140, size: 12, color: '#444444' },
    class: { top: 170, left: 140, size: 12, color: '#444444' },
    father: { top: 190, left: 140, size: 12, color: '#444444' },
    address: { top: 210, left: 140, size: 10, color: '#666666' },
    photo: { top: 60, left: 30, size: 90 }
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
      regNo: `REG-${schoolSettings.session}-${nextNum.toString().padStart(3, '0')}`
    }));
  };

  const handlePhotoChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'student') setFormData({ ...formData, photo: reader.result });
        if (type === 'logo') setSchoolSettings({ ...schoolSettings, schoolLogo: reader.result });
        if (type === 'cardBg') setCardSample(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClassSelect = (selectedClass) => {
    const fee = parseFloat(selectedClass.monthlyFee) || 0;
    setFormData({ 
      ...formData, 
      class: selectedClass.className, 
      originalFee: fee,
      monthlyFee: fee - (formData.discount || 0)
    });
    setSearchTerm(selectedClass.className);
    setShowDropdown(false);
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

  // --- Batch Actions Logic ---
  const toggleSelect = (id) => {
    setSelectedBatch(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const batchDelete = async () => {
    if (!window.confirm(`Delete ${selectedBatch.length} students permanently?`)) return;
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
      "Reg #": s.regNo, "Name": s.fullName, "Father": s.fatherName, "Class": s.class, "Roll": s.rollNo, "Phone": s.parentPhone
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Batch_Export.xlsx");
  };

  const filteredStudents = students.filter(s => {
    const searchLower = listSearch.toLowerCase();
    return (
      ((s.fullName || "").toLowerCase().includes(searchLower) || (s.rollNo || "").includes(searchLower)) &&
      (filterClass === 'All' ? true : s.class === filterClass)
    );
  });

  const updatePos = (field, key, value) => {
    setPositions(prev => ({
      ...prev,
      [field]: { ...prev[field], [key]: key === 'color' ? value : parseInt(value) }
    }));
  };

  return (
    <div className="p-3 md:p-8 space-y-6 bg-[#020617] min-h-screen text-slate-300 font-sans overflow-x-hidden">
      
      {/* 5. School Name Condition & Header */}
      <header className="flex flex-col md:flex-row items-center justify-between bg-slate-900/60 p-5 rounded-[2rem] border border-white/10 gap-4 shadow-xl">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 p-2 overflow-hidden shadow-inner">
            {schoolSettings.schoolLogo ? <img src={schoolSettings.schoolLogo} className="w-full h-full object-contain" /> : <School size={28} className="text-slate-700"/>}
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{schoolSettings.schoolName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-black tracking-widest uppercase">SESSION: {schoolSettings.session}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="w-full md:w-auto p-4 bg-slate-800/80 rounded-2xl border border-white/5 hover:bg-slate-700 transition-all">
          <Settings size={20}/>
        </button>
      </header>

      {/* 4. Tabs Alignment */}
      <nav className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-white/5 max-w-md mx-auto shadow-2xl overflow-hidden">
        <button onClick={() => setActiveTab('registration')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'registration' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
          <UserPlus size={14}/> ADMISSION
        </button>
        <button onClick={() => setActiveTab('students')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
          <Users size={14}/> DATABASE
        </button>
      </nav>

      {activeTab === 'registration' ? (
        /* 7. Card Width Increase */
        <div className="max-w-5xl mx-auto animate-in fade-in zoom-in duration-300">
           <div className="bg-slate-900/40 border border-white/5 p-5 md:p-12 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
              <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div> {isEditing ? "Modify Enrollment" : "New Registration"}
                </h2>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => {}} className="flex-1 md:flex-none text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-3 rounded-xl uppercase tracking-widest"><FileSpreadsheet size={14} className="inline mr-2"/> Template</button>
                  <label className="flex-1 md:flex-none text-[9px] font-black bg-slate-800 text-slate-300 px-4 py-3 rounded-xl cursor-pointer text-center uppercase tracking-widest"><Download size={14} className="inline mr-2"/> Import<input type="file" hidden/></label>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Photo Upload */}
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="relative border-2 border-dashed border-white/10 rounded-[2rem] p-6 md:p-10 text-center hover:bg-white/5 transition-all group cursor-pointer">
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoChange(e, 'student')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {formData.photo ? <img src={formData.photo} className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-3xl object-cover shadow-2xl border-4 border-slate-800" /> : <div className="flex flex-col items-center"><Camera size={32} className="text-slate-700 mb-2"/><p className="text-[10px] font-black text-slate-500 uppercase">Upload Student Photo</p></div>}
                  </div>
                </div>

                {/* 2. Reg No Field restored like Serial */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase ml-1">Serial & Registration #</label>
                  <div className="flex gap-2">
                    <input value={formData.serialNo} onChange={e => setFormData({...formData, serialNo: e.target.value})} className="w-20 bg-slate-950 p-3.5 rounded-xl border border-white/10 text-white font-bold text-xs" />
                    <input value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value})} className="flex-1 bg-slate-950 p-3.5 rounded-xl border border-white/10 text-slate-400 font-bold text-xs italic" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-blue-400 font-black uppercase ml-1">Student Full Name *</label>
                  <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-950 p-3.5 rounded-xl border border-white/10 text-white font-bold text-xs uppercase" placeholder="ENTER NAME" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase ml-1">Father's Name *</label>
                  <input required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full bg-slate-950 p-3.5 rounded-xl border border-white/10 text-white font-bold text-xs uppercase" placeholder="FATHER NAME" />
                </div>

                <div className="space-y-1 relative">
                  <label className="text-[10px] text-blue-400 font-black uppercase ml-1">Class Assignment *</label>
                  <input required value={searchTerm} onFocus={() => setShowDropdown(true)} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-950 p-3.5 rounded-xl border border-white/10 text-white font-bold text-xs uppercase" placeholder="SEARCH CLASS..." />
                  {showDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-xl max-h-48 overflow-auto shadow-2xl">
                      {classes.map(c => <div key={c.id} onClick={() => handleClassSelect(c)} className="p-3 text-[10px] font-black uppercase text-white hover:bg-blue-600 cursor-pointer border-b border-white/5">{c.className}</div>)}
                    </div>
                  )}
                </div>

                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">Roll #</label><input value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} className="w-full bg-slate-950 p-3.5 rounded-xl border border-white/10 text-white font-bold text-xs" /></div>
                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">Parent Phone</label><input value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full bg-slate-950 p-3.5 rounded-xl border border-white/10 text-white font-bold text-xs" placeholder="03XX-XXXXXXX" /></div>

                <div className="lg:col-span-2 space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">Residential Address</label><input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-950 p-3.5 rounded-xl border border-white/10 text-white font-bold text-xs" /></div>
                <div className="space-y-1"><label className="text-[10px] text-slate-500 font-black uppercase ml-1">Date of Birth</label><input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-slate-950 p-3.5 rounded-xl border border-white/10 text-white font-bold text-xs" /></div>

                {/* 6. Fee Section Restoration & Formatting */}
                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-blue-500/5 p-5 rounded-[2rem] border border-blue-500/10">
                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Monthly Scholarship/Discount</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl font-black text-slate-600">Rs.</span>
                      <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value, monthlyFee: formData.originalFee - e.target.value})} className="bg-transparent text-2xl font-black text-white outline-none w-full" />
                    </div>
                  </div>
                  <div className="bg-emerald-500/5 p-5 rounded-[2rem] border border-emerald-500/10">
                    <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Net Payable Monthly Fee</label>
                    <div className="text-2xl font-black text-white italic mt-1">Rs. {formData.monthlyFee}</div>
                  </div>
                </div>

                <button disabled={loading} className="md:col-span-2 lg:col-span-3 mt-8 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black italic tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-xl transition-all">
                  {loading ? "SAVING..." : <><Save size={18}/> {isEditing ? "UPDATE DATA" : "FINALIZE ENROLLMENT"}</>}
                </button>
              </form>
           </div>
        </div>
      ) : (
        /* Database Tab Restoration */
        <div className="space-y-5 animate-in slide-in-from-bottom-5 duration-300">
          {/* 8. Filter properly show */}
          <div className="flex flex-col md:flex-row gap-3 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
            <div className="flex-1 flex items-center bg-slate-950 px-4 py-3 rounded-xl border border-white/10 gap-3">
              <Search size={16} className="text-slate-500"/>
              <input value={listSearch} onChange={e => setListSearch(e.target.value)} className="bg-transparent text-[10px] font-black text-white outline-none w-full uppercase" placeholder="Search Database..." />
            </div>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full md:w-48 bg-slate-950 text-[10px] font-black text-white p-3 rounded-xl border border-white/10 uppercase">
              <option value="All">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.className}>{c.className}</option>)}
            </select>
          </div>

          {/* Batch Actions Bar */}
          {selectedBatch.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 p-3 rounded-2xl shadow-2xl flex items-center gap-4 z-[100] border border-white/20 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-[10px] font-black text-white pl-4 pr-2 border-r border-white/20">{selectedBatch.length} SELECTED</span>
              <button onClick={batchExport} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><FileSpreadsheet size={18}/></button>
              <button onClick={batchDelete} className="p-2.5 bg-red-500 rounded-xl hover:bg-red-400 transition-all shadow-lg"><Trash2 size={18}/></button>
              <button onClick={() => setSelectedBatch([])} className="p-2.5 text-white/50"><X size={18}/></button>
            </div>
          )}

          {/* 9. Two cards in row mobile */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredStudents.map(s => (
              <div key={s.id} className={`bg-slate-900/80 border ${selectedBatch.includes(s.id) ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-white/5'} rounded-2xl p-3 relative group transition-all`}>
                {/* 10. Checkbox logic */}
                <button onClick={() => toggleSelect(s.id)} className="absolute top-2 right-2 z-10 text-blue-500 bg-black/60 rounded-md">
                   {selectedBatch.includes(s.id) ? <CheckSquare size={20}/> : <Square size={20} className="text-slate-700"/>}
                </button>
                
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-16 h-16 bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                    {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-slate-800"/>}
                  </div>
                  <div className="w-full">
                    <h4 className="text-[11px] font-black text-white uppercase italic truncate mb-1">{s.fullName}</h4>
                    <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">{s.class}</span>
                  </div>
                </div>

                <div className="flex justify-between mt-4 pt-3 border-t border-white/5">
                   <button onClick={() => { setSelectedStudent(s); setFormData({...s}); setIsEditing(true); setActiveTab('registration'); }} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg"><Edit3 size={15}/></button>
                   <button onClick={() => { setSelectedStudent(s); setShowID(true); }} className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg"><CreditCard size={15}/></button>
                   <button onClick={() => { if(window.confirm("Delete?")) deleteDoc(doc(db, "students", s.id)).then(fetchData)}} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={15}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11. Studio Card Panel */}
      {showID && selectedStudent && (
        <div className="fixed inset-0 z-[200] bg-[#020617] flex flex-col md:flex-row overflow-hidden">
          {/* Studio Panel */}
          <div className="w-full md:w-80 bg-slate-900 border-r border-white/10 p-5 overflow-y-auto custom-scroll">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black italic text-xs uppercase tracking-widest">ID Card Studio</h3>
                <button onClick={() => setShowID(false)} className="p-2 bg-red-500/10 text-red-500 rounded-full"><X/></button>
             </div>

             <div className="space-y-4 mb-8">
               <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase">1. Card Size (mm)</label>
                  <div className="flex gap-2">
                    <div className="flex-1"><label className="text-[8px] text-slate-600 block mb-1">Width</label><input type="number" value={cardSize.width} onChange={e => setCardSize({...cardSize, width: parseInt(e.target.value)})} className="w-full bg-slate-800 p-2 rounded text-[10px] text-white"/></div>
                    <div className="flex-1"><label className="text-[8px] text-slate-600 block mb-1">Height</label><input type="number" value={cardSize.height} onChange={e => setCardSize({...cardSize, height: parseInt(e.target.value)})} className="w-full bg-slate-800 p-2 rounded text-[10px] text-white"/></div>
                  </div>
               </div>
               <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                  <label className="text-[9px] font-black text-slate-500 uppercase">2. Import Background</label>
                  <label className="flex items-center justify-center gap-3 p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl cursor-pointer hover:bg-blue-600 hover:text-white transition-all">
                    <ImageIcon size={16}/> <span className="text-[9px] font-black uppercase">Sample Card</span>
                    <input type="file" hidden accept="image/*" onChange={e => handlePhotoChange(e, 'cardBg')} />
                  </label>
               </div>
             </div>

             {/* Dynamic Field Controllers */}
             {['name', 'roll', 'class', 'father', 'address', 'photo', 'schoolName'].map(field => (
                <div key={field} className="mb-3 p-4 bg-black/20 rounded-xl border border-white/5 space-y-3">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-blue-400 uppercase italic">{field} Editor</span>
                     <button onClick={() => setVisibility({...visibility, [field]: !visibility[field]})} className="text-slate-500">
                       {visibility[field] ? <Eye size={16}/> : <EyeOff size={16}/>}
                     </button>
                   </div>
                   {visibility[field] && field !== 'photo' && field !== 'schoolName' && (
                     <div className="grid grid-cols-3 gap-1">
                        <input type="number" value={positions[field].top} onChange={e => updatePos(field, 'top', e.target.value)} className="bg-slate-800 p-2 rounded text-[9px] text-white" title="Top"/>
                        <input type="number" value={positions[field].left} onChange={e => updatePos(field, 'left', e.target.value)} className="bg-slate-800 p-2 rounded text-[9px] text-white" title="Left"/>
                        <input type="number" value={positions[field].size} onChange={e => updatePos(field, 'size', e.target.value)} className="bg-slate-800 p-2 rounded text-[9px] text-white" title="Font"/>
                     </div>
                   )}
                </div>
             ))}
          </div>

          {/* Preview Canvas Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950">
             <div ref={cardRef} style={{ width: `${cardSize.width}mm`, height: `${cardSize.height}mm`, position: 'relative', overflow: 'hidden', backgroundColor: '#fff' }} className="shadow-2xl rounded-xl">
                {cardSample && <img src={cardSample} className="absolute inset-0 w-full h-full object-cover z-0" />}
                <div className="relative z-10 w-full h-full font-sans">
                  {visibility.logo && schoolSettings.schoolLogo && <img src={schoolSettings.schoolLogo} style={{ position: 'absolute', top: '10px', left: '15px', height: '25px' }} />}
                  {visibility.schoolName && <div style={{ position: 'absolute', top: '12px', left: '45px', fontSize: '10px', fontWeight: 900, color: '#000' }}>{schoolSettings.schoolName}</div>}
                  
                  {visibility.photo && (
                    <div style={{ position: 'absolute', top: positions.photo.top, left: positions.photo.left, width: positions.photo.size, height: positions.photo.size }} className="border border-black/10">
                      {selectedStudent.photo ? <img src={selectedStudent.photo} className="w-full h-full object-cover" /> : <div className="bg-slate-100 w-full h-full" />}
                    </div>
                  )}
                  {visibility.name && <div style={{ position: 'absolute', top: positions.name.top, left: positions.name.left, fontSize: positions.name.size, color: positions.name.color }} className="font-black uppercase">{selectedStudent.fullName}</div>}
                  {visibility.roll && <div style={{ position: 'absolute', top: positions.roll.top, left: positions.roll.left, fontSize: positions.roll.size, color: positions.roll.color }} className="font-bold">ROLL: {selectedStudent.rollNo}</div>}
                  {visibility.class && <div style={{ position: 'absolute', top: positions.class.top, left: positions.class.left, fontSize: positions.class.size, color: positions.class.color }} className="font-bold">CLASS: {selectedStudent.class}</div>}
                </div>
             </div>
             <button onClick={async () => { const canvas = await html2canvas(cardRef.current, { scale: 5 }); const link = document.createElement('a'); link.download = `${selectedStudent.fullName}.png`; link.href = canvas.toDataURL(); link.click(); }} className="mt-10 px-10 py-5 bg-blue-600 text-white rounded-2xl font-black italic text-xs tracking-widest shadow-2xl flex items-center gap-3">
               <Download size={20}/> EXPORT HIGH-QUALITY PNG
             </button>
          </div>
        </div>
      )}

      {/* Settings Modal (Restored Settings Logic) */}
      {showSettings && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 space-y-5">
             <div className="flex justify-between items-center border-b border-white/5 pb-4">
               <h3 className="font-black text-xs italic tracking-widest">SYSTEM CONFIG</h3>
               <button onClick={() => setShowSettings(false)}><X/></button>
             </div>
             <div className="space-y-3">
               <input value={schoolSettings.schoolName} onChange={e => setSchoolSettings({...schoolSettings, schoolName: e.target.value.toUpperCase()})} className="w-full bg-slate-950 p-4 rounded-xl text-xs border border-white/10 text-white font-bold" placeholder="SCHOOL NAME" />
               <input value={schoolSettings.session} onChange={e => setSchoolSettings({...schoolSettings, session: e.target.value})} className="w-full bg-slate-950 p-4 rounded-xl text-xs border border-white/10 text-white font-bold" placeholder="SESSION" />
               <div className="p-3 border-2 border-dashed border-white/10 rounded-xl text-center">
                 <input type="file" hidden id="logoUpload" onChange={e => handlePhotoChange(e, 'logo')} />
                 <label htmlFor="logoUpload" className="text-[9px] font-black uppercase text-slate-500 cursor-pointer">Update School Logo</label>
               </div>
             </div>
             <button onClick={async () => { await setDoc(doc(db, "settings", "schoolConfig"), schoolSettings); setShowSettings(false); }} className="w-full py-4 bg-blue-600 rounded-xl text-[10px] font-black italic uppercase tracking-widest shadow-lg">Save Settings</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default StudentRegistration;
