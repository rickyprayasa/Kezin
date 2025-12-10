"use client";

import React, { useState, createContext, useEffect } from 'react';
import Link from 'next/link';
import { NeoButton, AppLogo } from './NeoUI';
import { Dashboard } from './pages/Dashboard';
import { KanbanBoard } from './pages/Kanban';
import { AiAssistant } from './pages/AiAssistant';
import { TransactionsPage } from './pages/Transactions';
import { SavingsPage } from './pages/Savings';
import { DebtPage } from './pages/Debt';
import { BudgetPage } from './pages/Budget';
import { AssetsPage } from './pages/Assets';
import { SettingsPage } from './pages/Settings';
import { QuickTeamView } from './QuickTeamView';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { User, Transaction, BillTask, Asset, KanbanStatus, SavingsGoal, Debt, Budget, CategoryState, Language, TransactionChangeLog } from '@/lib/types';
import { TRANSLATIONS } from '@/lib/utils';
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
  ExternalLink,
  Sparkles,
  LogOut,
  Shield,
  Crown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof TRANSLATIONS['EN'];
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'ID',
  setLanguage: () => { },
  t: TRANSLATIONS['ID']
});

const THEME_COLORS = {
  'bg-brand-orange': {
    primary: '#FF6B35',
    light: '#FFF5F0',
    medium: '#FFE5D9',
    dark: '#CC5629'
  },
  'bg-brand-accent': {
    primary: '#9B59B6',
    light: '#F8F3FB',
    medium: '#E8D9F0',
    dark: '#7D3C98'
  },
  'bg-brand-green': {
    primary: '#2ECC71',
    light: '#F0FFF4',
    medium: '#D4F4DD',
    dark: '#27AE60'
  },
  'bg-brand-red': {
    primary: '#E74C3C',
    light: '#FFF5F5',
    medium: '#FFE5E5',
    dark: '#C0392B'
  }
};

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Rizky', avatar: 'https://i.pravatar.cc/150?u=Rizky', color: 'bg-brand-orange', defaultAccountId: 'a4' },
  { id: 'u2', name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=Sarah', color: 'bg-brand-accent', defaultAccountId: 'a1' }
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

type PageType = 'dashboard' | 'transactions' | 'kanban' | 'savings' | 'debt' | 'budget' | 'assets' | 'ai' | 'settings';

interface SidebarItemProps {
  page: PageType;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ page, icon, label, active, collapsed, onClick }) => (
  <button onClick={onClick} title={label} className="w-full text-left">
    <div className={`flex items-center gap-4 px-6 py-4 font-black text-sm uppercase transition-all border-l-4 border-transparent hover:bg-gray-100
      ${active
        ? 'bg-gray-100 text-brand-orange border-brand-orange'
        : 'text-gray-500'}
      ${collapsed ? 'justify-center px-2' : ''}
    `}>
      <span className="transform scale-125">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </div>
  </button>
);

interface MainAppProps {
  user?: any;
  profile?: any;
  userRole?: string;
}

export const MainApp = ({ user, profile, userRole = 'member' }: MainAppProps) => {
  const router = useRouter();
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<BillTask[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<CategoryState>({ expense: [], income: [] });

  useEffect(() => {
    if (profile?.default_organization_id) {
      fetchData(profile.default_organization_id);
    }
  }, [profile?.default_organization_id]);

  const fetchData = async (orgId: string) => {
    try {
      // 1. Fetch Users (Members)
      const { data: members } = await supabase
        .from('organization_members')
        .select('user_id, role, profiles(full_name, avatar_url, theme_color)')
        .eq('organization_id', orgId);

      if (members) {
        setUsers(members.map(m => {
          const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          return {
            id: m.user_id,
            name: profile?.full_name || 'Unknown',
            avatar: profile?.avatar_url || '',
            color: profile?.theme_color || 'bg-blue-500',
            role: m.role || 'member'
          };
        }));
      }

      // 2. Fetch Categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('organization_id', orgId);

      if (cats) {
        setCategories({
          expense: cats.filter(c => c.type === 'EXPENSE').map(c => c.name),
          income: cats.filter(c => c.type === 'INCOME').map(c => c.name)
        });
      }

      // 3. Fetch Assets
      const { data: assetData } = await supabase
        .from('assets')
        .select('*')
        .eq('organization_id', orgId);

      if (assetData) {
        setAssets(assetData.map(a => ({
          id: a.id,
          name: a.name,
          value: Number(a.balance),
          type: a.type,
          trend: 0
        })));
      }

      // 4. Fetch Transactions
      const { data: transData } = await supabase
        .from('transactions')
        .select('*, categories(name), profiles(full_name, avatar_url)')
        .eq('organization_id', orgId)
        .order('date', { ascending: false });

      if (transData) {
        setTransactions(transData.map(t => {
          const category = Array.isArray(t.categories) ? t.categories[0] : t.categories;
          const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
          return {
            id: t.id,
            date: t.date,
            amount: Number(t.amount),
            category: category?.name || 'Uncategorized',
            description: t.description || '',
            type: t.type,
            userId: t.created_by,
            accountId: t.asset_id,
            history: []
          };
        }));
      }

      // 5. Fetch Savings
      const { data: savingsData } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('organization_id', orgId);

      if (savingsData) {
        setGoals(savingsData.map(g => ({
          id: g.id,
          name: g.name,
          targetAmount: Number(g.target_amount),
          currentAmount: Number(g.current_amount),
          deadline: g.deadline,
          icon: g.icon,
          history: []
        })));
      }

      // 6. Fetch Debts
      const { data: debtData } = await supabase
        .from('debts')
        .select('*')
        .eq('organization_id', orgId);

      if (debtData) {
        setDebts(debtData.map(d => ({
          id: d.id,
          name: d.name,
          lender: d.lender_name,
          totalAmount: Number(d.total_amount),
          paidAmount: Number(d.paid_amount),
          dueDate: d.due_date,
          type: d.type,
          history: []
        })));
      }

      // 7. Fetch Budgets
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('organization_id', orgId);

      if (budgetData) {
        setBudgets(budgetData.map(b => ({
          id: b.id,
          category: b.category_name || 'Uncategorized',
          limit: Number(b.amount_limit),
          period: b.period
        })));
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const [language, setLanguage] = useState<Language>('ID');
  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (profile) {
      // Get full name - check if it's valid (not null, empty, or 'Unknown')
      const fullName = (profile.full_name &&
        profile.full_name.trim() !== '' &&
        profile.full_name !== 'Unknown')
        ? profile.full_name
        : user?.email?.split('@')[0] || 'User';

      return {
        id: user?.id || 'u1',
        name: fullName,
        avatar: profile.avatar_url || `https://i.pravatar.cc/150?u=${user?.email}`,
        color: profile.theme_color || 'bg-brand-orange',
        defaultAccountId: profile.default_asset_id || 'a1'
      };
    }
    return MOCK_USERS[0];
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isQuickTeamOpen, setIsQuickTeamOpen] = useState(false);

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';
  const canDelete = isOwnerOrAdmin;
  const canManageMembers = isOwnerOrAdmin;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Update currentUser when profile changes
  useEffect(() => {
    if (profile && user) {
      const fullName = (profile.full_name &&
        profile.full_name.trim() !== '' &&
        profile.full_name !== 'Unknown')
        ? profile.full_name
        : user.email?.split('@')[0] || 'User';

      setCurrentUser({
        id: user.id || 'u1',
        name: fullName,
        avatar: profile.avatar_url || `https://i.pravatar.cc/150?u=${user.email}`,
        color: profile.theme_color || 'bg-brand-orange',
        defaultAccountId: profile.default_asset_id || 'a1'
      });
    }
  }, [profile, user]);

  useEffect(() => {
    const theme = THEME_COLORS[currentUser.color as keyof typeof THEME_COLORS];
    if (theme) {
      document.documentElement.style.setProperty('--theme-primary', theme.primary);
      document.documentElement.style.setProperty('--theme-light', theme.light);
      document.documentElement.style.setProperty('--theme-medium', theme.medium);
      document.documentElement.style.setProperty('--theme-dark', theme.dark);
    }
  }, [currentUser.color]);

  const handleAddUser = (u: Omit<User, 'id'>) => {
    const newUser = { ...u, id: Math.random().toString(36).substr(2, 9) };
    setUsers(prev => [...prev, newUser]);
  };

  // Lock to prevent duplicate transaction submissions
  const isAddingTransaction = React.useRef(false);
  const lastTransactionTime = React.useRef(0);

  const handleAddTransaction = async (t: Omit<Transaction, 'id' | 'userId'>) => {
    // Prevent duplicate submissions
    if (isAddingTransaction.current) {
      console.log("Transaction already in progress, skipping duplicate call");
      return;
    }
    
    // Debounce - prevent submissions within 2 seconds of each other
    const now = Date.now();
    if (now - lastTransactionTime.current < 2000) {
      console.log("Transaction submitted too quickly, debouncing");
      return;
    }
    
    isAddingTransaction.current = true;
    lastTransactionTime.current = now;
    
    try {
      if (!profile?.default_organization_id) {
        console.error("No organization ID found");
        throw new Error("No organization selected");
      }
      if (!user?.id) {
        console.error("No user ID found");
        throw new Error("User not authenticated");
      }

      const orgId = profile.default_organization_id;

      // Helper to validate UUID format
      const isValidUUID = (id: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
      };

      // Validate accountId - only use if it's a valid UUID and exists in assets
      const validAccountId = t.accountId && isValidUUID(t.accountId) ? t.accountId : null;

      console.log("Adding transaction:", { 
        orgId, 
        userId: user.id, 
        accountId: validAccountId, 
        amount: t.amount, 
        type: t.type 
      });

      // 1. Check Funds (database trigger will update balance automatically)
      if (validAccountId && t.type === 'EXPENSE') {
        const asset = assets.find(a => a.id === validAccountId);
        if (asset && asset.value < t.amount) {
          throw new Error("INSUFFICIENT_FUNDS");
        }
      }
      // NOTE: Balance update is handled by database trigger 'on_transaction_change'
      // Do NOT manually update balance here to avoid double update

      // 2. Get or Create Category ID
      let categoryId = null;
      if (t.category) {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('id')
          .eq('organization_id', orgId)
          .eq('name', t.category)
          .maybeSingle();

        if (catError) {
          console.error("Error fetching category:", catError);
        }

        if (catData) {
          categoryId = catData.id;
        } else {
          // Create new category
          const { data: newCat, error: newCatError } = await supabase
            .from('categories')
            .insert({
              organization_id: orgId,
              name: t.category,
              type: t.type === 'TRANSFER' ? 'EXPENSE' : t.type
            })
            .select()
            .single();
          
          if (newCatError) {
            console.error("Error creating category:", newCatError);
          }
          if (newCat) categoryId = newCat.id;
        }
      }

      // 3. Insert Transaction - use auth user.id, not currentUser.id
      const transactionData = {
        organization_id: orgId,
        amount: t.amount,
        type: t.type,
        description: t.description,
        date: t.date,
        category_id: categoryId,
        asset_id: validAccountId,
        created_by: user.id
      };

      console.log("Inserting transaction:", transactionData);

      const { data: insertedData, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select();

      if (error) {
        console.error("Error creating transaction:", error);
        throw error;
      }

      console.log("Transaction inserted successfully:", insertedData);

      // 4. Refresh Data
      fetchData(orgId);
    } finally {
      // Always reset the lock
      isAddingTransaction.current = false;
    }
  };

  const handleUpdateTransaction = (updatedT: Transaction) => {
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
      const assetIndex = assets.findIndex(a => a.id === tx.accountId);
      if (assetIndex !== -1) {
        const asset = assets[assetIndex];
        const newAssets = [...assets];
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
    const assetIndex = assets.findIndex(a => a.id === sourceAssetId);
    if (assetIndex === -1) {
      throw new Error("ASSET_NOT_FOUND");
    }
    const asset = assets[assetIndex];
    if (asset.value < amountToAdd) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    const newAssets = [...assets];
    newAssets[assetIndex] = { ...asset, value: asset.value - amountToAdd };
    setAssets(newAssets);

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

    const newAssets = [...assets];
    if (debt.type === 'OWE') {
      if (asset.value < amount) throw new Error("INSUFFICIENT_FUNDS");
      newAssets[assetIndex] = { ...asset, value: asset.value - amount };
    } else {
      newAssets[assetIndex] = { ...asset, value: asset.value + amount };
    }
    setAssets(newAssets);

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

  const handleAddAsset = async (a: Omit<Asset, 'id' | 'trend'>) => {
    if (!profile?.default_organization_id) {
      console.error("No organization ID found");
      return;
    }

    const { data, error } = await supabase
      .from('assets')
      .insert({
        organization_id: profile.default_organization_id,
        name: a.name,
        type: a.type,
        balance: a.value,
        currency: 'IDR'
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating asset:", error);
      throw error;
    }

    console.log("Asset created:", data);
    
    // Refresh data
    fetchData(profile.default_organization_id);
  };

  const handleDeleteAsset = async (id: string) => {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting asset:", error);
      throw error;
    }

    // Update local state
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

  const t = TRANSLATIONS[language];

  const navItems: { page: PageType; icon: React.ReactNode; label: string }[] = [
    { page: 'dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { page: 'transactions', icon: <List />, label: t.transactions.title },
    { page: 'kanban', icon: <CreditCard />, label: 'Bill Kanban' },
    { page: 'savings', icon: <PiggyBank />, label: t.savings.title },
    { page: 'debt', icon: <HandCoins />, label: 'Debt / Hutang' },
    { page: 'budget', icon: <PieChart />, label: t.budget.title },
    { page: 'assets', icon: <Landmark />, label: 'Assets' },
    { page: 'ai', icon: <Bot />, label: 'AI Assistant' },
    { page: 'settings', icon: <Settings />, label: t.settings.title },
  ];

  const toggleLang = () => setLanguage(language === 'ID' ? 'EN' : 'ID');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard transactions={transactions} assets={assets} currentUser={currentUser} />;
      case 'transactions':
        return (
          <TransactionsPage
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            categories={categories}
            assets={assets}
            users={users}
          />
        );
      case 'kanban':
        return (
          <KanbanBoard
            organizationId={profile?.default_organization_id || ''}
            language={language}
          />
        );
      case 'savings':
        return (
          <SavingsPage
            goals={goals}
            assets={assets}
            onAddGoal={handleAddGoal}
            onUpdateGoalAmount={handleUpdateGoalAmount}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        );
      case 'debt':
        return (
          <DebtPage
            debts={debts}
            assets={assets}
            onAddDebt={handleAddDebt}
            onUpdateDebt={handleUpdateDebt}
            onDeleteDebt={handleDeleteDebt}
            onPayDebt={handlePayDebt}
          />
        );
      case 'budget':
        return <BudgetPage budgets={budgets} transactions={transactions} onAddBudget={handleAddBudget} onDeleteBudget={handleDeleteBudget} />;
      case 'assets':
        return <AssetsPage assets={assets} onAddAsset={handleAddAsset} onDeleteAsset={handleDeleteAsset} />;
      case 'ai':
        return <AiAssistant transactions={transactions} onAddTransaction={handleAddTransaction} currentUser={currentUser} assets={assets} />;
      case 'settings':
        return (
          <SettingsPage
            currentUser={currentUser}
            onUpdateUser={setCurrentUser}
            categories={categories}
            onUpdateCategories={setCategories}
            users={users}
            onAddUser={handleAddUser}
            assets={assets}
            profile={profile}
            userRole={userRole}
            userId={user?.id}
          />
        );
      default:
        return <Dashboard transactions={transactions} assets={assets} currentUser={currentUser} />;
    }
  };

  const MobileNavItem = ({ page, icon, active, onClick }: { page: PageType; icon: React.ReactNode; active: boolean; onClick: () => void }) => (
    <button
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
    </button>
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="min-h-screen flex flex-col md:flex-row font-sans bg-[#FDFBF7]">

        {/* Sidebar (Desktop) */}
        <aside className={`hidden md:flex flex-col border-r-2 border-black bg-white fixed h-full z-20 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>

          <div className={`p-6 border-b-2 border-black flex items-center gap-3 sticky top-0 bg-white z-10 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <AppLogo />
            {!isSidebarCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="font-black text-2xl tracking-tighter uppercase">SAVERY</h1>
              </div>
            )}
          </div>

          {/* Organization Switcher */}
          {!isSidebarCollapsed && (
            <div className="px-4 pt-4">
              <OrganizationSwitcher
                currentOrgId={profile?.default_organization_id || null}
                currentOrgName={profile?.default_organization?.name || 'My Workspace'}
                onSwitch={() => {
                  // Reload the page to fetch new organization data
                  router.refresh()
                  window.location.reload()
                }}
              />
            </div>
          )}

          <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <SidebarItem
                key={item.page}
                page={item.page}
                icon={item.icon}
                label={item.label}
                active={currentPage === item.page}
                collapsed={isSidebarCollapsed}
                onClick={() => setCurrentPage(item.page)}
              />
            ))}
          </nav>

          <div className="border-t-2 border-black bg-white">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full py-3 flex items-center justify-center hover:bg-gray-100 border-b-2 border-black"
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>

            <div className={`p-4 space-y-2 ${isSidebarCollapsed ? 'items-center flex flex-col px-2' : ''}`}>
              <button onClick={toggleLang} className={`flex items-center justify-center p-2 border-2 border-black bg-white hover:bg-gray-50 font-bold text-sm shadow-neo-sm ${isSidebarCollapsed ? 'w-full' : 'w-full justify-between'}`}>
                <Languages size={16} />
                {!isSidebarCollapsed && <span>{language}</span>}
              </button>

              <button
                onClick={() => setIsQuickTeamOpen(true)}
                className={`flex items-center p-2 border-2 border-black bg-gray-50 shadow-neo-sm hover:bg-white hover:shadow-neo transition-all ${isSidebarCollapsed ? 'justify-center w-full' : 'justify-between w-full'}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-black shrink-0" alt="avatar" />
                  {!isSidebarCollapsed && (
                    <div className="flex flex-col leading-none truncate text-left">
                      <span className="font-bold text-sm">{currentUser.name}</span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        {userRole === 'owner' && <Crown size={10} className="text-yellow-500" />}
                        {userRole === 'admin' && <Shield size={10} className="text-blue-500" />}
                        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <Users className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className={`flex items-center justify-center gap-2 p-2 border-2 border-black bg-red-500 text-white hover:bg-red-600 font-bold text-sm shadow-neo-sm transition-colors ${isSidebarCollapsed ? 'w-full' : 'w-full'}`}
              >
                <LogOut size={16} />
                {!isSidebarCollapsed && <span>Logout</span>}
              </button>
            </div>

            {/* Home Button */}
            <Link href="/landing" className={`flex items-center justify-center gap-2 p-3 bg-brand-accent text-white font-bold text-sm hover:bg-purple-500 transition-colors border-t-2 border-black ${isSidebarCollapsed ? 'px-2' : ''}`}>
              <Home size={16} />
              {!isSidebarCollapsed && <span>Kembali</span>}
            </Link>

            {!isSidebarCollapsed && (
              <a href="https://www.rsquareidea.my.id" target="_blank" rel="noopener noreferrer" className="block p-2 bg-black text-white text-[10px] text-center font-bold hover:text-brand-orange transition-colors">
                www.rsquareidea.my.id
              </a>
            )}
            {isSidebarCollapsed && (
              <a href="https://www.rsquareidea.my.id" target="_blank" rel="noopener noreferrer" className="block p-2 bg-black text-white text-center hover:text-brand-orange transition-colors">
                <ExternalLink size={14} className="mx-auto" />
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
              <button
                key={item.page}
                onClick={() => { setCurrentPage(item.page); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 font-bold text-sm uppercase transition-colors hover:bg-gray-100 w-full text-left
                  ${currentPage === item.page ? 'bg-brand-orange text-black' : 'text-gray-600'}
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div className="border-t-2 border-black my-2 pt-2 space-y-2">
              <div className="px-4 py-2 flex items-center gap-2">
                <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-black" alt="avatar" />
                <div>
                  <span className="font-bold text-sm block">{currentUser.name}</span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    {userRole === 'owner' && <Crown size={10} className="text-yellow-500" />}
                    {userRole === 'admin' && <Shield size={10} className="text-blue-500" />}
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
                </div>
              </div>
              <button onClick={() => { toggleLang(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-bold uppercase hover:bg-gray-100 flex items-center gap-2">
                <Languages size={14} /> Switch Language: {language}
              </button>
              <Link href="/landing" onClick={() => setIsMobileMenuOpen(false)} className="w-full text-left px-4 py-2 text-xs font-bold uppercase bg-brand-accent text-white hover:bg-purple-500 flex items-center gap-2">
                <Home size={14} /> Kembali
              </Link>
              <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-2 text-xs font-bold uppercase bg-red-500 text-white hover:bg-red-600 flex items-center gap-2">
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 p-4 md:p-10 overflow-y-auto relative z-10 min-h-screen pb-24 md:pb-10 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'}`}
          style={{
            background: `linear-gradient(135deg, var(--theme-light) 0%, #FDFBF7 50%, var(--theme-medium) 100%)`
          }}
        >
          <div className="max-w-6xl mx-auto space-y-8">
            {renderPage()}
          </div>
        </main>

        {/* Mobile Bottom Quick Action Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black h-16 z-50 flex items-stretch justify-between shadow-[0px_-4px_10px_rgba(0,0,0,0.05)]">
          <MobileNavItem page="dashboard" icon={<Home />} active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
          <MobileNavItem page="transactions" icon={<List />} active={currentPage === 'transactions'} onClick={() => setCurrentPage('transactions')} />

          <button onClick={() => setCurrentPage('ai')} className="flex-1 -mt-6 flex justify-center">
            <div className={`
                  w-14 h-14 bg-brand-orange border-2 border-black flex items-center justify-center shadow-neo
                  transition-transform active:scale-95 active:shadow-none
                  ${currentPage === 'ai' ? 'ring-2 ring-black ring-offset-2' : ''}
              `}>
              <Bot className="text-black w-8 h-8" />
            </div>
          </button>

          <MobileNavItem page="assets" icon={<Landmark />} active={currentPage === 'assets'} onClick={() => setCurrentPage('assets')} />

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

      {/* Quick Team View Dialog */}
      <QuickTeamView
        isOpen={isQuickTeamOpen}
        onClose={() => setIsQuickTeamOpen(false)}
        organizationId={profile?.default_organization_id || ''}
        currentUserId={user?.id || ''}
      />
    </LanguageContext.Provider>
  );
};
