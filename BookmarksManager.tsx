import React, { useState } from 'react';
import { Bookmark } from '../types';
import { Card, Button, Input, Select, Modal } from './Common';
import { Plus, Trash2, Edit2, ExternalLink, Pin, Search, Link as LinkIcon } from 'lucide-react';
import { generateId } from '../services/storageService';

interface BookmarksManagerProps {
  bookmarks: Bookmark[];
  onUpdate: (bookmarks: Bookmark[]) => void;
}

const BookmarksManager: React.FC<BookmarksManagerProps> = ({ bookmarks, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Bookmark>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = Array.from(new Set(bookmarks.map(b => b.category))).filter(Boolean);
  if (categories.length === 0) categories.push('Chung', 'Công Việc', 'Học Tập');

  const filteredBookmarks = bookmarks.filter(b => {
      const query = searchQuery.toLowerCase();
      return (
          b.title.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query) ||
          (b.notes && b.notes.toLowerCase().includes(query))
      );
  });

  const handleSave = () => {
    if (!formData.title || !formData.url) return;
    
    // Ensure URL has protocol
    let finalUrl = formData.url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    if (formData.id) {
      onUpdate(bookmarks.map(b => b.id === formData.id ? { ...b, ...formData, url: finalUrl } as Bookmark : b));
    } else {
      onUpdate([...bookmarks, { id: generateId(), createdAt: new Date().toISOString(), ...formData, url: finalUrl, category: formData.category || 'Chung', isPinned: false } as Bookmark]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Xóa liên kết này?")) {
      onUpdate(bookmarks.filter(b => b.id !== id));
    }
  };

  const sortedBookmarks = [...filteredBookmarks].sort((a, b) => (b.isPinned === a.isPinned) ? 0 : b.isPinned ? 1 : -1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Liên Kết (Bookmarks)</h1>
        
        <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                   className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-200 shadow-sm"
                   placeholder="Tìm link, danh mục..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
             <Button onClick={() => { setFormData({}); setIsModalOpen(true); }}>
                <Plus size={18} className="mr-2" /> Thêm
             </Button>
        </div>
      </div>

      {sortedBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
             <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-3">
                 <LinkIcon size={32} />
             </div>
             <p>Không tìm thấy liên kết nào.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedBookmarks.map(bm => (
            <div key={bm.id} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">{bm.category}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onUpdate(bookmarks.map(b => b.id === bm.id ? { ...b, isPinned: !b.isPinned } : b))} className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${bm.isPinned ? 'text-indigo-600' : 'text-slate-400'}`}><Pin size={14} fill={bm.isPinned ? "currentColor" : "none"} /></button>
                    <button onClick={() => { setFormData(bm); setIsModalOpen(true); }} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(bm.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><Trash2 size={14} /></button>
                    </div>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1 truncate">{bm.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{bm.notes || 'Không có mô tả'}</p>
                </div>
                
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                <a href={bm.url} target="_blank" rel="noreferrer" className="flex items-center text-sm text-indigo-600 hover:underline">
                    <ExternalLink size={14} className="mr-1" /> {new URL(bm.url).hostname}
                </a>
                </div>
            </div>
            ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Sửa Liên Kết" : "Thêm Liên Kết"}>
         <div className="space-y-4">
            <Input label="Tiêu Đề" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <Input label="URL" value={formData.url || ''} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." />
            <div className="grid grid-cols-2 gap-4">
               <Input label="Danh Mục" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} list="categories" />
               <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
               <div className="flex items-center pt-6">
                 <label className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300">
                   <input type="checkbox" checked={formData.isPinned || false} onChange={e => setFormData({...formData, isPinned: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                   <span>Ghim ra Tổng Quan</span>
                 </label>
               </div>
            </div>
            <Input label="Ghi Chú" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
            
            <div className="pt-4 flex justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Hủy</Button>
               <Button onClick={handleSave}>Lưu Liên Kết</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default BookmarksManager;