# How to Setup APK Download

## Current Setup

The download page is now configured to:
- **Download APK from**: `/public/triji-app.apk` (hosted locally)
- **Fetch release notes from**: GitHub repository (`gauciv/triji-app`)
- **Why this approach**: OTA updates mean not all releases need APK files

## Step 1: Place Your APK File

### Build your React Native app:

```bash
cd /path/to/your/react-native-app
cd android
./gradlew assembleRelease
```

### Copy the APK to the public folder:

```bash
# The APK is generated at:
# android/app/build/outputs/apk/release/app-release.apk

# Copy it to your admin dashboard
cp android/app/build/outputs/apk/release/app-release.apk /workspaces/triji-app-admin-dashboard/public/triji-app.apk
```

**Important**: The file MUST be named exactly `triji-app.apk`

## Step 2: Create GitHub Releases (for Release Notes)

Even though the APK is hosted locally, you should still create GitHub releases to provide version info and release notes:

1. **Go to your React Native app repository** on GitHub (`gauciv/triji-app`)

2. **Create a new release:**
   - Click "Releases" → "Create a new release"
   - Choose a tag version (e.g., `v1.0.0`, `v1.0.1`)
   - Add release title
   - Write release notes in clean format:
     ```
     - Added new feature X
     - Fixed bug in Y
     - Improved performance of Z
     - Updated UI design
     ```

3. **Publish the release** (no need to attach APK files)

## How It Works

The download page will:
1. ✅ Fetch version and release notes from GitHub
2. ✅ Download APK from local `/public/triji-app.apk`
3. ✅ Show error handling if GitHub is unreachable
4. ✅ Still allow downloads even if release info fails

## Security Features Implemented

- ✅ XSS prevention (sanitizes all user-facing text)
- ✅ Request timeout (10 seconds)
- ✅ Rate limit handling
- ✅ Input validation and length limits
- ✅ Secure download attributes
- ✅ File existence check before download
- ✅ Error boundary with graceful degradation

## Updating the APK

When you have a new version:

1. Build new APK
2. Replace `/public/triji-app.apk` with new file
3. Create new GitHub release with updated notes
4. Done! Users see new version info and download new APK

## .gitignore

APK files are automatically excluded from git commits (added to `.gitignore`)
