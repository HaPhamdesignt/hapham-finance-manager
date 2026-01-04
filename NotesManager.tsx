import React, { useState } from 'react';
import { Note, Folder } from '../types';
import { Card, Button, Input, Modal, Badge } from './Common';
import { Plus, Trash2, Edit2, Folder as FolderIcon, Pin, Image as ImageIcon, Search, StickyNote, ChevronDown } from 'lucide-react';
import { generateId } from '../services/storageService';

interface NotesManagerProps {
  notes: Note[];
  folders: Folder[];
  onUpdateNotes: (notes: Note[]) => void;
  onUpdateFolders: (folders: Folder[]) => void;
}

// Deterministic color palette for folders to make it cheerful
const FOLDER_PALETTE = [
  { color: '#F472B6', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  { color: '#60A5FA', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  { color: '#34D399', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  { color: '#A78BFA', bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  { color: '#FBBF24', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  { color: '#F87171', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
];

const NotesManager: React.FC<NotesManagerProps> = ({ notes, folders, onUpdateNotes, onUpdateFolders }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  
  // Forms
  const [editingNote, setEditingNote] = useState<Partial<Note>>({});
  const [currentFolder, setCurrentFolder] = useState<Partial<Folder>>({});
  const [tempImageUrl, setTempImageUrl] = useState('');

  // Filter Logic
  const filteredNotes = notes.filter(n => {
    const matchesFolder = selectedFolderId ? n.folderId === selectedFolderId : true;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const getFolderStyle = (index: number) => FOLDER_PALETTE[index % FOLDER_PALETTE.length];
  const activeFolder = folders.find(f => f.id === selectedFolderId);
  const activeFolderStyle = activeFolder ? getFolderStyle(folders.findIndex(f => f.id === selectedFolderId)) : FOLDER_PALETTE[0];

  // --- Actions ---

  const handleSaveNote = () => {
    if (!editingNote.title) return;
    
    if (editingNote.id) {
      onUpdateNotes(notes.map(n => n.id === editingNote.id ? { ...n, ...editingNote } as Note : n));
    } else {
      const newNote: Note = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        folderId: selectedFolderId,
        isPinned: false,
        imageUrls: [],
        content: '',
        title: '',
        ...editingNote
      };
      onUpdateNotes([...notes, newNote]);
    }
    setIsNoteModalOpen(false);
    setTempImageUrl('');
  };

  const handleSaveFolder = () => {
    if (!currentFolder.name) return;
    if (currentFolder.id) {
      onUpdateFolders(folders.map(f => f.id === currentFolder.id ? { ...f, ...currentFolder } as Folder : f));
    } else {
      onUpdateFolders([...folders, { id: generateId(), name: currentFolder.name, createdAt: new Date().toISOString() } as Folder]);
    }
    setIsFolderModalOpen(false);
  };

  const handleDeleteFolder = (id: string) => {
    if (notes.some(n => n.folderId === id)) {
      alert("Không thể xóa thư mục đang chứa Ghi chú.");
      return;
    }
    if (confirm("Xóa thư mục này?")) {
      onUpdateFolders(folders.filter(f => f.id !== id));
      if (selectedFolderId === id) setSelectedFolderId(folders[0]?.id || '');
    }
  };

  const addImage = () => {
     if (tempImageUrl) {
        setEditingNote(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), tempImageUrl] }));
        setTempImageUrl('');
     }
  };

  const handleOpenNoteModal = (note?: Partial<Note>) => {
    setEditingNote(note || { folderId: selectedFolderId, imageUrls: [] });
    setTempImageUrl('');
    setIsNoteModalOpen(true);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-4 lg:gap-6">
      {/* --- Sidebar Folders (Hidden on Mobile/Tablet) --- */}
      <div className="hidden lg:flex w-1/4 min-w-[220px] flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
         <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <StickyNote size={18} className="text-primary-500"/> Sổ Tay
            </h3>
            <button onClick={() => { setCurrentFolder({}); setIsFolderModalOpen(true); }} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors shadow-sm"><Plus size={18} className="text-slate-500"/></button>
         </div>
         <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {folders.map((f, index) => {
               const style = getFolderStyle(index);
               const isActive = selectedFolderId === f.id;
               return (
                  <div key={f.id} 
                     onClick={() => setSelectedFolderId(f.id)}
                     className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                        isActive 
                           ? `bg-primary-50 border-primary-100 dark:bg-primary-900/20 dark:border-primary-900/30` 
                           : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                     }`}
                  >
                     <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm transition-colors ${style.bg} ${style.text}`}>
                           <FolderIcon size={14} fill="currentColor" />
                        </div>
                        <span className={`font-semibold text-sm truncate ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{f.name}</span>
                     </div>
                     {isActive && (
                        <div className="flex gap-1 animate-in fade-in slide-in-from-left-2">
                           <button onClick={(e) => { e.stopPropagation(); setCurrentFolder(f); setIsFolderModalOpen(true); }} className="p-1 text-slate-400 hover:text-primary-500"><Edit2 size={12} /></button>
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                     )}
                  </div>
               );
            })}
         </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
         {/* Mobile Folder Selector (Visible only on Mobile/Tablet) */}
         <div className="lg:hidden mb-4 flex gap-2">
            <div className="relative flex-1">
               <select 
                 value={selectedFolderId}
                 onChange={(e) => setSelectedFolderId(e.target.value)}
                 className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold py-3 pl-10 pr-10 rounded-2xl outline-none focus:ring-2 focus:ring-primary-200 shadow-sm"
               >
                 {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
               </select>
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500 pointer-events-none">
                  <FolderIcon size={18} />
               </div>
               <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDown size={18} />
               </div>
            </div>
            <button 
              onClick={() => { setCurrentFolder({}); setIsFolderModalOpen(true); }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl p-3 shadow-sm"
            >
               <Plus size={20} />
            </button>
         </div>

         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="hidden lg:block">
               <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span style={{ color: activeFolderStyle.color }}>●</span> 
                  {activeFolder?.name || 'Tất Cả'}
               </h2>
               <p className="text-sm text-slate-500">Ghi lại ý tưởng và nội dung quan trọng</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                     className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
                     placeholder="Tìm kiếm ghi chú..."
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                  />
               </div>
               <Button onClick={() => handleOpenNoteModal()}>
                  <Plus size={18} className="mr-2" /> <span className="hidden sm:inline">Ghi Chú Mới</span><span className="sm:hidden">Thêm</span>
               </Button>
            </div>
         </div>

         {/* Grid List */}
         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {filteredNotes.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <StickyNote size={48} className="mb-4 opacity-20" />
                  <p>Chưa có ghi chú nào trong thư mục này.</p>
               </div>
            ) : (
               <div className="columns-1 md:columns-2 lg:columns-3 gap-4 pb-10 space-y-4">
                  {filteredNotes.map(note => (
                     <div key={note.id} className="break-inside-avoid">
                        <Card className={`group hover:shadow-lg transition-all border-l-4 ${note.isPinned ? 'border-l-indigo-500 bg-indigo-50/10' : 'border-l-transparent hover:border-l-slate-300'}`}>
                           <div className="flex justify-between items-start mb-3">
                              {note.isPinned && (
                                 <Badge type="primary"><Pin size={10} className="mr-1 inline" fill="currentColor"/> Đã Ghim</Badge>
                              )}
                              {!note.isPinned && <div />} 
                              
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-0.5">
                                 <button onClick={() => onUpdateNotes(notes.map(n => n.id === note.id ? { ...n, isPinned: !n.isPinned } : n))} className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 ${note.isPinned ? "text-indigo-500" : "text-slate-400"}`}><Pin size={14} /></button>
                                 <button onClick={() => handleOpenNoteModal(note)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-500"><Edit2 size={14} /></button>
                                 <button onClick={() => { if(confirm('Xóa ghi chú?')) onUpdateNotes(notes.filter(n => n.id !== note.id)); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-slate-500 hover:text-red-500"><Trash2 size={14} /></button>
                              </div>
                           </div>

                           <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2 leading-tight">{note.title}</h3>
                           
                           <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-hidden relative">
                              {note.content}
                              {note.content.length > 200 && (
                                 <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white dark:from-slate-800 to-transparent"></div>
                              )}
                           </div>

                           {note.imageUrls && note.imageUrls.length > 0 && (
                              <div className="mt-4 grid grid-cols-3 gap-2">
                                 {note.imageUrls.slice(0, 3).map((url, i) => (
                                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 relative group/img">
                                       <img src={url} alt="attachment" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                       {i === 2 && note.imageUrls.length > 3 && (
                                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                             +{note.imageUrls.length - 3}
                                          </div>
                                       )}
                                    </div>
                                 ))}
                              </div>
                           )}

                           <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
                              <span className="text-[10px] text-slate-400 font-medium">
                                 {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                              {note.imageUrls && note.imageUrls.length > 0 && (
                                 <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-1 rounded-full flex items-center gap-1">
                                    <ImageIcon size={10} /> {note.imageUrls.length}
                                 </span>
                              )}
                           </div>
                        </Card>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* Note Modal */}
      <Modal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} title="Chi Tiết Ghi Chú">
         <div className="space-y-4">
            <Input 
               placeholder="Tiêu Đề Ghi Chú" 
               value={editingNote.title || ''} 
               onChange={e => setEditingNote({...editingNote, title: e.target.value})} 
               className="font-bold text-lg !bg-transparent !border-0 !border-b !border-slate-200 !rounded-none !px-0 focus:!ring-0 focus:!border-primary-500" 
            />
            
            <div className="relative">
               <textarea 
                  className="w-full h-64 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white p-4 focus:ring-4 focus:ring-primary-100 outline-none border resize-none leading-relaxed"
                  placeholder="Viết suy nghĩ của bạn tại đây..."
                  value={editingNote.content || ''}
                  onChange={e => setEditingNote({...editingNote, content: e.target.value})}
               />
               <button 
                  className="absolute bottom-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-400 hover:text-primary-500 border border-slate-200 dark:border-slate-600 transition-colors"
                  title="Chèn ảnh"
                  onClick={() => document.getElementById('image-url-input')?.focus()}
               >
                  <ImageIcon size={18} />
               </button>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
               <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Đính Kèm Ảnh</label>
               <div className="flex gap-2 items-center mb-4">
                  <Input 
                     id="image-url-input"
                     placeholder="Dán link ảnh tại đây (https://...)" 
                     value={tempImageUrl} 
                     onChange={e => setTempImageUrl(e.target.value)} 
                     className="!py-2"
                  />
                  <Button type="button" onClick={addImage} variant="soft" size="sm">Thêm</Button>
               </div>

               {editingNote.imageUrls && editingNote.imageUrls.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                     {editingNote.imageUrls.map((url, i) => (
                        <div key={i} className="relative group flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                           <img src={url} alt="" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                 className="text-white bg-red-500 p-1.5 rounded-full hover:bg-red-600"
                                 onClick={() => setEditingNote({...editingNote, imageUrls: editingNote.imageUrls?.filter((_, idx) => idx !== i)})}
                              >
                                 <Trash2 size={12} />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
               <Button variant="ghost" onClick={() => setIsNoteModalOpen(false)}>Hủy</Button>
               <Button onClick={handleSaveNote}>Lưu Ghi Chú</Button>
            </div>
         </div>
      </Modal>

      {/* Folder Modal */}
      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title="Quản Lý Thư Mục">
         <div className="space-y-4">
            <Input label="Tên Thư Mục" value={currentFolder.name || ''} onChange={e => setCurrentFolder({...currentFolder, name: e.target.value})} />
            <div className="pt-4 flex justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsFolderModalOpen(false)}>Hủy</Button>
               <Button onClick={handleSaveFolder}>Lưu Thay Đổi</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default NotesManager;