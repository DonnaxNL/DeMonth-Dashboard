import { Injectable } from '@angular/core';
import { map } from "rxjs/operators";
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { UserInfo } from 'firebase';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserData } from '../../models/userdata';
import { FirebaseOrder } from '../../models/firebase.order';
import { Coupon } from '../../models/coupon';

export const collections = {
  users: 'users',
  userInfo: 'userdata',
  newsletter: 'newsletter',
  orders: 'orders',
  testOrders: 'test-orders',
  coupons: 'coupons',
  blog: 'blog'
};

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(
    public afs: AngularFirestore,
    private afAuth: AngularFireAuth) { }

  public getUserDocRefByUID(uid: string): AngularFirestoreDocument<UserInfo> {
    return this.afs.doc(`${collections.users}/${uid}`);
  }

  public deleteUserData(uid: string): Promise<any> {
    const userRef: AngularFirestoreDocument<UserInfo> = this.getUserDocRefByUID(uid);
    return userRef.delete();
  }

  public updateUserData(user: UserInfo): Promise<any> {
    // Sets user$ data to firestore on login
    const userRef: AngularFirestoreDocument<UserInfo> = this.getUserDocRefByUID(user.uid);
    const data: UserInfo = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      providerId: user.providerId
    };
    return userRef.set(data, { merge: true });
  }

  // UserData
  public getUserInfoRefByUID(uid: string): AngularFirestoreDocument<UserData> {
    return this.afs.doc(`${collections.userInfo}/${uid}`);
  }

  public updateUserMainData(user: UserInfo, info: UserData): Promise<any> {
    const userDataRef: AngularFirestoreDocument<UserData> = this.getUserInfoRefByUID(user.uid);
    const item: UserData = {
      uid: user.uid,
      firstName: info.firstName,
      lastName: info.lastName,
      address: info.address,
      email: user.email,
      createdAt: info.createdAt
    };
    if (info.mobileNo != undefined) {
      item.mobileNo = info.mobileNo
    }
    if (info.birthDate != undefined) {
      if (info.birthDate instanceof Date) {
        item.birthDate = info.birthDate
      } else {
        item.birthDate = info.birthDate.toDate()
      }
    }
    if (info.additionalAddresses != undefined) {
      item.additionalAddresses = info.additionalAddresses
    }
    console.log(info, item)
    return userDataRef.set(item, { merge: true });
  }

  public setCycleOnUser(userId: string, cycle: any): Promise<any> {
    const userDataRef: AngularFirestoreDocument<any> = this.getUserInfoRefByUID(userId);
    const item = {
      cycleDetails: cycle
    }
    console.log('info', userId, item)
    return userDataRef.set(item, { merge: true });
  }

  // Get Order by ID
  public getOrderByID(orderId: string, mode?): AngularFirestoreDocument<FirebaseOrder> {
    console.log(orderId, mode)
    if (mode == null || mode == 'live') {
      return this.afs.doc(`${collections.orders}/${orderId}`);
    } else {
      return this.afs.doc(`${collections.testOrders}/${orderId}`);
    }
  }

  // Get Order by ID
  public getDeliveriesFromOrderByID(orderId: string, mode?): AngularFirestoreCollection {
    //console.log(orderId, mode)
    if (mode == null || mode == 'live') {
      return this.afs.doc(`${collections.orders}/${orderId}`).collection('deliveries')
    } else {
      return this.afs.doc(`${collections.testOrders}/${orderId}`).collection('deliveries')
    }
  }

  // public getDeliveryList() {
  //   return this.afs.collection('test-orders').snapshotChanges().pipe(map(actions => {
  //     return actions.map(a => {
  //       const data = a.payload.doc.data()
  //       //const orderId = data.orderId
  //       const orderId = a.payload.doc.id;
  //       //console.log(data, id)
  //       return {
  //         order: data,
  //         deliveries: this.afs.collection(`test-orders/${orderId}/deliveries`).valueChanges()
  //       }
  //     })
  //   }))
  // }

  public getOrderByRef(orderRef: string): AngularFirestoreCollection {
    return this.afs.collection(`${collections.orders}`, ref => ref.where('orderReference', '==', orderRef));
  }

  public getAllOrdersByUserID(userId: string): AngularFirestoreCollection {
    return this.afs.collection(`${collections.orders}`, ref => ref.where('userId', '==', userId));
  }

  // Update products for order
  public updateOrderProducts(uid, quantity: number, products: any, orderId: string): Promise<any> {
    const orderRef: AngularFirestoreDocument<any> = this.getOrderByID(orderId)
    const item = {
      productQuantity: quantity,
      products: {
        removeBuds: products.removeBuds,
        tampons: products.tampons,
        pads: products.pads
      },
    };

    return orderRef.set(item, { merge: true });
  }

  // Update deliveryDates for order
  public updateOrderDates(uid, date: any, orderId: string): Promise<any> {
    const orderRef: AngularFirestoreDocument<any> = this.getOrderByID(orderId)
    var array
    if (date) {
      array = [new Date(date)]
    } else {
      array = null
    }
    const item = {
      deliveryDates: array
    };
    console.log(orderRef, array, item)

    return orderRef.set(item, { merge: true });
  }

  // Update deliveryDaysApart for order
  public updateOrderDays(uid: string, orderId: string, dates, days: number): Promise<any> {
    const orderRef: AngularFirestoreDocument<any> = this.getOrderByID(orderId)
    const item = {
      deliveryDates: dates,
      deliveryDaysApart: days
    };

    return orderRef.set(item, { merge: true });
  }

  public deleteOrder(orderId, mode?) {
    if (mode == null || mode == 'live') {
      return this.afs.doc(`${collections.orders}/${orderId}`).delete()
    } else {
      return this.afs.doc(`${collections.testOrders}/${orderId}`).delete()
    }
  }

  checkCouponCode(code: string) {
    return this.afs.collection(`${collections.coupons}`, ref => ref.where('id', '==', code));
  }

  usedCouponCode(id: string, uid: string) {
    const couponRef: AngularFirestoreDocument<any> = this.afs.doc(`${collections.coupons}/${id}`);
    const item = {
      used: true,
      usedByUid: uid
    };

    return couponRef.set(item, { merge: true });
  }

  public getAllOrders(mode?): AngularFirestoreCollection {
    if (mode == null || mode == 'live') {
      return this.afs.collection(`${collections.orders}`);
    } else {
      return this.afs.collection(`${collections.testOrders}`);
    }
  }

  public updateOrder(orderId: string, startDate, newNextDate): Promise<any> {
    const orderRef: AngularFirestoreDocument<any> = this.getOrderByID(orderId)
    const item = {
      firstDeliveryDate: null,
      deliveryDates: null,
      startDeliveryDate: startDate,
      nextDeliveryDate: newNextDate,
      subscriptionDetails: {
        subscriptionId: null,
        subscriptionStatus: 'pending',
      },
    };

    return orderRef.set(item, { merge: true });
  }

  public updateDeliverStatus(orderId: string, deliverStatus): Promise<any> {
    const orderRef: AngularFirestoreDocument<any> = this.getOrderByID(orderId)
    const item = {
      deliverStatus: deliverStatus
    };

    return orderRef.set(item, { merge: true });
  }

  public getAllCustomers(): AngularFirestoreCollection {
    return this.afs.collection(`${collections.userInfo}`);
  }

  // Get Order by ID
  public getCustomerByID(customerId: string): AngularFirestoreDocument<UserData> {
    return this.afs.doc(`${collections.userInfo}/${customerId}`);
  }

  public getAllCoupons(): AngularFirestoreCollection {
    return this.afs.collection(`${collections.coupons}`);
  }

  public createCoupon(coupon: any) {
    var couponItem: Coupon = {
      id: coupon.id,
      name: coupon.name,
      discount: coupon.discount,
    }
    if (coupon.limit) {
      couponItem.limit = coupon.limit
    }
    if (coupon.usedBy) {
      couponItem.usedBy = coupon.usedBy
    }
    if (coupon.used != null) {
      couponItem.used = coupon.used
    }
    this.afs.collection(`${collections.coupons}`).doc(couponItem.id).set(couponItem);
  }

  public editCoupon(coupon: any) {
    const couponRef: AngularFirestoreDocument<any> = this.afs.doc(`${collections.coupons}/${coupon.id}`);
    const item = coupon

    return couponRef.set(item, { merge: true });
  }

  public deleteCoupon(couponId) {
    return this.afs.doc(`${collections.coupons}/${couponId}`).delete()
  }

  public generateId() {
    return this.afs.createId()
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

  public setDeliveryStatus(orderId, deliveryId, user, packed, delivered) {
    var deliveryItem = {
      packing: {
        isPacked: packed,
        packedBy: packed ? user : ''
      },
      delivery: {
        isDelivered: delivered,
        deliveryInitiatedBy: delivered ? user : ''
      }
    }
    console.log(deliveryItem)
    var deliveryRef = this.afs.collection('test-orders').doc(orderId).collection('deliveries')
    deliveryRef.doc(deliveryId).set(deliveryItem, { merge: true });
  }
}