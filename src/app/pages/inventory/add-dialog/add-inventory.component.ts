import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FirebaseInventoryService } from "src/app/services/firebase/inventory-service";

export interface AddInventoryDialogData {
    inventoryMenstrual: any
    inventoryCare: any
    inventorySnacks: any
    inventoryAmounts: any
}

@Component({
    selector: 'add-inventory-dialog',
    templateUrl: 'add-inventory-dialog.html',
    styleUrls: ['./add-inventory-dialog.scss']
})
export class AddInventoryDialog implements OnInit {
    savingState = false
    loadingDone = false
    
    inventoryAmounts: any = {}

    displayedMenstrualProductsColumns: string[] = ['type', 'product', 'inventory']

    constructor(
        public dialogRef: MatDialogRef<AddInventoryDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: AddInventoryDialogData,
        public inventoryService: FirebaseInventoryService) { }

    ngOnInit(): void {
        console.log(this.dialogData)
        this.inventoryAmounts = this.dialogData.inventoryAmounts
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    prepareToSave() {
        this.inventoryAmounts.updatedOn = new Date()
        this.savingState = true
        this.saveChanges(this.inventoryAmounts)
    }

    async saveChanges(data) {
        // Save
        await this.inventoryService.updateInventory('amounts', data)
        this.loadingDone = true
    }
}