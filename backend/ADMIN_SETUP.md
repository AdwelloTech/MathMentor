# Admin Account Setup

This document explains how to create and manage admin accounts for MathMentor.

## Quick Start

### Create Admin Account

To create the default admin account, run:

```bash
cd backend
node create-admin.js
```

This will create an admin account with the following credentials:

```
Email:    admin@mathmentor.com
Password: admin123
Role:     admin
```

**⚠️ IMPORTANT:** Change this password immediately after first login!

## Requirements

- Node.js installed
- MongoDB running (local or remote)
- Proper environment variables configured in `.env` file

## Environment Variables

The script uses the following environment variable:

```env
MONGODB_URI=mongodb://localhost:27017/mathmentor
```

If not set, it defaults to `mongodb://localhost:27017/mathmentor`

## Features

### Check Existing Account

The script automatically checks if an admin account already exists:
- If it exists, you'll be prompted to delete and recreate it
- If it doesn't exist, it will create a new one

### Secure Password Hashing

Passwords are automatically hashed using bcrypt with a salt factor of 12, matching the production User model.

## Usage Examples

### Basic Usage

```bash
# From the backend directory
node create-admin.js
```

### With Environment Variables

```bash
# Use a specific MongoDB connection
MONGODB_URI="mongodb://your-server:27017/mathmentor" node create-admin.js
```

### Make it Executable

The script has a shebang and can be run directly:

```bash
chmod +x create-admin.js
./create-admin.js
```

## Troubleshooting

### "Admin account already exists"

If you see this message and want to recreate the account:
1. Answer 'y' when prompted
2. Or manually delete the account from MongoDB first
3. Or use a different email in the script

### "MongoDB connection error"

Ensure:
- MongoDB is running
- The connection string in `.env` is correct
- You have network access to the MongoDB server

### "Duplicate key error"

This means an account with that email already exists. Use the interactive prompt to delete it, or manually remove it from the database.

## Security Notes

1. **Default Password**: The default password `admin123` is intentionally weak for initial setup. **Change it immediately** after first login.

2. **Production Use**: For production environments:
   - Use strong passwords
   - Enable two-factor authentication if available
   - Regularly audit admin accounts
   - Use environment variables for sensitive data

3. **Script Storage**: Store this script securely and limit access to it.

## Related Scripts

- `create-demo-admin.js` - Alternative admin creation script with more detailed user data
- `debug-admin.js` - Debug existing admin accounts

## Support

If you encounter issues:
1. Check the MongoDB logs
2. Verify your `.env` configuration
3. Ensure all dependencies are installed (`npm install`)
4. Check the backend server logs

---

**Last Updated**: October 2025


