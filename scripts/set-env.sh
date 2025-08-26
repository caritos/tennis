#!/bin/bash

# Environment switcher script for Play Serve
# Usage: ./scripts/set-env.sh [production|development]

ENV=${1:-production}

case $ENV in
  "production")
    echo "🚀 Switching to production environment..."
    cp .env.production .env
    echo "✅ Production environment active"
    echo "   Database: https://dgkdbqloehxruoijylzw.supabase.co"
    ;;
  "development")
    echo "🔧 Switching to development environment..."
    cp .env.development .env
    echo "✅ Development environment active"
    ;;
  *)
    echo "❌ Invalid environment: $ENV"
    echo "Usage: $0 [production|development]"
    exit 1
    ;;
esac

echo ""
echo "Current environment variables:"
grep -E "EXPO_PUBLIC_SUPABASE_URL|EXPO_PUBLIC_RESET_DATABASE" .env || echo "No Supabase config found"