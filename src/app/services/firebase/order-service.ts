import { Injectable } from '@angular/core';
import { map } from "rxjs/operators";
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { CheckCustomer } from 'src/app/check-customer.test';
import { FirebaseOrder } from 'src/app/models/firebase.order';
import { DeliveryService } from '../delivery-service';

@Injectable({
    providedIn: 'root'
})
export class FirebaseOrderService {
    collection = 'orders'
    collectionTest = 'test-orders'

    constructor(
        public afs: AngularFirestore,
        private afAuth: AngularFireAuth,
        private checkCustomer: CheckCustomer) { }

    // Get Order by ID
    public getOrderByID(orderId: string, mode?): AngularFirestoreDocument<FirebaseOrder> {
        if (mode == null || mode == 'live') {
            return this.afs.doc(`${this.collection}/${orderId}`);
        } else {
            return this.afs.doc(`${this.collectionTest}/${orderId}`);
        }
    }

    public getAllOrdersByUserID(userId: string): AngularFirestoreCollection {
        if (this.checkCustomer.isRealCustomerById(userId)) {
            return this.afs.collection(`${this.collection}`, ref => ref.where('userId', '==', userId));
        } else {
            return this.afs.collection(`${this.collectionTest}`, ref => ref.where('userId', '==', userId));
        }
    }

    public getDeliveriesByOrderID(uid: string, orderId: string): AngularFirestoreCollection {
        if (uid == null || this.checkCustomer.isRealCustomerById(uid)) {
            return this.afs.collection(`${this.collection}/${orderId}/deliveries`);
        } else {
            return this.afs.collection(`${this.collectionTest}/${orderId}/deliveries`);
        }
    }

    public getHistoryByOrderID(uid: string, orderId: string): AngularFirestoreCollection {
        if (uid == null || this.checkCustomer.isRealCustomerById(uid)) {
            return this.afs.collection(`${this.collection}/${orderId}/history`);
        } else {
            return this.afs.collection(`${this.collectionTest}/${orderId}/history`);
        }
    }

    public getDeliveryList(mode?) {
        var collection
        if (mode) {
            collection = this.collectionTest
        } else {
            collection = this.collection
        }
        //, ref =>  ref.where('subscriptionDetails.subscriptionStatus', '==', 'active') .where('subscriptionDetails.subscriptionStatus', '==', 'stripe')
        var collectionRef = this.afs.collection(collection)
        return collectionRef.snapshotChanges().pipe(map(actions => {
            return actions.map(a => {
                const data = a.payload.doc.data()
                //const orderId = data.orderId
                const orderId = a.payload.doc.id;
                //console.log(data, id)
                return {
                    order: data,
                    deliveries: this.afs.collection(`${collection}/${orderId}/deliveries`).valueChanges(),
                    history: this.getHistoryByOrderID((data as FirebaseOrder).userId, orderId)
                }
            })
        }))
    }


    public getFullOrders(userId: string) {
        return this.getAllOrdersByUserID(userId).snapshotChanges().pipe(map(actions => {
            return actions.map(a => {
                const data = a.payload.doc.data()
                //const orderId = data.orderId
                const orderId = a.payload.doc.id;
                //console.log(data, id)
                return {
                    order: data,
                    deliveries: this.getDeliveriesByOrderID(userId, orderId),
                    history: this.getHistoryByOrderID(userId, orderId)
                }
            })
        }))
    }

    public saveOrder(order: FirebaseOrder, deliveries) {
        var orderItem: FirebaseOrder = {
            orderId: order.orderId,
            orderReference: order.orderReference,
            boxId: order.boxId,
            boxName: order.boxName,
            products: order.products,
            productQuantity: order.productQuantity,
            startDeliveryDate: order.startDeliveryDate,
            deliveryDaysApart: order.deliveryDaysApart,
            checkoutSummary: order.checkoutSummary,
            paymentPlan: order.paymentPlan,
            paymentDetails: order.paymentDetails,
            subscriptionDetails: order.subscriptionDetails,
            shippingAddress: order.shippingAddress,
            userId: order.userId,
            orderCreated: order.orderCreated,
        }
        if (order.nextDeliveryDate != undefined || order.nextDeliveryDate != null) {
            orderItem.nextDeliveryDate = order.nextDeliveryDate
        }
        if (order.deliveryDates != undefined || order.deliveryDates != null) {
            orderItem.deliveryDates = order.deliveryDates
        }
        if (this.checkCustomer.isRealCustomerById(order.userId)) {
            this.afs.collection(`${this.collection}`).doc(order.orderId).set(orderItem);
        } else {
            this.afs.collection(`${this.collectionTest}`).doc(order.orderId).set(orderItem);
        }
        this.saveDeliveries(order.userId, order.orderId, deliveries)
    }

    public saveDeliveries(userId, orderId, deliveries) {
        var deliveryRef = this.getDeliveriesByOrderID(userId, orderId)
        for (let i = 0; i < deliveries.length; i++) {
            var deliveryItem = {
                id: deliveries[i].docId,
                deliveryDate: deliveries[i].deliveryDate,
                paymentDetails: deliveries[i].paymentDetails,
                packing: deliveries[i].packing,
                delivery: deliveries[i].delivery,
            }
            //console.log(deliveries[i].docId, deliveryItem)
            deliveryRef.doc(deliveries[i].docId).set(deliveryItem)
        }
    }

    public deleteDeliveries(userId, orderId, deliveries) {
        var deliveryRef = this.getDeliveriesByOrderID(userId, orderId)
        for (let i = 0; i < deliveries.length; i++) {
            deliveryRef.doc(deliveries[i]).delete()
        }
    }

    public saveHistory(userId, orderId, historyItem) {
        console.log(historyItem)
        var item = {
            id: historyItem.docId,
            dateChanged: historyItem.dateChanged,
            changeType: historyItem.changeType,
            changes: historyItem.changes,
            order: historyItem.order
        }
        var deliveryRef = this.getHistoryByOrderID(userId, orderId)
        deliveryRef.doc(item.id).set(item)
    }

    // Update deliveryDates for order
    public updateOrderDates(uid, orderId: string, nextDeliveryDate, deliveryDates, newDelivery, history): Promise<any> {
        const orderRef: AngularFirestoreDocument<any> = this.getOrderByID(uid, orderId)
        var item
        item = {}
        if (nextDeliveryDate) {
            item.deliveryDates = null
            item.nextDeliveryDate = nextDeliveryDate
        } else {
            item.nextDeliveryDate = null
            item.deliveryDates = deliveryDates
        }
        console.log(orderRef, item)
        if (newDelivery) {
            this.saveHistory(uid, orderId, history)
            this.replaceDelivery(uid, orderId, newDelivery)
            return orderRef.set(item, { merge: true });
        } else {
            return orderRef.set(item, { merge: true });
        }
    }

    // Update deliveryDaysApart for order
    public updateOrderDays(uid: string, orderId: string, days: number, nextDate: any, isStartDate: any, history: any, nextDates?: any, newDelivery?: any): Promise<any> {
        const orderRef: AngularFirestoreDocument<any> = this.getOrderByID(uid, orderId)
        var itemNew
        if (nextDates) {
            itemNew = {
                deliveryDates: nextDates,
                deliveryDaysApart: days
            };
        } else {
            if (isStartDate) {
                const newNextDate = new Date(nextDate)
                newNextDate.setDate(newNextDate.getDate() + days)
                itemNew = {
                    deliveryDaysApart: days,
                    startDeliveryDate: nextDate,
                    nextDeliveryDate: newNextDate
                }
            } else {
                itemNew = {
                    deliveryDaysApart: days,
                    nextDeliveryDate: nextDate
                }
            }
        }

        if (newDelivery) {
            this.saveHistory(uid, orderId, history)
            this.replaceDelivery(uid, orderId, newDelivery)
            return orderRef.set(itemNew, { merge: true });
        } else {
            return orderRef.set(itemNew, { merge: true });
        }
    }

    // Update subcription box
    public updateOrderBox(uid, orderId, boxId, boxName, checkoutSummary, paymentPlan, orderHistory, newDelivery, nextDeliveryDate?, deliveryDates?): Promise<any> {
        const orderRef: AngularFirestoreDocument<any> = this.getOrderByID(uid, orderId)
        var item
        item = {
            boxId: boxId,
            boxName: boxName,
            checkoutSummary: checkoutSummary
        };
        if (paymentPlan) {
            item.paymentPlan = paymentPlan
        }

        if (nextDeliveryDate) {
            item.deliveryDates = null
            item.nextDeliveryDate = nextDeliveryDate
        } else if (deliveryDates) {
            item.nextDeliveryDate = null
            item.deliveryDates = deliveryDates
        }
        console.log('fs item:', item)

        this.saveHistory(uid, orderId, orderHistory)
        if (newDelivery) {
            this.replaceDelivery(uid, orderId, newDelivery)
            return orderRef.set(item, { merge: true });
        } else {
            return orderRef.set(item, { merge: true });
        }
    }

    public replaceDelivery(uid: string, orderId: string, deliveries) {
        if (deliveries.replaceList != null && deliveries.replaceList.length != 0) {
            this.deleteDeliveries(uid, orderId, deliveries.replaceList)
        }
        if (deliveries.items != null && deliveries.items.length != 0) {
            this.saveDeliveries(uid, orderId, deliveries.items)
        }
    }

    // Change order status
    public changeOrderStatus(uid: string, orderId: string, status: string, cancelReason?): Promise<any> {
        const orderRef: AngularFirestoreDocument<any> = this.getOrderByID(uid, orderId)
        var item;
        item  = {
            subscriptionDetails: {
                subscriptionStatus: status
            }
        };
        if (cancelReason) {
            item.cancelReason = cancelReason
        }

        return orderRef.set(item, { merge: true });
    }

    public setDeliveryStatus(orderId, deliveryId, user, packed, delivered, userId) {
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
        var deliveryRef = this.getDeliveriesByOrderID(userId, orderId)
        deliveryRef.doc(deliveryId).set(deliveryItem, { merge: true });
      }
}