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
import { FirebaseDeliveryService } from 'src/app/services/firebase/delivery-service';
import { Helper } from 'src/app/shared/helper';

export interface AddDeliveryDialogData {
    order: any,
    deliveries: any,
    mode: string
}

@Component({
    selector: 'add-delivery-dialog',
    templateUrl: 'add-delivery-dialog.html',
})
export class AddDeliveryDialog implements OnInit {
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
        public dialogRef: MatDialogRef<AddDeliveryDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: AddDeliveryDialogData,
        private snackBar: MatSnackBar,
        private helper: Helper,
        public datepipe: DatePipe,
        public userService: UserService,
        public orderService: FirebaseOrderService,
        public fun: AngularFireFunctions,
        public deliveryService: FirebaseDeliveryService,) { }

    datePickerEvent(type: string, event: MatDatepickerInputEvent<Date>) {
        if (event.value < this.minDate) {
            console.log('In the past: ' + event.value);
            this.newDeliveryDate = this.minDate;
        } else {
            this.newDeliveryDate = new Date(event.value)
        }
    }

    ngOnInit(): void {
        const deliveries = this.dialogData.deliveries
        console.log(this.dialogData.order, deliveries)
        var currentNext = new Date(deliveries[0].deliveryDate.toDate())
        currentNext.setDate(currentNext.getDate() + this.dialogData.order.deliveryDaysApart)
        this.datePicker = currentNext
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onSelectChanged(days) {
        var diff = days - this.dialogData.order.deliveryDaysApart
        console.log(this.currentDeliveryDate, diff)
        if (!this.datePicker) {
            console.log(days, diff)
            const newDate = new Date(this.currentDeliveryDate)
            newDate.setDate(this.currentDeliveryDate.getDate() + diff)
            this.newDeliveryDate = newDate
            console.log(this.newDeliveryDate)
        }
    }

    add() {
        var data

        // Fill general data
        data = {
            uid: this.dialogData.order.userId,
            boxName: this.dialogData.order.boxName,
            orderId: this.dialogData.order.orderId,
            orderRef: this.dialogData.order.orderReference
        }

        // Fill delivery data
        var delivery = []
        var date = new Date(this.datePicker)
        delivery.push(this.helper.toDeliveryItem(date))

        data.delivery = delivery
        console.log(data)
        this.savingState = true
        this.saveChanges(data)
    }

    async saveChanges(data) {
        // Save
        await this.deliveryService.setDeliveries(data.orderId, data.delivery, this.dialogData.mode)
        this.dialogRef.close()
    }
}