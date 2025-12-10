'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NeoCard, NeoButton } from './NeoUI'
import { Mail, Copy, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react'

interface PendingInvitationsListProps {
  organizationId: string
  onUpdate?: () => void
}

interface Invitation {
  id: string
  email: string
  role: string
  token: string
  status: string
  expires_at: string
  created_at: string
}

export const PendingInvitationsList: React.FC<PendingInvitationsListProps> = ({
  organizationId,
  onUpdate
}) => {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchInvitations()
  }, [organizationId])

  const fetchInvitations = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setInvitations(data)
    }

    setLoading(false)
  }

  const copyLink = (token: string, id: string) => {
    const link = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const cancelInvitation = async (id: string) => {
    if (!confirm('Yakin ingin membatalkan undangan ini?')) return

    const supabase = createClient()

    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Gagal membatalkan: ' + error.message)
      return
    }

    fetchInvitations()
    onUpdate?.()
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date()

    if (status === 'accepted') {
      return (
        <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-green-100 text-green-700 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Accepted
        </span>
      )
    }

    if (isExpired || status === 'expired') {
      return (
        <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-red-100 text-red-700 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Expired
        </span>
      )
    }

    return (
      <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-yellow-100 text-yellow-700 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    )
  }

  const getDaysLeft = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (days < 0) return 'Expired'
    if (days === 0) return 'Today'
    if (days === 1) return '1 day left'
    return `${days} days left`
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-bold">Belum ada undangan</p>
        <p className="text-sm">Klik "Undang Teman" untuk menambahkan member baru</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation) => {
        const isExpired = new Date(invitation.expires_at) < new Date()
        const isPending = invitation.status === 'pending' && !isExpired

        return (
          <div
            key={invitation.id}
            className="border-2 border-black p-4 shadow-neo-sm bg-white"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="font-bold">{invitation.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="uppercase font-bold">Role: {invitation.role}</span>
                  <span>•</span>
                  <span>{getDaysLeft(invitation.expires_at)}</span>
                </div>
              </div>
              {getStatusBadge(invitation.status, invitation.expires_at)}
            </div>

            {isPending && (
              <div className="flex gap-2">
                <NeoButton
                  onClick={() => copyLink(invitation.token, invitation.id)}
                  icon={copiedId === invitation.id ? <CheckCircle2 /> : <Copy />}
                  className="flex-1 text-sm py-2"
                  variant="secondary"
                >
                  {copiedId === invitation.id ? 'Copied!' : 'Copy Link'}
                </NeoButton>
                <button
                  onClick={() => cancelInvitation(invitation.id)}
                  className="px-3 py-2 border-2 border-black rounded-xl shadow-neo-sm hover:bg-red-50 transition-colors text-red-600"
                  title="Cancel invitation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {invitation.status === 'accepted' && (
              <div className="text-xs text-gray-500 mt-2">
                ✅ Accepted on {new Date(invitation.created_at).toLocaleDateString('id-ID')}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
