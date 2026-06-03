import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialisation standard pour itam-emmaus
const app = initializeApp(firebaseConfig);

// Base de données par défaut (Plan Spark)
export const db = getFirestore(app);

// Authentification
export const auth = getAuth(app);
