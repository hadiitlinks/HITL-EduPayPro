import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { 
  UserPlus, Camera, User, Save, Search, CreditCard, X, Download, Settings, 
  FileSpreadsheet, Edit3, Trash2, ImageIcon, School, Users, CheckSquare, Square, Eye, EyeOff, UploadCloud, Printer
} from 'lucide-react';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const StudentRegistration = () => {
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
  const [selectedBatch, setSelectedBatch] = useState([]);

  // --- Main Settings (Fetched from Central Settings) ---
  const [schoolSettings, setSchoolSettings] = useState({
    session: '2025-26',
    schoolLogo: '',
    schoolName: 'INSTITUTE NAME',
    address: 'INSTITUTE ADDRESS',
    phone: '0000-0000000'
  });

  const [formData, setFormData] = useState({
    serialNo: '', regNo: '', fullName: '', fatherName: '', gender: 'Male',
    parentPhone: '', rollNo: '', class: '', originalFee: 0, discount: 0,
    monthlyFee: 0, address: '', dob: '', photo: '',
    registrationDate: new Date().toISOString().split('T')[0]
  });

  // --- ID Card Studio States ---
  const [cardSize, setCardSize] = useState({ width: 86, height: 54 }); 
  const [cardSample, setCardSample] = useState(null);
  const [visibility, setVisibility] = useState({
    name: true, roll: true, class: true, father: true, address: true, photo: true, schoolName: true, schoolLogo: true
  });
  const [positions, setPositions] = useState({
    name: { top: 110, left: 140, size: 18, color: '#000000' },
    roll: { top: 150, left: 140, size: 12, color: '#444444' },
    class: { top: 170, left: 140, size: 12, color: '#444444' },
    father: { top: 190, left: 140, size: 12, color: '#444444' },
    address: { top: 210, left: 140, size: 10, color: '#666666' },
    photo: { top: 60, left: 30, size: 90 },
    schoolName: { top: 10, left: 80, size: 20, color: '#000000' },
    schoolLogo: { top: 5, left: 10, size: 50 }
  });

  const cardRef = useRef();

  useEffect(() => {
    fetchMainSettings();
    fetchStudioLayout();
    fetchData();
  }, []);

  useEffect(() => {
    if (!isEditing) generateAutoNumbers();
  }, [students, schoolSettings.session, isEditing]);

  const fetchData = async () => {
    const qClasses = query(collection(db, "classes"), orderBy("className", "asc"));
    const classSnap = await getDocs(qClasses);
    // Sort classes alphabetically for the filter
    const classList = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setClasses(classList.sort((a, b) => a.className.localeCompare(b.className, undefined, {numeric: true})));

    const qStudents = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const studentSnap = await getDocs(qStudents);
    setStudents(studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchMainSettings = async () => {
    const docSnap = await getDoc(doc(db, "settings", "schoolConfig"));
    if (docSnap.exists()) setSchoolSettings(docSnap.data());
  };

  const fetchStudioLayout = async () => {
    const docSnap = await getDoc(doc(db, "settings", "idStudioLayout"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      setPositions(prev => ({ ...prev, ...data.positions }));
      setVisibility(prev => ({ ...prev, ...data.visibility }));
      setCardSize(data.cardSize || { width: 86, height: 54 });
      setCardSample(data.cardSample);
    }
  };

  const saveStudioLayout = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "idStudioLayout"), {
        positions, visibility, cardSize, cardSample
      });
      alert("Studio Layout Saved Successfully!");
    } catch (e) { alert("Save failed"); }
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

  // --- Excel Import/Export Functions ---
  const downloadTemplate = () => {
    const template = [{ "Full Name": "", "Father Name": "", "Class": "", "Roll No": "", "Parent Phone": "", "Address": "", "DOB": "YYYY-MM-DD" }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Student_Import_Template.xlsx");
  };

  const exportFilteredStudents = () => {
    const filtered = students.filter(s => 
        (s.fullName || "").toLowerCase().includes(listSearch.toLowerCase()) && 
        (filterClass === 'All' ? true : s.class === filterClass)
    );
    
    const data = filtered.map(s => ({
        "Reg No": s.regNo,
        "Roll No": s.rollNo,
        "Full Name": s.fullName,
        "Father Name": s.fatherName,
        "Class": s.class,
        "Phone": s.parentPhone,
        "Address": s.address,
        "Fee": s.monthlyFee
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `Students_Export_${filterClass}.xlsx`);
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      
      setLoading(true);
      const batch = writeBatch(db);
      json.forEach((row, index) => {
        const newDoc = doc(collection(db, "students"));
        batch.set(newDoc, {
          fullName: (row["Full Name"] || "").toUpperCase(),
          fatherName: (row["Father Name"] || "").toUpperCase(),
          class: row["Class"] || "",
          rollNo: row["Roll No"] || "",
          parentPhone: row["Parent Phone"] || "",
          address: row["Address"] || "",
          dob: row["DOB"] || "",
          serialNo: (students.length + index + 1).toString(),
          regNo: `REG-${schoolSettings.session}-${(students.length + index + 1).toString().padStart(3, '0')}`,
          createdAt: new Date(),
          status: 'active'
        });
      });
      await batch.commit();
      fetchData();
      setLoading(false);
      alert("Import Successful!");
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        fullName: formData.fullName.toUpperCase(),
        fatherName: formData.fatherName.toUpperCase(),
        updatedAt: new Date(),
      };
      if (isEditing && selectedStudent?.id) {
        await updateDoc(doc(db, "students", selectedStudent.id), dataToSave);
      } else {
        await addDoc(collection(db, "students"), { ...dataToSave, createdAt: new Date(), status: 'active' });
      }
      resetForm();
      fetchData();
      alert("Student Saved Successfully!");
    } catch (err) { alert("Error saving student."); }
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 p-3 md:p-6 font-sans">
      
      {/* Header Section (Settings Button Removed as per instructions) */}
      <header className="flex flex-col md:flex-row items-center justify-between bg-slate-900/60 p-5 rounded-[2rem] border border-white/10 mb-8 gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden">
            {schoolSettings.schoolLogo ? <img src={schoolSettings.schoolLogo} className="w-full h-full object-contain" alt="Logo" /> : <School size={28}/>}
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black text-white italic tracking-tighter uppercase">{schoolSettings.schoolName}</h1>
            <p className="text-[10px] font-black text-blue-400 tracking-widest uppercase">Session: {schoolSettings.session}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-white/5 max-w-md mx-auto mb-8 shadow-2xl">
        <button onClick={() => setActiveTab('registration')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'registration' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500'}`}>
          <UserPlus size={14}/> ADMISSION
        </button>
        <button onClick={() => setActiveTab('students')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500'}`}>
          <Users size={14}/> DATABASE
        </button>
      </nav>

      {activeTab === 'registration' ? (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
          <div className="bg-slate-900/40 border border-white/5 p-5 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-xl font-black text-white italic uppercase flex items-center gap-3">
                <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div> {isEditing ? 'Edit Student' : 'Student Enrollment'}
              </h2>
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={downloadTemplate} className="flex-1 md:flex-none text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-5 py-3 rounded-xl uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                  <FileSpreadsheet size={16} className="inline mr-2"/> Template
                </button>
                <label className="flex-1 md:flex-none text-[10px] font-black bg-emerald-600 text-white px-5 py-3 rounded-xl cursor-pointer text-center uppercase tracking-widest hover:bg-emerald-500 transition-all">
                  <UploadCloud size={16} className="inline mr-2"/> Import
                  <input type="file" hidden accept=".xlsx, .xls" onChange={handleImportExcel}/>
                </label>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="md:col-span-2 lg:col-span-3">
                <div className="relative w-full h-32 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center hover:bg-white/5 transition-all group cursor-pointer">
                  <input type="file" accept="image/*" onChange={(e) => {
                    const reader = new FileReader();
                    reader.onload = () => setFormData({...formData, photo: reader.result});
                    reader.readAsDataURL(e.target.files[0]);
                  }} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {formData.photo ? <img src={formData.photo} className="h-24 w-24 object-cover rounded-2xl" alt="Preview" /> : <Camera className="text-slate-600 group-hover:text-blue-500" />}
                  <p className="text-[9px] font-black uppercase mt-2 text-slate-500">Upload Photo</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Serial & Reg #</label>
                <div className="flex gap-2">
                  <input value={formData.serialNo} onChange={e => setFormData({...formData, serialNo: e.target.value})} className="w-20 bg-slate-950 border border-white/10 p-3.5 rounded-xl text-white font-bold text-xs" />
                  <input value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value})} className="flex-1 bg-slate-950 border border-white/10 p-3.5 rounded-xl text-slate-400 font-bold text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Full Name *</label>
                <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-white font-bold text-xs uppercase" placeholder="NAME" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Father Name *</label>
                <input required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-white font-bold text-xs uppercase" placeholder="FATHER" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Parent Phone *</label>
                <input required value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-white font-bold text-xs" placeholder="PHONE" />
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Class Assignment</label>
                <input value={searchTerm} onFocus={() => setShowDropdown(true)} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-white font-bold text-xs uppercase" placeholder="SELECT CLASS" />
                {showDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-xl max-h-40 overflow-auto">
                    {classes.map(c => <div key={c.id} onClick={() => { setFormData({...formData, class: c.className, originalFee: c.monthlyFee, monthlyFee: c.monthlyFee - formData.discount}); setSearchTerm(c.className); setShowDropdown(false); }} className="p-3 text-[10px] font-black uppercase text-white hover:bg-blue-600 cursor-pointer">{c.className}</div>)}
                  </div>
                )}
              </div>

              <div className="space-y-1"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Roll No</label><input value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-white font-bold text-xs" /></div>

              <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-blue-500/5 p-5 rounded-[2rem] border border-blue-500/10">
                  <label className="text-[9px] font-black text-blue-400 uppercase">Monthly Scholarship (Disc)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-bold text-white/50">Rs.</span>
                    <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value, monthlyFee: formData.originalFee - e.target.value})} className="bg-transparent border-none text-2xl font-black text-white w-full" />
                  </div>
                </div>
                <div className="bg-emerald-500/5 p-5 rounded-[2rem] border border-emerald-500/10">
                  <label className="text-[9px] font-black text-emerald-400 uppercase">Net Payable Fee</label>
                  <div className="text-2xl font-black text-white italic mt-1">Rs. {formData.monthlyFee}</div>
                </div>
              </div>

              <button disabled={loading} className="md:col-span-2 lg:col-span-3 mt-6 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black italic tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all flex items-center justify-center gap-3">
                {loading ? "SAVING..." : <><Save size={18}/> FINALIZE ENROLLMENT</>}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Database List */
        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex flex-col md:flex-row gap-3 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
            <div className="flex-1 flex items-center bg-slate-950 px-4 py-3 rounded-xl border border-white/10 gap-3">
              <Search size={16} className="text-slate-500"/>
              <input value={listSearch} onChange={e => setListSearch(e.target.value)} className="bg-transparent text-[10px] font-black text-white outline-none w-full" placeholder="SEARCH STUDENT..." />
            </div>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full md:w-48 bg-slate-950 text-[10px] font-black text-white p-3 rounded-xl border border-white/10 uppercase">
              <option value="All">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.className}>{c.className}</option>)}
            </select>
            <button onClick={exportFilteredStudents} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-500">
                <FileSpreadsheet size={16}/> Export List
            </button>
          </div>

          {selectedBatch.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 p-3 rounded-2xl shadow-2xl flex items-center gap-4 z-[100] border border-white/20">
              <span className="text-[10px] font-black text-white pl-4 pr-2">{selectedBatch.length} SELECTED</span>
              <button onClick={batchDelete} className="p-2.5 bg-red-500 rounded-xl"><Trash2 size={18}/></button>
              <button onClick={() => setSelectedBatch([])} className="p-2.5 text-white/50"><X size={18}/></button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {students.filter(s => (s.fullName || "").toLowerCase().includes(listSearch.toLowerCase()) && (filterClass === 'All' ? true : s.class === filterClass)).map(s => (
              <div key={s.id} className="bg-slate-900/80 border border-white/5 rounded-3xl p-4 relative group hover:border-blue-500/50 transition-all">
                <button onClick={() => toggleSelect(s.id)} className="absolute top-4 right-4 z-10 text-blue-500">
                   {selectedBatch.includes(s.id) ? <CheckSquare size={20}/> : <Square size={20} className="text-slate-700"/>}
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                    {s.photo ? <img src={s.photo} className="w-full h-full object-cover" alt="Student" /> : <User className="w-full h-full p-4 text-slate-800"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-white uppercase italic truncate">{s.fullName}</h4>
                    <p className="text-[9px] font-bold text-slate-500 truncate">F: {s.fatherName}</p>
                    <div className="flex gap-2 mt-1">
                        <span className="text-[8px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded uppercase">{s.class}</span>
                        <span className="text-[8px] font-black bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Roll: {s.rollNo}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-black/20 p-2 rounded-xl border border-white/5">
                    <p className="text-[9px] font-black text-slate-400 flex items-center gap-2">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full"></div> {s.parentPhone || "No Phone"}
                    </p>
                </div>
                
                <div className="flex justify-around mt-4 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { setFormData({...s}); setIsEditing(true); setActiveTab('registration'); }} className="text-blue-400 hover:scale-110 transition-transform"><Edit3 size={16}/></button>
                   <button onClick={() => { setSelectedStudent(s); setShowID(true); }} className="text-emerald-400 hover:scale-110 transition-transform"><CreditCard size={16}/></button>
                   <button onClick={async () => { if(window.confirm('Delete student?')) { await deleteDoc(doc(db, "students", s.id)); fetchData(); } }} className="text-red-400 hover:scale-110 transition-transform"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ID Card Studio */}
      {showID && selectedStudent && (
        <div className="fixed inset-0 z-[200] bg-[#020617] flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-80 bg-slate-900 border-r border-white/10 p-5 overflow-y-auto custom-scroll">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black italic text-xs uppercase tracking-widest">ID Card Studio</h3>
                <button onClick={() => setShowID(false)} className="text-red-500"><X/></button>
             </div>

             <div className="space-y-4 mb-6">
               <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <label className="text-[9px] font-black text-slate-500 uppercase">1. Background Template</label>
                  <label className="flex items-center justify-center gap-2 p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl mt-2 cursor-pointer">
                    <ImageIcon size={16}/> <span className="text-[9px] font-black">Upload Background</span>
                    <input type="file" hidden accept="image/*" onChange={e => {
                      const reader = new FileReader();
                      reader.onload = () => setCardSample(reader.result);
                      reader.readAsDataURL(e.target.files[0]);
                    }} />
                  </label>
               </div>

               {/* Field Controllers */}
               {['schoolName', 'schoolLogo', 'name', 'roll', 'class', 'father', 'address', 'photo'].map(field => (
                  <div key={field} className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-2">
                     <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-blue-400 uppercase italic">{field}</span>
                       <button onClick={() => setVisibility({...visibility, [field]: !visibility[field]})} className="text-slate-500">
                         {visibility[field] ? <Eye size={16}/> : <EyeOff size={16}/>}
                       </button>
                     </div>
                     {visibility[field] && (
                        <div className="grid grid-cols-3 gap-1">
                          <div className="space-y-1">
                              <p className="text-[7px] text-slate-500 uppercase">Top</p>
                              <input type="number" value={positions[field].top} onChange={e => setPositions({...positions, [field]: {...positions[field], top: parseInt(e.target.value)}})} className="w-full bg-slate-800 p-2 rounded text-[9px] text-white" />
                          </div>
                          <div className="space-y-1">
                              <p className="text-[7px] text-slate-500 uppercase">Left</p>
                              <input type="number" value={positions[field].left} onChange={e => setPositions({...positions, [field]: {...positions[field], left: parseInt(e.target.value)}})} className="w-full bg-slate-800 p-2 rounded text-[9px] text-white" />
                          </div>
                          <div className="space-y-1">
                              <p className="text-[7px] text-slate-500 uppercase">Size</p>
                              <input type="number" value={positions[field].size} onChange={e => setPositions({...positions, [field]: {...positions[field], size: parseInt(e.target.value)}})} className="w-full bg-slate-800 p-2 rounded text-[9px] text-white" />
                          </div>
                        </div>
                     )}
                  </div>
               ))}
             </div>
             
             <button onClick={saveStudioLayout} className="w-full py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black italic uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
               <Save size={16}/> Save Layout Settings
             </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 relative">
              <div ref={cardRef} style={{ width: `${cardSize.width}mm`, height: `${cardSize.height}mm`, position: 'relative', overflow: 'hidden', backgroundColor: '#fff' }} className="shadow-2xl rounded-xl">
                {cardSample && <img src={cardSample} className="absolute inset-0 w-full h-full object-fill z-0" alt="Card BG" />}
                
                <div className="relative z-10 w-full h-full font-sans">
                  {/* School Logo */}
                  {visibility.schoolLogo && schoolSettings.schoolLogo && (
                      <div style={{ position: 'absolute', top: positions.schoolLogo.top, left: positions.schoolLogo.left, width: positions.schoolLogo.size, height: positions.schoolLogo.size }}>
                          <img src={schoolSettings.schoolLogo} className="w-full h-full object-contain" alt="Logo" />
                      </div>
                  )}

                  {/* School Name */}
                  {visibility.schoolName && (
                      <div style={{ position: 'absolute', top: positions.schoolName.top, left: positions.schoolName.left, fontSize: positions.schoolName.size, color: positions.schoolName.color }} className="font-black uppercase whitespace-nowrap">
                          {schoolSettings.schoolName}
                      </div>
                  )}

                  {/* Student Photo */}
                  {visibility.photo && (
                    <div style={{ position: 'absolute', top: positions.photo.top, left: positions.photo.left, width: positions.photo.size, height: positions.photo.size }} className="border border-black/10 overflow-hidden bg-slate-100">
                      {selectedStudent.photo ? <img src={selectedStudent.photo} className="w-full h-full object-cover" alt="Student" /> : <User className="w-full h-full p-4 text-slate-300" />}
                    </div>
                  )}

                  {visibility.name && <div style={{ position: 'absolute', top: positions.name.top, left: positions.name.left, fontSize: positions.name.size, color: positions.name.color }} className="font-black uppercase">{selectedStudent.fullName}</div>}
                  {visibility.roll && <div style={{ position: 'absolute', top: positions.roll.top, left: positions.roll.left, fontSize: positions.roll.size, color: positions.roll.color }} className="font-bold">Roll: {selectedStudent.rollNo}</div>}
                  {visibility.class && <div style={{ position: 'absolute', top: positions.class.top, left: positions.class.left, fontSize: positions.class.size, color: positions.class.color }} className="font-bold">Class: {selectedStudent.class}</div>}
                  {visibility.father && <div style={{ position: 'absolute', top: positions.father.top, left: positions.father.left, fontSize: positions.father.size, color: positions.father.color }} className="font-bold uppercase">Father: {selectedStudent.fatherName}</div>}
                  {visibility.address && <div style={{ position: 'absolute', top: positions.address.top, left: positions.address.left, fontSize: positions.address.size, color: positions.address.color }} className="font-medium">{selectedStudent.address}</div>}
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button onClick={async () => { const canvas = await html2canvas(cardRef.current, { scale: 5 }); const link = document.createElement('a'); link.download = `${selectedStudent.fullName}.png`; link.href = canvas.toDataURL(); link.click(); }} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black italic text-xs tracking-widest shadow-2xl flex items-center gap-3 hover:bg-blue-500">
                  <Download size={20}/> Export PNG
                </button>
              </div>
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