import React, { useMemo, useState, useContext } from 'react';
import { NeoCard, NeoButton, NeoProgressBar, NeoInput, NeoDialog, NeoSelect, NeoConfirmDialog } from '../components/NeoUI';
import { Budget, Transaction } from '../types';
import { PieChart, Plus, ChevronLeft, ChevronRight, Calendar, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils';
import { LanguageContext } from '../App';

interface BudgetPageProps {
  budgets: Budget[];
  transactions: Transaction[];
  onAddBudget: (b: Omit<Budget, 'id'>) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetPage: React.FC<BudgetPageProps> = ({ budgets, transactions, onAddBudget, onDeleteBudget }) => {
  const { t, language } = useContext(LanguageContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [formData, setFormData] = useState({
    category: '',
    limit: '',
    period: 'MONTHLY' as 'MONTHLY' | 'WEEKLY'
  });

  // Delete Confirmation State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // --- HELPERS ---
  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  const formattedMonth = useMemo(() => {
    return new Intl.DateTimeFormat(language === 'ID' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' }).format(currentDate);
  }, [currentDate, language]);

  // --- DATA LOGIC ---
  const monthlyStats = useMemo(() => {
    // 1. Filter transactions for selected month & year
    const currentMonthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return (
        tDate.getMonth() === currentDate.getMonth() &&
        tDate.getFullYear() === currentDate.getFullYear() &&
        t.type === 'EXPENSE'
      );
    });

    // 2. Map budgets to actual spending
    const budgetData = budgets.map(budget => {
      const spent = currentMonthTransactions
        .filter(t => t.category.toLowerCase() === budget.category.toLowerCase())
        .reduce((acc, t) => acc + t.amount, 0);
      
      return {
        ...budget,
        spent,
        remaining: budget.limit - spent,
        percentage: Math.min(100, Math.round((spent / budget.limit) * 100))
      };
    });

    // 3. Calculate totals
    const totalBudget = budgetData.reduce((acc, b) => acc + b.limit, 0);
    const totalSpent = budgetData.reduce((acc, b) => acc + b.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const totalPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return { budgetData, totalBudget, totalSpent, totalRemaining, totalPercentage };
  }, [budgets, transactions, currentDate]);

  // --- HANDLERS ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBudget({
        category: formData.category,
        limit: Number(formData.limit),
        period: formData.period
    });
    setIsDialogOpen(false);
    setFormData({ category: '', limit: '', period: 'MONTHLY' });
  };

  const handleDeleteClick = (e: React.MouseEvent, budget: Budget) => {
      e.stopPropagation();
      setSelectedBudget(budget);
      setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
      if (selectedBudget) {
          onDeleteBudget(selectedBudget.id);
          setIsConfirmOpen(false);
          setSelectedBudget(null);
      }
  };

  return (
    <div className="space-y-8">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-4 border-black pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase flex items-center gap-2">
            <PieChart className="w-8 h-8" /> {t.budget.title}
          </h2>
          <p className="text-gray-600 font-medium">{t.budget.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto bg-white border-2 border-black p-1 shadow-neo-sm">
           <NeoButton variant="ghost" onClick={() => changeMonth(-1)} className="p-2">
             <ChevronLeft size={20} />
           </NeoButton>
           <div className="flex-1 text-center font-black text-lg min-w-[150px] uppercase flex items-center justify-center gap-2">
             <Calendar size={18}/> {formattedMonth}
           </div>
           <NeoButton variant="ghost" onClick={() => changeMonth(1)} className="p-2">
             <ChevronRight size={20} />
           </NeoButton>
        </div>
      </div>

      {/* MONTHLY SUMMARY DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <NeoCard color="dark" className="text-center py-8">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.budget.limit}</span>
            <div className="text-3xl lg:text-4xl font-black mt-2 text-white">
               {formatCurrency(monthlyStats.totalBudget)}
            </div>
         </NeoCard>

         <NeoCard color={monthlyStats.totalRemaining < 0 ? 'red' : 'white'} className="text-center py-8">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.transactions.expense}</span>
             <div className="text-3xl lg:text-4xl font-black mt-2">
               {formatCurrency(monthlyStats.totalSpent)}
             </div>
         </NeoCard>

         <NeoCard color={monthlyStats.totalRemaining < 0 ? 'red' : 'green'} className="text-center py-8">
             <span className="text-xs font-bold uppercase tracking-widest mix-blend-difference text-white">
                {monthlyStats.totalRemaining < 0 ? t.budget.over : 'Remaining'}
             </span>
             <div className="text-3xl lg:text-4xl font-black mt-2 text-white">
               {formatCurrency(Math.abs(monthlyStats.totalRemaining))}
             </div>
         </NeoCard>
      </div>

      {/* MAIN CONTENT */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold uppercase border-b-2 border-black pb-1 inline-block">
                {t.budget.breakdown} ({monthlyStats.budgetData.length})
            </h3>
            <NeoButton variant="secondary" onClick={() => setIsDialogOpen(true)} icon={<Plus className="w-4 h-4"/>}>
                {t.budget.set}
            </NeoButton>
        </div>

        {monthlyStats.budgetData.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-none bg-gray-50">
                <p className="text-gray-500 font-bold mb-4">No budgets set for this period.</p>
                <NeoButton onClick={() => setIsDialogOpen(true)} icon={<Plus />}>{t.budget.set}</NeoButton>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {monthlyStats.budgetData.map(b => {
                    const isOver = b.spent > b.limit;
                    const isWarning = !isOver && b.percentage > 80;
                    
                    return (
                        <NeoCard key={b.id} className={`relative overflow-hidden group ${isOver ? 'bg-red-50' : 'bg-white'}`}>
                            {/* Actions */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button 
                                    onClick={(e) => handleDeleteClick(e, b)}
                                    className="text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                                {isOver ? <AlertTriangle className="text-red-600"/> : <CheckCircle className="text-gray-300"/>}
                            </div>

                            <div className="mb-4">
                                <span className="text-xs font-black bg-black text-white px-2 py-1 uppercase">
                                    {b.category}
                                </span>
                            </div>

                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Spent</p>
                                    <p className={`text-xl font-black ${isOver ? 'text-red-600' : ''}`}>
                                        {formatCurrency(b.spent)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 font-bold uppercase">Limit</p>
                                    <p className="text-sm font-bold text-gray-700">{formatCurrency(b.limit)}</p>
                                </div>
                            </div>

                            <NeoProgressBar 
                                value={b.spent} 
                                max={b.limit} 
                                color={isOver ? 'bg-brand-red' : isWarning ? 'bg-yellow-400' : 'bg-brand-green'} 
                            />

                            <div className="mt-3 pt-3 border-t-2 border-gray-100 flex justify-between text-xs font-bold">
                                <span className={isOver ? 'text-red-600' : 'text-gray-400'}>
                                    {b.percentage}% Used
                                </span>
                                <span className={isOver ? 'text-red-600' : 'text-green-600'}>
                                    {isOver ? 'Over Budget' : `${formatCurrency(b.remaining)} Left`}
                                </span>
                            </div>
                        </NeoCard>
                    );
                })}
            </div>
        )}
      </div>

      {/* ADD BUDGET MODAL */}
      <NeoDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={t.budget.set}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.transactions.category}</label>
                <NeoInput 
                    placeholder="e.g. Coffee, Games" 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    required
                />
            </div>
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.budget.limit}</label>
                <NeoInput 
                    type="number"
                    placeholder="0.00" 
                    value={formData.limit}
                    onChange={e => setFormData({...formData, limit: e.target.value})}
                    required
                />
            </div>
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.budget.period}</label>
                <NeoSelect 
                    value={formData.period}
                    onChange={e => setFormData({...formData, period: e.target.value as any})}
                >
                    <option value="MONTHLY">{t.budget.monthly}</option>
                    <option value="WEEKLY">{t.budget.weekly}</option>
                </NeoSelect>
            </div>
            <div className="flex gap-2 mt-4">
              <NeoButton type="submit" className="w-full">{t.budget.set}</NeoButton>
              <NeoButton type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>{t.transactions.cancel}</NeoButton>
            </div>
        </form>
      </NeoDialog>

      {/* Confirm Delete Dialog */}
      <NeoConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Budget"
        message="Are you sure you want to remove this budget category?"
      />
    </div>
  );
};