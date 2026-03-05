import React from 'react';
import { LayoutDashboard, UserPlus, Receipt, LineChart, PieChart, LogOut, Zap } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, handleLogout, userEmail }) => {
  const menuGroups = [
    {
      title: 'Management',
      items: [
        { id: 'Dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
        { id: 'Registration', label: 'Admissions', icon: <UserPlus size={18}/> },
        { id: 'FeeManager', label: 'Fee Ledger', icon: <Receipt size={18}/> },
      ]
    },
    {
      title: 'Audit & Ops',
      items: [
        { id: 'Expenses', label: 'Audit', icon: <LineChart size={18}/> },
        { id: 'Reports', label: 'Analytics', icon: <PieChart size={18}/> },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-8">
        <h1 className="text-2xl font-black text-white italic tracking-tighter glow-text">
          EDUPRO<span className="text-[#00ff87]">.</span>
        </h1>
      </div>

      {/* Navigation */}
      <div className="flex-grow px-4 space-y-8">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[3px] mb-4">{group.title}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === item.id 
                    ? 'bg-gradient-to-r from-[#00d2ff]/20 to-transparent border-l-4 border-[#00d2ff] text-white' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span className={activeTab === item.id ? 'text-[#00d2ff]' : 'text-slate-600'}>
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-6 mt-auto border-t border-white/5">
        <div className="bg-slate-900/40 p-4 rounded-xl mb-4">
          <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Active Admin</p>
          <p className="text-[10px] text-white truncate font-bold">{userEmail}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
        >
          <LogOut size={14}/> Logout System
        </button>
      </div>
    </div>
  );
};

export default Sidebar;