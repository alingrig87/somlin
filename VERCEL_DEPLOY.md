# 🚀 Ghid Deploy pe Vercel - Somlin

## Structura Proiectului

```
somlin/
├── frontend/          # React + Vite app
├── api/               # Serverless functions (Python)
│   └── ask-question.py
└── vercel.json        # Configurație Vercel
```

## 📋 Pași pentru Deploy

### 1. Instalare Vercel CLI (Opțional)

```bash
npm i -g vercel
```

### 2. Login Vercel

```bash
vercel login
```

### 3. Deploy din Root Directory

```bash
cd D:\somlin
vercel
```

Sau conectează direct GitHub repo pe [vercel.com](https://vercel.com)

## ⚙️ Configurare Vercel Dashboard

### 1. Conectare GitHub Repository

1. Mergi pe [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Conectează GitHub repository
4. Selectează repository-ul `somlin`

### 2. Configurare Build Settings

- **Framework Preset**: Vite
- **Root Directory**: `.` (root)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd frontend && npm install`

### 3. Environment Variables

În **Project Settings → Environment Variables**, adaugă:

```
GEMINI_API_KEY=your-gemini-api-key-here
```

**Important**: 
- Variabilele sunt disponibile în serverless functions
- Nu expune chei API în frontend!

## 📁 Structura Fișierelor

### `vercel.json` (root)
Configurație pentru deploy-ul complet (frontend + API)

### `frontend/vercel.json`
Configurație specifică pentru frontend

### `api/ask-question.py`
Serverless function pentru endpoint-ul `/api/ask-question`

### `api/requirements.txt`
Dependențe Python pentru serverless functions

## 🔧 Verificare Local

### Test Build

```bash
cd frontend
npm install
npm run build
```

### Test Serverless Function (Local)

```bash
vercel dev
```

Aceasta va simula environment-ul Vercel local și va permite testarea serverless functions.

## 🌐 URL-uri după Deploy

- **Production**: `https://your-project.vercel.app`
- **API Endpoint**: `https://your-project.vercel.app/api/ask-question`
- **Frontend**: `https://your-project.vercel.app`

## 🔍 Debugging

### Verifică Logs

```bash
vercel logs
```

Sau în Dashboard: **Deployments → Select Deployment → Functions → View Logs**

### Probleme Comune

#### Build Fails
- Verifică că toate dependențele sunt în `package.json`
- Rulează `npm install` local și verifică erorile
- Verifică că `vite.config.js` este configurat corect

#### API Function Nu Funcționează
- Verifică că `GEMINI_API_KEY` este setată în Environment Variables
- Verifică logs-urile în Vercel Dashboard
- Testează local cu `vercel dev`

#### CORS Errors
- Verifică că `Access-Control-Allow-Origin` este setat în serverless function
- Verifică că frontend-ul folosește URL-ul corect

## 📝 Checklist Pre-Deploy

- [ ] `package.json` are toate dependențele
- [ ] `vite.config.js` configurat corect
- [ ] `GEMINI_API_KEY` setată în Vercel Dashboard
- [ ] Build rulează local fără erori (`cd frontend && npm run build`)
- [ ] Testat local (`npm run dev`)
- [ ] `.env` nu este commit-at (în `.gitignore`)
- [ ] `vercel.json` configurat corect

## 🚀 Deploy Automat

După conectarea GitHub repository-ului, Vercel va face deploy automat la fiecare push pe branch-ul principal!

## 🔗 Link-uri Utile

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Docs](https://vercel.com/docs)
- [Vercel Python Runtime](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

---

**Gata!** Acum poți deploy aplicația pe Vercel! 🎉
