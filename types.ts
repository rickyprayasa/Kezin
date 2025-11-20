export type User = {
  id: string;
  name: string;
  avatar: string;
  color: string;
};

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

export type TransactionChangeLog = {
  id: string;
  date: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: 'UPDATE' | 'CREATE' | 'DELETE';
  previousAmount?: number;
};

export type Transaction = {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  type: TransactionType;
  userId: string; // Who made the transaction
  accountId?: string; // Link to Asset ID (Source of Fund)
  history?: TransactionChangeLog[];
};

export type KanbanStatus = 'TODO' | 'PLANNED' | 'PAID' | 'OVERDUE';

export type BillTask = {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: KanbanStatus;
  assigneeId?: string;
};

export type Asset = {
  id: string;
  name: string;
  value: number;
  type: 'CASH' | 'INVESTMENT' | 'PROPERTY' | 'DEBT';
  trend: number; // percentage change
};

export type AIParseResult = {
  amount: number;
  category: string;
  description: string;
  type: TransactionType;
  date?: string;
};

export type SavingsHistory = {
  id: string;
  date: string;
  amount: number;
  sourceAssetName: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  history: SavingsHistory[];
};

export type DebtHistory = {
  id: string;
  date: string;
  amount: number;
  sourceAssetName: string; // Account used to pay or Account received into
};

export type Debt = {
  id: string;
  name: string;
  lender: string; // Who lent the money / Who borrowed
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  type: 'OWE' | 'OWED'; // OWE = Hutang Saya, OWED = Piutang (Orang hutang ke saya)
  history: DebtHistory[];
};

export type Budget = {
  id: string;
  category: string;
  limit: number;
  period: 'MONTHLY' | 'WEEKLY';
};

export type CategoryState = {
  expense: string[];
  income: string[];
};

export type Language = 'ID' | 'EN';