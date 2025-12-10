import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { organizationId } = await request.json()

        if (!organizationId) {
            return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
        }

        // Get user's membership
        const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('id, role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single()

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'You are not a member of this organization' }, { status: 404 })
        }

        // Prevent owner from leaving if they're the only owner
        if (membership.role === 'owner') {
            const { data: owners, error: ownersError } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('role', 'owner')

            if (!ownersError && owners && owners.length === 1) {
                return NextResponse.json({
                    error: 'Tidak bisa keluar. Anda adalah satu-satunya owner. Transfer ownership dulu atau hapus organisasi.'
                }, { status: 400 })
            }
        }

        // Check if user has other organizations
        const { data: otherMemberships, error: otherError } = await supabase
            .from('organization_members')
            .select('id, organization_id')
            .eq('user_id', user.id)
            .neq('organization_id', organizationId)

        if (otherError) {
            console.error('Error checking other memberships:', otherError)
            return NextResponse.json({ error: otherError.message }, { status: 500 })
        }

        if (!otherMemberships || otherMemberships.length === 0) {
            return NextResponse.json({
                error: 'Tidak bisa keluar. Anda harus punya minimal 1 organisasi. Buat workspace baru dulu sebelum keluar.'
            }, { status: 400 })
        }

        // Remove user from organization
        const { error: deleteError } = await supabase
            .from('organization_members')
            .delete()
            .eq('id', membership.id)

        if (deleteError) {
            console.error('Error leaving organization:', deleteError)
            return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        // If this was user's default organization, switch to another one
        const { data: profile } = await supabase
            .from('profiles')
            .select('default_organization_id')
            .eq('id', user.id)
            .single()

        if (profile?.default_organization_id === organizationId) {
            // Switch to the first available organization
            const newDefaultOrgId = otherMemberships[0].organization_id

            await supabase
                .from('profiles')
                .update({
                    default_organization_id: newDefaultOrgId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
        }

        return NextResponse.json({
            success: true,
            message: 'Berhasil keluar dari organisasi'
        })
    } catch (error: any) {
        console.error('Error leaving organization:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
