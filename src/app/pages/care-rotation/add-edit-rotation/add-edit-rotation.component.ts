import { Component, Inject } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseRotationService } from 'src/app/services/firebase/rotation-service';
import { FirebaseProductService } from 'src/app/services/firebase/product-service';

export interface AddEditRotationDialogData {
    selectedYear: number,
    selectedMonth: number,
    item: any
}

@Component({
    selector: 'add-edit-rotation-dialog',
    templateUrl: 'add-edit-rotation-dialog.html',
    styleUrls: ['./add-edit-rotation-dialog.scss']
})
export class AddEditRotationDialog {
    savingState = false
    loadingDone = false

    selectedProducts = {
        facemask: {
            normal: '',
            mixed: '',
            dry: '',
            oil: ''
        },
        shampoobar: {
            normal: '',
            mixed: '',
            dry: '',
            oil: ''
        },
        tea: {
            normal: ['',''],
            mixed: ['',''],
            dry: ['',''],
            oil: ['','']
        }
    }

    skinTypes = ['normal', 'mixed', 'dry', 'oil']
    products = ['facemask', 'shampoobar', 'tea']
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    allFaceMasks = [];
    allShampooBars = [];
    allTeas = [];

    constructor(
        public dialogRef: MatDialogRef<AddEditRotationDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: AddEditRotationDialogData,
        private snackBar: MatSnackBar,
        public datepipe: DatePipe,
        public fun: AngularFireFunctions,
        public rotationService: FirebaseRotationService,
        public productService: FirebaseProductService) {
        this.getProducts()
        this.setProducts()
    }

    setProducts() {
        const currentItems = this.dialogData.item
        for (let i = 0; i < this.products.length; i++) {
            if (this.products[i] != 'tea') {
                this.selectedProducts[this.products[i]] = {
                    normal: currentItems ? currentItems.products[this.products[i]].normal.id : '',
                    mixed: currentItems ? currentItems.products[this.products[i]].mixed.id : '',
                    dry: currentItems ? currentItems.products[this.products[i]].dry.id : '',
                    oil: currentItems ? currentItems.products[this.products[i]].oil.id : ''
                }
            } else {
                for (let index = 0; index < this.skinTypes.length; index++) {
                    if (currentItems && currentItems.products[this.products[i]][this.skinTypes[index]].length > 0) {
                        for (let j = 0; j < 2; j++) {
                            const item = currentItems.products[this.products[i]][this.skinTypes[index]][j]
                            this.selectedProducts[this.products[i]][this.skinTypes[index]][j] = item.id
                        }
                    }
                }
            }
        }
        console.log(this.selectedProducts)
    }

    onCloseClick(): void {
        this.dialogRef.close();
    }

    getProducts() {
        this.productService.getAllProductsFromType('facemask', 'dr-van-der-hoog').valueChanges().subscribe(item => {
            for (let i = 0; i < this.skinTypes.length; i++) {
                const array = {
                    brand: 'Dr. Van der Hoog',
                    products: []
                }
                item.forEach(product => {
                    product.skinTypes.forEach(type => {
                        if (type == this.skinTypes[i]) {
                            array.products.push(product)
                        }  
                    });
                });
                this.allFaceMasks.push(array)
            }
            console.log(this.allFaceMasks)
        });
        this.productService.getAllProductsFromType('shampoobar', 'shampoobar').valueChanges().subscribe(item => {
            // const array = {
            //     brand: 'ShampooBar',
            //     products: item
            // }
            // this.allShampooBars.push(array)
            // console.log(this.allShampooBars)
            this.allShampooBars = item
        });
        this.productService.getAllProductsFromType('tea', 'demonth').valueChanges().subscribe(item => {
            const array = {
                brand: 'DeMonth',
                products: item
            }
            this.allTeas.push(array)
            console.log(this.allTeas)
        });
    }

    changeProduct() {
        var isNew = true
        console.log(this.selectedProducts)

        if (this.checkIfAllSelected()) {
            var data
            if (this.dialogData.item) {
                isNew = false
                data = {
                    id: this.dialogData.item.id,
                    name: this.dialogData.item.name,
                    date: this.dialogData.item.date,
                    products: this.selectedProducts
                }
            } else {
                isNew = true
                var id = this.dialogData.selectedYear.toString()
                var monthNumber = this.dialogData.selectedMonth + 1
                id = id + '-' + monthNumber.toString().padStart(2, '0');
                const month = this.months[this.dialogData.selectedMonth] + ' ' + this.dialogData.selectedYear.toString()
                const date = new Date(this.dialogData.selectedYear, this.dialogData.selectedMonth)
                console.log(id, month, date)
                data = {
                    id: id,
                    name: month,
                    date: date,
                    products: this.selectedProducts
                }
            }

            console.log(data)
            this.savingState = true
            this.saveChanges(data, isNew)
        } else {
            this.snackBar.open("Fill in all fields for all skin types", "Close", {
                duration: 5000,
            });
        }
    }

    async saveChanges(data: any, isNew: boolean) {
        if (isNew) {
            await this.rotationService.createRotation(data.id, data)
        } else {
            await this.rotationService.updateRotation(data.id, data)
        }
        this.loadingDone = true
    }

    checkIfAllSelected() {
        var allSelected = true

        for (let i = 0; i < this.skinTypes.length; i++) {
            for (let j = 0; j < this.products.length; j++) {
                if (this.products[j] == 'tea') {
                    if (this.selectedProducts[this.products[j]][this.skinTypes[i]][0] == '') {
                        allSelected = false
                    }
                    if (this.selectedProducts[this.products[j]][this.skinTypes[i]][1] == '') {
                        allSelected = false
                    }
                } else 
                if (this.selectedProducts[this.products[j]][this.skinTypes[i]] == '') {
                    allSelected = false
                }
            }
        }

        return allSelected
    }
}