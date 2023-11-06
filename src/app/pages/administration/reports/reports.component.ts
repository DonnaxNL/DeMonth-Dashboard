import { Component, OnInit } from '@angular/core';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { FirestoreService } from 'src/app/services/firebase/firebase-service';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderService } from 'src/app/services/order-service';
import { MatTableDataSource } from '@angular/material/table';
import { FirebaseOrderService } from 'src/app/services/firebase/order-service';
import { FirebaseOrder } from 'src/app/models/firebase.order';
import * as moment from 'moment';
import { firestore } from 'firebase';
import { DatePipe } from '@angular/common';
import { Color } from 'ng2-charts';
import { HostListener } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'insight-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  sub: any;
  mode = 'live'
  isMobile = false
  showGraph = true

  rawOrders = [];
  orders = [];
  @Input() set allOrders(value) {
    if (value) {
      this.orders = value
    }
    this.getNewOrders('month')
  }
  @Input() set allRawOrders(value) {
    if (value) {
      this.rawOrders = value
    }
    this.getNewOrders('month')
  }
  deliveryList = [];
  reportData = [
    {
      row: 'New Subscriptions',
      amount: 0
    },
    {
      row: 'Canceled Subscriptions',
      amount: 0
    }
  ]
  boxData = [
    {
      row: 'Complete Box',
      amount: 0
    },
    {
      row: 'Plus Box',
      amount: 0
    },
    {
      row: 'Basic Box',
      amount: 0
    }
  ]

  dataSourceProducts
  dataSourceBoxes
  dataSourceWeeklyProducts
  displayedColumns: string[] = ['product', 'amount']
  displayedColumnsBox: string[] = ['box', 'amount']
  displayedWeeklyColumns: string[] = ['type', 'product', 'amount']

  currentPage = 'range'
  currentWeek = 0
  orderGraphView = 'month'
  weekDates = [];
  minDate = new Date(2020)
  startDate = new Date()
  endDate = new Date()

  newOrders
  canceledOrders

  // Line
  public lineChartType = 'line'
  public lineChartLabels = [];
  public lineChartData: ChartDataSets[] = [
    { data: [], lineTension: 0.2, label: 'New Orders' },
    { data: [], lineTension: 0.2, label: 'Canceled Orders' },
  ];
  public lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      position: 'bottom',
    },
    scales: {
      xAxes: [{
        gridLines: {
          display: false
        }
      }],
      yAxes: [{
        ticks: {
          stepSize: 1
        }
      }]
    }
  };
  public lineChartColors: Color[] = [
    { borderColor: 'rgba(106,195,25,1)', backgroundColor: 'rgba(106,195,25,0.5)' },
    { borderColor: 'rgba(255,0,0,1)', backgroundColor: 'rgba(255,0,0,0.5)' },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fbService: FirestoreService,
    private fbOrderService: FirebaseOrderService,
    private orderService: OrderService,
    public datepipe: DatePipe
  ) {
    this.onResize()
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    var screenWidth = window.innerWidth;
    this.isMobile = screenWidth <= 480
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.sub = this.route
        .data
        .subscribe((v) => {
          this.mode = v.mode;
          if (this.orders) {
            this.getNewOrders('month')
          }
          // this.rawOrders = history.state.orders
          // if (this.rawOrders) {
          //   console.log('from route', this.rawOrders)
          //   this.orders = this.orderService.getAllActiveSubscriptions(this.rawOrders)
          //   console.log(this.orders);
          //   this.getProducts('alltime', this.orders)
          //   this.getBox()
          //   this.getNewOrders('month')
          // } else {
          //   this.fbService.getAllOrders(this.mode).valueChanges().subscribe((data: any) => {
          //     console.log('from fb', data)
          //     this.rawOrders = data
          //     this.orders = this.orderService.getAllActiveSubscriptions(data)
          //     console.log(this.orders);
          //     this.getProducts('alltime', this.orders)
          //     this.getBox()
          //     this.getNewOrders('month')
          //   })
          // }
        });
    }, 100);
  }

  getDeliveryDetails() {
    this.fbOrderService.getDeliveryList(this.mode).subscribe(deliveries => {
      console.log('from fb:', deliveries)
      for (let i = 0; i < deliveries.length; i++) {
        this.sortByDelivery(deliveries[i], i, deliveries.length)
      }
    });
  }

  sortByDelivery(orderItem, index, size) {
    this.deliveryList = [];
    const order: FirebaseOrder = (orderItem.order as FirebaseOrder)
    if (order.subscriptionDetails.subscriptionStatus == 'active' ||
      order.subscriptionDetails.subscriptionStatus == 'stripe' ||
      order.paymentDetails.paymentMethod == 'afterpay' && order.subscriptionDetails.subscriptionStatus == 'pending' ||
      order.subscriptionDetails.subscriptionStatus == 'paused') {
      orderItem.deliveries.subscribe((data: any) => {
        var status
        if (order.paymentDetails.paymentMethod == 'afterpay') {
          status = order.paymentDetails.paymentMethod
        } else {
          status = order.subscriptionDetails ? order.subscriptionDetails.subscriptionStatus : ''
        }

        var deliveryItem
        const minimalDate = new Date()
        minimalDate.setDate(minimalDate.getDate() - 7)
        for (let i = 0; i < data.length; i++) {
          // if (!data[i].deliveryDate) {
          //   console.log('No deliveryDate', order, data[i])
          // }
          if (data[i].deliveryDate && data[i].deliveryDate.toDate() > minimalDate) {
            deliveryItem = data[i]
            break;
          }
        }

        if (!deliveryItem) {
          deliveryItem = data[data.length - 1]
        }

        var orderItem = {
          boxId: order.boxId,
          boxName: order.boxName,
          orderId: order.orderId,
          orderRef: order.orderReference,
          paymentPlan: order.paymentPlan,
          deliveryItem: deliveryItem,
          customer: order.shippingAddress.firstName + " " + order.shippingAddress.lastName,
          subscriptionStatus: status,
          products: order.products,
          fullOrder: order
        }
        let duplicate = this.deliveryList.findIndex(x => x.orderId == order.orderId)
        if (duplicate != -1) {
          this.deliveryList[duplicate] = orderItem
        } else {
          this.deliveryList.push(orderItem)
        }
        if ((index + 1) == size) {
          this.deliveryList.sort((a, b) => (a.deliveryItem.deliveryDate > b.deliveryItem.deliveryDate) ? 1 : ((b.deliveryItem.deliveryDate > a.deliveryItem.deliveryDate) ? -1 : 0));
          //console.log(this.deliveryList)
          this.getWeekDates()
          // this.getDeliveryCount()
          // this.dataLoaded = true
        }
      })
    }
  }

  getWeekDates() {
    var weeklyOrders = [];
    var firstDate = new Date()
    var weekNo = (moment(firstDate).locale('nl-nl').week())
    if (weekNo >= 52) {
      firstDate.setDate(firstDate.getDate() - 6)
    }
    this.currentWeek = weekNo
    var year = firstDate.getFullYear()
    this.weekDates = [1, 2, 3, 4, 5, 6, 7].map(d => moment(year + '-' + weekNo + '-' + d, 'YYYY-W-E'));
    console.log(this.weekDates)
    this.deliveryList.forEach(delivery => {
      if (!(delivery.deliveryItem.deliveryDate instanceof firestore.Timestamp)) {
        delivery.deliveryItem.deliveryDate = new firestore.Timestamp(delivery.deliveryItem.deliveryDate.seconds, delivery.deliveryItem.deliveryDate.nanoseconds)
      }

      if (delivery.deliveryItem.deliveryDate.toDate() > this.weekDates[0].toDate().setHours(0, 0, 0, 0) &&
        delivery.deliveryItem.deliveryDate.toDate() < this.weekDates[6].toDate().setHours(23, 59, 59, 59)) {
        weeklyOrders.push(delivery)
      }
    });
    //console.log(weeklyOrders)
    //this.getProducts('weekly', weeklyOrders)
    //this.getSnacks('weekly', weeklyOrders)
  }

  getNewOrders(orderGraphView) {
    var days = 0
    var pastWeek = []
    this.newOrders = []
    this.canceledOrders = []
    this.lineChartLabels = []
    this.lineChartData[0].data = []
    this.lineChartData[1].data = []
    this.reportData[0].amount = 0
    this.reportData[1].amount = 0
    this.boxData[0].amount = 0
    this.boxData[1].amount = 0
    this.boxData[2].amount = 0
    if (orderGraphView == 'week') {
      days = 7
    } else if (orderGraphView == 'month') {
      days = 31
    } else {
      days = moment(this.endDate).diff(this.startDate, 'days')
      console.log(days)
    }
    for (let index = 0; index < days; index++) {
      var remove = index - (days - 1)
      const date = new Date(this.endDate)
      date.setDate(date.getDate() + remove)
      pastWeek.push(date)
      this.newOrders.push(0)
      this.canceledOrders.push(0)
      this.lineChartLabels.push(this.datepipe.transform(date, 'dd-MM'))
      if (index == 0) {
        this.startDate = date
      }
    }
    //console.log(pastWeek)
    // fill newOrders
    // this.orders.forEach(order => {
    //   if (!(order.orderCreated instanceof firestore.Timestamp)) {
    //     order.orderCreated = new firestore.Timestamp(order.orderCreated.seconds, order.orderCreated.nanoseconds)
    //   }
    //   for (let i = 0; i < pastWeek.length; i++) {
    //     //console.log(order.orderCreated.toDate().setHours(23, 59, 59, 59), pastWeek[i].setHours(23, 59, 59, 59))
    //     if (order.orderCreated.toDate().setHours(23, 59, 59, 59) == pastWeek[i].setHours(23, 59, 59, 59)) {
    //       this.newOrders[i] = this.newOrders[i] + 1
    //       this.reportData[0].amount = this.reportData[0].amount + 1
    //       if (order.boxId == 'box_03') {
    //         this.reportData[2].amount = this.reportData[2].amount + 1
    //       } else if (order.boxId == 'box_02') {
    //         this.reportData[3].amount = this.reportData[3].amount + 1
    //       } else if (order.boxId == 'box_01') {
    //         this.reportData[4].amount = this.reportData[4].amount + 1
    //       }
    //     }
    //   }
    // });
    //console.log(this.newOrders)
    // for (let index = 0; index < this.newOrders.length; index++) {
    //   this.lineChartData[0].data.push(this.newOrders[index])
    // }
    // fill canceledOrders
    this.rawOrders.forEach(order => {
      if (order.subscriptionDetails.cancelDate) {
        if (!(order.subscriptionDetails.cancelDate instanceof firestore.Timestamp)) {
          order.subscriptionDetails.cancelDate = new firestore.Timestamp(order.subscriptionDetails.cancelDate.seconds, order.subscriptionDetails.cancelDate.nanoseconds)
        }
        for (let i = 0; i < pastWeek.length; i++) {
          //console.log(order.orderCreated.toDate().setHours(23, 59, 59, 59), pastWeek[i].setHours(23, 59, 59, 59))
          if (order.subscriptionDetails.cancelDate.toDate().setHours(23, 59, 59, 59) == pastWeek[i].setHours(23, 59, 59, 59)) {
            this.canceledOrders[i] = this.canceledOrders[i] == null ? 0 : this.canceledOrders[i] + 1
            this.reportData[1].amount = this.reportData[1].amount + 1
          }
        }
      } else if (order.paymentPlan != 0) {
        if (!(order.orderCreated instanceof firestore.Timestamp)) {
          order.orderCreated = new firestore.Timestamp(order.orderCreated.seconds, order.orderCreated.nanoseconds)
        }
        for (let i = 0; i < pastWeek.length; i++) {
          //console.log(order.orderCreated.toDate().setHours(23, 59, 59, 59), pastWeek[i].setHours(23, 59, 59, 59))
          if (order.orderCreated.toDate().setHours(23, 59, 59, 59) == pastWeek[i].setHours(23, 59, 59, 59)) {
            this.newOrders[i] = this.newOrders[i] + 1
            this.reportData[0].amount = this.reportData[0].amount + 1
            if (order.boxId == 'box_03') {
              this.boxData[0].amount = this.boxData[0].amount + 1
            } else if (order.boxId == 'box_02') {
              this.boxData[1].amount = this.boxData[1].amount + 1
            } else if (order.boxId == 'box_01') {
              this.boxData[2].amount = this.boxData[2].amount + 1
            }
          }
        }
      }
    });
    //console.log(this.canceledOrders)
    for (let index = 0; index < this.newOrders.length; index++) {
      this.lineChartData[0].data.push(this.newOrders[index])
    }
    for (let index = 0; index < this.canceledOrders.length; index++) {
      this.lineChartData[1].data.push(this.canceledOrders[index])
    }
  }

  onDateChanged() {
    this.getNewOrders('')
  }

  goToPage(page: string) {
    this.currentPage = page
    // if (page == 'weekly') {
    //   this.getDeliveryDetails()
    // }
  }
}
