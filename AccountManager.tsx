import React, { useState, useEffect, useRef } from 'react';
import { Account, SellerContact } from '../types';
import { Button, Input, Modal, Badge } from './Common';
import { Plus, Trash2, Edit2, Eye, EyeOff, Copy, Key, ExternalLink, ChevronDown, Check, X, Save, Search, ShoppingBag } from 'lucide-react';
import { generateId, simpleEncrypt, simpleDecrypt } from '../services/storageService';

interface AccountManagerProps {
  accounts: Account[];
  contacts: SellerContact[];
  onUpdate: (accounts: Account[]) => void;
  onUpdateContacts: (contacts: SellerContact[]) => void;
}

const AccountManager: React.FC<AccountManagerProps> = ({ accounts, contacts = [], onUpdate, onUpdateContacts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Partial<Account>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Contact Picker State
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [tempEditName, setTempEditName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsContactDropdownOpen(false);
        setEditingContactId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAccounts = accounts.filter(acc => {
    const query = searchQuery.toLowerCase();
    return (
        acc.serviceName.toLowerCase().includes(query) ||
        acc.email.toLowerCase().includes(query) ||
        (acc.package && acc.package.toLowerCase().includes(query)) ||
        (acc.sellerContact && acc.sellerContact.toLowerCase().includes(query))
    );
  });

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
    
    // Auto-hide after 10 seconds
    if (!revealedIds[id]) {
      setTimeout(() => {
        setRevealedIds(prev => ({ ...prev, [id]: false }));
      }, 10000);
    }
  };

  const handleOpenModal = (acc?: Account) => {
    if (acc) {
      setEditingId(acc.id);
      // Decrypt for editing form
      setFormData({
        ...acc,
        password: simpleDecrypt(acc.password || ''),
        licenseKey: simpleDecrypt(acc.licenseKey || '')
      });
    } else {
      setEditingId(null);
      setFormData({ serviceName: '', email: '', password: '', licenseKey: '' });
    }
    setIsModalOpen(true);
    setIsContactDropdownOpen(false);
  };

  const handleSave = () => {
    if (!formData.serviceName) return;

    // Encrypt before saving
    const dataToSave = {
      ...formData,
      password: simpleEncrypt(formData.password || ''),
      licenseKey: simpleEncrypt(formData.licenseKey || '')
    };

    if (editingId) {
      onUpdate(accounts.map(a => a.id === editingId ? { ...a, ...dataToSave } as Account : a));
    } else {
      onUpdate([...accounts, { id: generateId(), createdAt: new Date().toISOString(), ...dataToSave } as Account]);
    }
    setIsModalOpen(false);
  };

  // --- Contact Logic ---

  const handleSelectContact = (name: string) => {
    setFormData({ ...formData, sellerContact: name });
    setIsContactDropdownOpen(false);
  };

  const handleAddContact = () => {
    if (formData.sellerContact && !contacts.some(c => c.name === formData.sellerContact)) {
      onUpdateContacts([...contacts, { id: generateId(), name: formData.sellerContact }]);
    }
  };

  const handleDeleteContact = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Bạn muốn xóa liên hệ này khỏi danh sách gợi ý?')) {
      onUpdateContacts(contacts.filter(c => c.id !== id));
    }
  };

  const startEditContact = (e: React.MouseEvent, contact: SellerContact) => {
    e.stopPropagation();
    setEditingContactId(contact.id);
    setTempEditName(contact.name);
  };

  const saveEditContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingContactId && tempEditName.trim()) {
      onUpdateContacts(contacts.map(c => c.id === editingContactId ? { ...c, name: tempEditName } : c));
      setEditingContactId(null);
    }
  };

  const cancelEditContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContactId(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tài Khoản & Đơn Hàng</h1>
        
        <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                   className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-200 shadow-sm"
                   placeholder="Tìm dịch vụ, email..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
             <Button onClick={() => handleOpenModal()}>
                <Plus size={18} className="mr-2" /> Thêm
             </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dịch Vụ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email/Đăng Nhập</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng Thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Thông Tin Bảo Mật</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Liên Hệ (FB/Zalo)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredAccounts.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                        <ShoppingBag size={24} className="mx-auto mb-2 opacity-30"/>
                        Không tìm thấy đơn hàng nào.
                    </td>
                </tr>
            ) : (
                filteredAccounts.map(acc => {
                const isExpiring = acc.expirationDate && new Date(acc.expirationDate) < new Date(new Date().setDate(new Date().getDate() + 30));
                const isRevealed = revealedIds[acc.id];
                const decryptedPass = simpleDecrypt(acc.password || '');
                const decryptedKey = simpleDecrypt(acc.licenseKey || '');

                return (
                    <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 font-bold">
                            {acc.serviceName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{acc.serviceName}</div>
                            <div className="text-xs text-slate-500">{acc.package}</div>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {acc.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {acc.expirationDate ? (
                            <Badge type={isExpiring ? 'warning' : 'success'}>
                            Hết Hạn: {new Date(acc.expirationDate).toLocaleDateString('vi-VN')}
                            </Badge>
                        ) : (
                            <Badge type="neutral">Vĩnh Viễn</Badge>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-xs sm:text-sm">
                            {isRevealed ? (decryptedPass || decryptedKey || 'Không Có Bí Mật') : '••••••••'}
                            </span>
                            <button onClick={() => toggleReveal(acc.id)} className="text-slate-400 hover:text-indigo-500">
                            {isRevealed ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                            {isRevealed && (
                            <button onClick={() => copyToClipboard(decryptedPass || decryptedKey)} className="text-slate-400 hover:text-green-500">
                                <Copy size={16}/>
                            </button>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {acc.sellerContact ? (
                            acc.sellerContact.startsWith('http') ? (
                            <a href={acc.sellerContact} target="_blank" rel="noreferrer" className="flex items-center text-indigo-500 hover:underline gap-1">
                                Xem Liên Hệ <ExternalLink size={12}/>
                            </a>
                            ) : (
                            <span>{acc.sellerContact}</span>
                            )
                        ) : (
                            <span className="text-slate-300">-</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleOpenModal(acc)} className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 mr-3"><Edit2 size={16}/></button>
                        <button onClick={() => onUpdate(accounts.filter(a => a.id !== acc.id))} className="text-red-600 hover:text-red-900 dark:hover:text-red-400"><Trash2 size={16}/></button>
                    </td>
                    </tr>
                );
                })
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Chi Tiết Tài Khoản">
         <div className="space-y-4">
            <Input label="Tên Dịch Vụ" value={formData.serviceName} onChange={e => setFormData({...formData, serviceName: e.target.value})} />
            <Input label="Email / ID Đăng Nhập" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
               <Input label="Gói/Cấp Độ" value={formData.package} onChange={e => setFormData({...formData, package: e.target.value})} />
               <Input label="Ngày Hết Hạn" type="date" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} />
            </div>
            <Input label="Mật Khẩu (Đã Mã Hóa)" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <Input label="Mã Bản Quyền (Đã Mã Hóa)" type="text" value={formData.licenseKey} onChange={e => setFormData({...formData, licenseKey: e.target.value})} />
            
            {/* Custom Contact Picker */}
            <div className="w-full relative" ref={dropdownRef}>
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Liên Hệ Người Bán (FB/Zalo)</label>
               <div className="relative">
                  <input
                    className="w-full rounded-2xl border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all px-4 py-3 border outline-none pr-10"
                    value={formData.sellerContact || ''}
                    onChange={e => setFormData({...formData, sellerContact: e.target.value})}
                    onFocus={() => setIsContactDropdownOpen(true)}
                  />
                  <button 
                     type="button"
                     onClick={() => setIsContactDropdownOpen(!isContactDropdownOpen)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500"
                  >
                     <ChevronDown size={20} />
                  </button>
               </div>

               {/* Dropdown Menu */}
               {isContactDropdownOpen && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                        {/* Save Current Option */}
                        {formData.sellerContact && !contacts.some(c => c.name === formData.sellerContact) && (
                           <div 
                             onClick={handleAddContact}
                             className="px-3 py-2 flex items-center gap-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg cursor-pointer border-b border-slate-100 dark:border-slate-700 mb-1"
                           >
                              <Save size={16} /> 
                              <span className="text-sm font-medium">Lưu "{formData.sellerContact}" vào danh bạ</span>
                           </div>
                        )}

                        {contacts.length === 0 && !formData.sellerContact && (
                           <div className="p-3 text-center text-xs text-slate-400 italic">Chưa có danh bạ người bán</div>
                        )}

                        {contacts.map(contact => (
                           <div key={contact.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg group">
                              {editingContactId === contact.id ? (
                                 <div className="flex items-center gap-2 w-full">
                                    <input 
                                       className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm outline-none"
                                       value={tempEditName}
                                       onChange={(e) => setTempEditName(e.target.value)}
                                       autoFocus
                                       onClick={(e) => e.stopPropagation()}
                                    />
                                    <button onClick={saveEditContact} className="p-1 text-green-500 hover:bg-green-50 rounded"><Check size={14} /></button>
                                    <button onClick={cancelEditContact} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={14} /></button>
                                 </div>
                              ) : (
                                 <>
                                    <span 
                                       className="flex-1 text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                                       onClick={() => handleSelectContact(contact.name)}
                                    >
                                       {contact.name}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button 
                                          onClick={(e) => startEditContact(e, contact)}
                                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-600 rounded"
                                       >
                                          <Edit2 size={12} />
                                       </button>
                                       <button 
                                          onClick={(e) => handleDeleteContact(e, contact.id)}
                                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-600 rounded"
                                       >
                                          <Trash2 size={12} />
                                       </button>
                                    </div>
                                 </>
                              )}
                           </div>
                        ))}
                    </div>
                 </div>
               )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Hủy</Button>
               <Button onClick={handleSave}>Lưu Tài Khoản</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default AccountManager;