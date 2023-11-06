import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderDetailsComponent } from './pages/order-details/order-details.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { CustomerDetailsComponent } from './pages/customer-details/customer-details.component';
import { CouponsComponent } from './pages/coupons/coupons.component';
import { DeliveriesComponent } from './pages/deliveries/deliveries.component';
import { ReportsComponent } from './pages/administration/reports/reports.component';
import { DeliveryDetailsComponent } from './pages/delivery-details/delivery-details.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { CareRotationComponent } from './pages/care-rotation/care-rotation.component';
import { ProductsComponent } from './pages/products/products.component';
import { LoggedInGuard } from './shared/component/auth/authguard';
import { LogoutComponent } from './pages/logout/logout.component';
import { AdministrationComponent } from './pages/administration/administration.component';

const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [LoggedInGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'coupons', component: CouponsComponent, canActivate: [LoggedInGuard] },
  { path: 'deliveries', component: DeliveriesComponent, canActivate: [LoggedInGuard] },
  { path: 'orders/:subscriptionId/deliveries/:deliveryId', component: DeliveryDetailsComponent, canActivate: [LoggedInGuard] },
  { path: 'orders', component: OrdersComponent, canActivate: [LoggedInGuard] },
  { path: 'orders/:id', component: OrderDetailsComponent, canActivate: [LoggedInGuard] },
  { path: 'customers', component: CustomersComponent, canActivate: [LoggedInGuard] },
  { path: 'customers/:id', component: CustomerDetailsComponent, canActivate: [LoggedInGuard] },
  { path: 'administration', component: AdministrationComponent, canActivate: [LoggedInGuard] },
  { path: 'insights', component: ReportsComponent, canActivate: [LoggedInGuard] },
  { path: 'inventory', component: InventoryComponent, canActivate: [LoggedInGuard] },
  { path: 'products', component: ProductsComponent, canActivate: [LoggedInGuard] },
  { path: 'care-rotation', component: CareRotationComponent, canActivate: [LoggedInGuard] },
  { path: 'test', component: HomeComponent, canActivate: [LoggedInGuard], data: {mode: 'test'}},
  { path: 'test/deliveries', component: DeliveriesComponent, canActivate: [LoggedInGuard], data: {mode: 'test'} },
  { path: 'test/orders/:subscriptionId/deliveries/:deliveryId', component: DeliveryDetailsComponent, canActivate: [LoggedInGuard], data: {mode: 'test'}},
  { path: 'test/orders', component: OrdersComponent, canActivate: [LoggedInGuard], data: {mode: 'test'}},
  { path: 'test/orders/:id', component: OrderDetailsComponent, canActivate: [LoggedInGuard], data: {mode: 'test'}},
  { path: 'test/insights', component: ReportsComponent, canActivate: [LoggedInGuard] },
  { path: 'test/administration', component: AdministrationComponent, canActivate: [LoggedInGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
