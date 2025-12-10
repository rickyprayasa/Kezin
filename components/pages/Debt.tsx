"use client";

import React, { useState, useContext, useEffect } from 'react';
import { NeoCard, NeoButton, NeoProgressBar, NeoBadge, NeoDialog, NeoInput, NeoSelect, NeoDatePicker, NeoConfirmDialog } from '../NeoUI';
import { Debt, Asset } from '@/lib/types';
import { HandCoins, AlertTriangle, CheckCircle, Edit, Trash2, Save, X as CloseIcon, History, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { LanguageContext } from '../MainApp';

interface DebtPageProps {
  debts: Debt[];
  assets: Asset[];
  onAddDebt: (d: Omit<Debt, 'id' | 'paidAmount' | 'history'>) => void;
  onUpdateDebt: (d: Debt) => void;
  onDeleteDebt: (id: string) => void;
  onPayDebt: (debtId: string, amount: number, sourceAssetId: string, date: string) => void;
}

export const DebtPage: React.FC<DebtPageProps> = ({ debts, assets, onAddDebt, onUpdateDebt, onDeleteDebt, onPayDebt }) => {
  const { t } = useContext(LanguageContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    lender: '',
    totalAmount: '',
    dueDate: '',
    type: 'OWE' as 'OWE' | 'OWED'
  });

  // Detail / Edit State
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Debt | null>(null);

  // Payment State
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payAssetId, setPayAssetId] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  // History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Confirm Delete State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Sync selectedDebt with global state
  useEffect(() => {
      if (selectedDebt) {
          const updated = debts.find(d => d.id === selectedDebt.id);
          if (updated && updated !== selectedDebt) {
              setSelectedDebt(updated);
          }
      }
  }, [debts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDebt({
      name: formData.name,
      lender: formData.lender,
      totalAmount: Number(formData.totalAmount),
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      type: formData.type
    });
    setIsDialogOpen(false);
    setFormData({ name: '', lender: '', totalAmount: '', dueDate: '', type: 'OWE' });
  };

  const handleCardClick = (debt: Debt) => {
      setSelectedDebt(debt);
      setEditFormData(debt);
      setIsEditing(false);
      setIsDetailOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editFormData) {
          onUpdateDebt(editFormData);
          setSelectedDebt(editFormData);
          setIsEditing(false);
      }
  };

  const handleDeleteClick = () => {
      setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
      if (selectedDebt) {
          onDeleteDebt(selectedDebt.id);
          setIsConfirmOpen(false);
          setIsDetailOpen(false);
      }
  }

  const openPayDialog = (e: React.MouseEvent, debt: Debt) => {
      e.stopPropagation();
      setSelectedDebt(debt);
      setIsPayDialogOpen(true);
      setPayAmount('');
      setPayAssetId('');
      setPayDate(new Date().toISOString().split('T')[0]);
  };

  const openHistoryDialog = (e: React.MouseEvent, debt: Debt) => {
      e.stopPropagation();
      setSelectedDebt(debt);
      setIsHistoryOpen(true);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedDebt && payAmount && payAssetId) {
          try {
              onPayDebt(selectedDebt.id, Number(payAmount), payAssetId, payDate);
              setIsPayDialogOpen(false);
              setPayAmount('');
              setPayAssetId('');
          } catch (error: any) {
             if (error.message === "INSUFFICIENT_FUNDS") {
                 alert(t.transactions.insufficient);
             } else {
                 alert("Error processing payment");
             }
          }
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase flex items-center gap-2">
            <HandCoins className="w-8 h-8" /> {t.debt.title}
          </h2>
          <p className="text-gray-600 font-medium">{t.debt.subtitle}</p>
        </div>
        <NeoButton variant="danger" icon={<AlertTriangle />} onClick={() => setIsDialogOpen(true)}>{t.debt.add}</NeoButton>
      </div>

      {/* ADD NEW DEBT DIALOG */}
      <NeoDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        title={t.debt.add}
      >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.debt.recordName}</label>
                <NeoInput 
                    placeholder="e.g. Car Loan, Lent to John" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                />
            </div>

            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.transactions.type}</label>
                <NeoSelect 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                >
                    <option value="OWE">{t.debt.owe}</option>
                    <option value="OWED">{t.debt.owed}</option>
                </NeoSelect>
            </div>

            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.transactions.amount}</label>
                <NeoInput 
                    type="number"
                    placeholder="0.00" 
                    value={formData.totalAmount}
                    onChange={e => setFormData({...formData, totalAmount: e.target.value})}
                    required
                />
            </div>

            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.debt.person}</label>
                <NeoInput 
                    placeholder={formData.type === 'OWE' ? t.debt.lender : t.debt.borrower}
                    value={formData.lender}
                    onChange={e => setFormData({...formData, lender: e.target.value})}
                    required
                />
            </div>

            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.debt.due}</label>
                <NeoDatePicker 
                    value={formData.dueDate}
                    onChange={(date) => setFormData({...formData, dueDate: date})}
                    required
                />
            </div>

            <div className="flex gap-2 mt-4">
              <NeoButton type="submit" variant={formData.type === 'OWE' ? 'danger' : 'success'} className="w-full">{t.transactions.save}</NeoButton>
              <NeoButton type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>{t.transactions.cancel}</NeoButton>
            </div>
          </form>
      </NeoDialog>
      
      {/* DETAIL / EDIT DIALOG */}
      <NeoDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={isEditing ? t.transactions.edit : t.transactions.details}
      >
        {selectedDebt && editFormData && (
            <div className="space-y-4">
                {!isEditing ? (
                    <>
                        <div className="bg-gray-50 border-2 border-black p-4 space-y-4 relative">
                            <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-sm">
                                <Edit size={16} className="text-gray-500"/>
                            </button>
                            <div>
                                <div className="text-xs font-bold uppercase text-gray-500">Name</div>
                                <div className="text-2xl font-black">{selectedDebt.name}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-bold uppercase text-gray-500">{selectedDebt.type === 'OWE' ? 'Lender' : 'Borrower'}</div>
                                    <div className="font-bold">{selectedDebt.lender}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold uppercase text-gray-500">Due Date</div>
                                    <div className="font-bold font-mono">{selectedDebt.dueDate}</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase text-gray-500">Amount</div>
                                <div className={`text-xl font-black ${selectedDebt.type === 'OWE' ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(selectedDebt.totalAmount)}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                             <NeoButton onClick={(e) => { setIsDetailOpen(false); openPayDialog(e, selectedDebt); }} className="w-full" variant={selectedDebt.type === 'OWE' ? 'danger' : 'success'} icon={<Wallet />}>
                                {selectedDebt.type === 'OWE' ? t.debt.payNow : t.debt.markPaid}
                             </NeoButton>
                             <NeoButton onClick={(e) => { setIsDetailOpen(false); openHistoryDialog(e, selectedDebt); }} className="w-full" variant="secondary" icon={<History />}>
                                {t.debt.history}
                             </NeoButton>
                        </div>

                         <div className="pt-4 border-t-2 border-gray-100">
                             <NeoButton variant="danger" onClick={handleDeleteClick} className="w-full" icon={<Trash2 />}>
                                 {t.transactions.delete}
                             </NeoButton>
                         </div>
                    </>
                ) : (
                    <form onSubmit={handleUpdateSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="font-bold text-sm uppercase">{t.debt.recordName}</label>
                            <NeoInput 
                                value={editFormData.name}
                                onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="font-bold text-sm uppercase">{t.transactions.amount}</label>
                            <NeoInput 
                                type="number"
                                value={editFormData.totalAmount}
                                onChange={e => setEditFormData({...editFormData, totalAmount: Number(e.target.value)})}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="font-bold text-sm uppercase">{editFormData.type === 'OWE' ? t.debt.lender : t.debt.borrower}</label>
                            <NeoInput 
                                value={editFormData.lender}
                                onChange={e => setEditFormData({...editFormData, lender: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="font-bold text-sm uppercase">{t.debt.due}</label>
                            <NeoDatePicker
                                value={editFormData.dueDate}
                                onChange={(date) => setEditFormData({...editFormData, dueDate: date})}
                                required
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

      {/* PAYMENT DIALOG */}
      <NeoDialog
        isOpen={isPayDialogOpen}
        onClose={() => setIsPayDialogOpen(false)}
        title={selectedDebt?.type === 'OWE' ? t.debt.payNow : t.debt.markPaid}
      >
          <form onSubmit={handlePaySubmit} className="space-y-4">
             <div className="bg-gray-50 p-3 border-2 border-black mb-4">
                 <div className="text-xs font-bold uppercase text-gray-500">Record</div>
                 <div className="font-black text-lg">{selectedDebt?.name}</div>
                 <div className="text-xs font-bold mt-1">Remaining: {formatCurrency((selectedDebt?.totalAmount || 0) - (selectedDebt?.paidAmount || 0))}</div>
             </div>

             <div className="space-y-1">
                 <label className="font-bold text-sm uppercase">{t.transactions.amount}</label>
                 <NeoInput 
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    autoFocus
                 />
             </div>

             <div className="space-y-1">
                 <label className="font-bold text-sm uppercase">{t.debt.paymentDate}</label>
                 <NeoDatePicker 
                    value={payDate}
                    onChange={setPayDate}
                    required
                 />
             </div>

             <div className="space-y-1">
                 <label className="font-bold text-sm uppercase">{selectedDebt?.type === 'OWE' ? t.debt.payFrom : t.debt.receiveAccount}</label>
                 <NeoSelect
                    value={payAssetId}
                    onChange={e => setPayAssetId(e.target.value)}
                    required
                 >
                    <option value="" disabled>{t.transactions.selectAccount}</option>
                    {assets.filter(a => a.type === 'CASH' || a.type === 'INVESTMENT').map(asset => (
                         <option key={asset.id} value={asset.id}>
                             {asset.name} ({formatCurrency(asset.value)})
                         </option>
                     ))}
                 </NeoSelect>
                 {payAssetId && selectedDebt?.type === 'OWE' && (
                     <div className="text-[10px] text-right font-bold text-gray-500">
                         Available: {formatCurrency(assets.find(a => a.id === payAssetId)?.value || 0)}
                     </div>
                 )}
             </div>

             <div className="flex gap-2 pt-2">
                 <NeoButton type="submit" className="w-full" variant="success">{t.transactions.save}</NeoButton>
                 <NeoButton type="button" variant="ghost" onClick={() => setIsPayDialogOpen(false)}>{t.transactions.cancel}</NeoButton>
             </div>
          </form>
      </NeoDialog>

      {/* HISTORY DIALOG */}
      <NeoDialog
         isOpen={isHistoryOpen}
         onClose={() => setIsHistoryOpen(false)}
         title={t.debt.history}
      >
         <div className="space-y-4">
             {selectedDebt && (
                 <>
                    <div className="flex justify-between items-center bg-black text-white p-3 font-bold text-sm">
                        <span>{selectedDebt.name}</span>
                        <span>{Math.round((selectedDebt.paidAmount / selectedDebt.totalAmount) * 100)}% Paid</span>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto border-2 border-black">
                        {selectedDebt.history && selectedDebt.history.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 font-bold uppercase text-xs sticky top-0">
                                    <tr>
                                        <th className="p-2 border-b-2 border-black">{t.transactions.date}</th>
                                        <th className="p-2 border-b-2 border-black">{t.transactions.sourceAccount}</th>
                                        <th className="p-2 border-b-2 border-black text-right">{t.transactions.amount}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {selectedDebt.history.map(h => (
                                        <tr key={h.id} className="bg-white">
                                            <td className="p-2 font-medium">{h.date}</td>
                                            <td className="p-2">{h.sourceAssetName}</td>
                                            <td className={`p-2 text-right font-black ${selectedDebt.type === 'OWE' ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatCurrency(h.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-6 text-center text-gray-400 font-bold italic">No payments recorded yet.</div>
                        )}
                    </div>
                    
                    <NeoButton variant="ghost" onClick={() => setIsHistoryOpen(false)} className="w-full">{t.transactions.cancel}</NeoButton>
                 </>
             )}
         </div>
      </NeoDialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OWE SECTION */}
        <div>
          <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-brand-red inline-block pr-4">{t.debt.owe}</h3>
          <div className="space-y-4">
            {debts.filter(d => d.type === 'OWE').length === 0 && <p className="text-gray-400 italic">Debt free! Congrats!</p>}
            {debts.filter(d => d.type === 'OWE').map(debt => (
               <NeoCard 
                key={debt.id} 
                className="bg-red-50 cursor-pointer hover:border-brand-red transition-colors" 
                title={debt.name}
                onClick={() => handleCardClick(debt)}
               >
                  <div className="flex justify-between mb-4">
                    <span className="font-bold text-gray-600">{t.debt.lender}: {debt.lender}</span>
                    <span className="font-bold text-red-600">{t.debt.due}: {debt.dueDate}</span>
                  </div>
                  <div className="mb-4">
                    <NeoProgressBar 
                       value={debt.paidAmount} 
                       max={debt.totalAmount} 
                       color="bg-brand-red"
                       label={t.debt.repayment}
                    />
                  </div>
                  <div className="flex gap-2">
                    <NeoButton variant="secondary" className="flex-1 text-sm" onClick={(e) => openHistoryDialog(e, debt)}>{t.debt.history}</NeoButton>
                    <NeoButton variant="primary" className="flex-1 text-sm" onClick={(e) => openPayDialog(e, debt)}>{t.debt.payNow}</NeoButton>
                  </div>
               </NeoCard>
            ))}
          </div>
        </div>

        {/* OWED SECTION */}
        <div>
          <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-brand-green inline-block pr-4">{t.debt.owed}</h3>
          <div className="space-y-4">
            {debts.filter(d => d.type === 'OWED').length === 0 && <p className="text-gray-400 italic">No one owes you money.</p>}
            {debts.filter(d => d.type === 'OWED').map(debt => (
               <NeoCard 
                key={debt.id} 
                className="bg-green-50 cursor-pointer hover:border-brand-green transition-colors" 
                title={debt.name}
                onClick={() => handleCardClick(debt)}
               >
                  <div className="flex justify-between mb-4">
                    <span className="font-bold text-gray-600">{t.debt.borrower}: {debt.lender}</span>
                    <span className="font-bold text-green-600">{t.debt.due}: {debt.dueDate}</span>
                  </div>
                  <div className="mb-4">
                    <NeoProgressBar 
                       value={debt.paidAmount} 
                       max={debt.totalAmount} 
                       color="bg-brand-green"
                       label={t.debt.collected}
                    />
                  </div>
                  <div className="flex gap-2">
                    <NeoButton variant="secondary" className="flex-1 text-sm" onClick={(e) => openHistoryDialog(e, debt)}>{t.debt.remind}</NeoButton>
                    <NeoButton variant="success" className="flex-1 text-sm" icon={<CheckCircle className="w-4 h-4"/>} onClick={(e) => openPayDialog(e, debt)}>{t.debt.markPaid}</NeoButton>
                  </div>
               </NeoCard>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <NeoConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Debt Record"
        message="Are you sure you want to delete this debt record?"
      />
    </div>
  );
};