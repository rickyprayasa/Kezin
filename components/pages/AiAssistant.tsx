"use client";

import React, { useState, useContext, useMemo } from 'react';
import { NeoCard, NeoButton, NeoInput, NeoSelect } from '../NeoUI';
import { parseTransactionWithGemini, analyzeFinances } from '@/lib/gemini';
import { Transaction, TransactionType, Asset } from '@/lib/types';
import { Loader2, Mic, Send, Sparkles, MessageSquareText, TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { LanguageContext } from '../MainApp';

interface AiAssistantProps {
    onAddTransaction: (t: Omit<Transaction, 'id' | 'userId'>) => Promise<void> | void;
    transactions: Transaction[];
    currentUser?: { defaultAccountId?: string };
    assets?: Asset[];
}

const COLORS = ['#FF6B35', '#9B59B6', '#2ECC71', '#E74C3C', '#F39C12', '#3498DB', '#E67E22', '#1ABC9C'];

export const AiAssistant: React.FC<AiAssistantProps> = ({ onAddTransaction, transactions, currentUser, assets = [] }) => {
    const { t } = useContext(LanguageContext);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [mode, setMode] = useState<'RECORD' | 'ANALYZE'>('RECORD');

    // Filter valid assets (CASH or INVESTMENT types) and get default
    const validAssets = assets.filter(a => a.type === 'CASH' || a.type === 'INVESTMENT');
    const defaultAssetId = validAssets.length > 0 ? validAssets[0].id : undefined;
    const [selectedAssetId, setSelectedAssetId] = useState<string>(defaultAssetId || '');

    const stats = useMemo(() => {
        const recent10 = transactions.slice(0, 10);
        const totalIncome = recent10.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = recent10.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpense;

        const categoryData: { [key: string]: number } = {};
        recent10.filter(t => t.type === 'EXPENSE').forEach(t => {
            categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
        });

        const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

        return { totalIncome, totalExpense, balance, pieData };
    }, [transactions]);

    const handleRecord = async () => {
        if (!input.trim()) return;
        if (!selectedAssetId) {
            alert("Please select a source account first");
            return;
        }
        setIsLoading(true);
        try {
            const result = await parseTransactionWithGemini(input);
            if (result) {
                await onAddTransaction({
                    amount: result.amount,
                    category: result.category,
                    description: result.description,
                    type: result.type as TransactionType,
                    date: result.date || new Date().toISOString().split('T')[0],
                    accountId: selectedAssetId
                });
                setInput('');
            } else {
                // Demo mode fallback
                await onAddTransaction({
                    amount: 50000,
                    category: 'Demo',
                    description: input,
                    type: 'EXPENSE',
                    date: new Date().toISOString().split('T')[0],
                    accountId: selectedAssetId
                });
                setInput('');
            }
        } catch (e) {
            console.error(e);
            alert("AI Error. Check console.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        setAnalysis('');
        const summary = transactions.slice(0, 10).map(t => `${t.date}: ${t.type} ${t.amount} for ${t.category}`).join('\n');
        const result = await analyzeFinances(summary);
        setAnalysis(result);
        setIsLoading(false);
    };

    return (
        <div className="space-y-8">
            <div className="text-center border-b-4 border-black pb-6">
                <h2 className="text-4xl font-black uppercase tracking-tight mb-2">{t.ai.title}</h2>
                <p className="text-gray-600 font-medium max-w-2xl mx-auto">
                    {t.ai.desc}
                </p>
            </div>

            <div className="flex justify-center">
                <div className="inline-flex p-1 bg-white border-2 border-black shadow-neo-sm">
                    <button
                        onClick={() => setMode('RECORD')}
                        className={`px-8 py-3 font-black uppercase text-sm transition-all flex items-center gap-2 ${mode === 'RECORD' ? 'bg-brand-orange text-black' : 'text-gray-400 hover:text-black'
                            }`}
                    >
                        <Mic size={18} /> {t.ai.record}
                    </button>
                    <button
                        onClick={() => setMode('ANALYZE')}
                        className={`px-8 py-3 font-black uppercase text-sm transition-all flex items-center gap-2 ${mode === 'ANALYZE' ? 'bg-brand-accent text-black' : 'text-gray-400 hover:text-black'
                            }`}
                    >
                        <Sparkles size={18} /> {t.ai.insights}
                    </button>
                </div>
            </div>

            {mode === 'RECORD' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <NeoCard className="flex flex-col min-h-[400px]" color="white">
                        <div className="flex-1 flex flex-col space-y-6 p-2">
                            <div className="text-center space-y-3 pt-4">
                                <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto border-2 border-black">
                                    <MessageSquareText className="w-8 h-8 text-brand-orange" />
                                </div>
                                <h3 className="font-black text-2xl uppercase">Tell Me What You Spent</h3>
                                <p className="text-sm text-gray-500 font-medium">Contoh: Bayar tagihan Internet 450000...</p>
                            </div>

                            <div className="flex-1 flex flex-col justify-center space-y-4">
                                {/* Source Account Selector */}
                                <div className="space-y-1">
                                    <label className="font-bold text-xs uppercase flex items-center gap-2 text-gray-600">
                                        <Wallet size={14} /> Source Account
                                    </label>
                                    <NeoSelect
                                        value={selectedAssetId}
                                        onChange={(e) => setSelectedAssetId(e.target.value)}
                                    >
                                        <option value="" disabled>Select account...</option>
                                        {validAssets.map(asset => (
                                            <option key={asset.id} value={asset.id}>{asset.name}</option>
                                        ))}
                                    </NeoSelect>
                                </div>

                                <NeoInput
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={t.ai.placeholder}
                                    className="py-5 text-base"
                                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleRecord()}
                                />

                                <NeoButton
                                    onClick={handleRecord}
                                    className="w-full py-5 text-base"
                                    disabled={isLoading || !selectedAssetId}
                                    icon={isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                                >
                                    {isLoading ? t.ai.processing : t.ai.process}
                                </NeoButton>
                            </div>
                        </div>
                    </NeoCard>

                    <NeoCard title={t.ai.recent} color="dark" className="min-h-[400px]">
                        <div className="space-y-3">
                            {transactions.slice(0, 5).map((t) => (
                                <div
                                    key={t.id}
                                    className="flex justify-between items-center p-3 border-b border-gray-700 last:border-0 hover:bg-gray-800/30 transition-colors rounded"
                                >
                                    <div className="flex-1">
                                        <div className="font-bold text-white text-sm">{t.description}</div>
                                        <div className="text-xs text-gray-400 mt-1">{t.date} - {t.category}</div>
                                    </div>
                                    <div className={`font-black text-base ${t.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}`}>
                                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </div>
                                </div>
                            ))}
                            {transactions.length === 0 && (
                                <div className="text-gray-400 italic text-center py-12">
                                    <MessageSquareText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>Belum ada transaksi.</p>
                                </div>
                            )}
                        </div>
                    </NeoCard>
                </div>
            )}

            {mode === 'ANALYZE' && (
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <NeoButton
                            onClick={handleAnalyze}
                            className="px-12 py-5 text-lg"
                            icon={isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                            disabled={isLoading}
                            variant="secondary"
                        >
                            {isLoading ? 'Menganalisis...' : 'Buat Analisa'}
                        </NeoButton>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <NeoCard color="white" className="text-center p-6">
                            <div className="flex flex-col items-center">
                                <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                                <span className="text-sm font-bold text-gray-600 uppercase mb-2">Pemasukan</span>
                                <span className="text-3xl font-black text-green-600">{formatCurrency(stats.totalIncome)}</span>
                            </div>
                        </NeoCard>

                        <NeoCard color="white" className="text-center p-6">
                            <div className="flex flex-col items-center">
                                <TrendingDown className="w-8 h-8 text-red-600 mb-2" />
                                <span className="text-sm font-bold text-gray-600 uppercase mb-2">Pengeluaran</span>
                                <span className="text-3xl font-black text-red-600">{formatCurrency(stats.totalExpense)}</span>
                            </div>
                        </NeoCard>

                        <NeoCard color="white" className="text-center p-6">
                            <div className="flex flex-col items-center">
                                <DollarSign className="w-8 h-8 text-blue-600 mb-2" />
                                <span className="text-sm font-bold text-gray-600 uppercase mb-2">Saldo</span>
                                <span className={`text-3xl font-black ${stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                    {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
                                </span>
                            </div>
                        </NeoCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {stats.pieData.length > 0 && (() => {
                                const topCategory = stats.pieData.sort((a, b) => b.value - a.value)[0];
                                const topPercent = ((topCategory.value / stats.totalExpense) * 100).toFixed(0);
                                return (
                                    <NeoCard color="white">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-red-100 border-2 border-black flex items-center justify-center shrink-0">
                                                <TrendingDown className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-black text-sm uppercase mb-2">Pengeluaran Terbesar</h5>
                                                <p className="text-sm leading-relaxed">
                                                    Kategori <span className="font-black text-red-600">{topCategory.name}</span> mendominasi pengeluaran Anda sebesar{' '}
                                                    <span className="font-black">{topPercent}%</span> ({formatCurrency(topCategory.value)}) dari total pengeluaran.
                                                </p>
                                            </div>
                                        </div>
                                    </NeoCard>
                                );
                            })()}

                            <NeoCard color="white" className={stats.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 border-2 border-black flex items-center justify-center shrink-0 ${stats.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                                        {stats.balance >= 0 ? (
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                        ) : (
                                            <TrendingDown className="w-5 h-5 text-orange-600" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-black text-sm uppercase mb-2">
                                            {stats.balance >= 0 ? 'Kondisi Surplus' : 'Perhatian: Defisit'}
                                        </h5>
                                        <p className="text-sm leading-relaxed">
                                            {stats.balance >= 0 ? (
                                                <>Bagus! Pemasukan lebih besar dari pengeluaran.</>
                                            ) : (
                                                <>Pengeluaran melebihi pemasukan. Perlu evaluasi.</>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </NeoCard>
                        </div>

                        <div className="space-y-6">
                            {stats.pieData.length > 0 && (
                                <NeoCard color="white">
                                    <div className="flex items-center gap-2 mb-4">
                                        <PieChartIcon className="w-5 h-5" />
                                        <h4 className="font-black uppercase text-sm">Detail Pengeluaran per Kategori</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {stats.pieData
                                            .sort((a, b) => b.value - a.value)
                                            .map((item, idx) => {
                                                const percent = (item.value / stats.totalExpense) * 100;
                                                return (
                                                    <div key={idx} className="space-y-1">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="font-bold uppercase">{item.name}</span>
                                                            <span className="font-black">{formatCurrency(item.value)} ({percent.toFixed(0)}%)</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 border-2 border-black h-7 overflow-hidden">
                                                            <div
                                                                className="h-full flex items-center justify-end pr-2"
                                                                style={{
                                                                    width: `${percent}%`,
                                                                    backgroundColor: COLORS[idx % COLORS.length]
                                                                }}
                                                            >
                                                                <span className="text-white font-black text-xs drop-shadow">
                                                                    {percent >= 15 && `${percent.toFixed(0)}%`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </NeoCard>
                            )}

                            <NeoCard color="white" className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-300">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-purple-200">
                                    <div className="w-8 h-8 bg-purple-600 border-2 border-black flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <h4 className="font-black uppercase text-sm text-purple-900">AI Insights dari Gemini</h4>
                                </div>
                                {isLoading && !analysis ? (
                                    <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="font-medium">Menganalisis data keuangan Anda...</span>
                                    </div>
                                ) : analysis ? (
                                    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                        {analysis.split('\n').filter(line => line.trim()).map((line, idx) => {
                                            let styledLine = line
                                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-purple-900 bg-yellow-200 px-1">$1</strong>')
                                                .replace(/\*(.*?)\*/g, '<em class="font-bold text-purple-800 bg-pink-100 px-1">$1</em>')
                                                .replace(/(Rp\s?[\d.,]+)/g, '<span class="font-black text-orange-600 bg-orange-100 px-1 border border-orange-300">$1</span>')
                                                .replace(/(\d+%)/g, '<span class="font-black text-blue-600 bg-blue-100 px-1 border border-blue-300">$1</span>');

                                            return (
                                                <div
                                                    key={idx}
                                                    className="text-sm leading-relaxed text-gray-800 p-3 bg-white/60 border-l-4 border-purple-400 rounded"
                                                    dangerouslySetInnerHTML={{ __html: styledLine }}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
                                        <Sparkles className="w-12 h-12 opacity-20" />
                                        <p className="text-sm font-medium text-center">
                                            Klik tombol &quot;Buat Analisa&quot; untuk mendapatkan<br />insight dari AI tentang keuangan Anda
                                        </p>
                                    </div>
                                )}
                            </NeoCard>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
