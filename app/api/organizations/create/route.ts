import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Generate slug from organization name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
        .substring(0, 50)          // Limit length
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, logoUrl } = await request.json()

        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
        }

        // Generate slug
        let slug = generateSlug(name)

        // Check if slug exists, add random suffix if needed
        const { data: existingOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single()

        if (existingOrg) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`
        }

        // Create organization
        const { data: organization, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: name.trim(),
                slug,
                logo_url: logoUrl || null,
                plan: 'free',
                subscription_status: 'trial',
                max_members: 5,
                max_savings_goals: 3,
                ai_requests_remaining: 50
            })
            .select()
            .single()

        if (orgError) {
            console.error('Error creating organization:', orgError)
            return NextResponse.json({ error: orgError.message }, { status: 500 })
        }

        // Add creator as owner
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: organization.id,
                user_id: user.id,
                role: 'owner',
                accepted_at: new Date().toISOString()
            })

        if (memberError) {
            console.error('Error adding owner to organization:', memberError)
            // Rollback: delete the organization
            await supabase.from('organizations').delete().eq('id', organization.id)
            return NextResponse.json({ error: memberError.message }, { status: 500 })
        }

        // Create default assets for the organization
        const defaultAssets = [
            { name: 'Kas', type: 'CASH', icon: '💵', color: 'bg-green-500' },
            { name: 'Bank', type: 'CASH', icon: '🏦', color: 'bg-blue-500' }
        ]

        const { error: assetsError } = await supabase
            .from('assets')
            .insert(
                defaultAssets.map(asset => ({
                    organization_id: organization.id,
                    name: asset.name,
                    type: asset.type,
                    balance: 0,
                    icon: asset.icon,
                    color: asset.color,
                    created_by: user.id
                }))
            )

        if (assetsError) {
            console.error('Error creating default assets:', assetsError)
            // Don't fail the request, just log the error
        }

        // Create default categories
        const defaultCategories = [
            // Expense categories
            { name: 'Makanan & Minuman', type: 'EXPENSE', icon: '🍔', color: 'bg-red-400' },
            { name: 'Transportasi', type: 'EXPENSE', icon: '🚗', color: 'bg-orange-400' },
            { name: 'Belanja', type: 'EXPENSE', icon: '🛒', color: 'bg-pink-400' },
            { name: 'Tagihan', type: 'EXPENSE', icon: '📄', color: 'bg-purple-400' },
            { name: 'Hiburan', type: 'EXPENSE', icon: '🎮', color: 'bg-blue-400' },
            // Income categories
            { name: 'Gaji', type: 'INCOME', icon: '💰', color: 'bg-green-400' },
            { name: 'Bonus', type: 'INCOME', icon: '🎁', color: 'bg-emerald-400' },
            { name: 'Investasi', type: 'INCOME', icon: '📈', color: 'bg-teal-400' }
        ]

        const { error: categoriesError } = await supabase
            .from('categories')
            .insert(
                defaultCategories.map(category => ({
                    organization_id: organization.id,
                    name: category.name,
                    type: category.type,
                    icon: category.icon,
                    color: category.color,
                    is_default: true
                }))
            )

        if (categoriesError) {
            console.error('Error creating default categories:', categoriesError)
            // Don't fail the request, just log the error
        }

        // Update user's default organization
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                default_organization_id: organization.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error updating user profile:', updateError)
            // Don't fail the request, organization is already created
        }

        return NextResponse.json({
            success: true,
            organization: {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                role: 'owner'
            }
        })
    } catch (error: any) {
        console.error('Error creating organization:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
