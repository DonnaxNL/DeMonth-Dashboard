import { Injectable } from "@angular/core";
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from "@angular/fire/firestore";

@Injectable({
    providedIn: 'root'
})
export class FirebaseInventoryService {
    collection = 'inventory'
    amounts = 'amount'
    remaining = 'remaining'

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
    // Update inventory amount
    public updateProductInventory(data: any, id: string, type?: string, brand?: string): Promise<any> {
        let inventoryRef: AngularFirestoreDocument<any>
        if (brand) {
            inventoryRef = this.getInventoryById(type, brand, id)
        } else {
            inventoryRef = this.getInventorySingleBrandById(id)
        }
        const item = data

        return inventoryRef.set(item, { merge: true });
    }

    // Get inventory amounts of all products
    public getInventory(type: string): AngularFirestoreDocument<any> {
        return this.afs.doc(`${this.collection}/${type}`);
    }

    public updateInventory(type: string, data: any) {
        const inventoryRef: AngularFirestoreDocument<any> = this.getInventory(type)
        const item = data

        return inventoryRef.set(item, { merge: true });
    }

    //
    public getInventoryItems(type: string) {
        return this.afs.doc(`${this.collection}/${type}`).ref.get().then(async inventory => {
            if (!inventory.exists) {
                console.error('Error getting documents', inventory.id);
                return null
            } else {
                const item = inventory.data()
                return item
            }
        }).catch(async (err: any) => {
            console.error('Error getting documents', err);
            return null
        })
    }

    // Get inventory amounts of all products
    public getProducts(type: string): AngularFirestoreDocument<any> {
        return this.afs.doc(`products/${type}`);
    }

    public getAllProductsFromTypeById(type: string, brand: string, id: string): AngularFirestoreDocument<any> {
        return this.afs.doc(`products/${type}/${brand}/${id}`)
    }

    public getProductSingleBrandById(id: string): AngularFirestoreDocument<any> {
        return this.afs.doc(`products/${id}`);
    }

    // public updateProducts(type: string, data: any) {
    //     const inventoryRef: AngularFirestoreDocument<any> = this.getProducts(type)
    //     const item = data

    //     return inventoryRef.set(item, { merge: true });
    // }

    public updateProductsInventory(data: any, id: string, type?: string, brand?: string): Promise<any> {
        let inventoryRef: AngularFirestoreDocument<any>
        if (brand) {
            inventoryRef = this.getAllProductsFromTypeById(type, brand, id)
        } else {
            inventoryRef = this.getProductSingleBrandById(id)
        }
        const item = data

        return inventoryRef.set(item, { merge: true });
    }
}