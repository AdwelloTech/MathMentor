# Email & OTP Setup Guide

## Current Status: SMTP Configured But Authentication Failing

The application has SMTP configuration but is experiencing authentication issues. The environment variables are loaded correctly, but Gmail is rejecting the credentials.

## Current Configuration

Your `.env` files already have SMTP settings configured:
- SMTP_HOST: smtp.gmail.com
- SMTP_PORT: 587
- SMTP_USER: synoforgelabs@gmail.com
- SMTP_FROM: MathMentor <noreply@mathmentor.com>

## Issue: Gmail App Password May Be Expired

The error "Missing credentials for 'PLAIN'" typically means:
1. The Gmail app password is expired/invalid
2. The Gmail account has security restrictions
3. 2FA settings have changed

## Gmail App Password Regeneration

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this 16-character password as `SMTP_PASSWORD`

3. **Update `.env` file** with your Gmail address and app password

## ✅ Current Setup: Gmail SMTP (Ready to Configure)

Your `.env` files are configured for Gmail SMTP. You just need to:

### 1. Create Gmail Account & Enable 2FA
- Create a Gmail account for MathMentor (e.g., `mathmentor.test@gmail.com`)
- Enable 2-Step Verification:
  - Google Account → Security → 2-Step Verification → Enable

### 2. Generate Gmail App Password
- Go to: https://myaccount.google.com/apppasswords
- Sign in with your Gmail account
- Select "Mail" and "Other (custom name)"
- Enter "MathMentor" as the name
- Copy the 16-character password (no spaces)

### 3. Update Password in .env Files
Replace `abcd-efgh-ijkl-mnop` with your actual 16-character app password:
```env
SMTP_PASSWORD=your-actual-16-char-app-password
```

### 4. Update Email Address (Optional)
Replace `mathmentor.test@gmail.com` with your actual Gmail address:
```env
SMTP_USER=your-gmail@gmail.com
SMTP_FROM=MathMentor <your-gmail@gmail.com>
```

### 5. Restart Server
```bash
npm run dev
```

## Why Gmail App Passwords?
- Gmail blocks regular passwords for SMTP
- App passwords are secure 16-character codes
- Only work for the specific app (MathMentor)
- Can be revoked individually if needed

## Alternative: Professional Email Services
For production, consider:
- **SendGrid**: 100 free emails/day
- **Mailgun**: 5,000 free emails/month
- **AWS SES**: Pay-as-you-go

## Alternative Email Providers

## Quick Fix for Current Issue

1. **Regenerate Gmail App Password**:
   - Go to Google Account settings → Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (custom name)"
   - Generate new 16-character password
   - Replace the current `SMTP_PASSWORD` in all `.env` files

2. **Update the password** in your `.env` files:
   ```env
   SMTP_PASSWORD=your-new-16-char-password
   ```

3. **Restart the server** after updating the password

## Alternative Solutions

If Gmail app passwords continue to fail, consider these alternatives:

### 1. Use a Different Email Provider
**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

### 2. Use Email Service Providers
For production, consider dedicated email services:
- **SendGrid**: Professional email delivery
- **Mailgun**: Reliable SMTP service
- **AWS SES**: Scalable email service

### 3. Development Email Testing
For development/testing, you can use:
- **Mailtrap**: Captures emails without sending
- **MailHog**: Local email testing
- **Ethereal Email**: Fake SMTP service for testing

## Testing Email Functionality

After fixing the credentials, test by:
1. Registering a new account → Should receive verification OTP
2. Trying to login with unverified account → Should receive OTP
3. Using "Forgot Password" → Should receive reset OTP

## Security Notes

- Never commit `.env` files to version control
- Use app-specific passwords, not your main account password
- Rotate app passwords regularly
- Consider using dedicated email services for production
