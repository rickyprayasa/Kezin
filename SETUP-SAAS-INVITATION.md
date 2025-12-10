# Setup SaaS Invitation System - SAVERY

## 🎯 Konsep SaaS

Aplikasi SAVERY adalah **SaaS (Software as a Service)** di mana:
- ✅ Setiap user yang signup OTOMATIS mendapat organization sendiri sebagai **owner**
- ✅ Owner bisa invite member ke organization mereka
- ✅ User yang di-invite TIDAK mendapat organization baru
- ✅ User yang di-invite langsung join ke organization yang mengundang

## 📋 Langkah Setup (PENTING!)

### Step 1: Jalankan SQL Fix untuk Existing Users

Buka **Supabase Dashboard → SQL Editor**, jalankan file ini:

```bash
File: supabase/fix-all-users-as-owners.sql
```

**Fungsi**: Memastikan semua existing users menjadi owner dari organization mereka.

### Step 2: Verifikasi User Roles

Jalankan query ini untuk memverifikasi:

```sql
SELECT
    u.email,
    o.name as organization_name,
    om.role,
    CASE
        WHEN om.role = 'owner' THEN '✅ Owner'
        WHEN om.role = 'admin' THEN '⚠️ Admin'
        ELSE '❌ Member'
    END as status
FROM organization_members om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
ORDER BY u.email;
```

**Expected Result**: Semua user yang punya organization sendiri harus role = 'owner' ✅

### Step 3: Test Invitation Flow

1. **Login sebagai user pertama** (misalnya: ricky.yusar@gmail.com)
2. **Buka Settings → Tab TIM**
3. **Klik "Undang Teman"**
4. **Masukkan email teman** (misalnya: friend@example.com)
5. **Copy invitation link**
6. **Buka browser baru (incognito)**
7. **Paste invitation link**
8. **Signup dengan email yang sama** (friend@example.com)
9. **Verifikasi**:
   - ✅ User baru TIDAK punya organization sendiri
   - ✅ User baru langsung masuk ke organization ricky.yusar@gmail.com
   - ✅ User baru bisa lihat data organization ricky

## 🔧 Troubleshooting

### Error: "Not authorized to invite members"

**Penyebab**: User belum tercatat sebagai owner di organization_members table

**Solusi**:
1. Jalankan `supabase/fix-all-users-as-owners.sql`
2. Logout dan login lagi
3. Coba invite lagi

### Error: "You are not a member of this organization"

**Penyebab**: organizationId kosong atau tidak valid

**Solusi**:
1. Cek browser console (F12)
2. Lihat error detail
3. Pastikan profile.default_organization_id terisi

**Debug Query**:
```sql
SELECT id, email, default_organization_id
FROM profiles
WHERE email = 'YOUR_EMAIL_HERE';
```

### Invited User Tetap Mendapat Organization Baru

**Penyebab**: Trigger `handle_new_user_with_invitation` belum dijalankan

**Solusi**:
1. Pastikan sudah run `supabase/modify-signup-for-invitations.sql`
2. Verifikasi trigger:
```sql
SELECT * FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

## 📊 Database Schema

### Tables yang Terlibat:

**1. invitations**
- Menyimpan data undangan
- Token unique untuk invitation link
- Status: pending/accepted/expired
- Expires setelah 7 hari

**2. organization_members**
- Relasi user ke organization
- Role: owner/admin/member
- User yang signup normal = owner
- User yang di-invite = member (atau sesuai invitation.role)

**3. profiles**
- default_organization_id = organization aktif user
- Untuk invited user, ini diset ke organization yang mengundang

## 🎨 UI Components

### InviteMemberForm
- Dialog untuk input email dan role
- Generate invitation link
- Copy to clipboard

### TeamMembersList
- List semua member di organization
- Show role badges
- Remove member (kecuali owner)

### PendingInvitationsList
- List undangan pending/accepted/expired
- Copy invitation link
- Cancel invitation

## 🔐 Security & RLS

- ✅ RLS policies sudah dikonfigurasi
- ✅ User hanya bisa lihat organization mereka sendiri
- ✅ Invitation link expire setelah 7 hari
- ✅ Email must match untuk accept invitation

## 🚀 Production Checklist

- [ ] Run `fix-all-users-as-owners.sql`
- [ ] Verify semua users jadi owner
- [ ] Test signup normal flow (dapat org baru)
- [ ] Test invitation flow (join org existing)
- [ ] Test RLS policies
- [ ] Setup email service untuk kirim invitation link otomatis
- [ ] Monitor invitation acceptance rate

## 📧 Email Integration (TODO)

Saat ini invitation link manual copy-paste. Untuk production:

1. Setup email service (Resend, SendGrid, dll)
2. Update `/api/invitations/send/route.ts` line 65
3. Template email invitation
4. Send invitation link via email otomatis

## 🎉 Success Metrics

Sistem berhasil jika:
- ✅ User baru signup → dapat organization baru sebagai owner
- ✅ Owner invite member → member join tanpa organization baru
- ✅ Member bisa lihat data organization owner
- ✅ Invitation link expire setelah 7 hari
- ✅ Tidak ada duplicate organization untuk invited users
