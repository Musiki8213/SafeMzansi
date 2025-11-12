# iOS Build Guide for SafeMzansi

## ⚠️ Important: macOS Required

**iOS apps can ONLY be built on macOS with Xcode installed.** Since you're on Windows, you have the following options:

## Option 1: Use a Mac (Recommended)

If you have access to a Mac:

1. **Install Prerequisites:**
   ```bash
   # Install Xcode from App Store
   # Install CocoaPods
   sudo gem install cocoapods
   ```

2. **Add iOS Platform:**
   ```bash
   cd client
   npm install
   npm run cap:sync
   echo "SafeMzansi`ncom.safemzansi.app" | npx cap add ios
   ```

3. **Open in Xcode:**
   ```bash
   npm run cap:open:ios
   ```

4. **Build in Xcode:**
   - Select your device or simulator
   - Click the Play button or press Cmd+R
   - For distribution: Product → Archive

## Option 2: Cloud Build Services

Use cloud-based build services that provide macOS build environments:

### **Ionic Appflow** (Recommended)
- Sign up at [ionic.io](https://ionic.io)
- Connect your GitHub repository
- Build iOS apps in the cloud
- Free tier available for limited builds

### **EAS Build (Expo)**
- Alternative cloud build service
- Requires some configuration changes

### **MacStadium / MacInCloud**
- Rent a Mac in the cloud
- Access via remote desktop
- Build iOS apps remotely

## Option 3: Use a Friend's/Colleague's Mac

1. Transfer your project to a Mac
2. Follow Option 1 steps
3. Build and test on the Mac
4. Transfer the `.ipa` file back

## Current Status

✅ **iOS platform package installed** (`@capacitor/ios`)
✅ **Capacitor config updated** for iOS support
✅ **Ready to add iOS platform** (when on macOS)

❌ **Cannot build on Windows** - Requires macOS + Xcode

## Important Notes for Mobile Development

### API URL Configuration

Your current API URL is hardcoded to `localhost:5000`, which **won't work on mobile devices**. You need to:

1. **For local testing:** Use your computer's IP address:
   ```javascript
   // In client/src/utils/api.js
   const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000/api';
   ```

2. **For production:** Use your deployed backend URL:
   ```javascript
   const API_BASE_URL = 'https://your-backend-domain.com/api';
   ```

3. **Better approach:** Use environment variables:
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
   ```

### Testing on iOS Simulator

When you get access to a Mac:
- iOS Simulator comes with Xcode
- Test without a physical device
- Faster iteration during development

### Testing on Physical iOS Device

- Requires Apple Developer account ($99/year)
- Or use free account for 7-day provisioning
- Connect device via USB
- Select device in Xcode and run

## Next Steps

1. **For now:** Continue with Android development (works on Windows)
2. **For iOS:** Get access to a Mac or use cloud build service
3. **Fix API URL:** Update `client/src/utils/api.js` to use your server's IP/domain

