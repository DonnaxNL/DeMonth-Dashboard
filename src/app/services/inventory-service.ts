import { Injectable } from '@angular/core';
import { Products } from '../constants/products';
import { FirebaseInventoryService } from './firebase/inventory-service';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    productNoticeList = [];

    constructor(
        public inventoryService: FirebaseInventoryService,
        public products: Products,
    ) { }

    async getRemaining() {
        this.productNoticeList = []
        var limitAmount = 50
        var remaining = await this.inventoryService.getInventoryItems('remaining')
        this.products.menstrualProductOptions.forEach(product => {
            var productItem = product.item
            var amount = remaining[productItem.type.id][productItem.brand.id][productItem.id]
            if (amount < limitAmount) {
                this.productNoticeList.push({
                    id: productItem.id,
                    type: productItem.type.name,
                    name: productItem.name,
                    amount: amount
                })
            }
        });
        this.products.otherOptions.forEach(product => {
            var productItem = product.item
            var amount = remaining[productItem.id]
            if (amount < limitAmount) {
                this.productNoticeList.push({
                    id: productItem.id,
                    name: productItem.name,
                    amount: amount
                })
            }
        });
        this.products.shampooBarOptions.forEach(product => {
            var productItem = product.item
            var amount = remaining['shampoobar'][productItem.brand.id][productItem.id]
            if (amount < limitAmount) {
                this.productNoticeList.push({
                    id: productItem.id,
                    type: 'ShampooBar',
                    name: productItem.name,
                    amount: amount
                })
            }
        });
        this.products.teaOptions.forEach(product => {
            var productItem = product.item
            var amount = remaining['tea'][productItem.brand.id][productItem.id]
            if (amount < limitAmount) {
                this.productNoticeList.push({
                    id: productItem.id,
                    type: 'Tea',
                    name: productItem.name,
                    amount: amount
                })
            }
        });
        this.products.faceMaskOptions.forEach(product => {
            var productItem = product.item
            var amount = remaining['facemask'][productItem.brand.id][productItem.id]
            if (amount < limitAmount) {
                this.productNoticeList.push({
                    id: productItem.id,
                    type: 'Face Mask',
                    name: productItem.name,
                    amount: amount
                })
            }
        });
        console.log(this.productNoticeList, remaining)
        this.productNoticeList.sort((a, b) => (a.amount > b.amount) ? 1 : ((b.amount > a.amount) ? -1 : 0));
        return this.productNoticeList
    }
}