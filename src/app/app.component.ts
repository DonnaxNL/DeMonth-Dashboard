import { Component, OnInit } from '@angular/core';
import { FirestoreService } from './services/firebase/firebase-service';
import { Observable, Subscription } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import { User } from 'firebase';
import { take } from 'rxjs/operators';
import { UserData } from './models/userdata';
import { UserService } from './services/firebase/user-service';
import { roles } from './constants/roles';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  subscriptions: Subscription[] = [];
  user$: Observable<User | null>
  loggedIn = false
  role = roles.CUSTOMER

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private auth: AngularFireAuth,
    private userService: UserService) { }

  ngOnInit() {
    this.getRole()
  }

  getRole() {
    this.user$ = this.auth.user;
    this.subscriptions.push(this.user$.subscribe(async (user: User) => {
      console.log('auth')
      if (user != null) {
        console.log('user not null')
        this.subscriptions.push(this.userService.getUserInfoRefByUID(user.uid).valueChanges().subscribe((data: UserData) => {
          this.role = this.getUserRoleFromUserData(data)
          console.log('userdata', this.role, this.router.url, this.loggedIn, data)
          if (this.role[1]) {
            this.loggedIn = true
            if (this.router.url == '/login') {
              this.router.navigate(['/'])
            }
          } else {
            this.loggedIn = false
            this.router.navigate(['/login'])
          }
        }));
      } else {
        this.loggedIn = false
        this.router.navigate(['/login'])
      }
    }));
  }

  getUserRole() {
    return this.role
  }

  resetUserRole() {
    return this.role = roles.CUSTOMER;
  }

  addToSubscriptions(item) {
    this.subscriptions.push(item)
  }

  getUserRoleFromUserData(data) {
    if (data != null && data.role == 'admin') {
      this.role = roles.ADMIN;
    } else if (data != null && data.role == 'employee') {
      this.role = roles.EMPLOYEE;
    } else if (data != null && data.role == 'analyst') {
      this.role = roles.ANALYST;
    } else {
      this.role = roles.CUSTOMER;
    }
    return this.role
  }

  async signOut() {
    // console.log('before', this.subscriptions)
    // await this.clearSubscriptions()
    // console.log('after', this.subscriptions)
    // this.loggedIn = false;
    // this.role = roles.CUSTOMER;
    // this.router.navigate(['/login']);
    try {
      await this.auth.signOut();
      this.loggedIn = false;
      this.role = roles.CUSTOMER;
      this.router.navigate(['/login']);
      this.snackBar.open("Successfully signed off.", "Close", {
        duration: 5000,
      });
      console.log(this.loggedIn, this.role)
      this.clearSubscriptions()
    } catch (e) {
      // An error happened.
      console.error('An error happened while signing out!', e);
      this.loggedIn = true;
    }
  }

  clearSubscriptions() {
    for (let index = 0; index < this.subscriptions.length; index++) {
      const element = this.subscriptions[index];
      console.log(element)
      element.unsubscribe()
    }
  }
}
