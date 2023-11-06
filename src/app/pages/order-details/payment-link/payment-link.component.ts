import { Component, Inject, OnInit } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface PaymentLinkDialogData {
    order: any
}

@Component({
    selector: 'payment-link-dialog',
    templateUrl: 'payment-link-dialog.html',
})
export class PaymentLinkDialog implements OnInit {
    loadingDone = false
    paymentLink = ''
    expiresAt = new Date()

    constructor(
        public dialogRef: MatDialogRef<PaymentLinkDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: PaymentLinkDialogData,
        public fun: AngularFireFunctions) { }

    ngOnInit(): void {
        this.prepareCall()
    }

    prepareCall() {
        var address = {
            streetAndNumber: this.dialogData.order.shippingAddress.street + " " + this.dialogData.order.shippingAddress.houseNo,
            city: this.dialogData.order.shippingAddress.city,
            postalCode: this.dialogData.order.shippingAddress.postalCode,
            country: 'NL'
        }
        let firstPaymentAmount
        let description
        console.log(this.dialogData.order.checkoutSummary.coupon, this.dialogData.order.checkoutSummary, this.dialogData.order.checkoutSummary)
        if (this.dialogData.order.checkoutSummary.coupon) {
            if (this.dialogData.order.checkoutSummary.coupon.checkoutPrice != 0) {
                firstPaymentAmount = '' + (this.dialogData.order.checkoutSummary.coupon.checkoutPrice / 100).toFixed(2)
                description = "First payment - Order #" + this.dialogData.order.orderReference
            } else {
                // Not supported
            }
        } else {
            if (this.dialogData.order.checkoutSummary.promo && this.dialogData.order.checkoutSummary.promo.discount > 0) {
                firstPaymentAmount = '' + (this.dialogData.order.checkoutSummary.promo.checkoutPrice / 100).toFixed(2)
            } else if (this.dialogData.order.checkoutSummary.referral && this.dialogData.order.checkoutSummary.referral.discount > 0) {
                firstPaymentAmount = '' + (this.dialogData.order.checkoutSummary.referral.checkoutPrice / 100).toFixed(2)
            } else {
                firstPaymentAmount = '' + (this.dialogData.order.checkoutSummary.checkoutPrice / 100)
            }
            description = "First payment - Order #" + this.dialogData.order.orderReference
        }
        var productData = {
            uid: this.dialogData.order.userId,
            amount: firstPaymentAmount,
            orderRef: this.dialogData.order.orderReference,
            orderId: this.dialogData.order.orderId,
            description: description,
            shippingAddress: address,
            paymentMethod: ['ideal', 'bancontact', 'creditcard', 'applepay']
        }
        console.log(productData)
        const firstPaymentCall = this.fun.httpsCallable('firstPayment');
        firstPaymentCall(productData).subscribe((result) => {
            console.log(result)
            this.showPaymentLink(result)
        });
    }

    showPaymentLink(result: any) {
        this.loadingDone = true
        this.expiresAt = new Date(result.expiresAt)
        this.paymentLink = result._links.checkout.href
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}