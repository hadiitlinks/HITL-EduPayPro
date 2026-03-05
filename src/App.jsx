import React, { useState, useEffect } from 'react';
import './App.css';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  Menu, X, LayoutDashboard, UserPlus, Layers, 
  Receipt, TrendingDown, Settings as SettingsIcon, LogOut 
} from 'lucide-react';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentRegistration from './components/StudentRegistration';
import ClassManager from './components/ClassManager';
import FeeManager from './components/FeeManager';
import Expenses from './components/Expenses';
import Settings from './components/Settings';

const themes = {
  emerald: { primary: '#00ff87', secondary: '#00d2ff', bg: '#020617', card: 'rgba(15, 23, 42, 0.6)', rgb: '0, 255, 135' },
  sunset: { primary: '#ff5f6d', secondary: '#ffc371', bg: '#1a0f0f', card: 'rgba(45, 20, 20, 0.6)', rgb: '255, 95, 109' },
  purple: { primary: '#a855f7', secondary: '#3b82f6', bg: '#0f0720', card: 'rgba(30, 10, 50, 0.5)', rgb: '168, 85, 247' },
  gold: { primary: '#eab308', secondary: '#f97316', bg: '#100c02', card: 'rgba(40, 30, 5, 0.6)', rgb: '234, 179, 8' },
  ocean: { primary: '#0ea5e9', secondary: '#2dd4bf', bg: '#020c1b', card: 'rgba(10, 30, 50, 0.6)', rgb: '14, 165, 233' },
  lava: { primary: '#ef4444', secondary: '#f97316', bg: '#110505', card: 'rgba(40, 10, 10, 0.6)', rgb: '239, 68, 68' },
  cyber: { primary: '#ff00ff', secondary: '#00ffff', bg: '#050505', card: 'rgba(20, 20, 20, 0.8)', rgb: '255, 0, 255' },
  forest: { primary: '#22c55e', secondary: '#84cc16', bg: '#050f05', card: 'rgba(10, 30, 10, 0.6)', rgb: '34, 197, 94' },
  carbon: { primary: '#f8fafc', secondary: '#94a3b8', bg: '#000000', card: 'rgba(20, 20, 20, 0.9)', rgb: '248, 250, 252' },
  royal: { primary: '#6366f1', secondary: '#a855f7', bg: '#06061e', card: 'rgba(15, 15, 45, 0.6)', rgb: '99, 102, 241' }
};

const App = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(themes.emerald);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });

    // Mobile Fix: Force close loading after 4 seconds
    const timeout = setTimeout(() => setAuthLoading(false), 4000);

    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  if (authLoading) {
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-t-[#00ff87] border-white/5 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black tracking-[5px] text-white/40 uppercase">Initialising Core...</p>
      </div>
    );
  }

  // Yahan redirect to Login fixed hai
  if (!user) return <Login theme={currentTheme} />;

  const themeStyles = {
    '--primary': currentTheme.primary,
    '--secondary': currentTheme.secondary,
    '--bg': currentTheme.bg,
    '--card-bg': currentTheme.card,
    '--primary-rgb': currentTheme.rgb
  };

  const navItems = [
    { id: 'Dashboard', icon: <LayoutDashboard size={18}/> },
    { id: 'Sectors', icon: <Layers size={18}/> },
    { id: 'Registration', icon: <UserPlus size={18}/> },
    { id: 'FeeManager', icon: <Receipt size={18}/> },
    { id: 'Expenses', icon: <TrendingDown size={18}/> },
    { id: 'Settings', icon: <SettingsIcon size={18}/> },
  ];

  return (
    <div style={themeStyles} className="flex h-screen bg-[var(--bg)] text-white overflow-hidden transition-colors duration-700">
      
      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[90] lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* SIDEBAR */}
      <aside className={`fixed lg:relative z-[100] h-full w-72 bg-[#050a18]/60 border-r border-white/5 transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="mb-12">
             <h1 className="text-2xl font-black italic tracking-tighter">EDUPRO<span className="text-[var(--primary)]">.</span></h1>
             <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[3px]">Enterprise OS</p>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} 
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === item.id ? 'bg-[var(--primary)] text-black shadow-[0_10px_20px_rgba(var(--primary-rgb),0.3)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                {item.icon} {item.id}
              </button>
            ))}
          </nav>

          <button onClick={() => signOut(auth)} className="mt-auto w-full flex items-center gap-4 px-6 py-4 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 rounded-2xl transition-all">
            <LogOut size={18}/> Secure Signout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative p-6 lg:p-12 pt-24 lg:pt-12 main-content">
        {/* Mobile Navbar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--bg)]/90 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-6">
          <h1 className="text-xl font-black italic">EDUPRO<span className="text-[var(--primary)]">.</span></h1>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-[var(--primary)] bg-white/5 rounded-xl">
            <Menu size={24}/>
          </button>
        </header>

        <div className="max-w-7xl mx-auto fade-in">
          {activeTab === 'Dashboard' && <Dashboard />}
          {activeTab === 'Registration' && <StudentRegistration />}
          {activeTab === 'Sectors' && <ClassManager />}
          {activeTab === 'FeeManager' && <FeeManager />}
          {activeTab === 'Expenses' && <Expenses />}
          {activeTab === 'Settings' && <Settings themes={themes} currentTheme={currentTheme} onThemeChange={setCurrentTheme} />}
        </div>
      </main>
    </div>
  );
};

export default App;