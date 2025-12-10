"use client";

import React, { useMemo, useContext } from 'react';
import { NeoCard, NeoBadge } from '../NeoUI';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, YAxis } from 'recharts';
import { Transaction, Asset, User } from '@/lib/types';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { LanguageContext } from '../MainApp';

interface DashboardProps {
  transactions: Transaction[];
  assets: Asset[];
  currentUser: User;
}

const COLORS = ['#F38020', '#A78BFA', '#4ADE80', '#F87171', '#1D1D1D'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, assets, currentUser }) => {
  const { t } = useContext(LanguageContext);
  
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const netWorth = assets.reduce((acc, a) => a.type === 'DEBT' ? acc - a.value : acc + a.value, 0);
    return { totalIncome, totalExpense, balance, netWorth };
  }, [transactions, assets]);

  const expenseData = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    });
    return Object.keys(cats).map(k => ({ name: k, value: cats[k] }));
  }, [transactions]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NeoCard color="white" className="flex flex-col justify-between">
          <span className="text-sm font-bold text-gray-500 uppercase">{t.dashboard.totalBalance}</span>
          <div className="text-2xl lg:text-3xl font-black mt-2 flex items-center gap-2 break-all">
            {formatCurrency(stats.balance)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm font-bold">
             <NeoBadge color="bg-brand-green">{t.dashboard.active}</NeoBadge>
             <span className="text-gray-500">{t.dashboard.for} {currentUser.name}</span>
          </div>
        </NeoCard>

        <NeoCard color="dark" className="flex flex-col justify-between">
           <span className="text-sm font-bold text-gray-400 uppercase">{t.dashboard.netWorth}</span>
           <div className="text-2xl lg:text-3xl font-black mt-2 text-brand-orange break-all">
            {formatCurrency(stats.netWorth)}
           </div>
           <div className="mt-4 text-sm text-gray-300">
             {t.dashboard.includes}
           </div>
        </NeoCard>

        <NeoCard color="purple" className="flex flex-col justify-between">
          <span className="text-sm font-bold uppercase">{t.dashboard.monthlyIncome}</span>
          <div className="text-2xl lg:text-3xl font-black mt-2 flex items-center gap-2 break-all">
            <TrendingUp className="w-8 h-8 shrink-0" />
            {formatCurrency(stats.totalIncome)}
          </div>
        </NeoCard>

        <NeoCard color="orange" className="flex flex-col justify-between">
           <span className="text-sm font-bold uppercase">{t.dashboard.monthlyExpense}</span>
           <div className="text-2xl lg:text-3xl font-black mt-2 flex items-center gap-2 break-all">
             <TrendingDown className="w-8 h-8 shrink-0" />
             {formatCurrency(stats.totalExpense)}
           </div>
        </NeoCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeoCard title={t.dashboard.expenseBreakdown}>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} stroke="black" strokeWidth={2} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </NeoCard>

        <NeoCard title={t.dashboard.assetGrowth}>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assets.filter(a => a.type !== 'DEBT')}>
                  <XAxis dataKey="name" stroke="#000" tick={{fontSize: 12, fontWeight: 'bold'}} />
                  <YAxis stroke="#000" tick={{fontSize: 12}} tickFormatter={(val) => `${val/1000000}M`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{fill: '#eee'}} 
                    contentStyle={{ border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px 0px #000' }} 
                  />
                  <Bar dataKey="value" fill="#F38020" stroke="#000" strokeWidth={2} />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </NeoCard>
      </div>
    </div>
  );
};
