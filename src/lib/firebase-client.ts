/* import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDrfJPSi2lGMxQADC-rRKhnaRhoKKQ8XVI",
  authDomain: "barber-2818f.firebaseapp.com",
  projectId: "barber-2818f",
  storageBucket: "barber-2818f.firebasestorage.app",
  messagingSenderId: "1089840482831",
  appId: "1:1089840482831:web:8a34387908284d3c12317a",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
auth.languageCode = "pt-BR" // Changed to Portuguese Brazil

export { auth, app }
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDrfJPSi2lGMxQADC-rRKhnaRhoKKQ8XVI",
  authDomain: "barber-2818f.firebaseapp.com",
  projectId: "barber-2818f",
  storageBucket: "barber-2818f.appspot.com", // ✅ CORRIGIDO AQUI
  messagingSenderId: "1089840482831",
  appId: "1:1089840482831:web:8a34387908284d3c12317a",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
auth.languageCode = "pt-BR";

export { auth, app };
