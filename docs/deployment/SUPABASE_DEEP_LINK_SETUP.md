# Supabase Password Reset Deep Link Configuration

## Overview
This guide explains how to configure Supabase Auth to properly handle password reset deep links for the Play Serve mobile app.

## The Issue
Supabase's Site URL field only accepts valid HTTP/HTTPS URLs and won't accept custom URL schemes like `playserve://`. However, we need to use deep links for mobile apps.

## Solution

### 1. Dashboard Configuration

#### Site URL
- **Keep as**: `http://localhost:3000` (or your production web URL if you have one)
- This field requires a valid HTTP URL and is used as the default fallback

#### Redirect URLs (This is the important part!)
Add these URLs to the **Redirect URLs** list:
- `playserve://reset-password`
- `playserve://`
- `exp://` (for Expo Go development)
- `exp://192.168.1.100:8081` (replace with your local IP for development)

**Location**: https://supabase.com/dashboard/project/dgkdbqloehxruoijylzw/auth/url-configuration

### 2. Email Template Configuration

Go to **Authentication > Email Templates** in Supabase Dashboard:

1. Select **Reset Password** template
2. Update the email template to:

```html
<h2>Reset Password</h2>

<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>

<p>Or copy and paste this link:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 1 hour.</p>
```

The `{{ .ConfirmationURL }}` will automatically use the redirect URL you specified in the code.

### 3. How It Works

1. User requests password reset with email
2. Our app calls `resetPasswordForEmail` with `redirectTo: 'playserve://reset-password'`
3. Supabase sends email with a verification link like:
   ```
   https://dgkdbqloehxruoijylzw.supabase.co/auth/v1/verify?token=TOKEN&type=recovery&redirect_to=playserve://reset-password
   ```
4. When user clicks the link:
   - Browser opens Supabase URL
   - Supabase verifies the token
   - Supabase redirects to `playserve://reset-password`
   - App opens and handles the deep link
   - User can reset password

### 4. Testing

#### Development (Expo Go)
1. Add your Expo Go URL to Redirect URLs: `exp://192.168.1.100:8081` (use your IP)
2. Request password reset
3. Check email and click link
4. App should open to reset password screen

#### Production (Standalone App)
1. Ensure `playserve://reset-password` is in Redirect URLs
2. Build and install app
3. Request password reset
4. Click email link
5. App opens directly to reset password

### 5. Troubleshooting

**Issue**: Redirect stays at localhost:3000
- **Solution**: Add the deep link URL to the Redirect URLs list, not Site URL

**Issue**: "URL not allowed" error
- **Solution**: Ensure the exact URL is in the Redirect URLs list

**Issue**: App doesn't open
- **Solution**: Check that URL scheme matches app.json (`playserve`)

**Issue**: Session not found after redirect
- **Solution**: The app now handles token verification in the deep link handler

## Code Implementation

The implementation handles deep links in `contexts/AuthContext.tsx`:

1. Listens for incoming deep links
2. Detects Supabase recovery tokens
3. Verifies the token with Supabase
4. Creates a session
5. Navigates to reset password screen

## Important Notes

- **Never** put custom URL schemes in the Site URL field
- **Always** use the Redirect URLs list for mobile deep links
- The Site URL can remain as localhost for development
- Each environment (dev, staging, prod) needs its URLs in the Redirect URLs list