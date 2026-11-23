# Salryn Cafe — Jane Frontend Trial

**Status:** BOOTSTRAP ONLY — the frontend has not been implemented or browser-tested.

**Purpose:** A clean-room, independent frontend design and interaction trial. This **public** repository is the destination for Kirion-Jane's alternative Cafe UI, separate from the existing ISO frontend and the production/backend repositories.

## Engineering target

Build a usable, responsive React + TypeScript + Vite **design-preview** experience for cafe operators, including a coherent shell and working POS → Orders → Kitchen workflow first, then broader menu, recipes, inventory, payments/shift, bookings, staff, reporting and administration screens.

Use realistic **synthetic** sample data and clearly label every simulated workflow **“Design Preview — Sample Data Only”**. No actual orders, financial records, licenses, backups, or customer information may be modified. Existing backend/business rules must be consulted through authorized **read-only** access; do not infer that this public repository contains their source.

### Security and publication limits

- This repository is **public**. Do **not** copy files, assets, customer data, credentials, internal reports, or other restricted content from private repositories unless separately authorized for public release.
- Do not copy Antigravity's frontend implementation. Independent implementation and reproducible comparison are required.
- Do not modify the actual Cafe Host, databases, Central server, Android, installer, or production environment.
- Preview interaction is not live backend acceptance; label evidence accordingly.

## Implementation path

1. Scaffold a new React + TypeScript + Vite project **in this repository**. Do not import a private repository history.
2. Build the shared Cafe shell with original visual design and accessible desktop/tablet/mobile navigation.
3. Implement a coherent POS → Orders → Kitchen flow with synthetic state, modifiers, a preserved cart, order progression, and preview receipts.
4. Implement additional Cafe operator capabilities according to actual backend-supported contracts (verified privately).
5. Run the app in a real browser at **1366×768**, **1024×768**, and **390×844**. Record screenshots and verify primary interactions.
6. Run and record actual typechecking, tests, and build results. Never claim success for checks not run.

## Collaboration and review

Kirion-Jane currently has **read-only** access to this repository. Until the owner grants write access and Jane accepts, Jane should fork this public repository, implement the trial in her own fork, and open a **draft pull request** targeting this repository's `main`. Do not publish using someone else's credentials or imply Jane has push access.

The code writer provides tested candidate changes and evidence; the owner performs acceptance. No autonomous merge or production integration.

## Current files

This README initializes the empty repository for the independent trial. **No working frontend has been delivered yet.** The implementation task is tracked in GitHub Issues.
