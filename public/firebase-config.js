// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDq2AiS90quxL8Ck3HmwQ18PwspxS9iqeQ",
    authDomain: "ai-tools-directory.firebaseapp.com",
    databaseURL: "https://ai-tools-directory.firebaseio.com",
    projectId: "ai-tools-directory",
    storageBucket: "ai-tools-directory.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "G-XXXXXXXXXX" // Ganti dengan Measurement ID Google Analytics 4
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Inisialisasi Analytics
const analytics = firebase.analytics();
