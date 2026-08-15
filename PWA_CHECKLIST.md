# PWA/Offline Smoke-Test Checklist

## 1. Installation
- [ ] Install prompt appears on compatible mobile browsers (Android/iOS).
- [ ] App can be added to the home screen.
- [ ] App launches with a splash screen and no browser UI (standalone mode).

## 2. Offline Functionality
- [ ] App loads while the device is in Airplane Mode (after first visit).
- [ ] "Offline ready" indicator appears after the service worker caches the assets.
- [ ] User can view Salary, Subscriptions, and Khatabook data offline.
- [ ] Net Worth charts render correctly offline.

## 3. Data Integrity & Persistence
- [ ] Changes made to transactions are saved and persist after a page refresh.
- [ ] IndexedDB stores data locally without a network connection.
- [ ] Import/Export functionality works to backup/restore data.

## 4. UX & Performance
- [ ] Tab switching is instantaneous.
- [ ] Expand/collapse states are preserved across sessions.
- [ ] Dark mode preference is remembered.
