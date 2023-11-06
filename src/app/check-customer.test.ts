import { Injectable } from '@angular/core';
import { User } from 'firebase';

@Injectable({
    providedIn: 'root'
})
export class CheckCustomer {
    constructor() { }

    isRealCustomer(user: User) {
        if (user == null) {
            return true
        } else {
            return this.isRealCustomerById(user.uid)
        }
    }

    isRealCustomerById(uid: string) {
        if (uid == 'FkTF6GCnq0am2miavM4uvQcq6T62') { // donavanlb@gmail.com - Google
            return false;
        } else if (uid == '3gn9uMqbrCNWEkVIyVADHR7ntAT2') { //info@demonth.nl - Google
            return false;
        } else if (uid == 'A5uCdEOGwbMGuKxw1krWFrxwT6k2') { //gideonboadu@gmail.com - Google
            return false;
        } else if (uid == '1HytcMcICPfWjUfDQkqB1Zp8ea22') { //maxmicheldegroot@gmail.com - Email
            return false;
        } else {
            return true;
        }
    }
}