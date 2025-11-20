import React, { useState, useContext } from 'react';
import { NeoCard, NeoButton, NeoDialog, NeoInput, NeoSelect, NeoConfirmDialog } from '../components/NeoUI';
import { Asset } from '../types';
import { Landmark, TrendingUp, TrendingDown, Plus, Wallet, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils';
import { LanguageContext } from '../App';

interface AssetsPageProps {
  assets: Asset[];
  onAddAsset: (a: Omit<Asset, 'id' | 'trend'>) => void;
  onDeleteAsset: (id: string) => void;
}

export const AssetsPage: React.FC<AssetsPageProps> = ({ assets, onAddAsset, onDeleteAsset }) => {
  const { t } = useContext(LanguageContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    type: 'INVESTMENT' as Asset['type']
  });

  // Confirm Delete State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAsset({
      name: formData.name,
      value: Number(formData.value),
      type: formData.type
    });
    setIsDialogOpen(false);
    setFormData({ name: '', value: '', type: 'INVESTMENT' });
  };

  const handleDeleteClick = (e: React.MouseEvent, asset: Asset) => {
      e.stopPropagation();
      setSelectedAsset(asset);
      setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
      if (selectedAsset) {
          onDeleteAsset(selectedAsset.id);
          setIsConfirmOpen(false);
          setSelectedAsset(null);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase flex items-center gap-2">
            <Landmark className="w-8 h-8" /> {t.assets.title}
          </h2>
          <p className="text-gray-600 font-medium">{t.assets.subtitle}</p>
        </div>
        <NeoButton icon={<Plus />} onClick={() => setIsDialogOpen(true)}>{t.assets.add}</NeoButton>
      </div>

      <NeoDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        title={t.assets.addNew}
      >
         <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.assets.name}</label>
                <NeoInput 
                    placeholder="e.g. Stocks, House, Gold" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                />
            </div>
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.assets.value}</label>
                <NeoInput 
                    type="number"
                    placeholder="0.00" 
                    value={formData.value}
                    onChange={e => setFormData({...formData, value: e.target.value})}
                    required
                />
            </div>
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">{t.transactions.type}</label>
                <NeoSelect 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                >
                    <option value="CASH">{t.assets.cash}</option>
                    <option value="INVESTMENT">{t.assets.investment}</option>
                    <option value="PROPERTY">{t.assets.property}</option>
                    <option value="DEBT">{t.assets.debt}</option>
                </NeoSelect>
            </div>
            <div className="flex gap-2 mt-4">
              <NeoButton type="submit" className="w-full">{t.assets.save}</NeoButton>
              <NeoButton type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>{t.transactions.cancel}</NeoButton>
            </div>
         </form>
      </NeoDialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {assets.map(asset => (
          <NeoCard 
            key={asset.id} 
            className={`
                ${asset.type === 'DEBT' ? 'bg-red-50' : asset.type === 'CASH' ? 'bg-orange-50 border-brand-orange' : 'bg-white'}
                hover:shadow-neo-lg transition-shadow cursor-pointer group relative
            `}
          >
            <button 
                onClick={(e) => handleDeleteClick(e, asset)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
            >
                <Trash2 size={18} />
            </button>

            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 border-2 border-black ${asset.type === 'DEBT' ? 'bg-brand-red text-white' : 'bg-brand-green'}`}>
                {asset.type === 'DEBT' ? <TrendingDown size={20}/> : asset.type === 'CASH' ? <Wallet size={20} /> : <TrendingUp size={20}/>}
              </div>
              <span className="font-black text-2xl">
                {asset.type === 'DEBT' ? '-' : ''}{formatCurrency(asset.value)}
              </span>
            </div>
            
            <h3 className="text-xl font-bold mb-1">{asset.name}</h3>
            <div className="flex justify-between items-center">
               <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">{asset.type}</span>
               {asset.type === 'CASH' && (
                   <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-sm uppercase animate-pulse">
                       {t.assets.runningBalance}
                   </span>
               )}
            </div>
          </NeoCard>
        ))}
        
        {/* Add Card Placeholder */}
        <div 
            onClick={() => setIsDialogOpen(true)}
            className="border-4 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 cursor-pointer hover:border-brand-orange hover:bg-orange-50 transition-all min-h-[180px]"
        >
           <div className="bg-gray-200 p-4 rounded-full mb-4">
             <TrendingUp className="text-gray-500" />
           </div>
           <span className="font-bold text-gray-500">{t.assets.addNew}</span>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <NeoConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Asset"
        message="Are you sure you want to delete this asset record?"
      />
    </div>
  );
};