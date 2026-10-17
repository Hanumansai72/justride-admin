# React + Vite

## Shared JustRide colours

`src/index.css` owns the palette used by every admin/helper page, shared component, and login screen. Background, surface, primary emerald, text, border, and warning colours match the mobile app's `AppColors` and the customer site. Red status text uses a lighter shade for readability on dark surfaces; solid danger actions use the app's red.

Use the existing CSS variables for colours and inline styles. Browser form controls and autofill also use the dark palette. Update the shared tokens to change the theme throughout the portal.

## Interested Users

Admin and helper list pages fetch 10 records per page, newest first. Interested Users refreshes back to page 1 so the latest submissions are visible. Staff and notifications include Previous/Next controls; staff totals cover the complete matching directory.

`/interested-users` shows early-interest submissions from the customer homepage. It uses the protected `/api/early-interest` endpoint and requires an ADMIN or HELPER login. The table shows name, email, city, purchase interest, notes, and submission time.

For local development with the backend running on port 5000, start the admin frontend in PowerShell with:

```powershell
$env:JUSTRIDE_API_PROXY_TARGET='http://127.0.0.1:5000'
npm run dev
```

Production uses the existing API URL; deploy the backend changes with the frontend to enable this endpoint there.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
