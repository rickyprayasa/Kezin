# Troubleshooting Guide - SAVERY

## Error: "Database error querying schema"

### Problem
Saat mencoba login, muncul error merah: **"Database error querying schema"**

### Root Cause
Error ini biasanya disebabkan oleh salah satu dari berikut:
1. Trigger `handle_new_user()` gagal dijalankan saat user pertama kali dibuat
2. User sudah ada di `auth.users` tapi belum ada di tabel `profiles`
3. Profile sudah ada tapi belum memiliki `default_organization_id`
4. Database schema memiliki masalah dengan Row Level Security (RLS) policies

### Solution

#### Opsi 1: Run SQL Fix Script (RECOMMENDED)

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**
5. Copy paste isi file `supabase/fix-auth-error.sql`
6. Klik **Run** atau tekan `Ctrl+Enter`
7. Tunggu sampai selesai (akan muncul "Success. No rows returned")
8. Tunggu 5-10 detik untuk perubahan propagate
9. Refresh halaman login dan coba login lagi

#### Opsi 2: Restart Supabase Project

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Klik **Settings** di sidebar
4. Klik **General**
5. Scroll ke bawah, klik **Pause project**
6. Tunggu sampai project paused
7. Klik **Restore project**
8. Tunggu 1-2 menit untuk project ready
9. Coba login lagi

#### Opsi 3: Reset Database (DESTRUCTIVE - Semua data hilang!)

⚠️ **WARNING**: Ini akan menghapus SEMUA data di database!

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Klik **Settings** > **Database**
4. Scroll ke bawah, klik **Reset Database**
5. Konfirmasi dengan mengetik nama project
6. Tunggu reset selesai
7. Run migration ulang dengan file `supabase/schema.sql`
8. Buat user baru dengan sign up

### Verification

Setelah fix, jalankan script ini untuk verifikasi:

```bash
node scripts/debug-login.js
```

Jika masih gagal, cek:

1. **Supabase Logs**:
   - Dashboard > Logs > Auth Logs
   - Lihat error detail di sana

2. **Database Tables**:
   - Dashboard > Table Editor
   - Pastikan tabel `profiles`, `organizations`, `organization_members` ada
   - Pastikan ada data di tabel tersebut untuk user Anda

3. **Auth Users**:
   - Dashboard > Authentication > Users
   - Pastikan user Anda ada di list
   - Jika tidak ada, sign up ulang

### Prevention

Untuk mencegah error ini di masa depan:

1. Selalu test trigger `handle_new_user()` setelah deploy
2. Tambahkan proper error handling di trigger
3. Monitor Supabase logs secara berkala
4. Jangan manual delete data dari `auth.users` tanpa delete dari `profiles` juga

---

## Error: "Email not confirmed"

### Solution
1. Buka Supabase Dashboard > Authentication > Users
2. Klik user yang bermasalah
3. Klik **Confirm Email** di sebelah kanan

---

## Error: "Invalid login credentials"

### Solution
1. Pastikan email dan password benar
2. Jika lupa password, klik **Lupa password?**
3. Atau reset password di Dashboard > Authentication > Users > (pilih user) > Reset Password

---

## Development Tools

### Debug Login
```bash
node scripts/debug-login.js
```

### Diagnose Auth Issues
```bash
node scripts/diagnose-auth.mjs
```

### Fix Database
```bash
node scripts/fix-database.mjs
```

---

## Supabase Project Info

- **Project URL**: https://tpkzeewyrzlepmpalyca.supabase.co
- **Project ID**: tpkzeewyrzlepmpalyca
- **Region**: Singapore (SIN)

---

## Contact Support

Jika masalah tetap berlanjut:
1. Check [Supabase Status](https://status.supabase.com)
2. Search di [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Post di [Supabase Discord](https://discord.supabase.com)
