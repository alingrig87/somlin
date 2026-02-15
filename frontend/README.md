# Somlin Frontend - Formular Somn Copii

Aplicație React cu Vite pentru colectarea datelor despre somnul copiilor (0-4 ani).

## 🚀 Quick Start

### Instalare dependențe
```bash
npm install
```

### Development
```bash
npm run dev
```
Aplicația va rula pe `http://localhost:3000`

### Build pentru producție
```bash
npm run build
```

### Preview build
```bash
npm run preview
```

## 📋 Funcționalități

- ✅ Formular complet pentru date somn copii (0-4 ani)
- ✅ Validare câmpuri
- ✅ Logică dinamică bazată pe vârstă
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Export JSON cu datele completate
- ✅ Structură JSON pentru răspunsuri/situații

## 🎨 Tehnologii

- **React 18** - UI library
- **Vite** - Build tool rapid
- **Tailwind CSS** - Styling
- **React Hook Form** - Form management
- **date-fns** - Manipulare date

## 📁 Structură

```
frontend/
├── src/
│   ├── components/
│   │   ├── SleepForm.jsx      # Formular principal
│   │   └── FormSuccess.jsx     # Pagină succes
│   ├── data/
│   │   └── sleepResponses.json # Răspunsuri pentru situații
│   ├── App.jsx                 # Component principal
│   ├── main.jsx                # Entry point
│   └── index.css               # Stiluri globale
├── package.json
└── vite.config.js
```

## 📝 Câmpuri Formular

- **Vârsta copilului** (0-48 luni)
- **Data**
- **Ora culcării** (seară)
- **Ora trezirii** (dimineață)
- **Număr de somnuri** (dinamic bazat pe vârstă)
- **Ore somnuri** (dinamic)
- **Durată totală somn** (ore)
- **Calitatea somnului**
- **Culcat de** (părinte, bunic, etc.)
- **Locul de somn** (pat propriu, cu părinții, etc.)
- **Rutină pre-somn** (checkbox-uri multiple)
- **Probleme** (checkbox-uri multiple)
- **Observații** (text liber)

## 🔄 Logică Dinamică

- Numărul de somnuri se ajustează automat în funcție de vârstă
- Câmpurile pentru ore somnuri apar automat în funcție de numărul de somnuri
- Validare în timp real

## 📊 JSON Output

Formularul generează un JSON cu toate datele completate, inclusiv:
- Date procesate (vârsta în ani, timestamp, etc.)
- Array-uri pentru rutină, probleme, ore somnuri
- Format structurat pentru procesare ulterioară

## 🎯 Deployment

Vezi `../VERCEL_SETUP.md` pentru instrucțiuni de deployment pe Vercel.
