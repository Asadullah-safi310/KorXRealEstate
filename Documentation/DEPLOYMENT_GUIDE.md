# KorX Real Estate App - Deployment Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [How Backend and Mobile App Connect](#how-backend-and-mobile-app-connect)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Backend Deployment](#backend-deployment)
5. [Mobile App Deployment](#mobile-app-deployment)
6. [Testing Your Deployment](#testing-your-deployment)
7. [Troubleshooting](#troubleshooting)

---

## System Overview

### What is KorX?

KorX is a **Real Estate Property Management System** with:
- **Mobile App** (iOS & Android) - For agents and customers
- **Backend Server** - Stores all data and handles business logic
- **Database** - MySQL database that stores properties, users, deals, etc.

### System Architecture

```
┌─────────────────┐
│   Mobile App    │  ← Agents & customers use this
│  (iOS/Android)  │
└────────┬────────┘
         │
         │ Internet (API calls)
         │
         ▼
┌─────────────────┐
│ Backend Server  │  ← Handles all requests
│  (Node.js)      │
└────────┬────────┘
         │
         │ Database queries
         │
         ▼
┌─────────────────┐
│ MySQL Database  │  ← Stores all data
└─────────────────┘
```

---

## How Backend and Mobile App Connect

### Connection Flow

1. **Mobile app starts** → Reads backend URL from configuration
2. **User performs action** (e.g., views a property) → App sends HTTP request to backend
3. **Backend receives request** → Processes it and queries database
4. **Backend sends response** → Returns data to mobile app
5. **Mobile app displays data** → User sees the result

### Key Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| **Mobile .env** | `KorX/mobile/.env` | Tells mobile app where backend is located |
| **Backend .env** | `KorX/services/backend/.env` | Database credentials, JWT secrets, email config |
| **app.json** | `KorX/mobile/app.json` | Mobile app settings, Google Maps API key |

---

## Pre-Deployment Checklist

Before deploying, you need to prepare:

### ✅ Backend Requirements

- [ ] **Server** (VPS, AWS EC2, DigitalOcean, etc.)
- [ ] **MySQL Database** (version 5.7 or higher)
- [ ] **Node.js** installed (version 18 or higher)
- [ ] **Domain or IP address** for your server
- [ ] **Email account** for sending notifications (Gmail recommended)

### ✅ Mobile App Requirements

- [ ] **Expo account** (free, create at https://expo.dev)
- [ ] **Google Maps API key** (see [GOOGLE_MAPS_API_SETUP.md](./mobile/GOOGLE_MAPS_API_SETUP.md))
- [ ] **Backend URL** (from backend deployment)
- [ ] **Apple Developer Account** (for iOS - $99/year)
- [ ] **Google Play Console Account** (for Android - $25 one-time)

### ✅ Information You Need to Collect

Write these down before starting:

```
Backend Server IP/Domain: _______________________
Database Host: _______________________
Database Name: _______________________
Database Username: _______________________
Database Password: _______________________
Email (for notifications): _______________________
Email App Password: _______________________
JWT Secret (random string): _______________________
```

---

## Backend Deployment

### Option 1: Cloud Server Deployment (Recommended)

#### Step 1: Choose a Hosting Provider

Popular options:
- **DigitalOcean** - $6/month for basic server
- **AWS EC2** - Pay-as-you-go
- **Linode** - $5/month for basic server
- **Vultr** - $6/month for basic server

#### Step 2: Set Up MySQL Database

**Option A: Use same server**
1. Install MySQL on your server:
   ```bash
   sudo apt update
   sudo apt install mysql-server
   ```

2. Create database and user:
   ```bash
   sudo mysql
   ```
   ```sql
   CREATE DATABASE real_estate_pms;
   CREATE USER 'korx_user'@'localhost' IDENTIFIED BY 'your_strong_password';
   GRANT ALL PRIVILEGES ON real_estate_pms.* TO 'korx_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

**Option B: Use managed database**
- **AWS RDS** - Managed MySQL
- **DigitalOcean Managed Database** - $15/month
- **PlanetScale** - Free tier available

#### Step 3: Install Node.js on Server

```bash
# Install Node.js 18 or higher
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Step 4: Upload Backend Code to Server

**Using Git (Recommended):**
```bash
# On your server
cd /var/www/
git clone https://github.com/your-username/KorX.git
cd KorX/services/backend
```

**Using FTP/SFTP:**
- Use FileZilla or WinSCP
- Upload the `services/backend` folder to your server

#### Step 5: Configure Environment Variables

1. Go to backend folder:
   ```bash
   cd /var/www/KorX/services/backend
   ```

2. Create `.env` file:
   ```bash
   nano .env
   ```

3. Add your production configuration:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=korx_user
   DB_PASSWORD=your_database_password
   DB_NAME=real_estate_pms
   NODE_ENV=production
   JWT_SECRET=your_super_secret_random_string_here_make_it_long
   
   # Email Configuration (Gmail)
   EMAIL_SERVICE=gmail
   EMAIL_USER=youremail@gmail.com
   EMAIL_PASS=your_app_password_here
   EMAIL_FROM="KorX Real Estate" <youremail@gmail.com>
   ```

4. Save and exit (Ctrl+X, then Y, then Enter)

**IMPORTANT: Generate a strong JWT secret**
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and use it as your `JWT_SECRET`.

#### Step 6: Install Dependencies

```bash
npm install
```

#### Step 7: Initialize Database Tables

The app will create tables automatically on first run. But you can also run migration scripts:

```bash
# Optional: Run any migration scripts if needed
node scripts/migrate_property_system.js
```

#### Step 8: Start Backend Server

**For Testing:**
```bash
npm start
```

**For Production (using PM2):**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the server with PM2
pm2 start server.js --name korx-backend

# Make PM2 auto-start on server reboot
pm2 startup
pm2 save

# View logs
pm2 logs korx-backend

# Check status
pm2 status
```

#### Step 9: Configure Firewall

```bash
# Allow port 5000
sudo ufw allow 5000/tcp

# Allow SSH (don't lock yourself out!)
sudo ufw allow ssh

# Enable firewall
sudo ufw enable
```

#### Step 10: Set Up Reverse Proxy (Optional but Recommended)

Use **Nginx** to handle HTTPS and domain:

```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/korx
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/KorX/services/backend/uploads;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/korx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 11: Set Up SSL Certificate (HTTPS)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com
```

**Your backend is now running at:**
- HTTP: `http://api.yourdomain.com`
- HTTPS: `https://api.yourdomain.com` (with SSL)

---

## Mobile App Deployment

### Step 1: Install Expo CLI

On your computer:
```bash
npm install -g eas-cli
```

### Step 2: Create Expo Account

1. Go to https://expo.dev
2. Click **"Sign Up"**
3. Create a free account
4. Verify your email

### Step 3: Login to Expo

```bash
eas login
```

Enter your Expo username and password.

### Step 4: Update Backend URL

1. Open: `KorX/mobile/.env`
2. Replace the local IP with your production backend URL:

**Before (Development):**
```env
EXPO_PUBLIC_API_URL=http://192.168.137.135:5000/api
```

**After (Production):**
```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

**If you don't have a domain, use your server IP:**
```env
EXPO_PUBLIC_API_URL=http://123.456.789.0:5000/api
```

### Step 5: Add Google Maps API Key

1. Follow the guide: [GOOGLE_MAPS_API_SETUP.md](./mobile/GOOGLE_MAPS_API_SETUP.md)
2. Add your API key to `mobile/app.json`:

Find these sections and add your key:

```json
"ios": {
  "config": {
    "googleMapsApiKey": "AIzaSyD1234567890abcdefghijklmnopqrstuvw"
  }
},
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "AIzaSyD1234567890abcdefghijklmnopqrstuvw"
    }
  }
}
```

### Step 6: Update App Configuration

Edit `mobile/app.json`:

```json
{
  "expo": {
    "name": "KorX",
    "slug": "korx-real-estate",
    "version": "1.0.0",
    "android": {
      "package": "com.yourcompany.korx"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.korx"
    }
  }
}
```

**Change:**
- `slug` - Must be unique (lowercase, no spaces)
- `android.package` - Your app package name (reverse domain)
- `ios.bundleIdentifier` - iOS bundle ID (same format as package)

### Step 7: Create EAS Configuration

In the `mobile` folder:

```bash
cd mobile
eas build:configure
```

This creates `eas.json`. When asked:
- Select **"Yes"** to create eas.json
- Select **"All"** for platforms (iOS and Android)

### Step 8: Build for Android

```bash
eas build --platform android
```

**Choose build type:**
- **APK** - For testing (can install directly)
- **AAB** - For Google Play Store (recommended for production)

**The build process:**
1. Uploads your code to Expo servers
2. Builds the app (takes 10-20 minutes)
3. Provides download link when done

**Download your app:**
- Check your email for build notification
- Or run: `eas build:list`

### Step 9: Build for iOS

```bash
eas build --platform ios
```

**Requirements:**
- Apple Developer Account ($99/year)
- You'll be prompted to login with Apple ID

**Choose build type:**
- **Simulator** - For testing on Mac
- **App Store** - For production release

### Step 10: Test Your Builds

**Android:**
1. Download the APK file
2. Transfer to your Android phone
3. Install and test
4. Make sure it connects to your backend

**iOS:**
1. Use TestFlight for testing
2. Upload IPA to App Store Connect
3. Invite testers via TestFlight

### Step 11: Publish to App Stores

#### Android (Google Play Store)

1. Go to https://play.google.com/console
2. Create a new app
3. Fill in app details:
   - Title: KorX Real Estate
   - Description: (Write a good description)
   - Screenshots: (Take screenshots of your app)
   - Category: Business
4. Upload your AAB file
5. Complete the content rating questionnaire
6. Set pricing (Free or Paid)
7. Submit for review

**Review time:** 1-3 days usually

#### iOS (Apple App Store)

1. Go to https://appstoreconnect.apple.com
2. Create a new app
3. Fill in app information:
   - Name: KorX Real Estate
   - Primary Language: English
   - Bundle ID: com.yourcompany.korx
   - SKU: korx-real-estate
4. Upload your IPA using Transporter app or Xcode
5. Add screenshots (use iPhone 14 Pro Max size)
6. Write description and keywords
7. Complete privacy details
8. Submit for review

**Review time:** 1-2 days usually

---

## Environment Variables Reference

### Backend (.env) - Production

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_HOST=your-database-host
DB_USER=your-database-username
DB_PASSWORD=your-strong-database-password
DB_NAME=real_estate_pms

# Authentication
JWT_SECRET=use-the-random-string-you-generated

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=yourcompany@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM="KorX Real Estate" <yourcompany@gmail.com>
```

### Mobile (.env) - Production

```env
# Backend API URL
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

**Important Notes:**
- Always use `https://` in production (secure)
- URL must end with `/api`
- No trailing slash after `/api`

---

## Testing Your Deployment

### Test Backend

**Test 1: Health Check**
```bash
curl https://api.yourdomain.com/api/health
```

Expected response:
```json
{"message":"Server is running - Apartment CRUD Fix v4"}
```

**Test 2: API Endpoints**
```bash
# Test public properties endpoint
curl https://api.yourdomain.com/api/public/properties
```

Should return a list of properties (or empty array).

**Test 3: File Uploads**
Make sure `uploads` folder is accessible:
```bash
curl https://api.yourdomain.com/uploads/
```

### Test Mobile App

**Test 1: Backend Connection**
1. Open the app
2. Check if properties load on home screen
3. If nothing loads, check your `.env` file

**Test 2: Maps Functionality**
1. Go to "Add Property"
2. Navigate to "Property Location" step
3. Verify map loads without watermark
4. Test search functionality
5. Test "Current Location" button

**Test 3: Authentication**
1. Create a new account
2. Verify you receive OTP email
3. Login successfully
4. Check if JWT token is stored

**Test 4: Image Upload**
1. Add a property
2. Upload property images
3. Verify images appear in property details
4. Check that images are stored on backend server

---

## Deployment Environments

### Development (Local)

**Backend:**
```env
EXPO_PUBLIC_API_URL=http://192.168.1.XX:5000/api
```
Use your computer's local IP address.

**Mobile:**
```bash
npm start
```

### Staging (Testing Server)

**Backend:**
```env
EXPO_PUBLIC_API_URL=https://staging-api.yourdomain.com/api
```

**Mobile:**
```bash
# Build staging version
eas build --platform android --profile staging
```

### Production (Live)

**Backend:**
```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
```

**Mobile:**
```bash
# Build production version
eas build --platform android --profile production
```

---

## Troubleshooting

### Problem: Mobile app can't connect to backend

**Symptoms:**
- "Network Error" messages
- Properties don't load
- Can't login

**Solutions:**

1. **Check backend URL in `.env`:**
   ```env
   # Wrong ❌
   EXPO_PUBLIC_API_URL=http://localhost:5000/api
   
   # Correct ✅
   EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api
   ```

2. **Verify backend is running:**
   ```bash
   curl https://api.yourdomain.com/api/health
   ```

3. **Check firewall:**
   ```bash
   sudo ufw status
   # Make sure port 5000 is allowed
   ```

4. **Rebuild mobile app:**
   ```bash
   # Changes to .env require rebuilding
   eas build --platform android
   ```

### Problem: Database connection error

**Symptoms:**
- Backend crashes on startup
- Error: "Access denied for user"

**Solutions:**

1. **Verify database credentials:**
   ```bash
   mysql -h DB_HOST -u DB_USER -p
   # Enter DB_PASSWORD
   ```

2. **Check if database exists:**
   ```sql
   SHOW DATABASES;
   ```

3. **Grant permissions:**
   ```sql
   GRANT ALL PRIVILEGES ON real_estate_pms.* TO 'korx_user'@'%';
   FLUSH PRIVILEGES;
   ```

### Problem: Maps not working in mobile app

**Symptoms:**
- Map shows "For development purposes only"
- Search doesn't work
- Blank map

**Solutions:**

1. **Add Google Maps API key** to `app.json`
2. **Enable required APIs** in Google Cloud Console:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Geocoding API
3. **Rebuild the app:**
   ```bash
   eas build --platform android
   ```

### Problem: Images not uploading

**Symptoms:**
- Upload fails silently
- Images don't appear in property details

**Solutions:**

1. **Check uploads folder permissions:**
   ```bash
   sudo chmod 755 /var/www/KorX/services/backend/uploads
   sudo chown -R www-data:www-data uploads/
   ```

2. **Verify Nginx serves uploads:**
   ```nginx
   location /uploads {
       alias /var/www/KorX/services/backend/uploads;
   }
   ```

3. **Check backend logs:**
   ```bash
   pm2 logs korx-backend
   ```

### Problem: Email notifications not working

**Symptoms:**
- OTP emails not received
- No verification emails

**Solutions:**

1. **Use App Password (not regular Gmail password):**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use that in `EMAIL_PASS`

2. **Check email configuration:**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=youremail@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop  # 16-character app password
   EMAIL_FROM="KorX Real Estate" <youremail@gmail.com>
   ```

3. **Test email sending:**
   - Check backend logs for email errors
   - Try sending a test email

### Problem: Backend crashes after deployment

**Symptoms:**
- Server runs for a while then crashes
- PM2 keeps restarting it

**Solutions:**

1. **Check logs:**
   ```bash
   pm2 logs korx-backend --lines 100
   ```

2. **Increase server memory:**
   ```bash
   pm2 delete korx-backend
   pm2 start server.js --name korx-backend --max-memory-restart 500M
   pm2 save
   ```

3. **Check for unhandled promises:**
   - Look for database connection errors
   - Verify all async/await are properly handled

---

## Security Best Practices

### Backend Security

✅ **DO:**
- Use strong JWT secret (64+ characters)
- Use HTTPS in production (SSL certificate)
- Keep `.env` file secure (never commit to Git)
- Use environment variables for all secrets
- Enable firewall on server
- Keep Node.js and dependencies updated
- Use strong database passwords
- Set `NODE_ENV=production`

❌ **DON'T:**
- Hardcode passwords in code
- Commit `.env` file to GitHub
- Use default passwords
- Run backend as root user
- Expose database directly to internet

### Mobile App Security

✅ **DO:**
- Store JWT tokens in SecureStore (already implemented)
- Use HTTPS for all API calls
- Validate all user input
- Keep API keys secure
- Use code obfuscation for production builds

❌ **DON'T:**
- Store passwords in plain text
- Use HTTP in production
- Trust user input without validation
- Hardcode API keys in code (use .env)

---

## Cost Estimates

### Backend Hosting

| Provider | Plan | Monthly Cost |
|----------|------|--------------|
| DigitalOcean | Basic Droplet | $6 |
| AWS EC2 | t3.micro | ~$8 |
| Linode | Nanode 1GB | $5 |
| DigitalOcean Managed DB | 1GB RAM | $15 |

**Total Backend:** $10-25/month

### Mobile App

| Service | Cost |
|---------|------|
| Expo Account | Free |
| Google Play Developer | $25 (one-time) |
| Apple Developer Account | $99/year |
| Google Maps API | Free (10k searches/month) |

**Total Mobile:** $25 one-time + $99/year

### Total First Year

- **Setup:** $25 (Google Play) + $99 (Apple) = **$124**
- **Monthly:** $10-25 (backend hosting) = **$120-300/year**
- **First Year Total:** ~$250-425

---

## Maintenance Checklist

### Weekly

- [ ] Check backend server is running (`pm2 status`)
- [ ] Monitor disk space (`df -h`)
- [ ] Review error logs (`pm2 logs`)
- [ ] Check database backup worked

### Monthly

- [ ] Update Node.js dependencies
  ```bash
  cd /var/www/KorX/services/backend
  npm outdated
  npm update
  pm2 restart korx-backend
  ```
- [ ] Review Google Maps API usage
- [ ] Check SSL certificate expiry
- [ ] Monitor user feedback and app reviews

### Quarterly

- [ ] Full database backup
- [ ] Security audit
- [ ] Update app version and publish updates
- [ ] Review and optimize database queries

---

## Getting Help

### Resources

- **Expo Documentation:** https://docs.expo.dev
- **Node.js Documentation:** https://nodejs.org/docs
- **PM2 Documentation:** https://pm2.keymetrics.io
- **MySQL Documentation:** https://dev.mysql.com/doc

### Support

If you're stuck:
1. Check the troubleshooting section above
2. Review backend logs: `pm2 logs korx-backend`
3. Test API endpoints manually with curl
4. Verify all configuration files are correct
5. Search for error messages on Google/Stack Overflow
6. Contact your development team

---

## Summary Deployment Checklist

### Backend

- [ ] Server provisioned (VPS/Cloud)
- [ ] Node.js installed (v18+)
- [ ] MySQL database created
- [ ] Code uploaded to server
- [ ] `.env` file configured with production values
- [ ] Dependencies installed (`npm install`)
- [ ] PM2 installed and configured
- [ ] Backend running (`pm2 start server.js`)
- [ ] Firewall configured (port 5000 allowed)
- [ ] Nginx reverse proxy configured (optional)
- [ ] SSL certificate installed (HTTPS)
- [ ] Health check endpoint working
- [ ] Database tables created

### Mobile App

- [ ] Expo account created
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Logged in to Expo (`eas login`)
- [ ] `.env` updated with production backend URL
- [ ] Google Maps API key added to `app.json`
- [ ] `eas.json` created (`eas build:configure`)
- [ ] Android build successful
- [ ] iOS build successful
- [ ] App tested on real device
- [ ] Google Play Store listing created
- [ ] Apple App Store listing created
- [ ] App submitted for review
- [ ] App approved and published

---

**Estimated Total Deployment Time:**
- **Backend:** 2-4 hours (first time)
- **Mobile App:** 3-6 hours (first time)
- **App Store Review:** 1-7 days

**After you've done it once, subsequent deployments take 30 minutes.**

---

*Last Updated: February 2026*
*For technical support, contact your development team.*
