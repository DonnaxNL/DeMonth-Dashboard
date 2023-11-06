import { Component, HostListener, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { firestore } from 'firebase';
import * as moment from 'moment';
import { first } from 'rxjs/operators';
import { Helper } from 'src/app/shared/helper';
import { Products } from 'src/app/constants/products';
import { FirebaseOrder } from 'src/app/models/firebase.order';
import { FirestoreService } from 'src/app/services/firebase/firebase-service';
import { FirebaseInventoryService } from 'src/app/services/firebase/inventory-service';
import { FirebaseOrderService } from 'src/app/services/firebase/order-service';
import { OrderService } from 'src/app/services/order-service';
import { AddInventoryDialog } from './add-dialog/add-inventory.component';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  mode = 'live'
  currentWeek = 0
  isMobile = false
  dataLoaded = false
  timeout = null
  weeklyUpdate = false
  weeklyUpdateCare = false
  weeklyUpdateSnacks = false
  weeklyOrders

  rawOrders = [];
  orders = [];
  deliveryList = [];
  weekDates = [];
  inventoryAmounts = null
  inventoryAmountTotal = 0
  inventoryRemaining = null
  inventoryRemainingTotal = 0
  dataSourceMenstrualProducts
  dataSourceCareProducts
  dataSourceSnacks
  displayedMenstrualProductsColumnsNew: string[] = ['type', 'brand', 'product', 'inventory', 'used', 'amount', 'packed', 'remaining']
  displayedProductsColumns: string[] = ['type', 'brand', 'product', 'inventory', 'used', 'amount', 'remaining']

  constructor(
    private route: ActivatedRoute,
    private products: Products,
    private fbService: FirestoreService,
    private fbOrderService: FirebaseOrderService,
    private orderService: OrderService,
    private inventoryService: FirebaseInventoryService,
    private helper: Helper,
    public dialog: MatDialog,
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
      this.route
        .data
        .subscribe((v) => {
          this.mode = v.mode;
          this.rawOrders = history.state.orders
          if (this.rawOrders) {
            //console.log('from route', this.rawOrders)
            this.orders = this.orderService.getAllActiveSubscriptions(this.rawOrders)
            console.log(this.orders);
            this.getDeliveryDetails()
          } else {
            this.fbService.getAllOrders(this.mode).valueChanges().pipe(first()).subscribe((data: any) => {
              //console.log('from fb', data)
              this.rawOrders = data
              this.orders = this.orderService.getAllActiveSubscriptions(data)
              console.log(this.orders);
              this.getDeliveryDetails()
            })
          }
        });
    }, 100);
  }

  getDeliveryDetails() {
    this.fbOrderService.getDeliveryList(this.mode).pipe(first()).subscribe(deliveries => {
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
          if (data[i].deliveryDate && data[i].deliveryDate.toDate() > minimalDate) {
            deliveryItem = data[i]
            deliveryItem.deliveryNumber = i + 1
            break;
          }
        }

        if (!deliveryItem) {
          deliveryItem = data[data.length - 1]
          deliveryItem.deliveryNumber = data.length
        }

        if (order.boxId != 'box_01') {
          deliveryItem.careProducts = this.helper.getDeliveryProducts(deliveryItem.deliveryNumber, order)
          const snacks = this.helper.getDeliverySnacks(order.products.preferences, deliveryItem.deliveryNumber, order.boxId)
          var sortOrder = ['chocolate', 'healthbar', 'granola'];
          snacks.sort(function (a: any, b: any) {
            return sortOrder.indexOf(a.type) - sortOrder.indexOf(b.type);
          });
          deliveryItem.careProducts.snacks = snacks
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
    this.weeklyOrders = [];
    var firstDate = new Date()
    var weekNo = (moment(firstDate).locale('nl-nl').week())
    if (weekNo >= 52) {
      firstDate.setDate(firstDate.getDate() - 6)
    }
    this.currentWeek = weekNo
    var year = firstDate.getFullYear()
    this.weekDates = [1, 2, 3, 4, 5, 6, 7].map(d => moment(year + '-' + weekNo + '-' + d, 'YYYY-W-E'));
    //console.log(this.weekDates, this.deliveryList)
    this.deliveryList.forEach(delivery => {
      if (!(delivery.deliveryItem.deliveryDate instanceof firestore.Timestamp)) {
        delivery.deliveryItem.deliveryDate = new firestore.Timestamp(delivery.deliveryItem.deliveryDate.seconds, delivery.deliveryItem.deliveryDate.nanoseconds)
      }

      if (delivery.deliveryItem.deliveryDate.toDate() > this.weekDates[0].toDate().setHours(0, 0, 0, 0) &&
        delivery.deliveryItem.deliveryDate.toDate() < this.weekDates[6].toDate().setHours(23, 59, 59, 59)) {
        this.weeklyOrders.push(delivery)
      }
    });
    //console.log(weeklyOrders)
    this.getInventory()
  }

  getProducts(orders, type, tableList) {
    var currentOrders = orders
    const data = [];
    tableList.forEach(element => {
      data.push(0)
    });
    const packedData = [];
    tableList.forEach(element => {
      packedData.push(0)
    });
    // Count products
    for (let index = 0; index < currentOrders.length; index++) {
      const order = currentOrders[index];
      const products = order.products
      const extraProducts = order.products.extraProducts
      const careProducts = order.deliveryItem.careProducts
      const snacks = careProducts != null ? careProducts.snacks : null
      if (type == 'menstrual') {
        if (products.pads) {
          products.pads.forEach(padItem => {
            if (padItem.id == 'PR') {
              data[0] = data[0] + padItem.amount
              if (order.deliveryItem.packing.isPacked) {
                packedData[0] = packedData[0] + padItem.amount
              }
            } else if (padItem.id == 'PS') {
              data[1] = data[1] + padItem.amount
              if (order.deliveryItem.packing.isPacked) {
                packedData[1] = packedData[1] + padItem.amount
              }
            } else if (padItem.id == 'PMR') {
              data[2] = data[2] + padItem.amount
              if (order.deliveryItem.packing.isPacked) {
                packedData[2] = packedData[2] + padItem.amount
              }
            } else if (padItem.id == 'PMS') {
              data[3] = data[3] + padItem.amount
              if (order.deliveryItem.packing.isPacked) {
                packedData[3] = packedData[3] + padItem.amount
              }
            }
          });
        }

        if (products.tampons) {
          products.tampons.forEach(tampon => {
            if (tampon.id == 'TR') {
              data[4] = data[4] + tampon.amount
              if (order.deliveryItem.packing.isPacked) {
                packedData[4] = packedData[4] + tampon.amount
              }
            } else if (tampon.id == 'TS') {
              data[5] = data[5] + tampon.amount
              if (order.deliveryItem.packing.isPacked) {
                packedData[5] = packedData[5] + tampon.amount
              }
            } else if (tampon.id == 'TSP') {
              data[6] = data[6] + tampon.amount
              if (order.deliveryItem.packing.isPacked) {
                packedData[6] = packedData[6] + tampon.amount
              }
            }
          });
        }

        if (products.liners) {
          products.liners.forEach(liner => {
            if (liner.id == 'LL') {
              data[7] = data[7] + liner.amount
              if (order.deliveryItem.packing.isPacked) {
                packedData[7] = packedData[7] + liner.amount
              }
            } else if (liner.id == 'LEL') {
              data[8] = data[8] + liner.amount
              if (order.deliveryItem.packing.isPacked) {
                packedData[8] = packedData[8] + liner.amount
              }
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
      } else if (type == 'care') {
        // Count sponge tampon
        if (products.tampons && order.boxId == 'box_03') {
          data[3] = data[3] + 1
        }

        // Count buds
        if (!products.removeBuds) {
          data[0] = data[0] + 1
        }

        // Count gentle wipes
        if (order.boxId == 'box_02' || order.boxId == 'box_03') {
          data[1] = data[1] + 1
        }

        // Count glow serum
        if (order.boxId == 'box_03') {
          data[2] = data[2] + 1
        }

        // Care products
        if (careProducts && careProducts.shampooBar) {
          const shampooBarOptions = this.products.shampooBarOptions
          for (let index = 0; index < shampooBarOptions.length; index++) {
            const item = shampooBarOptions[index];
            if (item.id == careProducts.shampooBar.id) {
              data[index + 4] = data[index + 4] + 1
            }
          }
        }
        if (careProducts && careProducts.tea) {
          const teaOptions = this.products.teaOptions
          for (let index = 0; index < teaOptions.length; index++) {
            const item = teaOptions[index];
            if (item.id == careProducts.tea.id) {
              data[index + 7] = data[index + 7] + 1
            }
          }
        }
        if (careProducts && careProducts.faceMask) {
          const faceMaskOptions = this.products.faceMaskOptions
          for (let index = 0; index < faceMaskOptions.length; index++) {
            const item = faceMaskOptions[index];
            if (item.id == careProducts.faceMask.id) {
              data[index + 11] = data[index + 11] + 1
            }
          }
        }
      } else if (type == 'snacks') {
        if (snacks) {
          //console.log(snacks)
          for (let index = 0; index < tableList.length; index++) {
            const item = tableList[index];
            snacks.forEach(snack => {
              if (item.id == snack.id) {
                data[index] = data[index] + 1
              }
            });
          }
        }
      }
    }

    // Fill data list
    for (let index = 0; index < tableList.length; index++) {
      const item = tableList[index];
      item.amount = data.length > 1 ? data[index] : 0
      item.packed = packedData[index]
    }

    this.calculateRemaining(type, tableList)
  }

  fillDataSource(orders) {
    console.log(orders)
    var menstrualProducts = []
    var careProducts = []
    var snacks = []

    this.inventoryService.getAllMenstrualProducts().valueChanges().pipe(first()).subscribe((products) => {
      //Sort
      var sortOrder = ['pads', 'tampons', 'liners'];
      products.sort(function (a: any, b: any) {
        return sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id);
      });
      //console.log(products);
      for (let index = 0; index < products.length; index++) {
        this.weeklyUpdate = false
        const productItem = products[index] as any;
        this.inventoryService.getAllProductsFromType(productItem.id, productItem.brands[0].id).valueChanges().pipe(first()).subscribe((data: any) => {
          //Sort
          data.sort((a, b) => (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0));
          //console.log(data)
          data.forEach(product => {
            menstrualProducts.push({
              id: product.id,
              type: productItem.name.en,
              brand: productItem.brands[0].name,
              name: product.name.en,
              used: 0,
              amount: 0,
              firestoreInfo: {
                type: productItem.id,
                brand: productItem.brands[0].id,
                id: product.id
              }
            })
          });

          //console.log(menstrualProducts)
          this.getProducts(orders, 'menstrual', menstrualProducts)
        });
      }
    });

    this.inventoryService.getAllCareProducts().valueChanges().pipe(first()).subscribe((products) => {
      this.weeklyUpdateCare = false
      careProducts = []
      //Sort
      var sortOrder = ['cotton-buds', 'wet-wipes', 'glow-serum', 'sponge-tampon', 'shampoobar', 'tea', 'facemask'];
      products.sort(function (a: any, b: any) {
        return sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id);
      });
      //console.log(products);
      for (let index = 0; index < products.length; index++) {
        const productItem = products[index] as any;
        if (productItem.brands) {
          this.inventoryService.getAllProductsFromType(productItem.id, productItem.brands[0].id).valueChanges().pipe(first()).subscribe((data: any) => {
            //Sort
            data.sort((a, b) => (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0));
            //console.log(data)
            data.forEach(product => {
              careProducts.push({
                id: product.id,
                type: productItem.name.en,
                brand: productItem.brands[0].name,
                name: product.name.en != null ? product.name.en : product.name.nl,
                used: 0,
                amount: 0,
                remaining: 0,
                firestoreInfo: {
                  type: productItem.id,
                  brand: productItem.brands[0].id,
                  id: product.id
                }
              })
            });

            this.getProducts(orders, 'care', careProducts)
          });
        } else {
          careProducts.push({
            id: productItem.id,
            type: 'Other',
            brand: productItem.brand,
            name: productItem.name.en,
            used: 0,
            amount: 0,
            firestoreInfo: {
              id: productItem.id
            }
          })
        }
      }

      this.getProducts(orders, 'care', careProducts)
    });

    this.inventoryService.getAllSnacks().valueChanges().pipe(first()).subscribe((products) => {
      //console.log(products)
      //Sort
      var sortOrder = ['chocolate', 'healthbar', 'granola'];
      products.sort(function (a: any, b: any) {
        return sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id);
      });
      for (let index = 0; index < products.length; index++) {
        this.weeklyUpdateSnacks = false
        const productItem = products[index] as any;
        this.inventoryService.getAllProductsFromType(productItem.id, productItem.brands[0].id).valueChanges().pipe(first()).subscribe((data: any) => {
          //Sort
          data.sort((a, b) => (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0));
          //console.log(data)
          data.forEach(product => {
            snacks.push({
              id: product.id,
              type: productItem.name.en,
              brand: productItem.brands[0].name,
              name: product.name.en,
              used: 0,
              amount: 0,
              packed: 0,
              firestoreInfo: {
                type: productItem.id,
                brand: productItem.brands[0].id,
                id: product.id
              }
            })
          });

          this.getProducts(orders, 'snacks', snacks)
        });
      }
    });
    this.dataLoaded = true
  }

  calculateRemaining(type: string, tableList) {

    // Fill data list
    for (let index = 0; index < tableList.length; index++) {
      const item = tableList[index];
      let inventory
      if (item.firestoreInfo.brand) {
        inventory = this.inventoryAmounts[item.firestoreInfo.type][item.firestoreInfo.brand][item.firestoreInfo.id]
        item.used = Math.round((100 / inventory) * item.amount)
        this.inventoryRemaining[item.firestoreInfo.type][item.firestoreInfo.brand][item.firestoreInfo.id] = inventory - item.amount
      } else {
        inventory = this.inventoryAmounts[item.firestoreInfo.id]
        item.used = Math.round((100 / inventory) * item.amount)
        this.inventoryRemaining[item.firestoreInfo.id] = inventory - item.amount
      }
      this.inventoryAmountTotal = this.inventoryAmountTotal + inventory
      this.inventoryRemainingTotal = this.inventoryRemainingTotal + (inventory - item.amount)
    }

    //console.log('totals',this.inventoryAmountTotal, this.inventoryRemainingTotal)
    this.inventoryRemaining.updatedOn = new Date()
    this.inventoryService.updateInventory('remaining', this.inventoryRemaining)

    // Fill data source
    if (type == 'menstrual') {
      this.dataSourceMenstrualProducts = new MatTableDataSource(tableList)
    } else if (type == 'care') {
      this.dataSourceCareProducts = new MatTableDataSource(tableList)
    } else if (type == 'snacks') {
      this.dataSourceSnacks = new MatTableDataSource(tableList)
    }
  }

  getInventory() {
    this.inventoryService.getInventory('amounts').valueChanges().pipe(first()).subscribe((amounts) => {
      if (!this.inventoryAmounts) {
        if (amounts.updatedOn.toDate() > this.weekDates[0]) {
          this.inventoryService.getInventory('remaining').valueChanges().pipe(first()).subscribe((remaining) => {
            this.inventoryRemaining = remaining
          });
          this.inventoryAmounts = amounts
          this.fillDataSource(this.weeklyOrders)
        } else {
          console.log('update')
          this.inventoryService.getInventory('remaining').valueChanges().pipe(first()).subscribe((remaining) => {
            this.inventoryRemaining = remaining
            if (amounts.updatedOn.toDate() < this.weekDates[0]) {
              this.inventoryRemaining.updatedOn = new Date()
              this.inventoryService.updateInventory('amounts', this.inventoryRemaining)
            }
          });
        }
      } else {
        this.inventoryAmounts = amounts
        this.calculateRemaining('menstrual', this.dataSourceMenstrualProducts.data)
        this.calculateRemaining('care', this.dataSourceCareProducts.data)
        this.calculateRemaining('snacks', this.dataSourceSnacks.data)
      }
    });
  }

  onInventoryChanged() {
    this.inventoryAmounts.updatedOn = new Date()
    this.timeout = null;
    if (this.timeout) { //if there is already a timeout in process cancel it
      window.clearTimeout(this.timeout);
    }
    this.timeout = window.setTimeout(() => {
      this.timeout = null;
      this.inventoryService.updateInventory('amounts', this.inventoryAmounts)
    }, 1000);
  }

  addInventory() {
    console.log(this.dataSourceMenstrualProducts.data, this.dataSourceCareProducts.data, this.dataSourceSnacks.data)
    const dialogRef = this.dialog.open(AddInventoryDialog, {
      width: '800px',
      data: {
        inventoryMenstrual: this.dataSourceMenstrualProducts.data,
        inventoryCare: this.dataSourceCareProducts.data,
        inventorySnacks: this.dataSourceSnacks.data,
        inventoryAmounts: this.inventoryAmounts
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
      if (result != undefined) {

      }
    })
  }
}
