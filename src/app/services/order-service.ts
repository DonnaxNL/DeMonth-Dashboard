import { Injectable } from '@angular/core'

@Injectable({
    providedIn: 'root'
})
export class OrderService {

    constructor() { }

    getAllActiveSubscriptions(orders) {
        const activeOrders = [];
        orders.forEach(order => {
            if (order.subscriptionDetails.subscriptionStatus == 'active' ||
            order.subscriptionDetails.subscriptionStatus == 'stripe' ||
            order.paymentDetails.paymentMethod == 'afterpay' && order.subscriptionDetails.subscriptionStatus == 'pending' ||
            order.subscriptionDetails.subscriptionStatus == 'paused') {
                activeOrders.push(order)
            }
        });
        return activeOrders
    }
}