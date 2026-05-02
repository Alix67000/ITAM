import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialisation standard pour itam-emmaus
const app = initializeApp(firebaseConfig);

// Base de données par défaut (Plan Spark)
export const db = getFirestore(app);

console.log('🔥 Firebase itam-emmaus initialisé (Default DB)');
