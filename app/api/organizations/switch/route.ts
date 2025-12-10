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

        // Verify user is a member of this organization
        const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('id, role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single()

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'You are not a member of this organization' }, { status: 403 })
        }

        // Update user's default organization
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                default_organization_id: organizationId,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error updating default organization:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            organizationId,
            role: membership.role
        })
    } catch (error: any) {
        console.error('Error switching organization:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
