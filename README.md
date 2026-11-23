# Salryn Cafe · Independent Frontend Preview

Original, public-safe **React 19 + TypeScript + Vite** Cafe frontend design trial for Kirion-Jane. This repository contains no production Cafe source, database, backend services, customer records, passwords, private skill files, or restricted brand assets. It is not a deployable POS or fiscal system.

**Visible throughout the app:** Design Preview — Sample Data Only

## Start

Requires Node.js 22 or newer and npm.

1. Run `npm ci` (dependencies are pinned in the committed `package-lock.json`).
2. Run `npm run dev`.
3. Open the URL printed by Vite (expected default: `http://localhost:5173`; verify locally).
4. Change sample situations from the top toolbar and use the menu, cart, orders and kitchen screens.

## Checks

- `npm run typecheck` — strict TypeScript checking.
- `npm test` — pure domain tests with Node 22's TypeScript stripping, no browser.
- `npm run build` — TypeScript and Vite production bundle.
- `npx playwright install chromium` — install test browser when needed.
- `npm run test:e2e` — real browser journeys at 1366×768, 1024×768 and 390×844.
- A PR workflow uses the pinned npm lockfile, checks code and runs the browser scenarios, retaining browser screenshots and trace evidence.

## Current checkpoint: J1 + J2

- Responsive app shell, route navigation and both appearance modes.
- Operator context and resettable sample situations.
- Searchable menu and categories; sizes and priced modifiers.
- Cart quantity controls and preservation across route navigation.
- Simulated cash checkout with a synchronous repeated-submit guard.
- Preview receipt reflecting the exact cart and tender change.
- Orders listing and detail drawer.
- Kitchen tickets and New → Preparing → Ready → Completed workflow.
- Manila time, PHP formatting, native dialogs and keyboard controls.
- No backend or network services are accessed for business operations.

### Try a complete sample journey

Visit Register → customize a Honey Oat Latte (Large, Oat milk, Vanilla) → add a Butter Croissant → visit Orders → Kitchen → return to Register → check that the cart still contains both items → enter cash given of ₱1,000 → complete the **sample** checkout → verify the sample total (₱380) and change (₱620) → check Orders and Kitchen for the new ticket. No real records change.

### Preview limitations and next bounded slices

These are intentionally **in-memory** sample business records: refreshing the browser starts a new preview, and no sample payments or stock movements are persisted. Only the visual appearance preference uses localStorage. Role selection is illustrative and is **not** actual authorization; when integrating a real backend, all permission-gated actions must come from server-provided capabilities. Sample receipts are visibly **not tax receipts**. Do not treat sample checkout success as proof of real payment safety.

Pending J3–J7: menu authoring, ingredients/recipes/stock, sales/shifts/refunds/receivables, delivery/bookings/events/staff/printing, reporting/administration, and independent contract plus cross-browser acceptance. No production integration or merge is authorized.

## Mission

Tracked at [Issue #1](https://github.com/Kirch-Nairu/cafe-ui-test-front-on-kirion.jane/issues/1). Source is newly implemented for the public trial. Private reference repositories and the supplied private skill ZIP are not copied here.
