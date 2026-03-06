import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc, limit, setDoc, getDoc } from 'firebase/firestore';
import { 
  UserPlus, Camera, User, Save, Search, CreditCard, X, Download, Settings, 
  FileSpreadsheet, Edit3, Trash2, Type, Filter, Layers, MapPin, Image as ImageIcon,
  School, Users, Tag
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

  // --- GLOBAL SETTINGS (Linked to all documents) ---
  const [schoolSettings, setSchoolSettings] = useState({
    session: '2025-26',
    schoolLogo: '',
    schoolName: 'PROTOCOL SCHOOL SYSTEM',
    address: 'Your School Address Here',
    phone: '0300-0000000'
  });

  // --- Form Data ---
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

  // --- ID Card Customization States ---
  const [cardSize, setCardSize] = useState({ width: 100, height: 60 }); 
  const [solidBgColor, setSolidBgColor] = useState('#ffffff');
  const [cardSample, setCardSample] = useState(null); 
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
    if (docSnap.exists()) {
      setSchoolSettings(docSnap.data());
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "schoolConfig"), schoolSettings);
      alert("Settings Updated Successfully!");
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

  const handleDiscountChange = (val) => {
    const disc = parseFloat(val) || 0;
    setFormData({
      ...formData,
      discount: disc,
      monthlyFee: (formData.originalFee || 0) - disc
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        fullName: formData.fullName.toUpperCase(),
        fatherName: formData.fatherName.toUpperCase(),
        schoolName: schoolSettings.schoolName, // Saving school context
        session: schoolSettings.session,
        updatedAt: new Date(),
      };

      if (isEditing && selectedStudent?.id) {
        await updateDoc(doc(db, "students", selectedStudent.id), dataToSave);
        alert("Record Updated!");
      } else {
        await addDoc(collection(db, "students"), { ...dataToSave, createdAt: new Date(), status: 'active' });
        alert("Student Enrolled!");
      }
      resetForm();
      fetchData();
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

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({ ...student });
    setSearchTerm(student.class);
    setIsEditing(true);
    setActiveTab('registration');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ FullName: "", FatherName: "", RollNo: "", Class: "", Gender: "Male", Phone: "", Address: "" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${schoolSettings.schoolName}_Import_Template.xlsx`);
  };

  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(evt.target.result, { type: 'binary' }).Sheets[XLSX.read(evt.target.result, { type: 'binary' }).SheetNames[0]]);
      setLoading(true);
      try {
          for (let item of data) {
            await addDoc(collection(db, "students"), {
              fullName: item.FullName?.toUpperCase() || "N/A",
              fatherName: item.FatherName?.toUpperCase() || "N/A",
              rollNo: item.RollNo?.toString() || "",
              regNo: `REG-${schoolSettings.session}-IMP`,
              serialNo: "0", 
              class: item.Class || "",
              gender: item.Gender || "Male",
              parentPhone: item.Phone?.toString() || "",
              address: item.Address || "",
              session: schoolSettings.session,
              createdAt: new Date(),
              status: 'active'
            });
          }
          alert("Import Successful!");
          fetchData();
      } catch (err) { alert("Import Error"); }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const dataToExport = filteredStudents.map(s => ({ 
      "School": schoolSettings.schoolName,
      "Session": schoolSettings.session,
      "Reg #": s.regNo, 
      "Name": s.fullName, 
      "Father": s.fatherName, 
      "Class": s.class, 
      "Roll": s.rollNo, 
      "Phone": s.parentPhone 
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `${schoolSettings.schoolName}_Students_${filterClass}.xlsx`);
  };

  const updatePos = (field, key, value) => {
    setPositions(prev => ({
      ...prev,
      [field]: { ...prev[field], [key]: key === 'color' ? value : parseInt(value) }
    }));
  };

  const filteredStudents = students.filter(s => {
    const searchLower = listSearch.toLowerCase();
    return (
      ((s.fullName || "").toLowerCase().includes(searchLower) ||
      (s.rollNo || "").toLowerCase().includes(searchLower) ||
      (s.parentPhone || "").toLowerCase().includes(searchLower) ||
      (s.fatherName || "").toLowerCase().includes(searchLower)) &&
      (filterClass === 'All' ? true : s.class === filterClass)
    );
  });

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#020617] min-h-screen text-slate-300 font-sans">
      
      {/* GLOBAL SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Settings size={20}/></div>
                <h3 className="text-white font-black uppercase italic tracking-widest">System Configuration</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Full School Name</label>
                <input value={schoolSettings.schoolName} onChange={e => setSchoolSettings({...schoolSettings, schoolName: e.target.value.toUpperCase()})} className="w-full bg-black/40 p-4 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Current Session</label>
                <input value={schoolSettings.session} onChange={e => setSchoolSettings({...schoolSettings, session: e.target.value})} className="w-full bg-black/40 p-4 rounded-2xl border border-white/10 text-white font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Logo Update</label>
                <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-4 text-center hover:bg-white/5 transition-all">
                  <input type="file" accept="image/*" onChange={e => handlePhotoChange(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {schoolSettings.schoolLogo ? <img src={schoolSettings.schoolLogo} className="w-12 h-12 mx-auto object-contain" /> : <ImageIcon className="mx-auto text-slate-700"/>}
                  <p className="text-[8px] font-bold text-slate-500 mt-2 uppercase">Click to Upload</p>
                </div>
              </div>
            </div>
            <button onClick={saveSettings} className="w-full btn-neon py-5 flex items-center justify-center gap-3 font-black uppercase italic tracking-widest"><Save size={20}/> Update Global Settings</button>
          </div>
        </div>
      )}

      {/* Main Header with Logo & Name from Settings */}
      <div className="flex flex-wrap gap-6 justify-between items-center bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 p-2 overflow-hidden">
            {schoolSettings.schoolLogo ? <img src={schoolSettings.schoolLogo} className="w-full h-full object-contain" alt="logo"/> : <School size={32} className="text-slate-700"/>}
          </div>
          <div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{schoolSettings.schoolName}</h2>
            <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black tracking-widest uppercase">Academic Session: {schoolSettings.session}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-4 bg-slate-800/50 text-slate-300 rounded-2xl border border-white/10 hover:bg-slate-700 transition-all shadow-lg group">
            <Settings size={22} className="group-hover:rotate-90 transition-transform duration-500"/>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900/80 p-2 rounded-2xl border border-white/5 w-fit shadow-2xl backdrop-blur-sm">
        <button onClick={() => setActiveTab('registration')} className={`px-10 py-4 rounded-xl flex items-center gap-3 font-black uppercase text-xs transition-all ${activeTab === 'registration' ? 'bg-[var(--primary)] text-black shadow-neon' : 'text-slate-500 hover:text-white'}`}>
            <UserPlus size={18}/> ADMISSION OFFICE
        </button>
        <button onClick={() => setActiveTab('students')} className={`px-10 py-4 rounded-xl flex items-center gap-3 font-black uppercase text-xs transition-all ${activeTab === 'students' ? 'bg-[var(--primary)] text-black shadow-neon' : 'text-slate-500 hover:text-white'}`}>
            <Users size={18}/> STUDENT DATABASE
        </button>
      </div>

      {activeTab === 'registration' ? (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
           <div className="neon-card p-8 md:p-12 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><School size={150}/></div>
              
              <div className="flex flex-wrap justify-between items-center mb-12 gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)] shadow-inner">
                        {isEditing ? <Edit3 size={28}/> : <UserPlus size={28}/>}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">{isEditing ? "Modify Enrollment" : "New Registration"}</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Fill all mandatory fields for {schoolSettings.session}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={downloadTemplate} className="btn-neon py-3 px-5 text-[10px] flex items-center gap-2 bg-emerald-600/10 text-emerald-500 border-emerald-500/20 font-black tracking-tighter"><Download size={16}/> DOWNLOAD TEMPLATE</button>
                    <label className="btn-neon py-3 px-5 text-[10px] flex items-center gap-2 cursor-pointer bg-slate-800/80 text-slate-300 border-white/10 font-black tracking-tighter"><FileSpreadsheet size={16}/> BATCH IMPORT<input type="file" hidden accept=".xlsx, .xls" onChange={handleExcelImport} /></label>
                  </div>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                <div className="lg:col-span-3 space-y-2">
                  <label className="text-[10px] text-[var(--primary)] font-black uppercase tracking-widest ml-1">Student Photograph</label>
                  <div className="relative border-2 border-dashed border-white/10 rounded-[2rem] p-8 text-center hover:bg-white/5 cursor-pointer transition-all group">
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoChange(e, 'student')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {formData.photo ? <img src={formData.photo} alt="Preview" className="w-32 h-32 mx-auto rounded-3xl object-cover border-4 border-slate-800 shadow-2xl" /> : <div className="flex flex-col items-center py-4"><Camera size={40} className="text-slate-700 mb-2 group-hover:scale-110 transition-transform"/><p className="text-[11px] font-black text-slate-500 uppercase">Drop student photo here</p></div>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] text-slate-500 font-black uppercase">Admission Details</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative"><Tag className="absolute left-4 top-4 text-slate-600" size={16}/><input value={formData.serialNo} onChange={e => setFormData({...formData, serialNo: e.target.value})} className="w-full bg-slate-900/50 pl-12 pr-4 py-4 rounded-2xl text-white border border-white/10 outline-none font-bold" placeholder="Serial" /></div>
                    <input value={formData.regNo} readOnly className="w-full bg-slate-950 p-4 rounded-2xl text-slate-500 border border-white/5 outline-none font-mono text-xs italic" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] text-[var(--primary)] font-black uppercase">Student Name *</label>
                  <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-2xl text-white border border-white/10 outline-none focus:border-[var(--primary)] font-black uppercase" placeholder="ENTER FULL NAME" />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] text-slate-500 font-black uppercase">Father's Name *</label>
                  <input required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-2xl text-white border border-white/10 outline-none font-black uppercase" placeholder="FATHER NAME" />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] text-[var(--primary)] font-black uppercase">Gender *</label>
                  <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-2xl text-white border border-white/10 outline-none font-black">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="relative space-y-2">
                  <label className="text-[11px] text-[var(--primary)] font-black uppercase">Assign Class *</label>
                  <input required value={searchTerm} onFocus={() => setShowDropdown(true)} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 p-4 rounded-2xl text-white border border-white/10 outline-none font-black" placeholder="SEARCH CLASS..." />
                  {showDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-2xl max-h-56 overflow-auto shadow-2xl backdrop-blur-xl">
                      {classes.filter(c => (c.className || "").toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                        <div key={c.id} onClick={() => handleClassSelect(c)} className="p-4 hover:bg-[var(--primary)]/10 text-white cursor-pointer text-xs font-black uppercase border-b border-white/5">{c.className}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] text-slate-500 font-black uppercase">Roll Number *</label>
                  <input required value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-2xl text-white border border-white/10 outline-none font-black" placeholder="ASSIGN ROLL #" />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] text-slate-500 font-black uppercase">Guardian Contact *</label>
                  <input required value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-2xl text-white border border-white/10 outline-none font-bold" placeholder="03XX-XXXXXXX" />
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <label className="text-[11px] text-slate-500 font-black uppercase">Home Address</label>
                  <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-2xl text-white border border-white/10 outline-none" placeholder="FULL RESIDENTIAL ADDRESS" />
                </div>

                <div className="bg-slate-800/20 p-6 rounded-[2rem] border border-white/5 flex gap-10 lg:col-span-3 shadow-inner">
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Monthly Scholarship / Discount</label>
                      <input type="number" value={formData.discount} onChange={e => handleDiscountChange(e.target.value)} className="w-full bg-transparent text-white font-black outline-none text-3xl mt-1" />
                    </div>
                    <div className="flex-1 border-l border-white/10 pl-10">
                      <label className="text-[9px] text-yellow-500 uppercase font-black tracking-widest">Net Payable Monthly Fee</label>
                      <div className="text-3xl font-black text-white italic tracking-tighter mt-1">Rs. {formData.monthlyFee}</div>
                    </div>
                </div>

                <button disabled={loading} className="lg:col-span-3 btn-neon py-6 mt-6 flex items-center justify-center gap-4 uppercase font-black italic tracking-[0.2em] shadow-2xl">
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
                  ) : (
                    <><Save size={24}/> {isEditing ? 'UPDATE DATA' : 'FINALIZE REGISTRATION'}</>
                  )}
                </button>
                {isEditing && (
                  <button type="button" onClick={resetForm} className="lg:col-span-3 text-red-500 font-black uppercase text-xs tracking-[0.3em] hover:text-red-400 py-2">DISCARD CHANGES</button>
                )}
              </form>
           </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-10 duration-500 space-y-6">
            <div className="neon-card p-8 border border-white/5 space-y-8">
              <div className="flex flex-wrap justify-between items-center gap-6">
                <div className="flex flex-1 gap-4 items-center">
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-white/10 flex items-center gap-4 flex-1 shadow-inner backdrop-blur-md">
                        <Search size={22} className="text-slate-500"/>
                        <input placeholder="SEARCH BY NAME, FATHER, PHONE OR ROLL..." className="bg-transparent text-white text-xs outline-none w-full font-black uppercase tracking-widest" value={listSearch} onChange={e => setListSearch(e.target.value)}/>
                    </div>
                    <div className="w-64">
                        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="bg-slate-900/80 text-white text-xs p-5 rounded-2xl border border-white/10 w-full font-black uppercase cursor-pointer backdrop-blur-md">
                            <option value="All">All Active Classes</option>
                            {classes.map(c => <option key={c.id} value={c.className}>{c.className}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="btn-neon py-4 px-8 text-xs flex items-center gap-2 bg-blue-600/20 text-blue-400 border-blue-500/20 font-black">
                        <FileSpreadsheet size={18}/> EXCEL
                    </button>
                    <button onClick={() => alert("Printing all cards...")} className="btn-neon py-4 px-8 text-xs flex items-center gap-2 bg-purple-600/20 text-purple-400 border-purple-500/20 font-black">
                        <Layers size={18}/> ID CARDS ({filteredStudents.length})
                    </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {filteredStudents.length > 0 ? filteredStudents.map(s => (
                    <div key={s.id} className="neon-card p-5 border border-white/5 hover:border-[var(--primary)]/40 hover:bg-slate-800/20 transition-all flex flex-col group relative overflow-hidden">
                      <div className="flex items-center gap-5 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-950 overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
                          {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <User size={28} className="text-slate-700" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h4 className="text-[13px] font-black text-white uppercase italic leading-none truncate mb-1">{s.fullName}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase truncate">{s.gender === 'Male' ? 'S/O' : 'D/O'}: {s.fatherName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black text-[var(--primary)] uppercase bg-[var(--primary)]/5 px-2 py-0.5 rounded border border-[var(--primary)]/20">{s.class}</span>
                            <span className="text-[10px] text-slate-500 font-bold">ROLL: {s.rollNo}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 mt-auto border-t border-white/5 flex justify-between items-center">
                         <span className="text-[9px] font-mono text-slate-600">{s.parentPhone}</span>
                         <div className="flex gap-2">
                            <button onClick={() => handleEdit(s)} className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"><Edit3 size={16}/></button>
                            <button onClick={() => {setSelectedStudent(s); setShowID(true);}} className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl hover:bg-[var(--primary)] hover:text-black transition-all shadow-sm"><CreditCard size={16}/></button>
                            <button onClick={() => {if(window.confirm("Permanent Delete?")) deleteDoc(doc(db, "students", s.id)).then(() => fetchData())}} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                         </div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-32 text-center opacity-30">
                        <Search size={64} className="mx-auto mb-6"/>
                        <h3 className="text-xl font-black uppercase italic tracking-widest">No Student Records Found</h3>
                        <p className="text-sm font-bold mt-2">Try searching with a different keyword or class</p>
                    </div>
                  )}
              </div>
            </div>
        </div>
      )}

      {/* --- ID CARD DESIGNER (Linked with Settings) --- */}
      {showID && selectedStudent && (
        <div className="fixed inset-0 z-[200] bg-[#020617] flex flex-col p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
                <div className="lg:w-80 space-y-6 bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 h-fit shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-white font-black italic uppercase text-sm tracking-widest">Studio Card</h4>
                        <button onClick={() => setShowID(false)} className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 transition-colors"><X size={20}/></button>
                    </div>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scroll">
                        {['name', 'roll', 'class', 'father', 'address', 'photo'].map((field) => (
                            <div key={field} className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                <p className="text-[10px] font-black text-[var(--primary)] uppercase flex items-center gap-2 italic">{field} Editor</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1"><label className="text-[8px] text-slate-600 font-bold uppercase">Top</label><input type="number" value={positions[field].top} onChange={(e) => updatePos(field, 'top', e.target.value)} className="w-full bg-slate-800 p-1.5 rounded-lg text-white text-[10px]" /></div>
                                    <div className="space-y-1"><label className="text-[8px] text-slate-600 font-bold uppercase">Left</label><input type="number" value={positions[field].left} onChange={(e) => updatePos(field, 'left', e.target.value)} className="w-full bg-slate-800 p-1.5 rounded-lg text-white text-[10px]" /></div>
                                    <div className="space-y-1"><label className="text-[8px] text-slate-600 font-bold uppercase">Size</label><input type="number" value={positions[field].size} onChange={(e) => updatePos(field, 'size', e.target.value)} className="w-full bg-slate-800 p-1.5 rounded-lg text-white text-[10px]" /></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 rounded-[3rem] p-12 border border-white/5 shadow-inner">
                    <div ref={cardRef} style={{ width: `${cardSize.width}mm`, height: `${cardSize.height}mm`, backgroundColor: solidBgColor, position: 'relative' }} className="shadow-2xl rounded-xl overflow-hidden">
                        {/* Background Sample */}
                        {cardSample && <img src={cardSample} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} alt="bg" />}
                        
                        <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
                            {/* School Brand (Automatic from settings) */}
                            <div className="flex items-center gap-2" style={{ position: 'absolute', top: '10px', left: '15px' }}>
                                {schoolSettings.schoolLogo && <img src={schoolSettings.schoolLogo} style={{ height: '25px', width: '25px', objectFit: 'contain' }} alt="logo"/>}
                                <span style={{ fontWeight: 900, color: '#000', fontSize: '10px' }}>{schoolSettings.schoolName}</span>
                            </div>

                            <div style={{ position: 'absolute', top: `${positions.photo.top}px`, left: `${positions.photo.left}px`, width: `${positions.photo.size}px`, height: `${positions.photo.size}px` }} className="overflow-hidden border border-black/10">
                                {selectedStudent.photo ? <img src={selectedStudent.photo} className="w-full h-full object-cover" /> : <div className="bg-slate-200 w-full h-full flex items-center justify-center text-slate-400">PHOTO</div>}
                            </div>
                            <div className="font-black uppercase" style={{ position: 'absolute', top: `${positions.name.top}px`, left: `${positions.name.left}px`, fontSize: `${positions.name.size}px`, color: positions.name.color }}>{selectedStudent.fullName}</div>
                            <div className="font-bold uppercase" style={{ position: 'absolute', top: `${positions.roll.top}px`, left: `${positions.roll.left}px`, fontSize: `${positions.roll.size}px`, color: positions.roll.color }}>Roll: {selectedStudent.rollNo}</div>
                            <div className="font-bold uppercase" style={{ position: 'absolute', top: `${positions.class.top}px`, left: `${positions.class.left}px`, fontSize: `${positions.class.size}px`, color: positions.class.color }}>Class: {selectedStudent.class}</div>
                            <div className="font-black" style={{ position: 'absolute', bottom: '10px', right: '15px', fontSize: '8px', color: '#000', opacity: 0.5 }}>SESSION: {schoolSettings.session}</div>
                        </div>
                    </div>
                    <button onClick={async () => { const canvas = await html2canvas(cardRef.current, { scale: 5 }); const link = document.createElement('a'); link.download = `${selectedStudent.fullName}_ID.png`; link.href = canvas.toDataURL(); link.click(); }} className="btn-neon mt-12 px-16 py-6 flex items-center gap-4 text-sm font-black italic tracking-widest"><Download size={22}/> EXPORT HIGH-QUALITY CARD</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistration;