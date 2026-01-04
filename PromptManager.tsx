import React, { useState } from 'react';
import { SavedPrompt, PromptFolder } from '../types';
import { Card, Button, Input, Modal, Badge } from './Common';
import { Plus, Trash2, Edit2, Search, Copy, Star, Folder, Hash, Bot, Sparkles, Image as ImageIcon, ChevronDown, BrainCircuit } from 'lucide-react';
import { generateId } from '../services/storageService';

interface PromptManagerProps {
  prompts: SavedPrompt[];
  folders: PromptFolder[];
  onUpdatePrompts: (prompts: SavedPrompt[]) => void;
  onUpdateFolders: (folders: PromptFolder[]) => void;
}

// Helper: Prompt Builder Function
const buildPromptText = (role: string, task: string, context: string, constraints: string, format: string) => {
  let p = "";
  if (role) p += `Act as a ${role}.\n\n`;
  if (task) p += `Task: ${task}\n`;
  if (context) p += `Context: ${context}\n`;
  if (constraints) p += `Constraints: ${constraints}\n`;
  if (format) p += `Output Format: ${format}`;
  return p;
};

const PromptManager: React.FC<PromptManagerProps> = ({ prompts, folders, onUpdatePrompts, onUpdateFolders }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isBuilderMode, setIsBuilderMode] = useState(false);

  // Forms
  const [currentPrompt, setCurrentPrompt] = useState<Partial<SavedPrompt>>({});
  const [currentFolder, setCurrentFolder] = useState<Partial<PromptFolder>>({});
  
  // Builder State
  const [builderData, setBuilderData] = useState({ role: '', task: '', context: '', constraints: '', format: '' });

  // Filter Logic
  const filteredPrompts = prompts.filter(p => {
    const matchesFolder = selectedFolderId ? p.folderId === selectedFolderId : true;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          p.aiModel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const getFolderColor = (id: string) => folders.find(f => f.id === id)?.color || '#94a3b8';

  // --- Actions ---

  const handleSavePrompt = () => {
    if (!currentPrompt.title || !currentPrompt.content || !currentPrompt.folderId) {
      alert("Vui lòng điền tiêu đề, nội dung và chọn thư mục.");
      return;
    }

    if (currentPrompt.id) {
      onUpdatePrompts(prompts.map(p => p.id === currentPrompt.id ? { ...p, ...currentPrompt } as SavedPrompt : p));
    } else {
      const newPrompt: SavedPrompt = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        title: '',
        content: '',
        folderId: selectedFolderId,
        purpose: '',
        aiModel: 'GPT-4',
        tags: [],
        rating: 0,
        isPinned: false,
        ...currentPrompt
      } as SavedPrompt;
      onUpdatePrompts([...prompts, newPrompt]);
    }
    setIsPromptModalOpen(false);
    setIsBuilderMode(false);
  };

  const handleDeletePrompt = (id: string) => {
    if (confirm("Xóa prompt này?")) {
      onUpdatePrompts(prompts.filter(p => p.id !== id));
    }
  };

  const handleSaveFolder = () => {
    if (!currentFolder.name) return;
    if (currentFolder.id) {
      onUpdateFolders(folders.map(f => f.id === currentFolder.id ? { ...f, ...currentFolder } as PromptFolder : f));
    } else {
      onUpdateFolders([...folders, { 
        id: generateId(), 
        createdAt: new Date().toISOString(), 
        color: '#F472B6', 
        icon: '📁',
        isPinned: false,
        name: currentFolder.name 
      } as PromptFolder]);
    }
    setIsFolderModalOpen(false);
  };

  const handleDeleteFolder = (id: string) => {
    if (prompts.some(p => p.folderId === id)) {
      alert("Không thể xóa thư mục đang chứa Prompts. Hãy xóa hoặc di chuyển Prompts trước.");
      return;
    }
    if (confirm("Xóa thư mục này?")) {
      onUpdateFolders(folders.filter(f => f.id !== id));
      if (selectedFolderId === id) setSelectedFolderId(folders[0]?.id || '');
    }
  };

  const handleGenerateFromBuilder = () => {
    const text = buildPromptText(builderData.role, builderData.task, builderData.context, builderData.constraints, builderData.format);
    setCurrentPrompt(prev => ({ ...prev, content: text }));
    setIsBuilderMode(false); // Switch back to edit mode to see result
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-4 lg:gap-6">
      {/* --- Sidebar Folders (Hidden on Mobile) --- */}
      <div className="hidden lg:flex w-1/4 min-w-[220px] flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
           <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Bot size={18} className="text-primary-500"/> Thư Viện
           </h3>
           <button onClick={() => { setCurrentFolder({}); setIsFolderModalOpen(true); }} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors shadow-sm"><Plus size={18} className="text-slate-500"/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
           {folders.map(f => (
             <div key={f.id} 
                onClick={() => setSelectedFolderId(f.id)}
                className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${selectedFolderId === f.id ? 'bg-primary-50 border-primary-100 dark:bg-primary-900/20 dark:border-primary-900/30' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
             >
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm" style={{ backgroundColor: f.color + '20', color: f.color }}>{f.icon}</div>
                   <span className={`font-semibold text-sm truncate ${selectedFolderId === f.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{f.name}</span>
                </div>
                {selectedFolderId === f.id && (
                  <div className="flex gap-1">
                     <button onClick={(e) => { e.stopPropagation(); setCurrentFolder(f); setIsFolderModalOpen(true); }} className="p-1 text-slate-400 hover:text-primary-500"><Edit2 size={12} /></button>
                     <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                )}
             </div>
           ))}
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
                  <Bot size={18} />
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
                 <span style={{ color: getFolderColor(selectedFolderId) }}>●</span> 
                 {folders.find(f => f.id === selectedFolderId)?.name || 'Tất Cả'}
              </h2>
              <p className="text-sm text-slate-500">Quản lý các câu lệnh AI hiệu quả</p>
           </div>
           <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
                   placeholder="Tìm kiếm prompt..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
              <Button onClick={() => { setCurrentPrompt({ folderId: selectedFolderId, rating: 0, tags: [] }); setIsPromptModalOpen(true); setIsBuilderMode(false); }}>
                 <Sparkles size={18} className="mr-2" /> <span className="hidden sm:inline">Tạo Mới</span><span className="sm:hidden">Tạo</span>
              </Button>
           </div>
        </div>

        {/* Grid List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
           {filteredPrompts.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <BrainCircuit size={48} className="mb-4 opacity-20" />
                <p>Chưa có prompt nào trong thư mục này.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
                {filteredPrompts.map(prompt => (
                   <Card key={prompt.id} className="flex flex-col h-full hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-900/50 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex gap-2">
                            <Badge type="neutral" className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                               <Bot size={12} className="mr-1 inline" /> {prompt.aiModel}
                            </Badge>
                            {prompt.rating > 0 && (
                               <Badge type="warning" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                                  {prompt.rating} ★
                               </Badge>
                            )}
                         </div>
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button onClick={() => { setCurrentPrompt(prompt); setIsPromptModalOpen(true); setIsBuilderMode(false); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"><Edit2 size={16}/></button>
                            <button onClick={() => handleDeletePrompt(prompt.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-slate-500 hover:text-red-500"><Trash2 size={16}/></button>
                         </div>
                      </div>

                      <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1 line-clamp-1">{prompt.title}</h3>
                      <p className="text-xs font-semibold text-primary-500 mb-3">{prompt.purpose}</p>

                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl mb-4 border border-slate-100 dark:border-slate-800 relative group/code">
                         <p className="text-sm text-slate-600 dark:text-slate-300 font-mono line-clamp-3 leading-relaxed">
                            {prompt.content}
                         </p>
                         <button 
                           onClick={() => copyToClipboard(prompt.content)}
                           className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-primary-500 opacity-0 group-hover/code:opacity-100 transition-all"
                           title="Copy Prompt"
                         >
                            <Copy size={14} />
                         </button>
                      </div>

                      {prompt.imageUrl && (
                        <div className="mb-4 relative h-40 w-full rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 group/image bg-slate-50 dark:bg-slate-900">
                            <img 
                                src={prompt.imageUrl} 
                                alt="Prompt illustration" 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            <a 
                                href={prompt.imageUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/image:opacity-100"
                            >
                                <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-full shadow-sm">
                                    <ImageIcon size={20} className="text-slate-700 dark:text-white"/>
                                </div>
                            </a>
                        </div>
                      )}

                      <div className="mt-auto flex justify-between items-center">
                         <div className="flex gap-2 flex-wrap">
                            {prompt.tags?.slice(0, 3).map(tag => (
                               <span key={tag} className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">#{tag}</span>
                            ))}
                         </div>
                      </div>
                   </Card>
                ))}
             </div>
           )}
        </div>
      </div>

      {/* --- Create/Edit Prompt Modal --- */}
      <Modal isOpen={isPromptModalOpen} onClose={() => setIsPromptModalOpen(false)} title={currentPrompt.id ? "Sửa Prompt" : "Tạo Prompt Mới"}>
         <div className="flex flex-col h-[70vh]">
            {/* Toolbar */}
            <div className="flex gap-2 mb-4 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl">
               <button 
                 onClick={() => setIsBuilderMode(false)}
                 className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isBuilderMode ? 'bg-white dark:bg-slate-800 shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Thông Tin Chung
               </button>
               <button 
                 onClick={() => setIsBuilderMode(true)}
                 className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${isBuilderMode ? 'bg-white dark:bg-slate-800 shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <Sparkles size={14} /> Prompt Builder
               </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
               {!isBuilderMode ? (
                 <>
                    <Input label="Tiêu đề Prompt" value={currentPrompt.title || ''} onChange={e => setCurrentPrompt({...currentPrompt, title: e.target.value})} placeholder="VD: Viết SEO Blog..." />
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Thư Mục</label>
                          <select 
                            className="w-full rounded-2xl border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 py-3 px-4 outline-none"
                            value={currentPrompt.folderId || selectedFolderId}
                            onChange={e => setCurrentPrompt({...currentPrompt, folderId: e.target.value})}
                          >
                             {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                          </select>
                       </div>
                       <Input label="Mục đích sử dụng" value={currentPrompt.purpose || ''} onChange={e => setCurrentPrompt({...currentPrompt, purpose: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Mô hình AI (Model)" value={currentPrompt.aiModel || ''} onChange={e => setCurrentPrompt({...currentPrompt, aiModel: e.target.value})} list="ai-models" />
                       <datalist id="ai-models">
                          <option value="GPT-4o" />
                          <option value="Claude 3.5 Sonnet" />
                          <option value="Midjourney v6" />
                          <option value="Gemini Pro 1.5" />
                       </datalist>
                       
                       <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Đánh giá hiệu quả</label>
                          <div className="flex gap-2">
                             {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} type="button" onClick={() => setCurrentPrompt({...currentPrompt, rating: star})} className="focus:outline-none transition-transform hover:scale-110">
                                   <Star size={24} fill={star <= (currentPrompt.rating || 0) ? "#EAB308" : "none"} className={star <= (currentPrompt.rating || 0) ? "text-yellow-500" : "text-slate-300"} />
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div>
                       <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nội Dung Prompt</label>
                       <textarea 
                          className="w-full h-40 rounded-2xl border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 p-4 font-mono text-sm focus:ring-4 focus:ring-primary-100 outline-none border resize-none"
                          placeholder="Nhập nội dung prompt tại đây hoặc dùng Builder để tạo..."
                          value={currentPrompt.content || ''}
                          onChange={e => setCurrentPrompt({...currentPrompt, content: e.target.value})}
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Tags (cách nhau dấu phẩy)" value={currentPrompt.tags?.join(', ') || ''} onChange={e => setCurrentPrompt({...currentPrompt, tags: e.target.value.split(',').map(t => t.trim())})} placeholder="seo, coding, marketing" />
                       <Input label="Link Ảnh Minh Họa (nếu có)" value={currentPrompt.imageUrl || ''} onChange={e => setCurrentPrompt({...currentPrompt, imageUrl: e.target.value})} placeholder="https://..." />
                    </div>

                    {currentPrompt.imageUrl && (
                       <img src={currentPrompt.imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl border" />
                    )}
                 </>
               ) : (
                 <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-2xl border border-primary-100 dark:border-primary-900/30">
                       <p className="text-sm text-primary-800 dark:text-primary-300 mb-2 font-bold">🛠 Prompt Generator</p>
                       <p className="text-xs text-primary-600 dark:text-primary-400">Điền các thông tin dưới đây để tạo một cấu trúc prompt chuẩn.</p>
                    </div>

                    <Input label="Vai Trò (Role)" value={builderData.role} onChange={e => setBuilderData({...builderData, role: e.target.value})} placeholder="VD: Chuyên gia Marketing 10 năm kinh nghiệm..." />
                    <Input label="Nhiệm Vụ (Task)" value={builderData.task} onChange={e => setBuilderData({...builderData, task: e.target.value})} placeholder="VD: Viết kịch bản TikTok viral..." />
                    
                    <div>
                       <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Bối Cảnh (Context)</label>
                       <textarea className="w-full h-20 rounded-2xl border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 p-3 text-sm outline-none border" 
                          value={builderData.context} onChange={e => setBuilderData({...builderData, context: e.target.value})} 
                          placeholder="VD: Sản phẩm là nến thơm cho Gen Z..." 
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Ràng Buộc (Constraints)" value={builderData.constraints} onChange={e => setBuilderData({...builderData, constraints: e.target.value})} placeholder="VD: Không dùng từ ngữ chuyên ngành, dưới 200 từ..." />
                       <Input label="Định Dạng Output" value={builderData.format} onChange={e => setBuilderData({...builderData, format: e.target.value})} placeholder="VD: Bảng Markdown, Danh sách bullet..." />
                    </div>

                    <Button onClick={handleGenerateFromBuilder} className="w-full mt-4" variant="soft">
                       <Sparkles size={16} className="mr-2" /> Tạo & Chèn Vào Nội Dung
                    </Button>
                 </div>
               )}
            </div>

            <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsPromptModalOpen(false)}>Hủy</Button>
               <Button onClick={handleSavePrompt}>Lưu Prompt</Button>
            </div>
         </div>
      </Modal>

      {/* --- Folder Modal --- */}
      <Modal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} title="Quản Lý Thư Mục">
         <div className="space-y-4">
            <Input label="Tên Thư Mục" value={currentFolder.name || ''} onChange={e => setCurrentFolder({...currentFolder, name: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
               <Input label="Màu Sắc (Hex)" type="color" value={currentFolder.color || '#F472B6'} onChange={e => setCurrentFolder({...currentFolder, color: e.target.value})} className="h-12 cursor-pointer" />
               <Input label="Icon (Emoji)" value={currentFolder.icon || '📁'} onChange={e => setCurrentFolder({...currentFolder, icon: e.target.value})} />
            </div>

            <div className="pt-4 flex justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsFolderModalOpen(false)}>Hủy</Button>
               <Button onClick={handleSaveFolder}>Lưu Thư Mục</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default PromptManager;