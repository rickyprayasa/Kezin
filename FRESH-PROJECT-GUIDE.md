# 🆕 FRESH PROJECT SETUP - Step by Step

## 📋 CHECKLIST (15 menit)

Follow step ini dengan teliti:

---

## STEP 1: Buat Project Baru (3 menit)

Browser sudah terbuka di: https://app.supabase.com/new

### Isi Form:

1. **Organization**: Pilih organization yang ada (atau buat baru)

2. **Project Name**:
   ```
   SAVERY-v2
   ```
   (atau nama lain yang Anda suka)

3. **Database Password**:
   ```
   Buat password KUAT dan SIMPAN!
   ```
   **PENTING**: Password ini untuk database, JANGAN LUPA!

   Contoh: `Savery2024!SecureDB`

4. **Region**:
   ```
   Singapore (Southeast Asia)
   ```
   (sama seperti project lama)

5. **Pricing Plan**:
   ```
   Free
   ```

6. **Klik**: `Create new project`

7. **TUNGGU 2-3 menit** untuk provisioning

---

## STEP 2: Get Credentials (1 menit)

Setelah project ready (status: Active):

1. **Pergi ke**: `Settings` > `API`

2. **Copy credentials** berikut dan **SIMPAN** di notepad:

   ```
   Project URL: https://[PROJECT-ID].supabase.co
   anon/public key: eyJ...
   service_role key: eyJ...
   ```

   **CARA COPY:**
   - Klik icon "Copy" di samping setiap value
   - Paste di notepad untuk sementara

---

## STEP 3: Update .env.local (1 menit)

Kembali ke VSCode:

1. **Buka file**: `.env.local`

2. **Backup old credentials** (optional):
   - Copy isi `.env.local` sekarang
   - Paste ke file baru: `.env.local.backup`

3. **Update credentials** di `.env.local`:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://[PASTE-PROJECT-URL-DISINI]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[PASTE-ANON-KEY-DISINI]
   SUPABASE_SERVICE_ROLE_KEY=[PASTE-SERVICE-ROLE-KEY-DISINI]

   # Database Direct Connection (optional - skip dulu)
   # DATABASE_URL=...

   # Gemini AI API Key (tetap sama)
   GEMINI_API_KEY=AIzaSyBF5tg6qvdgGNUs59dYMBVqjQDLcWc3-wU

   # App Configuration (tetap sama)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_NAME=SAVERY
   ```

4. **Save file** (`Ctrl+S`)

---

## STEP 4: Run Schema SQL (3 menit)

Kembali ke browser Supabase:

1. **Klik**: `SQL Editor` di sidebar

2. **Klik**: `New Query`

3. **Buka VSCode**, buka file: `supabase/schema.sql`

4. **Copy SEMUA isi** file tersebut (`Ctrl+A` lalu `Ctrl+C`)

5. **Kembali ke browser**, paste di SQL Editor (`Ctrl+V`)

6. **Klik**: `Run` (atau tekan `Ctrl+Enter`)

7. **TUNGGU** hingga selesai (30 detik - 1 menit)

8. **Verify**: Akan muncul banyak "Success" messages

---

## STEP 5: Restart Dev Server (1 menit)

Di terminal VSCode:

1. **Stop server** yang sedang running:
   ```bash
   # Tekan Ctrl+C
   ```

2. **Start ulang**:
   ```bash
   npm run dev
   ```

3. **Tunggu** hingga server ready (biasanya beberapa detik)

4. **Lihat output**: Should show `ready started server on [::]:3000`

---

## STEP 6: Test Signup (2 menit)

1. **Buka browser** ke: http://localhost:3000/signup

2. **Sign up** dengan:
   - **Email**: `ricky.yusar@rsquareidea.my.id`
   - **Password**: `test123` (atau password baru)
   - **Full Name**: `Ricky Yusar` (atau nama Anda)

3. **Klik**: `Daftar sekarang`

4. **Tunggu** proses signup

**Expected Result:**
- ✅ Redirect ke homepage
- ✅ Atau muncul success message

---

## STEP 7: Test Login (1 menit)

1. **Buka**: http://localhost:3000/login

2. **Login** dengan:
   - **Email**: `ricky.yusar@rsquareidea.my.id`
   - **Password**: `test123` (yang Anda gunakan saat signup)

3. **Klik**: `Masuk`

**Expected Result:**
- ✅ **LOGIN BERHASIL!** 🎉
- ✅ Redirect ke dashboard/homepage
- ✅ Tidak ada error merah

---

## ✅ VERIFICATION

Test dari terminal:

```bash
# Update email di script dulu jika perlu
node scripts/debug-login.js
```

**Expected Output:**
```
Login successful!
User ID: xxx-xxx-xxx-xxx
```

---

## 🎉 SUCCESS CRITERIA

Jika semua berhasil, Anda akan lihat:

- ✅ Project baru di Supabase Dashboard (active)
- ✅ All tables created (profiles, organizations, etc.)
- ✅ User baru ter-create di Auth > Users
- ✅ Login berhasil tanpa error
- ✅ Dev server running normal

---

## 🔧 TROUBLESHOOTING

### Error: "Invalid API key"
→ Cek `.env.local`, pastikan credentials correct
→ Restart dev server

### Error: "relation does not exist"
→ Schema belum di-run
→ Run `schema.sql` di SQL Editor

### Error saat signup: "Email already exists"
→ User sudah ada di new project
→ Login aja atau ganti email

### Page tidak load
→ Restart dev server
→ Clear browser cache (`Ctrl+Shift+R`)

---

## 📝 NOTES

- **Old project**: Bisa di-pause atau delete nanti (setelah confirm new project working)
- **Database password**: Simpan di password manager
- **Credentials**: Sudah di `.env.local`, jangan share ke public
- **Git**: `.env.local` sudah di `.gitignore`, aman

---

## 🚀 NEXT STEPS (Setelah Login Berhasil)

1. ✅ Confirm all features working
2. ✅ Test create transaction
3. ✅ Test categories
4. ✅ Explore dashboard
5. ✅ If all good, delete old project

---

**SEKARANG MULAI DARI STEP 1!** ⬆️

Browser sudah terbuka, tinggal isi form! 🎯
