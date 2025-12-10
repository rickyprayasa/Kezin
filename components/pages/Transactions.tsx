import React, { useState, useMemo, useContext } from 'react';
import { NeoCard, NeoButton, NeoInput, NeoSelect, NeoBadge, NeoDialog, NeoDatePicker, NeoConfirmDialog } from '../NeoUI';
import { Transaction, TransactionType, CategoryState, Asset, User } from '@/lib/types';
import { Plus, Search, ArrowUpRight, ArrowDownLeft, RefreshCw, Calendar, Tag, Wallet, Trash2, Edit, Save, X as CloseIcon, Download, Sparkles, Loader2, History, User as UserIcon, Crown, Shield } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { LanguageContext } from '../MainApp';
import { suggestCategory } from '@/lib/gemini';

interface TransactionsPageProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id' | 'userId'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  categories: CategoryState;
  assets: Asset[];
  users: User[];
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  categories,
  assets,
  users
}) => {
  const { t } = useContext(LanguageContext);
  const [filter, setFilter] = useState<'ALL' | TransactionType>('ALL');
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Detail & Edit State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Transaction | null>(null);

  // Confirm Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Auto Cat State
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [isManualCategory, setIsManualCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for NEW Transaction
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    type: 'EXPENSE' as TransactionType,
    date: new Date().toISOString().split('T')[0],
    accountId: ''
  });

  // Calculate Stats for Symmetry
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filter === 'ALL' || t.type === filter;
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await onAddTransaction({
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category || 'General',
        type: formData.type,
        date: formData.date,
        accountId: formData.accountId
      });
      setIsDialogOpen(false);
      setFormData({ description: '', amount: '', category: '', type: 'EXPENSE', date: new Date().toISOString().split('T')[0], accountId: '' });
    } catch (error: any) {
      if (error.message === "INSUFFICIENT_FUNDS") {
        alert(t.transactions.insufficient);
      } else {
        alert("Error adding transaction: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowClick = (t: Transaction) => {
    setSelectedTransaction(t);
    setEditFormData(t);
    setIsEditing(false);
    setIsDetailOpen(true);
  };

  const handleSaveEdit = () => {
    if (editFormData) {
      onUpdateTransaction(editFormData);
      setSelectedTransaction(editFormData); // Update the view immediately
      setIsDetailOpen(false);
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTransaction) {
      onDeleteTransaction(selectedTransaction.id);
      setIsConfirmOpen(false);
      setIsDetailOpen(false);
    }
  }

  const exportCSV = () => {
    const headers = ["Date", "User", "Type", "Category", "Description", "Amount", "Source Account"];
    const rows = filteredTransactions.map(t => [
      t.date,
      getUser(t.userId)?.name || 'Unknown',
      t.type,
      t.category,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      `"${getAssetName(t.accountId)}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic categories for forms
  const getCategoriesForType = (type: TransactionType) =>
    type === 'INCOME' ? categories.income : categories.expense;

  // AI Auto Categorize Handler
  const handleAutoCategorize = async (description: string, type: TransactionType, isEditMode: boolean) => {
    if (!description) return;

    setIsAutoCategorizing(true);
    const availableCats = getCategoriesForType(type);

    const suggested = await suggestCategory(description, availableCats);

    if (suggested) {
      if (isEditMode && editFormData) {
        setEditFormData({ ...editFormData, category: suggested });
      } else {
        setFormData(prev => ({ ...prev, category: suggested }));
      }
    }
    setIsAutoCategorizing(false);
  };

  // Get Asset Name helper
  const getAssetName = (id?: string) => {
    if (!id) return '-';
    const asset = assets.find(a => a.id === id);
    return asset ? asset.name : 'Unknown';
  };

  // Get User helper
  const getUser = (id: string) => {
    return users.find(u => u.id === id);
  }

  // Get Role Icon helper
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={10} className="text-yellow-500" />;
      case 'admin':
        return <Shield size={10} className="text-blue-500" />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-black pb-4 gap-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">{t.transactions.title}</h2>
          <p className="text-gray-600 font-bold">{t.transactions.subtitle}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <NeoButton onClick={exportCSV} variant="secondary" icon={<Download className="w-4 h-4" />} className="flex-1 md:flex-none">
            Export CSV
          </NeoButton>
          <NeoButton onClick={() => setIsDialogOpen(true)} icon={<Plus className="w-4 h-4" />} className="flex-1 md:flex-none">
            {t.transactions.new}
          </NeoButton>
        </div>
      </div>

      {/* Symmetrical Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-light border-2 border-black p-4 shadow-neo-sm flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold uppercase text-gray-500">{t.transactions.totalIncome}</p>
            <p className="text-xl lg:text-2xl font-black text-green-600 truncate">+{formatCurrency(stats.income)}</p>
          </div>
          <div className="bg-green-200 p-2 border-2 border-black rounded-full"><ArrowDownLeft size={20} /></div>
        </div>
        <div className="bg-brand-light border-2 border-black p-4 shadow-neo-sm flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold uppercase text-gray-500">{t.transactions.totalExpense}</p>
            <p className="text-xl lg:text-2xl font-black text-red-600 truncate">-{formatCurrency(stats.expense)}</p>
          </div>
          <div className="bg-red-200 p-2 border-2 border-black rounded-full"><ArrowUpRight size={20} /></div>
        </div>
        <div className="bg-brand-orange border-2 border-black p-4 shadow-neo-sm flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold uppercase text-black">{t.transactions.netBalance}</p>
            <p className="text-xl lg:text-2xl font-black text-black truncate">{formatCurrency(stats.balance)}</p>
          </div>
          <div className="bg-white p-2 border-2 border-black rounded-full"><RefreshCw size={20} /></div>
        </div>
      </div>

      {/* Controls Toolbar */}
      <NeoCard className="p-4 bg-white flex flex-col md:flex-row gap-4 items-center" color="white">
        <div className="relative flex-1 w-full">
          <NeoInput
            placeholder={t.transactions.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>

        <div className="flex w-full md:w-auto bg-gray-100 p-1 border-2 border-black gap-1 overflow-x-auto">
          {['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`
                flex-1 px-4 py-2 font-bold text-xs uppercase transition-all
                ${filter === f
                  ? 'bg-black text-white shadow-md'
                  : 'bg-transparent text-gray-500 hover:bg-white hover:text-black'}
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </NeoCard>

      {/* Data Grid / Table View */}
      <div className="border-2 border-black shadow-neo bg-white overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-black text-white font-bold text-xs uppercase py-3 px-4 border-b-2 border-black hidden md:grid">
          <div className="col-span-2 flex items-center gap-2"><Calendar size={14} /> {t.transactions.date}</div>
          <div className="col-span-2 flex items-center gap-2"><UserIcon size={14} /> {t.transactions.user}</div>
          <div className="col-span-2 flex items-center gap-2"><Tag size={14} /> {t.transactions.category}</div>
          <div className="col-span-2">{t.transactions.description}</div>
          <div className="col-span-2 flex justify-center items-center gap-2"><Wallet size={14} /> {t.transactions.sourceAccount}</div>
          <div className="col-span-2 text-right">{t.transactions.amount}</div>
        </div>

        {/* Table Body */}
        <div className="divide-y-2 divide-gray-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-10 text-center text-gray-400 font-bold italic">No transactions found.</div>
          ) : (
            filteredTransactions.map((t) => {
              const user = getUser(t.userId);
              return (
                <div
                  key={t.id}
                  onClick={() => handleRowClick(t)}
                  className="flex flex-col md:grid md:grid-cols-12 p-4 items-center hover:bg-orange-50 transition-colors group cursor-pointer"
                >
                  {/* Mobile Only Label */}
                  <div className="md:hidden w-full flex justify-between text-xs font-bold text-gray-400 mb-1">
                    <span>{t.date}</span>
                    <span className="flex items-center gap-1">
                      <img src={user?.avatar} className="w-4 h-4 rounded-full border border-black" alt="" />
                      {getRoleIcon(user?.role)}
                      {user?.name}
                    </span>
                  </div>

                  {/* Desktop Columns */}
                  <div className="col-span-2 text-sm font-bold text-gray-600 hidden md:block">{t.date}</div>
                  <div className="col-span-2 hidden md:flex items-center gap-2">
                    {user && (
                      <>
                        <img src={user.avatar} className="w-6 h-6 rounded-full border border-black" alt={user.name} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.name}
                          </span>
                          {user.role && (
                            <span className="text-[10px] text-gray-400 capitalize">{user.role}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="col-span-2 w-full md:w-auto mb-2 md:mb-0">
                    <NeoBadge color="bg-white text-black border-gray-300 group-hover:border-black transition-colors">
                      {t.category}
                    </NeoBadge>
                  </div>
                  <div className="col-span-2 font-bold text-lg md:text-base w-full md:w-auto truncate">
                    {t.description}
                  </div>
                  <div className="col-span-2 flex md:justify-center w-full md:w-auto mt-2 md:mt-0">
                    <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 border border-gray-300 text-gray-600 uppercase rounded-sm">
                      {getAssetName(t.accountId)}
                    </span>
                  </div>
                  <div className={`
                    col-span-2 text-right w-full md:w-auto mt-2 md:mt-0 font-black text-lg
                    ${t.type === 'INCOME' ? 'text-green-600' : t.type === 'EXPENSE' ? 'text-red-600' : 'text-blue-600'}
                  `}>
                    {t.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(t.amount)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add Dialog */}
      <NeoDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={t.transactions.new}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-sm uppercase">{t.transactions.description}</label>
            <div className="relative">
              <NeoInput
                placeholder="What did you buy?"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                required
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => handleAutoCategorize(formData.description, formData.type, false)}
                disabled={!formData.description || isAutoCategorizing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-accent hover:bg-purple-400 text-black border border-black shadow-neo-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="AI Auto-Categorize"
              >
                {isAutoCategorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-sm uppercase">{t.transactions.amount}</label>
              <NeoInput
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-sm uppercase">{t.transactions.type}</label>
              <NeoSelect
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as TransactionType })}
              >
                <option value="EXPENSE">{t.transactions.expense}</option>
                <option value="INCOME">{t.transactions.income}</option>
                <option value="TRANSFER">{t.transactions.transfer}</option>
              </NeoSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-sm uppercase">{t.transactions.sourceAccount}</label>
              <NeoSelect
                value={formData.accountId}
                onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                required
              >
                <option value="" disabled>{t.transactions.selectAccount}</option>
                {assets.filter(a => a.type === 'CASH' || a.type === 'INVESTMENT').map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </NeoSelect>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-sm uppercase">{t.transactions.date}</label>
              {/* Updated to use NeoDatePicker */}
              <NeoDatePicker
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-sm uppercase">{t.transactions.category}</label>
            <NeoSelect
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Select category...</option>
              {getCategoriesForType(formData.type).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </NeoSelect>
          </div>

          <div className="flex gap-2 mt-4">
            <NeoButton type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : t.transactions.save}
            </NeoButton>
            <NeoButton type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              {t.transactions.cancel}
            </NeoButton>
          </div>
        </form>
      </NeoDialog>

      {/* Detail & Edit Dialog */}
      <NeoDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={isEditing ? t.transactions.edit : t.transactions.details}
      >
        {selectedTransaction && editFormData && (
          <div className="space-y-4">
            {!isEditing ? (
              <>
                <div className="bg-gray-50 p-4 border-2 border-black space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t.transactions.description}</div>
                    <NeoBadge>{selectedTransaction.category}</NeoBadge>
                  </div>
                  <div className="text-2xl font-black">{selectedTransaction.description}</div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase">{t.transactions.amount}</div>
                      <div className={`text-xl font-black ${selectedTransaction.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(selectedTransaction.amount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase">{t.transactions.date}</div>
                      <div className="text-lg font-bold">{selectedTransaction.date}</div>
                    </div>
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase">{t.transactions.user}</div>
                      <div className="font-bold flex items-center gap-2">
                        {getUser(selectedTransaction.userId) && (
                          <img src={getUser(selectedTransaction.userId)?.avatar} className="w-5 h-5 rounded-full border border-black" alt="" />
                        )}
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1">
                            {getRoleIcon(getUser(selectedTransaction.userId)?.role)}
                            {getUser(selectedTransaction.userId)?.name || 'Unknown'}
                          </span>
                          {getUser(selectedTransaction.userId)?.role && (
                            <span className="text-[10px] text-gray-400 capitalize">{getUser(selectedTransaction.userId)?.role}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase">{t.transactions.sourceAccount}</div>
                      <div className="font-bold">{getAssetName(selectedTransaction.accountId)}</div>
                    </div>
                  </div>
                </div>

                {/* HISTORY SECTION */}
                {selectedTransaction.history && selectedTransaction.history.length > 0 && (
                  <div className="bg-white border-2 border-black p-3 mt-4">
                    <h4 className="font-black uppercase flex items-center gap-2 text-xs mb-3 pb-2 border-b-2 border-gray-100">
                      <History size={14} /> {t.transactions.history}
                    </h4>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                      {selectedTransaction.history.map(log => (
                        <div key={log.id} className="text-xs flex items-start gap-2 py-1">
                          <img src={log.userAvatar} className="w-5 h-5 rounded-full border border-black" alt="u" />
                          <div>
                            <div className="font-bold">
                              {t.transactions.editedBy} {log.userName}
                            </div>
                            <div className="text-gray-500 text-[10px]">
                              {new Date(log.date).toLocaleString()}
                              {log.previousAmount && (
                                <span className="ml-1 text-orange-600 font-bold">
                                  ({t.transactions.originalAmount}: {formatCurrency(log.previousAmount)})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <NeoButton onClick={() => setIsEditing(true)} icon={<Edit />} className="flex-1">{t.transactions.edit}</NeoButton>
                  <NeoButton onClick={handleDeleteClick} icon={<Trash2 />} variant="danger" className="flex-1">{t.transactions.delete}</NeoButton>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-sm uppercase">{t.transactions.description}</label>
                  <div className="relative">
                    <NeoInput
                      value={editFormData.description}
                      onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => handleAutoCategorize(editFormData.description, editFormData.type, true)}
                      disabled={!editFormData.description || isAutoCategorizing}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-accent hover:bg-purple-400 text-black border border-black shadow-neo-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title="AI Auto-Categorize"
                    >
                      {isAutoCategorizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-sm uppercase">{t.transactions.amount}</label>
                    <NeoInput
                      type="number"
                      value={editFormData.amount}
                      onChange={e => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-sm uppercase">{t.transactions.type}</label>
                    <NeoSelect
                      value={editFormData.type}
                      onChange={e => setEditFormData({ ...editFormData, type: e.target.value as TransactionType })}
                    >
                      <option value="EXPENSE">{t.transactions.expense}</option>
                      <option value="INCOME">{t.transactions.income}</option>
                      <option value="TRANSFER">{t.transactions.transfer}</option>
                    </NeoSelect>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-sm uppercase">{t.transactions.date}</label>
                    {/* Updated to use NeoDatePicker */}
                    <NeoDatePicker
                      value={editFormData.date}
                      onChange={(date) => setEditFormData({ ...editFormData, date })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-sm uppercase">{t.transactions.category}</label>
                    <NeoSelect
                      value={editFormData.category}
                      onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                    >
                      <option value="">Select category...</option>
                      {getCategoriesForType(editFormData.type).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </NeoSelect>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <NeoButton onClick={handleSaveEdit} icon={<Save />} className="flex-1" variant="success">{t.transactions.update}</NeoButton>
                  <NeoButton onClick={() => setIsEditing(false)} icon={<CloseIcon />} variant="ghost" className="flex-1">{t.transactions.cancel}</NeoButton>
                </div>
              </div>
            )}
          </div>
        )}
      </NeoDialog>

      {/* Confirm Delete Dialog */}
      <NeoConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message={t.transactions.confirmDelete}
      />
    </div>
  );
};