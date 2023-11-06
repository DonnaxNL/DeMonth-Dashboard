import { Component, OnInit, ViewChild } from '@angular/core';
import { FirestoreService } from 'src/app/services/firebase/firebase-service';
import { Observable } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import * as XLSX from 'xlsx';
import { format } from 'util';
import { UserData } from 'src/app/models/userdata';
import { firestore } from 'firebase/app';
import Timestamp = firestore.Timestamp;
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { OrderService } from 'src/app/services/order-service';
import { UserService } from 'src/app/services/firebase/user-service';
import { first } from 'rxjs/operators';
import { AngularFireFunctions } from '@angular/fire/functions';
import { FirebaseDeliveryService } from 'src/app/services/firebase/delivery-service';
import { AppComponent } from 'src/app/app.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  sub: any;
  mode = 'live'
  dataLoaded = false

  orders$: Observable<any | null>
  userData$: Observable<UserData | null>;
  orders = [];
  activeOrders = [];
  canceledOrders = [];
  promoOrders = [];
  allData = [];
  allOnGoing = [];
  dataSourceActive
  dataSourcePending
  dataSourceArchived
  dataSourcePromo
  dataSourcePaused
  dataSourceCanceled
  dataSourceArchivedCancelations
  dataSourceOther
  promoActive = 0
  promoPaused = 0
  promoCanceled = 0
  checked = false
  showArchived = false
  showArchivedCancelations = false
  displayedColumns: string[] = ['orderRef', 'boxName', 'paymentPlan', 'cycleDays', 'customer', 'created']
  displayedColumnsPromo: string[] = ['orderRef', 'boxName', 'paymentPlan', 'discount', 'customer', 'status', 'created']
  displayedColumnsPaused: string[] = ['orderRef', 'boxName', 'paymentPlan', 'cycleDays', 'customer', 'resume']
  displayedColumnsCanceled: string[] = ['orderRef', 'boxName', 'paymentPlan', 'customer', 'canceledAt', 'cancelReason']
  displayedColumnsOther: string[] = ['orderRef', 'boxName', 'customer', 'paymentsDue']

  selection = new SelectionModel(true, []);
  failedOrders = [];
  pendingThreshold = new Date()

  pausedSubs = [];
  rationCancelations = [];
  oldSubs = [];

  refresh = false

  @ViewChild('activeSort', { static: true }) activeSort: MatSort;
  @ViewChild('promoSort', { static: true }) promoSort: MatSort;
  @ViewChild('pendingSort', { static: true }) pendingSort: MatSort;
  @ViewChild('pausedSort', { static: true }) pausedSort: MatSort;
  @ViewChild('canceledSort', { static: true }) canceledSort: MatSort;
  @ViewChild('activePaginator', { static: true }) activePaginator: MatPaginator;
  @ViewChild('pausedPaginator', { static: true }) pausedPaginator: MatPaginator;
  @ViewChild('canceledPaginator', { static: true }) canceledPaginator: MatPaginator;
  @ViewChild('afterpayPaginator', { static: true }) afterpayPaginator: MatPaginator;

  constructor(
    public fbService: FirestoreService,
    public deliveryService: FirebaseDeliveryService,
    public userService: UserService,
    public fun: AngularFireFunctions,
    private router: Router,
    private route: ActivatedRoute,
    public datepipe: DatePipe,
    private app: AppComponent) { }

  ngOnInit() {
    this.pendingThreshold.setDate(this.pendingThreshold.getDate() - 30)
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.sub = this.route
        .data
        .subscribe((v) => {
          this.mode = v.mode;
          this.orders = history.state.orders
          if (this.orders) {
            console.log('route', this.orders)
            this.orders.sort((a, b) => (a.orderCreated < b.orderCreated) ? 1 : ((b.orderCreated < a.orderCreated) ? -1 : 0));
            this.prepareOrderDetails()
          } else {
            this.app.addToSubscriptions(this.fbService.getAllOrders(this.mode).valueChanges().subscribe((data: any) => {
              if (this.orders == null || this.refresh) {
                this.orders = data
                console.log('fs', this.orders)
                this.orders.sort((a, b) => (a.orderCreated < b.orderCreated) ? 1 : ((b.orderCreated < a.orderCreated) ? -1 : 0));
                this.prepareOrderDetails()
              }

            }))
          }
        });
    }, 100);
  }

  showDetails(order) {
    console.log(order)
    if (this.mode == null || this.mode == 'live') {
      this.router.navigate(['/orders/' + order.orderId], { state: { order: order.fullOrder } });
    } else {
      this.router.navigate(['/test/orders/' + order.orderId], { state: { order: order.fullOrder } });
    }
  }

  exportToExcel(type: string) {
    var source
    var description
    var wscols = [
      { wch: 10 }, //Ref
      { wch: 10 }, //Created
      { wch: 5 }, //StartDate
      { wch: 20 }, //Customer
      { wch: 20 }, //Email
      { wch: 9 }, //Box
      { wch: 10 }, //Plan
      { wch: 8 }, //Cycle
      { wch: 10 }, //Status
    ];
    if (type == 'All') {
      description = 'DeMonth_AllActiveSubscriptions_'
      console.log(this.allOnGoing)
      //var wsAct: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.allOnGoing);
      var wsAct: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSourceActive.data);
      var wsPro: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSourcePromo.data);
      var wsPau: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSourcePaused.data);
      var wsCan: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSourceCanceled.data);
      wsAct['!cols'] = wscols;
      wsPro['!cols'] = wscols;
      wsPau['!cols'] = wscols;
      wsCan['!cols'] = wscols;
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsAct, 'Active');
      XLSX.utils.book_append_sheet(wb, wsPro, 'Promo');
      XLSX.utils.book_append_sheet(wb, wsPau, 'Paused');
      XLSX.utils.book_append_sheet(wb, wsCan, 'Canceled');

      const today = new Date();
      const date = today.getFullYear() + '' + format(today.getMonth() + 1).padStart(2, '0') + '' + format(today.getDate()).padStart(2, '0')
      XLSX.writeFile(wb, description + date + '.xlsx');
    } else {
      if (type == 'Active') {
        source = this.dataSourceActive.data
        description = 'DeMonth_ActiveSubscriptions_'
      } else if (type == 'Promotion') {
        source = this.dataSourcePromo.data
        description = 'DeMonth_PromotionSubscriptions_'
      } else if (type == 'Canceled') {
        source = this.dataSourceCanceled.data
        description = 'DeMonth_CanceledSubscriptions_'
      }
      console.log(source, this.dataSourceCanceled.data)
      var ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(source);
      ws['!cols'] = wscols;
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type);
      const today = new Date();
      const date = today.getFullYear() + '' + format(today.getMonth() + 1).padStart(2, '0') + '' + format(today.getDate()).padStart(2, '0')
      XLSX.writeFile(wb, description + date + '.xlsx');
    }
  }

  applyFilter(event: Event, type) {
    const filterValue = (event.target as HTMLInputElement).value;
    switch (type) {
      case 'active':
        this.dataSourceActive.filter = filterValue.trim().toLowerCase();
        break;
      case 'pending':
        this.dataSourcePending.filter = filterValue.trim().toLowerCase();
        break;
      case 'promo':
        this.dataSourcePromo.filter = filterValue.trim().toLowerCase();
        break;
      case 'canceled':
        this.dataSourceCanceled.filter = filterValue.trim().toLowerCase();
        break;
      default:
        break;
    }
  }

  async prepareOrderDetails() {
    this.allData = [];
    this.allOnGoing = [];
    let tableListActive = [];
    let tableListPending = [];
    let tableListArchive = [];
    let tableListPaused = [];
    let tableListCanceled = [];
    let tableListArchivedCanceled = [];
    let tableListOther = [];
    this.promoOrders = [];
    this.promoActive = 0
    this.promoPaused = 0
    this.promoCanceled = 0
    this.pausedSubs = [];
    for (let i = 0; i < this.orders.length; i++) {
      this.userData$ = this.fbService.getUserInfoRefByUID(this.orders[i].userId).valueChanges().pipe(first());
      this.app.addToSubscriptions(this.userData$.subscribe((data: UserData) => {
        //const userData = await this.userService.getUser(this.orders[i].userId)
        const userData = data
        if (!(this.orders[i].orderCreated instanceof Timestamp)) {
          this.orders[i].orderCreated = new Timestamp(this.orders[i].orderCreated.seconds, this.orders[i].orderCreated.nanoseconds)
        }
        if (!(this.orders[i].startDeliveryDate instanceof Timestamp)) {
          this.orders[i].startDeliveryDate = new Timestamp(this.orders[i].startDeliveryDate.seconds, this.orders[i].startDeliveryDate.nanoseconds)
        }
        if (this.orders[i].nextDeliveryDate && !(this.orders[i].nextDeliveryDate instanceof Timestamp)) {
          this.orders[i].nextDeliveryDate = new Timestamp(this.orders[i].nextDeliveryDate.seconds, this.orders[i].nextDeliveryDate.nanoseconds)
        }
        if (this.orders[i].deliveryDates && !(this.orders[i].deliveryDates[0] instanceof Timestamp)) {
          for (let index = 0; index < this.orders[i].deliveryDates.length; index++) {
            const date = this.orders[i].deliveryDates[index];
            this.orders[i].deliveryDates[index] = new Timestamp(date.seconds, date.nanoseconds)
          }
        }
        if (this.orders[i].subscriptionDetails.cancelDate && !(this.orders[i].subscriptionDetails.cancelDate instanceof Timestamp)) {
          this.orders[i].subscriptionDetails.cancelDate = new Timestamp(this.orders[i].subscriptionDetails.cancelDate.seconds, this.orders[i].subscriptionDetails.cancelDate.nanoseconds)
        }
        var resumeDate
        if (this.orders[i].subscriptionDetails.subscriptionStatus == 'paused') {
          if (this.orders[i].paymentPlan == 1) {
            if (this.orders[i].nextDeliveryDate != null) {
              resumeDate = this.orders[i].nextDeliveryDate.toDate()
            } else {
              console.log(this.orders[i])
            }
          } else if (this.orders[i].paymentPlan > 1) {
            if (this.orders[i].deliveryDates != null) {
              resumeDate = this.orders[i].deliveryDates[this.orders[i].deliveryDates.length - 1].toDate()
            } else {
              console.log(this.orders[i])
            }
          }
        }
        var customer = ''
        var email = ''
        if (userData != null) {
          if (userData.lastNamePrefix) {
            customer = userData.firstName + " " + userData.lastNamePrefix + " " + userData.lastName
          } else {
            customer = userData.firstName + " " + userData.lastName
          }
          email = userData.email
          var orderItem = this.getOrderItem(i, customer, email, resumeDate, userData)
          this.fillList(i, orderItem, tableListActive, tableListPending, tableListArchive, tableListPaused, tableListCanceled, tableListArchivedCanceled, tableListOther)
        } else {
          this.fbService.getUserDocRefByUID(this.orders[i].userId).valueChanges().pipe(first()).subscribe((user: firebase.User) => {
            customer = user.displayName != '' ? user.displayName : user.email
            email = user.email
            var orderItem = this.getOrderItem(i, customer, email, resumeDate, user)
            this.fillList(i, orderItem, tableListActive, tableListPending, tableListArchive, tableListPaused, tableListCanceled, tableListArchivedCanceled, tableListOther)
          });
        }
        if (i == this.orders.length - 1) {
          this.dataLoaded = true
        }
      }))
    }
    //console.log(this.failedOrders)
  }

  getOrderItem(i, customer, email, resumeDate, userData) {
    //const products = this.getProducts(this.orders[i].products)

    return {
      orderId: this.orders[i].orderId,
      orderRef: this.orders[i].orderReference,
      created: this.orders[i].orderCreated.toDate(),
      startDate: this.orders[i].startDeliveryDate.toDate(),
      customer: customer,
      email: email,
      boxName: this.orders[i].boxName,
      paymentPlan: this.orders[i].paymentPlan,
      cycleDays: parseInt(this.orders[i].deliveryDaysApart),
      paymentMethod: this.orders[i].paymentDetails.paymentMethod,
      status: this.orders[i].subscriptionDetails.subscriptionStatus,
      discount: this.orders[i].checkoutSummary.coupon ? this.orders[i].checkoutSummary.coupon.discount : null,
      resume: resumeDate,
      canceledAt: this.orders[i].subscriptionDetails.cancelDate ? this.orders[i].subscriptionDetails.cancelDate.toDate() : null,
      cancelDuration: this.orders[i].subscriptionDetails.cancelDate ? this.getDiff(this.orders[i], 'cancel') : null,
      activeDays: this.getDiff(this.orders[i], 'active'),
      openPayments: this.orders[i].subscriptionDetails.openPayments,
      fullOrder: this.orders[i],
      fullUser: userData
    }
  }

  getDiff(order, type) {
    var diff
    if (type == 'cancel') {
      diff = Math.abs(order.subscriptionDetails.cancelDate.toDate().getTime() - order.startDeliveryDate.toDate().getTime());
    } else if (type == 'active') {
      diff = Math.abs(new Date().getTime() - order.startDeliveryDate.toDate().getTime());
    }
    return Math.ceil(diff / (1000 * 3600 * 24));
  }

  fillList(i, orderItem, tableListActive, tableListPending, tableListArchive, tableListPaused, tableListCanceled, tableListArchivedCanceled, tableListOther) {
    if (this.orders[i].checkoutSummary.coupon) {
      if (this.orders[i].subscriptionDetails.subscriptionStatus == 'active') {
        this.promoActive = this.promoActive + 1
        this.promoOrders.push(orderItem)
        this.allOnGoing.push(orderItem)
      } else if (this.orders[i].subscriptionDetails.subscriptionStatus == 'paused') {
        this.promoPaused = this.promoPaused + 1
        this.promoOrders.push(orderItem)
        this.allOnGoing.push(orderItem)
      } else if (this.orders[i].subscriptionDetails.subscriptionStatus == 'canceled') {
        if (orderItem.discount > 100) {
          this.deliveryService.getDeliveriesFromOrderByID(orderItem.orderId, this.mode).valueChanges().subscribe((data: any) => {
            if (data.length > 2) {
              this.rationCancelations.push({ amount: data.length - 1, type: 'coupon' })
            }
          });
        }
        this.promoCanceled = this.promoCanceled + 1
        this.promoOrders.push(orderItem)
        this.oldSubs.push(orderItem)
      } else if (this.orders[i].subscriptionDetails.subscriptionStatus == 'paused+') {
        tableListOther.push(orderItem)
        this.allOnGoing.push(orderItem)
      }
    } else {
      if (this.orders[i].subscriptionDetails != null &&
        this.orders[i].subscriptionDetails.subscriptionStatus != null &&
        this.orders[i].subscriptionDetails.subscriptionStatus == 'active' ||
        this.orders[i].subscriptionDetails.subscriptionStatus == 'canceled' &&
        this.orders[i].startDeliveryDate.toDate() > new Date()) {
        if (this.orders[i].paymentDetails.paymentMethod == 'afterpay') {
          tableListOther.push(orderItem)
          this.allData.push(orderItem)
        } else {
          // var pauseItem = {
          //   mollieCustomerId: orderItem.fullUser.mollieCustomerId,
          //   mollieCustomerIdOld: orderItem.fullUser.mollieCustomerIdOld,
          //   fullOrder: orderItem.fullOrder
          // }
          // this.pausedSubs.push(pauseItem)
          if (this.orders[i].paymentPlan != 0) {
            tableListActive.push(orderItem)
            this.allData.push(orderItem)
            this.allOnGoing.push(orderItem)
          }
        }
      } else {
        if (this.orders[i].subscriptionDetails.subscriptionStatus == 'pending' &&
          this.orders[i].paymentDetails.paymentMethod != null) {
          if (this.orders[i].paymentDetails.paymentMethod == 'afterpay') {
            tableListOther.push(orderItem)
            this.allData.push(orderItem)
          } else {
            if (orderItem.created < this.pendingThreshold) {
              tableListArchive.push(orderItem)
            } else {
              tableListPending.push(orderItem)
            }
            //this.allData.push(orderItem)
          }
        } else if (this.orders[i].subscriptionDetails.subscriptionStatus == 'stripe') {
          tableListOther.push(orderItem)
          this.allData.push(orderItem)
        } else if (this.orders[i].subscriptionDetails.subscriptionStatus == 'paused') {
          tableListPaused.push(orderItem)
          this.allData.push(orderItem)
          this.allOnGoing.push(orderItem)
        } else if (this.orders[i].subscriptionDetails.subscriptionStatus == 'canceled' &&
          this.orders[i].paymentDetails.paymentMethod != null) {
          // this.deliveryService.getDeliveriesFromOrderByID(orderItem.orderId, this.mode).valueChanges().subscribe((data: any) => {
          //   if (data.length > 2) {
          //     this.rationCancelations.push({ amount: data.length - 1, type: 'normal' })
          //   }
          // });
          // deepcode ignore DateMonthIndex: Meant to be Feb
          if (orderItem.canceledAt && orderItem.canceledAt > new Date(2021, 1, 13)) {
            tableListCanceled.push(orderItem)
            this.oldSubs.push(orderItem)
          } else {
            tableListArchivedCanceled.push(orderItem)
            this.oldSubs.push(orderItem)
          }
          if (orderItem.openPayments) {
            tableListOther.push(orderItem)
            this.allOnGoing.push(orderItem)
          }
          this.allData.push(orderItem)
        } else if (this.orders[i].subscriptionDetails.subscriptionStatus == 'paused+') {
          tableListOther.push(orderItem)
          this.allOnGoing.push(orderItem)
        } else {
          this.failedOrders.push(orderItem)
        }
      }
    }
    tableListActive.sort((a, b) => (a.created < b.created) ? 1 : ((b.created < a.created) ? -1 : 0));
    this.dataSourceActive = new MatTableDataSource(tableListActive)
    this.dataSourceActive.sort = this.activeSort
    this.dataSourceActive.paginator = this.activePaginator
    this.dataSourcePending = new MatTableDataSource(tableListPending)
    this.dataSourcePending.sort = this.pendingSort
    this.dataSourceArchived = new MatTableDataSource(tableListArchive)
    tableListPaused.sort((a, b) => (a.resume > b.resume) ? 1 : ((b.resume > a.resume) ? -1 : 0));
    this.dataSourcePaused = new MatTableDataSource(tableListPaused)
    this.dataSourcePaused.sort = this.pausedSort
    this.dataSourcePaused.paginator = this.pausedPaginator
    tableListCanceled.sort((a, b) => {
      const cancelDate1 = a.fullOrder.subscriptionDetails.cancelDate
      const cancelDate2 = b.fullOrder.subscriptionDetails.cancelDate
      var first = cancelDate1 ? cancelDate1 : null
      var next = cancelDate2 ? cancelDate2 : null
      if (first && next && first.seconds > next.seconds || first && !next) {
        return -1
      } else if (first && next && first.seconds < next.seconds || !first && next) {
        return 1
      }
      return 0
    })
    tableListArchivedCanceled.sort((a, b) => {
      const cancelDate1 = a.fullOrder.subscriptionDetails.cancelDate
      const cancelDate2 = b.fullOrder.subscriptionDetails.cancelDate
      var first = cancelDate1 ? cancelDate1 : null
      var next = cancelDate2 ? cancelDate2 : null
      if (first && next && first.seconds > next.seconds || first && !next) {
        return -1
      } else if (first && next && first.seconds < next.seconds || !first && next) {
        return 1
      }
      return 0
    })
    this.dataSourceCanceled = new MatTableDataSource(tableListCanceled)
    this.dataSourceCanceled.sort = this.activeSort
    this.dataSourceCanceled.paginator = this.canceledPaginator
    this.dataSourceArchivedCancelations = new MatTableDataSource(tableListArchivedCanceled)
    var sortOrder = ['active', 'paused', 'canceled'];
    this.promoOrders.sort(function (a: any, b: any) {
      return sortOrder.indexOf(a.status) - sortOrder.indexOf(b.status);
    });
    this.dataSourcePromo = new MatTableDataSource(this.promoOrders)
    this.dataSourcePromo.sort = this.promoSort
    this.dataSourceOther = new MatTableDataSource(tableListOther)
    // if (this.rationCancelations.length > 0) {
    //   console.log(this.rationCancelations)
    // }
  }

  getProducts(products) {
    var productArray = {
      tamponRegular: 0,
      tamponSuper: 0,
      tamponSuperPlus: 0,
      padsRegular: 0,
      padsSuper: 0,
      padsMaxiRegular: 0,
      padsMaxiSuper: 0,
    }

    if (products != null && products.tampons) {
      for (let i = 0; i < products.tampons.length; i++) {
        switch (products.tampons[i].name) {
          case 'Regular':
            productArray.tamponRegular = products.tampons[i].amount
            break;
          case 'Super':
            productArray.tamponSuper = products.tampons[i].amount
            break;
          case 'Super Plus':
            productArray.tamponSuperPlus = products.tampons[i].amount
            break;
          case 'Default':
            break;
        }
      }
    }
    if (products != null && products.pads) {
      for (let i = 0; i < products.pads.length; i++) {
        switch (products.pads[i].name) {
          case 'Regular Wings':
            productArray.padsRegular = products.pads[i].amount
            break;
          case 'Super Wings':
            productArray.padsSuper = products.pads[i].amount
            break;
          // deepcode ignore DuplicateCaseBody: <please specify a reason of ignoring this>
          case 'Regular (thin)':
            productArray.padsRegular = products.pads[i].amount
            break;
          // deepcode ignore DuplicateCaseBody: <please specify a reason of ignoring this>
          case 'Super (thin)':
            productArray.padsSuper = products.pads[i].amount
            break;
          case 'Maxi Regular':
            productArray.padsMaxiRegular = products.pads[i].amount
            break;
          case 'Maxi Super':
            productArray.padsMaxiSuper = products.pads[i].amount
            break;
          case 'Default':
            break;
        }
      }
    }

    return productArray
  }

  // -------------------------

  convertSubscriptions() {
    this.refresh = false
    var orders = this.dataSourceActive.data
    var noSubId = []
    console.log(orders)
    for (let index = 0; index < orders.length; index++) {
      const item = orders[index];
      //console.log('create new sub', item)
      const callData = {
        uid: item.fullOrder.userId,
        orderId: item.fullOrder.orderId,
        subscriptionId: item.fullOrder.subscriptionDetails.subscriptionId
      }

      if (item.fullOrder.subscriptionDetails.subscriptionStatus != 'canceled') {
        if (callData.subscriptionId != null) {
          const call = this.fun.httpsCallable('getMollieSubscriptionCall');
          call(callData).subscribe((result) => {
            if (result != null) {
              console.log('getmollie', result)
            } else {
              console.log(callData.uid)
            }
            if (index == orders.length - 1) {
              this.refresh = true
            }
          });
        }
      }
      // else {
      //   noSubId.push(item)
      // }
    }
    console.log('noSubs', noSubId)
  }

  convert() {
    if (this.mode == null || this.mode == 'live') {
      console.log('Nothing')
    } else {
      this.orders.sort((a, b) => (a.orderCreated > b.orderCreated) ? 1 : ((b.orderCreated > a.orderCreated) ? -1 : 0));
      this.orders.forEach(order => {
        var cycleDetails
        cycleDetails = {
          cycleDays: parseInt(order.deliveryDaysApart),
          cycleDate: order.startDeliveryDate
        }
        if (cycleDetails.cycleDate != null) {
          this.fbService.setCycleOnUser(order.userId, cycleDetails)
        }
      });
    }
  }
}
