import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { environment } from 'src/environments/environment';
import { NgxAuthFirebaseUIModule } from 'ngx-auth-firebaseui';

@NgModule({
    imports: [
        NgxAuthFirebaseUIModule.forRoot(environment.firebaseConfig, undefined, environment.authConfig),
        AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFireAuthModule,
        AngularFireModule,
        AngularFirestoreModule,
        AngularFireDatabaseModule,
        AngularFireFunctionsModule,
    ],
    exports: [
        NgxAuthFirebaseUIModule,
        AngularFireModule,
        AngularFirestoreModule,
        AngularFireAuthModule,
        AngularFireDatabaseModule,
        AngularFireFunctionsModule,
    ]
})

export class FirebaseModule {
}