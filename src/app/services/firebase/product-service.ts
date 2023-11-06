import { Injectable } from "@angular/core";
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from "@angular/fire/firestore";

@Injectable({
    providedIn: 'root'
})
export class FirebaseProductService {
    collection = 'products'

    constructor(private afs: AngularFirestore) { }

    public getInventoryById(type: string, brand: string, id: string): AngularFirestoreDocument<any> {
        return this.afs.doc(`${this.collection}/${type}/${brand}/${id}`);
    }

    public getAllProductsFromType(type: string, brand: string): AngularFirestoreCollection {
        return this.afs.collection(`${this.collection}/${type}/${brand}`)
    }

    public getInventorySingleBrandById(id: string): AngularFirestoreDocument<any> {
        return this.afs.doc(`${this.collection}/${id}`);
    }

    public getAllProducts() {
        return this.afs.collection(`${this.collection}`);
    }

    public getAllMenstrualProducts() {
        return this.afs.collection(`${this.collection}`, ref => ref.where('type', '==', 'Menstrual'));
    }

    public getAllCareProducts() {
        return this.afs.collection(`${this.collection}`, ref => ref.where('type', '==', 'Care'));
    }

    public getAllSnacks() {
        return this.afs.collection(`${this.collection}`, ref => ref.where('type', '==', 'Snack'));
    }

    public updateProduct(type: string, brand: string, id: string, data: any) {
        let inventoryRef: AngularFirestoreDocument<any>
        if (brand) {
            inventoryRef = this.getInventoryById(type, brand, id)
        } else {
            //inventoryRef = this.getProductSingleBrandById(id)
        }
        const item = data

        return inventoryRef.set(item, { merge: true });
    }
}