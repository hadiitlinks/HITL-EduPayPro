import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Save, School, MapPin, Phone, Calendar, Camera, 
  Palette, Check, Globe, Building2, Info 
} from 'lucide-react';

const Settings = ({ themes, currentTheme, onThemeChange }) => {
  const [loading, setLoading] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState({
    schoolName: '',
    address: '',
    phone: '',
    session: '',
    schoolLogo: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(doc(db, "settings", "schoolConfig")));
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Set only school related fields to local state
          setSchoolSettings({
            schoolName: data.schoolName || '',
            address: data.address || '',
            phone: data.phone || '',
            session: data.session || '',
            schoolLogo: data.schoolLogo || ''
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSchoolSettings({ ...schoolSettings, schoolLogo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Save both School Info and Current Theme to Firebase
      await setDoc(doc(db, "settings", "schoolConfig"), {
        ...schoolSettings,
        savedTheme: currentTheme // Persisting the theme object
      });
      alert("All Configurations & Theme Updated Successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-slate-300">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-2 h-10 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
          <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">System Configuration</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* LEFT COLUMN: INSTITUTE PROFILE */}
          <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-6 md:p-10 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <Building2 className="text-blue-500" size={24}/>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Institute Profile</h3>
            </div>

            <div className="space-y-8">
              {/* Logo Section */}
              <div className="flex flex-col items-center justify-center p-6 bg-black/30 rounded-[2rem] border border-white/5 relative">
                <div className="relative w-32 h-32 mb-4 group">
                  <div className="w-full h-full bg-slate-800 rounded-3xl flex items-center justify-center overflow-hidden border-2 border-dashed border-white/10 group-hover:border-blue-500/50 transition-all">
                    {schoolSettings.schoolLogo ? (
                      <img src={schoolSettings.schoolLogo} className="w-full h-full object-contain p-2" alt="Logo" />
                    ) : (
                      <School size={40} className="text-slate-700" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 p-3 bg-blue-600 rounded-xl cursor-pointer hover:bg-blue-500 shadow-xl transition-all hover:scale-110">
                    <Camera size={16} className="text-white" />
                    <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                  </label>
                </div>
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">School Logo</h4>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-2">
                    <Globe size={12}/> Institute Name
                  </label>
                  <div className="flex items-center bg-slate-950 border border-white/10 rounded-2xl px-4 focus-within:border-blue-500/50 transition-all">
                    <School size={18} className="text-slate-600" />
                    <input 
                      value={schoolSettings.schoolName || ''} 
                      onChange={e => setSchoolSettings({...schoolSettings, schoolName: e.target.value.toUpperCase()})} 
                      className="bg-transparent p-4 text-xs text-white font-bold w-full outline-none" 
                      placeholder="NAME" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-2">
                    <MapPin size={12}/> Office Address
                  </label>
                  <div className="flex items-center bg-slate-950 border border-white/10 rounded-2xl px-4">
                    <MapPin size={18} className="text-slate-600" />
                    <input 
                      value={schoolSettings.address || ''} 
                      onChange={e => setSchoolSettings({...schoolSettings, address: e.target.value})} 
                      className="bg-transparent p-4 text-xs text-white font-bold w-full outline-none" 
                      placeholder="FULL ADDRESS" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-2">
                      <Phone size={12}/> Contact
                    </label>
                    <div className="flex items-center bg-slate-950 border border-white/10 rounded-2xl px-4">
                      <Phone size={18} className="text-slate-600" />
                      <input 
                        value={schoolSettings.phone || ''} 
                        onChange={e => setSchoolSettings({...schoolSettings, phone: e.target.value})} 
                        className="bg-transparent p-4 text-xs text-white font-bold w-full outline-none" 
                        placeholder="PHONE" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-blue-400 uppercase ml-1 tracking-widest flex items-center gap-2">
                      <Calendar size={12}/> Academic Session
                    </label>
                    <div className="flex items-center bg-slate-950 border border-white/10 rounded-2xl px-4">
                      <Calendar size={18} className="text-blue-500" />
                      <input 
                        value={schoolSettings.session || ''} 
                        onChange={e => setSchoolSettings({...schoolSettings, session: e.target.value})} 
                        className="bg-transparent p-4 text-xs text-white font-bold w-full outline-none" 
                        placeholder="2025-26" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: THEME PICKER */}
          <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-6 md:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <Palette className="text-blue-500" size={24}/>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">UI Customization</h3>
            </div>
            
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-6 tracking-widest">Select System Primary Theme</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {themes && Object.keys(themes).map((name) => (
                <button 
                  key={name} 
                  onClick={() => onThemeChange(themes[name])}
                  className={`h-24 rounded-[1.5rem] border-2 flex flex-col items-center justify-center gap-2 transition-all relative ${currentTheme?.primary === themes[name].primary ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-white/5 hover:border-white/20 bg-black/20'}`}
                >
                  <div className="flex -space-x-1">
                    <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: themes[name].primary }}></div>
                    <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: themes[name].secondary }}></div>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-400">{name}</span>
                  {currentTheme?.primary === themes[name].primary && (
                    <div className="absolute top-3 right-3 text-[var(--primary)]">
                      <Check size={14} strokeWidth={4}/>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-10 p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem]">
               <div className="flex items-center gap-3 mb-2">
                 <Info size={16} className="text-blue-400"/>
                 <h4 className="text-[10px] font-black text-white uppercase italic">System Notice</h4>
               </div>
               <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                 Updates to the profile and logo will automatically reflect across the Registration and Studio modules.
               </p>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button 
          onClick={saveSettings} 
          disabled={loading} 
          className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black italic tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98]"
        >
          {loading ? "PROCESSING..." : <><Save size={20}/> DEPLOY GLOBAL CONFIGURATIONS</>}
        </button>
      </div>
    </div>
  );
};

export default Settings;