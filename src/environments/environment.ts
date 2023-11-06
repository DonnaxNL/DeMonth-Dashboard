// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
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

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
