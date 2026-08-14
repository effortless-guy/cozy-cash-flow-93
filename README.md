# Ledger — Personal Finance Tracker

'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''

Lets make sure that we can installit as offline PWA so that once isntalle din user mobile then noneed for inTeret

A minimalist, mobile-first personal finance tracker designed for clarity and speed. Track your salary, subscriptions, debts (Khatabook), and total net worth in one secure, offline-first application.

## Offline-First PWA Guide

This application is designed as a **Progressive Web App (PWA)**. It can be installed on your mobile phone and used without an active internet connection.

### 1. What Offline Mode Means

The app works locally on your device. Your financial data is stored directly in your browser's storage, not on a remote server.

*   **Internet is required for:** The initial installation, receiving application updates, and downloading new icons or resources.
*   **Internet is NOT required for:** Viewing your dashboard, adding transactions, editing assets, or checking your net worth once the app is installed.
*   **Data Persistence:** Data entered while offline is saved instantly to your device. It will remain there even if you close the app or restart your phone.

### 2. Mobile Installation

#### Android (Chrome)
1.  Open the application URL in Chrome while connected to the internet.
2.  Wait for the page to fully load.
3.  Tap the **three dots (⋮)** in the top-right corner.
4.  Select **"Install app"** or **"Add to Home screen"**.
5.  Open the app from the new icon on your home screen.
6.  **Test it:** Turn off Wi-Fi and Mobile Data, then reopen the app. It should load perfectly.

#### iPhone (Safari)
1.  Open the application URL in Safari while connected to the internet.
2.  Tap the **Share** button (square with an upward arrow) at the bottom.
3.  Scroll down and tap **"Add to Home Screen"**.
4.  Open the app from your home screen.
5.  **Test it:** Enable **Airplane Mode**, then reopen the app to verify offline functionality.

### 3. Offline Verification Checklist
- [ ] App opens without internet (no "No Connection" browser error).
- [ ] Net Worth dashboard and asset cards load.
- [ ] Existing assets and transactions are visible.
- [ ] New transactions can be added and saved.
- [ ] Data remains persistent after closing and reopening the app.
- [ ] Backup/Export functionality works (downloads a file to your device).

### 4. Important Limitations
*   **App Updates:** You need to be online occasionally to receive the latest features and bug fixes.
*   **Browser Data:** If you manually "Clear Browser Cache" or "Clear Site Data" in your browser settings, your local financial data **will be deleted**. Always use the **Export/Backup** feature in Settings before performing browser maintenance.

---

## Technical Details (For Developers)

### PWA Implementation
This project uses a standard PWA manifest and service worker strategy to achieve offline capabilities.

*   **Manifest:** Located at `/public/manifest.webmanifest`. It defines the app name, icons, and `standalone` display mode.
*   **Persistence:** Uses `localStorage` via a custom `usePersisted` hook in `src/lib/finance-store.ts`. This ensures data survives page reloads and browser restarts.
*   **Service Worker:** Handled by the build system (Vite) to cache essential assets (JS, CSS, HTML, Icons).
*   **Data Integrity:** The application logic handles month/year transitions locally without needing server-side timestamps.

### Testing Offline Mode
1.  Open Chrome DevTools (**F12**).
2.  Go to the **Application** tab.
3.  Under **Service Workers**, ensure "Status" is activated and running.
4.  Go to the **Network** tab and select the **"Offline"** checkbox.
5.  Reload the page; the app should still render correctly using cached assets.

---

## Troubleshooting

*   **App doesn't open offline:** Ensure you opened the app at least once while online after the initial installation to allow the Service Worker to cache the files.
*   **Old version is displayed:** PWAs usually update on the next launch after a new version is detected. Close all tabs/instances of the app and reopen it while online.
*   **Data appears missing:** Verify you haven't switched browsers or "Incognito" modes, as `localStorage` is unique to each browser and mode. If you cleared site data, data is unrecoverable unless you have a JSON backup.

## Development

Requires Node.js and npm.

```sh
npm i
npm run dev
```

Built with TanStack Start, TypeScript, React, and Tailwind CSS.
