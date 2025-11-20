"use client";

import React, { useState, useContext, createContext } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { NeoButton, NeoInput, AppLogo } from './components/NeoUI';
import { Dashboard } from './pages/Dashboard';
import { KanbanBoard } from './pages/Kanban';
import { AiAssistant } from './pages/AiAssistant';
import { TransactionsPage } from './pages/Transactions';
import { SavingsPage } from './pages/Savings';
import { DebtPage } from './pages/Debt';
import { BudgetPage } from './pages/Budget';
import { AssetsPage } from './pages/Assets';
import { SettingsPage } from './pages/Settings';
import { User, Transaction, BillTask, Asset, KanbanStatus, SavingsGoal, Debt, Budget, CategoryState, Language, TransactionChangeLog } from './types';
import { TRANSLATIONS } from './utils';
import { 
  LayoutDashboard, 
  CreditCard, 
  Bot, 
  Settings, 
  Menu, 
  X,
  Users,
  List,
  PiggyBank,
  HandCoins,
  PieChart,
  Landmark,
  Languages,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink
} from 'lucide-react';

// --- CONTEXT ---
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof TRANSLATIONS['EN'];
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'ID',
  setLanguage: () => {},
  t: TRANSLATIONS['ID']
});

// --- MOCK DATA (IDR) ---
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Rizky', avatar: 'https://i.pravatar.cc/150?u=Rizky', color: 'bg-brand-orange' },
  { id: 'u2', name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=Sarah', color: 'bg-brand-accent' }
];

const INITIAL_ASSETS: Asset[] = [
  { id: 'a1', name: 'Tabungan BCA', value: 50000000, type: 'CASH', trend: 2.5 },
  { id: 'a2', name: 'Saham BBCA', value: 25000000, type: 'INVESTMENT', trend: 12.1 },
  { id: 'a3', name: 'Hutang KTA', value: 15000000, type: 'DEBT', trend: -5.0 },
  { id: 'a4', name: 'Dompet Tunai', value: 1500000, type: 'CASH', trend: 0 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2023-10-01', amount: 15000000, category: 'Salary', description: 'Gaji Bulanan', type: 'INCOME', userId: 'u1', accountId: 'a1', history: [] },
  { id: 't2', date: '2023-10-02', amount: 75000, category: 'Food', description: 'Makan Siang', type: 'EXPENSE', userId: 'u1', accountId: 'a4', history: [] },
  { id: 't3', date: '2023-10-03', amount: 3500000, category: 'Rent', description: 'Bayar Kos', type: 'EXPENSE', userId: 'u2', accountId: 'a1', history: [] },
  { id: 't4', date: '2023-10-05', amount: 300000, category: 'Transport', description: 'Bensin Mobil', type: 'EXPENSE', userId: 'u1', accountId: 'a4', history: [] },
];

const INITIAL_TASKS: BillTask[] = [
  { id: 'b1', title: 'Listrik PLN', amount: 500000, dueDate: '2023-10-20', status: 'TODO' },
  { id: 'b2', title: 'Netflix Premium', amount: 186000, dueDate: '2023-10-15', status: 'PAID' },
  { id: 'b3', title: 'Cicilan Mobil', amount: 4500000, dueDate: '2023-10-25', status: 'PLANNED' },
];

const INITIAL_GOALS: SavingsGoal[] = [
  { id: 'g1', name: 'Liburan Bali', targetAmount: 10000000, currentAmount: 3500000, deadline: '2023-12-31', icon: '🏖️', history: [] },
  { id: 'g2', name: 'Macbook Pro', targetAmount: 25000000, currentAmount: 12000000, deadline: '2024-02-20', icon: '💻', history: [] },
];

const INITIAL_DEBTS: Debt[] = [
  { id: 'd1', name: 'KTA Bank', lender: 'Bank BCA', totalAmount: 30000000, paidAmount: 15000000, dueDate: '2025-01-01', type: 'OWE', history: [] },
  { id: 'd2', name: 'Pinjam ke Budi', lender: 'Budi', totalAmount: 500000, paidAmount: 100000, dueDate: '2023-11-01', type: 'OWED', history: [] },
];

const INITIAL_BUDGETS: Budget[] = [
  { id: 'bd1', category: 'Food', limit: 3000000, period: 'MONTHLY' },
  { id: 'bd2', category: 'Transport', limit: 1500000, period: 'MONTHLY' },
  { id: 'bd3', category: 'Entertainment', limit: 1000000, period: 'MONTHLY' },
];

const INITIAL_CATEGORIES: CategoryState = {
  expense: ['Food', 'Transport', 'Housing', 'Utilities', 'Health', 'Entertainment', 'Groceries', 'Shopping'],
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Bonus', 'Other']
};

// --- COMPONENTS ---

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, active, collapsed }) => (
  <Link to={to} title={label}>
    <div className={`flex items-center gap-4 px-6 py-4 font-black text-sm uppercase transition-all border-l-4 border-transparent hover:bg-gray-100
      ${active 
        ? 'bg-gray-100 text-brand-orange border-brand-orange' 
        : 'text-gray-500'}
      ${collapsed ? 'justify-center px-2' : ''}
    `}>
      <span className="transform scale-125">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </div>
  </Link>
);

const App = () => {
  // State
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [tasks, setTasks] = useState<BillTask[]>(INITIAL_TASKS);
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [goals, setGoals] = useState<SavingsGoal[]>(INITIAL_GOALS);
  const [debts, setDebts] = useState<Debt[]>(INITIAL_DEBTS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [categories, setCategories] = useState<CategoryState>(INITIAL_CATEGORIES);
  
  const [language, setLanguage] = useState<Language>('ID');

  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handlers
  const handleAddUser = (u: Omit<User, 'id'>) => {
      const newUser = { ...u, id: Math.random().toString(36).substr(2, 9) };
      setUsers(prev => [...prev, newUser]);
  };

  const handleAddTransaction = (t: Omit<Transaction, 'id' | 'userId'>) => {
    // 1. Logic for Account Balance Update
    if (t.accountId) {
       const assetIndex = assets.findIndex(a => a.id === t.accountId);
       if (assetIndex !== -1) {
          const asset = assets[assetIndex];
          
          // Check Sufficient Funds for Expense
          if (t.type === 'EXPENSE' && asset.value < t.amount) {
             throw new Error("INSUFFICIENT_FUNDS");
          }

          const newAssets = [...assets];
          if (t.type === 'EXPENSE') {
            newAssets[assetIndex] = { ...asset, value: asset.value - t.amount };
          } else if (t.type === 'INCOME') {
            newAssets[assetIndex] = { ...asset, value: asset.value + t.amount };
          }
          setAssets(newAssets);
       }
    }

    const newT: Transaction = {
      ...t,
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      history: []
    };
    setTransactions(prev => [newT, ...prev]);
  };

  const handleUpdateTransaction = (updatedT: Transaction) => {
    // Find the original transaction to record history
    const originalT = transactions.find(t => t.id === updatedT.id);
    
    if (originalT) {
      const log: TransactionChangeLog = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        action: 'UPDATE',
        previousAmount: originalT.amount !== updatedT.amount ? originalT.amount : undefined
      };

      const transactionWithHistory = {
        ...updatedT,
        history: [log, ...(originalT.history || [])]
      };
      
      setTransactions(prev => prev.map(t => t.id === updatedT.id ? transactionWithHistory : t));
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx && tx.accountId) {
        // Revert Balance
        const assetIndex = assets.findIndex(a => a.id === tx.accountId);
        if (assetIndex !== -1) {
            const asset = assets[assetIndex];
            const newAssets = [...assets];
            // If it was expense, add back. If income, subtract.
            if (tx.type === 'EXPENSE') {
                newAssets[assetIndex] = { ...asset, value: asset.value + tx.amount };
            } else if (tx.type === 'INCOME') {
                newAssets[assetIndex] = { ...asset, value: asset.value - tx.amount };
            }
            setAssets(newAssets);
        }
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleAddGoal = (g: Omit<SavingsGoal, 'id' | 'currentAmount' | 'history'>) => {
    setGoals(prev => [...prev, { ...g, id: Math.random().toString(), currentAmount: 0, history: [] }]);
  };

  const handleUpdateGoal = (updatedGoal: SavingsGoal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleUpdateGoalAmount = (id: string, amountToAdd: number, sourceAssetId: string, date: string) => {
    // 1. Check Asset Funds
    const assetIndex = assets.findIndex(a => a.id === sourceAssetId);
    if (assetIndex === -1) {
        throw new Error("ASSET_NOT_FOUND");
    }
    const asset = assets[assetIndex];
    if (asset.value < amountToAdd) {
        throw new Error("INSUFFICIENT_FUNDS");
    }

    // 2. Deduct from Asset
    const newAssets = [...assets];
    newAssets[assetIndex] = { ...asset, value: asset.value - amountToAdd };
    setAssets(newAssets);

    // 3. Update Goal Amount & History
    setGoals(prev => prev.map(g => {
        if (g.id === id) {
            return { 
                ...g, 
                currentAmount: g.currentAmount + amountToAdd,
                history: [
                    {
                        id: Math.random().toString(),
                        date: date || new Date().toISOString().split('T')[0],
                        amount: amountToAdd,
                        sourceAssetName: asset.name
                    },
                    ...g.history
                ] 
            };
        }
        return g;
    }));
  };

  const handleAddDebt = (d: Omit<Debt, 'id' | 'paidAmount' | 'history'>) => {
    setDebts(prev => [...prev, { ...d, id: Math.random().toString(), paidAmount: 0, history: [] }]);
  };

  const handleUpdateDebt = (updatedDebt: Debt) => {
    setDebts(prev => prev.map(d => d.id === updatedDebt.id ? updatedDebt : d));
  };

  const handleDeleteDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
  };

  const handlePayDebt = (debtId: string, amount: number, sourceAssetId: string, date: string) => {
      const debt = debts.find(d => d.id === debtId);
      if (!debt) throw new Error("DEBT_NOT_FOUND");

      const assetIndex = assets.findIndex(a => a.id === sourceAssetId);
      if (assetIndex === -1) throw new Error("ASSET_NOT_FOUND");
      
      const asset = assets[assetIndex];

      // Logic based on Type
      // OWE: I pay someone -> Asset decreases
      // OWED: Someone pays me -> Asset increases
      
      const newAssets = [...assets];
      if (debt.type === 'OWE') {
          if (asset.value < amount) throw new Error("INSUFFICIENT_FUNDS");
          newAssets[assetIndex] = { ...asset, value: asset.value - amount };
      } else {
          newAssets[assetIndex] = { ...asset, value: asset.value + amount };
      }
      setAssets(newAssets);

      // Update Debt
      setDebts(prev => prev.map(d => {
          if (d.id === debtId) {
              return {
                  ...d,
                  paidAmount: d.paidAmount + amount,
                  history: [
                      {
                          id: Math.random().toString(),
                          date: date || new Date().toISOString().split('T')[0],
                          amount: amount,
                          sourceAssetName: asset.name
                      },
                      ...d.history
                  ]
              }
          }
          return d;
      }));
  };

  const handleAddAsset = (a: Omit<Asset, 'id' | 'trend'>) => {
    setAssets(prev => [...prev, { ...a, id: Math.random().toString(), trend: 0 }]);
  };

  const handleDeleteAsset = (id: string) => {
      setAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleAddBudget = (b: Omit<Budget, 'id'>) => {
    setBudgets(prev => [...prev, { ...b, id: Math.random().toString() }]);
  };

  const handleDeleteBudget = (id: string) => {
      setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const handleUpdateTaskStatus = (id: string, status: KanbanStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleAddTask = (task: Omit<BillTask, 'id' | 'status'>) => {
    setTasks(prev => [...prev, { ...task, id: Math.random().toString(), status: 'TODO' }]);
  };

  const handleUpdateTask = (updatedTask: BillTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleUser = () => {
    const currentIndex = users.findIndex(u => u.id === currentUser.id);
    const nextIndex = (currentIndex + 1) % users.length;
    setCurrentUser(users[nextIndex]);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: TRANSLATIONS[language] }}>
      <Router>
        <AppLayout 
          currentUser={currentUser}
          toggleUser={toggleUser}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        >
          <Routes>
            <Route path="/" element={<Dashboard transactions={transactions} assets={assets} currentUser={currentUser} />} />
            <Route path="/transactions" element={
              <TransactionsPage 
                transactions={transactions} 
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                categories={categories}
                assets={assets}
                users={users}
              />
            } />
            <Route path="/kanban" element={
              <KanbanBoard 
                tasks={tasks} 
                onUpdateStatus={handleUpdateTaskStatus} 
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            } />
            <Route path="/savings" element={
                <SavingsPage 
                    goals={goals} 
                    assets={assets}
                    onAddGoal={handleAddGoal} 
                    onUpdateGoalAmount={handleUpdateGoalAmount}
                    onUpdateGoal={handleUpdateGoal}
                    onDeleteGoal={handleDeleteGoal}
                />
            } />
            <Route path="/debt" element={
                <DebtPage 
                    debts={debts} 
                    assets={assets}
                    onAddDebt={handleAddDebt} 
                    onUpdateDebt={handleUpdateDebt}
                    onDeleteDebt={handleDeleteDebt}
                    onPayDebt={handlePayDebt}
                />
            } />
            <Route path="/budget" element={<BudgetPage budgets={budgets} transactions={transactions} onAddBudget={handleAddBudget} onDeleteBudget={handleDeleteBudget} />} />
            <Route path="/assets" element={<AssetsPage assets={assets} onAddAsset={handleAddAsset} onDeleteAsset={handleDeleteAsset} />} />
            <Route path="/ai" element={<AiAssistant transactions={transactions} onAddTransaction={handleAddTransaction} />} />
            <Route path="/settings" element={
              <SettingsPage 
                  currentUser={currentUser} 
                  onUpdateUser={setCurrentUser} 
                  categories={categories}
                  onUpdateCategories={setCategories}
                  users={users}
                  onAddUser={handleAddUser}
              />
            } />
          </Routes>
        </AppLayout>
      </Router>
    </LanguageContext.Provider>
  );
};

const AppLayout: React.FC<any> = ({ 
  children, 
  currentUser, 
  toggleUser, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed
}) => {
  const location = useLocation();
  const { t, language, setLanguage } = useContext(LanguageContext);
  const isActive = (path: string) => location.pathname === path;

  // Navigation Items Config
  const navItems = [
    { path: '/', icon: <LayoutDashboard />, label: 'Dashboard' },
    { path: '/transactions', icon: <List />, label: t.transactions.title },
    { path: '/kanban', icon: <CreditCard />, label: 'Bill Kanban' },
    { path: '/savings', icon: <PiggyBank />, label: t.savings.title },
    { path: '/debt', icon: <HandCoins />, label: 'Debt / Hutang' },
    { path: '/budget', icon: <PieChart />, label: t.budget.title },
    { path: '/assets', icon: <Landmark />, label: 'Assets' },
    { path: '/ai', icon: <Bot />, label: 'AI Assistant' },
    { path: '/settings', icon: <Settings />, label: t.settings.title },
  ];

  const toggleLang = () => setLanguage(language === 'ID' ? 'EN' : 'ID');

  const MobileNavItem = ({ to, icon, active, onClick }: any) => (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 h-full transition-colors
        ${active ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}
      `}
    >
      <div className={`
        p-2 rounded-none transition-all
        ${active ? 'text-brand-orange font-black transform scale-110' : 'text-gray-400'}
      `}>
        {icon}
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-[#FDFBF7]">
      
      {/* Sidebar (Desktop) */}
      <aside className={`hidden md:flex flex-col border-r-2 border-black bg-white fixed h-full z-20 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b-2 border-black flex items-center gap-3 sticky top-0 bg-white z-10 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <AppLogo />
          {!isSidebarCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="font-black text-2xl tracking-tighter uppercase">SAVERY</h1>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <SidebarItem 
              key={item.path} 
              to={item.path} 
              icon={item.icon} 
              label={item.label} 
              active={isActive(item.path)} 
              collapsed={isSidebarCollapsed}
            />
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="border-t-2 border-black bg-white">
             {/* Collapse Button */}
             <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-full py-3 flex items-center justify-center hover:bg-gray-100 border-b-2 border-black"
             >
                {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
             </button>

             {/* Language & User - Stacked for Collapsed */}
             <div className={`p-4 space-y-2 ${isSidebarCollapsed ? 'items-center flex flex-col px-2' : ''}`}>
                 <button onClick={toggleLang} className={`flex items-center justify-center p-2 border-2 border-black bg-white hover:bg-gray-50 font-bold text-sm shadow-neo-sm ${isSidebarCollapsed ? 'w-full' : 'w-full justify-between'}`}>
                     <Languages size={16}/> 
                     {!isSidebarCollapsed && <span>{language}</span>}
                 </button>

                 <div className={`flex items-center p-2 border-2 border-black bg-gray-50 shadow-neo-sm cursor-pointer hover:bg-gray-100 ${isSidebarCollapsed ? 'justify-center w-full' : 'justify-between'}`} onClick={toggleUser}>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-black shrink-0" alt="avatar" />
                        {!isSidebarCollapsed && (
                            <div className="flex flex-col leading-none truncate">
                                <span className="font-bold text-sm">{currentUser.name}</span>
                            </div>
                        )}
                    </div>
                    {!isSidebarCollapsed && <Users className="w-4 h-4 shrink-0" />}
                 </div>
             </div>

             {/* Watermark */}
             {!isSidebarCollapsed && (
                 <a href="https://www.rsquareidea.my.id" target="_blank" rel="noopener noreferrer" className="block p-2 bg-black text-white text-[10px] text-center font-bold hover:text-brand-orange transition-colors">
                     www.rsquareidea.my.id
                 </a>
             )}
             {isSidebarCollapsed && (
                  <a href="https://www.rsquareidea.my.id" target="_blank" rel="noopener noreferrer" className="block p-2 bg-black text-white text-center hover:text-brand-orange transition-colors">
                    <ExternalLink size={14} className="mx-auto"/>
                  </a>
             )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b-2 border-black bg-white sticky top-0 z-30 shadow-neo-sm">
        <div className="flex items-center gap-2">
          <AppLogo className="w-8 h-8" />
          <span className="font-black text-xl tracking-tighter">SAVERY</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Mobile Pop-up Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed bottom-20 right-4 z-50 bg-white border-2 border-black shadow-neo-lg w-64 p-2 space-y-1">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 font-bold text-sm uppercase transition-colors hover:bg-gray-100
                ${isActive(item.path) ? 'bg-brand-orange text-black' : 'text-gray-600'}
              `}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          <div className="border-t-2 border-black my-2 pt-2 space-y-2">
             <button onClick={() => { toggleLang(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-bold uppercase hover:bg-gray-100 flex items-center gap-2">
               <Languages size={14}/> Switch Language: {language}
             </button>
             <button onClick={() => { toggleUser(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-bold uppercase hover:bg-gray-100 flex items-center gap-2">
               <Users size={14}/> Switch User: {currentUser.name}
             </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 p-4 md:p-10 overflow-y-auto relative z-10 min-h-screen pb-24 md:pb-10 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}>
        <div className="max-w-6xl mx-auto space-y-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Quick Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black h-16 z-50 flex items-stretch justify-between shadow-[0px_-4px_10px_rgba(0,0,0,0.05)]">
         <MobileNavItem to="/" icon={<Home />} active={isActive('/')} />
         <MobileNavItem to="/transactions" icon={<List />} active={isActive('/transactions')} />
         
         {/* Highlighted Center AI Action */}
         <Link to="/ai" className="flex-1 -mt-6 flex justify-center">
            <div className={`
                w-14 h-14 bg-brand-orange border-2 border-black flex items-center justify-center shadow-neo
                transition-transform active:scale-95 active:shadow-none
                ${isActive('/ai') ? 'ring-2 ring-black ring-offset-2' : ''}
            `}>
                <Bot className="text-black w-8 h-8" />
            </div>
         </Link>

         <MobileNavItem to="/assets" icon={<Landmark />} active={isActive('/assets')} />
         
         <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors
                ${isMobileMenuOpen ? 'bg-black text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}
            `}
         >
            <Menu className="w-6 h-6" />
         </button>
      </div>

    </div>
  );
};

export default App;