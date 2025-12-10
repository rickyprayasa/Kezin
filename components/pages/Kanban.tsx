"use client";

import React, { useState, useEffect } from 'react';
import { NeoCard, NeoButton, NeoDialog, NeoInput, NeoDatePicker, NeoConfirmDialog } from '../NeoUI';
import { BillTask, KanbanStatus } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/utils';
import {
  Plus,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Save,
  X as CloseIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface KanbanBoardProps {
  organizationId: string;
  language: 'EN' | 'ID';
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ organizationId, language }) => {
  const t = TRANSLATIONS[language];
  const supabase = createClient();

  // State
  const [tasks, setTasks] = useState<BillTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<BillTask | null>(null);
  const [editFormData, setEditFormData] = useState<BillTask | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());

  const [newTask, setNewTask] = useState({
    title: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
  });

  // Column configuration
  const COLUMNS: { id: KanbanStatus; title: string; color: string; bg: string; icon: React.ReactNode }[] = [
    { id: 'TODO', title: t.kanban.todo, color: 'border-yellow-500', bg: 'bg-yellow-50', icon: <Clock size={18} /> },
    { id: 'PLANNED', title: t.kanban.planned, color: 'border-blue-500', bg: 'bg-blue-50', icon: <Calendar size={18} /> },
    { id: 'PAID', title: t.kanban.paid, color: 'border-green-500', bg: 'bg-green-50', icon: <CheckCircle size={18} /> },
    { id: 'OVERDUE', title: t.kanban.overdue, color: 'border-red-500', bg: 'bg-red-50', icon: <AlertCircle size={18} /> }
  ];

  // Fetch tasks from Supabase
  useEffect(() => {
    fetchTasks();
  }, [organizationId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bill_tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const formattedTasks: BillTask[] = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        amount: Number(task.amount),
        dueDate: task.due_date,
        status: task.status as KanbanStatus,
        assigneeId: task.assignee_id,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('bill_tasks')
        .insert({
          organization_id: organizationId,
          title: newTask.title,
          amount: Number(newTask.amount),
          due_date: newTask.dueDate,
          status: 'TODO',
          created_by: user.id,
        });

      if (error) throw error;

      await fetchTasks();
      setIsAddDialogOpen(false);
      setNewTask({ title: '', amount: '', dueDate: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    try {
      const { error } = await supabase
        .from('bill_tasks')
        .update({
          title: editFormData.title,
          amount: editFormData.amount,
          due_date: editFormData.dueDate,
        })
        .eq('id', editFormData.id);

      if (error) throw error;

      await fetchTasks();
      setIsDetailOpen(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTask) return;

    try {
      const { error } = await supabase
        .from('bill_tasks')
        .delete()
        .eq('id', selectedTask.id);

      if (error) throw error;

      await fetchTasks();
      setIsConfirmOpen(false);
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskClick = (task: BillTask) => {
    setSelectedTask(task);
    setEditFormData(task);
    setIsDetailOpen(true);
    setIsEditing(false);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: KanbanStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    try {
      const { error } = await supabase
        .from('bill_tasks')
        .update({ status: newStatus })
        .eq('id', draggedTaskId);

      if (error) throw error;

      await fetchTasks();
      setDraggedTaskId(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const toggleCardCollapse = (taskId: string) => {
    setCollapsedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  const getColumnTotal = (status: KanbanStatus) => {
    return tasks.filter(t => t.status === status).reduce((sum, t) => sum + t.amount, 0);
  };

  const totalDue = tasks.filter(t => t.status !== 'PAID').reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = tasks.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);

  const moveTask = async (e: React.MouseEvent, taskId: string, currentStatus: KanbanStatus, direction: 'prev' | 'next') => {
    e.stopPropagation();
    const currentIndex = COLUMNS.findIndex(col => col.id === currentStatus);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= COLUMNS.length) return;

    const newStatus = COLUMNS[newIndex].id;
    try {
      const { error } = await supabase
        .from('bill_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      await fetchTasks();
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      {/* Header & Stats */}
      <div className="flex-none flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight">BILL KANBAN</h1>
          <p className="text-sm text-gray-600 font-medium">Drag and drop to manage your bills.</p>
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
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:grid grid-cols-4 gap-3 h-full pb-2">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className="flex flex-col h-full bg-transparent min-w-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className={`
                flex-none flex items-center justify-between p-2 border-2 border-black border-b-0 
                font-bold text-xs uppercase shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] z-10 bg-white relative
              `}>
                <div className="flex items-center gap-1.5">
                  <span className={`p-0.5 rounded-sm border border-black ${col.bg}`}>{col.icon}</span>
                  <span className="truncate">{col.title}</span>
                </div>
                <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded-full">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>

              {/* Tasks Container */}
              <div className={`
                flex-1 space-y-2 p-2 border-2 border-black bg-gray-50 shadow-neo overflow-y-auto min-h-0 h-0
                ${col.id === 'TODO' && 'bg-yellow-50/30'}
                ${col.id === 'OVERDUE' && 'bg-red-50/30'}
                ${col.id === 'PAID' && 'bg-green-50/30'}
              `}>
                {tasks.filter(t => t.status === col.id).map(task => {
                  const isCollapsed = collapsedCards.has(task.id);
                  return (
                    <motion.div
                      layoutId={task.id}
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, task.id)}
                      className="group relative"
                    >
                      <NeoCard className="p-2.5 text-xs bg-white hover:border-brand-orange transition-all cursor-grab active:cursor-grabbing relative z-10">
                        {/* Card Header */}
                        <div className="flex justify-between items-start gap-1 mb-1.5">
                          <div
                            className="font-black text-sm leading-tight flex-1 cursor-pointer min-w-0"
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="truncate">{task.title}</div>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCardCollapse(task.id);
                              }}
                              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                              title={isCollapsed ? "Expand" : "Collapse"}
                            >
                              {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                            </button>
                            <GripVertical className="w-3 h-3 text-gray-300" />
                          </div>
                        </div>

                        {/* Collapsed View */}
                        {isCollapsed && (
                          <div className="flex justify-between items-center text-[10px] text-gray-500">
                            <span className="font-bold text-brand-dark">{formatCurrency(task.amount)}</span>
                            <span>{task.dueDate}</span>
                          </div>
                        )}

                        {/* Expanded View */}
                        {!isCollapsed && (
                          <>
                            <div className="flex justify-between items-end border-t border-gray-100 pt-1.5 mt-1.5">
                              <div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase">Amount</div>
                                <div className="font-bold text-sm text-brand-dark">{formatCurrency(task.amount)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[9px] font-bold text-gray-400 uppercase">Due</div>
                                <div className={`font-mono text-[10px] font-bold ${col.id === 'OVERDUE' ? 'text-red-600 bg-red-100 px-0.5' : ''}`}>
                                  {task.dueDate.substring(5)}
                                </div>
                              </div>
                            </div>

                            {/* Move Buttons */}
                            <div className="flex justify-between mt-2 pt-1.5 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => moveTask(e, task.id, task.status, 'prev')}
                                disabled={task.status === 'TODO'}
                                className="p-0.5 hover:bg-gray-100 disabled:opacity-30 rounded-sm"
                              >
                                <ChevronLeft size={12} />
                              </button>
                              <span className="text-[9px] font-bold text-gray-300 uppercase self-center">Move</span>
                              <button
                                onClick={(e) => moveTask(e, task.id, task.status, 'next')}
                                disabled={task.status === 'OVERDUE'}
                                className="p-0.5 hover:bg-gray-100 disabled:opacity-30 rounded-sm"
                              >
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </NeoCard>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer Total */}
              <div className="flex-none border-2 border-black border-t-0 bg-white p-1.5 flex justify-between items-center font-bold text-[10px] uppercase">
                <span>Total:</span>
                <span className="truncate">{formatCurrency(getColumnTotal(col.id))}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden h-full overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((col) => (
              <div
                key={col.id}
                className="flex flex-col h-full w-[300px] shrink-0 bg-transparent"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className={`flex-none flex items-center justify-between p-3 border-2 border-black border-b-0 font-bold uppercase shadow-neo z-10 bg-white`}>
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-sm border border-black ${col.bg}`}>{col.icon}</span>
                    {col.title}
                  </div>
                  <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">
                    {tasks.filter(t => t.status === col.id).length}
                  </span>
                </div>
                <div className="flex-1 space-y-3 p-3 border-2 border-black bg-gray-50 shadow-neo overflow-y-auto min-h-0">
                  {tasks.filter(t => t.status === col.id).map(task => (
                    <NeoCard key={task.id} className="p-4 text-sm bg-white" onClick={() => handleTaskClick(task)}>
                      <div className="font-black text-base mb-2">{task.title}</div>
                      <div className="text-lg font-bold text-brand-dark">{formatCurrency(task.amount)}</div>
                      <div className="text-xs text-gray-500 mt-1">{task.dueDate}</div>
                    </NeoCard>
                  ))}
                </div>
                <div className="flex-none border-2 border-black border-t-0 bg-white p-2 flex justify-between items-center font-bold text-xs uppercase">
                  <span>Total:</span>
                  <span>{formatCurrency(getColumnTotal(col.id))}</span>
                </div>
              </div>
            ))}
          </div>
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
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
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
              onChange={e => setNewTask({ ...newTask, amount: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-sm uppercase">Due Date</label>
            <NeoDatePicker
              value={newTask.dueDate}
              onChange={(date) => setNewTask({ ...newTask, dueDate: date })}
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
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-sm uppercase">Bill Title</label>
                  <NeoInput
                    value={editFormData.title}
                    onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-sm uppercase">Amount</label>
                  <NeoInput
                    type="number"
                    value={editFormData.amount}
                    onChange={e => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-sm uppercase">Due Date</label>
                  <NeoDatePicker
                    value={editFormData.dueDate}
                    onChange={(date) => setEditFormData({ ...editFormData, dueDate: date })}
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