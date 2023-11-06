import { Component, OnInit, EventEmitter } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomAnimations } from 'src/app/shared/animations';
import { FirestoreService } from 'src/app/services/firebase/firebase-service';
import { Observable } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { FirebaseOrder } from 'src/app/models/firebase.order';
import { FirebaseOrderService } from 'src/app/services/firebase/order-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChartOptions, ChartDataSets } from 'chart.js';
import { DeliveryService } from 'src/app/services/delivery-service';
import * as moment from 'moment';
import { firestore } from 'firebase/app';
import Timestamp = firestore.Timestamp;
import { FirebaseInventoryService } from 'src/app/services/firebase/inventory-service';
import { Products } from 'src/app/constants/products';
import { InventoryService } from 'src/app/services/inventory-service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: CustomAnimations
})
export class HomeComponent implements OnInit {
  mode = 'live'

  userRole = [false, false, false, false, false]
  orders
  rawOrders
  latestOrders
  dataLoaded = false
  showDetails = false
  selectedDay = [];
  selectedDayIndex = 0
  weekDates
  currentDate = new Date()
  currentWeek = -1
  currentDeliveries = 0
  deliveries = [];
  deliveryList = [];
  allRemaining = [];
  allRemaingingLimit = [];
  productNoticeList = [];
  showAllNotice = false

  // Box
  public boxChartType = 'pie';
  public boxChartLabels = ['Basic', 'Plus', 'Complete'];
  public boxChartData = [];
  public boxChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      onClick: (e) => e.stopPropagation(),
      position: 'bottom',
    }
  };
  public boxChartColors = [
    {
      backgroundColor: [
        'rgba(245,220,31,0.8)',
        'rgba(243,130,46,0.8)',
        'rgba(243,148,167,0.8)',
      ],
      hoverBackgroundColor: [
        'rgba(245,220,31,1)',
        'rgba(243,130,46,1)',
        'rgba(243,148,167,1)',
      ]
    },
  ];


  // Deliveries
  public deliveriesChartType = 'bar'
  public deliveriesChartLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  public deliveriesChartData: ChartDataSets[] = [
    { data: [], label: 'Deliveries' }
  ];
  public deliveriesChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      onClick: (e) => e.stopPropagation(),
      position: 'bottom',
    },
    scales: {
      xAxes: [{
        display: true,
        gridLines: {
          display: false
        }
      }],
      yAxes: [{
        type: "linear",
        display: true,
        position: "left",
        id: "y-axis-1",
        gridLines: {
          display: false
        },
        ticks: {
          beginAtZero: true,
          stepSize: 2,
          callback: function (label: number, index, labels) {
            if (Math.floor(label) === label) {
              return label;
            }

          },
        }

      }]
    }
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public auth: AngularFireAuth,
    public fbService: FirestoreService,
    public orderService: FirebaseOrderService,
    public deliveryService: DeliveryService,
    public inventoryService: FirebaseInventoryService,
    public inventory: InventoryService,
    public products: Products,
    private snackBar: MatSnackBar,
    public app: AppComponent) { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.route
        .data
        .subscribe(async (v) => {
          this.mode = v.mode;
          console.log(this.orders)
          this.rawOrders = [];
          this.app.addToSubscriptions(this.orderService.getDeliveryList(this.mode).subscribe(deliveries => {
            //console.log(deliveries)
            this.userRole = this.app.getUserRole()
            for (let i = 0; i < deliveries.length; i++) {
              this.sortByDelivery(deliveries[i], i, deliveries.length)
              if (i == deliveries.length - 1) {
                setTimeout(async () => {
                  if (!this.dataLoaded) {
                    this.deliveryList.sort((a, b) => (a.deliveryItem.deliveryDate > b.deliveryItem.deliveryDate) ? 1 : ((b.deliveryItem.deliveryDate > a.deliveryItem.deliveryDate) ? -1 : 0));
                    this.prepareDeliveryDetails()
                    this.getBox()
                    this.getLatestOrders(this.orders)
                    this.getWeekDates(this.orders)
                    if (this.userRole[4]) {
                      this.allRemaining = await this.inventory.getRemaining()
                      this.allRemaingingLimit = this.allRemaining.slice(0, 5)
                      this.productNoticeList = this.allRemaining.slice(0, 5)
                    }
                    this.dataLoaded = true
                  }
                }, 5000);
              }
            }
          }));
        });
    }, 100);
  }

  allDeliveries() {
    if (this.mode == null || this.mode == 'live') {
      //this.router.navigate(['/deliveries'], { state: { orders: this.orders } });
      this.router.navigate(['/deliveries'], { state: { orders: this.orders } });
    } else {
      this.router.navigate(['/test/deliveries'], { state: { orders: this.orders } });
    }
  }

  allOrders() {
    this.rawOrders.sort((a, b) => (a.orderCreated < b.orderCreated) ? 1 : ((b.orderCreated < a.orderCreated) ? -1 : 0));
    if (this.mode == null || this.mode == 'live') {
      console.log('from home:', this.orders, this.rawOrders)
      this.router.navigate(['/orders'], { state: { orders: this.rawOrders } });
    } else {
      this.router.navigate(['/test/orders'], { state: { orders: this.rawOrders } });
    }
  }

  viewInsights() {
    this.rawOrders.sort((a, b) => (a.orderCreated < b.orderCreated) ? 1 : ((b.orderCreated < a.orderCreated) ? -1 : 0));
    if (this.mode == null || this.mode == 'live') {
      console.log('from home:', this.orders, this.rawOrders)
      this.router.navigate(['/administration'], { state: { orders: this.rawOrders } });
    } else {
      this.router.navigate(['/test/administration'], { state: { orders: this.rawOrders } });
    }
  }

  viewDelivery(order) {
    console.log(order)
    if (this.mode == null || this.mode == 'live') {
      this.router.navigate(['/orders/' + order.orderId + '/deliveries/' + order.deliveryItem.id],
        {
          state: {
            order: order.fullOrder,
            delivery: order.deliveryItem
          }
        });
    } else {
      this.router.navigate(['/test/orders/' + order.orderId + '/deliveries/' + order.deliveryItem.id],
        {
          state: {
            order: order.fullOrder,
            delivery: order.deliveryItem
          }
        });
    }
  }

  viewOrder(order) {
    console.log(order)
    if (this.mode == null || this.mode == 'live') {
      this.router.navigate(['/orders/' + order.orderId], { state: { order: order.fullOrder } });
    } else {
      this.router.navigate(['/test/orders/' + order.orderId], { state: { order: order.fullOrder } });
    }
  }

  allPayments() {
    window.open('https://www.mollie.com/dashboard/org_4085344/payments', '_blank');
  }

  async sortByDelivery(orderI, index, size) {
    this.orders = [];
    const order: FirebaseOrder = (orderI.order as FirebaseOrder)
    this.rawOrders.push(order)
    if (order != null && order.subscriptionDetails.subscriptionStatus == 'active' ||
      order != null && order.subscriptionDetails.subscriptionStatus == 'paused' ||
      order.subscriptionDetails.subscriptionStatus == 'canceled' &&
      order.subscriptionDetails.lastDeliveryDate &&
      order.subscriptionDetails.lastDeliveryDate.toDate() > new Date()) {
      const deliveries = await this.deliveryService.getDeliveries(order.userId, order.orderId)
      //console.log(deliveries)
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
          let duplicate = this.orders.findIndex(x => x.orderId == order.orderId)
          if (duplicate != -1) {
            this.orders[duplicate] = orderItem
          } else {
            if (orderItem.deliveryItem != null) {
              this.orders.push(orderItem)
            }
          }
          this.deliveryList.push(orderItem)
        }
      }

      if ((index + 1) == size) {
        this.deliveryList.sort((a, b) => (a.deliveryItem.deliveryDate > b.deliveryItem.deliveryDate) ? 1 : ((b.deliveryItem.deliveryDate > a.deliveryItem.deliveryDate) ? -1 : 0));
        this.prepareDeliveryDetails()
        this.getBox()
        this.getLatestOrders(this.orders)
        this.getWeekDates(this.orders)
        if (this.userRole[4]) {
          this.allRemaining = await this.inventory.getRemaining()
          this.allRemaingingLimit = this.allRemaining.slice(0, 5)
          this.productNoticeList = this.allRemaining.slice(0, 5)
          console.log(this.productNoticeList)
        }
        this.dataLoaded = true
      }
    } else if (order != null && order.subscriptionDetails.subscriptionStatus == 'canceled') {
      const deliveries = await this.deliveryService.getDeliveries(order.userId, order.orderId)
      //console.log(order, deliveries)
    }
  }

  getLatestOrders(orders) {
    this.latestOrders = [];
    orders.sort((a, b) => (a.orderCreated < b.orderCreated) ? 1 : ((b.orderCreated < a.orderCreated) ? -1 : 0));
    console.log('orders', this.latestOrders, orders)
    var size = orders.length > 5 ? 5 : orders.length
    for (let index = 0; index < size; index++) {
      this.latestOrders.push(orders[index])
    }
  }

  prepareDeliveryDetails() {
    this.orders.sort((a, b) => (a.deliveryItem.deliveryDate > b.deliveryItem.deliveryDate) ? 1 : ((b.deliveryItem.deliveryDate > a.deliveryItem.deliveryDate) ? -1 : 0));
    this.deliveryList = [];
    var today = new Date()
    today.setHours(0, 0, 0, 0)
    var thresholdWeekDeliveryDate = new Date()
    thresholdWeekDeliveryDate.setDate(thresholdWeekDeliveryDate.getDate() + 3)
    thresholdWeekDeliveryDate.setHours(23, 59, 59, 59)
    for (let i = 0; i < this.orders.length; i++) {
      if (this.orders[i].subscriptionStatus != null &&
        this.orders[i].subscriptionStatus.subscriptionStatus != 'failed') {
        var order = this.orders[i]
        // if (!(this.orders[i].orderCreated instanceof Timestamp)) {
        //   this.orders[i].orderCreated = new Timestamp(this.orders[i].orderCreated.seconds, this.orders[i].orderCreated.nanoseconds)
        // }
        // if (!(this.orders[i].startDeliveryDate instanceof Timestamp)) {
        //   this.orders[i].startDeliveryDate = new Timestamp(this.orders[i].startDeliveryDate.seconds, this.orders[i].startDeliveryDate.nanoseconds)
        // }
        if (order.deliveryItem == null) {
          console.log(order)
        }
        var nextDeliveryDate = order.deliveryItem.deliveryDate.toDate()
        // Display 1 day earlier
        if (nextDeliveryDate != null) {
          nextDeliveryDate.setDate(nextDeliveryDate.getDate() - 1)
        }
        if (order.fullOrder.subscriptionDetails.subscriptionStatus != 'stripe' && nextDeliveryDate != null && nextDeliveryDate > today && nextDeliveryDate < thresholdWeekDeliveryDate) {
          this.deliveryList.push(order)
        }
      }
    }
  }

  getBox() {
    this.boxChartData = [];
    const data = [0, 0, 0];
    for (let index = 0; index < this.orders.length; index++) {
      const order = this.orders[index];
      switch (order.boxId) {
        case 'box_01':
          data[0] = data[0] + 1
          break;
        case 'box_02':
          data[1] = data[1] + 1
          break;
        case 'box_03':
          data[2] = data[2] + 1
          break;
        default:
          break;
      }
    }

    data.forEach(element => {
      this.boxChartData.push(element)
    });
  }

  getWeekDates(orders) {
    orders.sort((a, b) => (a.deliveryItem.deliveryDate > b.deliveryItem.deliveryDate) ? 1 : ((b.deliveryItem.deliveryDate > a.deliveryItem.deliveryDate) ? -1 : 0));
    var firstDate = new Date()
    var weekNo = (moment(firstDate).locale('nl-nl').week())
    if (weekNo >= 52) {
      firstDate.setDate(firstDate.getDate() - 6)
    }
    var year = firstDate.getFullYear()
    this.weekDates = [1, 2, 3, 4, 5, 6, 7]
      .map(d => moment(year + '-' + weekNo + '-' + d, 'YYYY-W-E'));
    if (this.currentWeek != weekNo && this.deliveryList.length != 0) {
      this.deliveries = []
      this.currentDeliveries = 0
      this.currentWeek = weekNo

      orders.forEach(delivery => {
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

      var data = []
      for (let index = 0; index < this.deliveries.length; index++) {
        if (this.deliveries[index] != undefined) {
          data.push(this.deliveries[index].length)
        } else {
          data.push(0)
        }
      }
      this.deliveriesChartData[0].data = data
    }
  }

  chartClicked(event) {
    if (event.active[0]) {
      this.selectedDayIndex = event.active[0]._index
      this.showDetails = true;
      this.selectedDay = this.deliveries[this.selectedDayIndex]
    }
  }

  inventoryNotice() {
    this.showAllNotice = !this.showAllNotice
    if (this.showAllNotice) {
      this.productNoticeList = this.allRemaining
    } else {
      this.productNoticeList = this.allRemaingingLimit
    }
  }
}
