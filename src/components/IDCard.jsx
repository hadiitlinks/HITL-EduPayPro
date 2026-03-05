import React, { useRef } from 'react';
import { Printer, X, User, Phone, MapPin, QrCode } from 'lucide-react';

const IDCard = ({ student, school, onClose }) => {
  const cardRef = useRef();

  const handlePrint = () => {
    const content = cardRef.current.innerHTML;
    const win = window.open('', '', 'height=500,width=800');
    win.document.write('<html><head><title>ID Card</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white">');
    win.document.write(content);
    win.document.write('</body></html>');
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-lg relative animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute -top-12 right-0 text-white opacity-50 hover:opacity-100 transition-opacity">
            <X size={32}/>
        </button>

        {/* Card Design */}
        <div ref={cardRef} className="bg-white w-[400px] h-[250px] mx-auto rounded-3xl overflow-hidden shadow-2xl flex border border-slate-100 relative text-slate-900">
          
          {/* Sidebar / Photo Area */}
          <div className="w-1/3 bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)]"></div>
             <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 mb-4 text-[var(--primary)]">
                <User size={40}/>
             </div>
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[3px]">STUDENT</p>
             <div className="mt-4 opacity-20"><QrCode size={40} className="text-white"/></div>
          </div>

          {/* Main Info Area */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
               <h1 className="text-xl font-black italic tracking-tighter leading-none mb-1 text-[var(--primary)]">{school.name || 'EDUPRO'}</h1>
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{school.address}</p>
            </div>

            <div className="space-y-1">
               <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">{student.fullName}</h2>
               <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase">Roll No</p>
                     <p className="text-xs font-black">{student.rollNo}</p>
                  </div>
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase">Class</p>
                     <p className="text-xs font-black">{student.class}</p>
                  </div>
               </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
               <div className="flex items-center gap-2 text-slate-400">
                  <Phone size={10}/> <span className="text-[9px] font-bold">{school.phone}</span>
               </div>
               <div className="w-12 h-4 bg-slate-200 rounded animate-pulse opacity-20"></div>
            </div>
          </div>

          {/* Vertical Badge Strip */}
          <div className="absolute top-0 right-4 w-8 h-12 bg-[var(--primary)] rounded-b-lg flex items-center justify-center text-black">
             <span className="[writing-mode:vertical-lr] text-[8px] font-black uppercase tracking-tighter">Verified</span>
          </div>
        </div>

        <div className="mt-8 flex gap-4 justify-center">
           <button onClick={handlePrint} className="px-10 py-4 bg-[var(--primary)] text-black rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
              <Printer size={18}/> Print Identity Card
           </button>
        </div>
      </div>
    </div>
  );
};

export default IDCard;