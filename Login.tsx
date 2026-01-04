import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight, Lock, Unlock, Sparkles } from 'lucide-react';
import { getStoredPassword, setStoredPassword, verifyPassword } from '../services/storageService';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = getStoredPassword();
    if (!stored) {
      setIsSetupMode(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      triggerError('Mật khẩu quá ngắn (tối thiểu 4 ký tự)');
      return;
    }

    setIsLoading(true);

    // Simulate a brief delay for UX smoothness
    setTimeout(() => {
      if (isSetupMode) {
        if (password !== confirmPassword) {
          triggerError('Mật khẩu xác nhận không khớp');
          setIsLoading(false);
          return;
        }
        setStoredPassword(password);
        onLogin();
      } else {
        if (verifyPassword(password)) {
          onLogin();
        } else {
          triggerError('Mật khẩu không đúng');
          setIsLoading(false);
        }
      }
    }, 800);
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FDFCFE] dark:bg-slate-950 flex items-center justify-center font-sans">
      {/* CSS3 Animated Background Blobs */}
      <style>{`
        @keyframes float {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
        .blob {
          position: absolute;
          filter: blur(80px);
          opacity: 0.6;
          animation: float 10s infinite ease-in-out;
          z-index: 0;
        }
        .blob-1 { top: -10%; left: -10%; width: 500px; height: 500px; background: #fb7185; animation-delay: 0s; }
        .blob-2 { bottom: -10%; right: -10%; width: 500px; height: 500px; background: #818cf8; animation-delay: 2s; }
        .blob-3 { top: 40%; left: 40%; width: 300px; height: 300px; background: #f472b6; animation-delay: 4s; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }
        .dark .glass-card {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
        .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>

      {/* Background Elements */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {/* Main Card */}
      <div className={`glass-card relative z-10 w-full max-w-md p-8 rounded-[2.5rem] transition-all duration-300 ${isShaking ? 'shake' : ''}`}>
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
             <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20"></div>
             <div className="w-20 h-20 bg-gradient-to-tr from-primary-500 to-pink-400 rounded-full flex items-center justify-center text-white shadow-xl shadow-primary-300/50 relative z-10">
               <Heart fill="white" size={36} className="animate-pulse" />
             </div>
             <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm">
                <Sparkles size={16} className="text-yellow-400" fill="currentColor" />
             </div>
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">HAPHAM</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            {isSetupMode ? "Thiết lập bảo mật" : "Chào mừng trở lại!"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                {isSetupMode ? <Unlock size={20} /> : <Lock size={20} />}
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-200/50 focus:border-primary-400 transition-all shadow-sm"
                placeholder={isSetupMode ? "Tạo mật khẩu mới" : "Nhập mật khẩu của bạn"}
                autoFocus
              />
            </div>

            {isSetupMode && (
              <div className="relative group animate-in slide-in-from-top-2 fade-in duration-300">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-200/50 focus:border-primary-400 transition-all shadow-sm"
                  placeholder="Xác nhận lại mật khẩu"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-500 text-sm font-medium text-center animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 to-pink-500 hover:from-primary-500 hover:to-pink-400 focus:outline-none focus:ring-4 focus:ring-primary-200 shadow-lg shadow-primary-500/30 transform transition-all duration-200 hover:-translate-y-1 active:scale-95 overflow-hidden"
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
               <span className="flex items-center gap-2">
                 {isSetupMode ? "Bắt đầu ngay" : "Đăng Nhập"} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
               </span>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
           <p className="text-xs text-slate-400">
             Được bảo mật an toàn trên thiết bị của bạn
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;