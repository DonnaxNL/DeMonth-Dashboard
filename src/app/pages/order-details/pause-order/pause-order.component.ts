import { FirebaseOrder } from 'src/app/models/firebase.order';
import { Component, Inject } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FirebaseOrderService } from 'src/app/services/firebase/order-service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface PauseSubscriptionDialogData {
    index: number
    order: FirebaseOrder,
    type: string,
    value?: string
}

@Component({
    selector: 'pause-order-dialog',
    templateUrl: 'pause-order-dialog.html',
})
export class PauseCancelSubscriptionDialog {
    editType = 'pause'
    type = 1
    months = [];
    oldDeliveryDate
    newStartPaymentDate
    nextDeliveryDate
    deliveryDates = null
    savingState = false
    loadingDone = false
    replaceList
    // Cancel
    cancelData
    thresholdDate = new Date()
    cancelPlanOptions = ['direct', 'plan']
    cancelPlan = 'direct'
    cancelReason = ''
    cancelDate
    errorReason = false
    lastDateCheck

    notifySlack = true

    constructor(
        public dialogRef: MatDialogRef<PauseCancelSubscriptionDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: PauseSubscriptionDialogData,
        private snackBar: MatSnackBar,
        public datepipe: DatePipe,
        public fun: AngularFireFunctions,
        public orderService: FirebaseOrderService) {
        this.editType = this.dialogData.type
        dialogRef.disableClose = true;
        for (let i = 1; i <= 10; i++) {
            this.months.push(i)
        }
        this.onSelectChanged()
        if (this.editType == 'cancel') {
            this.thresholdDate.setDate(this.thresholdDate.getDate() + 5)
            this.cancelData = {
                uid: this.dialogData.order.userId,
                orderId: this.dialogData.order.orderId,
                orderRef: this.dialogData.order.orderReference,
                boxName: this.dialogData.order.boxName,
                subscriptionId: this.dialogData.order.subscriptionDetails.subscriptionId,
            }
            this.calculateLastDeliveryDate(this.dialogData.order)
        }
    }

    onCloseClick(): void {
        this.dialogRef.close();
    }

    onSelectChanged() {
        const deliveries = this.dialogData.order.deliveries
        const cycle = this.dialogData.order.deliveryDaysApart
        const days = this.type * cycle
        if (this.dialogData.order.paymentPlan == 1) {
            this.nextDeliveryDate = null
            for (let i = 0; i < deliveries.length; i++) {
                if (deliveries[i].deliveryDate.toDate() > new Date()) {
                    this.oldDeliveryDate = new Date(deliveries[i].deliveryDate.toDate())
                    this.nextDeliveryDate = new Date(deliveries[i].deliveryDate.toDate())
                    this.nextDeliveryDate.setDate(this.nextDeliveryDate.getDate() + days)
                    break;
                }
            }
            if (!this.nextDeliveryDate) {
                console.log('No nextDelivery found')
                console.log(deliveries[deliveries.length - 1].deliveryDate.toDate())
                this.oldDeliveryDate = new Date(deliveries[deliveries.length - 1].deliveryDate.toDate())
                this.nextDeliveryDate = new Date(deliveries[deliveries.length - 1].deliveryDate.toDate())
                this.nextDeliveryDate.setDate(this.nextDeliveryDate.getDate() + days)
            }
        } else {
            this.deliveryDates = this.deliveryDatesMap(true, this.type)
            console.log(this.deliveryDates)
            if (this.deliveryDates.length > 0) {
                this.nextDeliveryDate = new Date(this.deliveryDates[0].deliveryDate.toDate())
            }
        }
    }

    pauseCancelSubscription() {
        if (this.editType == 'pause') {
            this.deliveryDates = [];
            this.replaceList = [];
            const deliveries = this.dialogData.order.deliveries
            const cycle = this.dialogData.order.deliveryDaysApart
            const days = this.type * cycle
            if (this.dialogData.order.paymentPlan == 1) {
                for (let i = 0; i < deliveries.length; i++) {
                    if (deliveries[i].deliveryDate.toDate() > new Date()) {
                        const nextDeliveryDate = new Date(deliveries[i].deliveryDate.toDate())
                        const idToReplace = this.datepipe.transform(deliveries[i].deliveryDate.toDate(), 'yyyy-MM-dd')
                        this.replaceList.push(idToReplace)
                        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + days)
                        this.deliveryDates.push(this.toDeliveryItem(nextDeliveryDate))
                        if (!this.newStartPaymentDate) {
                            this.nextDeliveryDate = nextDeliveryDate
                            this.newStartPaymentDate = nextDeliveryDate
                        }
                    }
                }
            } else {
                this.deliveryDates = this.deliveryDatesMap(true, this.type)
                this.nextDeliveryDate = new Date(this.deliveryDates[0].deliveryDate.toDate())
                this.newStartPaymentDate = new Date(this.deliveryDates[this.deliveryDates.length - 1].deliveryDate.toDate())
            }

            // Add history data
            const orderHistoryItem = {
                boxId: this.dialogData.order.boxId,
                boxName: this.dialogData.order.boxName,
                checkoutSummary: this.dialogData.order.checkoutSummary,
                deliveryDaysApart: this.dialogData.order.deliveryDaysApart,
                orderCreated: this.dialogData.order.orderCreated,
                orderId: this.dialogData.order.orderId,
                orderReference: this.dialogData.order.orderReference,
                paymentPlan: this.dialogData.order.paymentPlan,
                productQuantity: this.dialogData.order.productQuantity,
                products: this.dialogData.order.products,
                shippingAddress: this.dialogData.order.shippingAddress,
                subscriptionDetails: this.dialogData.order.subscriptionDetails,
                userId: this.dialogData.order.userId
            }
            var historyItem = {
                docId: this.datepipe.transform(new Date, 'yyyy-MM-dd_HH:mm') + '_paused',
                changeType: 'Subscription paused.',
                changes: {
                    before: {
                        nextDelivery: this.oldDeliveryDate
                    },
                    after: {
                        pauseType: this.type,
                        nextDelivery: this.type == 1 ? this.newStartPaymentDate : this.nextDeliveryDate
                    },
                    dashboard: true
                },
                dateChanged: new Date(),
                order: orderHistoryItem
            }

            var data = {
                uid: this.dialogData.order.userId,
                boxName: this.dialogData.order.boxName,
                orderId: this.dialogData.order.orderId,
                orderRef: this.dialogData.order.orderReference,
                newStartDate: this.newStartPaymentDate,
                pauseType: this.type + ' months',
                nextDeliveryDate: this.dialogData.order.paymentPlan == 1 ? this.newStartPaymentDate : null,
                deliveryDates: this.dialogData.order.paymentPlan != 1 ? this.deliveryDatesMap(false, this.type) : null,
                subscriptionId: this.dialogData.order.subscriptionDetails.subscriptionId,
                newDelivery: {
                    replaceList: this.getItemsToRemove(),
                    items: this.deliveryDates.filter(x => !this.replaceList.includes(x.docId))
                },
                history: historyItem
            }
            console.log(data)
            this.saveChanges(data)
        } else if (this.editType == 'cancel') {
            if (this.cancelReason == '') {
                this.errorReason = true
                this.snackBar.open("Please enter a valid reason.", "OK", {
                    duration: 5000,
                });
                return
            }
            this.cancelData.lastDeliveryDateString = this.datepipe.transform(this.cancelData.lastDeliveryDate, 'yyyy-MM-dd')
            this.cancelData.cancelReason = this.cancelReason

            console.log(this.cancelData)
            this.saveChanges(this.cancelData)
        }
    }

    async saveChanges(data) {
        this.savingState = true
        if (this.editType == 'pause') {
            // Save
            await this.orderService.updateOrderDates(data.uid, data.orderId,
                data.nextDeliveryDate, data.deliveryDates, data.newDelivery, data.history)

            if (data.subscriptionId != null) {
                var updateSubscription = this.fun.httpsCallable('pauseSubscriptionCall');
                await updateSubscription(data).subscribe()
            }

            if (this.notifySlack) {
                const updateSlack = this.fun.httpsCallable('orderPausedSlack');
                updateSlack(data).subscribe();
            }
            this.dialogData.value == 'paused'
            this.loadingDone = true
        } else if (this.editType == 'cancel') {
            if (data.subscriptionId == null) {
                this.orderService.changeOrderStatus(data.uid, data.orderId, 'canceled', data.cancelReason)
                if (this.notifySlack) {
                    const cancelSlack = this.fun.httpsCallable('orderCancelledSlack');
                    cancelSlack(data).subscribe();
                }
                this.dialogData.value == 'canceled'
                this.loadingDone = true
            } else {
                if (this.cancelPlan == 'plan') {
                    this.cancelData.cancelDate = new Date()
                    this.cancelData.cancelDateString = this.datepipe.transform(this.cancelData.cancelDate, 'yyyy-MM-dd')
                    const cancelSubscription = this.fun.httpsCallable('planCancelSubscriptionCall');
                    cancelSubscription(this.cancelData).subscribe((result) => {
                        if (this.notifySlack) {
                            const cancelSlack = this.fun.httpsCallable('orderCancelledSlack');
                            cancelSlack(data).subscribe();
                        }
                        this.dialogData.value == 'canceled'
                        this.loadingDone = true
                    });
                } else if (this.cancelPlan == 'direct') {
                    const cancelSubscription = this.fun.httpsCallable('cancelSubscriptionCall');
                    cancelSubscription(this.cancelData).subscribe((result) => {
                        if (this.notifySlack) {
                            const cancelSlack = this.fun.httpsCallable('orderCancelledSlack');
                            cancelSlack(data).subscribe();
                        }
                        this.dialogData.value == 'canceled'
                        this.loadingDone = true
                    });
                }
            }
        }
    }

    calculateLastDeliveryDate(order) {
        var lastDate;
        if (order.paymentPlan == 1) {
            // Get lastDeliveryDate
            if (!(order.startDeliveryDate instanceof Date)) {
                order.startDeliveryDate = new Date(order.startDeliveryDate.seconds * 1000)
            }
            if (!(order.nextDeliveryDate instanceof Date)) {
                order.nextDeliveryDate = new Date(order.nextDeliveryDate.seconds * 1000)
            }
            if (order.startDeliveryDate > new Date) {
                if (!lastDate) {
                    lastDate = order.startDeliveryDate
                }
            } else if (order.nextDeliveryDate > new Date()) {
                if (!lastDate) {
                    lastDate = order.nextDeliveryDate
                }
            } else {
                lastDate = order.nextDeliveryDate
            }
        } else {
            for (let i = 0; i < order.deliveryDates.length; i++) {
                if (!(order.nextDeliveryDate instanceof Date)) {
                    order.deliveryDates[i] = new Date(order.deliveryDates[i].seconds * 1000)
                }
                if (order.deliveryDates[i] > new Date()) {
                    if (!lastDate) {
                        lastDate = order.deliveryDates[i]
                    }
                    break
                }
            }
        }
        console.log('lastDate:', lastDate)
        this.cancelData.lastDeliveryDate = lastDate
        this.lastDateCheck = lastDate
    }

    deliveryDatesMap(newMode, months) {
        console.log(this.dialogData)
        this.replaceList = [];
        var deliveryDays = [];
        const cycleDays = this.dialogData.order.deliveryDaysApart
        var loopAmount = this.dialogData.order.deliveries.length;
        var startDate
        for (let i = 0; i < loopAmount; i++) {
            var deliveryDate = null
            if (!(this.dialogData.order.deliveries[i].deliveryDate instanceof Date)) {
                deliveryDate = new Date(this.dialogData.order.deliveries[i].deliveryDate.toDate())
            } else {
                deliveryDate = new Date(this.dialogData.order.deliveries[i].deliveryDate)
            }
            if (deliveryDate > new Date()) {
                const idToReplace = this.datepipe.transform(deliveryDate, 'yyyy-MM-dd')
                this.replaceList.push(idToReplace)
                if (!startDate) {
                    this.oldDeliveryDate = new Date(deliveryDate)
                    deliveryDate.setDate(deliveryDate.getDate() + months * cycleDays)
                    startDate = new Date(deliveryDate)
                } else {
                    deliveryDate = new Date(startDate.setDate(startDate.getDate() + cycleDays))
                }
                deliveryDays.push(newMode ? this.toDeliveryItem(deliveryDate) : deliveryDate);
            } else if (!newMode) {
                deliveryDays.push(deliveryDate);
            }
            //console.log(loopAmount, this.orders[index].deliveryDates[0], daysToAdd, daysApart, deliveryDate)
        }
        if (this.dialogData.order.paymentPlan == 1 && loopAmount < (this.dialogData.order.paymentPlan + 1)) {
            console.log(deliveryDays)
            const thirteenthMonth = new Date(deliveryDays[deliveryDays.length - 1].deliveryDate)
            thirteenthMonth.setDate(thirteenthMonth.getDate() + cycleDays)
            deliveryDays.push(newMode ? this.toDeliveryItem(thirteenthMonth) : thirteenthMonth);
        }

        return deliveryDays;
    }

    toDeliveryItem(deliveryDate) {
        const deliveryDetails = {
            docId: this.datepipe.transform(deliveryDate, 'yyyy-MM-dd'),
            deliveryDate: deliveryDate,
            paymentDetails: {
                isPaid: false
            },
            packing: {
                isPacked: false,
                packedBy: ''
            },
            delivery: {
                isDelivered: false,
                deliveryInitiatedBy: ''
            }
        }
        return deliveryDetails
    }

    getItemsToRemove() {
        const onlyIdList = [];
        this.deliveryDates.forEach(delivery => {
            onlyIdList.push(delivery.docId)
        });
        return this.replaceList.filter(x => !onlyIdList.includes(x))
    }
}