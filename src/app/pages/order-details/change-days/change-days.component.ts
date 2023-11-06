import { Component, Inject, OnInit } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { DatePipe } from '@angular/common';
import { Moment } from 'moment';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseOrderService } from 'src/app/services/firebase/order-service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { UserService } from 'src/app/services/firebase/user-service';
import { firestore } from 'firebase';

export interface ChangeDaysDialogData {
    order: any
    days: number
}

@Component({
    selector: 'change-days-dialog',
    templateUrl: 'change-days-dialog.html',
})
export class DeliveryDaysDialog implements OnInit {
    minDate = new Date()
    noDays = [];
    datePicker
    currentDeliveryDate
    newDeliveryDate
    savingState = false
    loadingDone = false
    newNextDeliveryDate
    deliveryDates
    replaceList
    isStartDate = false
    notifySlack = true

    constructor(
        public dialogRef: MatDialogRef<DeliveryDaysDialog>,
        @Inject(MAT_DIALOG_DATA) public data: ChangeDaysDialogData,
        private snackBar: MatSnackBar,
        public datepipe: DatePipe,
        public userService: UserService,
        public orderService: FirebaseOrderService,
        public fun: AngularFireFunctions, ) { 
            for (let i = 14; i <= 365; i++) {
                this.noDays.push(i);
            }
        }

    // nonDeliveryFilter = (d: Moment): boolean => {
    //     const day = d.day()
    //     // Prevent Sunday and Monday from being selected.
    //     return day !== 0 && day !== 1;
    // }

    datePickerEvent(type: string, event: MatDatepickerInputEvent<Date>) {
        if (event.value < this.minDate) {
            console.log('In the past: ' + event.value);
            this.newDeliveryDate = this.minDate;
        } else {
            this.newDeliveryDate = new Date(event.value)
        }
    }

    ngOnInit(): void {
        //this.minDate.setDate(new Date().getDate() + 7);
        this.minDate.setHours(0, 0, 0, 0)
        const deliveries = this.data.order.deliveries
        console.log(deliveries)
        for (let i = 0; i < deliveries.length; i++) {
            if (!(deliveries[i].deliveryDate instanceof firestore.Timestamp)) {
                deliveries[i].deliveryDate = new firestore.Timestamp(deliveries[i].deliveryDate.seconds, deliveries[i].deliveryDate.nanoseconds)
                console.log('converted', deliveries[i].deliveryDate)
            }
            if (deliveries[i].deliveryDate.toDate() > new Date()) {
                this.currentDeliveryDate = new Date(deliveries[i].deliveryDate.toDate())
                if (i == 0) {
                    this.isStartDate = true
                }
                break;
            }
        }
        this.newDeliveryDate = new Date(this.currentDeliveryDate)
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onSelectChanged(days) {
        var diff = days - this.data.order.deliveryDaysApart
        console.log(this.currentDeliveryDate, diff)
        if (!this.datePicker) {
            console.log(days, diff)
            const newDate = new Date(this.currentDeliveryDate)
            newDate.setDate(this.currentDeliveryDate.getDate() + diff)
            this.newDeliveryDate = newDate
            console.log(this.newDeliveryDate)
        }
    }

    changeDays() {
        var error = false
        var oldDays = this.data.order.deliveryDaysApart
        if (this.currentDeliveryDate == this.newDeliveryDate || this.newDeliveryDate < this.minDate) {
            error = true
            this.snackBar.open("Please make a different selection!", "Close", {
                duration: 5000,
            });
        }
        if (!error) {
            var data

            // Fill general data
            data = {
                uid: this.data.order.userId,
                boxName: this.data.order.boxName,
                orderId: this.data.order.orderId,
                orderRef: this.data.order.orderReference,
                paymentPlan: this.data.order.paymentPlan,
                deliveryDaysApartBefore: oldDays,
                deliveryDaysApartAfter: this.data.days,
                deliveryDateBeforeString: this.datepipe.transform(this.currentDeliveryDate, 'dd-MM-yyyy'),
                subscriptionId: this.data.order.subscriptionDetails.subscriptionId,
                onlyDays: this.datePicker ? false : true
            }

            // Fill delivery data
            if (this.data.order.paymentPlan == 1) {
                this.replaceList = [];
                var deliveryList = [];
                data.nextDeliveryDate = this.newDeliveryDate
                data.nextDeliveryDateString = this.datepipe.transform(this.newDeliveryDate, 'dd-MM-yyyy')
                data.nextPaymentDate = this.datepipe.transform(this.newDeliveryDate, 'yyyy-MM-dd')

                const idToReplace = this.datepipe.transform(this.currentDeliveryDate, 'yyyy-MM-dd')
                deliveryList.push(this.toDeliveryItem(this.newDeliveryDate))
                this.replaceList.push(idToReplace)
                if (this.isStartDate) {
                    const idToReplace = this.datepipe.transform(this.data.order.deliveries[1].deliveryDate, 'yyyy-MM-dd')
                    const newNextDeliveryDate = new Date(this.newDeliveryDate)
                    newNextDeliveryDate.setDate(newNextDeliveryDate.getDate() + this.data.days)
                    deliveryList.push(this.toDeliveryItem(newNextDeliveryDate))
                    this.replaceList.push(idToReplace)
                }
                data.newDelivery = {
                    replaceList: this.replaceList,
                    items: deliveryList
                }
            } else {
                var newDelivery = true
                this.deliveryDates = this.deliveryDatesMap(newDelivery)
                console.log(this.deliveryDates)

                for (let i = 0; i < this.deliveryDates.length; i++) {
                    if (newDelivery) {
                        if (this.deliveryDates[i].deliveryDate > new Date()) {
                            this.newNextDeliveryDate = this.deliveryDates[i].deliveryDate
                            break
                        }
                    } else {
                        if (this.deliveryDates[i] > new Date()) {
                            this.newNextDeliveryDate = this.deliveryDates[i]
                            break
                        }
                    }
                }

                data.deliveryDates = this.deliveryDatesMap(false)
                data.nextDeliveryDate = this.newNextDeliveryDate
                data.nextDeliveryDateString = this.datepipe.transform(this.newNextDeliveryDate, 'dd-MM-yyyy')
                const paymentDate = new Date(this.deliveryDates[this.deliveryDates.length - 1].deliveryDate)
                data.nextPaymentDate = this.datepipe.transform(paymentDate, 'yyyy-MM-dd')

                data.newDelivery = {
                    replaceList: this.replaceList,
                    items: this.deliveryDates
                }
            }

            // Add history data
            const orderHistoryItem = {
                boxId: this.data.order.boxId,
                boxName: this.data.order.boxName,
                checkoutSummary: this.data.order.checkoutSummary,
                deliveryDaysApart: this.data.order.deliveryDaysApart,
                orderCreated: this.data.order.orderCreated,
                orderId: this.data.order.orderId,
                orderReference: this.data.order.orderReference,
                paymentPlan: this.data.order.paymentPlan,
                productQuantity: this.data.order.productQuantity,
                products: this.data.order.products,
                shippingAddress: this.data.order.shippingAddress,
                subscriptionDetails: this.data.order.subscriptionDetails,
                userId: this.data.order.userId
            }
            var historyItem = {
                docId: this.datepipe.transform(new Date, 'yyyy-MM-dd_HH:mm') + '_days',
                changeType: 'Cycle changed.',
                changes: {
                    before: {
                        cycleDays: data.deliveryDaysApartBefore,
                        cycleDate: this.currentDeliveryDate
                    },
                    after: {
                        cycleDays: data.deliveryDaysApartAfter,
                        cycleDate: this.newDeliveryDate
                    },
                    dashboard: true
                },
                dateChanged: new Date(),
                order: orderHistoryItem
            }
            data.orderHistory = historyItem

            console.log(data)
            this.savingState = true
            this.saveChanges(data)
        }
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

    async saveChanges(data) {
        // Save
        this.userService.updateCycle(data.uid, data.deliveryDaysApartAfter, data.nextDeliveryDate)
        await this.orderService.updateOrderDays(data.uid, data.orderId, data.deliveryDaysApartAfter, data.nextDeliveryDate, this.isStartDate, data.orderHistory, data.deliveryDates, data.newDelivery)
        const updateSubscription = this.fun.httpsCallable('updateSubscriptionCall');
        updateSubscription(data).subscribe();
        this.loadingDone = true
        if (this.notifySlack) {
            const updateSlack = this.fun.httpsCallable('orderDaysApartChangedSlack');
            updateSlack(data).subscribe();
        }
    }

    deliveryDatesMap(newMode) {
        console.log(this.data)
        this.replaceList = [];
        var deliveryDays = [];
        var daysApart = this.data.days;
        var loopAmount = this.data.order.deliveries.length;
        var startDate
        for (let i = 0; i < loopAmount; i++) {
            var deliveryDate = null
            if (!(this.data.order.deliveries[i].deliveryDate instanceof Date)) {
                deliveryDate = new Date(this.data.order.deliveries[i].deliveryDate.toDate())
            } else {
                deliveryDate = new Date(this.data.order.deliveries[i].deliveryDate)
            }
            if (deliveryDate > new Date()) {
                const idToReplace = this.datepipe.transform(deliveryDate, 'yyyy-MM-dd')
                this.replaceList.push(idToReplace)
                if (!startDate) {
                    if (this.datePicker) {
                        deliveryDate = new Date(this.newDeliveryDate)
                    } else {
                        deliveryDate.setDate(deliveryDate.getDate() - this.data.order.deliveryDaysApart)
                        deliveryDate.setDate(deliveryDate.getDate() + daysApart)
                    }
                    startDate = new Date(deliveryDate)
                } else {
                    deliveryDate = new Date(startDate.setDate(startDate.getDate() + daysApart))
                }
                if (newMode) {
                    deliveryDays.push(this.toDeliveryItem(deliveryDate));
                } else {
                    deliveryDays.push(deliveryDate);
                }
            }
            //console.log(loopAmount, this.orders[index].deliveryDates[0], daysToAdd, daysApart, deliveryDate)
        }
        if (newMode && loopAmount < (this.data.order.paymentPlan + 1)) {
            console.log(deliveryDays)
            const thirteenthMonth = new Date(deliveryDays[deliveryDays.length - 1].deliveryDate)
            thirteenthMonth.setDate(thirteenthMonth.getDate() + daysApart)
            deliveryDays.push(this.toDeliveryItem(thirteenthMonth));
        }

        return deliveryDays;
    }
}