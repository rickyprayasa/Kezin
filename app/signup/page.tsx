'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, UserPlus, Loader2, User, Users } from 'lucide-react'
import { AppLogo } from '@/components/NeoUI'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)

  // Fetch invitation details if invite token exists
  useEffect(() => {
    if (inviteToken) {
      fetchInvitation()
    }
  }, [inviteToken])

  const fetchInvitation = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('invitations')
      .select(`
        *,
        organizations(name),
        inviter:profiles!invited_by(full_name, email)
      `)
      .eq('token', inviteToken)
      .eq('status', 'pending')
      .single()

    if (data) {
      setInvitation(data)
      setEmail(data.email) // Pre-fill email from invitation
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If user has invitation, accept it automatically after signup
    if (inviteToken && data.user) {
      try {
        await fetch('/api/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: inviteToken })
        })
      } catch (err) {
        console.error('Failed to accept invitation:', err)
      }
    }

    setSuccess(true)
    setLoading(false)

    // Auto redirect after 2 seconds
    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 2000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white border-2 border-black rounded-2xl shadow-neo p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-black mb-2">Pendaftaran Berhasil!</h1>
            <p className="text-gray-600 mb-4">
              Akun Anda telah dibuat. Anda akan dialihkan ke dashboard...
            </p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 right-20 w-32 h-32 bg-brand-blue rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-brand-yellow rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-brand-orange rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-block">
            <AppLogo size="lg" />
          </Link>
          <p className="text-gray-600 mt-2">Buat akun baru</p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-neo p-8">
          {invitation ? (
            <>
              <div className="text-center mb-6">
                <Users className="w-12 h-12 text-brand-orange mx-auto mb-3" />
                <h1 className="text-2xl font-black mb-2">Bergabung dengan Tim</h1>
                <p className="text-gray-600 text-sm">Anda diundang oleh <span className="font-bold text-brand-orange">{invitation.inviter?.full_name || invitation.inviter?.email}</span></p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-600 mb-1">Organization</p>
                <p className="text-lg font-bold text-gray-800">{invitation.organizations?.name}</p>
                <p className="text-xs text-gray-600 mt-2">Role: <span className="font-bold capitalize text-brand-orange">{invitation.role}</span></p>
              </div>
            </>
          ) : (
            <h1 className="text-2xl font-black mb-6 text-center">Daftar</h1>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold mb-2">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  disabled={!!invitation} // Disable if invited
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold mb-2">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500">
              Dengan mendaftar, Anda menyetujui{' '}
              <Link href="/terms" className="text-brand-orange hover:underline">
                Syarat & Ketentuan
              </Link>{' '}
              dan{' '}
              <Link href="/privacy" className="text-brand-orange hover:underline">
                Kebijakan Privasi
              </Link>{' '}
              kami.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl border-2 border-black shadow-neo-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Daftar
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-gray-500 text-sm">atau</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Login Link */}
          <p className="text-center text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-brand-orange font-bold hover:underline">
              Masuk
            </Link>
          </p>

          {/* Back to Landing */}
          {!invitation && (
            <div className="mt-4">
              <Link
                href="/landing"
                className="block w-full text-center py-2 text-gray-600 hover:text-brand-orange font-medium transition-colors"
              >
                ← Kembali ke Halaman Utama
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          &copy; 2024 SAVERY. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
