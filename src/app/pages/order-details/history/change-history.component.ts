import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
    history
}

@Component({
    selector: 'history-dialog',
    templateUrl: 'change-history-dialog.html',
})
export class OrderHistoryDialog {
    constructor(
        public dialogRef: MatDialogRef<OrderHistoryDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: DialogData,) { 
            console.log(dialogData)
        }

    onNoClick(): void {
        this.dialogRef.close();
    }
}