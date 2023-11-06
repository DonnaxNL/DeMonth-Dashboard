import { Component, HostListener, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Helper } from 'src/app/shared/helper';
import { Products } from 'src/app/constants/products';
import { FirebaseRotationService } from 'src/app/services/firebase/rotation-service';
import { AddEditRotationDialog } from './add-edit-rotation/add-edit-rotation.component';

@Component({
  selector: 'app-care-rotation',
  templateUrl: './care-rotation.component.html',
  styleUrls: ['./care-rotation.component.scss']
})
export class CareRotationComponent implements OnInit {
  isMobile = false
  showSelector = false
  dataLoaded = false
  selectedYear = 2020
  selectedMonth = 0

  years = [];
  skinTypes = ['normal', 'mixed', 'dry', 'oil']
  productTypes = ['facemask', 'shampoobar', 'tea']
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  rotationData = [null, null, null, null, null, null, null, null, null, null, null, null]

  constructor(
    private dialog: MatDialog,
    private rotationService: FirebaseRotationService,
    private products: Products,
    private helper: Helper
  ) {
    this.onResize()
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    var screenHeight = window.innerHeight;
    var screenWidth = window.innerWidth;
    this.isMobile = screenWidth <= 480
  }

  ngOnInit(): void {
    for (let index = 2021; index <= 2025; index++) {
      this.years.push(index)
    }
    this.selectedYear = new Date().getFullYear()
    this.selectedMonth = new Date().getMonth()
    this.getRotation()
  }

  changeDate(monthIndex?: number, year?: number) {
    if (!year) {
      this.selectedMonth = monthIndex
      const itemToScrollTo = document.getElementById('item-' + monthIndex);
      // null check to ensure that the element actually exists
      if (itemToScrollTo) {
        itemToScrollTo.scrollIntoView(true);
      }
    }
  }

  getRotation() {
    this.rotationData = [];
    for (let index = 0; index < this.months.length; index++) {
      var id = this.selectedYear.toString()
      var monthNumber = index + 1
      id = id + '-' + monthNumber.toString().padStart(2, '0');
      this.rotationService.getBoxRotation(id).valueChanges().subscribe(item => {
        if (item) {
          const options = [this.products.faceMaskOptions, this.products.shampooBarOptions]
          const products = item.products
          console.log(products)
          var items = [];
          items['id'] = item.id
          items['date'] = item.date
          items['name'] = item.name
          items['products'] = {}
          for (let i = 0; i < this.productTypes.length; i++) {
            items['products'][this.productTypes[i]] = {}
            for (let j = 0; j < this.skinTypes.length; j++) {
              if (this.productTypes[i] != 'tea') {
                var id = item.products[this.productTypes[i]][this.skinTypes[j]]
                //console.log(this.productTypes[i], this.skinTypes[j], id)
                items['products'][this.productTypes[i]][this.skinTypes[j]] = this.helper.getItemById(options[i], id)
              } else {
                const tea = [];
                for (let i = 0; i < products.tea[this.skinTypes[j]].length; i++) {
                  const teaProduct = products.tea[this.skinTypes[j]][i];
                  var item = this.helper.getItemById(this.products.teaOptions, teaProduct)
                  if (item) {
                    tea.push(item)
                  }
                  items['products']['tea'][this.skinTypes[j]] = tea
                }
              }
              // if (this.productTypes[i] == 'facemask') {
              //   items['facemask'][this.skinTypes[j]] = this.helper.getItemById(this.products.faceMaskOptions, products.facemask[this.skinTypes[j]])
              // } else if (this.productTypes[i] == 'shampoobar') {
              //   items['shampoobar'][this.skinTypes[j]] = this.helper.getItemById(this.products.shampooBarOptions, products.shampoobar[this.skinTypes[j]])
              // } else if (this.productTypes[i] == 'tea') {
              //   const tea = [];
              //   for (let i = 0; i < products.tea[this.skinTypes[j]].length; i++) {
              //     const teaProduct = products.tea[this.skinTypes[j]][i];
              //     var item = this.helper.getItemById(this.products.teaOptions, teaProduct)
              //     if (item) {
              //       tea.push(item)
              //     }
              //     items['tea'][this.skinTypes[j]] = tea
              //   }
              // }
            }
          }
          this.rotationData[index] = items
          console.log(items)
        }
        if (index == this.months.length - 1) {
          this.dataLoaded = true
          console.log(this.rotationData)
        }
      });
    }
  }

  onSelectChanged(year) {
    this.selectedYear = year
    if (year != new Date().getFullYear()) {
      this.selectedMonth = 0
    } else {
      this.selectedMonth = new Date().getMonth()
    }
    this.getRotation()
  }

  editRotation(isEdit: boolean, monthIndex: number, month?: string) {
    this.selectedMonth = monthIndex
    const dialogRef = this.dialog.open(AddEditRotationDialog, {
      width: '500px',
      data: {
        selectedYear: this.selectedYear,
        selectedMonth: this.selectedMonth,
        item: month
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
    })
  }
}
