# 🎯 Team Invitation System - Setup Guide

## 📋 Overview

System ini memungkinkan:
1. ✅ Admin/Owner invite team members via email
2. ✅ Invited users **TIDAK** mendapat organization sendiri
3. ✅ Invited users langsung join organization pengundang
4. ✅ Regular signup tetap mendapat organization sendiri

---

## 🚀 Setup (5 Menit)

### **STEP 1: Run Database Migration**

Buka Supabase SQL Editor dan run 2 SQL files ini **BERURUTAN**:

#### **A. Create Invitation Tables**

```bash
# File: supabase/add-invitation-system.sql
```

1. Buka: https://app.supabase.com/project/ewzgcrrfxygjshnneknt/sql/new
2. Copy isi file `supabase/add-invitation-system.sql`
3. Paste & Run

**Expected**: "Invitation system created successfully!"

#### **B. Modify Signup Trigger**

```bash
# File: supabase/modify-signup-for-invitations.sql
```

1. Buka SQL Editor baru
2. Copy isi file `supabase/modify-signup-for-invitations.sql`
3. Paste & Run

**Expected**: "Smart signup trigger created successfully!"

---

### **STEP 2: Verify Setup**

Di SQL Editor, jalankan:

```sql
-- Check if invitations table exists
SELECT * FROM invitations LIMIT 1;

-- Check if new trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## 📖 How It Works

### **Flow 1: Invite Team Member**

1. **Admin clicks "Undang Teman"** di Settings > TIM
2. **Enter email** member yang ingin diundang
3. **System generates** unique invitation link
4. **Send link** ke email member (manual atau auto-email)

### **Flow 2: Member Accepts Invitation**

#### **Scenario A: Member belum punya akun**

1. Member klik invitation link
2. Redirect ke `/signup?invite={token}`
3. Member sign up dengan email yang diundang
4. **Trigger detects invitation** → Join existing org (NO new org created)
5. Login → Masuk ke org pengundang

#### **Scenario B: Member sudah punya akun**

1. Member klik invitation link
2. Redirect ke `/invite/{token}`
3. System check: apakah email match dengan akun yang login
4. Member klik "Accept Invitation"
5. Member joined ke org pengundang

---

## 🎨 UI Components Needed

You need to add these UI components:

### **1. Invite Member Form** (Settings Page - TIM tab)

```tsx
// components/InviteMemberForm.tsx
interface InviteMemberFormProps {
  organizationId: string;
  onSuccess: () => void;
}
```

Features:
- Input email
- Select role (member/admin)
- Send invitation button
- Show invitation link (copy-able)

### **2. Pending Invitations List**

```tsx
// components/PendingInvitationsList.tsx
```

Features:
- List of pending invitations
- Status (pending/accepted/expired)
- Copy invitation link
- Cancel/Delete invitation

### **3. Team Members List**

```tsx
// components/TeamMembersList.tsx
```

Features:
- List current members
- Show role
- Remove member (admin only)
- Change role (owner only)

---

## 📝 Example Usage

### **Send Invitation (API Call)**

```typescript
const sendInvitation = async (email: string, role: string = 'member') => {
  const response = await fetch('/api/invitations/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      organizationId: currentOrgId,
      role
    })
  });

  const data = await response.json();

  if (data.success) {
    // Show invitation link: data.inviteLink
    // Copy to clipboard or send via email
    console.log('Invitation link:', data.inviteLink);
  }
};
```

### **List Team Members**

```typescript
const supabase = createClient();

const { data: members } = await supabase
  .from('organization_members')
  .select(`
    *,
    profiles:user_id(*)
  `)
  .eq('organization_id', organizationId);
```

### **List Pending Invitations**

```typescript
const { data: invitations } = await supabase
  .from('invitations')
  .select('*')
  .eq('organization_id', organizationId)
  .eq('status', 'pending');
```

---

## 🔒 Security

- ✅ RLS enabled on all tables
- ✅ Only admins can send invitations
- ✅ Token-based invitation (secure)
- ✅ Email validation
- ✅ Expiration (7 days default)
- ✅ One-time use tokens

---

## 🧪 Testing

### **Test 1: Regular Signup** (Should create new org)

1. Signup dengan email BARU (tidak ada invitation)
2. Check: User dapat organization sendiri
3. Check: User jadi owner

### **Test 2: Invited Signup** (Should join existing org)

1. Admin invite email baru
2. Signup dengan email yang diundang
3. Check: User TIDAK dapat org sendiri
4. Check: User join org pengundang as member
5. Check: User dapat akses data org pengundang

### **Test 3: Accept Invitation** (Existing user)

1. Admin invite email existing user
2. User klik invitation link
3. User accept invitation
4. Check: User joined org pengundang
5. Check: User dapat switch org (jika punya multiple)

---

## 🎯 Next Steps

After setup:

1. ✅ Run SQL migrations (STEP 1)
2. ✅ Verify tables created
3. ✅ Add UI components untuk invite members
4. ✅ Test complete flow
5. ✅ Add email sending (optional)

---

## 📂 Files Created

```
✅ supabase/add-invitation-system.sql           - Database tables & functions
✅ supabase/modify-signup-for-invitations.sql   - Smart signup trigger
✅ app/api/invitations/send/route.ts            - Send invitation API
✅ app/api/invitations/accept/route.ts          - Accept invitation API
✅ app/invite/[token]/page.tsx                  - Invitation acceptance page
✅ INVITATION-SYSTEM-SETUP.md                   - This guide
```

---

## 💡 Tips

- **Invitation expires** dalam 7 hari (configurable)
- **Token** bersifat one-time use
- **Email** harus match dengan invitation
- **Admin/Owner** dapat invite members
- **Members** tidak bisa invite

---

**Ready to setup? Start with STEP 1!** ⬆️
