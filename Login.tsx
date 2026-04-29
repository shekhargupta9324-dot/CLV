import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2, TrendingUp, AlertCircle, CheckCircle2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, useMotionValue, useSpring, useTransform, Variants, AnimatePresence } from 'framer-motion';

// A simple floating dust/particle effect component
function Particles() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number }>>([]);
  
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber-200/40 blur-[1px]"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [0, -100 - p.y],
            x: [0, Math.random() * 50 - 25],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

const TextReveal = ({ text, className = "", delayOffset = 0 }: { text: string; className?: string; delayOffset?: number }) => {
  const words = text.split(" ");
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({ opacity: 1, transition: { staggerChildren: 0.12, delayChildren: delayOffset * i } }),
  };
  const child: Variants = {
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 12, stiffness: 100 } },
    hidden: { opacity: 0, y: 30, transition: { type: "spring", damping: 12, stiffness: 100 } },
  };
  return (
    <motion.div style={{ overflow: "hidden", display: "flex", flexWrap: "wrap", gap: "0.25rem" }} variants={container} initial="hidden" animate="visible" className={className}>
      {words.map((word, index) => (
        <motion.span variants={child} style={{ display: "inline-block" }} key={index}>{word}</motion.span>
      ))}
    </motion.div>
  );
};

export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithMicrosoft, register, isLoading, error, clearError } = useAuth();

  // Login mode: 'viewer' | 'admin' | 'semi-admin' | 'analyst' (default to viewer)
  const [loginMode, setLoginMode] = useState<'viewer' | 'admin' | 'semi-admin' | 'analyst' | null>('viewer');

  // Tab: 'signin' | 'signup'
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  // Sign-in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign-up fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Clear errors when switching tabs
  const switchTab = (t: 'signin' | 'signup') => {
    clearError();
    setRegisterSuccess(false);
    setTab(t);
  };

  // Parallax Mouse Tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 2);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);
  const bgX = useTransform(smoothX, [-1, 1], ["2%", "-2%"]);
  const bgY = useTransform(smoothY, [-1, 1], ["2%", "-2%"]);
  const fgX = useTransform(smoothX, [-1, 1], ["-15px", "15px"]);
  const fgY = useTransform(smoothY, [-1, 1], ["-15px", "15px"]);
  const fgScale = useTransform(smoothX, [-1, 0, 1], [1.02, 1, 1.02]);

  // --- Handlers ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login({ email, password });
    if (success) {
      toast.success('Welcome aboard! 🏴‍☠️');
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (regPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    const success = await register(regName, regEmail, regPassword);
    if (success) {
      setRegisterSuccess(true);
      toast.success('Account created! Please verify your email.');
    }
  };

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  };

  const handleMicrosoftLogin = async () => {
    await loginWithMicrosoft();
  };

  return (
    <div className="min-h-screen flex bg-stone-950 font-serif overflow-hidden">

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden">
        <motion.div
          className="absolute -inset-10 bg-cover bg-center"
          style={{ backgroundImage: "url('/bg-left.png')", x: bgX, y: bgY, scale: 1.05 }}
        />
        <div className="absolute inset-0 bg-cyan-900/10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <Particles />

        <motion.div className="relative z-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} style={{ x: fgX, y: fgY }}>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-white tracking-wider drop-shadow-lg flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-amber-300" />
              CLV Predictor AI 👒
            </span>
          </div>
        </motion.div>

        <motion.div className="space-y-8 relative z-10 mt-auto mb-16" style={{ x: fgX, y: fgY, scale: fgScale }}>
          <TextReveal text="Predict Customer Lifetime Value with AI-Powered Analytics" className="text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-xl" delayOffset={0.2} />
          <motion.p initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, duration: 0.8 }} className="text-xl text-cyan-50 font-medium drop-shadow-md bg-stone-900/40 p-4 rounded-xl backdrop-blur-sm border border-white/10">
            Make data-driven decisions with advanced machine learning models. Understand your customers better and maximize revenue.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.8 }}>
            <p className="text-xs font-bold tracking-widest text-white/80 uppercase mb-2">Navigational Data Grid</p>
            <div className="grid grid-cols-2 gap-6 relative">
              <motion.div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-2xl relative overflow-hidden group hover:bg-white/30 transition-colors">
                <div className="absolute right-0 bottom-0 opacity-50 text-6xl translate-x-1/4 translate-y-1/4 group-hover:-translate-x-2 group-hover:-translate-y-2 transition-transform duration-500">🧭</div>
                <p className="text-4xl font-bold text-white drop-shadow">83 - 87%</p>
                <p className="text-sm text-cyan-100 font-medium mt-1">Target Accuracy</p>
              </motion.div>
              <motion.div className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/30 shadow-2xl relative overflow-hidden group hover:bg-white/30 transition-colors">
                <div className="absolute right-0 bottom-0 opacity-80 text-6xl translate-x-1/4 translate-y-1/4 drop-shadow-lg group-hover:-translate-x-2 group-hover:-translate-y-2 transition-transform duration-500">🧊</div>
                <p className="text-4xl font-bold text-white drop-shadow">v1.0</p>
                <p className="text-sm text-cyan-100 font-medium mt-1">Initial Release</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Panel - Login / Register */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative shadow-[inset_20px_0_50px_rgba(0,0,0,0.5)] z-10 overflow-hidden">

        <motion.div
          className="absolute -inset-10 bg-cover bg-center"
          style={{ backgroundImage: "url('/bg-right.png')", scale: 1.05, x: useTransform(smoothX, [-1, 1], ["1%", "-1%"]), y: useTransform(smoothY, [-1, 1], ["1%", "-1%"]) }}
        />
        <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-[2px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
          style={{ x: useTransform(smoothX, [-1, 1], ["10px", "-10px"]), y: useTransform(smoothY, [-1, 1], ["10px", "-10px"]) }}
          className="w-full max-w-md space-y-5 relative z-10 bg-[#3a2312]/95 p-8 rounded-3xl border-[4px] border-[#221208] shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
        >
          {/* Wood texture overlay */}
          <div className="absolute inset-0 opacity-40 rounded-3xl mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/wood-pattern.png')" }} />

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-4 relative z-10">
            <span className="text-3xl font-bold text-[#e8c396] tracking-wider drop-shadow-lg flex items-center justify-center gap-2">
              <TrendingUp className="h-8 w-8 text-amber-500" />
              CLV Predictor 👒
            </span>
          </div>

          {/* Show login mode selector if not selected */}
          {loginMode === null && (
            <div className="relative z-10 space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#f4d0a4] drop-shadow-md">Select Login Option</h2>
                <p className="mt-2 text-sm text-[#b08b68] font-medium">Choose your account type</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'admin', label: '👑 Sign in as Admin', desc: 'Full system access', color: 'from-purple-600 to-purple-700' },
                  { id: 'semi-admin', label: '🛡️ Sign in as Semi-Admin', desc: 'Admin-level access (read-only super admin)', color: 'from-purple-500 to-purple-600' },
                  { id: 'analyst', label: '📊 Sign in as Analyst', desc: 'Data analysis access', color: 'from-blue-600 to-blue-700' },
                  { id: 'viewer', label: '👁️ Viewer Sign in', desc: 'View-only access', color: 'from-slate-600 to-slate-700' },
                ].map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLoginMode(option.id as any)}
                    className="w-full text-left py-4 px-4 rounded-xl border-[3px] border-[#3e2413] bg-gradient-to-r transition-all duration-300"
                    style={{
                      background: `linear-gradient(to right, ${option.id === 'admin' || option.id === 'semi-admin' ? '#2d1810' : '#1f1810'}, #2a1810)`,
                      borderColor: option.id === 'admin' ? '#9333ea' : option.id === 'semi-admin' ? '#a855f7' : option.id === 'analyst' ? '#3b82f6' : '#64748b'
                    }}
                  >
                    <div className="font-bold text-[#f4d0a4] text-lg">{option.label}</div>
                    <div className="text-xs text-[#8b6848]">{option.desc}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Back to Login Options Button - Only show when NOT on viewer (default) */}
          {loginMode !== null && loginMode !== 'viewer' && (
            <button
              onClick={() => {
                setLoginMode('viewer');
                setTab('signin');
                clearError();
              }}
              className="text-xs text-[#8b6848] hover:text-[#e8c396] transition-colors relative z-10"
            >
              ← Back to Viewer Login
            </button>
          )}

          {/* Tab Switcher - Only for Viewer */}
          {loginMode === 'viewer' && (
            <div className="relative z-10 flex bg-[#221208] rounded-xl p-1 gap-1">
              <button
                onClick={() => setTab('signin')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${tab === 'signin' ? 'bg-gradient-to-b from-[#6b4226] to-[#4a2e1b] text-[#f4d0a4] shadow-md' : 'text-[#8b6848] hover:text-[#e8c396]'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('signup')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${tab === 'signup' ? 'bg-gradient-to-b from-[#6b4226] to-[#4a2e1b] text-[#f4d0a4] shadow-md' : 'text-[#8b6848] hover:text-[#e8c396]'}`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div key="error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 p-4 rounded-lg bg-red-950/80 border border-red-800 relative z-10">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============ ADMIN/SEMI-ADMIN/ANALYST LOGIN FORMS ============ */}
          <AnimatePresence mode="wait">
            {(loginMode === 'admin' || loginMode === 'semi-admin' || loginMode === 'analyst') && (
              <motion.div key="restricted" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5 relative z-10">

                <div className="text-center lg:text-left">
                  {loginMode === 'admin' && (
                    <>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent drop-shadow-md">Admin Portal</h2>
                      <p className="mt-1 text-sm text-purple-200 font-medium tracking-wide">Full system access & user management</p>
                    </>
                  )}
                  {loginMode === 'semi-admin' && (
                    <>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent drop-shadow-md">Semi-Admin Portal</h2>
                      <p className="mt-1 text-sm text-purple-200 font-medium tracking-wide">Admin-level access with limited privileges</p>
                    </>
                  )}
                  {loginMode === 'analyst' && (
                    <>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent drop-shadow-md">Analyst Dashboard</h2>
                      <p className="mt-1 text-sm text-blue-200 font-medium tracking-wide">Data analysis & predictions</p>
                    </>
                  )}
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label htmlFor={`admin-email-${loginMode}`} className="block text-sm font-bold text-slate-300">Email address</label>
                    <div className="mt-1.5 relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-xl">✉️</span></div>
                      <input
                        id={`admin-email-${loginMode}`} type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} required
                        className="block w-full pl-10 pr-4 py-3 rounded border-[3px] bg-[#1a0f08] text-[#f4d0a4] placeholder-[#8b6848] focus:ring-0 transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                        placeholder="you@example.com"
                        style={{
                          borderColor: '#64748b'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`admin-password-${loginMode}`} className="block text-sm font-bold text-slate-300">Password</label>
                    <div className="mt-1.5 relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-xl">🗝️</span></div>
                      <input
                        id={`admin-password-${loginMode}`} type={showPassword ? 'text' : 'password'} value={password}
                        onChange={(e) => setPassword(e.target.value)} required
                        className="block w-full pl-10 pr-12 py-3 rounded border-[3px] bg-[#1a0f08] text-[#f4d0a4] placeholder-[#8b6848] focus:ring-0 transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                        placeholder="••••••••"
                        style={{
                          borderColor: '#64748b'
                        }}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {showPassword ? <EyeOff className="h-5 w-5 text-[#8b6848] hover:text-[#d4af37] transition-colors" /> : <Eye className="h-5 w-5 text-[#8b6848] hover:text-[#d4af37] transition-colors" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ y: -4, boxShadow: "0 10px 20px rgba(0,0,0,0.6)" }}
                    whileTap={{ y: 2, scale: 0.98 }}
                    type="submit" disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded border-[3px] text-white font-extrabold uppercase tracking-widest shadow-lg transition-all disabled:opacity-50"
                    style={{
                      background: loginMode === 'analyst' ? 'linear-gradient(to bottom, #3b82f6, #1d4ed8)' : 'linear-gradient(to bottom, #7c3aed, #6d28d9)',
                      borderColor: loginMode === 'analyst' ? '#1e3a8a' : '#4c0519'
                    }}
                  >
                    {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" />Signing In...</> : <><span className="text-xl">{loginMode === 'analyst' ? '📊' : '👑'}</span> Sign In</>}
                  </motion.button>
                </form>

                <p className="text-center text-xs text-slate-400">Note: Admin & Semi-Admin roles are assigned by system administrators only.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============ VIEWER SIGN IN/SIGN UP PANEL ============ */}
          <AnimatePresence mode="wait">
            {loginMode === 'viewer' && (
              <motion.div key="signin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5 relative z-10">

                <div className="text-center lg:text-left">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-400 to-slate-300 bg-clip-text text-transparent drop-shadow-md">Viewer Portal</h2>
                  <p className="mt-1 text-sm text-slate-200 font-medium tracking-wide">Sign in to access insights</p>
                </div>

                {/* Social logins — disabled / coming soon */}
                <div className="space-y-3">
                  {[
                    { label: 'Continue with Google', icon: <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>, handler: handleGoogleLogin, bg: 'bg-gradient-to-b from-[#6b4226] to-[#4a2e1b]', iconBg: 'bg-[#1f1107] border-[#3e2413]' },
                    { label: 'Continue with Microsoft', icon: <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>, handler: handleMicrosoftLogin, bg: 'bg-gradient-to-b from-[#5c2a26] to-[#3a1a17]', iconBg: 'bg-[#1f0e0c] border-[#3e1b17]' },
                  ].map(({ label, icon, handler, bg, iconBg }) => (
                    <div key={label} className="relative">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handler}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-[3px] border-[#2a170a] ${bg} shadow-lg text-[#f4d0a4] opacity-60 cursor-not-allowed`}
                      >
                        <span className={`${iconBg} p-1.5 rounded-md border`}>{icon}</span>
                        <span className="text-sm font-bold tracking-wide">{label}</span>
                      </motion.button>
                      <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase shadow">Coming Soon</span>
                    </div>
                  ))}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#6b4226]" /></div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#3a2312] text-[#e8c396] font-medium tracking-wide">Or continue with email 🤏</span>
                  </div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-slate-300">Email address</label>
                    <div className="mt-1.5 relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-xl">✉️</span></div>
                      <input
                        id="email" type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} required
                        className="block w-full pl-10 pr-4 py-3 rounded border-[3px] bg-[#1a0f08] text-[#f4d0a4] placeholder-[#8b6848] focus:ring-0 transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                        placeholder="you@example.com"
                        style={{
                          borderColor: '#64748b'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-bold text-slate-300">Password</label>
                    <div className="mt-1.5 relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-xl">🗝️</span></div>
                      <input
                        id="password" type={showPassword ? 'text' : 'password'} value={password}
                        onChange={(e) => setPassword(e.target.value)} required
                        className="block w-full pl-10 pr-12 py-3 rounded border-[3px] bg-[#1a0f08] text-[#f4d0a4] placeholder-[#8b6848] focus:ring-0 transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                        placeholder="••••••••"
                        style={{
                          borderColor: '#64748b'
                        }}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {showPassword ? <EyeOff className="h-5 w-5 text-[#8b6848] hover:text-[#d4af37] transition-colors" /> : <Eye className="h-5 w-5 text-[#8b6848] hover:text-[#d4af37] transition-colors" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer group">
                      <input type="checkbox" className="h-4 w-4 rounded border-[#8b5a2b] bg-[#1a0f08] text-[#d4af37] focus:ring-0 focus:ring-offset-0 cursor-pointer" />
                      <span className="ml-2 text-sm font-medium text-[#e8c396] group-hover:text-[#f4d0a4]">Remember me</span>
                    </label>
                    <a href="#" className="text-sm font-bold text-[#d4af37] hover:text-[#f4d0a4] transition-colors">Forgot password?</a>
                  </div>

                  <motion.button
                    whileHover={{ y: -4, boxShadow: "0 10px 20px rgba(0,0,0,0.6)" }}
                    whileTap={{ y: 2, scale: 0.98 }}
                    type="submit" disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded border-[3px] text-white font-extrabold uppercase tracking-widest shadow-lg transition-all disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(to bottom, #475569, #334155)',
                      borderColor: '#0f172a'
                    }}
                  >
                    {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" />Boarding...</> : <><span className="text-xl">👁️</span> Sign In</>}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ============ SIGN UP PANEL ============ */}
            {loginMode === 'viewer' && tab === 'signup' && (
              <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="space-y-5 relative z-10">

                <div className="text-center lg:text-left">
                  <h2 className="text-2xl font-bold text-slate-300 drop-shadow-md">Create a Viewer Account</h2>
                  <p className="mt-1 text-sm text-slate-400 font-medium tracking-wide">Join as a viewer and access insights. Analyst & Admin roles are assigned by administrators only.</p>
                </div>

                {/* Success state */}
                <AnimatePresence>
                  {registerSuccess && (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 p-5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-center">
                      <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                      <p className="text-sm font-bold text-emerald-300">Account created successfully!</p>
                      <p className="text-xs text-emerald-400/80">
                        Your account for <span className="font-bold text-emerald-300">{regEmail}</span> is ready.<br />
                        You can sign in immediately.
                      </p>
                      <button
                        onClick={() => setTab('signin')}
                        className="mt-2 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold transition-colors"
                      >
                        Go to Sign In →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!registerSuccess && (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label htmlFor="reg-name" className="block text-sm font-bold text-slate-300">Full Name</label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-[#8b6848]" /></div>
                        <input
                          id="reg-name" type="text" value={regName}
                          onChange={(e) => setRegName(e.target.value)} required
                          className="block w-full pl-10 pr-4 py-3 rounded border-[3px] border-[#8b5a2b] bg-[#1a0f08] text-[#f4d0a4] placeholder-[#8b6848] focus:ring-0 focus:border-[#d4af37] transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                          placeholder="Your full name"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="reg-email" className="block text-sm font-bold text-slate-300">Email address</label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-xl">✉️</span></div>
                        <input
                          id="reg-email" type="email" value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)} required
                          className="block w-full pl-10 pr-4 py-3 rounded border-[3px] border-[#8b5a2b] bg-[#1a0f08] text-[#f4d0a4] placeholder-[#8b6848] focus:ring-0 focus:border-[#d4af37] transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="reg-password" className="block text-sm font-bold text-slate-300">Password <span className="text-[#8b6848] font-normal">(min 8 chars)</span></label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-xl">🗝️</span></div>
                        <input
                          id="reg-password" type={showRegPassword ? 'text' : 'password'} value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)} required minLength={8}
                          className="block w-full pl-10 pr-12 py-3 rounded border-[3px] border-[#8b5a2b] bg-[#1a0f08] text-[#f4d0a4] placeholder-[#8b6848] focus:ring-0 focus:border-[#d4af37] transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          {showRegPassword ? <EyeOff className="h-5 w-5 text-[#8b6848] hover:text-[#d4af37] transition-colors" /> : <Eye className="h-5 w-5 text-[#8b6848] hover:text-[#d4af37] transition-colors" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="reg-confirm" className="block text-sm font-bold text-slate-300">Confirm Password</label>
                      <div className="mt-1.5 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-xl">🔒</span></div>
                        <input
                          id="reg-confirm" type="password" value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)} required
                          className={`block w-full pl-10 pr-4 py-3 rounded border-[3px] bg-[#1a0f08] text-[#f4d0a4] placeholder-[#8b6848] focus:ring-0 transition-all ${regConfirmPassword && regConfirmPassword !== regPassword ? 'border-red-700 focus:border-red-500' : 'border-[#8b5a2b] focus:border-[#d4af37] focus:shadow-[0_0_15px_rgba(212,175,55,0.4)]'}`}
                          placeholder="••••••••"
                        />
                      </div>
                      {regConfirmPassword && regConfirmPassword !== regPassword && (
                        <p className="mt-1 text-xs text-red-400">Passwords don&apos;t match</p>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ y: -4, boxShadow: "0 10px 20px rgba(0,0,0,0.6)" }}
                      whileTap={{ y: 2, scale: 0.98 }}
                      type="submit" disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded border-[3px] border-[#1f1107] bg-gradient-to-b from-[#4a5568] to-[#2d3748] text-white font-extrabold uppercase tracking-widest shadow-[0_6px_0_#1a202c,0_15px_20px_rgba(0,0,0,0.4)] transition-all disabled:opacity-50"
                    >
                      {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" />Creating...</> : <><span className="text-xl">⚓</span> Create Account</>}
                    </motion.button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Other Roles Section - Always visible when on Viewer */}
          {loginMode === 'viewer' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative z-10 pt-4 border-t border-[#6b4226]/30">
              <p className="text-xs text-[#8b6848] text-center mb-3 font-medium">Other Login Options</p>
              <div className="space-y-2">
                {[
                  { id: 'admin', label: '👑 Admin', color: '#9333ea' },
                  { id: 'semi-admin', label: '🛡️ Semi-Admin', color: '#a855f7' },
                  { id: 'analyst', label: '📊 Analyst', color: '#3b82f6' },
                ].map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLoginMode(option.id as any)}
                    className="w-full py-2 px-3 rounded-lg border-[2px] text-sm font-bold transition-all"
                    style={{
                      background: `${option.color}15`,
                      borderColor: option.color,
                      color: option.color
                    }}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
