import { HostListener } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FirebaseProductService } from 'src/app/services/firebase/product-service';
import { EditProductDialog } from './edit-product/edit-product.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  showFiller = false;
  menuSelected = 'pads';
  selectedPage;
  selectedData = [];
  isMobile = false;

  menstrualProducts = [];
  careProducts = [];
  snacks = [];

  constructor(
    private dialog: MatDialog,
    private productService: FirebaseProductService,
  ) { 
    this.onResize()
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    var screenWidth = window.innerWidth;
    this.isMobile = screenWidth <= 480
  }

  ngOnInit(): void {
    this.getProductTypes()
  }

  getProductTypes() {
    this.productService.getAllMenstrualProducts().valueChanges().subscribe((products) => {
      //Sort
      var sortOrder = ['pads', 'tampons', 'liners'];
      products.sort(function (a: any, b: any) {
        return sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id);
      });
      this.menstrualProducts = products
      this.selectedPage = products[0]
      this.getProducts(this.selectedPage)
      console.log(this.menstrualProducts)
    });

    this.productService.getAllCareProducts().valueChanges().subscribe((products) => {
      this.careProducts = products
    });

    this.productService.getAllSnacks().valueChanges().subscribe((products) => {
      this.snacks = products
    });
  }

  getProducts(type) {
    console.log(type)
    var brands = type.brands
    if (brands) {
      brands.forEach(element => {
        this.productService.getAllProductsFromType(type.id, element.id).valueChanges().subscribe((products) => {
          this.selectedData = []
          //Sort
          products.sort((a, b) => (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0));
          this.selectedData.push({
            id: element.id,
            name: element.name,
            products: products
          })
          console.log(this.selectedData)
        });
      });
    } else {
      this.selectedData = []
      this.selectedData.push({
        id: type.brand.id,
        name: type.brand.name,
        products: [type]
      })
    }
  }

  changePage(type: string, page: string, index: number) {
    this.menuSelected = page
    if (type == 'menstrual') {
      this.selectedPage = this.menstrualProducts[index]
    } else if (type == 'care') {
      this.selectedPage = this.careProducts[index]
    } else if (type == 'snacks') {
      this.selectedPage = this.snacks[index]
    }
    this.getProducts(this.selectedPage)
  }

  editProduct(type: string, brand: string, product: any) {
    const dialogRef = this.dialog.open(EditProductDialog, {
      width: '500px',
      data: {
        type: type,
        brand: brand,
        product: product
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
    })
  }
}
