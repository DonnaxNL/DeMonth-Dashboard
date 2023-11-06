import { Injectable } from '@angular/core';
import { map } from "rxjs/operators";
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { CheckCustomer } from 'src/app/check-customer.test';
import { FirebaseOrder } from 'src/app/models/firebase.order';

@Injectable({
  providedIn: 'root'
})
export class FirebaseDeliveryService {
  collection = 'orders'
  collectionTest = 'test-orders'
  delivery = 'deliveries'

  constructor(
    public afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private checkCustomer: CheckCustomer) { }

  // Get Order by ID
  public getDeliveriesFromOrderByID(orderId: string, mode?): AngularFirestoreCollection {
    //console.log(orderId, mode)
    if (mode == null || mode == 'live') {
      return this.afs.doc(`${this.collection}/${orderId}`).collection('deliveries')
    } else {
      return this.afs.doc(`${this.collectionTest}/${orderId}`).collection('deliveries')
    }
  }

  // Get Order by ID
  public getDeliveryFromOrderByIDs(orderId: string, deliveryId: string, mode?): AngularFirestoreDocument<any> {
    //console.log(orderId, mode)
    if (mode == null || mode == 'live') {
      return this.afs.doc(`${this.collection}/${orderId}/deliveries/${deliveryId}`)
    } else {
      return this.afs.doc(`${this.collectionTest}/${orderId}/deliveries/${deliveryId}`)
    }
  }

  public setDeliveries(orderId, deliveries, mode?) {
    for (let i = 0; i < deliveries.length; i++) {
      var deliveryItem = {
        id: deliveries[i].docId,
        deliveryDate: deliveries[i].deliveryDate,
        paymentDetails: deliveries[i].paymentDetails,
        packing: deliveries[i].packing,
        delivery: deliveries[i].delivery,
      }
      console.log(deliveries[i].docId, deliveryItem)

      var deliveryRef
      if (mode == null || mode == 'live') {
        deliveryRef = this.afs.collection('orders').doc(orderId).collection('deliveries')
      } else {
        deliveryRef = this.afs.collection('test-orders').doc(orderId).collection('deliveries')
      }
      deliveryRef.doc(deliveries[i].docId).set(deliveryItem)
    }
  }
}