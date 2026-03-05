import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Palette, Building2, Save, Check, Globe, PhoneCall } from 'lucide-react';

const Settings = ({ themes, currentTheme, onThemeChange }) => {
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'EDUPRO ACADEMY',
    address: 'Sector 4, Main Road, City',
    phone: '+92 300 1234567',
  });

  useEffect(() => {
    const loadSettings = async () => {
      const snap = await getDoc(doc(db, "settings", "schoolProfile"));
      if (snap.exists()) setSchoolInfo(snap.data());
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    await setDoc(doc(db, "settings", "schoolProfile"), schoolInfo);
    alert("System Configurations Updated!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 fade-in pb-20">
      
      {/* THEME PICKER */}
      <div className="neon-card p-10 border border-white/5 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-10">
          <Palette className="text-[var(--primary)]" size={24}/>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Color Schemes</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.keys(themes).map((name) => (
            <button key={name} onClick={() => onThemeChange(themes[name])}
              className={`h-24 rounded-[1.5rem] border-2 flex flex-col items-center justify-center gap-2 transition-all relative ${currentTheme.primary === themes[name].primary ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-white/5 hover:border-white/20'}`}
              style={{ backgroundColor: themes[name].bg }}>
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: themes[name].primary }}></div>
                <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: themes[name].secondary }}></div>
              </div>
              <span className="text-[8px] font-black uppercase text-slate-500">{name}</span>
              {currentTheme.primary === themes[name].primary && <div className="absolute top-2 right-2 text-[var(--primary)]"><Check size={14}/></div>}
            </button>
          ))}
        </div>
      </div>

      {/* IDENTITY CONFIG */}
      <div className="neon-card p-10 border-t-4 border-t-[var(--primary)]">
        <div className="flex items-center gap-4 mb-10">
          <Building2 className="text-[var(--primary)]" size={24}/>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">School Profile</h3>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={12}/> Institute Name</label>
            <input value={schoolInfo.name} onChange={e => setSchoolInfo({...schoolInfo, name: e.target.value.toUpperCase()})} className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-[var(--primary)]" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Building2 size={12}/> Address</label>
            <input value={schoolInfo.address} onChange={e => setSchoolInfo({...schoolInfo, address: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-[var(--primary)]" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><PhoneCall size={12}/> Contact</label>
            <input value={schoolInfo.phone} onChange={e => setSchoolInfo({...schoolInfo, phone: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-xl text-white border border-white/10 outline-none focus:border-[var(--primary)]" />
          </div>
          <button onClick={saveSettings} className="btn-neon w-full py-5 flex items-center justify-center gap-3">
            <Save size={20}/> Save Configurations
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;