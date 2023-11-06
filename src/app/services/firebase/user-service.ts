import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserData } from 'src/app/models/userdata';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    collection = 'userdata'

    constructor(
        public afs: AngularFirestore,
        private afAuth: AngularFireAuth) { }

    // UserData
    public getUserInfoRefByUID(uid: string): AngularFirestoreDocument<UserData> {
        return this.afs.doc(`${this.collection}/${uid}`);
    }

    public update(uid, item) {
        const userDataRef: AngularFirestoreDocument<any> = this.getUserInfoRefByUID(uid);
        return userDataRef.set(item, { merge: true });
    }

    public updateCycle(uid, cycleDays, cycleDate) {
        const userDataRef: AngularFirestoreDocument<any> = this.getUserInfoRefByUID(uid);
        var item = {
            cycleDetails: {
                cycleDays: cycleDays,
                cycleDate: cycleDate
            }
        }
        return userDataRef.set(item, { merge: true });
    }

    public updatePoints(uid, current, lifetime) {
        const userDataRef: AngularFirestoreDocument<any> = this.getUserInfoRefByUID(uid);
        var item = {
            points: {
                current: current,
                lifetime: lifetime
            }
        }
        return userDataRef.set(item, { merge: true });
    }

    public getUser(uid: string) {
        return this.afs.doc(`${this.collection}/${uid}`).ref.get().then(async user => {
            if (!user.exists) {
                //console.error('Error getting documents', user.id);
                return null
            } else {
                const item = user.data()
                return item
            }
        }).catch(async (err: any) => {
            console.error('Error getting documents', err);
            return null
        })
    }
}