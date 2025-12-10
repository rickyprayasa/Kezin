#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   🔧 FIX LOGIN - AUTO HELPER                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Function to open URL
open_url() {
    local url=$1
    local description=$2

    echo "📂 Opening: $description"
    echo "   URL: $url"

    if command -v xdg-open > /dev/null; then
        xdg-open "$url" 2>/dev/null
    elif command -v gnome-open > /dev/null; then
        gnome-open "$url" 2>/dev/null
    elif command -v open > /dev/null; then
        open "$url" 2>/dev/null
    else
        echo "   ⚠️  Cannot auto-open. Please open manually."
    fi

    sleep 2
}

echo "This script will open all necessary Supabase pages for you."
echo "Follow the steps in SOLUSI-FINAL.md"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Restart Supabase Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Opening Supabase Settings..."
open_url "https://app.supabase.com/project/tpkzeewyrzlepmpalyca/settings/general" "Supabase Settings"

echo ""
echo "👉 In the page that opened:"
echo "   1. Scroll down to 'Pause project'"
echo "   2. Click 'Pause project'"
echo "   3. Wait 1-2 minutes"
echo "   4. Click 'Restore project'"
echo "   5. Wait 2-3 minutes"
echo ""
read -p "Press Enter when project is restarted..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Delete Old User"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Opening Auth Users page..."
open_url "https://app.supabase.com/project/tpkzeewyrzlepmpalyca/auth/users" "Auth Users"

echo ""
echo "👉 In the page that opened:"
echo "   1. Find user: ricky.yusar@rsquareidea.my.id"
echo "   2. Click on the user"
echo "   3. Click 'Delete user' button"
echo "   4. Confirm deletion"
echo ""
read -p "Press Enter when user is deleted..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Sign Up Again"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Opening Signup page..."
open_url "http://localhost:3000/signup" "Signup Page"

echo ""
echo "👉 In the page that opened:"
echo "   1. Enter email: ricky.yusar@rsquareidea.my.id"
echo "   2. Enter password: test123 (or any password)"
echo "   3. Enter full name"
echo "   4. Click 'Daftar sekarang'"
echo ""
read -p "Press Enter when signed up..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Login!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Opening Login page..."
open_url "http://localhost:3000/login" "Login Page"

echo ""
echo "👉 Now try to login with your credentials!"
echo ""
echo "Testing login from terminal..."
sleep 2

node scripts/debug-login.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Setup complete!"
echo ""
echo "If login still fails, check SOLUSI-FINAL.md for alternative solutions."
echo ""
