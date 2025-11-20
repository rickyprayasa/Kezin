"use client";

import React, { useState, useContext, useMemo } from 'react';
import { NeoCard, NeoButton, NeoDialog, NeoInput, NeoDatePicker, NeoConfirmDialog } from '../components/NeoUI';
import { BillTask, KanbanStatus } from '../types';
import { GripVertical, CheckCircle, AlertCircle, Clock, ChevronLeft, ChevronRight, Plus, Calendar, Edit, Trash2, Save, X as CloseIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils';
import { LanguageContext } from '../App';

interface KanbanProps {
  tasks: BillTask[];
  onUpdateStatus: (taskId: string, newStatus: KanbanStatus) => void;
  onAddTask: (task: Omit<BillTask, 'id' | 'status'>) => void;
  onUpdateTask: (task: BillTask) => void;
  onDeleteTask: (id: string) => void;
}

export const KanbanBoard: React.FC<KanbanProps> = ({ tasks, onUpdateStatus, onAddTask, onUpdateTask, onDeleteTask }) => {
  const { t } = useContext(LanguageContext);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  
  // ADD STATE
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', amount: '', dueDate: '' });

  // DETAIL / EDIT STATE
  const [selectedTask, setSelectedTask] = useState<BillTask | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<BillTask | null>(null);

  // Confirm Delete State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Configuration for Columns
  const COLUMNS: { id: KanbanStatus; title: string; color: string; bg: string; icon: React.ReactNode }[] = [
    { id: 'TODO', title: t.kanban.todo, color: 'border-yellow-500', bg: 'bg-yellow-50', icon: <Clock size={18}/> },
    { id: 'PLANNED', title: t.kanban.planned, color: 'border-blue-500', bg: 'bg-blue-50', icon: <Calendar size={18}/> },
    { id: 'PAID', title: t.kanban.paid, color: 'border-green-500', bg: 'bg-green-50', icon: <CheckCircle size={18}/> },
    { id: 'OVERDUE', title: t.kanban.overdue, color: 'border-red-500', bg: 'bg-red-50', icon: <AlertCircle size={18}/> }
  ];

  // Helper to calculate totals
  const getColumnTotal = (status: KanbanStatus) => {
    return tasks.filter(t => t.status === status).reduce((acc, t) => acc + t.amount, 0);
  };

  const totalDue = useMemo(() => getColumnTotal('TODO') + getColumnTotal('PLANNED') + getColumnTotal('OVERDUE'), [tasks]);
  const totalPaid = useMemo(() => getColumnTotal('PAID'), [tasks]);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTask(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: KanbanStatus) => {
    e.preventDefault();
    if (draggedTask) {
      onUpdateStatus(draggedTask, status);
      setDraggedTask(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  // Mobile "Click to Move" Handlers
  const moveTask = (e: React.MouseEvent, taskId: string, currentStatus: KanbanStatus, direction: 'next' | 'prev') => {
    e.stopPropagation(); // Prevent opening detail
    const statusOrder: KanbanStatus[] = ['TODO', 'PLANNED', 'PAID', 'OVERDUE'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    // Clamp index
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= statusOrder.length) newIndex = statusOrder.length - 1;

    onUpdateStatus(taskId, statusOrder[newIndex]);
  };

  // Add Task Handler
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.title && newTask.amount) {
      onAddTask({
        title: newTask.title,
        amount: Number(newTask.amount),
        dueDate: newTask.dueDate || new Date().toISOString().split('T')[0]
      });
      setIsAddDialogOpen(false);
      setNewTask({ title: '', amount: '', dueDate: '' });
    }
  };

  // Detail & Edit Handlers
  const handleTaskClick = (task: BillTask) => {
    setSelectedTask(task);
    setEditFormData(task);
    setIsEditing(false);
    setIsDetailOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData) {
        onUpdateTask(editFormData);
        setIsDetailOpen(false);
    }
  };

  const handleDeleteClick = () => {
      setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
      if (selectedTask) {
          onDeleteTask(selectedTask.id);
          setIsConfirmOpen(false);
          setIsDetailOpen(false);
      }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      {/* Header & Stats */}
      <div className="flex-none flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
        <div>
           <h2 className="text-3xl font-black uppercase flex items-center gap-2">
              BILL KANBAN
           </h2>
           <p className="text-gray-500 font-bold">Drag and drop to manage your bills.</p>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
           <div className="bg-white border-2 border-black p-2 px-4 shadow-neo-sm flex-1 lg:flex-none">
              <div className="text-[10px] font-bold uppercase text-gray-400">Total Due</div>
              <div className="font-black text-xl text-red-500">{formatCurrency(totalDue)}</div>
           </div>
           <div className="bg-white border-2 border-black p-2 px-4 shadow-neo-sm flex-1 lg:flex-none">
              <div className="text-[10px] font-bold uppercase text-gray-400">Total Paid</div>
              <div className="font-black text-xl text-green-600">{formatCurrency(totalPaid)}</div>
           </div>
           <NeoButton onClick={() => setIsAddDialogOpen(true)} icon={<Plus />} className="h-full aspect-square lg:aspect-auto lg:px-4 flex items-center justify-center" />
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 min-h-0 overflow-x-auto lg:overflow-hidden -mx-4 px-4 lg:mx-0 lg:px-0 pb-4">
        <div className="flex lg:grid lg:grid-cols-4 gap-4 lg:gap-6 h-full min-w-max lg:min-w-0">
          {COLUMNS.map((col) => (
            <div 
              key={col.id} 
              className="flex flex-col h-full w-[300px] lg:w-auto shrink-0 bg-transparent"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className={`
                flex-none flex items-center justify-between p-3 border-2 border-black border-b-0 
                font-bold uppercase shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] z-10 bg-white relative
              `}>
                <div className="flex items-center gap-2">
                   <span className={`p-1 rounded-sm border border-black ${col.bg}`}>{col.icon}</span>
                   {col.title}
                </div>
                <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">
                    {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>

              {/* Tasks Container */}
              <div className={`
                 flex-1 space-y-3 p-3 border-2 border-black bg-gray-50 shadow-neo overflow-y-auto
                 ${col.id === 'TODO' && 'bg-yellow-50/30'}
                 ${col.id === 'OVERDUE' && 'bg-red-50/30'}
                 ${col.id === 'PAID' && 'bg-green-50/30'}
              `}>
                {tasks.filter(t => t.status === col.id).map(task => (
                  <motion.div
                    layoutId={task.id}
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e as any, task.id)}
                    onClick={() => handleTaskClick(task)}
                    className="group relative cursor-pointer"
                  >
                    <NeoCard className="p-4 py-3 text-sm bg-white hover:border-brand-orange transition-colors cursor-grab active:cursor-grabbing relative z-10">
                      
                      {/* Card Content */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-black text-base leading-tight">{task.title}</div>
                        <GripVertical className="w-4 h-4 text-gray-300" />
                      </div>
                      
                      <div className="flex justify-between items-end border-t-2 border-gray-100 pt-2 mt-2">
                         <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">Amount</div>
                            <div className="font-bold text-lg text-brand-dark">{formatCurrency(task.amount)}</div>
                         </div>
                         <div className="text-right">
                            <div className="text-[10px] font-bold text-gray-400 uppercase">Due Date</div>
                            <div className={`font-mono font-bold ${col.id === 'OVERDUE' ? 'text-red-600 bg-red-100 px-1' : ''}`}>
                                {task.dueDate}
                            </div>
                         </div>
                      </div>

                      {/* Mobile Move Buttons */}
                      <div className="flex justify-between mt-3 pt-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={(e) => moveTask(e, task.id, task.status, 'prev')}
                            disabled={task.status === 'TODO'}
                            className="p-1 hover:bg-gray-100 disabled:opacity-30 border border-transparent hover:border-black transition-all rounded-sm"
                         >
                            <ChevronLeft size={16} />
                         </button>
                         <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest self-center">Move</span>
                         <button 
                            onClick={(e) => moveTask(e, task.id, task.status, 'next')}
                            disabled={task.status === 'OVERDUE'}
                            className="p-1 hover:bg-gray-100 disabled:opacity-30 border border-transparent hover:border-black transition-all rounded-sm"
                         >
                            <ChevronRight size={16} />
                         </button>
                      </div>
                    </NeoCard>
                  </motion.div>
                ))}
              </div>

              {/* Footer Total */}
              <div className="flex-none border-2 border-black border-t-0 bg-white p-2 flex justify-between items-center font-bold text-xs uppercase">
                 <span>Total:</span>
                 <span>{formatCurrency(getColumnTotal(col.id))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Bill Dialog */}
      <NeoDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        title="Add New Bill"
      >
         <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-1">
               <label className="font-bold text-sm uppercase">Bill Title</label>
               <NeoInput 
                  placeholder="e.g. Internet Bill" 
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  autoFocus
                  required
               />
            </div>
            <div className="space-y-1">
               <label className="font-bold text-sm uppercase">Amount</label>
               <NeoInput 
                  type="number"
                  placeholder="0.00" 
                  value={newTask.amount}
                  onChange={e => setNewTask({...newTask, amount: e.target.value})}
                  required
               />
            </div>
            <div className="space-y-1">
               <label className="font-bold text-sm uppercase">Due Date</label>
               <NeoDatePicker
                  value={newTask.dueDate}
                  onChange={(date) => setNewTask({...newTask, dueDate: date})}
                  required
               />
            </div>
            <div className="flex gap-2 pt-2">
               <NeoButton type="submit" className="w-full">Add to Board</NeoButton>
               <NeoButton type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</NeoButton>
            </div>
         </form>
      </NeoDialog>

      {/* Task Detail / Edit Dialog */}
      <NeoDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={isEditing ? "Edit Bill" : "Bill Details"}
      >
         {selectedTask && editFormData && (
             <div className="space-y-4">
                 {!isEditing ? (
                     // READ ONLY VIEW
                     <>
                         <div className="bg-gray-50 border-2 border-black p-4 space-y-3">
                             <div className="flex justify-between">
                                 <div className="text-xs font-bold uppercase text-gray-500">Title</div>
                                 <div className="text-xs font-bold bg-black text-white px-2 py-0.5 rounded-sm uppercase">{selectedTask.status}</div>
                             </div>
                             <div className="text-2xl font-black">{selectedTask.title}</div>
                             <div className="flex justify-between border-t-2 border-gray-200 pt-2">
                                 <div>
                                     <div className="text-xs font-bold uppercase text-gray-500">Amount</div>
                                     <div className="text-xl font-black text-brand-dark">{formatCurrency(selectedTask.amount)}</div>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-xs font-bold uppercase text-gray-500">Due Date</div>
                                     <div className="text-lg font-bold font-mono">{selectedTask.dueDate}</div>
                                 </div>
                             </div>
                         </div>
                         <div className="flex gap-2 mt-6">
                             <NeoButton onClick={() => setIsEditing(true)} icon={<Edit />} className="flex-1">Edit</NeoButton>
                             <NeoButton onClick={handleDeleteClick} variant="danger" icon={<Trash2 />} className="flex-1">Delete</NeoButton>
                         </div>
                     </>
                 ) : (
                     // EDIT FORM
                     <form onSubmit={handleUpdateSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="font-bold text-sm uppercase">Bill Title</label>
                            <NeoInput 
                                value={editFormData.title}
                                onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="font-bold text-sm uppercase">Amount</label>
                            <NeoInput 
                                type="number"
                                value={editFormData.amount}
                                onChange={e => setEditFormData({...editFormData, amount: Number(e.target.value)})}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="font-bold text-sm uppercase">Due Date</label>
                            <NeoDatePicker
                                value={editFormData.dueDate}
                                onChange={(date) => setEditFormData({...editFormData, dueDate: date})}
                                required
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <NeoButton type="submit" variant="success" icon={<Save />} className="w-full">Update</NeoButton>
                            <NeoButton type="button" variant="ghost" icon={<CloseIcon />} onClick={() => setIsEditing(false)}>Cancel</NeoButton>
                        </div>
                     </form>
                 )}
             </div>
         )}
      </NeoDialog>

      {/* Confirm Delete Dialog */}
      <NeoConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Bill"
        message="Are you sure you want to delete this bill?"
      />
    </div>
  );
};