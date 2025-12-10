'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NeoCard } from './NeoUI'
import { Crown, Shield, User, Trash2, RefreshCw } from 'lucide-react'

interface TeamMembersListProps {
  organizationId: string
  currentUserId: string
  userRole: string
  onUpdate?: () => void
}

interface TeamMember {
  id: string
  role: string
  user_id: string
  accepted_at: string
  profiles?: {
    id: string
    email: string
    full_name: string
    avatar_url: string
  } | null
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  organizationId,
  currentUserId,
  userRole,
  onUpdate
}) => {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [organizationId])

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

    console.log('Team Members Data:', { data, error })

    if (!error && data) {
      setMembers(data as any)
    } else if (error) {
      console.error('Error fetching members:', error)
    }

    setLoading(false)
  }

  const removeMember = async (memberId: string) => {
    if (!['owner', 'admin'].includes(userRole)) {
      alert('Hanya admin yang bisa menghapus member')
      return
    }

    if (!confirm('Yakin ingin menghapus member ini?')) return

    const supabase = createClient()

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      alert('Gagal menghapus member: ' + error.message)
      return
    }

    fetchMembers()
    onUpdate?.()
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-brand-orange" />
      case 'admin':
        return <Shield className="w-4 h-4 text-brand-accent" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Refresh Button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => {
            setLoading(true)
            fetchMembers()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all font-bold text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {members.map((member) => {
        // Handle null profiles gracefully
        const email = member.profiles?.email || 'Unknown'
        const fullName = (member.profiles?.full_name && member.profiles.full_name !== 'Unknown' && member.profiles.full_name.trim() !== '')
          ? member.profiles.full_name
          : email.split('@')[0]
        const avatarUrl = member.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${email}`

        // Debug log
        console.log('Member render:', {
          email,
          dbFullName: member.profiles?.full_name,
          displayFullName: fullName,
          role: member.role
        })

        return (
          <div
            key={member.id}
            className="border-2 border-black p-4 flex items-center gap-4 shadow-neo-sm bg-white relative group"
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

            <div className="flex-1">
              <div className="font-black uppercase text-base">
                {fullName}
              </div>
              <div className="text-xs text-gray-500 mb-1">
                {email}
              </div>
            <div className="flex items-center gap-2">
              {getRoleBadge(member.role)}
              {member.user_id === currentUserId && (
                <span className="text-xs text-gray-500">(You)</span>
              )}
            </div>
          </div>

          {/* Remove button - only show for admins and not for current user */}
          {['owner', 'admin'].includes(userRole) &&
            member.user_id !== currentUserId &&
            member.role !== 'owner' && (
              <button
                onClick={() => removeMember(member.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1.5 bg-red-100 hover:bg-red-200 rounded border border-red-300 text-red-600"
                title="Remove member"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
        </div>
        )
      })}
      </div>
    </div>
  )
}
