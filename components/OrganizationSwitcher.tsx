'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, Building2, Plus, LogOut, Crown, Shield, User, Check } from 'lucide-react'

interface Organization {
    id: string
    name: string
    slug: string
    logo_url: string | null
    role: string
    plan: string
}

interface OrganizationSwitcherProps {
    currentOrgId: string | null
    currentOrgName: string
    onSwitch: () => void
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
    currentOrgId,
    currentOrgName,
    onSwitch
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen) {
            fetchOrganizations()
        }
    }, [isOpen])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const fetchOrganizations = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/organizations/list')
            const data = await response.json()

            if (data.organizations) {
                setOrganizations(data.organizations)
            }
        } catch (error) {
            console.error('Error fetching organizations:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSwitch = async (orgId: string) => {
        try {
            const response = await fetch('/api/organizations/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId })
            })

            const data = await response.json()

            if (data.success) {
                setIsOpen(false)
                onSwitch() // Trigger reload
            } else {
                alert(data.error || 'Gagal switch organisasi')
            }
        } catch (error) {
            console.error('Error switching organization:', error)
            alert('Gagal switch organisasi')
        }
    }

    const handleLeaveOrg = async (orgId: string, orgName: string) => {
        if (!confirm(`Yakin ingin keluar dari "${orgName}"? Anda tidak akan bisa akses data organisasi ini lagi.`)) {
            return
        }

        try {
            const response = await fetch('/api/organizations/leave', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgId })
            })

            const data = await response.json()

            if (data.success) {
                alert(data.message)
                setIsOpen(false)
                onSwitch() // Trigger reload
            } else {
                alert(data.error || 'Gagal keluar dari organisasi')
            }
        } catch (error) {
            console.error('Error leaving organization:', error)
            alert('Gagal keluar dari organisasi')
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner':
                return <Crown className="w-3 h-3 text-brand-orange" />
            case 'admin':
                return <Shield className="w-3 h-3 text-brand-accent" />
            default:
                return <User className="w-3 h-3 text-gray-500" />
        }
    }

    const getRoleBadge = (role: string) => {
        const styles = {
            owner: 'bg-brand-orange text-white',
            admin: 'bg-brand-accent text-white',
            member: 'bg-gray-200 text-gray-700'
        }

        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${styles[role as keyof typeof styles]}`}>
                {role}
            </span>
        )
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Switcher Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border-2 border-black p-3 flex items-center justify-between hover:bg-gray-50 transition-colors shadow-neo-sm"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-5 h-5 text-brand-orange flex-shrink-0" />
                    <div className="text-left min-w-0">
                        <div className="font-black text-sm uppercase truncate">
                            {currentOrgName || 'Select Workspace'}
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium">
                            Workspace Aktif
                        </div>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black shadow-neo-lg z-50 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                            Loading...
                        </div>
                    ) : (
                        <>
                            {/* Organizations List */}
                            <div className="py-2">
                                {organizations.map((org) => (
                                    <div
                                        key={org.id}
                                        className={`border-b border-gray-100 last:border-0 ${org.id === currentOrgId ? 'bg-gray-50' : ''
                                            }`}
                                    >
                                        <div className="px-3 py-2 hover:bg-gray-100 transition-colors">
                                            <button
                                                onClick={() => handleSwitch(org.id)}
                                                className="w-full text-left"
                                                disabled={org.id === currentOrgId}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {getRoleIcon(org.role)}
                                                        <span className="font-bold text-sm truncate">
                                                            {org.name}
                                                        </span>
                                                        {org.id === currentOrgId && (
                                                            <Check className="w-4 h-4 text-brand-orange flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getRoleBadge(org.role)}
                                                    <span className="text-[10px] text-gray-400 uppercase">
                                                        {org.slug}
                                                    </span>
                                                </div>
                                            </button>

                                            {/* Leave button - only show if not current org and not the only org */}
                                            {org.id !== currentOrgId && organizations.length > 1 && (
                                                <button
                                                    onClick={() => handleLeaveOrg(org.id, org.name)}
                                                    className="mt-2 w-full px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <LogOut className="w-3 h-3" />
                                                    Keluar dari Workspace
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Create New Organization */}
                            <div className="border-t-2 border-black">
                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        setShowCreateDialog(true)
                                    }}
                                    className="w-full px-3 py-3 bg-brand-orange hover:bg-orange-600 text-white font-black text-sm uppercase flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Buat Workspace Baru
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Create Organization Dialog */}
            {showCreateDialog && (
                <CreateOrganizationDialog
                    onClose={() => setShowCreateDialog(false)}
                    onSuccess={() => {
                        setShowCreateDialog(false)
                        onSwitch() // Trigger reload
                    }}
                />
            )}
        </div>
    )
}

// Create Organization Dialog Component
interface CreateOrganizationDialogProps {
    onClose: () => void
    onSuccess: () => void
}

const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({
    onClose,
    onSuccess
}) => {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            alert('Nama workspace harus diisi')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/organizations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() })
            })

            const data = await response.json()

            if (data.success) {
                alert(`Workspace "${data.organization.name}" berhasil dibuat!`)
                onSuccess()
            } else {
                alert(data.error || 'Gagal membuat workspace')
                setLoading(false)
            }
        } catch (error) {
            console.error('Error creating organization:', error)
            alert('Gagal membuat workspace')
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white border-4 border-black shadow-neo-lg max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-brand-orange border-b-4 border-black p-4">
                    <h2 className="text-xl font-black uppercase text-white">Buat Workspace Baru</h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block font-black uppercase text-xs text-gray-700 mb-2">
                            Nama Workspace
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Bisnis Saya, Keuangan Pribadi"
                            className="w-full px-4 py-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-brand-orange"
                            autoFocus
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Anda akan menjadi Owner dan punya kontrol penuh
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-brand-orange hover:bg-orange-600 disabled:bg-gray-400 text-white font-black py-3 border-2 border-black shadow-neo hover:translate-y-0.5 hover:shadow-neo-sm transition-all uppercase"
                        >
                            {loading ? 'Membuat...' : 'Buat Workspace'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 bg-white hover:bg-gray-100 disabled:bg-gray-200 text-black font-black py-3 border-2 border-black shadow-neo hover:translate-y-0.5 hover:shadow-neo-sm transition-all uppercase"
                        >
                            Batal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
