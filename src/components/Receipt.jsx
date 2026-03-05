import React, { useRef } from 'react';
import { Printer, CheckCircle, Calendar, User, Hash, Wallet, Shield } from 'lucide-react';

const Receipt = ({ data }) => {
  const receiptRef = useRef();

  // Agar data nahi hai to empty state dikhayein
  if (!data) return (
    <div className="gold-card p-10 text-center border-dashed border-2 border-white/5">
      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
        <Hash className="text-slate-700" size={30} />
      </div>
      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[4px]">
        No Transaction Selected for Receipt
      </p>
    </div>
  );

  const handlePrint = () => {
    const content = receiptRef.current.innerHTML;
    const win = window.open('', '', 'height=800,width=600');
    win.document.write('<html><head><title>Fee Receipt</title>');
    win.document.write('<script src="https://cdn.tailwindcss.com"></script>');
    win.document.write('</head><body class="bg-white">');
    win.document.write(content);
    win.document.write('</body></html>');
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  return (
    <div className="fade-in space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center px-2">
        <h4 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[5px]">Digital Receipt Preview</h4>
        <button onClick={handlePrint} className="btn-gold px-6 py-2 flex items-center gap-2 text-[10px]">
          <Printer size={16}/> Print Slip
        </button>
      </div>

      <div ref={receiptRef} className="bg-white p-1 pb-1">
        {/* RECEIPT DESIGN */}
        <div className="border-[3px] border-double border-[#D4AF37] p-8 bg-white relative overflow-hidden">
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-12">
            <Shield size={400} />
          </div>

          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-[#D4AF37]/20 pb-6 mb-8 relative">
            <div>
              <h1 className="text-3xl font-black italic text-black leading-none">EDUPRO <span className="text-[#D4AF37]">PAY</span></h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[3px] mt-1">Premium Education Management</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-black uppercase">Receipt No: <span className="text-[#D4AF37]">#RES-{Math.floor(Math.random()*9000)+1000}</span></p>
              <p className="text-[9px] font-medium text-slate-400 mt-1">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 gap-8 mb-10 relative">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User size={14} className="text-[#D4AF37]"/>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Student Name</p>
                  <p className="text-sm font-black text-black uppercase">{data.studentName || 'Student Name'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Hash size={14} className="text-[#D4AF37]"/>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Class / Grade</p>
                  <p className="text-sm font-black text-black uppercase">{data.class || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar size={14} className="text-[#D4AF37]"/>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fee Month</p>
                  <p className="text-sm font-black text-black uppercase">{data.month || 'Current Month'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wallet size={14} className="text-[#D4AF37]"/>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</p>
                  <p className="text-sm font-black text-black uppercase">Cash / Online</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Table */}
          <div className="border-t border-b border-slate-100 py-6 mb-8 relative">
            <div className="flex justify-between mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase">Description</span>
              <span className="text-[10px] font-black text-slate-500 uppercase">Amount</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-medium text-black italic">Monthly Tuition & Resource Fee</p>
              <p className="text-sm font-black text-black tracking-tighter">Rs. {data.amountPaid}</p>
            </div>
            {data.fine > 0 && (
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-medium text-slate-400">Late Fine / Charges</p>
                <p className="text-sm font-black text-slate-400">Rs. {data.fine}</p>
              </div>
            )}
          </div>

          {/* Grand Total Footer */}
          <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl relative">
            <div>
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle size={14}/>
                <span className="text-[9px] font-black uppercase tracking-widest">Payment Status: PAID</span>
              </div>
              <p className="text-[8px] text-slate-400 uppercase font-bold">Remaining Balance: Rs. {data.balanceLeft || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Total Received</p>
              <p className="text-3xl font-black text-black italic tracking-tighter">Rs. {data.amountPaid}</p>
            </div>
          </div>

          {/* Bottom Message */}
          <div className="mt-10 text-center border-t border-dashed border-slate-200 pt-6">
            <p className="text-[8px] text-slate-400 uppercase font-bold tracking-[4px] mb-2">Thank you for choosing quality education</p>
            <div className="flex justify-center gap-4">
               <div className="w-12 h-1 bg-[#D4AF37]/20"></div>
               <div className="w-12 h-1 bg-[#D4AF37]/20"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;