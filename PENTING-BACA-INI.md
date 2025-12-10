# 🚨 PENTING - BACA INI UNTUK FIX LOGIN ERROR

## ⚠️ Masalah Saat Ini

Error **"Database error querying schema"** terjadi karena:
- Database auth schema rusak/corrupt
- User tidak bisa diakses via API
- **HARUS diperbaiki manual via Supabase Dashboard**

---

## ✅ SOLUSI - IKUTI LANGKAH INI DENGAN TELITI

### 📌 LANGKAH 1: Buka Supabase SQL Editor

**Klik link ini** (akan otomatis buka SQL Editor):

👉 **https://app.supabase.com/project/tpkzeewyrzlepmpalyca/sql/new**

Login jika diminta.

---

### 📌 LANGKAH 2: Copy SQL Fix

Ada 2 cara copy SQL:

#### **Cara A - Dari File (RECOMMENDED)**
1. Buka VSCode
2. Buka file: `supabase/fix-auth-error.sql`
3. Tekan `Ctrl+A` (select all)
4. Tekan `Ctrl+C` (copy)

#### **Cara B - Dari Terminal**
Jalankan command ini di terminal:
```bash
cat supabase/fix-auth-error.sql
```
Lalu copy semua output.

---

### 📌 LANGKAH 3: Paste dan Run

Di Supabase SQL Editor yang terbuka:

1. **Paste** SQL yang sudah di-copy (`Ctrl+V`)
2. Pastikan semua SQL sudah ter-paste (scroll ke bawah untuk cek)
3. **Klik tombol "RUN"** (warna hijau di pojok kanan atas)
   - ATAU tekan `Ctrl+Enter`

---

### 📌 LANGKAH 4: Tunggu dan Verifikasi

Setelah klik RUN:

1. **Tunggu 5-10 detik** hingga selesai
2. Akan muncul hasil di bawah:
   - Beberapa baris "Success"
   - Di bagian paling bawah ada 2 angka:
     ```
     users_without_profiles: 0
     profiles_without_orgs: 0
     ```

**Jika keduanya 0 = FIX BERHASIL!** ✅

---

### 📌 LANGKAH 5: Test Login

Setelah SQL berhasil:

1. **Tunggu 10 detik** (untuk database sync)
2. **Refresh browser** di halaman login (`F5`)
3. **Login** dengan:
   - Email: `ricky.yusar@rsquareidea.my.id`
   - Password: `test123` (atau password yang Anda gunakan)

**Seharusnya BERHASIL LOGIN!** 🎉

---

## 🔄 JIKA MASIH GAGAL

### Solusi 1: Restart Supabase Project

1. Buka: https://app.supabase.com/project/tpkzeewyrzlepmpalyca/settings/general
2. Scroll ke bawah
3. Klik **"Pause project"**
4. Tunggu 1 menit hingga paused
5. Klik **"Restore project"**
6. Tunggu 2-3 menit
7. Coba login lagi

### Solusi 2: Reset Password User

1. Buka: https://app.supabase.com/project/tpkzeewyrzlepmpalyca/auth/users
2. Cari user `ricky.yusar@rsquareidea.my.id`
3. Klik user tersebut
4. Klik **"Send password recovery"**
5. Check email untuk reset password
6. Set password baru
7. Login dengan password baru

### Solusi 3: Delete & Recreate User

**⚠️ WARNING: Ini akan hapus user lama!**

1. Buka: https://app.supabase.com/project/tpkzeewyrzlepmpalyca/auth/users
2. Cari user `ricky.yusar@rsquareidea.my.id`
3. Klik user → Delete user
4. Confirm delete
5. Pergi ke halaman signup: http://localhost:3000/signup
6. Sign up dengan email yang sama
7. Login

---

## 📞 Butuh Bantuan?

Jika masih gagal setelah ikuti semua langkah:

1. **Screenshot** error yang muncul
2. **Screenshot** hasil dari SQL Editor (setelah run SQL)
3. Share screenshot tersebut

---

## 📝 Checklist

Centang setiap langkah yang sudah dilakukan:

- [ ] Buka Supabase SQL Editor
- [ ] Copy SQL dari file `supabase/fix-auth-error.sql`
- [ ] Paste di SQL Editor
- [ ] Klik RUN
- [ ] Tunggu hasil (users_without_profiles: 0 dan profiles_without_orgs: 0)
- [ ] Tunggu 10 detik
- [ ] Refresh browser
- [ ] Test login

Jika semua sudah ✅, login seharusnya berhasil!

---

**Update**: 2024
**Priority**: URGENT 🚨
**Estimasi Waktu**: 5-10 menit
