import React from 'react';
import { AppData } from '../types';
import { Card, Button } from './Common';
import { TrendingDown, AlertTriangle, Bookmark, FileText, CreditCard, ShieldAlert, ExternalLink, Users, Wallet, StickyNote, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  data: AppData;
  onChangeView: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onChangeView }) => {
  // Stats Calculation
  const totalDebt = data.debts.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const activeNotes = data.notes.length;
  const pinnedLinks = data.bookmarks.filter(b => b.isPinned).length;

  const today = new Date();
  
  // Upcoming Debts (next 15 days)
  const upcomingDebts = data.debts.filter(debt => {
    const currentDay = today.getDate();
    const due = debt.dueDate;
    let daysDiff = due - currentDay;
    if (daysDiff < 0) daysDiff += 30; // Rough wrapping
    return daysDiff >= 0 && daysDiff <= 15;
  }).sort((a, b) => {
    // Simple sort logic based on proximity to today
    const distA = a.dueDate < today.getDate() ? a.dueDate + 30 : a.dueDate;
    const distB = b.dueDate < today.getDate() ? b.dueDate + 30 : b.dueDate;
    return distA - distB;
  });

  const debtByType = data.debts.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(debtByType).map(key => ({
    name: key,
    value: debtByType[key]
  }));

  const COLORS = ['#fb7185', '#f43f5e', '#e11d48', '#be123c'];

  const StatCard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-extrabold text-slate-800 dark:text-white mb-1">{value}</p>
        <p className="text-sm font-medium text-slate-400">{sub}</p>
      </div>
      <div className={`p-4 rounded-2xl ${bgClass} ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            Xin chào, Nữ! <span className="animate-bounce">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Hôm nay anh muốn quản lý gì nào?</p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Tổng Đơn" 
          value={data.accounts.length} 
          sub="Đang hoạt động" 
          icon={Users} 
          bgClass="bg-emerald-50 dark:bg-emerald-900/20" 
          colorClass="text-emerald-500" 
        />
        <StatCard 
          title="Tổng Nợ" 
          value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalDebt)} 
          sub="Dư nợ hiện tại" 
          icon={ShieldAlert} 
          bgClass="bg-rose-50 dark:bg-rose-900/20" 
          colorClass="text-rose-500" 
        />
        <StatCard 
          title="Ghi Chú" 
          value={activeNotes} 
          sub="Đã lưu" 
          icon={StickyNote} 
          bgClass="bg-violet-50 dark:bg-violet-900/20" 
          colorClass="text-violet-500" 
        />
      </div>

      {/* Quick Links / Shortcuts Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <span className="text-primary-500">★</span> Lối Tắt (Quick Links)
           </h3>
           <Button size="sm" variant="soft" onClick={() => onChangeView('bookmarks')}><Plus size={16} className="mr-1"/> Thêm Link</Button>
        </div>

        {pinnedLinks === 0 ? (
          <div className="border-2 border-dashed border-primary-100 dark:border-primary-900/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-400 mb-3">
               <ExternalLink size={24} />
             </div>
             <p className="text-primary-400 font-medium">Chưa có link nào được ghim nè ~</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {data.bookmarks.filter(b => b.isPinned).map(bm => (
               <a key={bm.id} href={bm.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-primary-50/50 dark:bg-slate-700/30 border border-primary-100 dark:border-slate-700 rounded-2xl hover:shadow-md hover:bg-white dark:hover:bg-slate-700 transition-all group">
                 <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-primary-500 shadow-sm group-hover:scale-110 transition-transform">
                   <Bookmark size={18} fill="currentColor" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="font-bold text-slate-800 dark:text-white truncate group-hover:text-primary-600">{bm.title}</p>
                   <p className="text-xs text-slate-500 truncate">{new URL(bm.url).hostname}</p>
                 </div>
               </a>
             ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area: Urgent Stuff */}
        <div className="lg:col-span-2 space-y-6">
          {(upcomingDebts.length > 0) && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning-500" /> Cần Chú Ý
              </h3>
              {upcomingDebts.map(debt => (
                <div key={debt.id} className="bg-white dark:bg-slate-800 border-l-4 border-l-rose-500 p-5 rounded-2xl shadow-sm flex justify-between items-center hover:translate-x-1 transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl">
                       <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{debt.name}</p>
                      <p className="text-sm text-slate-500">
                        Đáo Hạn: <span className="font-bold text-rose-500">{debt.dueDate}</span> • {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(debt.monthlyPayment)}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="soft" onClick={() => onChangeView('debts')}>Chi tiết</Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Quick Pinned Notes */}
           <Card title="Ghi Chú Quan Trọng">
            {data.notes.filter(n => n.isPinned).length === 0 ? (
              <p className="text-slate-400 text-sm italic text-center py-4">Chưa có ghi chú nào được ghim.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.notes.filter(n => n.isPinned).map(note => (
                  <div key={note.id} className="p-4 bg-[#FFF1F2] dark:bg-slate-700/50 rounded-2xl border border-primary-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group" onClick={() => onChangeView('notes')}>
                    <h4 className="font-bold text-primary-600 dark:text-primary-400 mb-2 group-hover:underline decoration-primary-300">{note.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar / Charts Area */}
        <div className="space-y-6">
           <Card title="Cơ Cấu Nợ">
             <div className="h-64 w-full">
                {chartData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                        formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-slate-300">
                    <Wallet size={48} className="mb-2 opacity-50"/>
                    <span className="text-sm">Không có dữ liệu</span>
                  </div>
                )}
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;