# Local-First Architecture Refinement Plan

We will fix the UI unreliability and data persistence issues by implementing a robust local-first architecture that clearly separates UI state from financial data, while ensuring reliable, queued IndexedDB persistence.

## User Review Required

> [!IMPORTANT]
> - UI state (collapsed/expanded sections) will be moved to a separate `UI_KEY` store to prevent data race conditions between UI toggles and financial updates.
> - A centralized `WriteQueue` will be implemented to ensure IndexedDB writes are sequential, preventing data loss during rapid interactions.

- Does the separation of UI state (expansion states) from the main financial data meet your expectations?
- Are there any specific UI states besides "collapsed/expanded" that you want to ensure are NOT persisted with financial data?

## Technical Details

### 1. IndexedDB Reliability (`src/lib/db.ts`)
- Implement a `TaskQueue` for `setDBItem` to ensure sequential execution.
- Add a `version` or `timestamp` check for `getDBItem` to prevent stale data hydration if needed.

### 2. Finance Store Refactor (`src/lib/finance-store.ts`)
- **`usePersisted` Hook**:
    - Update to use the new queued `setDBItem`.
    - Improve hydration logic to be more resilient.
- **Data vs UI State**:
    - Remove `collapsed` properties from `Transaction`, `Category`, and `Person` types to keep the core data clean.
    - Create a new `useUIState` hook to manage expansion/UI states separately, using its own IndexedDB store (`ui_settings`).
- **Granular Updates**:
    - Ensure store updates use functional state updates `(prev => ...)` to avoid closure traps.

### 3. Route Refinement
- **`src/routes/index.tsx` & `src/routes/khatabook.tsx`**:
    - Remove the "Sync-on-Navigation" manual event dispatching and complex synchronization logic.
    - Use the new `useUIState` hook for expansion states.
- **`src/components/BottomTabs.tsx`**:
    - Remove `window.dispatchEvent` calls.

### 4. Verification Plan
- **Salary/Khatabook**: Rapidly toggle checkboxes and check if data persists across reloads.
- **Expand/Collapse**: Verify expansion state is preserved locally and persists across sessions, but doesn't block data writes.
- **Mobile/Desktop**: Test tab navigation speed and data integrity on simulated slow mobile environments.
- **Net Worth**: Verify historical entries are saved correctly during rapid bulk updates.
