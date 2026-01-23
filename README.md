# Our Shared Calendar 📅

A beautiful, iOS-optimized shared calendar web app for couples that syncs with Apple Calendar.

## Features

✅ **iOS Optimized** - Works perfectly on iPhone and iPad
✅ **Apple Calendar Integration** - Export events to your native calendar app
✅ **Real-time Syncing** - Changes appear instantly on both devices (with Firebase)
✅ **Offline Support** - Works without internet connection
✅ **Add to Home Screen** - Install as a Progressive Web App
✅ **Beautiful Design** - Clean, modern interface with color-coded events

---

## Quick Start (No Setup Required)

The calendar works immediately without any configuration:

1. Open `index.html` in Safari on your iPhone/iPad
2. Tap the Share button
3. Select "Add to Home Screen"
4. Open the app from your home screen

**Note:** Without Firebase setup, the calendar uses local storage. To sync between devices, follow the Firebase setup below.

---

## Setting Up Real-time Sync (Optional but Recommended)

### Step 1: Create a Firebase Project (Free)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a project"
3. Enter project name: "Shared Calendar" (or anything you like)
4. Disable Google Analytics (not needed)
5. Click "Create Project"

### Step 2: Set Up Realtime Database

1. In your Firebase project, click "Realtime Database" in the left menu
2. Click "Create Database"
3. Choose any location (closest to you)
4. Select "Start in **test mode**" (we'll secure it next)
5. Click "Enable"

### Step 3: Secure Your Database

1. In Realtime Database, click the "Rules" tab
2. Replace the rules with this:

```json
{
  "rules": {
    "events": {
      ".read": true,
      ".write": true
    }
  }
}
```

3. Click "Publish"

**Security Note:** These rules allow anyone to read/write. For better security, you can:
- Set up authentication (see Firebase docs)
- Restrict access by IP
- Add password protection

### Step 4: Get Your Firebase Config

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>`
5. Register your app (name: "Shared Calendar")
6. Copy the `firebaseConfig` object

### Step 5: Add Config to Your Calendar

1. Open `script.js` in a text editor
2. Find this section at the top:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

3. Replace it with your Firebase config
4. Save the file

---

## Hosting Your Calendar Online

To access from different locations and devices, you need to host it online.

### Option 1: GitHub Pages (Easiest, Free)

1. Create a GitHub account at [github.com](https://github.com)
2. Create a new repository named "shared-calendar"
3. Upload all your calendar files
4. Go to Settings > Pages
5. Select "main" branch and click Save
6. Your calendar will be live at: `https://yourusername.github.io/shared-calendar`

### Option 2: Netlify (Free, Simple)

1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop your `shared-calendar` folder
3. Your site is live instantly!
4. You get a URL like: `https://random-name.netlify.app`

### Option 3: Vercel (Free, Fast)

1. Create account at [vercel.com](https://vercel.com)
2. Import your calendar folder
3. Deploy in seconds
4. Get a URL like: `https://shared-calendar.vercel.app`

---

## Using on iOS Devices

### Installing as an App

**iPhone/iPad:**
1. Open the calendar URL in Safari
2. Tap the Share button (box with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. The calendar now appears as an app icon!

### Syncing with Apple Calendar

**Method 1: Subscribe Button (Recommended)**
1. Open the calendar app
2. Tap "📱 Subscribe to Calendar"
3. Tap "Add All" when prompted
4. Events appear in your Apple Calendar app

**Method 2: Download ICS**
1. Tap "📥 Download ICS"
2. Open the downloaded file
3. Tap "Add All"

**Note:** The calendar export is a one-time snapshot. When you add new events, export again to update Apple Calendar.

---

## Usage Tips

### Adding Events
- **Quick Add:** Tap any date on the calendar
- **With Time:** Use the "+ Add Event" button for timed events
- **Color Code:** Choose colors to categorize events (date nights, appointments, etc.)

### Editing Events
- Tap any event to view details
- Click "Edit" to modify
- Swipe left (mobile) or click delete button to remove

### Syncing Between Devices
- With Firebase: Changes appear instantly
- Without Firebase: Use "📥 Download ICS" and "📤 Import ICS" to manually sync

### Offline Mode
- Calendar works completely offline
- Events are saved locally
- Syncs when you're back online (with Firebase)

---

## Creating App Icons (Optional)

The calendar looks for `icon-192.png` and `icon-512.png`. Create these for a custom icon:

1. Design a 512x512px icon (use Canva, Figma, etc.)
2. Save as `icon-512.png`
3. Create a 192x192px version as `icon-192.png`
4. Place both in the `shared-calendar` folder

Or use this simple emoji icon:
- Take a screenshot of the 📅 emoji on a purple background
- Resize to 512x512px and 192x192px
- Save as the icon files

---

## Troubleshooting

### Events Not Syncing Between Devices
- Check that both devices use the same Firebase config
- Verify Firebase Realtime Database rules are set correctly
- Check internet connection
- Look for sync status message at top of calendar

### Can't Add to Home Screen
- Make sure you're using Safari (not Chrome)
- iOS 14.3 or later recommended
- Try reloading the page first

### ICS File Won't Open
- Make sure you're opening with Calendar app (not Files app)
- Try saving to Files first, then opening from there
- On iOS, use the Share sheet to send to Calendar

### Calendar Looks Wrong on Mobile
- Clear your browser cache
- Make sure viewport meta tag is in the HTML
- Check that you're using the latest version of the files

---

## Customization

### Change Colors
Edit the gradient in `styles.css`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Add More Event Colors
Edit `index.html` and add more options:
```html
<option value="#your-color">Your Color Name</option>
```

### Change Calendar Name
Edit `index.html` and `manifest.json` to update the app name.

---

## Privacy & Security

- All data stays between your devices and your Firebase database
- No third-party tracking or analytics
- Your calendar link is your own - share it only with your wife
- For extra security, set up Firebase Authentication

---

## Support

If you run into issues:
1. Check the browser console for errors (Safari > Develop > Show JavaScript Console)
2. Verify your Firebase config is correct
3. Make sure all files are in the same folder
4. Try clearing browser cache and reloading

---

## File Structure

```
shared-calendar/
├── index.html           # Main HTML file
├── script.js            # Calendar logic & Firebase integration
├── styles.css           # Styling & responsive design
├── manifest.json        # PWA configuration
├── service-worker.js    # Offline functionality
├── icon-192.png         # App icon (small)
├── icon-512.png         # App icon (large)
└── README.md           # This file
```

---

## Credits

Built with ❤️ for couples who want to stay organized together.

Technologies used:
- Vanilla JavaScript
- Firebase Realtime Database
- Progressive Web App (PWA)
- iCalendar (.ics) format

---

Enjoy your shared calendar! 📅✨
