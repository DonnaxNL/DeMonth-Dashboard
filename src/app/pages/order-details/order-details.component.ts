import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { FirestoreService } from 'src/app/services/firebase/firebase-service';
import { AngularFireFunctions } from '@angular/fire/functions';
import { firestore } from 'firebase';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { DeliveryDaysDialog } from './change-days/change-days.component';
import { PauseCancelSubscriptionDialog } from './pause-order/pause-order.component';
import { ChangeBoxDialog } from './change-box/change-box.component';
import { OrderHistoryDialog } from './history/change-history.component';
import { FirebaseOrderService } from 'src/app/services/firebase/order-service';
import { DatePipe } from '@angular/common';
import { FirebaseDeliveryService } from 'src/app/services/firebase/delivery-service';
import { AppComponent } from 'src/app/app.component';
import { first } from 'rxjs/operators';
import { PaymentLinkDialog } from './payment-link/payment-link.component';
import { AddDeliveryDialog } from './add-delivery/add-delivery.component';

export interface Product {
  id: string;
  brand: string;
  type: string;
  name: string;
  amount: number;
  price?: number;
}

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {
  sub: any;
  mode = 'live'
  dataLoaded = false

  customer$: Observable<any | null>
  customer
  userRole = [false, false, false, false, false]
  order$: Observable<any | null>
  orderId
  order
  deliveries$: Observable<any | null>
  deliveries
  today = new Date()
  showNextDelivery = false
  showMore = false

  allPayments
  dataSourceProducts
  dataSourceExtraProducts
  calculatedShipping = 0;
  paymentsOfOrder = [];
  allPaymentsOfOrder = [];
  showExpired = false
  billShipAddressSame = true
  dataSourceDeliveries = new MatTableDataSource()
  showUpcoming = false
  onlyUpcoming = [];
  currentDeliveries = [];
  deliveryList = [];
  deliveryListAll = [];
  dataSourcePayments = new MatTableDataSource()
  dataSourceIncentiveClaims = new MatTableDataSource()

  displayedColumns = ['brand', 'type', 'name', 'amount'];
  displayedColumnsExtraProducts = ['brand', 'type', 'name', 'price', 'amount'];
  displayedColumnsPayments = ['description', 'date', 'status', 'amount'];
  displayedColumnsDeliveries = ['deliveryNo', 'date', 'isPacked', 'isDelivered', 'isPaid'];
  displayedColumnsIncentiveClaims = ['orderRef', 'type', 'date', 'delivery'];

  @ViewChild(MatPaginator, { static: true }) deliveryPaginator: MatPaginator;

  constructor(
    private router: Router,
    private dataRoute: ActivatedRoute,
    private app: AppComponent,
    public fun: AngularFireFunctions,
    public fbService: FirestoreService,
    public deliveryService: FirebaseDeliveryService,
    public orderService: FirebaseOrderService,
    public datepipe: DatePipe,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    this.orderId = this.dataRoute.snapshot.paramMap.get('id')

    if (this.orderId == null) {
      this.router.navigate(['/orders'])
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.sub = this.dataRoute.data.subscribe((v) => {
        this.mode = v.mode;
        this.order = history.state.order
        if (!this.order) {
          this.order$ = this.fbService.getOrderByID(this.orderId, this.mode).valueChanges();
          this.order$.subscribe((data: any) => {
            if (data == null) {
              this.snackBar.open("Order not found!", "Close", {
                duration: 5000,
              });
              this.router.navigate(['/'])
            }
            this.order = data
            console.log('from fb:', this.order)
            this.getPayments()
            this.getDeliveries()
            this.getOrderDetails()
            this.getCustomerDetails()
          })
        } else {
          console.log('from route:', this.order)
          this.getPayments()
          this.getDeliveries()
          this.getOrderDetails()
          this.getCustomerDetails()
        }
      });
      this.dataSourceDeliveries = new MatTableDataSource(this.currentDeliveries);
      this.dataSourceDeliveries.paginator = this.deliveryPaginator
    }, 100);
  }

  openPaymentDetails(payment) {
    if (this.userRole[4]) {
      window.open("https://www.mollie.com/dashboard/org_4085344/payments/" + payment.id, "_blank");
    }
  }

  addNewDelivery() {
    const dialogRef = this.dialog.open(AddDeliveryDialog, {
      width: '300px',
      data: {
        order: this.order,
        deliveries: this.deliveryListAll,
        mode: this.mode
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result)
      if (result != undefined) {
        
      }
    });
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


  getDeliveries() {
    this.fbService.getDeliveriesFromOrderByID(this.orderId, this.mode).valueChanges().subscribe((data: any) => {
      this.currentDeliveries = [];
      this.onlyUpcoming = [];
      this.deliveryList = [];
      this.deliveryListAll = [];
      this.deliveries = data
      console.log(this.deliveries)
      for (let i = 0; i < this.deliveries.length; i++) {
        //this.deliveries[i].deliveryDate = data[i].deliveryDate.toDate()
        this.deliveries[i].number = i + 1
        this.deliveryListAll.push(this.deliveries[i])
        if (!(this.deliveries[i].deliveryDate instanceof firestore.Timestamp)) {
          this.deliveries[i].deliveryDate = new firestore.Timestamp(this.deliveries[i].deliveryDate.seconds, this.deliveries[i].deliveryDate.nanoseconds)
          console.log('converted', this.deliveries[i].deliveryDate)
        }
        if (this.deliveries[i].deliveryDate.toDate() < new Date()) {
          this.deliveryList.push(this.deliveries[i])
        } else {
          console.log(this.deliveries[i])
          if (this.order.subscriptionDetails.lastDeliveryDate && i < (this.deliveries.length - 1)) {
            this.deliveryList.push(this.deliveries[i])
            this.onlyUpcoming.push(this.deliveries[i].deliveryDate.toDate())
          } else {
            this.deliveryList.push(this.deliveries[i])
          }
        }
      }
      if (this.onlyUpcoming.length == 1 && this.order.paymentPlan != 0) {
        let loop = this.order.paymentPlan != 0 ? 12 : 1
        for (let i = 0; i < loop; i++) {
          var date = new Date(this.onlyUpcoming[0])
          var daysToAdd = this.order.deliveryDaysApart * i
          date.setDate(date.getDate() + daysToAdd)
          // var item = {
          //   deliveryDate: date
          // }
          this.onlyUpcoming.push(date)
        }
      } else if (this.onlyUpcoming.length == 0) {
        let loop = this.order.paymentPlan != 0 ? 12 : 1
        for (let i = 0; i < loop; i++) {
          let deliveryDate
          if (this.order.startDeliveryDate.toDate() > new Date()) {
            deliveryDate = new Date(this.order.startDeliveryDate.toDate())
          } else {
            deliveryDate = new Date(this.deliveryList[this.deliveryList.length - 1].deliveryDate.toDate())
          }
          deliveryDate.setDate(deliveryDate.getDate() + (i * this.order.deliveryDaysApart))
          // var deliveryItem = {
          //   deliveryDate: deliveryDate
          // }
          this.onlyUpcoming.push(deliveryDate)
        }
      }
      this.deliveryList.sort((a, b) => (a.deliveryDate < b.deliveryDate) ? 1 : ((b.deliveryDate < a.deliveryDate) ? -1 : 0));
      this.deliveryListAll.sort((a, b) => (a.deliveryDate < b.deliveryDate) ? 1 : ((b.deliveryDate < a.deliveryDate) ? -1 : 0));

      //console.log(this.onlyUpcoming, this.deliveryList, this.deliveryListAll)
      this.currentDeliveries = this.deliveryList
      //console.log(this.currentDeliveries)
      //console.log(this.deliveryListAll, this.onlyUpcoming)
      this.dataSourceDeliveries.data = this.currentDeliveries
      this.dataSourceDeliveries.paginator = this.deliveryPaginator
    })
  }

  getOrderDetails() {
    // Convert to Timestamp if not
    if (!(this.order.startDeliveryDate instanceof firestore.Timestamp)) {
      this.order.startDeliveryDate = new firestore.Timestamp(this.order.startDeliveryDate.seconds, this.order.startDeliveryDate.nanoseconds)
      console.log('converted', this.order.startDeliveryDate)
    }

    if (!this.order.deliveryDates) {
      // Convert to Timestamp if not
      if (this.order.nextDeliveryDate != null && !(this.order.nextDeliveryDate instanceof firestore.Timestamp)) {
        this.order.nextDeliveryDate = new firestore.Timestamp(this.order.nextDeliveryDate.seconds, this.order.nextDeliveryDate.nanoseconds)
        console.log('converted', this.order.nextDeliveryDate)
      }

      this.order.deliveryDates = [];
      var firstDelivery
      if (this.order.startDeliveryDate.toDate() > this.today) {
        firstDelivery = this.order.startDeliveryDate.toDate()
      } else {
        firstDelivery = this.order.nextDeliveryDate ? this.order.nextDeliveryDate.toDate() : null
      }
      if (firstDelivery) {
        for (let i = 0; i < 12; i++) {
          var deliveryDate = new Date(firstDelivery)
          var daysToAdd = this.order.deliveryDaysApart * i;
          deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
          this.order.deliveryDates.push(deliveryDate);
        }
      }
    } else {
      if (this.order.deliveryDates && this.order.paymentPlan != 0) {
        var convertedArray = [];
        for (let i = 0; i < this.order.deliveryDates.length; i++) {
          var date = new firestore.Timestamp(this.order.deliveryDates[i].seconds, this.order.deliveryDates[i].nanoseconds)
          convertedArray.push(date.toDate())
        }
        this.order.deliveryDates = convertedArray
      }
    }

    if (this.order.subscriptionDetails.lastDeliveryDate) {
      if (!(this.order.subscriptionDetails.lastDeliveryDate instanceof firestore.Timestamp)) {
        this.order.subscriptionDetails.lastDeliveryDate = new firestore.Timestamp(this.order.subscriptionDetails.lastDeliveryDate.seconds, this.order.subscriptionDetails.lastDeliveryDate.nanoseconds)
        console.log('converted', this.order.subscriptionDetails.lastDeliveryDate)
      }
    }

    this.orderService.getHistoryByOrderID(this.order.userId, this.order.orderId).valueChanges().subscribe((data: any) => {
      console.log('history', data)
      this.order.orderHistory = data
      this.getIncentiveClaims(data)
    })

    this.showNextDelivery = true

    if (this.order.subscriptionDetails.cancelDate) {
      if (!(this.order.subscriptionDetails.cancelDate instanceof firestore.Timestamp)) {
        this.order.subscriptionDetails.cancelDate = new firestore.Timestamp(this.order.subscriptionDetails.cancelDate.seconds, this.order.subscriptionDetails.cancelDate.nanoseconds)
        console.log('converted', this.order.subscriptionDetails.cancelDate)
      }
    }

    // Set coupon
    if (this.order.checkoutSummary.coupon) {
      if (this.order.orderHistory) {
        this.order.checkoutSummary.coupon.price = this.order.orderHistory[0].order.checkoutSummary.checkoutPrice - this.order.checkoutSummary.coupon.checkoutPrice
      } else {
        this.order.checkoutSummary.coupon.price = this.order.checkoutSummary.checkoutPrice - this.order.checkoutSummary.coupon.checkoutPrice
      }
      if (this.order.checkoutSummary.promo) {
        this.order.checkoutSummary.coupon.price = this.order.checkoutSummary.coupon.price - this.order.checkoutSummary.promo.price
      }
    }

    // Set paymentMethod
    if (this.order.paymentDetails.paymentMethod != null) {
      if (this.order.paymentDetails.paymentMethod == 'ideal') {
        this.order.paymentDetails.paymentMethod = 'iDEAL'
      } else if (this.order.paymentDetails.paymentMethod == 'creditcard') {
        this.order.paymentDetails.paymentMethod = 'Credit Card'
      } else if (this.order.paymentDetails.paymentMethod == 'afterpay') {
        this.order.paymentDetails.paymentMethod = 'Pay afterward'
      }
    }

    // Fill product array
    let products = [];
    if (this.order.products.pads) {
      for (let j = 0; j < this.order.products.pads.length; j++) {
        var productItem: Product = {
          id: this.order.products.pads[j].id,
          brand: this.order.products.pads[j].brand,
          type: 'Pads',
          name: this.order.products.pads[j].name,
          amount: this.order.products.pads[j].amount
        }
        products.push(productItem);
      }
    }
    if (this.order.products.tampons) {
      for (let j = 0; j < this.order.products.tampons.length; j++) {
        var productItem: Product = {
          id: this.order.products.tampons[j].id,
          brand: this.order.products.tampons[j].brand,
          type: 'Tampons',
          name: this.order.products.tampons[j].name,
          amount: this.order.products.tampons[j].amount
        }
        products.push(productItem);
      }
    }
    if (this.order.products.liners) {
      for (let j = 0; j < this.order.products.liners.length; j++) {
        var productItem: Product = {
          id: this.order.products.liners[j].id,
          brand: this.order.products.liners[j].brand,
          type: 'Liners',
          name: this.order.products.liners[j].name,
          amount: this.order.products.liners[j].amount
        }
        products.push(productItem);
      }
    }
    this.dataSourceProducts = products

    // Fill extra product array
    if (this.order.products.extraProducts) {
      let extraProducts = [];
      if (this.order.products.extraProducts.pads) {
        for (let j = 0; j < this.order.products.extraProducts.pads.length; j++) {
          var productItem: Product = {
            id: this.order.products.extraProducts.pads[j].id,
            brand: this.order.products.extraProducts.pads[j].brand,
            type: 'Pads',
            name: this.order.products.extraProducts.pads[j].name,
            amount: this.order.products.extraProducts.pads[j].amount,
            price: this.order.products.extraProducts.pads[j].price
          }
          extraProducts.push(productItem);
        }
      }
      if (this.order.products.extraProducts.tampons) {
        for (let j = 0; j < this.order.products.extraProducts.tampons.length; j++) {
          var productItem: Product = {
            id: this.order.products.extraProducts.tampons[j].id,
            brand: this.order.products.extraProducts.tampons[j].brand,
            type: 'Tampons',
            name: this.order.products.extraProducts.tampons[j].name,
            amount: this.order.products.extraProducts.tampons[j].amount,
            price: this.order.products.extraProducts.tampons[j].price
          }
          extraProducts.push(productItem);
        }
      }
      if (this.order.products.extraProducts.liners) {
        for (let j = 0; j < this.order.products.extraProducts.liners.length; j++) {
          var productItem: Product = {
            id: this.order.products.extraProducts.liners[j].id,
            brand: this.order.products.extraProducts.liners[j].brand,
            type: 'Liners',
            name: this.order.products.extraProducts.liners[j].name,
            amount: this.order.products.extraProducts.liners[j].amount,
            price: this.order.products.extraProducts.liners[j].price
          }
          extraProducts.push(productItem);
        }
      }
      this.dataSourceExtraProducts = extraProducts
    }
  }

  transferSub() {
    const data = {
      uid: this.order.userId,
      customerMollieId: this.customer.mollieTestCustomerIdOld,
      subscriptionId: this.order.subscriptionDetails.subscriptionId
    }
    console.log(data)
    const call = this.fun.httpsCallable('getMollieSubscriptionCall');
    call(data).subscribe((result) => {
      //console.log('getmollie', result)
      if (result != null) {
        console.log(result)
      } else {
        console.log(this.customer.uid, this.order.subscriptionDetails.subscriptionId)
      }
    });
  }

  getCustomerDetails() {
    this.customer$ = this.fbService.getCustomerByID(this.order.userId).valueChanges();
    this.customer$.subscribe((data: any) => {
      this.customer = data
      this.userRole = this.app.getUserRole()
      console.log(this.userRole)
      if (this.customer) {
        // Set boolean
        if (this.customer.address.street == this.order.shippingAddress.street) {
          this.billShipAddressSame = true
        } else {
          this.billShipAddressSame = false
        }
        //this.transferSub()
      } else {
        this.fbService.getUserDocRefByUID(this.order.userId).valueChanges().pipe(first()).subscribe((user: firebase.User) => {
          this.customer = {
            firstName: user.displayName.split(' ')[0],
            lastName: user.displayName.split(' ')[1],
            email: user.email
          }
        });
      }
      this.dataLoaded = true
    })
  }

  getIncentiveClaims(history: any) {
    var incentives = [];
    for (let index = 0; index < history.length; index++) {
      const element = history[index];
      var id = element.id.split("_")
      console.log(element, id)
      if (id[2] == "referral" || id[2] == "points") {
        const claimedBox = element.changes.boxClaimed
        const item = {
          orderId: claimedBox.orderId,
          orderRef: claimedBox.orderRef,
          type: id[2] == "referral" ? "DeMonthly Invite" : "DeMonthly Points",
          date: new firestore.Timestamp(claimedBox.claimedAt.seconds, claimedBox.claimedAt.nanoseconds).toDate(),
          delivery: claimedBox.startDeliveryDate ? new firestore.Timestamp(claimedBox.startDeliveryDate.seconds, claimedBox.startDeliveryDate.nanoseconds).toDate() : null
        }
        incentives.push(item)
      }
    }
    this.dataSourceIncentiveClaims.data = incentives
    console.log(incentives)
  }

  getPayments() {
    const allPaymentsCall = this.fun.httpsCallable('getPaymentsFromCustomer');
    allPaymentsCall({ uid: this.order.userId }).subscribe((result) => {
      console.log(result)
      this.allPayments = result
      this.prepareOrderPayments()
    });
  }

  openInFirebase() {
    if (this.mode == null || this.mode == 'live') {
      window.open('https://console.firebase.google.com/project/demonth-55207/firestore/data/orders/' + this.orderId, '_blank');
    } else {
      window.open('https://console.firebase.google.com/project/demonth-55207/firestore/data/test-orders/' + this.orderId, '_blank');
    }
  }

  showDeliveryDetails(orderId, delivery) {
    console.log(orderId, delivery, delivery.id)
    if (this.mode == null || this.mode == 'live') {
      this.router.navigate(['/orders/' + orderId + '/deliveries/' + delivery.id], { state: { order: null, delivery: null } });
    } else {
      this.router.navigate(['/test/orders/' + orderId + '/deliveries/' + delivery.id], { state: { order: null, delivery: null } });
    }
  }

  changeHistory() {
    console.log(this.order)
    this.orderService.getHistoryByOrderID(this.order.userId, this.order.orderId).valueChanges().subscribe((data: any) => {
      data.sort((a, b) => (a.dateChanged < b.dateChanged) ? 1 : ((b.dateChanged < a.dateChanged) ? -1 : 0));
      this.dialog.open(OrderHistoryDialog, {
        width: '500px',
        data: {
          history: data,
        }
      });
    })
  }

  editCycle() {
    console.log(this.order)
    this.order.deliveries = this.deliveries
    const dialogRef = this.dialog.open(DeliveryDaysDialog, {
      width: '450px',
      data: {
        order: this.order,
        days: parseInt(this.order.deliveryDaysApart)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
      if (result != undefined) {
        this.order.deliveryDaysApart = result.days
      }
    })
  }

  changeBox() {
    console.log(this.order)
    this.order.deliveries = this.deliveries
    const dialogRef = this.dialog.open(ChangeBoxDialog, {
      width: '450px',
      data: {
        order: this.order,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
      if (result != undefined) {
        //this.order.deliveryDaysApart = result.days
      }
    })
  }

  pauseCancelOrder(type: string) {
    console.log(this.order)
    this.order.deliveries = this.deliveries
    const dialogRef = this.dialog.open(PauseCancelSubscriptionDialog, {
      width: '500px',
      data: {
        index: 0,
        order: this.order,
        type: type
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
      if (result != undefined) {
        this.order.subscriptionDetails.subscriptionStatus = result.type
      }
    })
  }

  deleteOrder() {
    const dialogRef = this.dialog.open(DeleteOrderDialog, {
      width: '300px',
      data: {
        index: this.orderId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result)
      if (result != undefined) {
        this.fbService.deleteOrder(result.index, this.mode)
        this.snackBar.open("Order successfully deleted!", "Close", {
          duration: 5000,
        });
        if (this.mode == 'test') {
          this.router.navigate(['/test/orders'])
        } else {
          this.router.navigate(['/orders'])
        }
      }
    });
  }

  createPaymentLink() {
    const dialogRef = this.dialog.open(PaymentLinkDialog, {
      width: '500px',
      data: {
        order: this.order
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
    })
  }

  prepareOrderPayments() {
    // Current payments
    this.paymentsOfOrder = [];
    this.allPaymentsOfOrder = [];
    let lastBoxNumber = 0
    this.allPayments.reverse()
    console.log(this.deliveryListAll)
    for (let j = 0; j < this.allPayments.length; j++) {
      const description = this.allPayments[j].description.split(' | ')
      const orderRef = description[0].replace('[Retry] ', '')
      const isRetry = this.allPayments[j].description.includes('Retry')
      //console.log(orderRef, isRetry)
      if (this.allPayments[j].metadata != null &&
        this.order.orderId == this.allPayments[j].metadata.OrderId ||
        this.order.subscriptionDetails.subscriptionId != null &&
        this.order.subscriptionDetails.subscriptionId == this.allPayments[j].subscriptionId ||
        this.order.orderReference == orderRef) {
        let status;
        if (this.allPayments[j].details != null &&
          this.allPayments[j].details.bankReasonCode) {
          if (this.allPayments[j].details.bankReasonCode == 'AM04') {
            status = 'Insufficient funds'
          } else if (this.allPayments[j].details.bankReasonCode == 'MD01') {
            status = 'Invalid mandate'
          } else if (this.allPayments[j].details.bankReasonCode == 'MD06') {
            status = 'Payment reversal'
          } else if (this.allPayments[j].details.bankReasonCode == 'MS02') {
            status = 'Transaction refused'
          } else {
            status = this.allPayments[j].details.bankReasonCode
          }
        } else {
          //console.log(j, this.allPayments[j].status)
          if (this.allPayments[j].status == 'paid') {
            status = 'Paid'
          } else if (this.allPayments[j].status == 'open') {
            status = 'Open'
          } else if (this.allPayments[j].status == 'canceled') {
            status = 'Canceled'
          } else if (this.allPayments[j].status == 'pending') {
            status = 'Pending'
          } else if (this.allPayments[j].status == 'expired') {
            status = 'Expired'
          } else if (this.allPayments[j].status == 'failed') {
            status = 'Failed'
          }
        }
        if (this.allPayments[j].amountRefunded != null && this.allPayments[j].amountRefunded.value != '0.00') {
          if (this.allPayments[j].amount.value == this.allPayments[j].amountRefunded.value) {
            status = 'Refunded'
          } else {
            status = 'Partially Refunded'
          }
        }
        let box = 0
        const date = new Date(this.allPayments[j].createdAt)
        const deliveries = Object.assign([], this.deliveryListAll);
        deliveries.reverse()
        for (let i = 0; i < deliveries.length; i++) {
          const item = deliveries[i];
          const dateString = this.datepipe.transform(date, 'yyyy-MM-dd')
          const creditcardDate = item.deliveryDate.toDate()
          creditcardDate.setDate(creditcardDate.getDate()-1)
          const creditcardDateString = this.datepipe.transform(creditcardDate, 'yyyy-MM-dd')
          //console.log(creditcardDateString, dateString)
          if (item.id == dateString || creditcardDateString == dateString) {
            box = item.number
            lastBoxNumber = item.number
            break;
          } else if (isRetry) {
            box = lastBoxNumber
            break;
          }
        }
        
        let description
        if (this.allPayments[j].sequenceType == 'first') {
          box = 1
          //description = this.allPayments[j].description.split("-", 2)[0];
          description = 'First payment | Box ' + box
        } else if (this.order.paymentPlan == 0) {
          description = this.allPayments[j].description.split(' | ')[1]
        } else {
          description = isRetry ? '[Retry] ' : ''
          if (box != 0) {
            description = description + 'Payment | Box ' + box
          } else {
            description = description + 'Payment'
          }
          //description = description + 'Payment for ' + date.toLocaleString('en', { month: 'long' }) + ' ' + date.getFullYear()
        }
        const usedData = {
          id: this.allPayments[j].id,
          boxNumber: box,
          description: description,
          date: date,
          status: status,
          amount: parseFloat(this.allPayments[j].amount.value),
          paymentItem: this.allPayments[j]
        }
        console.log(usedData)
        if (box != 0 || 
            this.allPayments[j].method == 'creditcard') {
          if (this.allPayments[j].status != 'expired') {
            this.paymentsOfOrder.push(usedData)
            this.allPaymentsOfOrder.push(usedData)
          } else {
            this.allPaymentsOfOrder.push(usedData)
          }
        }
      }
      
    }
    this.paymentsOfOrder.reverse()
    this.allPaymentsOfOrder.reverse()
    this.dataSourcePayments = new MatTableDataSource(this.paymentsOfOrder)
  }

  showExpiredPayments() {
    if (this.showExpired) {
      this.showExpired = false
      this.dataSourcePayments.data = this.paymentsOfOrder
    } else {
      this.showExpired = true
      this.dataSourcePayments.data = this.allPaymentsOfOrder
    }
  }

  showUpcomingDeliveries() {
    console.log(this.deliveryList, this.deliveryListAll)
    if (this.showUpcoming) {
      this.showUpcoming = false
      this.currentDeliveries = this.deliveryList
      this.dataSourceDeliveries.data = this.currentDeliveries
      this.dataSourceDeliveries.paginator = this.deliveryPaginator
    } else {
      this.showUpcoming = true
      this.currentDeliveries = this.deliveryListAll
      this.dataSourceDeliveries.data = this.currentDeliveries
      this.dataSourceDeliveries.paginator = this.deliveryPaginator
    }
  }

  showOrderDetails(order) {
    console.log(order)
    if (this.mode == null || this.mode == 'live') {
      this.router.navigate(['/orders/', order.orderId]).then(page => { window.location.reload(); });
    } else {
      this.router.navigate(['/test/orders/', order.orderId]).then(page => { window.location.reload(); });
    }
  }
}

export interface DialogData {
  orderIndex: number
}

@Component({
  selector: 'delete-dialog',
  templateUrl: 'delete-dialog.html',
})
export class DeleteOrderDialog {

  constructor(
    public dialogRef: MatDialogRef<DeleteOrderDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}