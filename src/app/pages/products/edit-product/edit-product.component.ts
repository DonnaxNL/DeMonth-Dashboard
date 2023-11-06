import { Component, Inject } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseProductService } from 'src/app/services/firebase/product-service';

export interface EditProductDialogData {
    type: string
    brand: string
    product: any
}

@Component({
    selector: 'edit-product-dialog',
    templateUrl: 'edit-product-dialog.html',
})
export class EditProductDialog {
    savingState = false
    loadingDone = false

    newProduct = {
        id: '',
        name: {
            nl: '',
            en: ''
        },
        description: {
            nl: '',
            en: ''
        },
        image: ''
    }

    constructor(
        public dialogRef: MatDialogRef<EditProductDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: EditProductDialogData,
        private snackBar: MatSnackBar,
        public datepipe: DatePipe,
        public fun: AngularFireFunctions,
        public productService: FirebaseProductService) {
        console.log(dialogData, this.newProduct)
        this.newProduct.id = this.dialogData.product.id
        this.newProduct.name = this.dialogData.product.name
        if (this.dialogData.product.description) {
            this.newProduct.description = this.dialogData.product.description
        }
        if (this.dialogData.product.image) {
            this.newProduct.image = this.dialogData.product.image
        }
    }

    onCloseClick(): void {
        this.dialogRef.close();
    }

    changeProduct() {
        const data = {
            type: this.dialogData.type,
            brand: this.dialogData.brand,
            productId: this.dialogData.product.id,
            data: this.newProduct
        }
        
        console.log(data)
        this.savingState = true
        this.saveChanges(data)
    }

    async saveChanges(data) {
        await this.productService.updateProduct(data.type, data.brand, data.productId, data.data)
        this.loadingDone = true
    }
}