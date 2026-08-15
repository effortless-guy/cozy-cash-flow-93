# Testing and Quality Assurance Plan

Implement a lightweight regression test suite focusing on core financial logic and mobile PWA reliability.

## Proposed Changes

### 1. Test Infrastructure
- Configure **Vitest** for unit and integration testing.
- Set up **JSDOM** and **React Testing Library** for component/hook testing.
- Implement **Playwright** scripts for end-to-end smoke testing of PWA features.

### 2. Automated Tests
- **Logic Helpers**: Verify core calculations for Salary, Khatabook, and Net Worth to ensure accuracy.
- **Finance Store**: Test persistence layers (IndexedDB) and state management hooks (e.g., `useSalary`).
- **Smoke Tests**: Automate tab switching, theme persistence, and expand/collapse behavior checks via Playwright.

### 3. Manual Quality Assurance
- **PWA Checklist**: Provide a standardized `PWA_CHECKLIST.md` for manual verification of offline access and home-screen installation.

## Technical Details
- **Test Runner**: Vitest (fast, Vite-native).
- **Mocking**: Custom IndexedDB mocks to ensure deterministic data layer tests.
- **E2E**: Playwright scripts located in `/tmp/browser/regression/` for safe execution in the sandbox.
- **Scripts**: Added `npm test` to `package.json` for CI readiness.
