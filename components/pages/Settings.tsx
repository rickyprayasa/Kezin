"use client";

import React, { useState, useContext, useRef, useEffect } from 'react';
import { NeoCard, NeoButton, NeoInput, NeoTabs, NeoBadge, NeoDialog, AppLogo, NeoSelect } from '../NeoUI';
import { User, CategoryState } from '@/lib/types';
import { Settings, Save, Trash2, Download, Plus, TrendingDown, TrendingUp, Pencil, Users, UserPlus, Upload, Image } from 'lucide-react';
import { LanguageContext } from '../MainApp';
import { InviteMemberForm } from '../InviteMemberForm';
import { TeamMembersList } from '../TeamMembersList';
import { PendingInvitationsList } from '../PendingInvitationsList';
import { createClient } from '@/lib/supabase/client';

interface SettingsPageProps {
  currentUser: User;
  onUpdateUser: (u: User) => void;
  categories: CategoryState;
  onUpdateCategories: (c: CategoryState) => void;
  users: User[];
  onAddUser: (u: Omit<User, 'id'>) => void;
  assets?: any[]; // For account selection
  profile?: any; // User profile with organization
  userRole?: string; // Current user role
  userId?: string; // Current user ID
}

// Ghibli Studio Avatar URLs - Custom SVG avatars
const GHIBLI_AVATARS = [
  { url: '/avatars/totoro.svg', name: 'Totoro' },
  { url: '/avatars/noface.svg', name: 'No-Face' },
  { url: '/avatars/ponyo.svg', name: 'Ponyo' },
  { url: '/avatars/calcifer.svg', name: 'Calcifer' },
  { url: '/avatars/kiki.svg', name: 'Kiki' }
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  onUpdateUser,
  categories,
  onUpdateCategories,
  users,
  onAddUser,
  assets = [],
  profile,
  userRole = 'member',
  userId
}) => {
  const { t } = useContext(LanguageContext);
  const [activeTab, setActiveTab] = useState('PROFILE');
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [tempUser, setTempUser] = useState(currentUser);
  const [refreshKey, setRefreshKey] = useState(0);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invite User State
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Edit State
  const [editState, setEditState] = useState<{
    isOpen: boolean;
    type: 'EXPENSE' | 'INCOME';
    oldName: string;
    newName: string;
  }>({ isOpen: false, type: 'EXPENSE', oldName: '', newName: '' });

  // Sync temp user when current user changes
  React.useEffect(() => {
    setTempUser(currentUser);
  }, [currentUser]);

  const handleSaveProfile = async () => {
    try {
      const supabase = createClient()

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: tempUser.name,
          avatar_url: tempUser.avatar
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating profile:', error)
        alert('Failed to update profile: ' + error.message)
        return
      }

      onUpdateUser(tempUser)
      alert("Profile Updated!")
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to update profile')
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempUser({...tempUser, avatar: reader.result as string});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGhibliAvatarSelect = (avatar: { url: string; name: string }) => {
    setTempUser({...tempUser, avatar: avatar.url});
  };

  const handleAddExpenseCat = async () => {
    if (!newExpenseCat || categories.expense.includes(newExpenseCat)) return;
    if (!organizationId) {
      alert('Organization not found');
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('categories')
        .insert({
          organization_id: organizationId,
          name: newExpenseCat,
          type: 'EXPENSE'
        });

      if (error) {
        console.error('Error adding category:', error);
        alert('Failed to add category: ' + error.message);
        return;
      }

      onUpdateCategories({
        ...categories,
        expense: [...categories.expense, newExpenseCat]
      });
      setNewExpenseCat('');
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to add category');
    }
  };

  const handleAddIncomeCat = async () => {
    if (!newIncomeCat || categories.income.includes(newIncomeCat)) return;
    if (!organizationId) {
      alert('Organization not found');
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('categories')
        .insert({
          organization_id: organizationId,
          name: newIncomeCat,
          type: 'INCOME'
        });

      if (error) {
        console.error('Error adding category:', error);
        alert('Failed to add category: ' + error.message);
        return;
      }

      onUpdateCategories({
        ...categories,
        income: [...categories.income, newIncomeCat]
      });
      setNewIncomeCat('');
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to add category');
    }
  };

  const handleDeleteCat = async (cat: string, type: 'EXPENSE' | 'INCOME') => {
    if (!organizationId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('organization_id', organizationId)
        .eq('name', cat)
        .eq('type', type);

      if (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category: ' + error.message);
        return;
      }

      if (type === 'EXPENSE') {
        onUpdateCategories({
          ...categories,
          expense: categories.expense.filter(c => c !== cat)
        });
      } else {
        onUpdateCategories({
          ...categories,
          income: categories.income.filter(c => c !== cat)
        });
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to delete category');
    }
  };

  const openEditDialog = (cat: string, type: 'EXPENSE' | 'INCOME') => {
    setEditState({
        isOpen: true,
        type,
        oldName: cat,
        newName: cat
    });
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const { type, oldName, newName } = editState;

    if (!newName.trim() || newName === oldName) {
        setEditState({ ...editState, isOpen: false });
        return;
    }

    if (type === 'EXPENSE') {
        if (categories.expense.includes(newName)) {
            alert("Category already exists!");
            return;
        }
        onUpdateCategories({
            ...categories,
            expense: categories.expense.map(c => c === oldName ? newName : c)
        });
    } else {
        if (categories.income.includes(newName)) {
            alert("Category already exists!");
            return;
        }
        onUpdateCategories({
            ...categories,
            income: categories.income.map(c => c === oldName ? newName : c)
        });
    }
    setEditState({ ...editState, isOpen: false });
  };

  const handleInviteSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const [organizationId, setOrganizationId] = useState(profile?.default_organization_id || '');

  // Fetch organizationId from database if not in profile
  useEffect(() => {
    const fetchOrgId = async () => {
      if (!organizationId && userId) {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('default_organization_id')
          .eq('id', userId)
          .single();

        if (data?.default_organization_id) {
          setOrganizationId(data.default_organization_id);
          console.log('✅ Fetched organizationId from database:', data.default_organization_id);
        }
      }
    };

    fetchOrgId();
  }, [userId, organizationId]);

  // Debug: Log organization ID
  console.log('Settings - organizationId:', organizationId);
  console.log('Settings - profile:', profile);

  return (
    <div className="space-y-8">
      {/* Centered Header */}
      <div className="text-center border-b-4 border-black pb-6">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">{t.settings.title}</h2>
          <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">{t.settings.subtitle}</p>
      </div>

      {/* Centered Tabs */}
      <NeoTabs
        tabs={[t.settings.tabs.profile, t.settings.tabs.team, t.settings.tabs.categories, t.settings.tabs.system]}
        active={activeTab === 'PROFILE' ? t.settings.tabs.profile : activeTab === 'CATEGORIES' ? t.settings.tabs.categories : activeTab === 'TEAM' ? t.settings.tabs.team : t.settings.tabs.system}
        onChange={(val) => {
            if(val === t.settings.tabs.profile) setActiveTab('PROFILE');
            else if(val === t.settings.tabs.categories) setActiveTab('CATEGORIES');
            else if(val === t.settings.tabs.team) setActiveTab('TEAM');
            else setActiveTab('SYSTEM');
        }}
      />

      {/* Content Area */}
      <div className="max-w-4xl mx-auto">
          {activeTab === 'PROFILE' && (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <NeoCard title={t.settings.profile.user} className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-6 justify-center">
                        <div className="relative group">
                            <img
                                src={tempUser.avatar}
                                alt="Avatar"
                                className="w-32 h-32 border-4 border-black shadow-neo rounded-full object-cover"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-1"
                            >
                                <Upload className="w-3 h-3" />
                                Upload
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                        <div className="w-full max-w-md space-y-4">
                             <div className="space-y-1">
                                <label className="font-black uppercase text-xs text-gray-500">Avatar URL</label>
                                <NeoInput
                                    value={tempUser.avatar}
                                    onChange={(e) => setTempUser({...tempUser, avatar: e.target.value})}
                                    className="text-sm py-2"
                                />
                            </div>
                             <div className="space-y-1">
                                <label className="font-black uppercase text-xs text-gray-500">{t.settings.profile.displayName}</label>
                                <NeoInput
                                    value={tempUser.name}
                                    onChange={(e) => setTempUser({...tempUser, name: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ghibli Avatar Selection */}
                    <div className="border-t-2 border-gray-100 pt-6">
                        <label className="font-black uppercase text-xs text-gray-500 mb-3 block text-center flex items-center justify-center gap-2">
                            <Image className="w-4 h-4" />
                            Studio Ghibli Avatars
                        </label>
                        <div className="flex gap-3 justify-center flex-wrap">
                            {GHIBLI_AVATARS.map((avatar, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleGhibliAvatarSelect(avatar)}
                                    title={avatar.name}
                                    className={`w-16 h-16 border-2 border-black shadow-neo-sm transition-all hover:scale-110 rounded-full overflow-hidden bg-white
                                        ${tempUser.avatar === avatar.url ? 'ring-4 ring-brand-orange ring-offset-2 scale-110' : ''}`}
                                >
                                    <img
                                        src={avatar.url}
                                        alt={avatar.name}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t-2 border-gray-100 pt-6">
                        <label className="font-black uppercase text-xs text-gray-500 mb-3 block text-center">{t.settings.profile.theme}</label>
                        <div className="flex gap-4 justify-center">
                            {['bg-brand-orange', 'bg-brand-accent', 'bg-brand-green', 'bg-brand-red'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setTempUser({...tempUser, color})}
                                    className={`w-12 h-12 border-2 border-black shadow-neo-sm transition-transform hover:scale-110 ${color} ${tempUser.color === color ? 'ring-4 ring-black ring-offset-2' : ''}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Default Account for AI */}
                    <div className="border-t-2 border-gray-100 pt-6">
                        <label className="font-black uppercase text-xs text-gray-500 mb-3 block">Default Akun untuk AI Assistant</label>
                        <p className="text-xs text-gray-500 mb-3">Pilih akun/bank default yang akan digunakan saat AI mencatat transaksi</p>
                        <NeoSelect
                            value={tempUser.defaultAccountId || ''}
                            onChange={(e) => setTempUser({...tempUser, defaultAccountId: e.target.value})}
                        >
                            <option value="">-- Pilih Akun --</option>
                            {assets.filter((a: any) => a.type === 'CASH').map((asset: any) => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.name} - Rp {asset.value.toLocaleString('id-ID')}
                                </option>
                            ))}
                        </NeoSelect>
                    </div>

                    <div className="pt-4">
                        <NeoButton onClick={handleSaveProfile} className="w-full py-4" icon={<Save />}>
                            {t.settings.profile.save}
                        </NeoButton>
                    </div>
                </NeoCard>
            </div>
          )}

          {activeTab === 'TEAM' && (
              <div className="space-y-6">
                  {/* Team Members */}
                  <NeoCard title={t.settings.team.title} color="white">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                          <p className="text-gray-500 font-medium">{t.settings.team.desc}</p>
                          <NeoButton
                            onClick={() => setIsInviteOpen(true)}
                            icon={<UserPlus />}
                            className="w-full sm:w-auto"
                          >
                            {t.settings.team.invite}
                          </NeoButton>
                      </div>

                      <TeamMembersList
                        key={refreshKey}
                        organizationId={organizationId}
                        currentUserId={userId || currentUser.id}
                        userRole={userRole}
                        onUpdate={handleInviteSuccess}
                      />
                  </NeoCard>

                  {/* Pending Invitations - Only for admins */}
                  {['owner', 'admin'].includes(userRole) && (
                    <NeoCard title="Undangan Tertunda" color="white">
                      <PendingInvitationsList
                        key={refreshKey}
                        organizationId={organizationId}
                        onUpdate={handleInviteSuccess}
                      />
                    </NeoCard>
                  )}
              </div>
          )}

          {activeTab === 'CATEGORIES' && (
            <div className="space-y-8">
                {/* Expense Categories */}
                <NeoCard title={t.settings.categories.expense} color="white" className="border-l-8 border-l-brand-red">
                    <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                        <div className="flex-1 w-full">
                             <label className="text-xs font-bold text-red-600 uppercase mb-1 block">{t.settings.categories.newExp}</label>
                             <NeoInput
                                value={newExpenseCat}
                                onChange={(e) => setNewExpenseCat(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddExpenseCat()}
                                placeholder="Type and enter..."
                            />
                        </div>
                        <NeoButton onClick={handleAddExpenseCat} icon={<Plus />} variant="danger" className="w-full md:w-auto">{t.settings.categories.add}</NeoButton>
                    </div>

                    <div className="flex flex-wrap gap-3 bg-red-50/50 p-4 border-2 border-red-100 border-dashed">
                        {categories.expense.map(cat => (
                            <div key={cat} className="group relative inline-block">
                                <NeoBadge color="bg-white border-red-200 text-red-800 shadow-sm pr-14 py-2 text-sm">
                                    {cat}
                                </NeoBadge>
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button
                                        onClick={() => openEditDialog(cat, 'EXPENSE')}
                                        className="p-1 hover:bg-blue-100 rounded-sm transition-colors text-blue-600"
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCat(cat, 'EXPENSE')}
                                        className="p-1 hover:bg-red-100 rounded-sm transition-colors text-red-600"
                                    >
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </NeoCard>

                {/* Income Categories */}
                <NeoCard title={t.settings.categories.income} color="white" className="border-l-8 border-l-brand-green">
                    <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                         <div className="flex-1 w-full">
                             <label className="text-xs font-bold text-green-600 uppercase mb-1 block">{t.settings.categories.newInc}</label>
                             <NeoInput
                                value={newIncomeCat}
                                onChange={(e) => setNewIncomeCat(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddIncomeCat()}
                                placeholder="Type and enter..."
                            />
                        </div>
                        <NeoButton onClick={handleAddIncomeCat} icon={<Plus />} variant="success" className="w-full md:w-auto">{t.settings.categories.add}</NeoButton>
                    </div>

                    <div className="flex flex-wrap gap-3 bg-green-50/50 p-4 border-2 border-green-100 border-dashed">
                        {categories.income.map(cat => (
                            <div key={cat} className="group relative inline-block">
                                <NeoBadge color="bg-white border-green-200 text-green-800 shadow-sm pr-14 py-2 text-sm">
                                    {cat}
                                </NeoBadge>
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button
                                        onClick={() => openEditDialog(cat, 'INCOME')}
                                        className="p-1 hover:bg-blue-100 rounded-sm transition-colors text-blue-600"
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCat(cat, 'INCOME')}
                                        className="p-1 hover:bg-red-100 rounded-sm transition-colors text-red-600"
                                    >
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </NeoCard>
            </div>
          )}

          {activeTab === 'SYSTEM' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NeoCard title={t.settings.system.data} color="dark" className="h-full flex flex-col justify-between">
                      <div className="mb-6">
                         <p className="text-gray-300 text-sm leading-relaxed">{t.settings.system.control}</p>
                      </div>
                      <div className="space-y-3">
                          <NeoButton variant="secondary" className="w-full justify-between" icon={<Download />}>
                              {t.settings.system.export}
                          </NeoButton>
                          <NeoButton variant="danger" className="w-full justify-between" icon={<Trash2 />}>
                              {t.settings.system.reset}
                          </NeoButton>
                      </div>
                  </NeoCard>

                  <NeoCard title={t.settings.system.about} className="h-full flex flex-col items-center justify-center text-center">
                      <div className="mb-6 transform scale-150">
                          <AppLogo />
                      </div>
                      <h3 className="font-black text-3xl uppercase tracking-tighter mb-1">SAVERY</h3>
                      <p className="text-xs font-bold bg-black text-white px-3 py-1 uppercase mb-6">Version 2.1.0</p>

                      <div className="border-t-2 border-gray-100 w-full pt-6 flex flex-col items-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Powered By</p>
                          <img src="https://i.imgur.com/MmO4CAn.png" alt="RSQUARE" className="w-24 opacity-80 hover:opacity-100 transition-opacity" />
                      </div>
                  </NeoCard>
              </div>
          )}
      </div>

      {/* Edit Category Dialog */}
      <NeoDialog
        isOpen={editState.isOpen}
        onClose={() => setEditState({ ...editState, isOpen: false })}
        title="Edit Category"
      >
        <form onSubmit={handleUpdateCategory} className="space-y-4">
            <div className="space-y-1">
                <label className="font-bold text-sm uppercase">Category Name</label>
                <NeoInput
                    value={editState.newName}
                    onChange={(e) => setEditState({ ...editState, newName: e.target.value })}
                    placeholder="Enter new name..."
                    autoFocus
                />
            </div>
            <div className="flex gap-2 pt-2">
                <NeoButton type="submit" className="w-full">Update</NeoButton>
                <NeoButton type="button" variant="ghost" onClick={() => setEditState({ ...editState, isOpen: false })}>Cancel</NeoButton>
            </div>
        </form>
      </NeoDialog>

      {/* Invite Member Dialog */}
      <InviteMemberForm
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        organizationId={organizationId}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
};

const XIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24" height="24" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round"
        className={className}
    >
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
);
