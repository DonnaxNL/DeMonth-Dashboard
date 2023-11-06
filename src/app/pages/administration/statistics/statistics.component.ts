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
  selector: 'insight-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  sub: any;
  mode = 'live'
  isMobile = false
  showGraph = true
  statsRange = 'months'
  showSelector = true
  selectedMonth = 0
  today = new Date()

  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

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
  weekRange = []
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
    { data: [], lineTension: 0, label: 'New Orders' },
    // { data: [], lineTension: 0, label: 'Canceled Orders' },
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
          beginAtZero: true,   // minimum value will be 0.
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
    this.selectedMonth = this.today.getMonth()
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

  getNewOrders(orderGraphView, weekNumber?) {
    var days = 0
    var currentRange = []
    this.weekRange = []
    this.newOrders = []
    this.canceledOrders = []
    this.lineChartLabels = []
    this.lineChartData[0].data = []
    //this.lineChartData[1].data = []
    this.reportData[0].amount = 0
    this.reportData[1].amount = 0
    this.boxData[0].amount = 0
    this.boxData[1].amount = 0
    this.boxData[2].amount = 0
    if (orderGraphView == 'week') {
      days = 7
      var firstDate = this.endDate
      var weekNo
      var todayWeek = (moment(firstDate).locale('nl-nl').week())
      if (weekNumber == null) {
        weekNo = (moment(firstDate).locale('nl-nl').week())
        if (weekNo >= 52) {
          firstDate.setDate(firstDate.getDate() - 6)
        }
      } else {
        weekNo = weekNumber
      }

      var year = firstDate.getFullYear()
      this.weekDates = [1, 2, 3, 4, 5, 6, 7]
        .map(d => moment(year + '-' + weekNo + '-' + d, 'YYYY-W-E'));

      for (let index = 6; index >= 0; index--) {
        this.weekRange.push(todayWeek - index)
      }
    } else if (orderGraphView == 'month') {
      days = 31
    } else {
      days = moment(this.endDate).diff(this.startDate, 'days')
      console.log(days)
    }
    this.currentWeek = weekNo
    for (let index = 0; index < days; index++) {
      let date
      if (this.statsRange == 'weeks') {
        date = this.weekDates[index].toDate()
      } else {
        var remove = index - (days - 1)
        date = new Date(this.weekDates[index])

        if (this.statsRange == 'months') {
          date = new Date(this.today.getFullYear(), this.selectedMonth + 1, 0)
        } else {
          date = new Date(this.endDate)
        }
        date.setDate(date.getDate() + remove)
      }
      currentRange.push(date)
      this.newOrders.push(0)
      this.canceledOrders.push(0)
      this.lineChartLabels.push(this.datepipe.transform(date, 'dd-MM'))
      if (index == 0) {
        this.startDate = date
      }
    }
    //console.log(pastWeek)
    // fill newOrders
    this.orders.forEach(order => {
      if (order.paymentPlan != 0) {
        if (!(order.orderCreated instanceof firestore.Timestamp)) {
          order.orderCreated = new firestore.Timestamp(order.orderCreated.seconds, order.orderCreated.nanoseconds)
        }
        for (let i = 0; i < currentRange.length; i++) {
          //console.log(order.orderCreated.toDate().setHours(23, 59, 59, 59), pastWeek[i].setHours(23, 59, 59, 59))
          if (order.orderCreated.toDate().setHours(23, 59, 59, 59) == currentRange[i].setHours(23, 59, 59, 59)) {
            this.newOrders[i] = this.newOrders[i] + 1
            this.reportData[0].amount = this.reportData[0].amount + 1
            if (order.boxId == 'box_03') {
              this.boxData[0].amount = this.boxData[0].amount + 1
            } else if (order.boxId == 'box_02') {
              this.boxData[1].amount = this.boxData[1].amount + 1
            } else if (order.boxId == 'box_01') {
              this.boxData[2].amount = this.boxData[2].amount + 1
            }
          } else if (currentRange[i].setHours(0, 0, 0, 0) > this.today) {
            this.newOrders[i] = null
          }
        }
      }
    });
    // fill canceledOrders
    this.rawOrders.forEach(order => {
      if (order.subscriptionDetails.cancelDate) {
        if (!(order.subscriptionDetails.cancelDate instanceof firestore.Timestamp)) {
          order.subscriptionDetails.cancelDate = new firestore.Timestamp(order.subscriptionDetails.cancelDate.seconds, order.subscriptionDetails.cancelDate.nanoseconds)
        }
        for (let i = 0; i < currentRange.length; i++) {
          //console.log(order.orderCreated.toDate().setHours(23, 59, 59, 59), pastWeek[i].setHours(23, 59, 59, 59))
          if (order.subscriptionDetails.cancelDate.toDate().setHours(23, 59, 59, 59) == currentRange[i].setHours(23, 59, 59, 59)) {
            this.canceledOrders[i] = this.canceledOrders[i] + 1
            this.reportData[1].amount = this.reportData[1].amount + 1
          } else if (currentRange[i].setHours(0, 0, 0, 0) > this.today) {
            this.canceledOrders[i] = null
          }
        }
      }
    });
    //console.log(this.canceledOrders)
    for (let index = 0; index < this.newOrders.length; index++) {
      this.lineChartData[0].data.push(this.newOrders[index])
    }
    // for (let index = 0; index < this.canceledOrders.length; index++) {
    //   this.lineChartData[1].data.push(this.canceledOrders[index])
    // }
    console.log(this.weekDates, this.weekRange)
  }

  changeDate(monthIndex?: number) {
    this.selectedMonth = monthIndex
    this.getNewOrders('month')
  }

  onDateChanged() {
    this.getNewOrders('')
  }

  onRangeChanged() {
    if (this.statsRange == 'weeks') {
      this.getNewOrders('week')
    } else if (this.statsRange == 'months') {
      this.getNewOrders('month')
    } else if (this.statsRange == 'custom') {
      this.getNewOrders('')
    }
  }

  changeWeek(weekNo: number) {
    console.log('Number', weekNo)
    this.currentWeek = weekNo
    this.getNewOrders('week', weekNo)
  }

  goToPage(page: string) {
    this.currentPage = page
    // if (page == 'weekly') {
    //   this.getDeliveryDetails()
    // }
  }
}
