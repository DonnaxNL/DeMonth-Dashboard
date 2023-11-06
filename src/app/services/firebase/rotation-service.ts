import { Injectable } from "@angular/core";
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from "@angular/fire/firestore";

@Injectable({
    providedIn: 'root'
})
export class FirebaseRotationService {
    collection = 'box-rotation'

    constructor(private afs: AngularFirestore) { }

    public getBoxRotation(id: string): AngularFirestoreDocument<any> {
        return this.afs.doc(`${this.collection}/${id}`);
    }

    public createRotation(id: string, data: any) {
        this.afs.collection(`${this.collection}`).doc(id).set(data);
    }

    public updateRotation(id: string, data: any) {
        let inventoryRef: AngularFirestoreDocument<any> = this.getBoxRotation(id)
        const item = {
            products: data.products
        }

        return inventoryRef.set(item, { merge: true });
    }
}