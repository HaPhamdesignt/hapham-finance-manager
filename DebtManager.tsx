import React, { useState, useEffect } from 'react';
import { Debt } from '../types';
import { Card, Button, Input, Modal, Badge } from './Common';
import { Plus, Trash2, Edit2, Calendar, Smartphone, List, CreditCard, ArrowRightLeft, TrendingUp, User, Wallet, Search } from 'lucide-react';
import { generateId } from '../services/storageService';

interface DebtManagerProps {
  debts: Debt[];
  onUpdate: (debts: Debt[]) => void;
}

// Configuration for the 6 types
const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any; activeClass: string }> = {
  'VÍ TRẢ SAU': { label: 'VÍ TRẢ SAU', color: 'text-pink-600', icon: Smartphone, activeClass: 'bg-[#E11D48] text-white shadow-pink-200' },
  'DỰ ĐỊNH CHI': { label: 'DỰ ĐỊNH CHI', color: 'text-emerald-600', icon: List, activeClass: 'bg-[#10B981] text-white shadow-emerald-200' },
  'THẺ TÍN DỤNG': { label: 'THẺ TÍN DỤNG', color: 'text-blue-600', icon: CreditCard, activeClass: 'bg-[#3B82F6] text-white shadow-blue-200' },
  'TRẢ GÓP': { label: 'TRẢ GÓP', color: 'text-purple-600', icon: Calendar, activeClass: 'bg-[#A855F7] text-white shadow-purple-200' },
  'ĐI VAY': { label: 'ĐI VAY', color: 'text-rose-600', icon: ArrowRightLeft, activeClass: 'bg-[#F43F5E] text-white shadow-rose-200' },
  'CHO VAY': { label: 'CHO VAY', color: 'text-teal-600', icon: TrendingUp, activeClass: 'bg-[#14B8A6] text-white shadow-teal-200' },
};

const DebtManager: React.FC<DebtManagerProps> = ({ debts, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Default Form State
  const defaultForm: Partial<Debt> = {
    type: 'VÍ TRẢ SAU',
    name: '',
    totalAmount: 0,
    monthlyPayment: 0,
    dueDate: 1,
    paymentCycleMonths: 12,
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
    creditLimit: 0,
    minPayment: 0,
    interestRate: 0,
    installmentTerm: 12,
    installmentType: 'flat',
    lender: '',
    borrower: '',
    productName: ''
  };

  const [formData, setFormData] = useState<Partial<Debt>>(defaultForm);

  const filteredDebts = debts.filter(debt => {
    const query = searchQuery.toLowerCase();
    return (
        debt.name.toLowerCase().includes(query) ||
        debt.type.toLowerCase().includes(query) ||
        (debt.lender && debt.lender.toLowerCase().includes(query)) ||
        (debt.borrower && debt.borrower.toLowerCase().includes(query)) ||
        (debt.notes && debt.notes.toLowerCase().includes(query)) ||
        (debt.productName && debt.productName.toLowerCase().includes(query))
    );
  });

  const handleOpenModal = (debt?: Debt) => {
    if (debt) {
      setEditingId(debt.id);
      setFormData(debt);
    } else {
      setEditingId(null);
      setFormData(defaultForm);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // Basic validation
    let isValid = true;
    if (formData.type === 'DỰ ĐỊNH CHI' && !formData.name) isValid = false;
    else if (['VÍ TRẢ SAU', 'THẺ TÍN DỤNG'].includes(formData.type!) && !formData.name) isValid = false;
    
    // Allow saving even with 0 amounts for layout demo purposes, but normally check amount
    
    if (editingId) {
      const updated = debts.map(d => d.id === editingId ? { ...d, ...formData } as Debt : d);
      onUpdate(updated);
    } else {
      const newDebt: Debt = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        ...formData as any
      };
      onUpdate([...debts, newDebt]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này không?')) {
      onUpdate(debts.filter(d => d.id !== id));
    }
  };

  const calculateRemaining = (debt: Debt) => {
    // Simple logic for visual progress
    if (debt.type === 'DỰ ĐỊNH CHI') return debt.totalAmount; // It's a goal
    
    // For loans/debts, calculate based on simple time or manual entry
    // Here assuming totalAmount is current balance for credit cards/wallets
    if (['VÍ TRẢ SAU', 'THẺ TÍN DỤNG'].includes(debt.type)) return debt.totalAmount;

    // For Installments/Loans
    const start = new Date(debt.startDate);
    const now = new Date();
    const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const paid = Math.max(0, monthsPassed * debt.monthlyPayment);
    return Math.max(0, debt.totalAmount - paid);
  };

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // --- Render Components ---

  const TypeSelectionGrid = () => (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {Object.entries(TYPE_CONFIG).map(([key, config]) => {
        const isActive = formData.type === key;
        const Icon = config.icon;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setFormData({ ...defaultForm, type: key })} // Reset fields when switching type to avoid confusion
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 h-24 ${
              isActive 
                ? config.activeClass + ' border-transparent' 
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'
            }`}
          >
            <Icon size={24} className="mb-2" />
            <span className="text-[10px] sm:text-xs font-bold uppercase text-center">{config.label}</span>
          </button>
        );
      })}
    </div>
  );

  const RenderFormContent = () => {
    const inputClass = "bg-slate-50 dark:bg-slate-900 border-none focus:ring-2 focus:ring-primary-200 rounded-2xl";

    switch (formData.type) {
      case 'VÍ TRẢ SAU':
        return (
          <>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase">Chọn Ví / Dịch Vụ</label>
              <div className="grid grid-cols-2 gap-3">
                {['MoMo Ví Trả Sau', 'SPayLater', 'ZaloPay Account', 'Kredivo', 'Fundiin', 'Khác'].map(provider => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setFormData({ ...formData, name: provider })}
                    className={`px-4 py-3 rounded-2xl text-sm font-medium border transition-all ${
                      formData.name === provider
                        ? 'bg-white border-pink-500 text-pink-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-pink-200'
                    }`}
                  >
                    {provider}
                  </button>
                ))}
              </div>
              <Input 
                placeholder="Hoặc nhập tên khác..." 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                className={inputClass}
              />
            </div>

            <div className="space-y-4 mt-4">
              <Input label="Tổng dư nợ sao kê (gốc)" type="number" placeholder="0" value={formData.totalAmount || ''} onChange={e => setFormData({ ...formData, totalAmount: Number(e.target.value) })} className={inputClass} />
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cần thanh toán" type="number" placeholder="0" value={formData.monthlyPayment || ''} onChange={e => setFormData({ ...formData, monthlyPayment: Number(e.target.value) })} className={inputClass} />
                <Input label="Hạn thanh toán" type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className={inputClass} />
              </div>
              <Input label="Hạn mức (tham khảo)" type="number" placeholder="0" value={formData.creditLimit || ''} onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })} className={inputClass} />
            </div>
          </>
        );

      case 'DỰ ĐỊNH CHI':
        return (
          <>
             <div className="space-y-4">
               <Input label="Mục đích chi tiêu" placeholder="VD: Mua bảo hiểm xe..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
               <Input label="Số tiền dự kiến" type="number" placeholder="0" value={formData.totalAmount || ''} onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} className={inputClass} />
               <Input label="Ngày dự kiến chi" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className={inputClass} />
             </div>
          </>
        );

      case 'THẺ TÍN DỤNG':
        return (
          <>
             <div className="space-y-4">
               <Input label="Tên ngân hàng" placeholder="VD: HSBC, VIB..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
               <Input label="Tổng dư nợ sao kê (gốc)" type="number" placeholder="0" value={formData.totalAmount || ''} onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} className={inputClass} />
               
               <div className="grid grid-cols-2 gap-4">
                  <Input label="Cần thanh toán" type="number" placeholder="0" value={formData.monthlyPayment || ''} onChange={e => setFormData({...formData, monthlyPayment: Number(e.target.value)})} className={inputClass} />
                  <Input label="Hạn thanh toán" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className={inputClass} />
               </div>
               
               <Input label="Hạn mức (tham khảo)" type="number" placeholder="0" value={formData.creditLimit || ''} onChange={e => setFormData({...formData, creditLimit: Number(e.target.value)})} className={inputClass} />
             </div>
          </>
        );

      case 'TRẢ GÓP':
        return (
          <>
             <div className="space-y-4">
                <Input label="Tên sản phẩm" placeholder="VD: iPhone 15..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
                <Input label="Nơi vay" placeholder="VD: FE Credit..." value={formData.lender} onChange={e => setFormData({...formData, lender: e.target.value})} className={inputClass} />
                
                {/* Installment Type Tabs */}
                <div className="bg-slate-50 dark:bg-slate-900 p-1 rounded-xl flex">
                   <button type="button" onClick={() => setFormData({...formData, installmentType: 'flat'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.installmentType === 'flat' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}>LÃI PHẲNG</button>
                   <button type="button" onClick={() => setFormData({...formData, installmentType: 'reducing'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.installmentType === 'reducing' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}>DƯ NỢ GIẢM</button>
                   <button type="button" onClick={() => setFormData({...formData, installmentType: 'manual'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.installmentType === 'manual' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}>NHẬP SỐ TIỀN</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <Input label="Gốc vay" type="number" value={formData.totalAmount || ''} onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} className={inputClass} />
                   <div className="relative">
                      <Input label="Lãi suất" type="number" value={formData.interestRate || ''} onChange={e => setFormData({...formData, interestRate: Number(e.target.value)})} className={inputClass} />
                      <span className="absolute right-4 top-9 text-xs font-bold text-purple-500">%/NĂM</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <Input label="Kỳ hạn (tháng)" type="number" value={formData.installmentTerm || 12} onChange={e => setFormData({...formData, installmentTerm: Number(e.target.value)})} className={inputClass} />
                   <div className="relative">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Ngày trả hàng tháng</label>
                      <select 
                        value={formData.dueDate || 1} 
                        onChange={e => setFormData({...formData, dueDate: Number(e.target.value)})}
                        className="w-full appearance-none rounded-2xl bg-slate-50 dark:bg-slate-900 border-none py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-200 outline-none"
                      >
                         {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                   </div>
                </div>

                <Input label="Ngày bắt đầu" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className={inputClass} />
             </div>
          </>
        );

      case 'ĐI VAY':
        return (
          <>
             <div className="space-y-4">
               <Input label="Tên người cho vay" placeholder="VD: Anh Hùng..." value={formData.lender} onChange={e => setFormData({...formData, lender: e.target.value, name: e.target.value})} className={inputClass} />
               <Input label="Ghi chú" placeholder="VD: Mượn tiền mặt..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className={inputClass} />
               <Input label="Số tiền" type="number" placeholder="0" value={formData.totalAmount || ''} onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} className={inputClass} />
               <Input label="Hẹn ngày trả" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className={inputClass} />
             </div>
          </>
        );

      case 'CHO VAY':
        return (
          <>
             <div className="space-y-4">
               <Input label="Tên người mượn" placeholder="VD: Anh Hùng..." value={formData.borrower} onChange={e => setFormData({...formData, borrower: e.target.value, name: e.target.value})} className={inputClass} />
               <Input label="Ghi chú" placeholder="VD: Mượn tiền mặt..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className={inputClass} />
               <Input label="Số tiền" type="number" placeholder="0" value={formData.totalAmount || ''} onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} className={inputClass} />
               <Input label="Hẹn ngày trả" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className={inputClass} />
             </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản Lý Nợ (Sổ Nợ)</h1>
        
        <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                   className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-200 shadow-sm"
                   placeholder="Tìm kiếm..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
             <Button onClick={() => handleOpenModal()}>
                <Plus size={18} className="mr-2" /> Thêm
             </Button>
        </div>
      </div>

      {filteredDebts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
             <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-3">
                 <CreditCard size={32} />
             </div>
             <p>Không tìm thấy khoản nợ nào.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDebts.map(debt => {
            const config = TYPE_CONFIG[debt.type] || TYPE_CONFIG['VÍ TRẢ SAU'];
            const Icon = config.icon;
            const remaining = calculateRemaining(debt);
            const progress = Math.min(100, Math.max(0, ((debt.totalAmount - remaining) / debt.totalAmount) * 100));

            return (
              <Card key={debt.id} className="relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => handleOpenModal(debt)} className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-full shadow-sm hover:text-blue-500"><Edit2 size={14}/></button>
                  <button onClick={() => handleDelete(debt.id)} className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-full shadow-sm hover:text-red-500"><Trash2 size={14}/></button>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-2xl ${config.activeClass.split(' ')[0]} bg-opacity-10 dark:bg-opacity-20 ${config.color}`}>
                      <Icon size={24} />
                  </div>
                  <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color} bg-opacity-10 px-2 py-1 rounded-full`}>{debt.type}</span>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white mt-1 leading-tight">{debt.name}</h3>
                      {debt.lender && <p className="text-xs text-slate-500">Chủ nợ: {debt.lender}</p>}
                      {debt.borrower && <p className="text-xs text-slate-500">Người vay: {debt.borrower}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                      <p className="text-xs text-slate-400 font-medium">Tổng tiền</p>
                      <p className="text-xl font-extrabold text-slate-800 dark:text-white">{formatCurrency(debt.totalAmount)}</p>
                  </div>
                  
                  {/* Progress Bar (Only for relevant types) */}
                  {['TRẢ GÓP', 'ĐI VAY', 'CHO VAY'].includes(debt.type) && (
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${config.activeClass.split(' ')[0]}`} style={{ width: `${progress}%` }}></div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center text-sm">
                      {debt.monthlyPayment > 0 && (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Thanh toán kỳ này</span>
                          <span className={`font-bold ${config.color}`}>{formatCurrency(debt.monthlyPayment)}</span>
                        </div>
                      )}
                      <div className="flex flex-col items-end ml-auto">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Hạn thanh toán</span>
                          <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                            <Calendar size={12} />
                            {debt.startDate ? new Date(debt.startDate).toLocaleDateString('vi-VN') : `Ngày ${debt.dueDate}`}
                          </div>
                      </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thêm Giao Dịch">
        <div>
          <TypeSelectionGrid />
          
          <div className="bg-white dark:bg-slate-800 rounded-xl">
             <RenderFormContent />
          </div>

          <div className="mt-8">
             <Button 
                onClick={handleSave} 
                className="w-full py-4 text-base bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300 dark:shadow-none"
             >
                Lưu Giao Dịch
             </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DebtManager;