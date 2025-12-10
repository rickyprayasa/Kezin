# SAVERY Database Setup

## Quick Setup via SQL Editor (Recommended)

1. **Buka Supabase SQL Editor:**
   
   https://supabase.com/dashboard/project/tpkzeewyrzlepmpalyca/sql/new

2. **Copy semua isi dari file `schema.sql`**

3. **Paste ke SQL Editor dan klik "Run"**

4. **Verifikasi tabel sudah dibuat:**
   - Buka Table Editor: https://supabase.com/dashboard/project/tpkzeewyrzlepmpalyca/editor
   - Pastikan tabel berikut ada:
     - organizations
     - profiles
     - organization_members
     - assets
     - categories
     - transactions
     - transaction_history
     - savings_goals
     - savings_contributions
     - debts
     - debt_payments
     - budgets
     - bill_tasks
     - ai_conversations

## Alternative: Via Supabase CLI

```bash
# 1. Login ke Supabase
npx supabase login

# 2. Link project
npx supabase link --project-ref tpkzeewyrzlepmpalyca

# 3. Push migrations
npx supabase db push
```

## Database Schema Overview

### Multi-Tenant Architecture

```
organizations (tenant/workspace)
    ├── organization_members (users dalam org)
    ├── assets (bank accounts, wallets)
    ├── categories (income/expense categories)
    ├── transactions
    │   └── transaction_history (audit log)
    ├── savings_goals
    │   └── savings_contributions
    ├── debts
    │   └── debt_payments
    ├── budgets
    ├── bill_tasks (kanban)
    └── ai_conversations
```

### Subscription Plans

| Plan | Price | Max Members | Savings Goals | AI Requests |
|------|-------|-------------|---------------|-------------|
| Free | Rp 0 | 1 | 1 | 0 |
| Pro | Rp 49K/mo | 1 | Unlimited | Unlimited |
| Team | Rp 99K/mo | 5 | Unlimited | Unlimited |

### Row Level Security (RLS)

Semua tabel dilindungi dengan RLS policies:
- Users hanya bisa akses data dalam organization mereka
- Admin/Owner punya akses lebih untuk manage members
- Audit trail untuk semua perubahan transaksi

### Auto-Features

1. **On User Signup:**
   - Auto-create profile
   - Auto-create personal organization
   - Auto-create default categories

2. **On Transaction:**
   - Auto-update asset balance
   - Auto-log to transaction_history

## Environment Variables

Pastikan `.env.local` berisi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tpkzeewyrzlepmpalyca.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key
```

## Testing Auth Flow

1. Register user baru di app
2. Check di Supabase:
   - `auth.users` - user baru ada
   - `profiles` - profile auto-created
   - `organizations` - workspace auto-created
   - `organization_members` - user as owner
   - `categories` - default categories created
