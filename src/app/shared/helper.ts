import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Products } from '../constants/products';

@Injectable({
    providedIn: 'root'
})
export class Helper {

    constructor(
        public datepipe: DatePipe,
        public products: Products) { }

    validateAllFormFields(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            if (control instanceof FormControl) {
                control.markAsTouched({ onlySelf: true });
            } else if (control instanceof FormGroup) {
                this.validateAllFormFields(control);
            }
        });
    }

    toDeliveryItem(deliveryDate) {
        const deliveryDetails = {
            docId: this.datepipe.transform(deliveryDate, 'yyyy-MM-dd'),
            deliveryDate: deliveryDate,
            paymentDetails: {
                isPaid: false
            },
            packing: {
                isPacked: false,
                packedBy: ''
            },
            delivery: {
                isDelivered: false,
                deliveryInitiatedBy: ''
            }
        }
        return deliveryDetails
    }

    getDeliveryProducts(deliveryNumber, order) {
        var skinType = ''
        if (order.products.preferences) {
            skinType = order.products.preferences.skinType
        } else {
            skinType = 'no_pref'
        }
        var deliveryPick = this.getItemById(this.products.careProductOptions, skinType, true)
        var deliveryIndex = (deliveryNumber - 1) % 12
        //console.log('deliveryPick', deliveryPick, deliveryIndex)
        var careProducts = {
            faceMask: this.getItemById(this.products.faceMaskOptions, deliveryPick[deliveryIndex][0]),
            shampooBar: this.getItemById(this.products.shampooBarOptions, deliveryPick[deliveryIndex][1]),
            tea: this.getItemById(this.products.teaOptions, deliveryPick[deliveryIndex][2]),
            other: null,
            snacks: null
        }
        //console.log(careProducts, skinType, deliveryIndex, order.orderReference)

        return careProducts
    }

    getDeliverySnacks(preferences, deliveryNumber, boxId) {
        console.log(preferences, deliveryNumber, boxId)
        var itemsToPick = 0
        var snacksToPickFrom = new Array()
        var deliverySnacks = new Array()
        var chocolateAmount = 0
        var healthbarAmount = 0
        var granolaAmount = 0
        if (preferences == null) {
            this.products.chocolateOptions.forEach(item => {
                var chocolate = item as any
                chocolate.type = 'chocolate'
                snacksToPickFrom.push(chocolate)
                chocolateAmount = chocolateAmount + 1
            });
            this.products.healthbarOptions.forEach(item => {
                var healthbar = item as any
                healthbar.type = 'healthbar'
                snacksToPickFrom.push(healthbar)
                healthbarAmount = healthbarAmount + 1
            });
            this.products.granolaOptions.forEach(item => {
                var granola = item as any
                granola.type = 'granola'
                snacksToPickFrom.push(granola)
                granolaAmount = granolaAmount + 1
            });
        } else {
            preferences.chocolate.forEach(item => {
                if (item == 'no_pref') {
                    this.products.chocolateOptions.forEach(item => {
                        var chocolate = item as any
                        chocolate.type = 'chocolate'
                        snacksToPickFrom.push(chocolate)
                        chocolateAmount = chocolateAmount + 1
                    });
                } else if (item != 'none') {
                    item.type = 'chocolate'
                    snacksToPickFrom.push(item)
                    chocolateAmount = chocolateAmount + 1
                } 
            });
            preferences.healthbar.forEach(item => {
                if (item == 'no_pref') {
                    this.products.healthbarOptions.forEach(item => {
                        var healthbar = item as any
                        healthbar.type = 'healthbar'
                        snacksToPickFrom.push(healthbar)
                        healthbarAmount = healthbarAmount + 1
                    });
                } else if (item != 'none') {
                    item.type = 'healthbar'
                    snacksToPickFrom.push(item)
                    healthbarAmount = healthbarAmount + 1
                }
            });
            preferences.granola.forEach(item => {
                if (item == 'no_pref') {
                    this.products.granolaOptions.forEach(item => {
                        var granola = item as any
                        granola.type = 'granola'
                        snacksToPickFrom.push(granola)
                        granolaAmount = granolaAmount + 1
                    });
                } else if (item != 'none') {
                    item.type = 'granola'
                    snacksToPickFrom.push(item)
                    granolaAmount = granolaAmount + 1
                }
            });
        }
        console.log(snacksToPickFrom)

        if (snacksToPickFrom.length != 0 && boxId == 'box_02') {
            itemsToPick = 1
        } else if (snacksToPickFrom.length != 0 && boxId == 'box_03') {
            itemsToPick = 2
        }
        for (let index = 0; index < itemsToPick; index++) {
            var deliveryIndex = ((deliveryNumber-1) + index)% snacksToPickFrom.length
            if (deliverySnacks[0] != undefined && deliverySnacks[0].type == snacksToPickFrom[deliveryIndex].type) {
                //console.log(index, deliverySnacks[0].type, snacksToPickFrom[deliveryIndex].type)
                var toAdd = 0
                if (chocolateAmount != 0 && healthbarAmount != 0 && granolaAmount != 0) {
                    if (snacksToPickFrom[deliveryIndex].type == 'chocolate') {
                        toAdd = chocolateAmount - 1
                    } else if (snacksToPickFrom[deliveryIndex].type == 'healthbar') {
                        toAdd = healthbarAmount - 1
                    } else if (snacksToPickFrom[deliveryIndex].type == 'granola') {
                        toAdd = granolaAmount - 1
                    }
                }
                var indexPick = (deliveryIndex + toAdd) % snacksToPickFrom.length
                //console.log(indexPick, snacksToPickFrom[indexPick])
                deliverySnacks.push(snacksToPickFrom[indexPick])
            } else {
                if (deliveryNumber > 1) {
                    var previousSnacks = this.getDeliverySnacks(preferences, deliveryNumber-1, boxId)
                    //console.log(previousSnacks)
                    if (previousSnacks[0].id == snacksToPickFrom[deliveryIndex].id) {
                        var newIndex = ((deliveryNumber+1) + index)% snacksToPickFrom.length
                        deliverySnacks.push(snacksToPickFrom[newIndex])
                    // deepcode ignore DuplicateIfBody/test: <please specify a reason of ignoring this>
                    } else if (previousSnacks.length == 2 && previousSnacks[1].id == snacksToPickFrom[deliveryIndex].id) {
                        var newIndex = ((deliveryNumber+1) + index)% snacksToPickFrom.length
                        deliverySnacks.push(snacksToPickFrom[newIndex])
                    } else {
                        deliverySnacks.push(snacksToPickFrom[deliveryIndex])
                    }
                } else {
                    deliverySnacks.push(snacksToPickFrom[deliveryIndex])
                }
            }
        }
        
        console.log(deliverySnacks, snacksToPickFrom)
        return deliverySnacks
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
    }
}