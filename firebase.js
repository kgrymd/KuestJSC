var firebaseConfig = {
    authDomain: "protokuest.firebaseapp.com",
    projectId: "protokuest",
    storageBucket: "protokuest.appspot.com",
    messagingSenderId: "142041072324",
    appId: "1:142041072324:web:1af1243c74d8416d6fbf91"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore(); // Firestoreのインスタンスを作成