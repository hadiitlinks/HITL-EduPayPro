import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { 
  UserPlus, Camera, User, Save, Search, CreditCard, X, Download, Settings, 
  FileSpreadsheet, Edit3, Trash2, School, Users, Tag, CheckSquare, Square, 
  Image as ImageIcon, Layers, Menu, Trash
} from 'lucide-react';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const StudentRegistration = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState('registration'); 
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [listSearch, setListSearch] = useState(''); 
  const [filterClass, setFilterClass] = useState('All');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showID, setShowID] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // --- GLOBAL SETTINGS ---
  const [schoolSettings, setSchoolSettings] = useState({
    session: '2025-26',
    schoolLogo: '',
    schoolName: 'PROTOCOL SCHOOL SYSTEM',
    address: 'Your School Address Here',
    phone: '0300-0000000'
  });

  // --- Form Data ---
  const [formData, setFormData] = useState({
    serialNo: '', regNo: '', fullName: '', fatherName: '', gender: 'Male',
    parentPhone: '', rollNo: '', class: '', originalFee: 0, discount: 0,
    monthlyFee: 0, address: '', dob: '', photo: '',
    registrationDate: new Date().toISOString().split('T')[0]
  });

  // --- ID Card Studio States ---
  const [cardSize, setCardSize] = useState({ width: 86, height: 54 }); 
  const [solidBgColor, setSolidBgColor] = useState('#ffffff');
  const [cardSample, setCardSample] = useState(null); 
  const [positions, setPositions] = useState({
    name: { top: 110, left: 140, size: 18, color: '#000000', show: true },
    roll: { top: 150, left: 140, size: 12, color: '#444444', show: true },
    class: { top: 170, left: 140, size: 12, color: '#444444', show: true },
    father: { top: 190, left: 140, size: 12, color: '#444444', show: true },
    address: { top: 210, left: 140, size: 10, color: '#666666', show: true },
    photo: { top: 60, left: 30, size: 90, show: true }
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

  const saveSettings = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "schoolConfig"), schoolSettings);
      alert("Settings Updated!");
      setShowSettings(false);
    } catch (err) { alert("Error saving settings."); }
    setLoading(false);
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

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} students permanently?`)) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => batch.delete(doc(db, "students", id)));
      await batch.commit();
      setSelectedIds([]);
      fetchData();
      alert("Deleted successfully!");
    } catch (err) { alert("Delete failed."); }
    setLoading(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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
        updatedAt: new Date() 
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
    setFormData({ serialNo: '', regNo: '', fullName: '', fatherName: '', gender: 'Male', parentPhone: '', rollNo: '', class: '', originalFee: 0, discount: 0, monthlyFee: 0, address: '', dob: '', photo: '', registrationDate: new Date().toISOString().split('T')[0] });
    setIsEditing(false); setSelectedStudent(null); setSearchTerm('');
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({ ...student });
    setSearchTerm(student.class);
    setIsEditing(true);
    setActiveTab('registration');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = () => {
    const dataToExport = filteredStudents.map(s => ({ "Reg #": s.regNo, "Name": s.fullName, "Father": s.fatherName, "Class": s.class, "Roll": s.rollNo, "Phone": s.parentPhone }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `Students_List.xlsx`);
  };

  const updatePos = (field, key, value) => {
    setPositions(prev => ({
      ...prev,
      [field]: { ...prev[field], [key]: key === 'color' || key === 'show' ? value : parseInt(value) }
    }));
  };

  const filteredStudents = students.filter(s => {
    const searchLower = listSearch.toLowerCase();
    return (
      ((s.fullName || "").toLowerCase().includes(searchLower) || (s.rollNo || "").toLowerCase().includes(searchLower) || (s.parentPhone || "").toLowerCase().includes(searchLower)) &&
      (filterClass === 'All' ? true : s.class === filterClass)
    );
  });

  return (
    <div className="p-3 md:p-8 space-y-4 md:space-y-6 bg-[#020617] min-h-screen text-slate-300 font-sans selection:bg-blue-500/30">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg p-6 md:p-8 rounded-[2rem] space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-5">
              <h3 className="text-white font-black uppercase italic text-sm tracking-widest">School Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
            </div>
            <div className="space-y-4">
              <input value={schoolSettings.schoolName} onChange={e => setSchoolSettings({...schoolSettings, schoolName: e.target.value.toUpperCase()})} className="w-full bg-black/40 p-4 rounded-xl border border-white/10 text-white font-bold outline-none" placeholder="School Name" />
              <input value={schoolSettings.session} onChange={e => setSchoolSettings({...schoolSettings, session: e.target.value})} className="w-full bg-black/40 p-4 rounded-xl border border-white/10 text-white font-bold outline-none" placeholder="Session" />
              <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center">
                  <input type="file" accept="image/*" onChange={e => handlePhotoChange(e, 'logo')} className="hidden" id="logo-up" />
                  <label htmlFor="logo-up" className="cursor-pointer text-[10px] font-black text-blue-400 uppercase">Upload Logo</label>
                  {schoolSettings.schoolLogo && <img src={schoolSettings.schoolLogo} className="h-10 mx-auto mt-2" />}
              </div>
            </div>
            <button onClick={saveSettings} className="w-full btn-neon py-4 flex items-center justify-center gap-3 font-black uppercase italic"><Save size={20}/> Save Changes</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 shadow-xl">
        <div className="flex items-center gap-3 md:gap-5 w-full md:w-auto">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden">
            {schoolSettings.schoolLogo ? <img src={schoolSettings.schoolLogo} className="w-full h-full object-contain" /> : <School size={24} className="text-slate-700"/>}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-lg md:text-3xl font-black text-white italic tracking-tighter uppercase truncate">{schoolSettings.schoolName}</h2>
            <span className="text-[8px] md:text-[10px] font-black text-blue-400 uppercase tracking-widest">Session: {schoolSettings.session}</span>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-3 bg-slate-800/50 text-slate-300 rounded-xl border border-white/10"><Settings size={20}/></button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-white/5 w-full md:w-fit shadow-2xl overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('registration')} className={`flex-1 md:flex-none whitespace-nowrap px-6 md:px-10 py-3 rounded-lg flex items-center justify-center gap-2 font-black uppercase text-[10px] md:text-xs transition-all ${activeTab === 'registration' ? 'bg-blue-500 text-black shadow-lg' : 'text-slate-500'}`}><UserPlus size={16}/> ADMISSION</button>
        <button onClick={() => setActiveTab('students')} className={`flex-1 md:flex-none whitespace-nowrap px-6 md:px-10 py-3 rounded-lg flex items-center justify-center gap-2 font-black uppercase text-[10px] md:text-xs transition-all ${activeTab === 'students' ? 'bg-blue-500 text-black shadow-lg' : 'text-slate-500'}`}><Users size={16}/> DATABASE</button>
      </div>

      {activeTab === 'registration' ? (
        <div className="animate-in fade-in duration-500">
           <div className="neon-card p-5 md:p-10 border border-white/5">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
                <div className="lg:col-span-3 space-y-2">
                  <label className="text-[10px] text-blue-400 font-black uppercase">Student Photo</label>
                  <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 cursor-pointer">
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoChange(e, 'student')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {formData.photo ? <img src={formData.photo} className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-2xl object-cover shadow-2xl" /> : <div className="flex flex-col items-center py-2"><Camera size={32} className="text-slate-700 mb-1"/><p className="text-[10px] font-black text-slate-500 uppercase">Upload Photo</p></div>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase">Reg # (Editable)</label>
                  <input value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value})} className="w-full bg-slate-900/50 p-3 md:p-4 rounded-xl text-white border border-white/10 outline-none font-bold text-sm" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-blue-400 font-black uppercase">Student Name *</label>
                  <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-900/50 p-3 md:p-4 rounded-xl text-white border border-white/10 outline-none font-black uppercase text-sm" placeholder="FULL NAME" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase">Father Name *</label>
                  <input required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full bg-slate-900/50 p-3 md:p-4 rounded-xl text-white border border-white/10 outline-none font-black uppercase text-sm" placeholder="FATHER NAME" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-blue-400 font-black uppercase">Gender *</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-900/50 p-3 md:p-4 rounded-xl text-white border border-white/10 font-black text-sm"><option value="Male">Male</option><option value="Female">Female</option></select>
                </div>

                <div className="relative space-y-1">
                  <label className="text-[10px] text-blue-400 font-black uppercase">Class *</label>
                  <input required value={searchTerm} onFocus={() => setShowDropdown(true)} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 p-3 md:p-4 rounded-xl text-white border border-white/10 font-black text-sm" placeholder="SEARCH CLASS..." />
                  {showDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-xl max-h-48 overflow-auto">
                      {classes.filter(c => (c.className || "").toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                        <div key={c.id} onClick={() => handleClassSelect(c)} className="p-3 hover:bg-blue-500/10 text-white cursor-pointer text-[10px] font-black uppercase border-b border-white/5">{c.className}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase">Roll # *</label>
                  <input required value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} className="w-full bg-slate-900/50 p-3 md:p-4 rounded-xl text-white border border-white/10 font-black text-sm" placeholder="ROLL NO" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase">Guardian Phone *</label>
                  <input required value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full bg-slate-900/50 p-3 md:p-4 rounded-xl text-white border border-white/10 font-bold text-sm" placeholder="03XX-XXXXXXX" />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-slate-500 font-black uppercase">Full Address</label>
                  <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-900/50 p-3 md:p-4 rounded-xl text-white border border-white/10 text-sm" placeholder="HOME ADDRESS" />
                </div>

                <div className="bg-slate-800/20 p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-6 lg:col-span-3">
                    <div className="flex-1">
                      <label className="text-[8px] text-slate-500 uppercase font-black">Monthly Discount</label>
                      <input type="number" value={formData.discount} onChange={e => { const d = parseFloat(e.target.value) || 0; setFormData({...formData, discount: d, monthlyFee: formData.originalFee - d}); }} className="w-full bg-transparent text-white font-black outline-none text-2xl" />
                    </div>
                    <div className="flex-1 md:border-l border-white/10 md:pl-6">
                      <label className="text-[8px] text-yellow-500 uppercase font-black">Final Monthly Fee</label>
                      <div className="text-2xl font-black text-white italic">Rs. {formData.monthlyFee}</div>
                    </div>
                </div>

                <button disabled={loading} className="lg:col-span-3 btn-neon py-4 md:py-6 mt-4 flex items-center justify-center gap-3 uppercase font-black italic tracking-widest text-xs md:text-sm shadow-2xl">
                  {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> : <><Save size={20}/> {isEditing ? 'UPDATE RECORD' : 'FINALIZE REGISTRATION'}</>}
                </button>
              </form>
           </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-5 duration-500 space-y-4">
            <div className="neon-card p-4 md:p-6 border border-white/5 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-1 gap-3 w-full">
                  <div className="bg-slate-900/80 p-3 md:p-4 rounded-xl border border-white/10 flex items-center gap-3 flex-1">
                    <Search size={18} className="text-slate-500"/><input placeholder="SEARCH..." className="bg-transparent text-white text-[10px] md:text-xs outline-none w-full font-black uppercase" value={listSearch} onChange={e => setListSearch(e.target.value)}/>
                  </div>
                  {selectedIds.length > 0 && (
                    <button onClick={handleBulkDelete} className="p-3 bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 flex items-center gap-2 font-black text-[10px] uppercase"><Trash2 size={16}/> DELETE SELECTED</button>
                  )}
                  <button onClick={handleExport} className="p-3 bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/20"><FileSpreadsheet size={18}/></button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredStudents.map(s => (
                    <div key={s.id} className={`neon-card p-4 border transition-all ${selectedIds.includes(s.id) ? 'border-blue-500 bg-blue-500/5' : 'border-white/5'} flex flex-col relative`}>
                      <button onClick={() => toggleSelect(s.id)} className="absolute top-3 right-3 z-10">
                        {selectedIds.includes(s.id) ? <CheckSquare size={18} className="text-blue-500"/> : <Square size={18} className="text-slate-700"/>}
                      </button>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden border border-white/10 flex items-center justify-center">{s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-700" />}</div>
                        <div className="flex-1 overflow-hidden">
                           <h4 className="text-[11px] font-black text-white uppercase italic truncate">{s.fullName}</h4>
                           <p className="text-[9px] text-slate-500 font-bold truncate">S/O: {s.fatherName}</p>
                           <div className="flex flex-col mt-1">
                              <span className="text-[8px] font-black text-blue-400 uppercase">Class: {s.class} | Roll: {s.rollNo}</span>
                              <span className="text-[8px] text-slate-600 font-mono mt-0.5">{s.parentPhone}</span>
                           </div>
                        </div>
                      </div>
                      <div className="pt-3 mt-auto border-t border-white/5 flex justify-between items-center">
                         <span className="text-[8px] font-mono text-slate-700">{s.regNo}</span>
                         <div className="flex gap-1.5">
                            <button onClick={() => handleEdit(s)} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Edit3 size={14}/></button>
                            <button onClick={() => {setSelectedStudent(s); setShowID(true);}} className="p-2 bg-blue-500 text-black rounded-lg shadow-lg shadow-blue-500/20"><CreditCard size={14}/></button>
                         </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
        </div>
      )}

      {/* --- ID STUDIO --- */}
      {showID && selectedStudent && (
        <div className="fixed inset-0 z-[600] bg-[#020617] flex flex-col p-4 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">
                <div className="lg:w-85 space-y-4 bg-slate-900 p-6 rounded-3xl border border-white/10 h-fit shadow-2xl">
                    <div className="flex justify-between items-center mb-4"><h4 className="text-white font-black italic uppercase text-[10px] tracking-widest">Card Studio Panel</h4><button onClick={() => setShowID(false)} className="text-red-500 p-1 bg-red-500/10 rounded-full"><X size={20}/></button></div>
                    
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1"><label className="text-[7px] text-slate-500 font-black uppercase">Card Width (mm)</label><input type="number" value={cardSize.width} onChange={(e) => setCardSize({...cardSize, width: parseInt(e.target.value)})} className="w-full bg-slate-800 p-2 rounded text-white text-[10px]" /></div>
                            <div className="space-y-1"><label className="text-[7px] text-slate-500 font-black uppercase">Card Height (mm)</label><input type="number" value={cardSize.height} onChange={(e) => setCardSize({...cardSize, height: parseInt(e.target.value)})} className="w-full bg-slate-800 p-2 rounded text-white text-[10px]" /></div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[7px] text-slate-500 font-black uppercase">Sample Background Card</label>
                            <input type="file" accept="image/*" onChange={e => handlePhotoChange(e, 'cardBg')} className="w-full text-[8px] file:py-1 file:px-2 file:bg-blue-500/20 file:text-blue-400 file:border-0 file:rounded" />
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scroll">
                        {['name', 'roll', 'class', 'father', 'address', 'photo'].map((field) => (
                            <div key={field} className="p-3 bg-black/20 rounded-lg border border-white/5 space-y-2">
                                <div className="flex justify-between items-center">
                                  <p className="text-[9px] font-black text-blue-400 uppercase italic">{field} Editor</p>
                                  <input type="checkbox" checked={positions[field].show} onChange={(e) => updatePos(field, 'show', e.target.checked)} className="accent-blue-500" />
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                    <div className="space-y-1"><label className="text-[7px] text-slate-600">Top</label><input type="number" value={positions[field].top} onChange={(e) => updatePos(field, 'top', e.target.value)} className="w-full bg-slate-800 p-1 rounded text-white text-[9px]" /></div>
                                    <div className="space-y-1"><label className="text-[7px] text-slate-600">Left</label><input type="number" value={positions[field].left} onChange={(e) => updatePos(field, 'left', e.target.value)} className="w-full bg-slate-800 p-1 rounded text-white text-[9px]" /></div>
                                    <div className="space-y-1"><label className="text-[7px] text-slate-600">Size</label><input type="number" value={positions[field].size} onChange={(e) => updatePos(field, 'size', e.target.value)} className="w-full bg-slate-800 p-1 rounded text-white text-[9px]" /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 rounded-[2rem] p-4 md:p-12 border border-white/5 overflow-hidden shadow-inner">
                    <div className="scale-[0.5] sm:scale-[0.7] md:scale-100 origin-center transition-transform">
                        <div ref={cardRef} style={{ width: `${cardSize.width}mm`, height: `${cardSize.height}mm`, backgroundColor: solidBgColor, position: 'relative' }} className="shadow-2xl rounded-xl overflow-hidden">
                            {cardSample && <img src={cardSample} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />}
                            <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
                                {positions.photo.show && (
                                  <div style={{ position: 'absolute', top: `${positions.photo.top}px`, left: `${positions.photo.left}px`, width: `${positions.photo.size}px`, height: `${positions.photo.size}px` }} className="overflow-hidden border border-black/10">
                                      {selectedStudent.photo ? <img src={selectedStudent.photo} className="w-full h-full object-cover" /> : <div className="bg-slate-200 w-full h-full" />}
                                  </div>
                                )}
                                {positions.name.show && <div className="font-black uppercase" style={{ position: 'absolute', top: `${positions.name.top}px`, left: `${positions.name.left}px`, fontSize: `${positions.name.size}px`, color: positions.name.color }}>{selectedStudent.fullName}</div>}
                                {positions.roll.show && <div className="font-bold uppercase" style={{ position: 'absolute', top: `${positions.roll.top}px`, left: `${positions.roll.left}px`, fontSize: `${positions.roll.size}px`, color: positions.roll.color }}>Roll: {selectedStudent.rollNo}</div>}
                                {positions.class.show && <div className="font-bold uppercase" style={{ position: 'absolute', top: `${positions.class.top}px`, left: `${positions.class.left}px`, fontSize: `${positions.class.size}px`, color: positions.class.color }}>Class: {selectedStudent.class}</div>}
                            </div>
                        </div>
                    </div>
                    <button onClick={async () => { const canvas = await html2canvas(cardRef.current, { scale: 4 }); const link = document.createElement('a'); link.download = `${selectedStudent.fullName}_ID.png`; link.href = canvas.toDataURL(); link.click(); }} className="btn-neon mt-8 md:mt-12 px-10 py-4 flex items-center gap-4 text-xs font-black italic shadow-2xl"><Download size={22}/> EXPORT CARD</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistration;