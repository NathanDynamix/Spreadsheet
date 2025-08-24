import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup ,sendPasswordResetEmail} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyATOU9t_46eaYsZYofZUrfh5h_MTC7LUNs",
  authDomain: "spreadsheet-f6c94.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup ,sendPasswordResetEmail};