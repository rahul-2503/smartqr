# SmartQR: Combating Counterfeit Medicines in India 🏥🛡️

**SmartQR** is an intelligent, secure, and verifiable medicine tracking system designed to tackle one of the most critical healthcare challenges in India: the proliferation of counterfeit and substandard drugs.

---

## 🚨 The Problem: Counterfeit Medicines in India
India is known as the "pharmacy of the world," producing a massive portion of global generic drugs. However, this scale comes with a severe domestic challenge. Studies estimate that a significant percentage of medicines sold in the country are either fake, substandard, or expired. 

The consequences are devastating:
- **Patient Health Risks:** Ineffective treatments and severe adverse reactions.
- **Economic Loss:** Financial burden on families paying for fake drugs.
- **Loss of Trust:** Erosion of faith in the healthcare system and pharmaceutical brands.

Currently, when a patient buys medicine from a local pharmacy, they have **no reliable way to verify** if the drug is genuine or if it comes from the claimed manufacturer.

---

## 💡 Our Solution: SmartQR
**SmartQR** bridges the trust gap between pharmaceutical manufacturers and consumers using a secure, verifiable tracking system. 

We built a dual-facing platform:
1. **The Manufacturer Portal (Enterprise):** A secure dashboard for pharmaceutical companies to register master products and log individual batches. It includes advanced features like **AI-powered Expiry OCR** (using Azure Computer Vision) to automate batch entry, and an **Immutable Audit Log** to track every action.
2. **The Consumer Scanner:** A simple, web-based interface that allows patients, doctors, and pharmacists to scan a QR code on the medicine packaging. It instantly verifies the product's authenticity, checks the expiry date, and warns the user if the batch has been compromised or recalled.

By giving consumers the power to verify their medicines instantly, we render counterfeit packaging useless.

---

## 🚀 Deployment Link
You can access the live application here:
👉 **[Insert Deployment Link Here]**

*(Once deployed via Azure Static Web Apps, update this section with your `.azurestaticapps.net` or custom domain URL).*

---

## 💻 How to Run Locally

This project is structured as a monorepo containing a React frontend and an Azure Functions Node.js backend.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) (for running the backend locally)
- A GitHub account (for version control)

### 1. Clone the Repository
```bash
git clone https://github.com/rahul-2503/smartqr.git
cd smartqr
```

### 2. Setting up the Backend (API)
The backend is built with Azure Functions and connects to Cosmos DB.

```bash
cd smartqr-api-node
npm install
```
*Note: Ensure you have your `local.settings.json` file in the `smartqr-api-node` directory with your `COSMOS_URL` and `COSMOS_KEY` configured.*

Run the API locally:
```bash
func start
```
*The backend will typically run on `http://localhost:7071`.*

### 3. Setting up the Frontend
Open a new terminal window and navigate to the frontend directory.

```bash
cd smartqr-frontend
npm install
```
*Note: Make sure your `.env` file is set up with your Firebase Configuration and `VITE_AZURE_VISION_KEY`.*

Run the development server:
```bash
npm run dev
```
*The frontend will typically run on `http://localhost:5173`.*

---

## 🛠️ Technology Stack
- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Azure Functions (Serverless)
- **Database:** Azure Cosmos DB (NoSQL)
- **Authentication:** Firebase Auth
- **AI/OCR:** Azure Cognitive Services (Computer Vision)
- **Hosting:** Azure Static Web Apps

---

*Built to protect lives and restore trust in healthcare.*
