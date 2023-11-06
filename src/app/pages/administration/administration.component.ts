import { DatePipe } from '@angular/common';
import { HostListener } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { ChartOptions } from 'chart.js';
import { AppComponent } from 'src/app/app.component';
import { FirestoreService } from 'src/app/services/firebase/firebase-service';
import { FirebaseOrderService } from 'src/app/services/firebase/order-service';
import { OrderService } from 'src/app/services/order-service';
import { CustomAnimations } from 'src/app/shared/animations';

@Component({
  selector: 'app-administration',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.scss'],
  animations: CustomAnimations
})
export class AdministrationComponent implements OnInit {
  userRole = [false, false, false, false, false]
  pages = [{
    id: 'statistics',
    name: 'Statistics'
  }, {
    id: 'insights',
    name: 'Insights'
  }, {
    id: 'distribution',
    name: 'Distribution'
  }, {
    id: 'datastudio',
    name: 'Google Data Studio'
  }]

  mode = 'live'
  isMobile = false
  menuSelected = this.pages[0];

  rawOrders = [];
  orders = [];
  deliveryList = [];

  dataSourceProducts
  dataSourceBoxes
  displayedColumns: string[] = ['product', 'amount']
  displayedColumnsBox: string[] = ['box', 'amount']
  panelProductsOpenState = false;
  panelBoxesOpenState = false;

  public pieChartType = 'pie';
  public pieChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      position: 'left',
    },
  };
  // Product
  public pieChartLabels = ['Pads Ultra-Thin Regular', 'Pads Ultra-Thin Super', 'Pads Maxi Regular', 'Pads Maxi Super', 'Tampon Regular', 'Tampon Super', 'Tampon Super Plus', 'Liners Ultra-Thin', 'Liners Ultra-Thin Long'];
  public pieChartData = [];
  public pieChartColors = [
    {
      backgroundColor: [
        'rgba(90,188,0,0.9)',
        'rgba(201,137,177,0.9)',
        'rgba(0,165,77,0.9)',
        'rgba(228,76,153,0.9)',
        'rgba(81,169,64,0.9)',
        'rgba(212,161,194,0.9)',
        'rgba(135,128,179,0.9)',
        'rgba(146,194,227,0.9)',
        'rgba(0,204,229,0.9)',
      ],
      hoverBackgroundColor: [
        'rgba(90,188,0,1)',
        'rgba(201,137,177,1)',
        'rgba(0,165,77,1)',
        'rgba(228,76,153,1)',
        'rgba(81,169,64,1)',
        'rgba(212,161,194,1)',
        'rgba(135,128,179,1)',
        'rgba(146,194,227,1)',
        'rgba(0,204,229,1)',
      ]
    },
  ];
  public productLabels = [
    ['Tampons', 'Regular'],
    ['Tampons', 'Super'],
    ['Tampons', 'Super Plus'],
    ['Pads', 'Ultra-Thin Regular'],
    ['Pads', 'Ultra-Thin Super'],
    ['Pads', 'Maxi Regular'],
    ['Pads', 'Maxi Super'],
    ['Liners', 'Ultra-Thin'],
    ['Liners', 'Ultra-Thin Long']
  ]
  // Box
  public boxChartLabels = ['Basic', 'Plus', 'Complete'];
  public boxChartData = [];
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

  constructor(
    private app: AppComponent,
    private route: ActivatedRoute,
    private fbService: FirestoreService,
    private fbOrderService: FirebaseOrderService,
    private orderService: OrderService,
    private datepipe: DatePipe
  ) {
    this.onResize()
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    var screenWidth = window.innerWidth;
    this.isMobile = screenWidth <= 480
  }

  ngOnInit(): void {
    this.userRole = this.app.getUserRole()
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.route
        .data
        .subscribe((v) => {
          this.mode = v.mode;
          this.rawOrders = history.state.orders
          if (this.rawOrders) {
            console.log('from route', this.rawOrders)
            this.orders = this.orderService.getAllActiveSubscriptions(this.rawOrders)
            console.log(this.orders);
            this.getProducts('alltime', this.orders)
            this.getBox()
            //this.getNewOrders('month')
          } else {
            this.fbService.getAllOrders(this.mode).valueChanges().subscribe((data: any) => {
              console.log('from fb', data)
              this.rawOrders = data
              this.orders = this.orderService.getAllActiveSubscriptions(data)
              console.log(this.orders);
              this.getProducts('alltime', this.orders)
              this.getBox()
              //this.getNewOrders('month')
            })
          }
        });
    }, 100);
  }

  getBox() {
    var boxes = []
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

    for (let index = 0; index < data.length; index++) {
      boxes.push({
        name: this.boxChartLabels[index],
        amount: data[index]
      })
      this.boxChartData.push(data[index])
    }
    this.dataSourceBoxes = new MatTableDataSource(boxes)
  }

  getProducts(type, orders) {
    var currentOrders = orders
    const data = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let index = 0; index < currentOrders.length; index++) {
      const order = currentOrders[index];
      const products = order.products
      const extraProducts = order.products.extraProducts
      if (products.pads) {
        products.pads.forEach(padItem => {
          if (padItem.id == 'PR') {
            data[0] = data[0] + padItem.amount
          } else if (padItem.id == 'PS') {
            data[1] = data[1] + padItem.amount
          } else if (padItem.id == 'PMR') {
            data[2] = data[2] + padItem.amount
          } else if (padItem.id == 'PMS') {
            data[3] = data[3] + padItem.amount
          }
        });
      }

      if (products.tampons) {
        products.tampons.forEach(tampon => {
          if (tampon.id == 'TR') {
            data[4] = data[4] + tampon.amount
          } else if (tampon.id == 'TS') {
            data[5] = data[5] + tampon.amount
          } else if (tampon.id == 'TSP') {
            data[6] = data[6] + tampon.amount
          }
        });
      }

      if (products.liners) {
        products.liners.forEach(liner => {
          if (liner.id == 'LL') {
            data[7] = data[7] + liner.amount
          } else if (liner.id == 'LEL') {
            data[8] = data[8] + liner.amount
          }
        });
      }

      if (extraProducts) {
        if (extraProducts.pads) {
          extraProducts.pads.forEach(padItem => {
            if (padItem.id == 'PR') {
              data[0] = data[0] + padItem.amount
            } else if (padItem.id == 'PS') {
              data[1] = data[1] + padItem.amount
            } else if (padItem.id == 'PMR') {
              data[2] = data[2] + padItem.amount
            } else if (padItem.id == 'PMS') {
              data[3] = data[3] + padItem.amount
            }
          });
        }

        if (extraProducts.tampons) {
          extraProducts.tampons.forEach(tampon => {
            if (tampon.id == 'TR') {
              data[4] = data[4] + tampon.amount
            } else if (tampon.id == 'TS') {
              data[5] = data[5] + tampon.amount
            } else if (tampon.id == 'TSP') {
              data[6] = data[6] + tampon.amount
            }
          });
        }

        if (extraProducts.liners) {
          extraProducts.liners.forEach(liner => {
            if (liner.id == 'LL') {
              data[7] = data[7] + liner.amount
            } else if (liner.id == 'LEL') {
              data[8] = data[8] + liner.amount
            }
          });
        }
      }
    }
    this.fillDataSource(type, data)
  }

  fillDataSource(type: string, data) {
    this.pieChartData = []
    var products = []
    if (type == 'alltime') {
      for (let index = 0; index < data.length; index++) {
        products.push({
          name: this.pieChartLabels[index],
          amount: data[index]
        })
        this.pieChartData.push(data[index])
      }
      this.dataSourceProducts = new MatTableDataSource(products)
    } else if (type == 'weekly') {
      for (let index = 0; index < data.length; index++) {
        products.push({
          type: this.productLabels[index][0],
          name: this.productLabels[index][1],
          amount: data[index]
        })
        this.pieChartData.push(data[index])
      }
      //this.dataSourceWeeklyProducts = new MatTableDataSource(products)
    }
  }

  changePage(id: number) {
    this.menuSelected = this.pages[id]

  }

  allPayments() {
    window.open('https://www.mollie.com/dashboard/org_4085344/payments', '_blank');
  }
}
