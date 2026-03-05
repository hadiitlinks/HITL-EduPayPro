import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, updateDoc, limit } from 'firebase/firestore';
import { 
  UserPlus, Camera, User, Save, Search, CreditCard, X, Download, Settings, MapPin, 
  Percent, Hash, FileSpreadsheet, Edit3, Trash2, Upload
} from 'lucide-react';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const StudentRegistration = () => {
  // --- States ---
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [listSearch, setListSearch] = useState(''); 
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showID, setShowID] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- Form Data with New Fields ---
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

  // --- ID Card Customization States (Same as your old code) ---
  const [cardSize, setCardSize] = useState({ width: 100, height: 60 });
  const [solidBgColor, setSolidBgColor] = useState('#ffffff');
  const [customBg, setCustomBg] = useState(null);
  const [positions, setPositions] = useState({
    name: { top: 110, left: 140, size: 18, color: '#000000' },
    roll: { top: 150, left: 140, size: 12, color: '#444444' },
    class: { top: 170, left: 140, size: 12, color: '#444444' },
    father: { top: 190, left: 140, size: 12, color: '#444444' },
    photo: { top: 60, left: 30, size: 90 }
  });

  const cardRef = useRef();

  useEffect(() => {
    fetchData();
    generateAutoNumbers();
  }, []);

  const fetchData = async () => {
    const qClasses = query(collection(db, "classes"), orderBy("className", "asc"));
    const classSnap = await getDocs(qClasses);
    setClasses(classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    const qStudents = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const studentSnap = await getDocs(qStudents);
    setStudents(studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const generateAutoNumbers = async () => {
    if (isEditing) return;
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"), limit(1));
    const snap = await getDocs(q);
    let nextNum = 1;
    if (!snap.empty) {
      const lastStudent = snap.docs[0].data();
      nextNum = (parseInt(lastStudent.serialNo) || 0) + 1;
    }
    setFormData(prev => ({
      ...prev,
      serialNo: nextNum.toString(),
      regNo: `REG-${new Date().getFullYear()}-${nextNum.toString().padStart(3, '0')}`
    }));
  };

  // --- Handlers ---
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
        updatedAt: new Date(),
      };

      if (isEditing && selectedStudent?.id) {
        await updateDoc(doc(db, "students", selectedStudent.id), dataToSave);
        alert("Student Updated!");
      } else {
        await addDoc(collection(db, "students"), { ...dataToSave, createdAt: new Date(), status: 'active' });
        alert("Student Registered!");
      }
      resetForm();
      fetchData();
      generateAutoNumbers();
    } catch (err) { alert("Error saving data."); }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Excel Logic ---
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{
      FullName: "", FatherName: "", RollNo: "", RegNo: "", 
      Class: "", Gender: "Male", Phone: "", Address: ""
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Student_Import_Template.xlsx");
  };

  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname]);
      
      setLoading(true);
      for (let item of data) {
        await addDoc(collection(db, "students"), {
          fullName: item.FullName?.toUpperCase() || "N/A",
          fatherName: item.FatherName?.toUpperCase() || "N/A",
          rollNo: item.RollNo?.toString() || "",
          regNo: item.RegNo?.toString() || "",
          class: item.Class || "",
          gender: item.Gender || "Male",
          parentPhone: item.Phone?.toString() || "",
          address: item.Address || "",
          monthlyFee: 0,
          createdAt: new Date(),
          status: 'active'
        });
      }
      setLoading(false);
      alert("Excel Imported Successfully!");
      fetchData();
    };
    reader.readAsBinaryString(file);
  };

  // ID Card Functions (Restored)
  const downloadCard = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 4, useCORS: true });
    const link = document.createElement('a');
    link.download = `${selectedStudent.fullName}_ID_Card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Safe Search Logic
  const filteredStudents = students.filter(s => 
    (s.fullName || "").toLowerCase().includes(listSearch.toLowerCase()) ||
    (s.rollNo || "").toLowerCase().includes(listSearch.toLowerCase()) ||
    (s.fatherName || "").toLowerCase().includes(listSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-10">
      {/* Action Bar */}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5">
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="btn-neon py-2 px-4 text-[10px] flex items-center gap-2 bg-green-600/20 text-green-500 border-green-500/30">
            <Download size={14}/> Template
          </button>
          <label className="btn-neon py-2 px-4 text-[10px] flex items-center gap-2 cursor-pointer">
            <FileSpreadsheet size={14}/> Import Excel
            <input type="file" hidden accept=".xlsx, .xls" onChange={handleExcelImport} />
          </label>
        </div>
        {isEditing && (
          <button onClick={resetForm} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-[10px] font-bold uppercase border border-red-500/20">Cancel Edit</button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Form - 2 Columns on medium+ */}
        <div className="xl:col-span-8 neon-card p-6 border border-white/5">
          <h3 className="text-xl font-black text-white mb-6 uppercase italic flex items-center gap-3">
            <UserPlus className="text-[var(--primary)]"/> {isEditing ? "Update Student" : "New Enrollment"}
          </h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Serial & Reg #</label>
              <div className="grid grid-cols-2 gap-2">
                <input value={formData.serialNo} onChange={e => setFormData({...formData, serialNo: e.target.value})} className="bg-slate-900/50 p-3 rounded-xl text-white border border-white/10" placeholder="Serial" />
                <input value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value})} className="bg-slate-900/50 p-3 rounded-xl text-white border border-white/10" placeholder="Reg #" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Gender</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-900/50 p-3 rounded-xl text-white border border-white/10">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-widest">Full Name</label>
              <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-900/50 p-3 rounded-xl text-white border border-white/10" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Father Name</label>
              <input required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full bg-slate-900/50 p-3 rounded-xl text-white border border-white/10" />
            </div>

            <div className="relative space-y-1">
              <label className="text-[10px] text-[var(--primary)] font-bold uppercase">Class Selection</label>
              <input value={searchTerm} onFocus={() => setShowDropdown(true)} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/50 p-3 rounded-xl text-white border border-[var(--primary)]/30" placeholder="Search..." />
              {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-white/10 rounded-xl max-h-40 overflow-auto">
                  {classes.filter(c => (c.className || "").toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                    <div key={c.id} onClick={() => handleClassSelect(c)} className="p-3 hover:bg-[var(--primary)]/10 text-white cursor-pointer text-xs uppercase font-bold">{c.className}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Roll #</label>
              <input required value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})} className="w-full bg-slate-900/50 p-3 rounded-xl text-white border border-white/10" />
            </div>

            <div className="bg-slate-800/30 p-3 rounded-xl border border-white/5 flex gap-4 md:col-span-1">
               <div className="flex-1">
                 <label className="text-[8px] text-slate-500 uppercase font-bold">Discount</label>
                 <input type="number" value={formData.discount} onChange={e => handleDiscountChange(e.target.value)} className="w-full bg-transparent text-white font-bold outline-none text-sm" />
               </div>
               <div className="flex-1 border-l border-white/10 pl-3">
                 <label className="text-[8px] text-yellow-500 uppercase font-bold">Net Monthly Fee</label>
                 <div className="text-sm font-black text-white">Rs. {formData.monthlyFee}</div>
               </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Contact Phone</label>
              <input value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full bg-slate-900/50 p-3 rounded-xl text-white border border-white/10" placeholder="03xx-xxxxxxx" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Home Address</label>
              <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-900/50 p-3 rounded-xl text-white border border-white/10 h-20 outline-none" />
            </div>

            <button disabled={loading} className="md:col-span-2 btn-neon py-4 mt-2 flex items-center justify-center gap-3">
              <Save size={18}/> {loading ? 'Processing...' : (isEditing ? 'Update Record' : 'Register Student')}
            </button>
          </form>
        </div>

        {/* Directory / Search Section */}
        <div className="xl:col-span-4 space-y-4">
           <div className="neon-card p-4 border border-white/5">
              <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl">
                <Search size={16} className="text-slate-500"/>
                <input placeholder="Search Name/Roll/Father..." className="bg-transparent text-white text-xs outline-none w-full font-bold uppercase" value={listSearch} onChange={e => setListSearch(e.target.value)}/>
              </div>
           </div>
           <div className="grid gap-3 overflow-y-auto max-h-[600px] pr-2 custom-scroll">
              {filteredStudents.map(s => (
                <div key={s.id} className="neon-card p-4 border border-white/5 hover:border-[var(--primary)]/40 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 overflow-hidden border border-white/10">
                      {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <User size={16} className="text-slate-700 mx-auto mt-3" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase italic">{s.fullName}</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">S/O: {s.fatherName}</p>
                      <p className="text-[8px] text-[var(--primary)] font-bold">{s.class} | Roll: {s.rollNo}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(s)} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><Edit3 size={14}/></button>
                    <button onClick={() => {setSelectedStudent(s); setShowID(true);}} className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-black"><CreditCard size={14}/></button>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* ID Card Modal (Same UI from your old code but with selectedStudent safeguard) */}
      {showID && selectedStudent && (
        <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col p-6 overflow-y-auto">
           {/* ... (Use the same ID Studio Modal code from your previous version) ... */}
           <div className="flex justify-end p-4"><button onClick={() => setShowID(false)} className="text-white bg-red-600 px-4 py-2 rounded-lg">Close Studio</button></div>
           <div className="flex-1 flex items-center justify-center">
             <div 
               ref={cardRef}
               style={{ 
                 width: `${cardSize.width}mm`, height: `${cardSize.height}mm`,
                 backgroundColor: solidBgColor, backgroundImage: customBg ? `url(${customBg})` : 'none',
                 backgroundSize: '100% 100%'
               }}
               className="relative shadow-2xl rounded-lg overflow-hidden"
             >
                <div className="absolute font-black uppercase" style={{ top: `${positions.name.top}px`, left: `${positions.name.left}px`, fontSize: `${positions.name.size}px`, color: positions.name.color }}>{selectedStudent.fullName}</div>
                <div className="absolute font-bold" style={{ top: `${positions.roll.top}px`, left: `${positions.roll.left}px`, fontSize: `${positions.roll.size}px`, color: positions.roll.color }}>Roll: {selectedStudent.rollNo}</div>
                <div className="absolute font-bold" style={{ top: `${positions.class.top}px`, left: `${positions.class.left}px`, fontSize: `${positions.class.size}px`, color: positions.class.color }}>Class: {selectedStudent.class}</div>
             </div>
           </div>
           <div className="flex justify-center mt-6">
             <button onClick={downloadCard} className="btn-neon px-8 py-4 flex items-center gap-2"><Download/> Download Card</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistration;