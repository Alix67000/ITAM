# ITAM EMMAÜS

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
