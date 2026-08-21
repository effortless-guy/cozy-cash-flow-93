# Storage Refactor: LocalStorage to Dexie.js (IndexedDB)

Replace the custom IndexedDB wrapper with Dexie.js for more robust persistence, structured migrations, and reliable data integrity.

## User Review Required

> [!IMPORTANT]
> This change will migrate all existing financial data from `localStorage` to `IndexedDB` on the first launch. The original data will remain in `localStorage` as a safety backup but will no longer be updated.

- **Persistence Layer**: Moving from manual `indexedDB` calls to Dexie.js.
- **Migration**: Automated one-time migration from `localStorage`.
- **Offline Reliability**: Enhanced with `navigator.storage.persist()` where supported.

## Proposed Changes

### Storage & Persistence (`src/lib/db.ts`)
- Replace manual `openDB`, `getDBItem`, `setDBItem` with a `Dexie` database class.
- Define a versioned schema for all existing stores (`salary`, `subscriptions`, `khatabook`, `networth`, `nw_activity`, `settings`, `metadata`, `auth`, `ui_settings`).
- Implement `CozyDatabase` class extending `Dexie`.
- Update `migrateFromLocalStorage` to use Dexie for writing and provide validation checks.
- Add `requestPersistentStorage` utility to call `navigator.storage.persist()`.

### Store Integration (`src/lib/finance-store.ts`)
- Update `usePersisted` hook to use the new Dexie-based `db` instance.
- Ensure all calls to `getDBItem` and `setDBItem` (now internal to the Dexie setup or updated wrapper) are preserved in signature to avoid breaking components.
- Maintain the 500ms debounce for performance, though Dexie handles concurrent writes more gracefully.

### UI Integration (`src/routes/__root.tsx`)
- Call `requestPersistentStorage` on mount to ensure the browser prioritizes keeping the app's data.

## Technical Details
- **Schema**: Version 1 schema matching current store names.
- **Data Integrity**: Migrated data is validated by checking object keys before confirming the migration flag in `localStorage`.
- **Granular Updates**: Dexie allows for cleaner partial updates, though the current `usePersisted` pattern of saving the whole object will be maintained for architectural consistency as requested.

## Verification Plan

### Automated Tests
- Run logic tests: `bun test` to ensure calculations remain correct.
- E2E check: Verify the app loads and data persists across refreshes using Playwright.

### Manual Verification
1. Check that data from a previous version (if any) is correctly migrated to the new IndexedDB structure.
2. Verify that expansion states (Salary/Khatabook) are preserved.
3. Verify that new transactions are saved and survive a page reload.
4. Check browser console for "Storage is persistent" message.
