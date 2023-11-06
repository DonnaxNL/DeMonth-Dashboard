export const environment = {
  production: true,
  firebaseConfig: {
    apiKey: "AIzaSyCz7MNsr3ZKeKFPAtDe3pjhilHT3RPNWOA",
    authDomain: "demonth-55207.firebaseapp.com",
    databaseURL: "https://demonth-55207.firebaseio.com",
    projectId: "demonth-55207",
    storageBucket: "demonth-55207.appspot.com",
    messagingSenderId: "737770166448",
    appId: "1:737770166448:web:ab80b14e5c59f039848375",
    measurementId: "G-X32671LRDR"
  },
  authConfig: {
    enableFirestoreSync: true, // enable/disable autosync users with firestore
    toastMessageOnAuthSuccess: false, // whether to open/show a snackbar message on auth success - default : true
    authGuardFallbackURL: '/login', // url for unauthenticated users - to use in combination with canActivate feature on a route
    authGuardLoggedInURL: '/', // url for authenticated users - to use in combination with canActivate feature on a route
  }
};
