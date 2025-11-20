"use client";

import React, { useState, useContext } from 'react';
import { NeoCard, NeoButton, NeoInput } from '../components/NeoUI';
import { parseTransactionWithGemini, analyzeFinances } from '../services/gemini';
import { Transaction, TransactionType } from '../types';
import { Loader2, Mic, Send, Sparkles, MessageSquareText, FileText } from 'lucide-react';
import { formatCurrency } from '../utils';
import { LanguageContext } from '../App';

interface AiAssistantProps {
  onAddTransaction: (t: Omit<Transaction, 'id' | 'userId'>) => void;
  transactions: Transaction[];
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ onAddTransaction, transactions }) => {
  const { t } = useContext(LanguageContext);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [mode, setMode] = useState<'RECORD' | 'ANALYZE'>('RECORD');

  const handleRecord = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      // API Key check
      if(!process.env.API_KEY) {
         console.warn("Demo Mode: No API KEY in env");
         setTimeout(() => {
            onAddTransaction({
                amount: 50000,
                category: 'Mock',
                description: input,
                type: 'EXPENSE',
                date: new Date().toISOString().split('T')[0]
            });
            setInput('');
            setIsLoading(false);
        }, 1000);
        return;
      }

      const result = await parseTransactionWithGemini(input);
      if (result) {
        onAddTransaction({
          amount: result.amount,
          category: result.category,
          description: result.description,
          type: result.type as TransactionType,
          date: result.date || new Date().toISOString().split('T')[0]
        });
        setInput('');
      } else {
        alert("Could not parse that. Try: 'Lunch 20000'");
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
    const summary = transactions.slice(0, 10).map(t => `${t.date}: ${t.type} ${t.amount} for ${t.category}`).join('\n');
    const result = await analyzeFinances(summary);
    setAnalysis(result);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
        {/* Symmetrical Header */}
        <div className="text-center border-b-4 border-black pb-6">
            <h2 className="text-4xl font-black uppercase tracking-tight mb-2">{t.ai.title}</h2>
            <p className="text-gray-600 font-medium max-w-2xl mx-auto">
                {t.ai.desc}
            </p>
        </div>

        {/* Central Mode Toggle */}
        <div className="flex justify-center max-w-md mx-auto">
            <div className="flex p-1 bg-white border-2 border-black shadow-neo-sm w-full">
                <button
                    onClick={() => setMode('RECORD')}
                    className={`flex-1 py-3 font-black uppercase transition-all flex items-center justify-center gap-2 ${mode === 'RECORD' ? 'bg-brand-orange text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                >
                    <Mic size={18}/> {t.ai.record}
                </button>
                <button
                    onClick={() => setMode('ANALYZE')}
                    className={`flex-1 py-3 font-black uppercase transition-all flex items-center justify-center gap-2 ${mode === 'ANALYZE' ? 'bg-brand-accent text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                >
                    <Sparkles size={18}/> {t.ai.insights}
                </button>
            </div>
        </div>

        {/* Main Content Area - Centered & Symmetrical */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left/Top Panel: Input Area */}
            <div className="lg:col-span-7 space-y-6">
                <NeoCard className="h-full min-h-[300px] flex flex-col" color="white">
                    {mode === 'RECORD' ? (
                        <div className="flex-1 flex flex-col justify-center space-y-6">
                             <div className="text-center space-y-2">
                                <MessageSquareText className="w-12 h-12 mx-auto text-gray-300" />
                                <h3 className="font-bold text-xl uppercase">Tell me what you spent</h3>
                             </div>
                             
                             <div className="relative">
                                <NeoInput 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={t.ai.placeholder}
                                className="py-6 text-lg"
                                onKeyDown={(e) => e.key === 'Enter' && handleRecord()}
                                />
                            </div>
                            
                            <NeoButton 
                                onClick={handleRecord} 
                                className="w-full py-4 text-lg" 
                                disabled={isLoading}
                                icon={isLoading ? <Loader2 className="animate-spin"/> : <Send />}
                            >
                                {isLoading ? t.ai.processing : t.ai.process}
                            </NeoButton>
                        </div>
                    ) : (
                         <div className="flex-1 flex flex-col justify-center space-y-6">
                            <div className="text-center space-y-2">
                                <FileText className="w-12 h-12 mx-auto text-gray-300" />
                                <h3 className="font-bold text-xl uppercase">Financial Analysis</h3>
                             </div>
                             <p className="text-center text-gray-500 font-medium px-8">{t.ai.analyzePrompt}</p>
                             <NeoButton 
                                onClick={handleAnalyze} 
                                className="w-full py-4 text-lg"
                                icon={isLoading ? <Loader2 className="animate-spin"/> : <Sparkles />}
                                disabled={isLoading}
                                variant="secondary"
                            >
                                {t.ai.genInsights}
                            </NeoButton>
                        </div>
                    )}
                </NeoCard>
            </div>

            {/* Right/Bottom Panel: Output Area */}
            <div className="lg:col-span-5 space-y-6">
                {mode === 'RECORD' && (
                    <NeoCard title={t.ai.recent} color="dark" className="h-full">
                        <ul className="space-y-4">
                        {transactions.slice(0, 5).map((t) => (
                            <li key={t.id} className="flex justify-between items-center border-b border-gray-700 pb-3 last:border-0">
                            <div>
                                <div className="font-bold text-white">{t.description}</div>
                                <div className="text-xs text-gray-400">{t.date} • {t.category}</div>
                            </div>
                            <div className={`font-black ${t.type === 'INCOME' ? 'text-green-400' : 'text-brand-orange'}`}>
                                {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                            </div>
                            </li>
                        ))}
                        {transactions.length === 0 && <li className="text-gray-500 italic text-center py-4">No recent transactions.</li>}
                        </ul>
                    </NeoCard>
                )}

                {mode === 'ANALYZE' && (
                    <NeoCard title="Gemini Report" color="green" className="h-full min-h-[300px]">
                        {analysis ? (
                             <div className="prose font-medium whitespace-pre-line text-sm leading-relaxed">
                                {analysis}
                             </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-10">
                                <Sparkles className="w-10 h-10 mb-2" />
                                <p>Click "Generate Insights" to start.</p>
                            </div>
                        )}
                    </NeoCard>
                )}
            </div>
        </div>
    </div>
  );
};