import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { email, organizationId, role = 'member' } = await request.json()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is member of the organization (any role can invite in SaaS model)
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    // Debug logging
    console.log('Organization check:', {
      organizationId,
      userId: user.id,
      member,
      memberError: memberError?.message
    })

    if (memberError || !member) {
      return NextResponse.json({
        error: 'You are not a member of this organization',
        details: memberError?.message,
        organizationId,
        userId: user.id
      }, { status: 403 })
    }

    // In SaaS model, owner can invite. For stricter control, uncomment below:
    // if (!['owner', 'admin'].includes(member.role)) {
    //   return NextResponse.json({
    //     error: 'Only owners and admins can invite members',
    //     currentRole: member.role
    //   }, { status: 403 })
    // }

    // Check if email is already invited or is a member
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json({ error: 'User already has a pending invitation' }, { status: 400 })
    }

    // Check if user with this email already exists in organization (via profiles)
    const { data: existingMemberProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingMemberProfile) {
      // Check if they're already a member
      const { data: memberCheck } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', existingMemberProfile.id)
        .single()

      if (memberCheck) {
        return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 400 })
      }
    }

    // Generate invitation token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email,
        organization_id: organizationId,
        invited_by: user.id,
        role,
        token,
        status: 'pending'
      })
      .select()
      .single()

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    // TODO: Send email with invitation link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

    return NextResponse.json({
      success: true,
      invitation,
      inviteLink
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
