import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { 
  UserPlus, Camera, GraduationCap, Phone, 
  User, Calendar, Save, Image as ImageIcon, Plus, Search, Hash, Wallet, CreditCard, X, Download, Move, Type, Upload, Settings
} from 'lucide-react';
import html2canvas from 'html2canvas';

const StudentRegistration = () => {
  // --- States ---
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [listSearch, setListSearch] = useState(''); 
  const [showDropdown, setShowDropdown] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showID, setShowID] = useState(false);

  // --- ID Card Customization States ---
  const [cardSize, setCardSize] = useState({ width: 100, height: 60 }); // in mm
  const [solidBgColor, setSolidBgColor] = useState('#ffffff');
  const [customBg, setCustomBg] = useState(null);
  const [positions, setPositions] = useState({
    name: { top: 110, left: 140, size: 18, color: '#000000' },
    roll: { top: 150, left: 140, size: 12, color: '#444444' },
    class: { top: 170, left: 140, size: 12, color: '#444444' },
    father: { top: 190, left: 140, size: 12, color: '#444444' },
    photo: { top: 60, left: 30, size: 90 }
  });

  // --- Form Data (Restored All Fields) ---
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    rollNo: '',
    regNo: '',
    class: '',
    monthlyFee: '0',
    parentPhone: '',
    dob: '',
    photo: '',
    registrationDate: new Date().toISOString().split('T')[0]
  });

  const cardRef = useRef();

  // --- Data Fetching ---
  const fetchData = async () => {
    try {
      const qClasses = query(collection(db, "classes"), orderBy("className", "asc"));
      const classSnap = await getDocs(qClasses);
      setClasses(classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const qStudents = query(collection(db, "students"), orderBy("createdAt", "desc"));
      const studentSnap = await getDocs(qStudents);
      setStudents(studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const schoolSnap = await getDoc(doc(db, "settings", "schoolProfile"));
      if (schoolSnap.exists()) setSchoolInfo(schoolSnap.data());
    } catch (err) { console.error("Error fetching data:", err); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Event Handlers ---
  const handleClassSelect = (selectedClass) => {
    setFormData({ 
      ...formData, 
      class: selectedClass.className || '', 
      monthlyFee: selectedClass.monthlyFee || '0' 
    });
    setSearchTerm(selectedClass.className || '');
    setShowDropdown(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleCustomBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCustomBg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.class || !formData.rollNo) return alert("Please fill Name, Roll No and Class.");
    setLoading(true);
    try {
      await addDoc(collection(db, "students"), {
        ...formData,
        fullName: formData.fullName.toUpperCase(),
        fatherName: formData.fatherName.toUpperCase(),
        createdAt: new Date(),
        status: 'active',
        remainingBalance: 0
      });
      alert("Student Registered Successfully!");
      setFormData({
        fullName: '', fatherName: '', rollNo: '', regNo: '', class: '', 
        monthlyFee: '0', parentPhone: '', dob: '', photo: '',
        registrationDate: new Date().toISOString().split('T')[0]
      });
      setSearchTerm('');
      fetchData();
    } catch (err) { alert("Error saving student record."); }
    setLoading(false);
  };

  const updatePos = (field, key, value) => {
    setPositions(prev => ({
      ...prev,
      [field]: { ...prev[field], [key]: key === 'color' ? value : parseInt(value) }
    }));
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 4, useCORS: true });
    const link = document.createElement('a');
    link.download = `${selectedStudent.fullName}_ID_Card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const filteredClasses = classes.filter(c => (c.className || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredStudents = students.filter(s => (s.fullName || "").toLowerCase().includes(listSearch.toLowerCase()));

  return (
    <div className="fade-in space-y-12 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        {/* --- FULL RESTORED REGISTRATION FORM --- */}
        <div className="neon-card p-8 md:p-10 border border-white/5">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)]"><UserPlus size={28}/></div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Admission Hub</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[3px] mt-1 italic">Protocol 2.0 Enrollment</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[9px] font-black uppercase text-[var(--primary)] ml-1 tracking-widest">Biometric Photo</label>
              <div className="relative border-2 border-dashed border-white/5 rounded-2xl p-6 text-center hover:bg-[var(--primary)]/5 transition-all">
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                {formData.photo ? (
                  <div className="flex items-center justify-center gap-3">
                    <img src={formData.photo} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-[var(--primary)]" />
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">Image Loaded</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center"><Camera className="text-slate-600 mb-2" size={24}/><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Scan Picture</p></div>
                )}
              </div>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-[9px] font-black uppercase text-[var(--primary)] ml-1 tracking-widest">Student Full Name *</label>
              <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="FULL NAME" className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-[var(--primary)]" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Father's Name *</label>
              <input required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} placeholder="FATHER NAME" className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-[var(--primary)]" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Contact # *</label>
              <input required value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} placeholder="03xx-xxxxxxx" className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-[var(--primary)]" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Roll # *</label>
              <input required value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} placeholder="101" className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-[var(--primary)]" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Reg #</label>
              <input value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value})} placeholder="REG-2026" className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-[var(--primary)]" />
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[9px] font-black uppercase text-[var(--primary)] ml-1 tracking-widest">Class Selection *</label>
              <input type="text" value={searchTerm} onFocus={() => setShowDropdown(true)} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search Class..." className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-[var(--primary)]" />
              {showDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-[#020617] border border-white/10 rounded-xl max-h-40 overflow-y-auto">
                  {filteredClasses.map(c => (
                    <div key={c.id} onClick={() => handleClassSelect(c)} className="p-3 hover:bg-[var(--primary)]/10 text-white text-[10px] font-black cursor-pointer border-b border-white/5 uppercase">{c.className}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Date of Birth</label>
              <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-[var(--primary)]" />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-[9px] font-black uppercase text-yellow-500 ml-1 tracking-widest">Monthly Fee Allocation</label>
              <div className="flex items-center bg-slate-800/50 p-4 rounded-xl border border-white/5 text-white">
                <Wallet size={16} className="mr-3 text-yellow-500"/><span className="font-black italic text-lg">Rs. {formData.monthlyFee}</span>
              </div>
            </div>

            <button disabled={loading} className="btn-neon col-span-2 py-5 mt-4 flex items-center justify-center gap-3">{loading ? 'Saving...' : <><Save size={20}/> Complete Registration</>}</button>
          </form>
        </div>

        {/* --- STUDENT DIRECTORY --- */}
        <div className="space-y-6">
          <div className="neon-card p-6 flex items-center gap-4 border border-white/5">
            <Search className="text-slate-500" size={20}/><input placeholder="Filter Students..." className="bg-transparent w-full text-white outline-none font-bold uppercase text-[10px]" value={listSearch} onChange={(e) => setListSearch(e.target.value)}/>
          </div>
          <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[600px] custom-scroll">
            {filteredStudents.map(student => (
              <div key={student.id} className="neon-card p-5 border border-white/5 flex items-center justify-between group hover:border-[var(--primary)]/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden border border-white/10">{student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-700 mx-auto mt-3" />}</div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase italic">{student.fullName}</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Roll: {student.rollNo} • {student.class}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedStudent(student); setShowID(true); }} className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl hover:bg-[var(--primary)] hover:text-black transition-all"><CreditCard size={18}/></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- ID CARD STUDIO MODAL (SOLID BACKGROUND FIX) --- */}
      {showID && selectedStudent && (
        <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8">
            
            {/* Control Sidebar */}
            <div className="lg:w-80 space-y-6 bg-slate-900 p-6 rounded-[2rem] border border-white/10 h-fit shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-black uppercase text-xs flex items-center gap-2">
                  <Settings size={14}/> ID Design Lab
                </h3>
                <button onClick={() => setShowID(false)} className="text-red-500 hover:scale-125 transition-all"><X/></button>
              </div>

              {/* Card Dimension Controls */}
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Card Dimensions (mm)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-500 uppercase">Width</label>
                    <input type="number" value={cardSize.width} onChange={(e) => setCardSize({...cardSize, width: e.target.value})} className="bg-slate-800 text-white text-[10px] p-2 w-full rounded border border-white/10 focus:border-[var(--primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-slate-500 uppercase">Height</label>
                    <input type="number" value={cardSize.height} onChange={(e) => setCardSize({...cardSize, height: e.target.value})} className="bg-slate-800 text-white text-[10px] p-2 w-full rounded border border-white/10 focus:border-[var(--primary)]" />
                  </div>
                </div>
              </div>

              {/* Background Style Selection */}
              <div className="space-y-4">
                <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Background Style</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white">Solid Color</span>
                      <input type="color" value={solidBgColor} onChange={(e) => {setSolidBgColor(e.target.value); setCustomBg(null);}} className="w-8 h-8 bg-transparent cursor-pointer rounded overflow-hidden" />
                    </div>
                    <div className="relative border border-dashed border-white/20 p-4 rounded-lg text-center cursor-pointer hover:bg-white/5">
                      <Upload size={14} className="mx-auto text-slate-500 mb-1"/><span className="text-[8px] text-slate-400">Upload Image Base</span>
                      <input type="file" onChange={handleCustomBgUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Precise Field Customizers */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scroll">
                {['name', 'roll', 'class', 'father', 'photo'].map(field => (
                  <div key={field} className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3 shadow-inner">
                    <p className="text-[10px] font-black uppercase text-[var(--primary)] flex items-center justify-between">
                      {field} <span>{field === 'photo' ? 'Size' : 'Font'}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={positions[field].left} onChange={(e) => updatePos(field, 'left', e.target.value)} className="bg-slate-800 text-white text-[10px] p-2 rounded border border-white/10" placeholder="X Pos" />
                      <input type="number" value={positions[field].top} onChange={(e) => updatePos(field, 'top', e.target.value)} className="bg-slate-800 text-white text-[10px] p-2 rounded border border-white/10" placeholder="Y Pos" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input type="range" min="8" max="150" value={positions[field].size} onChange={(e) => updatePos(field, 'size', e.target.value)} className="flex-1 accent-[var(--primary)]" />
                      {field !== 'photo' && <input type="color" value={positions[field].color} onChange={(e) => updatePos(field, 'color', e.target.value)} className="w-6 h-6 bg-transparent rounded cursor-pointer" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview Display Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-black/60 rounded-[3rem] shadow-inner relative min-h-[70vh]">
              <div className="absolute top-8 text-center">
                <h2 className="text-white font-black uppercase text-lg italic tracking-tighter">Live Card Compositor</h2>
                <p className="text-slate-500 text-[9px] uppercase tracking-[5px] mt-1">What you see is what you download</p>
              </div>

              <div 
                ref={cardRef}
                style={{ 
                  width: `${cardSize.width}mm`,
                  height: `${cardSize.height}mm`,
                  backgroundImage: customBg ? `url(${customBg})` : 'none',
                  backgroundColor: customBg ? 'transparent' : solidBgColor,
                  backgroundSize: '100% 100%'
                }}
                className="relative shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-lg border border-black/10"
              >
                {!customBg && !solidBgColor && <div className="absolute inset-0 flex items-center justify-center opacity-10 font-black uppercase text-[8px] tracking-[10px]">No BG Set</div>}

                {/* Photo Layer */}
                <div className="absolute" style={{ top: `${positions.photo.top}px`, left: `${positions.photo.left}px` }}>
                   <div style={{ width: `${positions.photo.size}px`, height: `${positions.photo.size}px` }} className="bg-slate-100 border-2 border-white/50 rounded-lg overflow-hidden shadow-lg">
                      <img src={selectedStudent.photo || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
                   </div>
                </div>

                {/* Dynamic Data Layers */}
                <div className="absolute font-black uppercase leading-none whitespace-nowrap" style={{ top: `${positions.name.top}px`, left: `${positions.name.left}px`, fontSize: `${positions.name.size}px`, color: positions.name.color }}>{selectedStudent.fullName}</div>
                <div className="absolute font-bold uppercase leading-none whitespace-nowrap" style={{ top: `${positions.roll.top}px`, left: `${positions.roll.left}px`, fontSize: `${positions.roll.size}px`, color: positions.roll.color }}>Roll: {selectedStudent.rollNo}</div>
                <div className="absolute font-bold uppercase leading-none whitespace-nowrap" style={{ top: `${positions.class.top}px`, left: `${positions.class.left}px`, fontSize: `${positions.class.size}px`, color: positions.class.color }}>Class: {selectedStudent.class}</div>
                <div className="absolute font-bold uppercase leading-none whitespace-nowrap" style={{ top: `${positions.father.top}px`, left: `${positions.father.left}px`, fontSize: `${positions.father.size}px`, color: positions.father.color }}>S/O: {selectedStudent.fatherName}</div>
              </div>

              <div className="mt-16 flex items-center gap-6">
                 <button onClick={downloadCard} className="px-16 py-6 bg-[var(--primary)] text-black font-black uppercase text-xs rounded-2xl flex items-center gap-4 shadow-[0_20px_40px_rgba(0,210,255,0.2)] hover:scale-105 transition-all">
                   <Download size={24}/> Generate High-Res Image
                 </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistration;