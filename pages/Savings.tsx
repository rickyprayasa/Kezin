"use client";

import React, { useContext, useState, useEffect } from 'react';
import { NeoCard, NeoButton, NeoProgressBar, NeoInput, NeoDialog, NeoSelect, NeoDatePicker, NeoConfirmDialog } from '../components/NeoUI';
import { SavingsGoal, Asset } from '../types';
import { Target, PiggyBank, Plus, Coins, Calendar, History, Edit, Trash2, Save, X as CloseIcon } from 'lucide-react';
import { formatCurrency } from '../utils';
import { LanguageContext } from '../App';

interface SavingsPageProps {
  goals: SavingsGoal[];
  assets: Asset[];
  onAddGoal: (g: Omit<SavingsGoal, 'id' | 'currentAmount' | 'history'>) => void;
  onUpdateGoalAmount: (id: string, amount: number, sourceAssetId: string, date: string) => void;
  onUpdateGoal: (g: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
}

export const SavingsPage: React.FC<SavingsPageProps> = ({ goals, assets, onAddGoal, onUpdateGoalAmount, onUpdateGoal, onDeleteGoal }) => {
  const { t } = useContext(LanguageContext);
  
  // Create Goal State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', deadline: '', icon: '💰' });

  // Add Money State
  const [isAddMoneyDialogOpen, setIsAddMoneyDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [addMoneyDate, setAddMoneyDate] = useState(new Date().toISOString().split('T')[0]);

  // Detail / Edit View State
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [viewGoal, setViewGoal] = useState<SavingsGoal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<SavingsGoal | null>(null);

  // Confirm Delete State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Sync viewGoal with global state (goals prop) to reflect changes like "Add Money" immediately
  useEffect(() => {
    if (viewGoal) {
        const updated = goals.find(g => g.id === viewGoal.id);
        if (updated && updated !== viewGoal) {
            setViewGoal(updated);
        }
    }
  }, [goals]);

  // Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddGoal({
      name: newGoal.name,
      targetAmount: Number(newGoal.targetAmount),
      deadline: newGoal.deadline,
      icon: newGoal.icon
    });
    setIsCreateDialogOpen(false);
    setNewGoal({ name: '', targetAmount: '', deadline: '', icon: '💰' });
  };

  const openAddMoneyDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening detail view
    setSelectedGoalId(id);
    setIsAddMoneyDialogOpen(true);
    setAmountToAdd('');
    setSelectedAssetId('');
    setAddMoneyDate(new Date().toISOString().split('T')[0]);
  };

  const handleAddMoneySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoalId && amountToAdd && selectedAssetId) {
        try {
            onUpdateGoalAmount(selectedGoalId, Number(amountToAdd), selectedAssetId, addMoneyDate);
            setIsAddMoneyDialogOpen(false);
            setSelectedGoalId(null);
            setAmountToAdd('');
            setSelectedAssetId('');
        } catch (error: any) {
            if (error.message === 'INSUFFICIENT_FUNDS') {
                alert(t.transactions.insufficient);
            } else {
                alert("Error adding money");
            }
        }
    }
  };

  const openDetailDialog = (goal: SavingsGoal) => {
      setViewGoal(goal);
      setEditFormData(goal);
      setIsEditing(false);
      setIsDetailDialogOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData) {
        onUpdateGoal(editFormData);
        setViewGoal(editFormData); // Update local view
        setIsEditing(false);
    }
  };

  const handleDeleteClick = () => {
      setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
      if (viewGoal) {
          onDeleteGoal(viewGoal.id);
          setIsConfirmOpen(false);
          setIsDetailDialogOpen(false);
      }
  }

  const getSelectedGoalName = () => {
    return goals.find(g => g.id === selectedGoalId)?.name || 'Goal';
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase flex items-center gap-2">
            <PiggyBank className="w-8 h-8" /> {t.savings.title}
          </h2>
          <p className="text-gray-600 font-medium">{t.savings.subtitle}</p>
        </div>
        <NeoButton onClick={() => setIsCreateDialogOpen(true)} icon={<Plus />}>{t.savings.new}</NeoButton>
      </div>

      {/* CREATE GOAL DIALOG */}
      <NeoDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
        title={t.savings.create}
      >
          <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.savings.name}</label>
                <NeoInput 
                placeholder="e.g. New Laptop, Bali Trip" 
                value={newGoal.name}
                onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                required
                />
            </div>
            
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.savings.amount}</label>
                <NeoInput 
                type="number" 
                placeholder="0.00" 
                value={newGoal.targetAmount}
                onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})}
                required
                />
            </div>
            
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.savings.deadline} (Optional)</label>
                <NeoDatePicker
                    value={newGoal.deadline}
                    onChange={(date) => setNewGoal({...newGoal, deadline: date})}
                />
            </div>
            
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.savings.icon}</label>
                <NeoInput 
                placeholder="Emoji (e.g. 🏖️)" 
                value={newGoal.icon}
                onChange={e => setNewGoal({...newGoal, icon: e.target.value})}
                />
            </div>

            <div className="flex gap-2 mt-4">
              <NeoButton type="submit" className="w-full">{t.savings.create}</NeoButton>
              <NeoButton type="button" variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>{t.transactions.cancel}</NeoButton>
            </div>
          </form>
      </NeoDialog>

      {/* GOAL DETAIL / EDIT DIALOG */}
      {/* Moved before AddMoneyDialog so AddMoney appears on top if opened from here */}
      <NeoDialog
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        title={isEditing ? t.transactions.edit : t.savings.details}
      >
        {viewGoal && editFormData && (
          <div className="space-y-6">
             {!isEditing ? (
                 // READ VIEW
                 <>
                     {/* Summary Header */}
                     <div className="flex items-start gap-4 p-4 bg-gray-50 border-2 border-black relative">
                        <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-sm">
                            <Edit size={16} className="text-gray-500"/>
                        </button>
                        <div className="text-5xl">{viewGoal.icon}</div>
                        <div className="flex-1">
                           <h3 className="text-2xl font-black uppercase">{viewGoal.name}</h3>
                           <div className="text-sm text-gray-500 font-bold">
                              {t.savings.deadline}: {viewGoal.deadline || '-'}
                           </div>
                        </div>
                     </div>

                     {/* Stats */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-2 border-2 border-black bg-green-50">
                            <div className="text-xs font-bold uppercase text-gray-500">{t.savings.progress}</div>
                            <div className="text-xl font-black text-green-700">{formatCurrency(viewGoal.currentAmount)}</div>
                        </div>
                        <div className="p-2 border-2 border-black bg-gray-50">
                            <div className="text-xs font-bold uppercase text-gray-500">{t.savings.target}</div>
                            <div className="text-xl font-black">{formatCurrency(viewGoal.targetAmount)}</div>
                        </div>
                     </div>

                     {/* Progress Bar */}
                     <NeoProgressBar 
                        value={viewGoal.currentAmount} 
                        max={viewGoal.targetAmount} 
                        label={`${t.savings.remaining}: ${formatCurrency(Math.max(0, viewGoal.targetAmount - viewGoal.currentAmount))}`}
                     />

                     {/* Add Money Button in Details */}
                     <div className="py-2">
                        <NeoButton 
                            onClick={(e) => openAddMoneyDialog(viewGoal.id, e)} 
                            className="w-full" 
                            icon={<Plus />}
                        >
                            {t.savings.addMoney}
                        </NeoButton>
                     </div>

                     {/* History */}
                     <div>
                        <h4 className="font-black uppercase border-b-2 border-black mb-2 flex items-center gap-2">
                            <History size={16} /> {t.savings.history}
                        </h4>
                        <div className="max-h-[200px] overflow-y-auto border-2 border-black bg-white">
                            {viewGoal.history.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 italic text-sm">
                                    {t.savings.noHistory}
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-black text-white font-bold text-xs uppercase">
                                        <tr>
                                            <th className="p-2">{t.transactions.date}</th>
                                            <th className="p-2">{t.transactions.sourceAccount}</th>
                                            <th className="p-2 text-right">{t.transactions.amount}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {viewGoal.history.map(h => (
                                            <tr key={h.id} className="hover:bg-gray-50">
                                                <td className="p-2 font-bold">{h.date}</td>
                                                <td className="p-2">{h.sourceAssetName}</td>
                                                <td className="p-2 text-right font-black text-green-600">+{formatCurrency(h.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                     </div>

                     {/* Delete Button */}
                     <div className="pt-4 border-t-2 border-gray-100">
                         <NeoButton variant="danger" onClick={handleDeleteClick} className="w-full" icon={<Trash2 />}>
                             {t.transactions.delete}
                         </NeoButton>
                     </div>
                 </>
             ) : (
                 // EDIT FORM
                 <form onSubmit={handleUpdateSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="font-bold text-sm uppercase">{t.savings.name}</label>
                        <NeoInput 
                            value={editFormData.name}
                            onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                            required
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="font-bold text-sm uppercase">{t.savings.amount}</label>
                        <NeoInput 
                            type="number"
                            value={editFormData.targetAmount}
                            onChange={e => setEditFormData({...editFormData, targetAmount: Number(e.target.value)})}
                            required
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="font-bold text-sm uppercase">{t.savings.deadline}</label>
                        <NeoDatePicker
                            value={editFormData.deadline}
                            onChange={(date) => setEditFormData({...editFormData, deadline: date})}
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="font-bold text-sm uppercase">{t.savings.icon}</label>
                        <NeoInput 
                            value={editFormData.icon}
                            onChange={e => setEditFormData({...editFormData, icon: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <NeoButton type="submit" variant="success" icon={<Save />} className="w-full">{t.transactions.update}</NeoButton>
                        <NeoButton type="button" variant="ghost" icon={<CloseIcon />} onClick={() => setIsEditing(false)}>{t.transactions.cancel}</NeoButton>
                    </div>
                 </form>
             )}
          </div>
        )}
      </NeoDialog>

      {/* ADD MONEY DIALOG */}
      <NeoDialog
        isOpen={isAddMoneyDialogOpen}
        onClose={() => setIsAddMoneyDialogOpen(false)}
        title={`${t.savings.addMoney}: ${getSelectedGoalName()}`}
      >
        <form onSubmit={handleAddMoneySubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.transactions.amount}</label>
                <NeoInput 
                    type="number"
                    placeholder="0.00"
                    value={amountToAdd}
                    onChange={e => setAmountToAdd(e.target.value)}
                    autoFocus
                    required
                />
            </div>
            
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.transactions.date}</label>
                <NeoDatePicker
                    value={addMoneyDate}
                    onChange={(date) => setAddMoneyDate(date)}
                    required
                />
            </div>

            <div className="space-y-1">
                 <label className="font-bold text-sm uppercase">{t.transactions.sourceAccount}</label>
                 <NeoSelect
                    value={selectedAssetId}
                    onChange={e => setSelectedAssetId(e.target.value)}
                    required
                 >
                     <option value="" disabled>{t.transactions.selectAccount}</option>
                     {assets.filter(a => a.type === 'CASH' || a.type === 'INVESTMENT').map(asset => (
                         <option key={asset.id} value={asset.id}>
                             {asset.name} ({formatCurrency(asset.value)})
                         </option>
                     ))}
                 </NeoSelect>
                 {selectedAssetId && (
                    <div className="text-[10px] text-right font-bold text-gray-500">
                        Available: {formatCurrency(assets.find(a => a.id === selectedAssetId)?.value || 0)}
                    </div>
                 )}
            </div>
            <div className="flex gap-2 pt-2">
                <NeoButton type="submit" variant="success" className="w-full" icon={<Coins />}>
                    {t.transactions.save}
                </NeoButton>
                <NeoButton type="button" variant="ghost" onClick={() => setIsAddMoneyDialogOpen(false)}>
                    {t.transactions.cancel}
                </NeoButton>
            </div>
        </form>
      </NeoDialog>

      {/* GOAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => (
          <NeoCard 
            key={goal.id} 
            color="white" 
            onClick={() => openDetailDialog(goal)}
            className="flex flex-col gap-4 h-full justify-between group hover:shadow-neo-lg transition-all cursor-pointer active:scale-[0.99]"
          >
            <div className="flex justify-between items-start">
               <div className="text-4xl bg-gray-100 border-2 border-black p-2 shadow-neo-sm">{goal.icon}</div>
               <div className="text-right">
                 <div className="text-xs font-bold text-gray-500 uppercase">{t.savings.target}</div>
                 <div className="text-xl font-black">{formatCurrency(goal.targetAmount)}</div>
               </div>
            </div>
            
            <div>
               <h3 className="text-xl font-bold mb-1 group-hover:text-brand-orange transition-colors">{goal.name}</h3>
               <p className="text-xs font-medium text-gray-500 mb-3">{t.savings.deadline}: {goal.deadline || 'No date'}</p>
               <NeoProgressBar 
                 value={goal.currentAmount} 
                 max={goal.targetAmount} 
                 color="bg-brand-green"
                 label={t.savings.progress}
               />
            </div>

            <NeoButton 
                onClick={(e) => openAddMoneyDialog(goal.id, e)}
                variant="secondary" 
                className="w-full text-sm py-2 border-2" 
                icon={<Plus className="w-4 h-4"/>}
            >
              {t.savings.addMoney}
            </NeoButton>
          </NeoCard>
        ))}
      </div>

      {/* Confirm Delete Dialog */}
      <NeoConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal?"
      />
    </div>
  );
};