# MongoDB URL Setup Guide

## Which MongoDB URL Should You Use?

### Option 1: MongoDB Atlas (Cloud - Recommended for Production) ✅

**Use this if:**
- You want your lecturer to test from anywhere
- You're deploying to Vercel
- You want a permanent database

**Format:**
```
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/safemzansi?retryWrites=true&w=majority
```

**How to get it:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a cluster (free M0 tier is fine)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Replace `safemzansi` with your database name (or keep default)

**Example:**
```
MONGO_URI=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/safemzansi?retryWrites=true&w=majority
```

---

### Option 2: Local MongoDB (For Development Only)

**Use this if:**
- You have MongoDB installed locally
- You're only testing on your computer
- Your lecturer is on the same network

**Format:**
```
MONGO_URI=mongodb://localhost:27017/safemzansi
```

**Note:** This won't work for Vercel deployment or if your lecturer is on a different network!

---

## For Your Current Setup

Since your lecturer will test from their phone (different network), you **MUST use MongoDB Atlas** (Option 1).

### Quick Setup Steps:

1. **Go to:** https://www.mongodb.com/cloud/atlas/register
2. **Sign up** (free account)
3. **Create a free cluster** (M0 - Free tier)
4. **Create a database user:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `safemzansi` (or your choice)
   - Password: (create a strong password)
   - Save it!
5. **Whitelist IP addresses:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for testing)
   - Or add specific IPs
6. **Get connection string:**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `safemzansi` (or your choice)

### Update Your .env File:

```env
MONGO_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/safemzansi?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-key-here-12345
PORT=5000
```

---

## For Vercel Deployment

When deploying to Vercel, you'll need to add the same `MONGO_URI` as an environment variable in Vercel's dashboard.

---

## Testing Your Connection

After updating your `.env` file:

1. **Restart your backend server:**
   ```powershell
   cd server
   npm start
   ```

2. **Look for this message:**
   ```
   MongoDB connected successfully
   ```

3. **If you see an error**, check:
   - Password is correct (no special characters need encoding)
   - IP address is whitelisted in MongoDB Atlas
   - Connection string format is correct
   - Database name is correct

---

## Security Notes

⚠️ **Never commit your `.env` file to GitHub!**
- It contains your database password
- Keep it private
- Add `.env` to `.gitignore`

---

## Example .env File Structure

```env
# MongoDB Connection (MongoDB Atlas)
MONGO_URI=mongodb+srv://safemzansi:MySecurePassword123@cluster0.abc123.mongodb.net/safemzansi?retryWrites=true&w=majority

# JWT Secret (any random string)
JWT_SECRET=my-super-secret-jwt-key-12345-67890

# Server Port
PORT=5000
```

---

## Troubleshooting

**"MongoDB connection error: Authentication failed"**
- Check your username and password
- Make sure you're using the database user password, not your Atlas account password

**"MongoDB connection error: IP not whitelisted"**
- Go to MongoDB Atlas → Network Access
- Add your IP address or allow from anywhere

**"MongoDB connection error: Timeout"**
- Check your internet connection
- Verify the connection string is correct
- Make sure MongoDB Atlas cluster is running

