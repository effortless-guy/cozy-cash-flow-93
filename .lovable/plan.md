# Plan: Add Net Worth Tracker and Polish Khatabook

Implement a mobile-first Net Worth module and refine the Khatabook UI spacing.

## User Review Required

- **Asset Icons**: I'll use a set of standard Lucide icons for assets (e.g., Landmark, Stock, Gold, Home). Does that cover your needs?
- **Recurring Contributions**: The plan includes a "Pending" entry system for recurring contributions at the start of each month. Is this manual confirmation flow preferred over automatic entry creation?

## Proposed Changes

### 1. Store Update (src/lib/finance-store.ts)
- Add `NetWorthAsset` and `AssetEntry` types.
- Implement `useNetWorth` hook with persistence (`pft.networth.v1`).
- Support CRUD for assets and entries.
- Add logic for monthly recurring contributions (generating "pending" entries).

### 2. Navigation (src/components/BottomTabs.tsx)
- Add "Net Worth" tab with a `PieChart` or `Gem` icon between Khatabook and Settings.

### 3. Net Worth Route (src/routes/networth.tsx)
- **Home Screen**:
    - Total Net Worth header with monthly change.
    - Responsive grid of asset tiles (configurable columns).
    - "Add Asset" FAB.
- **Asset Detail Screen**:
    - Current value management.
    - Contribution history (reverse chronological).
    - Add/Edit/Delete entry support.
- **Forms**:
    - Simple asset creation (Name, Type, Icon, Initial Value, Recurring options).
    - Entry management.

### 4. Settings Update (src/routes/settings.tsx)
- Add control for Net Worth asset grid columns (2 or 3).

### 5. Khatabook Polish (src/routes/khatabook.tsx)
- Reduce the gap between the summary header and the first person card.

## Technical Details

- **Storage**: `localStorage` (via `usePersisted` helper).
- **Architecture**: Follow existing TanStack Router and Lucide icon patterns.
- **Styling**: Tailored with Tailwind CSS for an "app-like" feel, using `rounded-2xl` and `bg-muted/30`.
