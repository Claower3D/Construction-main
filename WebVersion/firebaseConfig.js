// ========== FIREBASE CONFIG ==========
// Инициализация Firebase для QazGost AI
// Проект: estimateai-ndlmn

(function () {
    'use strict';

    const firebaseConfig = {
        apiKey: "AIzaSyBM-jen2IjO5vQCloOXOXmqqBhbTxiyVcA",
        authDomain: "estimateai-ndlmn.firebaseapp.com",
        projectId: "estimateai-ndlmn",
        storageBucket: "estimateai-ndlmn.firebasestorage.app",
        messagingSenderId: "1019825321473",
        appId: "1:1019825321473:web:23bb8b41e414241cc77200"
    };

    // Initialize Firebase (compat SDK)
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        window.firebaseAuth = firebase.auth();

        // Set language to Russian for SMS templates
        window.firebaseAuth.languageCode = 'ru';

        console.log('🔥 Firebase initialized successfully');
        console.log('🔐 Firebase Auth ready:', !!window.firebaseAuth);
    } else {
        console.warn('⚠️ Firebase SDK not loaded — running in DEMO mode');
        window.firebaseAuth = null;
    }

})();
