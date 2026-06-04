<p align="center">
  <!-- Azure Cloud Services -->
  <img src="https://img.shields.io/badge/Azure-Functions-0078D4?style=for-the-badge&logo=azure-functions&logoColor=white" />
  <img src="https://img.shields.io/badge/Azure-Cosmos_DB-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" />
  <img src="https://img.shields.io/badge/Azure-OpenAI-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" />
  <img src="https://img.shields.io/badge/Azure-Computer_Vision-5C2D91?style=for-the-badge&logo=microsoftazure&logoColor=white" />
  <img src="https://img.shields.io/badge/Azure-SignalR-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" />
  <img src="https://img.shields.io/badge/Azure-Static_Web_Apps-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" />
  <!-- Frontend -->
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" />
  <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" />
  <!-- Backend & Auth -->
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <!-- AI & OCR -->
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/Tesseract.js-OCR-1a73e8?style=for-the-badge&logo=google&logoColor=white" />
  <!-- Scanning & QR -->
  <img src="https://img.shields.io/badge/html5--qrcode-Barcode_Scanner-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/jsQR-QR_Decoder-000000?style=for-the-badge&logo=qrcode&logoColor=white" />
  <!-- Utilities -->
  <img src="https://img.shields.io/badge/Nodemailer-Email_Alerts-22B573?style=for-the-badge&logo=minutemailer&logoColor=white" />
  <img src="https://img.shields.io/badge/Web_Speech_API-TTS-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <!-- Testing & CI/CD -->
  <img src="https://img.shields.io/badge/Playwright-E2E_Tests-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" />
  <img src="https://img.shields.io/badge/ESLint-Code_Quality-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" />
</p>

# 💊 SmartQR — Intelligent Medicine Verification & Transparency Platform

> **Scan. Verify. Trust.** — A cloud-native, AI-powered platform that bridges the trust gap between pharmaceutical manufacturers and consumers by making medicine verification instant, accessible, and foolproof.

---

## 🚨 The Problem India Is Facing

India produces **~20% of the world's generic medicines**, yet the country faces a devastating paradox:

- **📊 25% of medicines** sold in parts of India are estimated to be **counterfeit or substandard** (WHO).
- **💀 ~1 lakh deaths annually** in India are linked to counterfeit drugs.
- **🔍 Zero consumer verification** — when you buy medicine from a pharmacy, there is **no reliable way** to check if it's genuine.
- **📦 Damaged packaging** — if a tablet strip is torn, the **expiry date is lost forever**. There's no way to identify what the medicine is or when it expires.
- **👴 Elderly & illiterate users** — millions of Indians cannot read the tiny, often English-only text printed on medicine packaging.
- **📱 Existing barcodes are useless** — scanning a retail barcode just runs a Google search. It tells you **nothing** about manufacturing dates, batch authenticity, or expiry status.

**The core issue:** There is no bridge between the manufacturer who knows everything about a product and the consumer who knows nothing.

---

## 💡 Our Solution: SmartQR

SmartQR is a **dual-platform ecosystem** that solves this problem at both ends of the supply chain:

### 🏭 For Manufacturers (Enterprise Portal)
A secure, authenticated dashboard where pharmaceutical companies can:
- **Register products** with complete metadata (name, category, dosage, instructions, warnings)
- **AI-powered autofill** — just type a medicine name and AI fills in generic name, dosage, composition, side effects, and contraindications
- **Log individual batches** with manufacturing and expiry dates, with AI quality analysis
- **Use AI-powered OCR** (Azure Computer Vision) to auto-extract dates from physical packaging — just snap a photo
- **Track every action** through an immutable audit log
- **Get AI risk assessments** — organization-wide risk scoring, compliance alerts, and trend analysis
- **Converse with an AI Copilot** — a real-time, data-aware chat assistant that answers questions about your inventory, scans, and batch status
- **Receive automated expiry alerts** — daily cron job scans all batches and emails teams about expiring stock
- **Real-time scan notifications** — Azure SignalR broadcasts every consumer scan to the manufacturer dashboard live
- **View scan analytics** — geographic distribution, daily scan volume, top-scanned products
- **Manage access** with Firebase-authenticated, organization-level role separation (owner/employee RBAC)

### 📱 For Consumers (Public Scanner)
A simple, mobile-first web interface that allows **anyone** — patients, doctors, pharmacists — to:
- **Scan a barcode** on any medicine packaging
- **Instantly verify** product authenticity, batch details, and expiry status
- **Get color-coded safety alerts**: 🟢 Safe | 🟡 Expiring Soon | 🔴 Expired
- **Listen to results via voice** (Text-to-Speech) — critical for elderly and visually impaired users
- **Use OCR fallback** — if the barcode is damaged, take a photo of the text on the packaging
- **Check drug interactions** — AI-powered drug interaction checker (no login required)
- **Switch languages** — UI available in English, Hindi, Telugu, and Kannada

### 🧠 Hybrid Identification System
SmartQR handles **4+ real-world product identification scenarios**:

| Scenario | How SmartQR Handles It |
|---|---|
| ✅ Barcode intact | Instant scan → full product & batch details |
| 📸 Barcode damaged/torn | OCR camera extracts text from remaining packaging |
| ⌨️ No camera available | Manual entry fallback with intelligent search |
| 💊 Strip torn, no dates visible | Cell-level QR codes on individual tablets link to batch data |

---

## 🚀 Deployment Link
You can access the live application here:
👉 **https://lemon-bay-056bf6a00.7.azurestaticapps.net/**

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                       CONSUMER PORTAL                             │
│  React 19 + Vite 8 + Framer Motion + i18n (4 languages)          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ QR/Barcode    │  │  OCR Text    │  │  Voice Output (TTS)   │   │
│  │ Scanner       │  │  Extraction  │  │  4 Indian Languages   │   │
│  └───────┬───────┘  └──────┬───────┘  └────────────────────────┘  │
│          │                 │                                       │
│          └────────┬────────┘                                       │
│                   ▼                                                │
│   ┌───────────────────────────────────────────────────────────┐   │
│   │           Azure Functions v4 (Serverless API)             │   │
│   │  25 API Endpoints | Firebase Auth Middleware | RBAC       │   │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│   │  │ Product  │ │  Batch   │ │   Org    │ │  6 AI      │  │   │
│   │  │ CRUD     │ │  CRUD    │ │  Mgmt    │ │  Endpoints │  │   │
│   │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │   │
│   └───────────────────────┬───────────────────────────────────┘   │
│                           │                                       │
│              ┌────────────┼────────────────┐                      │
│              ▼            ▼                ▼                      │
│   ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐          │
│   │ Azure Cosmos │ │ Azure       │ │ Azure OpenAI /   │          │
│   │ DB (NoSQL)   │ │ SignalR     │ │ OpenAI GPT-4o    │          │
│   │ 8 Containers │ │ Real-time   │ │ 6 AI Features    │          │
│   └──────────────┘ └─────────────┘ └──────────────────┘          │
│              ▲                                                    │
│   ┌──────────┴───────────┐  ┌─────────────────────────────────┐  │
│   │ Manufacturer Portal  │  │ Background Services             │  │
│   │ Firebase Auth | RBAC │  │ Cron Jobs | Email Alerts        │  │
│   │ Audit Logging        │  │ Nodemailer | SignalR Broadcast  │  │
│   └──────────────────────┘  └─────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 8, Framer Motion | Consumer & Manufacturer UI with smooth animations |
| **Styling** | Tailwind CSS 4 | Responsive, mobile-first design system |
| **Backend** | Node.js, Azure Functions v4 | 25 serverless API endpoints |
| **Database** | Azure Cosmos DB (NoSQL, Serverless) | 8 containers: Products, Batches, Orgs, Scans, Audit Logs |
| **Authentication** | Firebase Auth + Firebase Admin SDK | JWT-based secure manufacturer access |
| **Authorization** | Custom RBAC Middleware | Owner/Employee role hierarchy with `verifyRole()` |
| **AI / LLM** | Azure OpenAI / OpenAI GPT-4o-mini | 6 AI-powered features (autofill, risk, copilot, insights, drug interactions, batch assist) |
| **AI / OCR** | Azure Computer Vision (Read API v3.2) | Extracts expiry dates from medicine photos |
| **OCR Fallback** | Tesseract.js v7 (Client-side) | Offline-capable text extraction for consumers |
| **Barcode Scanning** | html5-qrcode + jsQR + BarcodeDetector API | Multi-engine 1D/2D barcode detection pipeline |
| **Voice Output** | Web Speech API (SpeechSynthesis) | Reads results aloud in 4 Indian languages |
| **Internationalization** | Custom i18n (React Context) | English, Hindi, Telugu, Kannada translations |
| **Real-time** | Azure SignalR Service | Live scan event broadcasting to manufacturer dashboards |
| **Email Alerts** | Nodemailer (SMTP / Ethereal) | Automated expiry warning emails with styled HTML templates |
| **Scheduled Jobs** | Azure Functions Timer Trigger | Daily automated ledger scans for expiring batches |
| **Analytics** | Chart.js, Custom Analytics Engine | Scan volume trends, geo distribution, top products |
| **QR Generation** | qrcode.react, html2canvas, JSZip | Generate downloadable QR code sheets for batches |
| **CI/CD** | GitHub Actions + Azure Static Web Apps | E2E tests → auto-deploy pipeline |
| **E2E Testing** | Playwright | 9 test suites covering UI, i18n, accessibility, responsiveness |
| **Hosting** | Azure Static Web Apps + Azure App Service | Zero-config frontend deployment, scalable backend |

---

## 🤖 AI Tools Used

### AI Integrated Into the Product (6 Features)

| # | Feature | Endpoint | Model | How It's Used |
|---|---|---|---|---|
| 1 | **AI Product Autofill** | `POST /api/ai/autofill-product` | GPT-4o-mini | Manufacturer types a medicine name → AI auto-fills generic name, dosage, type, category, composition, storage, side effects, contraindications |
| 2 | **AI Batch Quality Assist** | `POST /api/ai/batch-assist` | GPT-4o-mini | AI analyzes batch registration against product metadata, flags shelf-life anomalies, MRP issues, CDSCO/FSSAI regulatory compliance concerns |
| 3 | **AI Risk Assessment** | `GET /api/ai/risk-assessment` | GPT-4o-mini | Full org-wide risk assessment: analyzes ALL products, batches, scans, audit logs → produces risk score (0–100), critical alerts, compliance summary |
| 4 | **AI Business Insights** | `GET /api/ai/insights` | GPT-4o-mini | Generates data-driven business intelligence summaries — scan trends, expiry alerts, geographic anomalies |
| 5 | **AI Copilot (Chat)** | `POST /api/ai/copilot` | GPT-4o-mini | Multi-turn conversational AI assistant with real-time org data context. Floating chat UI with quick action chips |
| 6 | **AI Drug Interaction Checker** | `POST /api/ai/drug-interaction` | GPT-4o-mini | Consumer-facing (no auth). Checks 2–5 medicines for interactions — returns severity, mechanism, effects, recommendations |

### AI Integration Architecture
- **Centralized AI client** (`src/utils/aiClient.js`) — supports **both Azure OpenAI and standard OpenAI** with automatic provider detection
- **Single-turn** (`callAI`) and **multi-turn** (`callAIChat`) patterns
- **Structured JSON output** mode using `response_format: { type: 'json_object' }`
- **Temperature tuning** per-feature: 0.2 for medical accuracy, 0.3 for structured data, 0.5 for copilot, 0.6 for creative insights
- **Token usage logging** for cost tracking and monitoring
- **OCR Pipeline**: Azure Computer Vision (server-side) + Tesseract.js (client-side) for multi-layer text extraction

### AI Tools Used During Development

| Tool | How It Was Used |
|---|---|
| **Google Gemini** | Architecture planning, code generation, debugging, README documentation, E2E test writing |
| **Azure OpenAI** | Integrated directly into the product for all 6 AI features listed above |
| **Azure Computer Vision** | OCR model used for manufacturing date extraction from medicine packaging photos |

---

## 📦 Dependencies

### Backend (`smartqr-api-node`)
| Package | Version | Purpose |
|---|---|---|
| `@azure/functions` | ^4.0.0 | Azure Functions runtime for serverless API |
| `@azure/cosmos` | ^4.9.3 | Azure Cosmos DB SDK for NoSQL database operations |
| `openai` | ^6.39.1 | OpenAI/Azure OpenAI SDK for all 6 AI features |
| `firebase-admin` | ^13.10.0 | Firebase Admin SDK for server-side JWT token verification |
| `jsonwebtoken` | ^9.0.3 | JWT generation for Azure SignalR authentication |
| `nodemailer` | ^8.0.10 | Email delivery for automated expiry alerts |
| `bcryptjs` | ^3.0.3 | Password hashing utilities |

### Frontend (`smartqr-frontend`)
| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.6 | UI framework (React 19 with concurrent features) |
| `react-dom` | ^19.2.6 | React DOM renderer |
| `react-router-dom` | ^7.15.1 | Client-side routing with nested layouts |
| `framer-motion` | ^12.38.0 | Animation library for page transitions and micro-interactions |
| `firebase` | ^12.13.0 | Firebase Auth client SDK for manufacturer login |
| `html5-qrcode` | ^2.3.8 | Real-time QR/barcode scanning via camera |
| `jsqr` | ^1.4.0 | Pure JavaScript QR code decoder (gallery upload fallback) |
| `tesseract.js` | ^7.0.0 | Client-side OCR engine for text extraction from images |
| `qrcode.react` | ^4.2.0 | React component for QR code generation |
| `html2canvas` | ^1.4.1 | Renders QR code sheets as downloadable images |
| `jszip` | ^3.10.1 | Compresses QR sheet bundles for batch download |
| `chart.js` | ^4.5.1 | Data visualization for scan analytics dashboard |
| `react-icons` | ^5.6.0 | Icon library (Heroicons 2) |
| `@microsoft/signalr` | ^10.0.0 | SignalR client for real-time scan event streaming |
| `tailwindcss` | ^4.3.0 | Utility-first CSS framework |

### Dev Dependencies
| Package | Version | Purpose |
|---|---|---|
| `@playwright/test` | ^1.60.0 | End-to-end testing framework |
| `vite` | ^8.0.12 | Build tool and dev server |
| `eslint` | ^10.3.0 | Code linting and quality enforcement |
| `azure-functions-core-tools` | ^4.x | Local Azure Functions development runtime |

---

## 📡 API Endpoints (25 Total)

### Consumer-Facing (Public — No Auth Required)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/getproduct/{barcode}` | Look up product + all batches by barcode |
| `GET` | `/api/getbatch/{batchId}` | Get batch details by batch ID (for QR scans) |
| `POST` | `/api/recordscan` | Record a consumer scan event with geolocation |
| `POST` | `/api/ai/drug-interaction` | AI-powered drug interaction checker (2–5 medicines) |

### Manufacturer — Product & Batch Management (🔒 Firebase Auth)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/addproduct` | Register a new consumer-facing product |
| `POST` | `/api/addbatch` | Add a batch to a consumer-facing product |
| `DELETE` | `/api/deletebatch/{barcode}/{batchId}` | Remove a consumer-facing batch |
| `POST` | `/api/registerproduct` | Register product under manufacturer organization |
| `POST` | `/api/registerbatch` | Register batch under manufacturer organization |
| `PUT` | `/api/updateProduct` | Update product details |
| `PUT` | `/api/updateBatch` | Update batch details |
| `DELETE` | `/api/deleteMedicineProduct/{productId}` | Delete a manufacturer product |
| `DELETE` | `/api/deleteSmartBatch/{batchId}` | Delete a manufacturer batch |
| `GET` | `/api/getmanufacturerproducts` | Get all products for a manufacturer |
| `GET` | `/api/getauditlogs` | Fetch immutable audit log history |
| `GET` | `/api/getscananalytics` | Scan analytics (daily volume, geo, top products) |

### Organization Management (🔒 Owner-Only)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/registerOrganization` | Create or join an organization workspace |
| `GET` | `/api/getOrganization` | Get organization profile + user role |
| `PUT` | `/api/updateOrganization` | Update organization details (owner-only) |
| `DELETE` | `/api/deleteOrganization` | Delete org + ALL associated data (owner-only) |
| `PUT` | `/api/updateMemberRole` | Promote/demote a member (owner-only) |
| `DELETE` | `/api/removeMember/{uid}` | Remove a member or leave organization |

### AI Endpoints (🔒 Firebase Auth, except drug interaction)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/autofill-product` | AI auto-fills pharmaceutical product data from medicine name |
| `POST` | `/api/ai/batch-assist` | AI quality analysis and compliance check for batch registration |
| `POST` | `/api/ai/copilot` | Multi-turn AI chat assistant with real-time org data context |
| `GET` | `/api/ai/insights` | AI-generated business intelligence summary |
| `GET` | `/api/ai/risk-assessment` | Full org-wide risk assessment with scoring |

### Real-time
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/negotiate` | Azure SignalR connection negotiation |

### Scheduled (Background)
| Trigger | Schedule | Description |
|---|---|---|
| Timer | `0 0 10 * * *` (Daily 10:00 AM) | Automated expiry alert scanner — emails all org members |

---

## 🚀 Deployment

### Live Application
> 🔗 **Frontend:** Hosted on [Azure Static Web Apps](https://azure.microsoft.com/en-us/products/app-service/static)  
> 🔗 **Backend API:** `https://smartqr-api-rahul-f8hpaqeudbdeesa5.centralindia-01.azurewebsites.net/api`

---

## 💻 How to Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) v4
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) (for deployment)
- A Firebase project (for authentication)
- An Azure Cosmos DB instance (Serverless mode recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/rahul-2503/smartqr.git
cd smartqr
```

### 2. Backend Setup (Azure Functions API)

```bash
cd smartqr-api-node
npm install
```

Create a `local.settings.json` file in this directory:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_URL": "<your-cosmos-db-endpoint>",
    "COSMOS_KEY": "<your-cosmos-db-primary-key>",
    "FIREBASE_PROJECT_ID": "<your-firebase-project-id>",
    "FIREBASE_CLIENT_EMAIL": "<your-firebase-service-account-email>",
    "FIREBASE_PRIVATE_KEY": "<your-firebase-private-key>",
    "AZURE_OPENAI_ENDPOINT": "<your-azure-openai-endpoint>",
    "AZURE_OPENAI_KEY": "<your-azure-openai-key>",
    "AZURE_OPENAI_DEPLOYMENT": "<your-deployment-name>",
    "AzureSignalRConnectionString": "<your-signalr-connection-string>"
  },
  "Host": {
    "CORS": "*"
  }
}
```

Start the backend:
```bash
func start
```
> The API will run on `http://localhost:7071`

### 3. Frontend Setup (React + Vite)

Open a **new terminal**:

```bash
cd smartqr-frontend
npm install
```

Create a `.env` file in this directory:

```env
VITE_AZURE_VISION_KEY=<your-azure-computer-vision-key>
```

Start the development server:
```bash
npm run dev
```
> The frontend will run on `http://localhost:5173`

---

## 📁 Project Structure

```
smartqr/
├── README.md
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml   # CI/CD: E2E tests → Deploy
│
├── smartqr-api-node/                    # Azure Functions Backend (25 endpoints)
│   ├── src/
│   │   ├── functions/
│   │   │   ├── AddProduct.js            # Register new consumer product
│   │   │   ├── AddBatch.js              # Add batch to consumer product
│   │   │   ├── GetProduct.js            # Public product lookup
│   │   │   ├── GetBatch.js              # Public batch lookup (QR)
│   │   │   ├── DeleteProduct.js         # Delete consumer product
│   │   │   ├── RegisterManufacturer.js  # Manufacturer onboarding
│   │   │   ├── RegisterProduct.js       # Manufacturer product registration
│   │   │   ├── RegisterBatch.js         # Manufacturer batch registration
│   │   │   ├── UpdateProduct.js         # Update product details
│   │   │   ├── UpdateBatch.js           # Update batch details
│   │   │   ├── DeleteMedicineProduct.js # Delete manufacturer product
│   │   │   ├── DeleteSmartBatch.js      # Delete manufacturer batch
│   │   │   ├── GetManufacturerProducts.js # Manufacturer product list
│   │   │   ├── GetAuditLogs.js          # Immutable audit trail
│   │   │   ├── GetScanAnalytics.js      # Scan analytics & geo data
│   │   │   ├── RecordScan.js            # Record consumer scan events
│   │   │   ├── Organizations.js         # Full org CRUD + member mgmt (6 endpoints)
│   │   │   ├── ExpiryAlerts.js          # Manual trigger + daily cron scheduler
│   │   │   ├── NegotiateSignalR.js      # SignalR connection negotiation
│   │   │   ├── AiAssist.js              # AI product autofill
│   │   │   ├── AiBatchAssist.js         # AI batch quality analysis
│   │   │   ├── AiCopilot.js             # AI conversational assistant
│   │   │   ├── AiInsights.js            # AI business insights
│   │   │   ├── AiRiskAssessment.js      # AI org-wide risk scoring
│   │   │   └── AiDrugInteraction.js     # AI drug interaction checker
│   │   ├── utils/
│   │   │   ├── auth.js                  # Firebase JWT verification + RBAC middleware
│   │   │   ├── aiClient.js              # Centralized Azure OpenAI / OpenAI client
│   │   │   ├── mailSender.js            # HTML email templates + Nodemailer
│   │   │   └── signalr.js               # SignalR connection & broadcast utilities
│   │   └── db.js                        # Cosmos DB connection & 8 container init
│   ├── host.json
│   ├── package.json
│   └── local.settings.json              # (gitignored) secrets
│
├── smartqr-frontend/                    # React 19 + Vite 8 Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx              # Marketing landing page
│   │   │   ├── Scanner.jsx              # Consumer barcode scanner + OCR (843 lines)
│   │   │   ├── About.jsx                # About page
│   │   │   ├── ProductDetail.jsx        # Consumer product detail + TTS
│   │   │   └── manufacturer/
│   │   │       ├── ManufacturerDashboard.jsx  # Enterprise dashboard (55KB)
│   │   │       ├── Products.jsx         # Product catalog management
│   │   │       ├── Batches.jsx          # Batch management + AI assist
│   │   │       ├── QRCenter.jsx         # QR code generation & download
│   │   │       ├── Settings.jsx         # Org settings + member management
│   │   │       ├── Login.jsx            # Firebase email/password login
│   │   │       └── Register.jsx         # Manufacturer registration
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Navigation bar with language switcher
│   │   │   ├── Footer.jsx               # Site footer
│   │   │   ├── AiCopilot.jsx            # Floating AI chat assistant
│   │   │   ├── LanguageSwitcher.jsx     # Multi-language dropdown (EN/HI/TE/KN)
│   │   │   ├── layouts/
│   │   │   │   ├── ConsumerLayout.jsx   # Consumer page wrapper
│   │   │   │   └── ManufacturerLayout.jsx # Manufacturer page wrapper
│   │   │   └── landing/                 # Landing page sections
│   │   │       ├── Hero.jsx
│   │   │       ├── HowItWorks.jsx
│   │   │       ├── Features.jsx
│   │   │       ├── ForConsumers.jsx
│   │   │       ├── ForManufacturers.jsx
│   │   │       └── CTA.jsx
│   │   ├── api/
│   │   │   └── products.js              # API client with Firebase token injection
│   │   ├── config/
│   │   │   └── firebase.js              # Firebase client initialization
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Firebase auth state provider
│   │   ├── i18n/
│   │   │   ├── LanguageContext.jsx       # Language state management
│   │   │   └── translations/
│   │   │       ├── en.json              # English translations
│   │   │       ├── hi.json              # Hindi translations (हिन्दी)
│   │   │       ├── te.json              # Telugu translations (తెలుగు)
│   │   │       └── kn.json              # Kannada translations (ಕನ್ನಡ)
│   │   ├── App.jsx                      # Router & route definitions
│   │   ├── main.jsx                     # App entry point
│   │   └── index.css                    # Global styles & design system
│   ├── e2e/                             # Playwright E2E Test Suite
│   │   ├── landing.spec.js              # Landing page tests
│   │   ├── scanner.spec.js              # Scanner functionality tests
│   │   ├── manufacturer.spec.js         # Manufacturer flow tests
│   │   ├── about.spec.js                # About page tests
│   │   ├── i18n.spec.js                 # Internationalization tests
│   │   ├── accessibility.spec.js        # Accessibility compliance tests
│   │   ├── responsive.spec.js           # Mobile/tablet/desktop responsive tests
│   │   ├── faq.spec.js                  # FAQ interaction tests
│   │   └── capture_snapshots.spec.js    # Visual regression snapshot tests
│   ├── index.html
│   ├── vite.config.js
│   ├── staticwebapp.config.json         # Azure SWA routing rules
│   └── package.json
```

---

## 🔐 Security

| Concern | How It's Handled |
|---|---|
| **API Protection** | All manufacturer endpoints require a valid Firebase JWT token |
| **Token Verification** | Firebase Admin SDK verifies tokens server-side on every request |
| **Role-Based Access Control** | Owner/Employee hierarchy — owner-only actions (delete org, manage members) enforced by `verifyRole()` middleware |
| **Organization Isolation** | All queries are scoped by `organizationDomain` — manufacturers can only access their own data |
| **Business Email Enforcement** | Personal emails (Gmail, Yahoo, etc.) are blocked from manufacturer registration |
| **Secrets Management** | All API keys and connection strings stored in environment variables, never in source code |
| **Audit Trail** | Every create/update/delete action is logged with timestamp, actor email, and action details |
| **Consumer Access** | Product lookup endpoints are public (no auth needed) for frictionless verification |
| **Input Sanitization** | All user inputs are validated and sanitized before database operations |

---

## 🧪 Testing

### E2E Test Suite (Playwright)
9 comprehensive test files run automatically in CI before every deployment:

| Test File | What It Tests |
|---|---|
| `landing.spec.js` | Landing page rendering, navigation, hero section, feature cards |
| `scanner.spec.js` | Scanner page load, camera permission handling, scan flow |
| `manufacturer.spec.js` | Login/register forms, dashboard access, product management |
| `about.spec.js` | About page content, team info, mission statement |
| `i18n.spec.js` | Language switching (EN→HI→TE→KN), translation accuracy |
| `accessibility.spec.js` | ARIA labels, keyboard navigation, color contrast, screen reader support |
| `responsive.spec.js` | Mobile (375px), Tablet (768px), Desktop (1280px) viewport testing |
| `faq.spec.js` | FAQ accordion interactions, content visibility |
| `capture_snapshots.spec.js` | Visual regression testing across all pages |

### CI/CD Pipeline
```
GitHub Push/PR → Install Dependencies → Install Playwright Browsers
    → Run All E2E Tests → Build Frontend → Deploy to Azure Static Web Apps
```
> Tests gate deployment — if any test fails, the deploy is blocked.

### Running Tests Locally
```bash
cd smartqr-frontend
npx playwright install chromium --with-deps
npx playwright test
npx playwright test --ui  # Interactive UI mode
```

---

## 🎯 Key Engineering Challenges Solved

1. **Unreliable barcode infrastructure** — Built a multi-layer fallback system (BarcodeDetector API → jsQR → html5-qrcode/ZXing → OCR → manual entry) so verification works even with damaged packaging.
2. **Real-time camera management** — Engineered a robust camera lifecycle with intelligent device selection, prioritizing physical webcams over virtual devices (OBS, phone-link cameras).
3. **Consumer/Manufacturer separation** — Designed a dual-portal architecture with shared backend but isolated authentication and access flows.
4. **Accessibility for elderly users** — Integrated Web Speech API for voice output in 4 Indian languages with automatic voice matching, plus large, color-coded UI elements.
5. **Zero-cost scalability** — Used Azure Serverless (Functions + Cosmos DB Serverless) to keep the platform running within the Azure for Students free tier.
6. **Multi-tenant data isolation** — All 8 Cosmos DB containers partitioned by `organizationDomain` — each org's data is cryptographically isolated at the database level.
7. **AI accuracy for medical data** — Fine-tuned temperature settings per AI feature (0.2 for drug interactions, 0.3 for product autofill) to prioritize medical accuracy over creativity.

---

## 👥 Team Details

**Team Name:** Gargantua

| Member | Role | Responsibilities |
|---|---|---|
| **B Rahul** | Full-Stack Developer & Project Lead | System architecture design, Azure Functions serverless backend, Cosmos DB schema design, React 19 frontend, 6 AI feature integrations (Azure OpenAI), Firebase authentication & RBAC, Azure SignalR real-time pipeline, email notification system, CI/CD pipeline, Playwright E2E test suite, multi-language i18n system, deployment & DevOps |

---

## 📄 License

This project is built for educational and portfolio purposes.

---

<p align="center">
  <b>Built to protect lives and restore trust in healthcare.</b><br/>
  <sub>Made with ❤️ using Microsoft Azure</sub>
</p>
