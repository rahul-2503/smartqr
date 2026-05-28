<p align="center">
  <img src="https://img.shields.io/badge/Azure-Functions-0078D4?style=for-the-badge&logo=azure-functions&logoColor=white" />
  <img src="https://img.shields.io/badge/Azure-Cosmos_DB-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" />
  <img src="https://img.shields.io/badge/Azure-Computer_Vision-5C2D91?style=for-the-badge&logo=microsoftazure&logoColor=white" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>

# 💊 SmartQR — Intelligent Medicine Verification & Transparency Platform

> **Scan. Verify. Trust.** — A cloud-native platform that bridges the trust gap between pharmaceutical manufacturers and consumers by making medicine verification instant, accessible, and foolproof.

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
- **Log individual batches** with manufacturing and expiry dates
- **Use AI-powered OCR** (Azure Computer Vision) to auto-extract dates from physical packaging — just snap a photo
- **Track every action** through an immutable audit log
- **Manage access** with Firebase-authenticated, organization-level role separation

### 📱 For Consumers (Public Scanner)
A simple, mobile-first web interface that allows **anyone** — patients, doctors, pharmacists — to:
- **Scan a barcode** on any medicine packaging
- **Instantly verify** product authenticity, batch details, and expiry status
- **Get color-coded safety alerts**: 🟢 Safe | 🟡 Expiring Soon | 🔴 Expired
- **Listen to results via voice** (Text-to-Speech) — critical for elderly and visually impaired users
- **Use OCR fallback** — if the barcode is damaged, take a photo of the text on the packaging

### 🧠 Hybrid Identification System
SmartQR handles **4+ real-world product identification scenarios**:

| Scenario | How SmartQR Handles It |
|---|---|
| ✅ Barcode intact | Instant scan → full product & batch details |
| 📸 Barcode damaged/torn | OCR camera extracts text from remaining packaging |
| ⌨️ No camera available | Manual entry fallback with intelligent search |
| 💊 Strip torn, no dates visible | Cell-level QR codes on individual tablets link to batch data |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CONSUMER PORTAL                       │
│  React 19 + Vite + Framer Motion                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │ QR/Barcode   │  │  OCR Text    │  │  Voice Output │   │
│  │ Scanner      │  │  Extraction  │  │  (TTS)        │   │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘   │
│         │                 │                               │
│         └────────┬────────┘                               │
│                  ▼                                        │
│         Azure Functions (Serverless API)                  │
│         10 API Endpoints + Firebase Auth Middleware       │
│                  │                                        │
│                  ▼                                        │
│         Azure Cosmos DB (NoSQL)                           │
│         5 Containers | Serverless Capacity                │
│                  │                                        │
│                  ▲                                        │
│         ┌───────┴────────┐                                │
│  ┌──────┴──────┐  ┌──────┴──────┐                        │
│  │ Manufacturer │  │ Azure CV    │                        │
│  │ Dashboard    │  │ OCR Engine  │                        │
│  └──────────────┘  └─────────────┘                        │
│                                                           │
│              MANUFACTURER PORTAL                          │
│  Firebase Auth | Role-Based Access | Audit Logging        │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 8, Framer Motion | Consumer & Manufacturer UI |
| **Styling** | Tailwind CSS 4 | Responsive, mobile-first design |
| **Backend** | Node.js, Azure Functions v4 | 10 serverless API endpoints |
| **Database** | Azure Cosmos DB (NoSQL, Serverless) | Products, Batches, Audit Logs, Manufacturers |
| **Authentication** | Firebase Auth + Firebase Admin SDK | JWT-based secure manufacturer access |
| **AI / OCR** | Azure Computer Vision (Read API v3.2) | Extracts expiry dates from medicine photos |
| **OCR Fallback** | Tesseract.js (Client-side) | Offline-capable text extraction for consumers |
| **Barcode Scanning** | html5-qrcode | Real-time 1D/2D barcode detection at 30 FPS |
| **Voice Output** | Web Speech API (SpeechSynthesis) | Reads results aloud for accessibility |
| **Hosting** | Azure Static Web Apps | Zero-config deployment with CI/CD |
| **QR Generation** | qrcode.react, html2canvas, JSZip | Generate downloadable QR sheets for batches |

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/getproduct/{barcode}` | Public | Look up product + all batches by barcode |
| `GET` | `/api/getbatch/{batchId}` | Public | Get batch details by batch ID (for QR scans) |
| `POST` | `/api/addproduct` | 🔒 Firebase | Register a new product |
| `POST` | `/api/addbatch` | 🔒 Firebase | Add a batch to an existing product |
| `DELETE` | `/api/deletebatch/{barcode}/{batchId}` | 🔒 Firebase | Remove a batch |
| `GET` | `/api/getauditlogs` | 🔒 Firebase | Fetch immutable operation history |
| `POST` | `/api/registermanufacturer` | 🔒 Firebase | Register a new manufacturer organization |
| `POST` | `/api/registerproduct` | 🔒 Firebase | Register product under manufacturer |
| `POST` | `/api/registerbatch` | 🔒 Firebase | Register batch under manufacturer |
| `GET` | `/api/getmanufacturerproducts` | 🔒 Firebase | Get all products for a manufacturer |

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
    "FIREBASE_PRIVATE_KEY": "<your-firebase-private-key>"
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
│
├── smartqr-api-node/                    # Azure Functions Backend
│   ├── src/
│   │   ├── functions/
│   │   │   ├── AddProduct.js            # Register new product
│   │   │   ├── AddBatch.js              # Add batch to product
│   │   │   ├── GetProduct.js            # Public product lookup
│   │   │   ├── GetBatch.js              # Public batch lookup (QR)
│   │   │   ├── DeleteProduct.js         # Delete product
│   │   │   ├── GetAuditLogs.js          # Immutable audit trail
│   │   │   ├── RegisterManufacturer.js  # Manufacturer onboarding
│   │   │   ├── RegisterProduct.js       # Manufacturer product registration
│   │   │   ├── RegisterBatch.js         # Manufacturer batch registration
│   │   │   └── GetManufacturerProducts.js  # Manufacturer product list
│   │   ├── utils/
│   │   │   └── auth.js                  # Firebase JWT verification middleware
│   │   └── db.js                        # Cosmos DB connection & container init
│   ├── host.json
│   ├── package.json
│   └── local.settings.json              # (gitignored) secrets
│
├── smartqr-frontend/                    # React + Vite Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx              # Marketing landing page
│   │   │   ├── Scanner.jsx              # Consumer barcode scanner + OCR
│   │   │   ├── About.jsx                # About page
│   │   │   ├── ProductDetail.jsx        # Product detail view
│   │   │   └── manufacturer/
│   │   │       ├── Manufacturer.jsx     # Auth gate (Login/Register/Dashboard)
│   │   │       ├── Login.jsx            # Firebase email/password login
│   │   │       ├── Register.jsx         # Manufacturer registration
│   │   │       └── Dashboard.jsx        # Full manufacturer operations dashboard
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Navigation bar
│   │   │   ├── Footer.jsx               # Site footer
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
│   │   ├── App.jsx                      # Router & route definitions
│   │   ├── main.jsx                     # App entry point
│   │   └── index.css                    # Global styles & design system
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
| **Organization Isolation** | Manufacturers can only access their own products and batches |
| **Secrets Management** | All API keys and connection strings stored in environment variables, never in source code |
| **Audit Trail** | Every create/update/delete action is logged with timestamp and user ID |
| **Consumer Access** | Product lookup endpoints are public (no auth needed) for frictionless verification |

---

## 🎯 Key Engineering Challenges Solved

1. **Unreliable barcode infrastructure** — Built a multi-layer fallback system (barcode → OCR → manual entry) so verification works even with damaged packaging.
2. **Real-time camera management** — Engineered a robust camera lifecycle with intelligent device selection, prioritizing physical webcams over virtual devices.
3. **Consumer/Manufacturer separation** — Designed a dual-portal architecture with shared backend but isolated authentication and access flows.
4. **Accessibility for elderly users** — Integrated Web Speech API for voice output and designed large, color-coded UI elements for at-a-glance safety status.
5. **Zero-cost scalability** — Used Azure Serverless (Functions + Cosmos DB Serverless) to keep the platform running within the Azure for Students free tier.

---

## 📄 License

This project is built for educational and portfolio purposes.

---

<p align="center">
  <b>Built to protect lives and restore trust in healthcare.</b><br/>
  <sub>Made with ❤️ using Microsoft Azure</sub>
</p>
