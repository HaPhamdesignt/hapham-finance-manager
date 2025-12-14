/* APP VERSION: v3.8 - Final Stable (Fix Compile Error & Delete Function)
  AUTHOR: Trinh Nữ (AI)
  LOG:
  - Fix: Unexpected end of file error (Complete Code).
  - Fix: Added renderManageLinksTab to main view.
  - UI: Action buttons (Edit/Delete) are always visible on LinkCard.
*/

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Database, 
  StickyNote, 
  Wallet, 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Link as LinkIcon, 
  ShieldAlert, 
  Save, 
  X, 
  CheckCircle,
  AlertCircle,
  User, 
  Bell, 
  ArrowRight, 
  Clock, 
  Menu, 
  Star, 
  Globe, 
  Phone, 
  Filter, 
  Heart, 
  Sparkles, 
  Camera, 
  Image as ImageIcon, 
  ExternalLink,
  CreditCard,
  Calendar,
  Smartphone,
  ListTodo,
  ArrowRightLeft,
  TrendingUp,
  Banknote,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Calculator,
  Loader2,
  Trash
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constants ---
const EXPIRY_THRESHOLD_DAYS = 15;

const TABS = {
  DASHBOARD: 'dashboard',
  FINANCE: 'finance',
  ACCOUNTS: 'accounts',
  NOTES: 'notes',
  TOOLS: 'tools',
  SOURCES: 'sources',
  SETTINGS: 'settings',
};

const NOTE_GROUPS = [
  { value: 'work', label: 'Công việc 💻' },
  { value: 'life', label: 'Cuộc sống thường ngày ☕' },
  { value: 'quick', label: 'Ghi chú nhanh ⚡' },
  { value: 'wishlist', label: 'Muốn làm sau này 🌙' }
];

// --- Helpers ---
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const getDaysRemaining = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// --- Finance Logic Helpers ---
const calculateAmortization = (item) => {
  const { amount: principal, rate, duration, startDate, calcMethod, monthlyAmount } = item;
  const schedule = [];
  let currentDate = new Date(startDate);
  
  if (calcMethod === 'fixed') {
     const payment = Number(monthlyAmount) || 0;
     let balance = principal;
     const principalPerMonth = principal / duration; 
     for (let i = 1; i <= duration; i++) {
        balance -= principalPerMonth;
        currentDate.setMonth(currentDate.getMonth() + 1);
        schedule.push({ period: i, date: new Date(currentDate), payment: payment, remaining: Math.max(0, balance) });
     }
     return { monthlyPayment: payment, schedule };
  }
  const ratePerYear = Number(rate) || 0;
  if (calcMethod === 'flat') {
      const monthlyRate = (ratePerYear / 100) / 12;
      const monthlyInterest = principal * monthlyRate; 
      const monthlyPrincipal = principal / duration;    
      const payment = monthlyInterest + monthlyPrincipal; 
      let balance = principal;
      for (let i = 1; i <= duration; i++) {
          balance -= monthlyPrincipal;
          currentDate.setMonth(currentDate.getMonth() + 1);
          schedule.push({ period: i, date: new Date(currentDate), payment: payment, remaining: Math.max(0, balance) });
      }
      return { monthlyPayment: payment, schedule };
  }
  // Reducing balance
  const monthlyRate = (ratePerYear / 100) / 12;
  let balance = principal;
  const monthlyPayment = monthlyRate === 0 
    ? principal / duration 
    : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -duration));
  for (let i = 1; i <= duration; i++) {
    balance -= (monthlyPayment - (balance * monthlyRate));
    currentDate.setMonth(currentDate.getMonth() + 1);
    schedule.push({ period: i, date: new Date(currentDate), payment: monthlyPayment, remaining: Math.max(0, balance) });
  }
  return { monthlyPayment, schedule };
};

// --- Theme Colors for Link Cards ---
const CARD_THEMES = [
  { bg: 'bg-pink-50', border: 'border-pink-100', iconBg: 'bg-pink-100', text: 'text-pink-600', hover: 'hover:border-pink-300' },
  { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:border-purple-300' },
  { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:border-blue-300' },
  { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', text: 'text-emerald-600', hover: 'hover:border-emerald-300' },
  { bg: 'bg-orange-50', border: 'border-orange-100', iconBg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:border-orange-300' },
];

const getThemeForLink = (linkId) => {
  const sum = (linkId || 'default').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return CARD_THEMES[sum % CARD_THEMES.length];
};

// --- Styled Components ---

const LoadingScreen = () => (
  <div className="min-h-[100dvh] bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center relative overflow-hidden font-quicksand select-none">
    <div className="absolute inset-0 pointer-events-none">
       <div className="absolute top-[15%] left-[10%] text-pink-200 animate-bounce" style={{animationDuration: '3s'}}><Heart size={48} fill="currentColor" /></div>
       <div className="absolute top-[20%] right-[15%] text-purple-200 animate-pulse" style={{animationDuration: '2s'}}><Star size={32} fill="currentColor" /></div>
       <div className="absolute bottom-[15%] left-[20%] text-blue-200 animate-bounce" style={{animationDuration: '4s'}}><Sparkles size={40} /></div>
       <div className="absolute bottom-[25%] right-[10%] text-yellow-200 animate-spin" style={{animationDuration: '8s'}}><Star size={24} fill="currentColor" /></div>
    </div>

    <div className="z-10 flex flex-col items-center p-8 bg-white/40 backdrop-blur-lg rounded-[3rem] border border-white/60 shadow-2xl shadow-pink-100/50 max-w-sm mx-4 transform transition-all duration-500 hover:scale-105">
      <div className="relative mb-6 group">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg shadow-pink-200 relative z-10 animate-[bounce_2s_infinite]">
           <img 
              src="https://api.dicebear.com/7.x/fun-emoji/svg?seed=Meme" 
              alt="Loading Avatar"
              className="w-24 h-24 rounded-full object-cover transform transition-transform group-hover:rotate-12"
           />
        </div>
        
        <div className="absolute top-0 left-0 w-full h-full animate-[spin_4s_linear_infinite] pointer-events-none">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow-md">
                <Heart className="text-rose-400 w-4 h-4 fill-rose-400" />
            </div>
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <h2 className="text-xl md:text-2xl font-bold text-slate-700 leading-tight">
          Em là <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Trinh Nữ AI</span>,
        </h2>
        <p className="text-slate-500 font-medium text-sm md:text-base">
          xin được hỗ trợ anh Hà. 💖
        </p>
      </div>
      
      <div className="mt-8 w-32 h-1.5 bg-pink-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full w-1/2 animate-[shimmer_1.5s_infinite_linear]" 
             style={{
               backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)',
               backgroundSize: '200% 100%',
             }}
        ></div>
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    </div>
  </div>
);

const StatusCard = ({ title, count, subtitle, type, icon: Icon }) => {
  let bgIconClass = "from-emerald-100 to-teal-100 text-emerald-600";
  let iconElement = Icon ? <Icon className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />;
  
  if (type === 'warning') {
    bgIconClass = "from-orange-100 to-amber-100 text-orange-500";
    iconElement = <AlertCircle className="w-6 h-6" />;
  } else if (type === 'danger') {
    bgIconClass = "from-rose-100 to-red-100 text-rose-500";
    iconElement = <ShieldAlert className="w-6 h-6" />;
  } else if (type === 'info') {
    bgIconClass = "from-blue-100 to-indigo-100 text-blue-500";
    iconElement = <LinkIcon className="w-6 h-6" />;
  } else if (type === 'purple') {
    bgIconClass = "from-purple-100 to-fuchsia-100 text-purple-500";
    iconElement = <StickyNote className="w-6 h-6" />;
  } else if (type === 'finance') {
    bgIconClass = "from-indigo-100 to-violet-100 text-indigo-500";
    iconElement = <Wallet className="w-6 h-6" />;
  }

  return (
    <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-50 flex items-center justify-between relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div className="z-10">
        <p className="text-slate-400 text-sm font-semibold font-quicksand">{title}</p>
        <h3 className="text-3xl font-bold text-slate-700 mt-2 font-quicksand">{count}</h3>
        <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${bgIconClass} flex items-center justify-center shadow-sm`}>
        {iconElement}
      </div>
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${bgIconClass} opacity-20 blur-xl group-hover:scale-125 transition-transform`}></div>
    </div>
  );
};

const LinkCard = ({ link, onEdit, onDelete, small = false }) => {
  const handleClick = () => window.open(link.url, '_blank');
  const theme = getThemeForLink(link.id);

  return (
    <div 
      onClick={handleClick}
      className={`
        relative overflow-hidden rounded-[2rem] border-2 transition-all duration-300 cursor-pointer group
        ${theme.bg} ${theme.border} ${theme.hover}
        hover:shadow-lg hover:-translate-y-1
        ${small ? 'p-3' : 'p-5'}
      `}
    >
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full ${theme.iconBg} opacity-50 blur-2xl transition-transform group-hover:scale-150`}></div>

      <div className="flex items-center gap-4 relative z-10">
        <div className={`
          flex-shrink-0 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:rotate-3
          ${small ? 'w-10 h-10 text-xl' : 'w-14 h-14 text-3xl'}
          ${theme.iconBg}
        `}>
          {link.icon || '🌸'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
             <h4 className={`font-bold text-slate-700 font-quicksand truncate ${small ? 'text-sm' : 'text-lg'}`}>
              {link.title}
            </h4>
            <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
               <ExternalLink size={small ? 14 : 18} className={theme.text} />
            </div>
          </div>
          
          {!small && link.description && (
            <p className="text-slate-500 text-xs mt-1 font-medium line-clamp-1 opacity-80">
              {link.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between relative z-10">
         <div className="flex gap-2">
            {link.isPinned && !small && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-amber-500 flex items-center gap-1 backdrop-blur-sm shadow-sm">
                  <Star size={10} fill="currentColor" /> Ghim
              </span>
            )}
         </div>
         
         <div className="flex gap-1">
             {onEdit && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(link); }}
                  className={`
                    p-1.5 rounded-full 
                    bg-white/60 hover:bg-white text-slate-400 hover:text-indigo-500 shadow-sm
                    transition-colors
                  `}
                  title="Sửa"
                >
                  <Edit size={16} />
                </button>
             )}
             {onDelete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(link.id); }}
                  className={`
                    p-1.5 rounded-full 
                    bg-white/60 hover:bg-white text-slate-400 hover:text-rose-500 shadow-sm
                    transition-colors
                  `}
                  title="Xóa"
                >
                  <Trash2 size={16} />
                </button>
             )}
         </div>
      </div>
    </div>
  );
};

const SourceCard = ({ source, onEdit, onDelete }) => {
  return (
    <div className="bg-white border border-pink-50 rounded-3xl p-5 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(244,114,182,0.1)] hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div>
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-lg mb-3">
            {source.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-lg font-bold text-slate-700 font-quicksand group-hover:text-orange-500 transition-colors">{source.name}</h3>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1 font-medium">
            {source.contact.includes('http') ? <Globe size={12}/> : <Phone size={12}/>}
            {source.contact}
          </p>
        </div>
        <button 
          onClick={() => onEdit(source)}
          className="p-2 text-slate-300 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-colors"
        >
          <Edit size={16} />
        </button>
      </div>
      
      <div className="mt-4 flex items-center justify-between border-t border-pink-50 pt-3">
        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              fill={i < source.rating ? "#FBBF24" : "none"}
              className={i < source.rating ? "text-yellow-400" : "text-slate-200"} 
            />
          ))}
        </div>
        <button 
          onClick={() => onDelete(source.id)} 
          className="text-xs font-bold text-pink-300 hover:text-red-400 transition-colors"
        >
          Xóa
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function SubHubApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [links, setLinks] = useState([]);
  const [accounts, setAccounts] = useState([]); 
  const [sources, setSources] = useState([]); 
  const [notes, setNotes] = useState([]);
  const [debts, setDebts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Profile State
  const [userProfile, setUserProfile] = useState({
    name: 'Trinh Nữ',
    nickname: 'Vợ Yêu AI',
    avatarUrl: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Meme'
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Modals
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [currentLinkContext, setCurrentLinkContext] = useState('all');
  
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);

  // Finance/Debt State
  const [debtActiveSubTab, setDebtActiveSubTab] = useState('all');
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtFormType, setDebtFormType] = useState('bnpl'); 
  const [selectedDebtAction, setSelectedDebtAction] = useState(null); 
  const [debtActionValue, setDebtActionValue] = useState('');
  const [debtActionDate, setDebtActionDate] = useState('');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(null);
  const [bnplProvider, setBnplProvider] = useState(''); 
  const [installmentMethod, setInstallmentMethod] = useState('flat');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      message: '',
      onConfirm: null
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  
  // Note Filters
  const [noteSearchTerm, setNoteSearchTerm] = useState('');
  const [noteFilterGroup, setNoteFilterGroup] = useState('all');
  const [noteFilterImportant, setNoteFilterImportant] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  // --- Auth & Data ---

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Min 1.5s loading time to show the cute animation
    const loadingTimer = setTimeout(() => {
       // Fetch Profile
      const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      onSnapshot(profileDocRef, (doc) => {
        if (doc.exists()) setUserProfile(doc.data());
      });

      const linksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'links');
      onSnapshot(query(linksRef), (snapshot) => {
        setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const accountsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'accounts');
      onSnapshot(query(accountsRef, orderBy('createdAt', 'desc')), (snapshot) => {
        setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const sourcesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sources');
      onSnapshot(query(sourcesRef, orderBy('createdAt', 'desc')), (snapshot) => {
        setSources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const notesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'notes');
      onSnapshot(query(notesRef, orderBy('updatedAt', 'desc')), (snapshot) => {
        setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      const debtsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'debts');
      onSnapshot(query(debtsRef, orderBy('createdAt', 'desc')), (snapshot) => {
        setDebts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
          // Fallback if indexes are missing
          onSnapshot(debtsRef, (snapshot) => {
              setDebts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
              setLoading(false);
          });
      });
    }, 1500);

    return () => clearTimeout(loadingTimer);
  }, [user]);

  // --- Calculations & Handlers ---
  const expiringAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const days = getDaysRemaining(acc.expiryDate);
      return days !== null && days <= EXPIRY_THRESHOLD_DAYS;
    }).sort((a, b) => getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate));
  }, [accounts]);

  const financeData = useMemo(() => {
    let payables = 0; let monthlyDue = 0;
    const upcomingItems = [];

    debts.forEach(t => {
      if (t.type === 'planned') return;

      let dueAmount = 0;
      let nextDate = t.dueDate ? new Date(t.dueDate) : null;

      if (t.type === 'personal_loan' && t.status === 'pending') {
        payables += Number(t.amount);
        monthlyDue += Number(t.amount);
        dueAmount = Number(t.amount);
      }
      else if (t.type === 'installment') {
        const { schedule } = calculateAmortization(t);
        const today = new Date();
        const nextPayment = schedule.find(s => new Date(s.date) >= new Date(today.setDate(today.getDate()-1))); 
        if (nextPayment) {
             payables += Number(t.amount); 
             monthlyDue += nextPayment.payment;
             nextDate = nextPayment.date;
             dueAmount = nextPayment.payment;
        }
      }
      else if (t.type === 'credit' || t.type === 'bnpl') {
        payables += (Number(t.paymentDue) || 0); 
        monthlyDue += (Number(t.paymentDue) || 0);
        dueAmount = (Number(t.paymentDue) || 0);
        if (dueAmount <= 0) nextDate = null;
      }

      if (nextDate && dueAmount > 0 && t.status !== 'paid') {
         const days = getDaysRemaining(nextDate);
         if (days <= 15) { 
           upcomingItems.push({ ...t, daysLeft: days, dueAmountDisplay: dueAmount, displayDate: nextDate, isOverdue: days < 0 });
         }
      }
    });
    
    upcomingItems.sort((a, b) => a.daysLeft - b.daysLeft);
    return { payables, monthlyDue, upcomingItems };
  }, [debts]);

  // --- Custom Confirm Function ---
  const requestConfirm = (message, action) => {
    setConfirmModal({
        isOpen: true,
        message,
        onConfirm: async () => {
            await action();
            setConfirmModal({ isOpen: false, message: '', onConfirm: null });
        }
    });
  };

  // --- CRUD Handlers ---

  const handleSaveProfile = async (e) => { e.preventDefault(); if (!user) return; const formData = new FormData(e.target); const newProfile = { name: formData.get('name'), nickname: formData.get('nickname'), avatarUrl: formData.get('avatarUrl') }; try { const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'); await setDoc(docRef, newProfile); setIsProfileModalOpen(false); } catch (error) { console.error("Error saving profile", error); } };
  const handleSaveNote = async (e) => { e.preventDefault(); if (!user) return; const formData = new FormData(e.target); const noteData = { title: formData.get('title'), content: formData.get('content'), group: formData.get('group'), imageUrl: formData.get('imageUrl'), isImportant: formData.get('isImportant') === 'on', updatedAt: serverTimestamp() }; const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'notes'); try { if (selectedNote) await updateDoc(doc(colRef, selectedNote.id), noteData); else await addDoc(colRef, { ...noteData, createdAt: serverTimestamp() }); if(!selectedNote) e.target.reset(); } catch (e) { console.error(e); } };
  
  const handleDeleteNote = (id) => {
      requestConfirm("Xóa ghi chú này nha? 🥺", async () => {
          try { 
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', id)); 
            if (selectedNote?.id === id) setSelectedNote(null);
          } catch(e){}
      });
  };

  const openAddLinkModal = (contextScope) => { setEditingLink(null); setCurrentLinkContext(contextScope); setIsLinkModalOpen(true); };
  const handleSaveLink = async (formData) => { if (!user) return; const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'links'); try { if (editingLink) await updateDoc(doc(colRef, editingLink.id), { ...formData, updatedAt: serverTimestamp() }); else await addDoc(colRef, { ...formData, createdAt: serverTimestamp() }); setIsLinkModalOpen(false); setEditingLink(null); } catch (e) { console.error(e); } };
  
  const handleDeleteLink = (id) => {
      requestConfirm("Xóa liên kết này chứ?", async () => {
          try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'links', id)); } catch(e){}
      });
  };

  const handleSaveAccount = async (formData) => { if (!user) return; const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'accounts'); try { if (editingAccount) await updateDoc(doc(colRef, editingAccount.id), { ...formData, updatedAt: serverTimestamp() }); else await addDoc(colRef, { ...formData, createdAt: serverTimestamp() }); setIsAccountModalOpen(false); setEditingAccount(null); } catch (e) { console.error(e); } };
  
  const handleDeleteAccount = (id) => {
      requestConfirm("Xóa đơn hàng này nha?", async () => {
          try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'accounts', id)); } catch(e){}
      });
  };

  const handleSaveSource = async (formData) => { if (!user) return; const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sources'); try { if (editingSource) await updateDoc(doc(colRef, editingSource.id), { ...formData, updatedAt: serverTimestamp() }); else await addDoc(colRef, { ...formData, createdAt: serverTimestamp() }); setIsSourceModalOpen(false); setEditingSource(null); } catch (e) { console.error(e); } };
  
  const handleDeleteSource = (id) => {
      requestConfirm("Xóa nguồn mua này chứ?", async () => {
          try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sources', id)); } catch(e){}
      });
  };

  const handleDebtAction = async () => { if (!selectedDebtAction || !user) return; const { item, type } = selectedDebtAction; const val = Number(debtActionValue); const debtRef = doc(db, 'artifacts', appId, 'users', user.uid, 'debts', item.id); try { if (type === 'pay') { const newPaymentDue = Math.max(0, (item.paymentDue || 0) - val); const newPaidAmount = (item.paidAmount || 0) + val; await updateDoc(debtRef, { paymentDue: newPaymentDue, amount: newPaymentDue, paidAmount: newPaidAmount }); } else if (type === 'update') { await updateDoc(debtRef, { statementBalance: val, paymentDue: val, amount: val, paidAmount: 0, dueDate: debtActionDate }); } else if (type === 'complete') { const newStatus = item.status === 'paid' ? 'pending' : 'paid'; await updateDoc(debtRef, { status: newStatus }); } setSelectedDebtAction(null); setDebtActionValue(''); setDebtActionDate(''); } catch(e) { console.error(e); } };
  
  const handleDeleteDebt = (id) => {
      requestConfirm("Xóa khoản này khỏi sổ nợ?", async () => {
          try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'debts', id)); } catch(e){}
      });
  };

  const handleSaveDebt = async (e) => {
    e.preventDefault();
    if(!user) return;
    const formData = new FormData(e.target);
    
    const rate = formData.get('rate');
    const finalRate = (installmentMethod !== 'fixed' && rate) ? Number(rate) : 0; 
    let source = formData.get('source');
    if (debtFormType === 'bnpl' && bnplProvider !== 'Khác') {
        source = bnplProvider || source;
    }

    const debtData = {
        type: debtFormType,
        source: source,
        description: formData.get('description'),
        amount: Number(formData.get('amount') || 0),
        paymentDue: Number(formData.get('paymentDue') || formData.get('amount') || 0),
        statementBalance: Number(formData.get('statementBalance') || formData.get('amount') || 0),
        paidAmount: 0,
        limit: Number(formData.get('limit') || 0),
        rate: finalRate,
        calcMethod: debtFormType === 'installment' ? installmentMethod : null,
        monthlyAmount: (debtFormType === 'installment' && installmentMethod === 'fixed') ? Number(formData.get('monthlyAmount')) : null,
        duration: Number(formData.get('duration') || 0),
        startDate: formData.get('startDate') || new Date().toISOString().slice(0, 10),
        dueDate: formData.get('dueDate'),
        payDay: Number(formData.get('payDay') || 1),
        status: 'pending',
        createdAt: serverTimestamp()
    };

    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'debts'), debtData);
        setIsDebtModalOpen(false);
        setBnplProvider(''); // Reset
    } catch(e) { console.error(e); }
  };

  // --- Navigation Handler ---
  const handleNavClick = (tabId) => { setActiveTab(tabId); setIsMobileMenuOpen(false); };

  // --- Renderers ---

  // (Sidebar, Dashboard, Accounts, Sources, Tools, Notes Tabs rendered as before)
  const renderSidebar = () => (
    <>
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white/90 backdrop-blur-xl border-r border-pink-100 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-lg ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:fixed md:flex`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200 rotate-3"><Heart className="text-white w-6 h-6 fill-white" /></div>
            <h1 className="text-2xl font-bold text-slate-700 font-quicksand tracking-tight">HA<span className="text-pink-500">PHAM</span></h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-pink-500"><X size={24} /></button>
        </div>
        <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto font-quicksand">
          {/* NEW MENU ORDER: Dashboard -> Finance -> Accounts -> Notes -> Tools -> Sources */}
          {[
            { id: TABS.DASHBOARD, label: 'Trang Chủ', icon: LayoutDashboard },
            { id: TABS.FINANCE, label: 'Sổ Nợ', icon: Wallet }, 
            { id: TABS.ACCOUNTS, label: 'Đơn Hàng', icon: Users, badge: expiringAccounts.length },
            { id: TABS.NOTES, label: 'Ghi Chú', icon: StickyNote },
            { id: TABS.TOOLS, label: 'Liên Kết', icon: Database },
            { id: TABS.SOURCES, label: 'Nguồn Mua', icon: ShoppingBag }, 
          ].map((item) => (
            <button key={item.id} onClick={() => handleNavClick(item.id)} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group ${activeTab === item.id ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-500 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
              <div className="flex items-center gap-3"><item.icon size={20} className={activeTab === item.id ? 'text-pink-500' : 'text-slate-300 group-hover:text-slate-400'} /> {item.label}</div>
              {item.badge > 0 && <span className="bg-gradient-to-r from-rose-400 to-pink-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md shadow-pink-200">{item.badge}</span>}
            </button>
          ))}
          <div className="my-4 border-t border-pink-50 mx-2"></div>
          <button onClick={() => handleNavClick(TABS.SETTINGS)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-colors ${activeTab === TABS.SETTINGS ? 'bg-pink-50 text-pink-500' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Settings size={20} /> Quản lý Link
          </button>
        </nav>
        <div className="p-6">
          <div onClick={() => setIsProfileModalOpen(true)} className="relative overflow-hidden bg-gradient-to-br from-pink-100 via-purple-100 to-white p-4 rounded-3xl border border-pink-200 shadow-sm group cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute top-2 right-2 opacity-70 animate-pulse pointer-events-none"><Sparkles className="text-yellow-400 w-5 h-5 fill-yellow-400" /></div>
            <div className="absolute bottom-2 left-1 opacity-50 pointer-events-none"><Star className="text-purple-300 w-3 h-3 fill-purple-300" /></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative">
                <img src={userProfile.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full bg-white shadow-md object-cover border-2 border-white" onError={(e) => e.target.src = 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Fallback'} />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Edit size={10} className="text-slate-400" /></div>
              </div>
              <div className="overflow-hidden flex-1">
                 <h4 className="text-lg font-bold font-quicksand bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent truncate">{userProfile.name}</h4>
                 <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 truncate">{userProfile.nickname} <Heart size={10} className="text-red-400 fill-red-400" /></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderDashboard = () => {
    const activeAccountsCount = accounts.length;
    const dashboardLinks = links.filter(l => l.isPinned).sort((a, b) => (b.isPinned === a.isPinned ? 0 : b.isPinned ? 1 : -1));
    const allAlerts = [...expiringAccounts.map(a => ({...a, type: 'account'})), ...financeData.upcomingItems.map(d => ({...d, type: 'debt'}))].slice(0, 5);

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="mb-8"><h1 className="text-3xl font-bold text-slate-800 font-quicksand">Xin chào, {userProfile.name.split(' ').pop()}! 👋</h1><p className="text-slate-400 mt-2 font-medium">Hôm nay anh muốn quản lý gì nào?</p></div>
        
        {/* COMBINED ALERTS */}
        {allAlerts.length > 0 && (
          <section className="bg-rose-50/50 border border-rose-100 rounded-3xl overflow-hidden p-1">
            <div className="px-6 py-4 flex items-center justify-between"><h3 className="text-rose-500 font-bold flex items-center gap-2 text-sm uppercase tracking-wider font-quicksand"><Bell className="w-4 h-4" /> Cần Chú Ý ({allAlerts.length})</h3></div>
            <div className="divide-y divide-rose-100 bg-white rounded-2xl mx-1 mb-1 shadow-sm">
              {allAlerts.map(item => {
                const isAccount = item.type === 'account';
                const isExpired = isAccount ? getDaysRemaining(item.expiryDate) < 0 : item.daysLeft < 0;
                const days = isAccount ? getDaysRemaining(item.expiryDate) : item.daysLeft;
                
                return (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-rose-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                    <div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full ${isExpired ? 'bg-red-400' : 'bg-orange-400'} shadow-sm`}></div><div><div className="text-slate-700 font-bold text-sm font-quicksand">{isAccount ? item.serviceName : item.source}</div><div className="text-slate-400 text-xs font-medium">{isAccount ? item.mainMail : item.description}</div></div></div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block"><div className={`font-bold text-sm ${isExpired ? 'text-red-500' : 'text-orange-500'}`}>{isAccount ? (isExpired ? 'Hết hạn' : `Còn ${days} ngày`) : (isExpired ? `Trễ ${Math.abs(days)} ngày` : `Còn ${days} ngày`)}</div>{!isAccount && <div className="text-[10px] font-bold text-rose-400">{formatCurrency(item.dueAmountDisplay)}</div>}</div>
                      <button onClick={() => { if(isAccount) {setEditingAccount(item); setIsAccountModalOpen(true);} else {setActiveTab(TABS.FINANCE);} }} className="px-4 py-2 bg-white border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all shadow-sm">{isAccount ? 'Gia hạn' : 'Xem'}</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusCard title="TỔNG ĐƠN" count={activeAccountsCount} subtitle="Đang hoạt động" type="success" icon={Users} />
          <StatusCard title="TỔNG NỢ" count={formatCurrency(financeData.payables)} subtitle="Dư nợ hiện tại" type="danger" icon={Wallet} /> 
          <StatusCard title="GHI CHÚ" count={notes.length} subtitle="Đã lưu" type="purple" icon={StickyNote} />
        </section>
        {financeData.monthlyDue > 0 && (<div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 flex justify-between items-center shadow-sm"><div><p className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Cần trả tháng này</p><p className="text-2xl font-bold text-indigo-700 font-quicksand">{formatCurrency(financeData.monthlyDue)}</p></div><button onClick={() => setActiveTab(TABS.FINANCE)} className="px-5 py-2 bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-all">Chi tiết</button></div>)}
        <section className="bg-white p-6 rounded-3xl border border-pink-50 shadow-sm">
          <div className="flex items-center justify-between mb-6"><div><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-quicksand"><span className="text-pink-400">★</span> Lối Tắt (Quick Links)</h2></div><button onClick={() => openAddLinkModal('all')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-pink-200"><Plus size={18} /> Thêm Link</button></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dashboardLinks.map(link => (<LinkCard key={link.id} link={link} onEdit={(l) => { setEditingLink(l); setCurrentLinkContext('all'); setIsLinkModalOpen(true); }} onDelete={handleDeleteLink} />))}
            {dashboardLinks.length === 0 && (<div className="col-span-full py-12 border-2 border-dashed border-pink-100 rounded-3xl flex flex-col items-center justify-center text-pink-300 bg-pink-50/30"><LinkIcon size={32} className="mb-2 opacity-50" /><p className="text-sm font-medium">Chưa có link nào được ghim nè ~</p></div>)}
          </div>
        </section>
      </div>
    );
  };

  const renderAccountsTab = () => {
    const filteredAccounts = accounts.filter(acc => {
      const matchesSearch = acc.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) || acc.mainMail.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesStatus = true;
      const daysLeft = getDaysRemaining(acc.expiryDate);
      if (filterStatus === 'active') matchesStatus = daysLeft !== null && daysLeft > 15;
      if (filterStatus === 'expiring') matchesStatus = daysLeft !== null && daysLeft >= 0 && daysLeft <= 15;
      if (filterStatus === 'expired') matchesStatus = daysLeft !== null && daysLeft < 0;
      let matchesProvider = true;
      if (filterProvider !== 'all') matchesProvider = acc.provider === filterProvider;
      return matchesSearch && matchesStatus && matchesProvider;
    });
    return (
      <div className="flex flex-col h-full pb-6 animate-in fade-in duration-300">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"><div><h2 className="text-3xl font-bold text-slate-800 font-quicksand">Quản Lý Đơn Hàng</h2><p className="text-slate-400 text-sm mt-1 font-medium">Theo dõi tất cả các tài khoản & dịch vụ đã mua.</p></div><button onClick={() => { setEditingAccount(null); setIsAccountModalOpen(true); }} className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-pink-200 font-bold text-sm transition-transform hover:scale-105"><Plus size={18} /> Thêm Đơn Mới</button></div>
           <div className="bg-white p-1.5 rounded-2xl border border-pink-50 shadow-sm mb-6 flex flex-col sm:flex-row gap-2"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input type="text" placeholder="Tìm kiếm đơn hàng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent border-none rounded-xl pl-11 pr-4 py-3 text-slate-600 focus:ring-0 placeholder-slate-300 font-medium"/></div><div className="h-8 w-px bg-pink-50 my-auto hidden sm:block"></div><div className="flex gap-2 p-1"><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-slate-600 text-sm font-bold focus:ring-0 cursor-pointer hover:bg-pink-50 hover:text-pink-500 transition-colors"><option value="all">Tất cả trạng thái</option><option value="active">Còn hạn (&gt;15 ngày)</option><option value="expiring">Sắp hết (&le;15 ngày)</option><option value="expired">Đã hết hạn</option></select><select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-slate-600 text-sm font-bold focus:ring-0 cursor-pointer hover:bg-pink-50 hover:text-pink-500 transition-colors"><option value="all">Tất cả nguồn</option>{sources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div></div>
           <div className="bg-white border border-pink-50 rounded-3xl overflow-hidden shadow-sm flex flex-col flex-1"><div className="overflow-x-auto custom-scrollbar"><table className="w-full text-left border-collapse min-w-[1000px]"><thead><tr className="bg-pink-50/50 text-xs font-bold text-pink-400 uppercase tracking-wider border-b border-pink-50"><th className="p-5 w-[220px]">Dịch Vụ</th><th className="p-5 w-[200px]">Mail Chính</th><th className="p-5 w-[140px]">Ngày Tháng</th><th className="p-5 w-[160px]">Nguồn</th><th className="p-0 border-l border-pink-100" colSpan="3"><div className="flex flex-col h-full"><div className="py-2 border-b border-pink-100 text-center bg-pink-100/50 text-pink-500 text-[10px]">THÔNG TIN BÀN GIAO</div><div className="flex divide-x divide-pink-100"><div className="flex-1 p-2 text-center w-[120px]">ID</div><div className="flex-1 p-2 text-center w-[100px]">PASS</div><div className="flex-1 p-2 text-center w-[140px]">KEY/NOTE</div></div></div></th><th className="p-5 w-[80px] text-right border-l border-pink-100">#</th></tr></thead><tbody className="divide-y divide-pink-50 text-sm">{filteredAccounts.map((acc) => {const daysLeft = getDaysRemaining(acc.expiryDate); const isExpired = daysLeft !== null && daysLeft < 0; const isNearExpiry = daysLeft !== null && daysLeft >= 0 && daysLeft <= EXPIRY_THRESHOLD_DAYS; return (<tr key={acc.id} className="hover:bg-pink-50/30 transition-colors group"><td className="p-5 align-top"><div className="font-bold text-slate-700 font-quicksand text-base">{acc.serviceName}</div>{isNearExpiry && !isExpired && (<div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-orange-50 text-orange-500 rounded-full text-[10px] font-bold"><Clock size={10} /> Sắp hết</div>)}{isExpired && (<div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-[10px] font-bold"><ShieldAlert size={10} /> Hết hạn</div>)}</td><td className="p-5 align-top"><div className="text-slate-500 font-medium text-xs bg-slate-50 px-2 py-1 rounded-lg inline-block max-w-full truncate">{acc.mainMail}</div></td><td className="p-5 align-top"><div className="flex flex-col gap-1"><div className="text-[11px] text-slate-400 flex justify-between gap-2 font-medium"><span>Mua:</span> <span className="text-slate-500">{formatDate(acc.purchaseDate)}</span></div><div className={`text-xs flex justify-between gap-2 font-bold pt-1 border-t border-dashed border-pink-100 ${isExpired ? 'text-red-400' : isNearExpiry ? 'text-orange-400' : 'text-emerald-500'}`}><span>Hết:</span> <span>{formatDate(acc.expiryDate)}</span></div></div></td><td className="p-5 align-top"><div className="text-sm font-bold text-indigo-400">{acc.provider}</div><div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px]">{acc.buyerNick}</div></td><td className="p-3 align-top border-l border-pink-50 bg-slate-50/30 text-slate-600 break-all text-xs font-medium w-[120px]">{acc.loginId || '-'}</td><td className="p-3 align-top border-l border-pink-50 bg-slate-50/30 text-slate-600 break-all text-xs font-medium w-[100px]">{acc.loginPass ? '••••••' : '-'}</td><td className="p-3 align-top border-l border-pink-50 bg-slate-50/30 text-slate-500 break-all text-[11px] w-[140px]">{acc.keyNote}{acc.extraNote && <div className="mt-1 pt-1 border-t border-slate-200/50 italic text-slate-400 text-[10px]">{acc.extraNote}</div>}</td><td className="p-5 align-top text-right border-l border-pink-50"><div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingAccount(acc); setIsAccountModalOpen(true); }} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-500 transition-all"><Edit size={16} /></button><button onClick={() => handleDeleteAccount(acc.id)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button></div></td></tr>);})}</tbody></table></div></div>
      </div>
    );
  };

  const renderSourcesTab = () => (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8"><div><h2 className="text-3xl font-bold text-slate-800 font-quicksand">Nguồn Mua Uy Tín</h2><p className="text-slate-400 text-sm mt-1 font-medium">Lưu lại các shop ruột để dễ dàng liên hệ.</p></div><button onClick={() => { setEditingSource(null); setIsSourceModalOpen(true); }} className="px-5 py-2.5 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-orange-100 flex items-center gap-2"><Plus size={18} /> Thêm Shop</button></div>
      {sources.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-pink-100 rounded-3xl p-12 text-pink-300 bg-pink-50/30"><ShoppingBag size={64} className="mb-4 opacity-50" /><p className="font-medium">Chưa có nguồn mua nào được lưu ~</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{sources.map(source => (<SourceCard key={source.id} source={source} onEdit={(s) => { setEditingSource(s); setIsSourceModalOpen(true); }} onDelete={handleDeleteSource}/>))}</div>}
    </div>
  );

  const renderGenericContextTab = (title, description, tabScope) => {
    const tabLinks = links.filter(l => l.tabScope === 'all' || l.tabScope === tabScope).sort((a, b) => (b.isPinned === a.isPinned ? 0 : b.isPinned ? 1 : -1));
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-300">
         <div className="flex justify-between items-center mb-8"><div><h2 className="text-3xl font-bold text-slate-800 font-quicksand">{title}</h2><p className="text-slate-400 text-sm mt-1 font-medium">{description}</p></div><button onClick={() => openAddLinkModal(tabScope)} className="px-5 py-2.5 bg-gradient-to-r from-purple-400 to-indigo-400 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-indigo-100 flex items-center gap-2"><Plus size={18} /> Link Mới</button></div>
         {tabLinks.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-pink-100 rounded-3xl p-12 text-pink-300 bg-pink-50/30 flex"><Database size={64} className="mb-4 opacity-50" /><p className="font-medium">Chưa có công cụ nào được thêm ~</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{tabLinks.map(link => (<LinkCard key={link.id} link={link} onEdit={(l) => { setEditingLink(l); setCurrentLinkContext(tabScope); setIsLinkModalOpen(true); }} onDelete={handleDeleteLink} />))}</div>}
      </div>
    );
  };

  const renderNotesTab = () => {
    const sortedNotes = [...notes].sort((a, b) => { if (a.isImportant && !b.isImportant) return -1; if (!a.isImportant && b.isImportant) return 1; return (b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0) - (a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0); });
    const filteredNotes = sortedNotes.filter(note => { const matchesSearch = (note.title?.toLowerCase() || '').includes(noteSearchTerm.toLowerCase()) || (note.content?.toLowerCase() || '').includes(noteSearchTerm.toLowerCase()); const matchesGroup = noteFilterGroup === 'all' || note.group === noteFilterGroup; const matchesImportant = !noteFilterImportant || note.isImportant; return matchesSearch && matchesGroup && matchesImportant; });
    
    return (
      <div className="flex flex-col lg:flex-row h-full gap-6 animate-in fade-in duration-300 overflow-hidden">
        <div className="w-full lg:w-80 flex flex-col bg-white border border-pink-50 rounded-3xl shadow-sm h-[calc(100vh-140px)]">
           <div className="p-4 border-b border-pink-50 space-y-3">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} /><input className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-600 placeholder-slate-400 focus:ring-2 focus:ring-pink-100 transition-shadow" placeholder="Tìm ghi chú..." value={noteSearchTerm} onChange={(e) => setNoteSearchTerm(e.target.value)}/></div>
              <div className="flex gap-2"><select className="flex-1 bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-bold text-slate-500 focus:ring-2 focus:ring-pink-100 cursor-pointer" value={noteFilterGroup} onChange={(e) => setNoteFilterGroup(e.target.value)}><option value="all">Tất cả nhóm</option>{NOTE_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}</select><button onClick={() => setNoteFilterImportant(!noteFilterImportant)} className={`p-2 rounded-xl transition-colors ${noteFilterImportant ? 'bg-yellow-100 text-yellow-500' : 'bg-slate-50 text-slate-400 hover:text-yellow-500'}`} title="Chỉ hiện quan trọng"><Star size={16} fill={noteFilterImportant ? "currentColor" : "none"} /></button></div>
              <button onClick={() => setSelectedNote(null)} className="w-full py-2.5 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-xl text-sm font-bold shadow-md shadow-pink-100 hover:shadow-lg transition-all flex items-center justify-center gap-2"><Plus size={16} /> Tạo Ghi Chú Mới</button>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">{filteredNotes.map(note => (<div key={note.id} onClick={() => setSelectedNote(note)} className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md group ${selectedNote?.id === note.id ? 'bg-pink-50 border-pink-200 shadow-sm' : 'bg-white border-slate-50 hover:border-pink-100'}`}><div className="flex justify-between items-start mb-1"><h4 className={`font-bold text-sm line-clamp-1 ${selectedNote?.id === note.id ? 'text-pink-600' : 'text-slate-700'}`}>{note.title || 'Chưa có tiêu đề'}</h4>{note.isImportant && <Star size={12} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}</div>{note.imageUrl && (<div className="w-full h-20 bg-slate-100 rounded-lg mb-2 overflow-hidden"><img src={note.imageUrl} alt="thumbnail" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} /></div>)}<p className="text-xs text-slate-400 line-clamp-2 font-medium mb-2">{note.content || 'Không có nội dung...'}</p><div className="flex justify-between items-center"><span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">{NOTE_GROUPS.find(g => g.value === note.group)?.label.split(' ').slice(-1) || '📝'}</span><span className="text-[10px] text-slate-300">{formatDateTime(note.updatedAt || note.createdAt)}</span></div></div>))}{filteredNotes.length === 0 && (<div className="text-center py-10 text-slate-400 text-sm"><StickyNote size={32} className="mx-auto mb-2 opacity-20" /><p>Chưa có ghi chú nào nè ~</p></div>)}</div>
        </div>
        <div className="flex-1 bg-white border border-pink-50 rounded-3xl shadow-sm flex flex-col h-[calc(100vh-140px)]">
           <form onSubmit={handleSaveNote} className="flex flex-col h-full">
              <div className="p-6 border-b border-pink-50 flex justify-between items-center"><div className="flex items-center gap-2 text-slate-400 text-sm font-bold">{selectedNote ? <Edit size={16} className="text-pink-400" /> : <Plus size={16} className="text-pink-400" />}{selectedNote ? 'Chỉnh sửa ghi chú' : 'Ghi chú mới'}</div>{selectedNote && (<button type="button" onClick={() => handleDeleteNote(selectedNote.id)} className="text-slate-300 hover:text-red-400 transition-colors p-2" title="Xóa ghi chú"><Trash2 size={18} /></button>)}</div>
              <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar"><input required name="title" defaultValue={selectedNote?.title || ''} key={selectedNote?.id ? `title-${selectedNote.id}` : 'title-new'} className="w-full text-2xl font-bold text-slate-700 placeholder-slate-300 border-none focus:ring-0 p-0 bg-transparent font-quicksand" placeholder="Đặt tên nhẹ nhàng cho ghi chú này…"/><div className="flex flex-wrap gap-4 items-center"><select name="group" defaultValue={selectedNote?.group || 'quick'} key={selectedNote?.id ? `group-${selectedNote.id}` : 'group-new'} className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-pink-100 cursor-pointer transition-shadow">{NOTE_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}</select><label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl hover:bg-yellow-50 transition-colors group"><input type="checkbox" name="isImportant" defaultChecked={selectedNote?.isImportant || false} key={selectedNote?.id ? `imp-${selectedNote.id}` : 'imp-new'} className="peer sr-only"/><Star size={16} className="text-slate-300 peer-checked:text-yellow-400 peer-checked:fill-yellow-400 transition-all group-hover:text-yellow-300" /><span className="text-sm font-bold text-slate-500 peer-checked:text-yellow-600 select-none">Đánh dấu là quan trọng nè ⭐</span></label></div><div className="bg-slate-50 p-3 rounded-xl flex items-center gap-2"><ImageIcon size={18} className="text-slate-400" /><input name="imageUrl" defaultValue={selectedNote?.imageUrl || ''} key={selectedNote?.id ? `img-${selectedNote.id}` : 'img-new'} className="w-full bg-transparent border-none p-0 text-sm text-slate-600 placeholder-slate-400 focus:ring-0" placeholder="Dán link hình ảnh minh họa vào đây..."/></div>{(selectedNote?.imageUrl) && (<div className="rounded-xl overflow-hidden max-h-64 border border-pink-100"><img src={selectedNote.imageUrl} alt="Note content" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} /></div>)}<textarea name="content" defaultValue={selectedNote?.content || ''} key={selectedNote?.id ? `content-${selectedNote.id}` : 'content-new'} className="w-full h-full min-h-[200px] resize-none border-none focus:ring-0 text-slate-600 text-base leading-relaxed bg-transparent placeholder-slate-300 font-medium" placeholder="Viết những gì em muốn giữ lại cho mình sau này…"/></div>
              <div className="p-6 border-t border-pink-50 bg-pink-50/30 flex justify-end"><button type="submit" className="px-8 py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-2xl font-bold text-sm shadow-lg shadow-pink-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"><Save size={18} /> {selectedNote ? 'Cập nhật' : 'Lưu lại cho sau này 💌'}</button></div>
           </form>
        </div>
      </div>
    );
  };

  const renderManageLinksTab = () => {
    const allLinks = [...links].sort((a, b) => (b.isPinned === a.isPinned ? 0 : b.isPinned ? 1 : -1));
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-300">
         <div className="flex justify-between items-center mb-8"><div><h2 className="text-3xl font-bold text-slate-800 font-quicksand">Quản Lý Tất Cả Link</h2><p className="text-slate-400 text-sm mt-1 font-medium">Danh sách toàn bộ liên kết trong hệ thống.</p></div><button onClick={() => openAddLinkModal('all')} className="px-5 py-2.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-pink-100 flex items-center gap-2"><Plus size={18} /> Link Mới</button></div>
         {allLinks.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-pink-100 rounded-3xl p-12 text-pink-300 bg-pink-50/30"><LinkIcon size={64} className="mb-4 opacity-50" /><p className="font-medium">Chưa có link nào ~</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{allLinks.map(link => (<LinkCard key={link.id} link={link} onEdit={(l) => { setEditingLink(l); setCurrentLinkContext('all'); setIsLinkModalOpen(true); }} onDelete={handleDeleteLink} />))}</div>}
      </div>
    );
  };

  // --- RENDER FINANCE TAB (SỔ NỢ) ---
  const renderFinanceTab = () => {
    const filteredDebts = debts.filter(t => {
        if (debtActiveSubTab === 'all') return true; // Default all
        if (debtActiveSubTab === 'bnpl') return t.type === 'bnpl';
        if (debtActiveSubTab === 'credit') return t.type === 'credit';
        if (debtActiveSubTab === 'installment') return t.type === 'installment';
        if (debtActiveSubTab === 'personal') return t.type === 'personal_loan' || t.type === 'personal_lend';
        if (debtActiveSubTab === 'plans') return t.type === 'planned';
        return true;
    });

    return (
      <div className="flex flex-col h-full animate-in fade-in duration-300 pb-10">
        {/* Sub Navigation for Finance */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
               {[{id: 'all', label: 'Tất Cả'}, {id: 'bnpl', label: 'Ví Trả Sau'}, {id: 'credit', label: 'Thẻ Tín Dụng'}, {id: 'installment', label: 'Trả Góp'}, {id: 'personal', label: 'Vay Mượn'}, {id: 'plans', label: 'Dự Định'}].map(sub => (
                   <button 
                     key={sub.id} 
                     onClick={() => setDebtActiveSubTab(sub.id)}
                     className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${debtActiveSubTab === sub.id ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-pink-50 text-slate-500 hover:bg-pink-50'}`}
                   >
                     {sub.label}
                   </button>
               ))}
            </div>
            <button onClick={() => setIsDebtModalOpen(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 shrink-0"><Plus size={16}/> Thêm</button>
        </div>

        {/* Transactions List - No Overview */}
        <div className="space-y-4">
            {filteredDebts.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <Wallet size={64} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Chưa có giao dịch nào ở mục này.</p>
                </div>
            ) : filteredDebts.map(t => {
                 const days = getDaysRemaining(t.dueDate);
                 const isBNPL = t.type === 'bnpl';
                 const stm = t.statementBalance || t.amount;
                 const paidAmount = t.paidAmount || 0;
                 const paymentDue = t.paymentDue !== undefined ? t.paymentDue : t.amount;
                 const progress = stm > 0 ? (paidAmount / stm) * 100 : 0;
                 const isPaid = t.status === 'paid';

                 // BNPL & Credit Card Card Style
                 if (t.type === 'credit' || t.type === 'bnpl') {
                     return (
                        <div key={t.id} className="bg-white rounded-3xl border border-pink-50 shadow-sm overflow-hidden relative group p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isBNPL ? 'bg-pink-50 text-pink-500' : 'bg-blue-50 text-blue-500'}`}>{isBNPL ? <Smartphone size={24} /> : <CreditCard size={24} />}</div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-700 font-quicksand">{t.source}</h3>
                                        {t.dueDate ? <div className={`text-xs font-medium ${days <= 5 && paymentDue > 0 ? 'text-rose-500' : 'text-slate-400'}`}>Hạn: {formatDate(t.dueDate)}</div> : <div className="text-xs text-slate-300">Chưa nhập hạn</div>}
                                    </div>
                                </div>
                                {paymentDue > 0 ? <span className="bg-rose-50 text-rose-500 text-xs font-bold px-3 py-1 rounded-full">Chưa xong</span> : <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full">Xong</span>}
                            </div>
                            <div className="mb-4">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Cần thanh toán</p>
                                <p className={`text-2xl font-bold ${paymentDue > 0 ? 'text-slate-800' : 'text-emerald-500'}`}>{formatCurrency(paymentDue)}</p>
                            </div>
                            <div className="space-y-2 mb-4">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${progress < 100 ? (isBNPL ? 'bg-pink-400' : 'bg-blue-400') : 'bg-emerald-400'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div></div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400"><span>Đã trả: {formatCurrency(paidAmount)}</span><span>{Math.min(Math.round(progress), 100)}%</span></div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => {setSelectedDebtAction({item: t, type: 'pay'}); setDebtActionValue(t.paymentDue)}} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-slate-700 transition-all">Thanh toán</button>
                                <button onClick={() => {setSelectedDebtAction({item: t, type: 'update'}); setDebtActionValue('')}} className="flex-1 bg-white border border-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all">Cập nhật sao kê</button>
                            </div>
                            <button onClick={() => handleDeleteDebt(t.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                        </div>
                     );
                 }

                 // Installment Style
                 if (t.type === 'installment') {
                    const { monthlyPayment } = calculateAmortization(t);
                    return (
                        <div key={t.id} className="bg-white rounded-3xl border border-pink-50 shadow-sm overflow-hidden relative group">
                            <div className="p-6 cursor-pointer" onClick={() => setSelectedInstallmentId(selectedInstallmentId === t.id ? null : t.id)}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 shadow-sm"><Calendar size={24} /></div>
                                        <div><h3 className="font-bold text-lg text-slate-700 font-quicksand">{t.description}</h3><div className="text-xs text-slate-400 font-medium"><span className="bg-slate-50 px-2 py-0.5 rounded text-slate-500">{t.source}</span> • {t.duration} tháng</div></div>
                                    </div>
                                    <div className="text-right"><p className="text-xs font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded-lg">Góp {formatCurrency(monthlyPayment)}/tháng</p></div>
                                </div>
                            </div>
                            {selectedInstallmentId === t.id && (
                                <div className="border-t border-pink-50 bg-pink-50/20 p-6">
                                    <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                                        <div className="bg-white p-3 rounded-xl border border-pink-50"><p className="text-[10px] text-slate-400 font-bold uppercase">Gốc</p><p className="font-bold text-slate-700 text-sm">{formatCurrency(t.amount)}</p></div>
                                        <div className="bg-white p-3 rounded-xl border border-pink-50"><p className="text-[10px] text-slate-400 font-bold uppercase">Lãi suất</p><p className="font-bold text-slate-700 text-sm">{(t.rate/12).toFixed(2)}%/tháng</p></div>
                                        <div className="bg-white p-3 rounded-xl border border-pink-50"><p className="text-[10px] text-slate-400 font-bold uppercase">Bắt đầu</p><p className="font-bold text-slate-700 text-sm">{formatDate(t.startDate)}</p></div>
                                    </div>
                                    <button onClick={() => handleDeleteDebt(t.id)} className="w-full py-2.5 text-rose-500 text-sm font-bold bg-white border border-rose-100 hover:bg-rose-50 rounded-xl flex items-center justify-center gap-2 transition-colors"><Trash2 size={16} /> Xóa hợp đồng</button>
                                </div>
                            )}
                        </div>
                    );
                 }

                 // Personal Loan/Lend Style
                 if (t.type === 'personal_loan' || t.type === 'personal_lend') {
                    const isLend = t.type === 'personal_lend';
                    if (isPaid) return null;
                    return (
                        <div key={t.id} className={`bg-white rounded-3xl border shadow-sm p-6 relative group ${isLend ? 'border-emerald-100' : 'border-rose-100'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isLend ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><User size={24} /></div>
                                    <div><h3 className="font-bold text-lg text-slate-700 font-quicksand">{t.source}</h3><p className="text-xs text-slate-400 font-medium">{t.description}</p></div>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${isLend ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{isLend ? 'Cho vay' : 'Đi vay'}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div><p className="text-xs text-slate-400 mb-1 font-bold uppercase">Số tiền</p><p className="text-2xl font-bold text-slate-800">{formatCurrency(t.amount)}</p><div className="text-xs text-slate-400 font-medium mt-1">Hẹn trả: {formatDate(t.dueDate)}</div></div>
                                <div className="flex gap-2">
                                    <button onClick={() => {setSelectedDebtAction({item: t, type: 'complete'});}} className="p-3 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors"><CheckCircle size={20}/></button>
                                    <button onClick={() => handleDeleteDebt(t.id)} className="p-3 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 size={20}/></button>
                                </div>
                            </div>
                        </div>
                    );
                 }
                 
                 // Planned (Dự định chi)
                 if (t.type === 'planned') {
                     if(t.status === 'paid') return null;
                     return (
                        <div key={t.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm"><ListTodo size={24}/></div>
                                <div><h3 className="font-bold text-lg text-slate-800">{t.description}</h3><p className="text-xs text-slate-500 font-medium">Dự kiến: {formatDate(t.dueDate)}</p></div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-xl text-emerald-600">{formatCurrency(t.amount)}</p>
                                <div className="flex gap-2 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => {setSelectedDebtAction({item: t, type: 'complete'});}} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><CheckCircle size={20}/></button>
                                    <button onClick={() => handleDeleteDebt(t.id)} className="p-2 text-slate-300 hover:text-rose-500 rounded-lg"><Trash2 size={20}/></button>
                                </div>
                            </div>
                        </div>
                     );
                 }

                 return null;
            })}
        </div>

        {/* Debt Action Modal */}
        {selectedDebtAction && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
                    <h3 className="text-lg font-bold text-slate-800 font-quicksand mb-4">{selectedDebtAction.type === 'pay' ? 'Xác nhận thanh toán' : selectedDebtAction.type === 'update' ? 'Cập nhật Sao kê' : 'Hoàn thành?'}</h3>
                    {selectedDebtAction.type === 'pay' && (
                        <div className="mb-4">
                            <p className="text-slate-500 text-sm mb-4 font-medium">Thanh toán khoản <span className="font-bold text-slate-800">{formatCurrency(selectedDebtAction.item.paymentDue || selectedDebtAction.item.amount)}</span>?</p>
                            <input type="number" autoFocus className="w-full p-4 bg-pink-50 border-none rounded-2xl text-xl font-bold text-pink-600 focus:ring-2 focus:ring-pink-200 outline-none" placeholder="Nhập số tiền..." value={debtActionValue} onChange={(e) => setDebtActionValue(e.target.value)} />
                        </div>
                    )}
                    {selectedDebtAction.type === 'update' && (
                        <div className="space-y-4">
                            <input type="number" autoFocus className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xl font-bold text-slate-700 focus:ring-2 focus:ring-slate-200 outline-none" placeholder="Tổng dư nợ mới..." value={debtActionValue} onChange={(e) => setDebtActionValue(e.target.value)} />
                            <input type="date" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-medium" value={debtActionDate} onChange={(e) => setDebtActionDate(e.target.value)} />
                        </div>
                    )}
                     {selectedDebtAction.type === 'complete' && <p className="text-slate-500 font-medium mb-4">Đánh dấu khoản này là đã hoàn thành/đã trả?</p>}
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setSelectedDebtAction(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 text-sm">Hủy</button>
                        <button onClick={handleDebtAction} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 text-sm">Xác nhận</button>
                    </div>
                </div>
             </div>
        )}

        {/* Add Debt Modal - REDESIGNED v3.1 */}
        {isDebtModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                        <h3 className="text-xl font-bold text-slate-800 font-quicksand">Thêm Giao Dịch</h3>
                        <button onClick={() => setIsDebtModalOpen(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-pink-500 transition-colors"><X size={20}/></button>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        
                        {/* Type Selection Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {[{ id: 'bnpl', label: 'Ví Trả Sau', icon: Smartphone, color: 'bg-pink-600' }, 
                              { id: 'planned', label: 'Dự Định Chi', icon: ListTodo, color: 'bg-emerald-600' }, 
                              { id: 'credit', label: 'Thẻ Tín Dụng', icon: CreditCard, color: 'bg-blue-600' }, 
                              { id: 'installment', label: 'Trả Góp', icon: Calendar, color: 'bg-purple-600' }, 
                              { id: 'personal_loan', label: 'Đi Vay', icon: ArrowRightLeft, color: 'bg-rose-600' }, 
                              { id: 'personal_lend', label: 'Cho Vay', icon: TrendingUp, color: 'bg-emerald-600' }
                            ].map(type => (
                                <button 
                                  key={type.id} 
                                  onClick={() => setDebtFormType(type.id)} 
                                  className={`py-4 px-3 rounded-2xl text-xs font-bold uppercase transition-all border relative overflow-hidden group ${debtFormType === type.id ? `${type.color} text-white border-transparent shadow-md transform scale-105` : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                                >
                                  <div className="flex flex-col items-center gap-2 relative z-10">
                                    <type.icon size={24} strokeWidth={1.5} />
                                    {type.label}
                                  </div>
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSaveDebt} className="space-y-5">
                             
                             {/* --- FORM: BNPL (VÍ TRẢ SAU) --- */}
                             {debtFormType === 'bnpl' && (
                                <>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Chọn Ví / Dịch vụ</label>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                      {['MoMo Ví Trả Sau', 'SPayLater', 'ZaloPay Account', 'Kredivo', 'Fundiin', 'Khác'].map(p => (
                                        <button key={p} type="button" onClick={() => setBnplProvider(p)} className={`p-3 text-xs rounded-xl border font-medium transition-all ${bnplProvider === p ? 'bg-pink-50 border-pink-500 text-pink-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
                                      ))}
                                    </div>
                                    <input name="source" className="w-full p-3.5 bg-slate-50 border-none rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-pink-200 outline-none text-sm" placeholder="Hoặc nhập tên khác..." />
                                  </div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tổng dư nợ sao kê (Gốc)</label><input required type="number" name="statementBalance" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold text-lg focus:ring-2 focus:ring-pink-200 outline-none" placeholder="0" /></div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Cần thanh toán</label><input required type="number" name="paymentDue" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold text-indigo-600 outline-none" placeholder="0" /></div>
                                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Hạn thanh toán</label><input required type="date" name="dueDate" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-pink-200 outline-none" /></div>
                                  </div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Hạn mức (tham khảo)</label><input type="number" name="limit" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium text-slate-500 outline-none" placeholder="0" /></div>
                                </>
                             )}

                             {/* --- FORM: PLANNED (DỰ ĐỊNH CHI) --- */}
                             {debtFormType === 'planned' && (
                                <>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Mục đích chi tiêu</label><input required name="description" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-emerald-200 outline-none" placeholder="VD: Mua bảo hiểm xe..." /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Số tiền dự kiến</label><input required type="number" name="amount" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold text-lg focus:ring-2 focus:ring-emerald-200 outline-none" placeholder="0" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Ngày dự kiến chi</label><input required type="date" name="dueDate" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-emerald-200 outline-none" /></div>
                                </>
                             )}

                             {/* --- FORM: CREDIT (THẺ TÍN DỤNG) --- */}
                             {debtFormType === 'credit' && (
                                <>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tên Ngân Hàng</label><input required name="source" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-blue-200 outline-none" placeholder="VD: HSBC, VIB..." /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tổng dư nợ sao kê (Gốc)</label><input required type="number" name="statementBalance" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold text-lg focus:ring-2 focus:ring-blue-200 outline-none" placeholder="0" /></div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Cần thanh toán</label><input required type="number" name="paymentDue" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold text-indigo-600 outline-none" placeholder="0" /></div>
                                    <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Hạn thanh toán</label><input required type="date" name="dueDate" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-blue-200 outline-none" /></div>
                                  </div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Hạn mức (tham khảo)</label><input type="number" name="limit" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium text-slate-500 outline-none" placeholder="0" /></div>
                                </>
                             )}

                             {/* --- FORM: INSTALLMENT (TRẢ GÓP) --- */}
                             {debtFormType === 'installment' && (
                                <>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tên sản phẩm</label><input required name="description" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-purple-200 outline-none" placeholder="VD: iPhone 15..." /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Nơi vay</label><input required name="source" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-purple-200 outline-none" placeholder="VD: FE Credit..." /></div>
                                  
                                  <div className="bg-slate-50 p-1 rounded-xl flex mb-2">
                                    <button type="button" onClick={() => setInstallmentMethod('flat')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${installmentMethod === 'flat' ? 'bg-white shadow text-purple-600' : 'text-slate-400'}`}>Lãi Phẳng</button>
                                    <button type="button" onClick={() => setInstallmentMethod('reducing')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${installmentMethod === 'reducing' ? 'bg-white shadow text-purple-600' : 'text-slate-400'}`}>Dư nợ giảm</button>
                                    <button type="button" onClick={() => setInstallmentMethod('fixed')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${installmentMethod === 'fixed' ? 'bg-white shadow text-purple-600' : 'text-slate-400'}`}>Nhập số tiền</button>
                                  </div>

                                  {installmentMethod !== 'fixed' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Gốc vay</label><input required type="number" name="amount" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold outline-none" /></div>
                                      <div>
                                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 flex justify-between"><span>Lãi suất</span> <span className="text-purple-500 text-[9px] bg-purple-50 px-1 rounded">%/NĂM</span></label>
                                         <input required type="number" name="rate" step="0.01" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold outline-none" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tổng giá trị</label><input required type="number" name="amount" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold outline-none" /></div>
                                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Đóng mỗi tháng</label><input required type="number" name="monthlyAmount" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold text-purple-600 outline-none" /></div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-4">
                                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Kỳ hạn (tháng)</label><input required type="number" name="duration" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold outline-none" defaultValue="12" /></div>
                                      <div>
                                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Ngày trả hàng tháng</label>
                                         <div className="relative"><select name="payDay" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold appearance-none outline-none">{[...Array(31)].map((_, i) => <option key={i} value={i+1}>{i+1}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/></div>
                                      </div>
                                  </div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Ngày bắt đầu</label><input required type="date" name="startDate" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium outline-none" /></div>
                                </>
                             )}

                             {/* --- FORM: PERSONAL (VAY/MƯỢN) --- */}
                             {(debtFormType === 'personal_loan' || debtFormType === 'personal_lend') && (
                                <>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tên người {debtFormType === 'personal_loan' ? 'cho vay' : 'mượn'}</label><input required name="source" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="VD: Anh Hùng..." /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Ghi chú</label><input name="description" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="VD: Mượn tiền mặt..." /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Số tiền</label><input required type="number" name="amount" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-bold text-lg focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="0" /></div>
                                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Hẹn ngày trả</label><input required type="date" name="dueDate" className="w-full p-3.5 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-indigo-200 outline-none" /></div>
                                </>
                             )}

                             <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all mt-6">Lưu Giao Dịch</button>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* Custom Confirmation Modal */}
        {confirmModal.isOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all scale-100">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <Trash className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 font-quicksand mb-2">Xác nhận xóa?</h3>
                        <p className="text-slate-500 text-sm font-medium mb-6">{confirmModal.message}</p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                            >
                                Không nha
                            </button>
                            <button 
                                onClick={confirmModal.onConfirm} 
                                className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-200 transition-colors text-sm"
                            >
                                Xóa luôn!
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
