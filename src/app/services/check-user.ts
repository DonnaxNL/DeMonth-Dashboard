import { Injectable } from '@angular/core';
import { User } from 'firebase';
import { take } from 'rxjs/operators';
import { UserData } from '../models/userdata';
import { UserService } from './firebase/user-service';

export class roles {
    // [read, write, add, delete]
    static ADMIN = [true, true, true, true]
    static EMPLOYEE = [true, true, true, true]
    static ANALYST = [true, false, false, false]
}

@Injectable({
    providedIn: 'root'
})
export class CheckUser {
    role = null

    constructor(private userService: UserService) { }

    getRole(uid: string) {
        this.userService.getUserInfoRefByUID(uid).valueChanges().pipe(take(1)).subscribe((data: UserData) => {
            console.log(data)
            switch (data.role) {
                case 'admin':
                    this.role = roles.ADMIN;
                case 'employee':
                    this.role = roles.EMPLOYEE;
                case 'analyst':
                    this.role = roles.ANALYST;
                default:
                    this.role = null  
            }
        });
        setTimeout(() => {
            return this.role
        }, 500);
    }

    getRoleClass() {
        return this.role;
    }
}