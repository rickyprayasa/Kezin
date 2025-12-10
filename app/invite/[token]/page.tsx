'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, XCircle, Users } from 'lucide-react'
import Link from 'next/link'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [status, setStatus] = useState<'checking' | 'ready' | 'accepting' | 'accepted' | 'error'>('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    checkInvitation()
  }, [token])

  const checkInvitation = async () => {
    const supabase = createClient()

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    // Get invitation details with inviter info
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        organizations(*),
        inviter:profiles!invited_by(full_name, email)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    setLoading(false)

    console.log('Invitation check:', { token, data, error })

    if (error || !data) {
      setStatus('error')
      setError(`Invitation not found or has expired (${error?.message || 'not found'})`)
      console.error('Invitation error:', error)
      return
    }

    // Check if expired
    const expiryDate = new Date(data.expires_at)
    const now = new Date()
    console.log('Expiry check:', { expiryDate, now, isExpired: expiryDate < now })

    if (expiryDate < now) {
      setStatus('error')
      setError(`This invitation expired on ${expiryDate.toLocaleString()}`)
      return
    }

    setInvitation(data)

    // If user is logged in with correct email, ready to accept
    if (user && user.email === data.email) {
      setStatus('ready')
    } else if (user && user.email !== data.email) {
      setStatus('error')
      setError(`This invitation is for ${data.email}, but you're logged in as ${user.email}`)
    } else {
      // Not logged in, show invitation details first
      setStatus('ready')
    }
  }

  const acceptInvitation = async () => {
    setStatus('accepting')

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setError(data.error || 'Failed to accept invitation')
        return
      }

      setStatus('accepted')

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
        <div className="bg-white border-2 border-black rounded-2xl shadow-neo p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-4">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-brand-orange text-white font-bold rounded-xl border-2 border-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
        <div className="bg-white border-2 border-black rounded-2xl shadow-neo p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-4">Welcome to the Team!</h1>
          <p className="text-gray-600 mb-2">You've successfully joined</p>
          <p className="text-xl font-bold text-brand-orange mb-6">{invitation?.organizations?.name}</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === 'accepting') {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-orange mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Accepting invitation...</p>
        </div>
      </div>
    )
  }

  // Ready to accept
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black rounded-2xl shadow-neo p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <Users className="w-16 h-16 text-brand-orange mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">Team Invitation</h1>
          <p className="text-gray-600">You've been invited to join</p>
        </div>

        <div className="bg-brand-cream border-2 border-black rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Invited by</p>
          <p className="text-lg font-bold text-brand-orange mb-3">
            {invitation?.inviter?.full_name || invitation?.inviter?.email}
          </p>

          <div className="border-t-2 border-gray-300 pt-3 mt-3">
            <p className="text-sm text-gray-600 mb-1">Organization</p>
            <p className="text-xl font-bold text-gray-800">{invitation?.organizations?.name}</p>
            <p className="text-sm text-gray-600 mt-2">Your Role: <span className="font-bold capitalize text-brand-orange">{invitation?.role}</span></p>
          </div>
        </div>

        {user ? (
          <>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Logged in as: <span className="font-bold">{user.email}</span>
            </p>

            <button
              onClick={acceptInvitation}
              className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl border-2 border-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all mb-3"
            >
              Accept Invitation
            </button>

            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-white text-gray-700 font-bold rounded-xl border-2 border-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800 text-center">
                <strong>Untuk {invitation?.email}</strong><br/>
                Anda perlu membuat akun atau login untuk menerima undangan ini
              </p>
            </div>

            <button
              onClick={() => router.push(`/signup?invite=${token}`)}
              className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl border-2 border-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all mb-3"
            >
              Buat Akun Baru
            </button>

            <button
              onClick={() => router.push(`/login?redirect=/invite/${token}`)}
              className="w-full py-3 bg-white text-gray-700 font-bold rounded-xl border-2 border-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              Sudah Punya Akun? Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
