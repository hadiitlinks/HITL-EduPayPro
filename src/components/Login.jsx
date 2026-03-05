import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Lock, Mail, Zap, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("Invalid Credentials! Please check your email or password.");
    }
    setLoading(false);
  };

  return (
    <div className="h-screen w-full bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[var(--secondary)]/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-white/5 rounded-3xl mb-6 border border-white/10 shadow-2xl">
            <ShieldCheck size={40} className="text-[var(--primary)]" />
          </div>
          <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase">
            EDUPRO<span className="text-[var(--primary)]">.</span>OS
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[5px] mt-2">Central Management Portal</p>
        </div>

        <div className="neon-card p-10 border border-white/5 backdrop-blur-2xl bg-white/[0.02]">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Access Node</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@edupro.com"
                  className="w-full bg-slate-900/60 p-4 pl-12 rounded-2xl text-white border border-white/5 outline-none focus:border-[var(--primary)] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Passkey</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/60 p-4 pl-12 rounded-2xl text-white border border-white/5 outline-none focus:border-[var(--primary)] transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-black py-5 rounded-2xl font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(var(--primary-rgb),0.3)] group transition-all"
            >
              {loading ? 'Decrypting Access...' : (
                <>
                  <Zap size={18} className="group-hover:animate-pulse" /> 
                  Initiate System Login
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
          Authorized Personnel Only • v3.0.4
        </p>
      </div>
    </div>
  );
};

export default Login;