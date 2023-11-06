import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Observable } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UserData } from 'src/app/models/userdata';
import { firestore, User } from 'firebase/app';
import Timestamp = firestore.Timestamp;
import { FirebaseOrder } from 'src/app/models/firebase.order';
import { AngularFireAuth } from '@angular/fire/auth';
import { FirebaseOrderService } from 'src/app/services/firebase/order-service';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Moment } from 'moment';
import * as moment from 'moment';
import { AppComponent } from 'src/app/app.component';
import { UserService } from 'src/app/services/firebase/user-service';
import { first } from 'rxjs/operators';
import { DeliveryService } from 'src/app/services/delivery-service';

@Component({
  selector: 'app-orders',
  templateUrl: './deliveries.component.html',
  styleUrls: ['./deliveries.component.scss']
})
export class DeliveriesComponent implements OnInit {
  sub: any;
  mode = 'live'
  screenHeight
  screenWidth
  isMobile = false
  showCalendar = false
  dataLoaded = false

  user$: Observable<User | null>;
  user: User
  orders$: Observable<any | null>
  userRole = [false, false, false, false, false]
  deliveryList = [];
  deliveryItemList = [];
  orders = [];
  activeOrders = [];
  canceledOrders = [];
  allData = [];
  minDate = new Date()
  currentDate = new Date()
  selectedDate: Moment
  selectedIndex = 0
  currentWeek = -1
  currentDeliveries = 0
  currentDeliveryStatus = [];
  dataSourceAll
  dataSourceWeek
  dataSourceMonth
  dataSourceOutdated
  checked = false
  displayedColumns: string[] = ['orderRef', 'customer', 'deliveryDate', 'status', 'packed', 'delivered']
  failedOrders = [];
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  weekDates = [];
  deliveries = [];
  deliveryCount = [];
  firstWeekNo = 1;
  outdatedDeliveries = [];
  showOutdated = false

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('allPaginator', { static: true }) allPaginator: MatPaginator;
  @ViewChild('weekPaginator', { static: true }) weekPaginator: MatPaginator;
  @ViewChild('monthPaginator', { static: true }) monthPaginator: MatPaginator;
  @ViewChild('outdatedPaginator', { static: true }) outdatedPaginator: MatPaginator;

  constructor(
    private userService: UserService,
    private deliveryService: DeliveryService,
    private orderService: FirebaseOrderService,
    private app: AppComponent,
    private router: Router,
    private route: ActivatedRoute,
    public auth: AngularFireAuth,
    public datepipe: DatePipe) {
    this.onResize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.screenHeight = window.innerHeight;
    this.screenWidth = window.innerWidth;
    this.isMobile = this.screenWidth <= 960
  }

  ngOnInit() {
    this.user$ = this.auth.user;
    this.user$.subscribe((user: User) => {
      this.user = user
      if (user != null) {
        this.userService.getUserInfoRefByUID(user.uid).valueChanges().subscribe((data: UserData) => {
          this.userRole = this.app.getUserRoleFromUserData(data)
          console.log(this.userRole)
        });
      }
    })
    if (this.currentDate.getDay() == 0) {
      this.selectedIndex = 6
      this.minDate.setDate(this.minDate.getDate() - 27)
    } else {
      this.selectedIndex = this.currentDate.getDay() - 1
      this.minDate.setDate(this.minDate.getDate() - (this.currentDate.getDay() - 1) - 28)
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.sub = this.route
        .data
        .subscribe((v) => {
          this.mode = v.mode;
          this.deliveryList = history.state.orders
          if (this.deliveryList) {
            console.log('from route:', this.deliveryList)
            this.deliveryList.sort((a, b) => (a.deliveryItem.deliveryDate > b.deliveryItem.deliveryDate) ? 1 : ((b.deliveryItem.deliveryDate > a.deliveryItem.deliveryDate) ? -1 : 0));
            //this.prepareDeliveryDetails()
            this.getWeekDates(this.currentDate)
            this.getDeliveryCount()
            this.dataLoaded = true
          } else {
            this.getDeliveryDetails()
          }
        });
    }, 100);
  }

  dateSelected(type?) {
    if (type == 'previous') {
      this.currentDate.setDate(this.currentDate.getDate() - 7)
      this.selectedDate = moment(this.currentDate)
    } else if (type == 'current') {
      this.currentDate = new Date()
      this.selectedDate = moment(this.currentDate)
    } else if (type == 'next') {
      this.currentDate.setDate(this.currentDate.getDate() + 7)
      this.selectedDate = moment(this.currentDate)
    } else {
      this.currentDate = new Date(this.selectedDate.toDate())
    }
    if (this.currentDate.getDay() == 0) {
      this.selectedIndex = 6
      this.minDate.setDate(this.minDate.getDate() - 6)
    } else {
      this.selectedIndex = this.currentDate.getDay() - 1
      this.minDate.setDate(this.minDate.getDate() - (this.currentDate.getDay() - 1))
    }
    this.getWeekDates(this.currentDate)
  }

  async sortByDelivery(orderI, index, size) {
    this.deliveryList = [];
    const order: FirebaseOrder = (orderI.order as FirebaseOrder)
    if (order != null && order.subscriptionDetails.subscriptionStatus == 'active' ||
      order != null && order.subscriptionDetails.subscriptionStatus == 'paused' || 
      order.subscriptionDetails.subscriptionStatus == 'canceled' &&  
      order.subscriptionDetails.lastDeliveryDate && 
      order.subscriptionDetails.lastDeliveryDate.toDate() > new Date()) {
      const deliveries = await this.deliveryService.getDeliveries(order.userId, order.orderId)
      var status
      if (order.paymentDetails.paymentMethod == 'afterpay') {
        status = order.paymentDetails.paymentMethod
      } else {
        status = order.subscriptionDetails ? order.subscriptionDetails.subscriptionStatus : ''
      }

      const minimalDate = new Date()
      minimalDate.setDate(minimalDate.getDate() - 28)
      for (let index = 0; index < deliveries.length; index++) {
        var deliveryItem = null
        if (deliveries[index].deliveryDate && deliveries[index].deliveryDate.toDate() > minimalDate) {
          deliveryItem = deliveries[index]
          deliveryItem.deliveryNumber = index + 1
        }
        if (deliveryItem) {
          let customer = ''
          if (order.shippingAddress.lastNamePrefix) {
            customer = order.shippingAddress.firstName + " " + order.shippingAddress.lastNamePrefix + " " + order.shippingAddress.lastName
          } else {
            customer = order.shippingAddress.firstName + " " + order.shippingAddress.lastName
          }
          var orderItem = {
            boxId: order.boxId,
            boxName: order.boxName,
            orderId: order.orderId,
            orderRef: order.orderReference,
            orderCreated: order.orderCreated.toDate(),
            paymentPlan: order.paymentPlan,
            deliveryItem: deliveryItem,
            customer: customer,
            subscriptionStatus: status,
            fullOrder: order
          }
          if (orderItem.deliveryItem == null) {
            console.log('empty', orderItem, deliveries)
          }
          this.deliveryList.push(orderItem)
        }
      }

      if ((index + 1) == size) {
        this.deliveryList.sort((a, b) => (a.deliveryItem.deliveryDate > b.deliveryItem.deliveryDate) ? 1 : ((b.deliveryItem.deliveryDate > a.deliveryItem.deliveryDate) ? -1 : 0));
        console.log(this.deliveryList)
        this.getWeekDates(this.currentDate)
        this.getDeliveryCount()
        this.dataLoaded = true
      }
    }
  }

  showDetails(order) {
    console.log(order)
    if (this.mode == null || this.mode == 'live') {
      //this.router.navigate(['/orders/' + order.orderId], { state: { order: order.fullOrder } });
      this.router.navigate(['/orders/' + order.orderId + '/deliveries/' + order.deliveryItem.id],
        {
          state: {
            order: order.fullOrder,
            delivery: order.deliveryItem
          }
        });
    } else {
      //this.router.navigate(['/test/orders/' + order.orderId], { state: { order: order.fullOrder } });
      this.router.navigate(['/test/orders/' + order.orderId + '/deliveries/' + order.deliveryItem.id],
        {
          state: {
            order: order.fullOrder,
            delivery: order.deliveryItem
          }
        });
    }
  }

  getDeliveryDetails() {
    this.orderService.getDeliveryList(this.mode).subscribe(deliveries => {
      console.log('from fb:', deliveries)
      for (let i = 0; i < deliveries.length; i++) {
        this.sortByDelivery(deliveries[i], i, deliveries.length)
      }
    });
  }

  setDeliveryStatus(event, order, isDelivery) {
    var state = event.checked
    if (isDelivery) { //set deliver status
      order.deliveryItem.delivery.isDelivered = state
      order.deliveryItem.delivery.deliveryInitiatedBy = state ? this.user.displayName : ''
      this.orderService.setDeliveryStatus(order.orderId, order.deliveryItem.id, this.user.displayName, order.deliveryItem.packing.isPacked, state, order.userId)
      this.setPoints(order, state)
    } else { // Set packed status
      order.deliveryItem.packing.isPacked = state
      order.deliveryItem.packing.packedBy = state ? this.user.displayName : ''
      if (!state) {
        order.deliveryItem.delivery.isDelivered = false
        order.deliveryItem.delivery.deliveryInitiatedBy = ''
      }
      this.orderService.setDeliveryStatus(order.orderId, order.deliveryItem.id, this.user.displayName, state, state ? order.deliveryItem.delivery.isDelivered : false, order.userId)
    }
    this.deliveries.forEach(delivery => {
      this.currentDeliveries = this.currentDeliveries + delivery.length
      console.log(delivery)
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

  setPoints(order: any, checked: boolean) {
    let pointsToAdd = 0
    if (order.boxId == 'box_01') {
      pointsToAdd = pointsToAdd + 5
    } else if (order.boxId == 'box_02') {
      pointsToAdd = pointsToAdd + 7.5
    } else if (order.boxId == 'box_03') {
      pointsToAdd = pointsToAdd + 10
    }
    if (pointsToAdd > 0 && order.fullOrder.userId && order.deliveryItem.deliveryNumber != 1 || order.deliveryItem.deliveryNumber == null) {
      this.userService.getUserInfoRefByUID(order.fullOrder.userId).valueChanges().pipe(first()).subscribe((data: any) => {
        const customer = data
        let currentPoints = customer.points.current
        let lifetimePoints = customer.points.lifetime
        if (checked) {
          currentPoints = currentPoints + pointsToAdd
          lifetimePoints = lifetimePoints + pointsToAdd
        } else {
          currentPoints = currentPoints - pointsToAdd
          lifetimePoints = lifetimePoints - pointsToAdd
        }
        //console.log(customer, currentPoints, lifetimePoints)
        this.userService.updatePoints(order.fullOrder.userId, currentPoints, lifetimePoints)
      })
    }
  }

  getWeekDates(date: Date) {
    var firstDate = date
    var weekNo = (moment(firstDate).locale('nl-nl').week())
    if (weekNo >= 52) {
      firstDate.setDate(firstDate.getDate() - 6)
    }
    var year = firstDate.getFullYear()
    this.weekDates = [1, 2, 3, 4, 5, 6, 7]
      .map(d => moment(year + '-' + weekNo + '-' + d, 'YYYY-W-E'));
    if (this.currentWeek != weekNo && this.deliveryList.length != 0) {
      this.deliveries = []
      this.currentDeliveryStatus = []
      this.currentDeliveries = 0
      this.currentDeliveryStatus.push(0) //Packed
      this.currentDeliveryStatus.push(0) //Delivered
      this.currentWeek = weekNo

      this.deliveryList.forEach(delivery => {
        for (let i = 0; i < this.weekDates.length; i++) {
          if (!(delivery.deliveryItem.deliveryDate instanceof Timestamp)) {
            delivery.deliveryItem.deliveryDate = new Timestamp(delivery.deliveryItem.deliveryDate.seconds, delivery.deliveryItem.deliveryDate.nanoseconds)
          }
          if (this.weekDates[i].toDate().setHours(23, 59, 59, 59) == delivery.deliveryItem.deliveryDate.toDate().setHours(23, 59, 59, 59)) {
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
    //console.log(this.deliveries)
  }

  getDeliveryCount() {
    var weekRange = [];
    this.deliveryCount = [];
    this.firstWeekNo = this.currentWeek
    for (let i = 0; i < 4; i++) {
      const from_date = moment().locale('nl-nl').weekday(i * 7).hours(0).minutes(0).seconds(0)
      const to_date = moment().locale('nl-nl').weekday((i + 1) * 7).hours(0).minutes(0).seconds(0)
      var item = {
        from: from_date.toDate(),
        to: to_date.toDate()
      }
      weekRange.push(item)
    }
    var outdatedItem = {
      from: null,
      to: moment().locale('nl-nl').hours(0).toDate()
    }
    weekRange.push(outdatedItem)
    this.deliveryCount = [
      { weekNo: 0, weekCount: 0 },
      { weekNo: 0, weekCount: 0 },
      { weekNo: 0, weekCount: 0 },
      { weekNo: 0, weekCount: 0 }
    ]
    this.deliveryList.forEach(delivery => {
      if (!(delivery.deliveryItem.deliveryDate instanceof Timestamp)) {
        delivery.deliveryItem.deliveryDate = new Timestamp(delivery.deliveryItem.deliveryDate.seconds, delivery.deliveryItem.deliveryDate.nanoseconds)
      }
      for (let i = 0; i < weekRange.length; i++) {
        if (i == weekRange.length - 1) {
          let outdatedThreshold = new Date()
          outdatedThreshold.setDate(outdatedThreshold.getDate() - 7)
          if (delivery.deliveryItem.deliveryDate.toDate() < outdatedThreshold || 
              delivery.deliveryItem.deliveryDate.toDate() < weekRange[i].to && delivery.subscriptionStatus == 'afterpay' ||
              delivery.subscriptionStatus == 'stripe') {
            if (delivery.paymentPlan != 0) {
              if (delivery.orderRef == 'v7Wp21NF') {
                console.log(delivery)
              }
              let outdatedThresholdPlus = new Date()
              outdatedThresholdPlus.setDate(outdatedThresholdPlus.getDate() - 28)
              if (!delivery.deliveryItem.packing.isPacked) {
                delivery.subscriptionStatus = 'Not packed'
                this.outdatedDeliveries.push(delivery)
              } else if (!delivery.deliveryItem.delivery.isDelivered) {
                delivery.subscriptionStatus = 'Not shipped'
                this.outdatedDeliveries.push(delivery)
              } else if (delivery.deliveryItem.deliveryDate.toDate() < outdatedThresholdPlus) {
                if (delivery.subscriptionStatus == 'active') {
                  delivery.subscriptionStatus = 'outdated'
                }
                this.outdatedDeliveries.push(delivery)
              }
              // else if (delivery.subscriptionStatus == 'paused') {
              //   this.outdatedDeliveries.push(delivery)
              // } 
            }
          }
        } else {
          if (delivery.deliveryItem.deliveryDate.toDate() > weekRange[i].from && delivery.deliveryItem.deliveryDate.toDate() <= weekRange[i].to) {

            this.deliveryCount[i] = {
              weekNo: this.firstWeekNo + i <= 53 ? this.firstWeekNo + i : i,
              weekCount: this.deliveryCount[i].weekCount + 1
            }
          }
        }
      }
    })
    //console.log(this.deliveryCount, this.outdatedDeliveries)
  }
}
