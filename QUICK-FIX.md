# 🚀 QUICK FIX - Login Error

## Error: `Database error querying schema`

### Fix dalam 3 langkah:

1. **Buka**: [Supabase Dashboard](https://app.supabase.com) > SQL Editor
2. **Run**: Copy-paste isi file `supabase/fix-auth-error.sql` dan klik Run
3. **Test**: Tunggu 10 detik, refresh browser, login lagi

### Atau dari terminal:

```bash
# Test login
node scripts/debug-login.js

# Diagnose masalah
node scripts/diagnose-auth.mjs
```

---

**Detail lengkap**: Lihat [FIX-LOGIN-ERROR.md](./FIX-LOGIN-ERROR.md)
