import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireFunctions } from '@angular/fire/functions';
import { Router, ActivatedRoute } from '@angular/router';
import { firestore, User } from 'firebase';
import { first } from 'rxjs/operators';
import { AppComponent } from 'src/app/app.component';
import { Helper } from 'src/app/shared/helper';
import { Products } from 'src/app/constants/products';
import { FirebaseDeliveryService } from 'src/app/services/firebase/delivery-service';
import { FirestoreService } from 'src/app/services/firebase/firebase-service';
import { FirebaseOrderService } from 'src/app/services/firebase/order-service';
import { UserService } from 'src/app/services/firebase/user-service';
import { Product } from '../order-details/order-details.component';

@Component({
  selector: 'app-delivery-details',
  templateUrl: './delivery-details.component.html',
  styleUrls: ['./delivery-details.component.scss']
})
export class DeliveryDetailsComponent implements OnInit {
  sub: any;
  mode = 'live'
  dataLoaded = false
  showPreferences = false
  user
  userRole = [false, false, false, false, false]
  customer

  orderId
  order
  deliveryId
  delivery
  payment
  deliveryNumber = 0
  skinType
  careProducts = {
    faceMask: null,
    shampooBar: null,
    tea: null,
    other: null,
    snacks: null
  }

  deliveries = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  skinTypes = ['normal', 'mixed', 'dry', 'oil', 'no_pref']

  dataSourceProducts
  dataSourceExtraProducts
  displayedColumns = ['brand', 'type', 'name', 'amount'];
  displayedColumnsExtraProducts = ['brand', 'type', 'name', 'price', 'amount'];

  constructor(
    private router: Router,
    private dataRoute: ActivatedRoute,
    private auth: AngularFireAuth,
    private app: AppComponent,
    private helper: Helper,
    private fun: AngularFireFunctions,
    private fbService: FirestoreService,
    private userService: UserService,
    private orderService: FirebaseOrderService,
    private deliveryService: FirebaseDeliveryService,
    private products: Products
  ) { }

  ngOnInit(): void {
    this.orderId = this.dataRoute.snapshot.paramMap.get('subscriptionId')
    this.deliveryId = this.dataRoute.snapshot.paramMap.get('deliveryId')

    if (this.orderId == null) {
      this.router.navigate(['/deliveries'])
    }

    this.auth.user.subscribe((user: User) => {
      this.user = user
    })
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.sub = this.dataRoute.data.subscribe((v) => {
        this.mode = v.mode;
        this.order = history.state.order
        this.delivery = history.state.delivery
        if (!this.order) {
          this.orderService.getOrderByID(this.orderId, this.mode).valueChanges().subscribe((data: any) => {
            if (data == null) {
              this.router.navigate(['/'])
            }
            this.order = data
            console.log('from fb:', this.order)
            this.getOrderDetails()
            this.getCustomerDetails()
          })
        } else {
          console.log('from route:', this.order)
          this.getOrderDetails()
          this.getCustomerDetails()
        }
        if (!this.delivery) {
          this.deliveryService.getDeliveryFromOrderByIDs(this.orderId, this.deliveryId, this.mode).valueChanges().subscribe((data: any) => {
            if (data == null) {
              this.router.navigate(['/'])
            }
            this.delivery = data
            console.log('from fb:', this.delivery)
            this.getDeliveryDetails()
          })
        } else {
          console.log('from route:', this.delivery)
          this.getDeliveryDetails()
        }
      });
    }, 100);
  }

  getOrderDetails() {
    this.userRole = this.app.getUserRole()
    console.log(this.userRole)

    this.getDeliveryProducts(1, this.skinType)

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

  getDeliveryDetails() {
    if (!this.delivery.paymentDetails.isPaid  && !this.delivery.paymentDetails.bankReasonCode) {
      this.getPayments()
    }

    // TEMP
    this.getDeliveryNumber()

    if (!(this.delivery.deliveryDate instanceof firestore.Timestamp)) {
      this.delivery.deliveryDate = new firestore.Timestamp(this.delivery.deliveryDate.seconds, this.delivery.deliveryDate.nanoseconds)
      console.log('converted', this.delivery.deliveryDate)
    }
    this.dataLoaded = true
  }

  setDeliveryStatus(event, isDelivery) {
    var state = event.checked
    if (isDelivery) { //set deliver status
      this.delivery.delivery.isDelivered = state
      this.delivery.delivery.deliveryInitiatedBy = state ? this.user.displayName : ''
      this.orderService.setDeliveryStatus(this.order.orderId, this.delivery.id, this.user.displayName, this.delivery.packing.isPacked, state, this.order.userId)
      this.setPoints(state)
    } else { // Set packed status
      this.delivery.packing.isPacked = state,
        this.delivery.packing.packedBy = state ? this.user.displayName : ''
      if (!state) {
        this.delivery.delivery.isDelivered = false
        this.delivery.delivery.deliveryInitiatedBy = ''
      }
      this.orderService.setDeliveryStatus(this.order.orderId, this.delivery.id, this.user.displayName, state, state ? this.delivery.delivery.isDelivered : false, this.order.userId)
    }
  }

  setPoints(checked: boolean) {
    let pointsToAdd = 0
    if (this.order.boxId == 'box_01') {
        pointsToAdd = pointsToAdd + 5
    } else if (this.order.boxId == 'box_02') {
        pointsToAdd = pointsToAdd + 7.5
    } else if (this.order.boxId == 'box_03') {
        pointsToAdd = pointsToAdd + 10
    }
    if (pointsToAdd > 0 && this.customer && this.deliveryNumber != 1) {
      let currentPoints = this.customer.points.current
      let lifetimePoints = this.customer.points.lifetime
      if (checked) {
        currentPoints = currentPoints + pointsToAdd
        lifetimePoints = lifetimePoints + pointsToAdd
      } else {
        currentPoints = currentPoints - pointsToAdd
        lifetimePoints = lifetimePoints - pointsToAdd
      }
      //console.log(this.customer, currentPoints, lifetimePoints)
      this.userService.updatePoints(this.customer.uid, currentPoints, lifetimePoints)
    }
  }

  onSelectChanged(delivery, skinType) {
    this.getDeliveryProducts(delivery, skinType)
  }

  getDeliveryProducts(number, skinType) {
    if (number != null) {
      this.deliveryNumber = number
    }
    if (this.order.products.preferences) {
      this.skinType = this.order.products.preferences.skinType
    } else {
      this.skinType = 'no_pref'
    }
    if (skinType != null) {
      this.skinType = skinType
    }
    var otherPick = []
    if (this.order.boxId != 'box_01' && !this.order.products.removeBuds) {
      otherPick.push(this.getItemById(this.products.otherOptions, 'cotton-buds'))
    }
    if (this.order.boxId == 'box_02' || this.order.boxId == 'box_03') {
      otherPick.push(this.getItemById(this.products.otherOptions, 'wet-wipes'))
      if (this.order.boxId == 'box_03') {
        otherPick.push(this.getItemById(this.products.otherOptions, 'glow-serum'))
      }
    }
    if (this.order.products.tampons) {
      otherPick.push(this.getItemById(this.products.otherOptions, 'sponge-tampon'))
    }
    this.careProducts = this.helper.getDeliveryProducts(this.deliveryNumber, this.order)
    this.careProducts.other = otherPick
    console.log(this.careProducts)
    var preferences = this.order.products.preferences
    if (!preferences) {
      preferences = {
        chocolate: ['no_pref'],
        healthbar: ['no_pref'],
        granola: ['none'],
        skinType: 'no_pref'
      }
    }
    const snacks = this.helper.getDeliverySnacks(preferences, this.deliveryNumber, this.order.boxId)
    var sortOrder = ['chocolate', 'healthbar', 'granola'];
    snacks.sort(function (a: any, b: any) {
      return sortOrder.indexOf(a.type) - sortOrder.indexOf(b.type);
    });
    if (snacks.length == 0) {
      snacks.push({
        name: 'None'
      })
    }
    this.careProducts.snacks = snacks
  }

  getDeliveryNumber() {
    this.deliveryService.getDeliveriesFromOrderByID(this.orderId, this.mode).valueChanges().subscribe((data: any) => {
      console.log(data)
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        if (element.id == this.deliveryId) {
          this.deliveryNumber = (index + 1)
          if (this.deliveryNumber > 12) {
            for (let i = 13; i < this.deliveryNumber + 1; i++)
              this.deliveries.push(i)
          }
        }
      }
      this.getDeliveryProducts(null, null)
      console.log(this.deliveryNumber, this.deliveries)
    })
  }

  getPayments() {
    const allPaymentsCall = this.fun.httpsCallable('getPaymentsFromCustomer');
    allPaymentsCall({ uid: this.order.userId }).subscribe((result) => {
      //console.log(result)
      this.prepareOrderPayments(result)
    });
  }

  prepareOrderPayments(payments) {
    const description = payments[0].description.split(' | ')
    const orderRef = description[0].replace('[Retry] ', '')
    //console.log(orderRef)
    if (payments[0].metadata != null &&
      this.order.orderId == payments[0].metadata.OrderId ||
      this.order.subscriptionDetails.subscriptionId != null &&
      this.order.subscriptionDetails.subscriptionId == payments[0].subscriptionId ||
      this.order.orderReference == orderRef) {
      let status;
      if (payments[0].details != null &&
        payments[0].details.bankReasonCode) {
        if (payments[0].details.bankReasonCode == 'AM04') {
          status = 'Insufficient funds'
        } else if (payments[0].details.bankReasonCode == 'MD01') {
          status = 'Invalid mandate'
        } else if (payments[0].details.bankReasonCode == 'MD06') {
          status = 'Payment reversal'
        } else if (payments[0].details.bankReasonCode == 'MS02') {
          status = 'Transaction refused'
        } else {
          status = payments[0].details.bankReasonCode
        }
      } else {
        //console.log(j, this.allPayments[j].status)
        if (payments[0].status == 'paid') {
          status = 'Paid'
        } else if (payments[0].status == 'open') {
          status = 'Open'
        } else if (payments[0].status == 'canceled') {
          status = 'Canceled'
        } else if (payments[0].status == 'pending') {
          status = 'Pending'
        } else if (payments[0].status == 'expired') {
          status = 'Expired'
        } else if (payments[0].status == 'failed') {
          status = 'Failed'
        }
      }
      if (payments[0].amountRefunded != null && payments[0].amountRefunded.value != '0.00') {
        if (payments[0].amount.value == payments[0].amountRefunded.value) {
          status = 'Refunded'
        } else {
          status = 'Partially Refunded'
        }
      }
      const date = new Date(payments[0].createdAt)
      let description
      if (payments[0].sequenceType == 'first') {
        description = payments[0].description.split("-", 2)[0];
      } else {
        description = 'Payment for ' + date.toLocaleString('en', { month: 'long' }) + ' ' + date.getFullYear()
      }
      const usedData = {
        id: payments[0].id,
        description: description,
        date: date,
        status: status,
        amount: parseFloat(payments[0].amount.value),
        paymentItem: payments[0]
      }
      this.payment = usedData
      //console.log(usedData)
    }
  }

  getItemById(array, id, isDelivery?) {
    var searchId = id
    if (id == 'no_pref') {
      searchId = 'normal'
    }
    var filter = array.filter(f => f.id == searchId)
    //console.log('filter', array, searchId, filter)
    if (isDelivery) {
      return filter.map(({ delivery }) => delivery)[0];
    } else {
      return filter.map(({ item }) => item)[0];
    }
    // if (skinType == null) {
    //   return filter.map(({item}) => item)[0]; 
    // } else if (skinType == 'normal') {
    //   return filter.map(({skinNormal}) => skinNormal)[0];
    // } else if (skinType == 'mixed') {
    //   return filter.map(({skinMixed}) => skinMixed)[0];
    // }
  }

  getCustomerDetails() {
    this.fbService.getCustomerByID(this.order.userId).valueChanges().subscribe((data: any) => {
      this.customer = data
      if (!this.customer) {
        this.fbService.getUserDocRefByUID(this.order.userId).valueChanges().pipe(first()).subscribe((user: firebase.User) => {
          this.customer = {
            firstName: user.displayName.split(' ', 2)[0],
            lastName: user.displayName.split(' ', 2)[1],
            email: user.email
          }
        });
      }
    })
  }

  openInFirebase() {
    if (this.mode == null || this.mode == 'live') {
      window.open('https://console.firebase.google.com/project/demonth-55207/firestore/data/orders/' + this.orderId + '/deliveries/' + this.deliveryId, '_blank');
    } else {
      window.open('https://console.firebase.google.com/project/demonth-55207/firestore/data/test-orders/' + this.orderId + '/deliveries/' + this.deliveryId, '_blank');
    }
  }

  showOrderDetails() {
    if (this.mode == null || this.mode == 'live') {
      this.router.navigate(['/orders/' + this.orderId], { state: { order: this.order } });
    } else {
      this.router.navigate(['/test/orders/' + this.orderId], { state: { order: this.order } });
    }
  }
}
