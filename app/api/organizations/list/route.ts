import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get all organizations the user belongs to
        const { data: memberships, error: membershipsError } = await supabase
            .from('organization_members')
            .select(`
        id,
        role,
        organization_id,
        accepted_at,
        organizations (
          id,
          name,
          slug,
          logo_url,
          plan,
          created_at
        )
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (membershipsError) {
            console.error('Error fetching organizations:', membershipsError)
            return NextResponse.json({ error: membershipsError.message }, { status: 500 })
        }

        // Transform the data to flatten organization details
        const organizations = memberships?.map(membership => ({
            membershipId: membership.id,
            role: membership.role,
            acceptedAt: membership.accepted_at,
            ...membership.organizations
        })) || []

        return NextResponse.json({ organizations })
    } catch (error: any) {
        console.error('Error in list organizations:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
