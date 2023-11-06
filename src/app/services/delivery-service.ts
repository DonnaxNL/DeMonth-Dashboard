import { Injectable } from '@angular/core'
import * as moment from 'moment';
import { firestore } from 'firebase/app';
import Timestamp = firestore.Timestamp;
import { FirebaseOrderService } from './firebase/order-service';
import { FirebaseOrder } from '../models/firebase.order';

@Injectable({
    providedIn: 'root'
})
export class DeliveryService {
    currentDate = new Date()
    currentWeek = -1
    currentDeliveries = 0
    currentDeliveryStatus = [];
    deliveries = [];
    deliveryList = [];

    constructor(
        public orderService: FirebaseOrderService) { }

    getDeliveryDetails() {
        this.orderService.getDeliveryList().subscribe(deliveries => {
            console.log('from fb:', deliveries)
            for (let i = 0; i < deliveries.length; i++) {
                this.sortByDelivery(deliveries[i], i, deliveries.length)
            }
        });
    }

    sortByDelivery(orderItem, index, size) {
        this.deliveryList = [];
        const order: FirebaseOrder = (orderItem.order as FirebaseOrder)
        if (order.subscriptionDetails.subscriptionStatus == 'active' ||
            order.subscriptionDetails.subscriptionStatus == 'stripe' ||
            order.paymentDetails.paymentMethod == 'afterpay' && order.subscriptionDetails.subscriptionStatus == 'pending' ||
            order.subscriptionDetails.subscriptionStatus == 'paused') {
            orderItem.deliveries.subscribe((data: any) => {
                var status
                if (order.paymentDetails.paymentMethod == 'afterpay') {
                    status = order.paymentDetails.paymentMethod
                } else {
                    status = order.subscriptionDetails ? order.subscriptionDetails.subscriptionStatus : ''
                }

                var deliveryItem
                const minimalDate = new Date()
                minimalDate.setDate(minimalDate.getDate() - 7)
                for (let i = 0; i < data.length; i++) {
                    // if (!data[i].deliveryDate) {
                    //   console.log('No deliveryDate', order, data[i])
                    // }
                    if (data[i].deliveryDate && data[i].deliveryDate.toDate() > minimalDate) {
                        deliveryItem = data[i]
                        break;
                    }
                }

                if (!deliveryItem) {
                    deliveryItem = data[data.length - 1]
                }

                var orderItem = {
                    boxId: order.boxId,
                    boxName: order.boxName,
                    orderId: order.orderId,
                    orderRef: order.orderReference,
                    paymentPlan: order.paymentPlan,
                    deliveryItem: deliveryItem,
                    customer: order.shippingAddress.firstName + " " + order.shippingAddress.lastName,
                    subscriptionStatus: status,
                    fullOrder: order
                }
                let duplicate = this.deliveryList.findIndex(x => x.orderId == order.orderId)
                if (duplicate != -1) {
                    this.deliveryList[duplicate] = orderItem
                } else {
                    this.deliveryList.push(orderItem)
                }
                if (index == (size - 2)) {
                    this.deliveryList.sort((a, b) => (a.deliveryItem.deliveryDate > b.deliveryItem.deliveryDate) ? 1 : ((b.deliveryItem.deliveryDate > a.deliveryItem.deliveryDate) ? -1 : 0));
                    this.getWeekDates(this.currentDate)
                }
            })
        }
    }

    getDeliveries(uid, orderId) {
        return this.orderService.getDeliveriesByOrderID(uid, orderId).ref.get().then(async deliveries => {
            //console.log(uid, orderId, deliveries.size, deliveries.docs)
            if (deliveries.empty) {
                //console.error('Error getting documents', deliveries);
                return null
            } else {
                var list = [];
                const items = deliveries.docs
                items.forEach(element => {
                    list.push(element.data())
                });
                return list
            }
        }).catch(async (err: any) => {
            //console.error('Error getting documents', err);
            return null
        })
    }

    getWeekDates(date: Date) {
        var weekNo = (moment(date).locale('nl-nl').week())
        var year = date.getFullYear()
        if (weekNo == 53) {
            weekNo = 1
        }
        const weekDates = [1, 2, 3, 4, 5, 6, 7]
            .map(d => moment(year + '-' + weekNo + '-' + d, 'YYYY-W-E'));
        if (this.currentWeek != weekNo && this.deliveryList.length != 0) {
            this.deliveries = []
            this.currentDeliveryStatus = []
            this.currentDeliveries = 0
            this.currentDeliveryStatus.push(0) //Packed
            this.currentDeliveryStatus.push(0) //Delivered
            this.currentWeek = weekNo
            console.log(this.deliveryList);

            this.deliveryList.forEach(delivery => {
                for (let i = 0; i < weekDates.length; i++) {
                    if (!(delivery.deliveryItem.deliveryDate instanceof Timestamp)) {
                        delivery.deliveryItem.deliveryDate = new Timestamp(delivery.deliveryItem.deliveryDate.seconds, delivery.deliveryItem.deliveryDate.nanoseconds)
                    }
                    if (weekDates[i].toDate().setHours(23, 59, 59, 59) == delivery.deliveryItem.deliveryDate.toDate().setHours(23, 59, 59, 59)) {
                        if (this.deliveries[i] == undefined) {
                            this.deliveries[i] = []
                        }
                        this.deliveries[i].push(delivery)
                    }
                }
            });
            this.deliveries.forEach(delivery => {
                this.currentDeliveries = this.currentDeliveries + delivery.length
                delivery.forEach(item => {
                    if (item.deliveryItem.packing.isPacked) {
                        this.currentDeliveryStatus[0] = this.currentDeliveryStatus[0] + 1
                    }
                    if (item.deliveryItem?.delivery.isDelivered) {
                        this.currentDeliveryStatus[1] = this.currentDeliveryStatus[1] + 1
                    }
                });
            });
        }
    }

    getWeekDeliveries() {
        this.getDeliveryDetails()
    }
}