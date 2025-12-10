import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Must be logged in to accept invitation' }, { status: 401 })
    }

    // Get invitation using admin client to bypass RLS
    const adminClient = createAdminClient()
    
    const { data: invitation, error: inviteError } = await adminClient
      .from('invitations')
      .select('*, organizations(*)')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invitation) {
      console.error('Invitation fetch error:', inviteError)
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    // Check if invitation expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // Check if email matches
    if (invitation.email !== user.email) {
      return NextResponse.json({ error: 'This invitation is for a different email' }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingMember } = await adminClient
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // Already a member, just mark invitation as accepted
      await adminClient
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      return NextResponse.json({
        success: true,
        message: 'Already a member',
        organization: invitation.organizations
      })
    }

    // Add user to organization using ADMIN CLIENT to bypass RLS
    const { error: memberError } = await adminClient
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString()
      })

    if (memberError) {
      console.error('Member insert error:', memberError)
      return NextResponse.json({ error: `Failed to add member: ${memberError.message}` }, { status: 500 })
    }

    // Update profile default organization if not set
    const { data: profile } = await adminClient
      .from('profiles')
      .select('default_organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.default_organization_id) {
      await adminClient
        .from('profiles')
        .update({ default_organization_id: invitation.organization_id })
        .eq('id', user.id)
    }

    // Mark invitation as accepted
    await adminClient
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    console.log('Successfully added user to organization:', {
      userId: user.id,
      organizationId: invitation.organization_id,
      role: invitation.role
    })

    return NextResponse.json({
      success: true,
      organization: invitation.organizations
    })

  } catch (error: any) {
    console.error('Accept invitation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
