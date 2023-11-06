import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { User } from 'firebase';
import { FirestoreService } from 'src/app/services/firebase/firebase-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppComponent } from 'src/app/app.component';
import { AuthProcessService } from 'src/app/services/auth-service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  loggedIn = false
  navbarOpen = false
  user$: Observable<User | null>
  order$: Observable<any | null>
  customer$: Observable<any | null>
  order
  searchInput
  userRole
  @Input() set role(value) {
    if (value) {
      this.userRole = value
    }
    this.setUserRoleView()
  }

  constructor(
    private router: Router,
    private app: AppComponent,
    private fbService: FirestoreService,
    private snackBar: MatSnackBar, 
    public authService: AuthProcessService) { }

  ngOnInit() {
    // this.user$ = this.auth.user;
    // this.user$.subscribe(async (user: User) => {
    //   if (user == null) {
    //     this.loggedIn = false
    //     this.router.navigate(['/login'])
    //   } else {
    //     this.setUserRoleView()
    //   }
    // });
  }

  setUserRoleView() {
    if (this.userRole[1]) {
      this.loggedIn = true
    } else {
      this.loggedIn = false
      //this.router.navigate(['/login'])
    }
  }

  toggleNavbar() {
    this.navbarOpen = !this.navbarOpen;
  }

  searchOrder() {
    console.log(this.searchInput)
    if (this.searchInput == '') {
      this.snackBar.open("No ID or reference entered!", "Close", {
        duration: 5000,
      });
    } else if (this.searchInput.length > 9) {
      this.order$ = this.fbService.getOrderByID(this.searchInput).valueChanges();
      this.order$.subscribe((data: any) => {
        this.order = data
        console.log(data)
        if (this.order) {
          this.router.navigate(['/orders/' + this.order.orderId], { state: { order: this.order } })
          .then(page => { window.location.reload() })
          .catch(e => {
            console.log(e)
          });
        } 
        // else {
        //   this.customer$ = this.fbService.getCustomerByID(this.searchInput).valueChanges();
        //   this.customer$.subscribe((data: any) => {
        //     console.log(data)
        //     if (data) {
        //       this.router.navigate(['/customers/' + data.uid], { state: { customer: data } });
        //     } else {
        //       this.snackBar.open("No order or customer found!");
        //     }
        //   })
        // }
      })
    } else if (this.searchInput.length > 7 && this.searchInput.length < 10) {
      this.order$ = this.fbService.getOrderByRef(this.searchInput).valueChanges();
      this.order$.subscribe((data: any) => {
        this.order = data[0]
        console.log(this.order.orderId)
        this.router.navigate(['/orders/' + this.order.orderId], { state: { order: this.order } }).then(page => { window.location.reload() });
      })
    } else {
      this.snackBar.open("Search value not valid!", "Close", {
        duration: 5000,
      });
    }
    this.searchInput = ''
  }

  signOut() {
    this.app.signOut()
  }
}
