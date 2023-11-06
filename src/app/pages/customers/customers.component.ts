import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreService } from 'src/app/services/firebase/firebase-service';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { format } from 'util';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AppComponent } from 'src/app/app.component';
import { AngularFireFunctions } from '@angular/fire/functions';
import { UserService } from 'src/app/services/firebase/user-service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {
  customers$: Observable<any | null>;
  customers = [];
  userRole = [false, false, false, false, false]
  dataSource
  checked = false
  displayedColumns: string[] = ['firstName', 'lastName', 'email']
  firstCall = false

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('activePaginator', { static: true }) paginator: MatPaginator;

  constructor(
    public app: AppComponent,
    public fbService: FirestoreService,
    private router: Router,
    public fun: AngularFireFunctions,
    public userService: UserService,
  ) { }

  ngOnInit() {
    this.fbService.getAllCustomers().valueChanges().subscribe((data: any) => {
      this.customers = [];;
      data.forEach(element => {
        if (element.firstName != null) {
          this.customers.push(element)
        }
      });
      this.customers.sort((a, b) => (a.firstName.toLowerCase() > b.firstName.toLowerCase()) ? 1 : ((b.firstName.toLowerCase() > a.firstName.toLowerCase()) ? -1 : 0));
      //console.log(this.customers)
      // if (this.firstCall == false) {
      //   this.firstCall = true
      this.prepareCustomerDetails()
      //}
      this.userRole = this.app.getUserRole()
      //console.log(this.userRole)
    })
  }

  showDetails(customer) {
    console.log(customer)
    this.router.navigate(['/customers/' + customer.customerId], { state: { customer: customer.fullCustomer } });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  prepareCustomerDetails() {
    let tableList = [];
    for (let i = 0; i < this.customers.length; i++) {
      let lastName = this.customers[i].lastNamePrefix ? this.customers[i].lastNamePrefix + " " : ''
      lastName = lastName + this.customers[i].lastName
      var customerItem = {
        customerId: this.customers[i].uid,
        firstName: this.customers[i].firstName,
        lastName: lastName,
        email: this.customers[i].email,
        'Straat': this.customers[i].address.street,
        'Huisnr. + Toev.': this.customers[i].address.houseNo,
        'Postcode': this.customers[i].address.postalCode,
        'Stad': this.customers[i].address.city,
        'Land': this.customers[i].address.country,
        fullCustomer: this.customers[i]
      }

      tableList.push(customerItem)
    }
    this.dataSource = new MatTableDataSource(tableList)
    this.dataSource.sort = this.sort
    this.dataSource.paginator = this.paginator
  }

  exportToExcel() {
    var wscols = [
      { hidden: true }, //Id
      { wch: 10 }, //First name
      { wch: 10 }, //Last name
      { wch: 20 }, //Email
      { wch: 20 }, //Street
      { wch: 10 }, //House no.
      { wch: 10 }, //Postal Code
      { wch: 15 }, //City
      { wch: 15 }, //Country
    ];

    var ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource.data);
    ws['!cols'] = wscols;
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All');
    const today = new Date();
    const date = today.getFullYear() + '' + format(today.getMonth() + 1).padStart(2, '0') + '' + format(today.getDate()).padStart(2, '0')
    XLSX.writeFile(wb, 'DeMonth_AllCustomers_' + date + '.xlsx');
  }

  getMollieCustomer(uid, data) {
    //console.log('getmollie', uid)
    const call = this.fun.httpsCallable('getMollieCustomerCall');
    call({ uid: uid }).subscribe((result) => {
      if (result != null) {
        console.log('getmollie', result)
        // var userCreated = new Date(result.createdAt)
        // //console.log(userCreated)
        // this.userService.update(uid, {
        //   mollieCustomerIdOld: data.mollieCustomerId,
        //   createdAt: userCreated
        // })
      } else {
        console.log(uid)
      }
    });
  }
}
