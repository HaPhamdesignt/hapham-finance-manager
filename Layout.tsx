import React, { ReactNode, useState, useEffect } from 'react';
import { LayoutDashboard, CreditCard, Key, FileText, Link as LinkIcon, Heart, Moon, Sun, ShoppingBag, LogOut, Lock, Sparkles, BrainCircuit, ChevronLeft, ChevronRight } from 'lucide-react';
import { ViewState, UserProfile } from '../types';
import { Button, Input, Modal } from './Common';
import { verifyPassword, setStoredPassword } from '../services/storageService';

interface LayoutProps {
  children: ReactNode;
  activeView: ViewState;
  onChangeView: (view: ViewState) => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

// Menu Configuration
const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Trang Chủ', group: 'main' },
  { id: 'debts', icon: CreditCard, label: 'Sổ Nợ', group: 'finance' },
  { id: 'accounts', icon: ShoppingBag, label: 'Đơn Hàng', group: 'finance' },
  { id: 'notes', icon: FileText, label: 'Ghi Chú', group: 'content' },
  { id: 'bookmarks', icon: LinkIcon, label: 'Liên Kết', group: 'content' },
  { id: 'prompts', icon: BrainCircuit, label: 'Kho Prompt', group: 'content' },
];

const ITEMS_PER_PAGE = 8;

const Layout: React.FC<LayoutProps> = ({ children, activeView, onChangeView, userProfile, onUpdateProfile }) => {
  const [isDark, setIsDark] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(NAV_ITEMS.length / ITEMS_PER_PAGE);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<UserProfile>(userProfile);
  
  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Sync profile form when prop changes
  useEffect(() => {
    setProfileForm(userProfile);
  }, [userProfile]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleOpenProfile = () => {
    setProfileForm(userProfile);
    setIsChangingPassword(false);
    setPasswordData({ current: '', new: '', confirm: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = () => {
    onUpdateProfile(profileForm);
    
    // Handle Password Change
    if (isChangingPassword) {
      if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
        setPasswordError('Vui lòng nhập đầy đủ thông tin mật khẩu');
        return;
      }
      if (!verifyPassword(passwordData.current)) {
        setPasswordError('Mật khẩu hiện tại không đúng');
        return;
      }
      if (passwordData.new !== passwordData.confirm) {
        setPasswordError('Mật khẩu xác nhận không khớp');
        return;
      }
      if (passwordData.new.length < 4) {
         setPasswordError('Mật khẩu mới quá ngắn');
         return;
      }

      setStoredPassword(passwordData.new);
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setPasswordError('');
      // Don't close immediately so user sees success message
      setTimeout(() => setIsProfileModalOpen(false), 1000);
    } else {
       setIsProfileModalOpen(false);
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: string; icon: any; label: string }) => {
    const isActive = activeView === view;
    return (
      <button
        onClick={() => onChangeView(view as ViewState)}
        className={`group relative flex items-center w-full px-5 py-4 mb-2 text-sm font-bold rounded-2xl transition-all duration-500 ease-out overflow-hidden ${
          isActive
            ? 'text-white shadow-xl shadow-primary-500/20 scale-100'
            : 'text-slate-500 hover:bg-white/60 hover:text-primary-600 dark:text-slate-400 dark:hover:bg-slate-800/40 hover:scale-[1.02]'
        }`}
      >
        {/* Active Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-r from-primary-500 to-pink-500 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
        
        {/* Hover Gradient Background (Subtle) */}
        {!isActive && <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-pink-50 dark:from-primary-900/10 dark:to-pink-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}

        <div className="relative z-10 flex items-center">
            <Icon size={22} className={`mr-3 transition-transform duration-500 ${isActive ? 'scale-110 rotate-3' : 'group-hover:scale-110'}`} />
            {label}
        </div>
        
        {isActive && <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
      </button>
    );
  };

  const paginatedNavItems = NAV_ITEMS.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="relative min-h-screen bg-[#FDFCFE] dark:bg-slate-950 transition-colors duration-300 font-sans overflow-hidden">
        {/* Animated Background Blobs */}
        <style>{`
            @keyframes float-slow {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(20px, -30px) scale(1.05); }
            66% { transform: translate(-10px, 10px) scale(0.95); }
            100% { transform: translate(0px, 0px) scale(1); }
            }
            .blob-bg {
            position: fixed;
            filter: blur(100px);
            z-index: 0;
            opacity: 0.4;
            pointer-events: none;
            animation: float-slow 20s infinite ease-in-out;
            }
            .dark .blob-bg { opacity: 0.15; }
        `}</style>
        <div className="blob-bg top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-normal animate-delay-0"></div>
        <div className="blob-bg bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-pink-200 dark:bg-pink-900/30 rounded-full mix-blend-multiply dark:mix-blend-normal animation-delay-2000"></div>
        <div className="blob-bg top-[20%] right-[20%] w-[400px] h-[400px] bg-purple-200 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-normal animation-delay-4000"></div>

      {/* Desktop Sidebar with Glassmorphism */}
      <aside className="hidden md:flex w-80 flex-col fixed inset-y-0 left-4 top-4 bottom-4 rounded-[2.5rem] bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 z-50 overflow-hidden">
        {/* Logo Area */}
        <div className="p-8 pb-6 flex items-center gap-4 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/20 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
           
           <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-primary-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="w-12 h-12 bg-gradient-to-tr from-primary-600 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-inner relative z-10 transform group-hover:scale-105 transition-transform duration-300">
                    <Heart fill="white" size={24} className="animate-pulse" />
                </div>
           </div>
           
           <div>
              <h1 className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">HAPHAM</h1>
              <p className="text-[10px] font-bold text-primary-500 tracking-widest uppercase ml-0.5">LifeOS Manager</p>
           </div>
        </div>
        
        {/* Nav Links with Pagination */}
        <nav className="flex-1 px-6 py-4 space-y-1 overflow-y-auto custom-scrollbar flex flex-col">
          {paginatedNavItems.map((item, index) => {
             // Logic to show separator if group changes, but only if not the first item of the page
             const prevItem = index > 0 ? paginatedNavItems[index - 1] : null;
             const showSeparator = prevItem && prevItem.group !== item.group;
             
             return (
               <React.Fragment key={item.id}>
                 {showSeparator && (
                   <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-4"></div>
                 )}
                 <NavItem view={item.id} icon={item.icon} label={item.label} />
               </React.Fragment>
             );
          })}
        </nav>

        {/* Pagination Controls (Only if > 1 page) */}
        {totalPages > 1 && (
          <div className="px-8 pb-4 flex items-center justify-between text-sm font-bold text-slate-500">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span>Trang {currentPage}/{totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        
        {/* User Profile Card */}
        <div className="p-4 mt-auto">
            <div 
            className="relative p-4 rounded-3xl bg-gradient-to-br from-white/50 to-white/80 dark:from-slate-800/50 dark:to-slate-800/80 border border-white/60 dark:border-white/5 cursor-pointer hover:shadow-lg transition-all duration-300 group overflow-hidden"
            onClick={handleOpenProfile}
            >
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 group-hover:from-primary-500/10 group-hover:via-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500"></div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-primary-500 to-pink-500">
                             <img src={userProfile.avatarUrl} alt="User" className="w-full h-full rounded-full border-2 border-white dark:border-slate-800 object-cover" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-primary-600 transition-colors truncate">{userProfile.displayName}</p>
                        <div className="flex items-center gap-1 text-xs text-primary-500 font-medium">
                            <Sparkles size={10} fill="currentColor" /> {userProfile.nickname}
                        </div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleTheme(); }} 
                        className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-700/80 text-slate-400 hover:text-yellow-500 hover:scale-110 shadow-sm transition-all"
                    >
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>
        </div>
      </aside>

      {/* Mobile Header (Glassmorphism) */}
      <header className="md:hidden fixed top-0 w-full bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-800 z-40 px-4 py-3 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-2 font-black text-lg tracking-tight text-slate-900 dark:text-white">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary-600 to-pink-500 rounded-lg flex items-center justify-center text-white shadow-md">
                 <Heart fill="white" size={16} />
            </div>
            HAPHAM
         </div>
         <div className="flex items-center gap-3">
             <div onClick={handleOpenProfile} className="cursor-pointer relative">
                <img src={userProfile.avatarUrl} className="w-9 h-9 rounded-full border-2 border-primary-100" alt="Avatar"/>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
             </div>
             <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{isDark ? <Sun size={20}/> : <Moon size={20}/>}</button>
         </div>
      </header>

      {/* Main Content (Shifted for sidebar margin) */}
      <main className="relative z-10 flex-1 md:ml-[22rem] p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 min-h-screen transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav (Glassmorphism + Floating + Horizontal Scroll for more items) */}
      <nav className="md:hidden fixed bottom-4 inset-x-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 z-50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-x-auto custom-scrollbar">
        <div className="flex items-center justify-between p-2 min-w-max gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`p-3 rounded-xl flex flex-col items-center justify-center min-w-[4rem] transition-all duration-300 relative ${activeView === item.id ? 'text-white shadow-lg shadow-primary-500/30 -translate-y-2' : 'text-slate-400 hover:text-primary-500'}`}
            >
              {activeView === item.id && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-pink-500 rounded-xl" />
              )}
              <item.icon size={24} className="relative z-10" fill={activeView === item.id ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      </nav>

      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Cập Nhật Hồ Sơ">
         <div className="flex flex-col items-center mb-6">
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-28 h-28 rounded-full p-1 bg-white dark:bg-slate-800 shadow-2xl mb-4">
                  <img src={profileForm.avatarUrl} alt="Avatar Preview" className="w-full h-full rounded-full bg-slate-100 object-cover" />
                </div>
            </div>
         </div>

         <div className="space-y-5">
            <Input 
               label="Tên hiển thị" 
               value={profileForm.displayName} 
               onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })} 
            />
            <Input 
               label="Biệt danh đáng yêu" 
               value={profileForm.nickname} 
               onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })} 
            />
            <Input 
               label="Avatar URL" 
               value={profileForm.avatarUrl} 
               onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })} 
               placeholder="https://..."
            />

            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
               <button 
                 type="button" 
                 onClick={() => setIsChangingPassword(!isChangingPassword)}
                 className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 mb-4 transition-colors w-full p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
               >
                 <div className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg">
                    <Lock size={14} /> 
                 </div>
                 {isChangingPassword ? "Ẩn đổi mật khẩu" : "Đổi mật khẩu đăng nhập"}
               </button>

               {isChangingPassword && (
                 <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl animate-in slide-in-from-top-2 border border-slate-100 dark:border-slate-800">
                    <Input 
                      label="Mật khẩu hiện tại" 
                      type="password" 
                      value={passwordData.current} 
                      onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                    />
                    <Input 
                      label="Mật khẩu mới" 
                      type="password" 
                      value={passwordData.new} 
                      onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                    />
                    <Input 
                      label="Xác nhận mật khẩu mới" 
                      type="password" 
                      value={passwordData.confirm} 
                      onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                    />
                    {passwordError && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">{passwordError}</p>}
                    {passwordSuccess && <p className="text-xs text-green-500 font-bold bg-green-50 p-2 rounded-lg">{passwordSuccess}</p>}
                 </div>
               )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsProfileModalOpen(false)}>Hủy</Button>
               <Button onClick={handleSaveProfile}>Lưu Thay Đổi</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default Layout;