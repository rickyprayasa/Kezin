'use client'

import { useState } from 'react'
import { NeoButton, NeoInput, NeoSelect, NeoDialog } from './NeoUI'
import { UserPlus, Copy, CheckCircle2, Mail } from 'lucide-react'

interface InviteMemberFormProps {
  organizationId: string
  onSuccess: () => void
  isOpen: boolean
  onClose: () => void
}

export const InviteMemberForm: React.FC<InviteMemberFormProps> = ({
  organizationId,
  onSuccess,
  isOpen,
  onClose
}) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          organizationId,
          role
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed error message
        let errorMsg = data.error || 'Failed to send invitation'
        if (data.details) {
          errorMsg += ` (${data.details})`
        }
        if (data.currentRole) {
          errorMsg += ` - Current role: ${data.currentRole}`
        }
        setError(errorMsg)
        console.error('Invitation error:', data)
        return
      }

      setInviteLink(data.inviteLink)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setEmail('')
    setRole('member')
    setInviteLink('')
    setError('')
    setCopied(false)
    onClose()
  }

  return (
    <NeoDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Undang Anggota Tim"
    >
      {!inviteLink ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-sm uppercase flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <NeoInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@email.com"
              required
            />
            <p className="text-xs text-gray-500">
              Orang ini akan menerima invitation link via email
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-sm uppercase">Role</label>
            <NeoSelect
              value={role}
              onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </NeoSelect>
            <p className="text-xs text-gray-500">
              Member: Akses terbatas | Admin: Akses penuh
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <NeoButton
              type="submit"
              className="w-full"
              icon={<UserPlus />}
              disabled={loading}
            >
              {loading ? 'Mengirim...' : 'Kirim Undangan'}
            </NeoButton>
            <NeoButton
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Batal
            </NeoButton>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="font-black text-xl mb-2">Undangan Terkirim!</h3>
            <p className="text-gray-600">
              Link undangan telah dibuat untuk <span className="font-bold">{email}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-sm uppercase">Invitation Link</label>
            <div className="flex gap-2">
              <NeoInput
                value={inviteLink}
                readOnly
                className="flex-1 text-sm"
              />
              <NeoButton
                onClick={copyToClipboard}
                icon={copied ? <CheckCircle2 /> : <Copy />}
                className="whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy'}
              </NeoButton>
            </div>
            <p className="text-xs text-gray-500">
              Share link ini ke {email} untuk join team
            </p>
          </div>

          <div className="bg-brand-cream border-2 border-black rounded-xl p-4">
            <p className="text-sm font-bold mb-2">📝 Catatan:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Link berlaku selama 7 hari</li>
              <li>• Hanya bisa digunakan sekali</li>
              <li>• Email harus match saat signup/login</li>
            </ul>
          </div>

          <NeoButton
            onClick={handleClose}
            className="w-full"
          >
            Selesai
          </NeoButton>
        </div>
      )}
    </NeoDialog>
  )
}
