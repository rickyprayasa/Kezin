#!/bin/bash

# SAVERY - Supabase Migration Script
# Jalankan schema.sql ke Supabase

echo "🚀 SAVERY Database Migration"
echo "============================"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
    echo "❌ Error: Missing Supabase credentials in .env.local"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\/\(.*\)\.supabase\.co/\1/')

echo "📡 Project: $PROJECT_REF"
echo ""

# Karena tidak bisa direct execute DDL, tampilkan instruksi
echo "📋 Untuk menjalankan migrasi database:"
echo ""
echo "1. Buka Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "2. Copy isi file supabase/schema.sql"
echo ""
echo "3. Paste ke SQL Editor dan klik Run"
echo ""
echo "Atau buka link ini langsung:"
echo "https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
