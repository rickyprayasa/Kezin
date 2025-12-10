# 🔧 Cara Memperbaiki Error Login

## Error yang Muncul
```
Database error querying schema
```

## 📋 Langkah Perbaikan (Mudah!)

### STEP 1: Buka Supabase Dashboard

1. Buka browser, pergi ke: [https://app.supabase.com](https://app.supabase.com)
2. Login dengan akun Supabase Anda
3. Pilih project **SAVERY** (atau yang sesuai dengan project Anda)

### STEP 2: Jalankan SQL Fix

1. Di sidebar kiri, klik **📝 SQL Editor**
2. Klik tombol **➕ New Query**
3. Buka file `supabase/fix-auth-error.sql` di project ini
4. **Copy semua isi file tersebut**
5. **Paste** di SQL Editor
6. Klik tombol **▶ Run** (atau tekan `Ctrl+Enter`)
7. Tunggu sampai muncul pesan **"Success. No rows returned"**

### STEP 3: Verifikasi Fix

Setelah SQL berhasil dijalankan, Anda akan melihat 2 hasil query di bawah:

- `users_without_profiles: 0` ✅
- `profiles_without_orgs: 0` ✅

Jika keduanya **0**, fix berhasil! 🎉

### STEP 4: Test Login

1. Tunggu **5-10 detik** untuk perubahan propagate
2. Refresh halaman login di browser (`F5`)
3. Coba login dengan email: `ricky.yusar@rsquareidea.my.id`
4. Jika password benar, seharusnya bisa login! ✅

---

## 🧪 Test dari Terminal (Optional)

Jika ingin test dari terminal dulu sebelum coba di browser:

```bash
node scripts/debug-login.js
```

Jika berhasil, akan muncul:
```
Login successful!
User ID: xxx-xxx-xxx
```

---

## ❓ Jika Masih Gagal

### Solusi A: Restart Project

1. Buka Supabase Dashboard
2. Klik **⚙️ Settings** > **General**
3. Scroll ke bawah
4. Klik **Pause project**
5. Tunggu sampai project paused
6. Klik **Restore project**
7. Tunggu 1-2 menit
8. Coba login lagi

### Solusi B: Check Auth Logs

1. Buka Supabase Dashboard
2. Klik **📊 Logs** > **Auth**
3. Lihat error detail di sana
4. Screenshot dan share jika perlu bantuan

### Solusi C: Reset Password User

1. Buka Supabase Dashboard
2. Klik **👥 Authentication** > **Users**
3. Cari user `ricky.yusar@rsquareidea.my.id`
4. Klik user tersebut
5. Klik **Reset Password**
6. Set password baru
7. Coba login dengan password baru

---

## 📚 File-File Penting

- `supabase/fix-auth-error.sql` - SQL script untuk fix database
- `scripts/debug-login.js` - Script untuk test login
- `scripts/diagnose-auth.mjs` - Script untuk diagnose masalah
- `TROUBLESHOOTING.md` - Panduan lengkap troubleshooting

---

## 🎯 Kesimpulan

Masalah **"Database error querying schema"** disebabkan karena:
1. User sudah dibuat di `auth.users`
2. Tapi belum ada profile/organization yang terkait
3. Trigger `handle_new_user()` gagal dijalankan saat user pertama kali dibuat

**Fix yang sudah dibuat**:
1. ✅ Recreate trigger dengan error handling lebih baik
2. ✅ Fix semua user existing yang belum punya profile
3. ✅ Fix semua profile yang belum punya organization
4. ✅ Tambahkan proper error logging

Setelah run SQL fix, masalah seharusnya sudah teratasi! 🎉

---

## 💡 Tips

- Selalu backup database sebelum run SQL yang memodifikasi data
- Monitor auth logs secara berkala untuk detect masalah lebih awal
- Jangan manual delete user dari dashboard tanpa understanding konsekuensinya

---

**Dibuat oleh**: Claude Code Assistant
**Tanggal**: 2024
