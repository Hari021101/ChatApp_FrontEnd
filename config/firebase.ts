import { initializeApp } from "@firebase/app";
import { getAuth } from "@firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager 
} from "@firebase/firestore";
import { getStorage } from "@firebase/storage";
import "react-native-get-random-values";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChwwrx5Tk6DLD_xD5zcA1U7dosUKUVNUw",
  authDomain: "chatapp-5e464.firebaseapp.com",
  projectId: "chatapp-5e464",
  storageBucket: "chatapp-5e464.firebasestorage.app",
  messagingSenderId: "724340910498",
  appId: "1:724340910498:web:27f5731cd5cb76063f6afb",
  measurementId: "G-E1LE41V5F6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Offline Persistence and Network Compatibility
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({})
  }),
  experimentalAutoDetectLongPolling: true, 
});

export const auth = getAuth(app);
export { db };
export const storage = getStorage(app);

export default app;
