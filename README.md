# JustRide Admin & Staff Operations Portal

> Enterprise Operations, IoT Hardware Telemetry, Firmware Distribution, and Customer Care Console for JustRide Smart Mobility Platform.

[![React Version](https://img.shields.io/badge/react-19.x-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/vite-8.x-646CFF.svg)](https://vitejs.dev)
[![React Router](https://img.shields.io/badge/react--router--dom-7.x-CA4245.svg)](https://reactrouter.com)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](LICENSE)

---

## 📖 Overview

The **JustRide Admin & Staff UI** is a high-performance, dark-mode first, glassmorphism-styled operational dashboard built for administrators and customer support engineers.

### Core Portals:
1. **Admin Console (`ADMIN` Role)**:
   - **Fleet Telemetry Dashboard**: Real-time KPI summary, BLE device status distribution, active paired riders, and CSV data exports.
   - **Rider Management**: Multi-field search, pagination, account suspension/activation, and rider identity profiles.
   - **Staff Provisioning**: Dynamic employee ID generation, department access assignment (BLE/Hardware/Account), and credential issuance.
   - **Hardware Inventory**: BLE serial indexing, device provisioning, remote security block/unblock, and force-unlinking.
   - **OTA Firmware Studio**: Channel rollout manager (Stable/Beta/Canary), min supported base versioning, and binary deployment.
   - **Security & Audit Center**: Full audit logs with actor tracking, 24h security metric trends, and side drawer state diff visualizers.
2. **Staff & Support Operations (`HELPER` Role)**:
   - **Support Queue**: Ticket workload manager with priority classification (Critical/High/Medium/Low) and status filters.
   - **Diagnostics & Live Chat**: Message threads with customer, staff replies, one-click hardware block, and force-unlink controls.
   - **Operational Alerts**: Critical notification stream with unread markers and click-to-source inspection.

---

## 🛠️ Technology Stack

- **Framework**: React 19 with functional hooks and React Router v7
- **Bundler**: Vite 8 with hot module replacement (HMR) and optimized rollup production bundling
- **Routing**: `react-router-dom` with `BrowserRouter`, declarative `Routes`, `Route`, dynamic params (`useParams`), and `ProtectedRoute` guards
- **Authentication & Persistence**: `js-cookie` for secure token and role persistence (`SameSite: Lax`, 7-day expiration) + automatic `/api/admin/me` profile resolution
- **Styling**: Handcrafted Modern Vanilla CSS with HSL design system, Bento-box grids, glassmorphism, glowing micro-interactions, and Google Fonts (`Inter` & `Material Symbols`)
- **API Client**: Scalable Fetch-based HTTP layer with bearer token injection, proxy forwarding (`/api` -> `localhost:5000`), and unified error parsing

---

## 📂 Project Structure

```bash
Admin and helper UI/
├── justrideadminpage/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js           # Base HTTP client with cookie token management
│   │   │   └── services.js         # Domain API services (auth, users, devices, support, etc.)
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Sidebar.jsx     # Global persistent sidebar with React Router navigation
│   │   │       └── Sidebar.css
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global authentication, cookie tokens, & role toggles
│   │   ├── pages/
│   │   │   ├── admin/              # Admin pages (Dashboard, Users, Devices, Firmware, Logs)
│   │   │   ├── auth/               # LoginPage with credential presets
│   │   │   └── staff/              # Staff pages (SupportManagement, TicketDetail)
│   │   ├── App.jsx                 # Route manager with ProtectedRoute guards
│   │   ├── main.jsx                # Application root with BrowserRouter & AuthProvider
│   │   └── index.css               # Global tokens, typography, and dark theme palette
│   ├── index.html
│   ├── package.json
│   └── vite.config.js              # Vite server configuration with /api backend proxy
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Backend**: JustRide Backend API running on `http://localhost:5000`

### 2. Installation & Setup
```bash
# Navigate to the frontend workspace
cd "Admin and helper UI/justrideadminpage"

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The portal will be live at `http://localhost:5173`.

### 3. Production Build
```bash
npm run build
```

---

## 🗺️ Route Map

| URL Path | Component | Role | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | Public | Staff & Super Admin authentication |
| `/dashboard` | `AdminDashboard` | `ADMIN` | High-level fleet KPIs, charts, and device health |
| `/users` | `UsersManagement` | `ADMIN` | Rider directory with search and status actions |
| `/users/new` | `CreateUser` | `ADMIN` | Provision new rider account |
| `/users/:id` | `UserDetail` | `ADMIN` | Rider profile, paired telemetry, and saved locations |
| `/users/:id/activity` | `UserActivityLog` | `ADMIN` | User audit history timeline |
| `/helpers` | `SupportStaff` | `ADMIN` | Support staff fleet, workload, and metrics |
| `/helpers/new` | `ProvisionStaff` | `ADMIN` | Provision employee ID, corporate email & department |
| `/helpers/:id` | `HelperStaffDetail` | `ADMIN` | Employee workload analysis & suspension |
| `/devices` | `DeviceInventory` | `ADMIN` | BLE hardware fleet, block/unblock, force unlink |
| `/devices/:id` | `DeviceDetail` | `ADMIN` | Hardware specs, battery %, RSSI signal, push OTA |
| `/firmware` | `FirmwareManagement`| `ADMIN` | OTA release catalogue & channel distributions |
| `/firmware/new` | `NewFirmwareRelease`| `ADMIN` | Publish signed OTA firmware binary |
| `/audit-logs` | `AuditLogs` | `ADMIN` | Immutable security log inspector with state diffs |
| `/notifications` | `NotificationsAlerts`| All | Live operational alerts feed & click-to-source |
| `/support` | `SupportManagement` | `HELPER`/`ADMIN`| Support ticket queue with priority categorization |
| `/support/:id` | `TicketDetail` | `HELPER`/`ADMIN`| Ticket thread, customer diagnostics & actions |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
