# Setup Invitation System

## Langkah-langkah Setup

### 1. Jalankan SQL Migrations di Supabase Dashboard

Buka Supabase Dashboard → SQL Editor, lalu jalankan file-file berikut **secara berurutan**:

#### Step 1: Buat tabel invitations
```bash
File: supabase/add-invitation-system.sql
```
Copy seluruh isi file ini dan paste ke SQL Editor, lalu klik "Run"

#### Step 2: Update signup trigger
```bash
File: supabase/modify-signup-for-invitations.sql
```
Copy seluruh isi file ini dan paste ke SQL Editor, lalu klik "Run"

### 2. Cara Kerja Sistem Invitation

#### Untuk Owner/Admin (Yang Mengundang):
1. Masuk ke Settings → Tab "TEAM"
2. Klik tombol "Undang Teman"
3. Masukkan email dan pilih role (member/admin)
4. Klik "Kirim Undangan"
5. Copy invitation link dan kirim ke user yang diundang

#### Untuk User yang Diundang:
1. Klik invitation link yang diterima
2. Jika belum punya akun:
   - Akan diarahkan ke halaman signup
   - Setelah signup berhasil, TIDAK akan membuat organization baru
   - Otomatis join organization yang mengundang
3. Jika sudah login:
   - Email harus sama dengan email yang diundang
   - Klik "Accept Invitation"
   - Langsung join organization

### 3. Fitur-fitur yang Tersedia

#### Component: InviteMemberForm
- Dialog untuk mengundang member baru
- Input email dan role selection
- Tampilkan invitation link yang bisa di-copy

#### Component: TeamMembersList
- Tampilkan semua member di organization
- Badge role (owner/admin/member)
- Hapus member (hanya untuk admin/owner, tidak bisa hapus owner)

#### Component: PendingInvitationsList
- Tampilkan daftar undangan (pending/accepted/expired)
- Copy invitation link
- Cancel invitation (hanya pending)
- Status badge dengan countdown expiry

### 4. Database Tables

**invitations**
- `id` - UUID primary key
- `email` - Email user yang diundang
- `organization_id` - Organization yang mengundang
- `invited_by` - User ID yang mengirim undangan
- `role` - Role yang akan diberikan (member/admin)
- `token` - Unique token untuk invitation link
- `status` - Status undangan (pending/accepted/expired)
- `expires_at` - Tanggal expiry (default 7 hari)
- `created_at` - Tanggal dibuat
- `accepted_at` - Tanggal diterima

### 5. API Endpoints

**POST /api/invitations/send**
- Kirim invitation
- Body: `{ email, organizationId, role }`
- Return: invitation object + inviteLink

**POST /api/invitations/accept**
- Terima invitation
- Body: `{ token }`
- Return: success + organization info

### 6. Security

- RLS policies sudah diatur untuk:
  - Hanya admin/owner bisa create invitation
  - Hanya user dengan email yang sesuai bisa accept
  - Invitation expired otomatis setelah 7 hari
  - Tidak bisa accept invitation untuk email yang berbeda

### 7. Testing Flow

1. Login sebagai owner/admin
2. Buka Settings → TEAM
3. Klik "Undang Teman"
4. Masukkan email dummy (misalnya: test@example.com)
5. Copy invitation link
6. Buka browser baru (incognito mode)
7. Paste invitation link
8. Signup dengan email yang sama (test@example.com)
9. Verifikasi bahwa user TIDAK mendapat organization baru
10. Verifikasi bahwa user bisa lihat data organization yang mengundang
