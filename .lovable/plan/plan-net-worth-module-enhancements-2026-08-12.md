# Plan - Net Worth Module Enhancements

Complete the Net Worth module with activity tracking, bulk monthly updates, full asset management, and improved data portability.

## User Review Required

> [!IMPORTANT]
> For Backup/Restore, I will extend the existing Settings page to include "Export Data" and "Import Data" buttons. The export will be a single JSON file containing all application state (Salary, Subscriptions, Khatabook, and Net Worth).

- **Activity Feed**: Should it be a separate sub-tab in Net Worth or a scrollable section below assets? (Default: Scrollable section below assets).
- **Asset Ordering**: Manual drag-and-drop or alphabetical/value-based? (Default: Alphabetical for now).

## Proposed Changes

### 1. Finance Store (`src/lib/finance-store.ts`)
- Add `NW_ACTIVITY_KEY` and `NWActivity` type.
- Update `NetWorthAsset` to include `archived: boolean`.
- Enhance `useNetWorth`:
    - `addActivity(action: string)` helper.
    - `confirmRecurring(aid: string, eid: string, amount?: number)` to update `currentValue` and mark entry as not pending.
    - `skipRecurring(aid: string, eid: string)`.
    - `archiveAsset(id: string)`.
    - Alphabetical sorting for assets.
- Update `Settings` type: `hideBalances?: boolean`, `nwColumns: number` (2, 3, or 4).
- Add `useDataManagement` hook for Export/Import logic.

### 2. Net Worth Page (`src/routes/networth.tsx`)
- **Activity Section**: Add a simple chronological feed of `NWActivity`.
- **Monthly Update Workflow**: 
    - Add "Update Month" button in header.
    - Dialog showing all pending recurring entries for the current month.
    - Inline editing for amounts, confirm/skip buttons.
- **Asset Detail/Edit**:
    - Update `AssetCard` to show "Pending" badge.
    - Expand asset card or open dialog for full management (Edit name/icon/type/recurring, History, Archive).
- **Filtering**: Hide archived assets by default.

### 3. Settings Page (`src/routes/settings.tsx`)
- Add "Hide Balances" toggle.
- Add "Grid Columns" selector (2, 3, 4).
- Add "Data Management" section:
    - **Export**: Generates and downloads `ledger_backup_date.json`.
    - **Restore**: File input to upload and merge JSON data.

### 4. Persistence & Integrity
- Ensure `deleteAsset` doesn't lose history (suggest archiving instead).
- Validate negative amounts or empty strings in forms.

## Technical Details

- **Activity Logs**: `PPF contribution added`, `Monthly contribution confirmed`, etc.
- **Archiving**: Set `archived: true` on asset. Dashboard filters `!a.archived`.
- **Backup Schema**:
  ```json
  {
    "salary": { ... },
    "subscriptions": [ ... ],
    "khatabook": [ ... ],
    "networth": [ ... ],
    "nw_activity": [ ... ],
    "settings": { ... }
  }
  ```
