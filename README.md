# ITAM EMMAÜS

## 🚀 Lancer l'application en local

### Prérequis
- Node.js ≥ 20
- Un projet Firebase configuré (voir docs/SETUP_AUTH.md)

### Installation
```bash
npm install
```

### Configuration
Crée un fichier `.env.local` à la racine (voir `.env.example`).
La configuration Firebase est dans `firebase-applet-config.json`.

### Lancer en mode développement
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173` (port par défaut de Vite).

### Stack technique
- **Frontend** : React 19, TypeScript, Vite 6, Tailwind CSS v4
- **Backend** : Firebase (Firestore + Authentication)
- **UI** : Lucide React (icônes), Motion (animations), Recharts (graphes)
- **Exports** : jsPDF
- **Hébergement** : Netlify

## 🚀 Déploiement Firebase

### Prérequis (une seule fois)

```bash
npm install -g firebase-tools
firebase login
firebase use itam-emmaus
```

### Déployer les règles Firestore
⚠️ Important : à faire après TOUTE modification de firestore.rules ou firestore.indexes.json.

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Déployer l'application
```bash
npm run build
firebase deploy --only hosting
```

### Tout déployer
```bash
npm run build && firebase deploy
```
