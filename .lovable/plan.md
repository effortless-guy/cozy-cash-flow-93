# Plan: Migration to IndexedDB and Local-First Enhancements

Transition the application from `localStorage` to `IndexedDB` for improved scalability, performance, and reliability, while maintaining a strictly local-first, offline-ready architecture.

## Proposed Changes

### Storage Layer (`src/lib/db.ts`)
- Implement a lightweight wrapper for `IndexedDB` (using native API or a tiny helper).
- Define a schema that mirrors the existing `localStorage` keys as object stores:
    - `salary`
    - `subscriptions`
    - `khatabook`
    - `networth`
    - `nw_activity`
    - `settings`
- Add a migration utility to transfer existing `localStorage` data to `IndexedDB` on first run.

### Data Management Logic (`src/lib/finance-store.ts`)
- Update `loadJSON` and `saveJSON` (or replace them) to interact with the new `IndexedDB` layer.
- Refactor `usePersisted` to handle asynchronous `IndexedDB` operations, ensuring UI stays responsive during data access.
- Ensure the `useDataManagement` hook (Export/Import) continues to generate human-readable JSON files, now pulling from the consolidated `IndexedDB` state.

### User Interface (`src/routes/settings.tsx`)
- Enhance the Data section to clearly state the "Local-First / Offline" nature of the app.
- Maintain the current Export/Import flow, ensuring it remains simple and non-encrypted as requested.

## Technical Details
- **IndexedDB Schema**: Versioned database "LedgerDB" with stores for each data category.
- **Async Handling**: Since `IndexedDB` is asynchronous, `usePersisted` will use a loading state to prevent hydration mismatches and ensure data is ready before rendering.
- **Privacy**: No external API calls or tracking will be added; all financial data remains on the device.
- **Export Format**: Standard JSON `{"salary": ..., "subscriptions": ..., ...}`.

## Constraints & Considerations
- `localStorage` has size limits (usually ~5MB); `IndexedDB` provides significantly more space for long-term financial history.
- The transition must be seamless for existing users (auto-migration).
- PWA manifests and Service Workers already support offline use; the focus here is strictly on the data persistence layer.
