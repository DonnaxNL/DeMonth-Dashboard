import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularFireFunctions } from '@angular/fire/functions';
import { FirestoreService } from 'src/app/services/firebase/firebase-service';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { AppComponent } from 'src/app/app.component';
import { UserService } from 'src/app/services/firebase/user-service';

@Component({
  selector: 'app-customers-details',
  templateUrl: './customer-details.component.html',
  styleUrls: ['./customer-details.component.scss']
})
export class CustomerDetailsComponent implements OnInit {
  customer$: Observable<any | null>
  customerId
  customer
  userRole = [false, false, false, false, false]
  showHidden = false

  orders$: Observable<any | null>
  orders
  subscriptionList = [];
  allSubscriptionList = [];

  payments
  paymentList
  allPaymentsList

  dataSourceOrders
  displayedColumns: string[] = ['orderRef', 'boxName', 'paymentPlan', 'cycleDays', 'status', 'created']
  dataSourcePayments
  displayedColumnsPayments: string[] = ['description', 'date', 'status', 'amount'];
  showExpired

  constructor(
    private router: Router,
    private dataRoute: ActivatedRoute,
    private app: AppComponent,
    public fun: AngularFireFunctions,
    public fbService: FirestoreService,
    public userService: UserService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    this.customerId = this.dataRoute.snapshot.paramMap.get('id')

    if (this.customerId == null) {
      this.router.navigate(['/customers'])
    }

    this.customer = history.state.customer
    if (!this.customer) {
      this.customer$ = this.fbService.getCustomerByID(this.customerId).valueChanges();
      this.customer$.subscribe((data: any) => {
        this.customer = data
        console.log('from fb:', this.customer)
        this.orders$ = this.fbService.getAllOrdersByUserID(this.customerId).valueChanges();
        this.orders$.subscribe((data: any) => {
          if (data.length > 0) {
            this.orders = data
            this.orders.sort((a, b) => (a.orderCreated < b.orderCreated) ? 1 : ((b.orderCreated < a.orderCreated) ? -1 : 0));
            this.prepareOrderDetails()
          }
        })
      })
    } else {
      console.log('from route:', this.customer)
      this.orders$ = this.fbService.getAllOrdersByUserID(this.customerId).valueChanges();
      this.orders$.subscribe((data: any) => {
        if (data.length > 0) {
          this.orders = data
          this.orders.sort((a, b) => (a.orderCreated < b.orderCreated) ? 1 : ((b.orderCreated < a.orderCreated) ? -1 : 0));
          this.prepareOrderDetails()
        }
      })
    }

    //Get payments
    const allPaymentsCall = this.fun.httpsCallable('getPaymentsFromCustomer');
    allPaymentsCall({ uid: this.customerId }).subscribe((result) => {
      console.log(result)
      this.payments = result
      this.preparePayments()
    });
  }

  prepareOrderDetails() {
    this.userRole = this.app.getUserRole()
    this.subscriptionList = []
    this.allSubscriptionList = []
    for (let i = 0; i < this.orders.length; i++) {
      var orderItem = {
        orderId: this.orders[i].orderId,
        orderRef: this.orders[i].orderReference,
        created: this.orders[i].orderCreated.toDate(),
        boxName: this.orders[i].boxName,
        paymentPlan: this.orders[i].paymentPlan,
        cycleDays: parseInt(this.orders[i].deliveryDaysApart),
        status: this.orders[i].subscriptionDetails.subscriptionStatus,
        fullOrder: this.orders[i]
      }
      if (orderItem.status == 'active' || orderItem.status == 'pending' || 
          orderItem.status == 'canceled' || orderItem.status == 'paused' ) {
          this.subscriptionList.push(orderItem)
          this.allSubscriptionList.push(orderItem)
      } else {
        this.allSubscriptionList.push(orderItem)
      }
    }
    console.log(this.subscriptionList)
    this.dataSourceOrders = new MatTableDataSource(this.subscriptionList)
  }

  preparePayments() {
    this.paymentList = [];
    this.allPaymentsList = [];
    for (let j = 0; j < this.payments.length; j++) {
      let status;
      if (this.payments[j].details != null &&
        this.payments[j].details.bankReasonCode) {
        if (this.payments[j].details.bankReasonCode == 'AM04') {
          status = 'Insufficient funds'
        } else if (this.payments[j].details.bankReasonCode == 'MD01') {
          status = 'Invalid mandate'
        } else if (this.payments[j].details.bankReasonCode == 'MD06') {
          status = 'Payment reversal'
        } else if (this.payments[j].details.bankReasonCode == 'MS02') {
          status = 'Transaction refused'
        } else {
          status = this.payments[j].details.bankReasonCode
        }
      } else {
        //console.log(j, this.payments[j].status)
        if (this.payments[j].status == 'paid') {
          status = 'Paid'
        } else if (this.payments[j].status == 'open') {
          status = 'Open'
        } else if (this.payments[j].status == 'canceled') {
          status = 'Canceled'
        } else if (this.payments[j].status == 'pending') {
          status = 'Pending'
        } else if (this.payments[j].status == 'expired') {
          status = 'Expired'
        } else if (this.payments[j].status == 'failed') {
          status = 'Failed'
        }
      }
      if (this.payments[j].amountRefunded != null && this.payments[j].amountRefunded.value != '0.00') {
        status = 'Refunded'
      }

      const date = new Date(this.payments[j].createdAt)
      let description
      if (this.payments[j].sequenceType == 'first') {
        description = this.payments[j].description.split("-", 2)[0];
      } else {
        description = 'Payment - ' + date.toLocaleString('en', { month: 'long' }) + ' ' + date.getFullYear()
      }
      const usedData = {
        // id: "#" + (this.allPayments[j].id).slice(3,13),
        description: description,
        date: date,
        status: status,
        amount: parseFloat(this.payments[j].amount.value)
      }
      if (this.payments[j].status != 'expired') {
        this.paymentList.push(usedData)
        this.allPaymentsList.push(usedData)
      } else {
        this.allPaymentsList.push(usedData)
      }
    }
    this.dataSourcePayments = new MatTableDataSource(this.paymentList)
  }

  openInFirebase() {
    window.open('https://console.firebase.google.com/project/demonth-55207/firestore/data/userdata/' + this.customerId, '_blank');
  }

  showHiddenSubscriptions() {
    if (this.showHidden) {
      this.showHidden = false
      this.dataSourceOrders.data = this.subscriptionList
    } else {
      this.showHidden = true
      this.dataSourceOrders.data = this.allSubscriptionList
    }
  }

  showExpiredPayments() {
    if (this.showExpired) {
      this.showExpired = false
      this.dataSourcePayments = this.paymentList
    } else {
      this.showExpired = true
      this.dataSourcePayments = this.allPaymentsList
    }
  }

  showOrderDetails(order) {
    console.log(order)
    this.router.navigate(['/orders/' + order.orderId], { state: { order: order.fullOrder } });
  }
}
