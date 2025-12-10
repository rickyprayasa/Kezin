'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Users, Crown, Shield, User as UserIcon } from 'lucide-react'

interface QuickTeamViewProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  currentUserId: string
}

interface TeamMember {
  id: string
  role: string
  user_id: string
  profiles?: {
    email: string
    full_name: string
    avatar_url: string
  } | null
}

export const QuickTeamView: React.FC<QuickTeamViewProps> = ({
  isOpen,
  onClose,
  organizationId,
  currentUserId
}) => {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchMembers()
    }
  }, [isOpen, organizationId])

  const fetchMembers = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        profiles:user_id(*)
      `)
      .eq('organization_id', organizationId)
      .order('role', { ascending: true })

    console.log('Quick Team View Data:', { data, error })

    if (!error && data) {
      setMembers(data as any)
    }

    setLoading(false)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-brand-orange" />
      case 'admin':
        return <Shield className="w-4 h-4 text-brand-accent" />
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      owner: 'bg-brand-orange text-white',
      admin: 'bg-brand-accent text-white',
      member: 'bg-gray-200 text-gray-700'
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${styles[role as keyof typeof styles]}`}>
        {role}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white border-4 border-black shadow-neo-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b-4 border-black p-4 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-orange" />
            <h2 className="text-xl font-black uppercase">Tim Anda</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 bg-white">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const email = member.profiles?.email || 'Unknown'
                const fullName = (member.profiles?.full_name &&
                                 member.profiles.full_name !== 'Unknown' &&
                                 member.profiles.full_name.trim() !== '')
                  ? member.profiles.full_name
                  : email.split('@')[0]
                const avatarUrl = member.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${email}`

                console.log('Quick view member:', { email, fullName, dbName: member.profiles?.full_name })

                return (
                  <div
                    key={member.id}
                    className="bg-white border-2 border-black p-3 flex items-center gap-3 shadow-neo-sm"
                  >
                    <div className="relative">
                      <img
                        src={avatarUrl}
                        alt={fullName}
                        className="w-12 h-12 rounded-full border-2 border-black object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white border-2 border-black rounded-full p-0.5">
                        {getRoleIcon(member.role)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-black uppercase text-sm truncate">
                        {fullName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {email}
                      </div>
                      <div className="mt-1">
                        {getRoleBadge(member.role)}
                        {member.user_id === currentUserId && (
                          <span className="ml-2 text-xs text-gray-500">(You)</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-4 border-black p-4 bg-white">
          <p className="text-xs text-gray-500 text-center">
            Total {members.length} anggota tim
          </p>
        </div>
      </div>
    </div>
  )
}
