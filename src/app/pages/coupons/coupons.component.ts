import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { FirestoreService } from 'src/app/services/firebase/firebase-service';
import { Router, ActivatedRoute } from '@angular/router';
import { UserData } from 'src/app/models/userdata';
import { FormControl, Validators, FormBuilder } from '@angular/forms';
import { MyErrorStateMatcher } from 'src/app/shared/errormatcher';
import { Coupon } from 'src/app/models/coupon';
import { Observable } from 'rxjs';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-coupons',
  templateUrl: './coupons.component.html',
  styleUrls: ['./coupons.component.scss']
})
export class CouponsComponent implements OnInit {
  userData$: Observable<UserData | null>;
  coupons
  dataSourceMulti
  dataSourceSingle

  coupon: Coupon = {
    id: '',
    name: '',
    limit: 0,
    discount: 1,
    type: 'special',
    usedBy: []
  }

  displayedColumns: string[] = ['id', 'name', 'discount', 'usedBy', 'expireDate', 'action']
  displayedColumnsSingle: string[] = ['id', 'name', 'discount', 'used', 'usedByUid', 'action']

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('multiPaginator', { static: true }) multiPaginator: MatPaginator;
  @ViewChild('singlePaginator', { static: true }) singlePaginator: MatPaginator;

  constructor(
    public fbService: FirestoreService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
  ) { }

  ngOnInit() {
    this.fbService.getAllCoupons().valueChanges().subscribe((data: any) => {
      this.coupons = data
      //console.log(this.coupons)
      this.prepareCouponDetails()
    })
  }

  prepareCouponDetails() {
    //this.allData = []
    let tableListMulti = []
    let tableListSingle = []
    for (let i = 0; i < this.coupons.length; i++) {
      if (this.coupons[i].usedByUid != undefined) {
        this.userData$ = this.fbService.getUserInfoRefByUID(this.coupons[i].usedByUid).valueChanges();
        this.userData$.subscribe((data: UserData) => {
          var couponItem: Coupon = {
            id: this.coupons[i].id,
            name: this.coupons[i].name,
            limit: this.coupons[i].limit != undefined ? this.coupons[i].limit : null,
            discount: this.coupons[i].discount,
            usedByUid: this.coupons[i].usedByUid
          }
          if (this.coupons[i].used != undefined) {
            couponItem.used = this.coupons[i].used
          }
          couponItem.usedByUser = data
          tableListSingle.push(couponItem)
          tableListSingle.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
          this.dataSourceSingle = new MatTableDataSource(tableListSingle)
          this.dataSourceSingle.sort = this.sort
          this.dataSourceSingle.paginator = this.singlePaginator
        })
      } else {
        var couponItem: Coupon = {
          id: this.coupons[i].id,
          name: this.coupons[i].name,
          limit: this.coupons[i].limit != undefined ? this.coupons[i].limit : null,
          discount: this.coupons[i].discount,
          expireDate: this.coupons[i].expireDate != undefined ? this.coupons[i].expireDate.toDate() : null
        }
        couponItem.used = this.coupons[i].used != undefined ? this.coupons[i].used : false
        couponItem.usedBy = this.coupons[i].usedBy != undefined ? this.coupons[i].usedBy : []
        if (this.coupons[i].used != undefined) {
          tableListSingle.push(couponItem)
          tableListSingle.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
          this.dataSourceSingle = new MatTableDataSource(tableListSingle)
        } else if (this.coupons[i].usedBy != undefined) {
          tableListMulti.push(couponItem)
          tableListMulti.sort((a, b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
          this.dataSourceMulti = new MatTableDataSource(tableListMulti)
        }
      }
    }

    //this.dataSourceMulti.sort = this.sort
    this.dataSourceMulti.paginator = this.multiPaginator
  }

  applyFilter(event: Event, type) {
    const filterValue = (event.target as HTMLInputElement).value;
    switch (type) {
      case 'multi':
        this.dataSourceMulti.filter = filterValue.trim().toLowerCase();
        break;
      case 'single':
        this.dataSourceSingle.filter = filterValue.trim().toLowerCase();
        break;
      default:
        break;
    }
  }

  showUser(coupon) {
    console.log(coupon)
    if (coupon.usedByUid != null) {
      this.router.navigate(['/customers/' + coupon.usedByUid], { state: { customer: coupon.usedByUser } });
    }
  }

  editCoupon(coupon, type) {
    coupon.type = type
    if (coupon.limit == undefined) {
      coupon.limit = 0
    }
    const dialogRef = this.dialog.open(AddCouponDialog, {
      width: '450px',
      data: {
        coupon: coupon,
        isEdit: true
      }
    });

    console.log(coupon)

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result)
      if (result != undefined) {
        var coupon
        if (result.coupon.type == 'special') {
          var limit = result.coupon.limit
          var expireDate = null
          if (result.coupon.expireDate) {
            expireDate = (result.coupon.expireDate instanceof Date) ? result.coupon.expireDate : result.coupon.expireDate.toDate()
          }
          coupon = {
            id: result.coupon.id,
            name: result.coupon.name,
            limit: limit != 0 ? limit : null,
            discount: result.coupon.discount,
            expireDate: expireDate,
            used: null,
            usedBy: result.coupon.usedBy,
          }
        } else {
          coupon = {
            id: result.coupon.id,
            name: result.coupon.name,
            discount: result.coupon.discount,
            expireDate: (result.coupon.expireDate instanceof Date) ? result.coupon.expireDate : result.coupon.expireDate.toDate(),
            used: result.coupon.used,
            usedBy: null
          }
        }
        console.log('coupon', coupon)
        this.fbService.editCoupon(coupon)
      }
    });
  }

  deleteCoupon(coupon) {
    this.fbService.deleteCoupon(coupon.id)
  }

  openDialog() {
    console.log(this.coupon)
    const dialogRef = this.dialog.open(AddCouponDialog, {
      width: '450px',
      data: {
        coupon: this.coupon,
        isEdit: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result)
      if (result != undefined) {
        var coupon
        if (result.coupon.type == 'special') {
          var limit = result.coupon.limit
          coupon = {
            id: result.coupon.id,
            name: result.coupon.name,
            limit: limit != 0 ? limit : null,
            discount: result.coupon.discount,
            expireDate: result.coupon.expireDate.toDate(),
            usedBy: [],
          }
        } else {
          coupon = {
            id: result.coupon.id,
            name: result.coupon.name,
            discount: result.coupon.discount,
            expireDate: result.coupon.expireDate.toDate(),
            used: false,
          }
        }
        console.log('coupon', coupon)
        this.fbService.createCoupon(coupon)
      }
    });
  }
}

export interface DialogData {
  coupon,
  isEdit
}

@Component({
  selector: 'add-coupon-dialog',
  templateUrl: 'add-coupon-dialog.html',
})
export class AddCouponDialog {
  minDate = new Date()
  errorCode = false
  errorDescription = false

  constructor(
    public dialogRef: MatDialogRef<AddCouponDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public fbService: FirestoreService,
    private snackBar: MatSnackBar, ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addCoupon(): void {
    console.log(this.data)
    var error = false
    if (this.data.coupon.id == '' || this.data.coupon.name == '') {
      //this.errorCode = true
      error = true
      this.snackBar.open("Please check required fields!", "Close", {
        duration: 5000,
      });
    }
    // if (this.data.coupon.name == '') {
    //   this.errorDescription = true
    //   error = true
    // } 
    if (!error) {
      this.dialogRef.close(this.data);
    }
  }

  generateCode() {
    this.data.coupon.id = this.fbService.generateId().slice(0, 6)
  }
}