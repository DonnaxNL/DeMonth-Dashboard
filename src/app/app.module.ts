import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, LOCALE_ID } from '@angular/core';
import localeNL from '@angular/common/locales/nl';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChartsModule } from 'ng2-charts';
import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderDetailsComponent, DeleteOrderDialog } from './pages/order-details/order-details.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { CustomerDetailsComponent } from './pages/customer-details/customer-details.component';
import { CouponsComponent, AddCouponDialog } from './pages/coupons/coupons.component';
import { DeliveriesComponent } from './pages/deliveries/deliveries.component';
import { MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS, ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { ChangeBoxDialog } from './pages/order-details/change-box/change-box.component';
import { PauseCancelSubscriptionDialog } from './pages/order-details/pause-order/pause-order.component';
import { DeliveryDaysDialog } from './pages/order-details/change-days/change-days.component';
import { ReportsComponent } from './pages/administration/reports/reports.component';
import { OrderHistoryDialog } from './pages/order-details/history/change-history.component';
import { AuthComponent } from './shared/component/auth/auth.component';
import { MatPasswordStrengthModule } from '@angular-material-extensions/password-strength';
import { DeliveryDetailsComponent } from './pages/delivery-details/delivery-details.component';
import { Products } from './constants/products';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { AddInventoryDialog } from './pages/inventory/add-dialog/add-inventory.component';
import { PaymentLinkDialog } from './pages/order-details/payment-link/payment-link.component';
import { CareRotationComponent } from './pages/care-rotation/care-rotation.component';
import { ProductsComponent } from './pages/products/products.component';
import { EditProductDialog } from './pages/products/edit-product/edit-product.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgxSkeletonSmartModule } from 'ngx-smart-skeleton';
import { AddEditRotationDialog } from './pages/care-rotation/add-edit-rotation/add-edit-rotation.component';
import { MaterialModule } from './shared/modules/material.module';
import { FirebaseModule } from './shared/modules/firebase.module';
import { SharedModule } from './shared/shared.module';
import { AddDeliveryDialog } from './pages/order-details/add-delivery/add-delivery.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { AdministrationComponent } from './pages/administration/administration.component';
import { StatisticsComponent } from './pages/administration/statistics/statistics.component';

registerLocaleData(localeNL);

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DeliveriesComponent,
    LoginComponent,
    OrdersComponent,
    OrderDetailsComponent,
    OrderHistoryDialog,
    AddDeliveryDialog,
    DeleteOrderDialog,
    CustomersComponent,
    CustomerDetailsComponent,
    CouponsComponent,
    ReportsComponent,
    AddCouponDialog,
    ChangeBoxDialog, 
    PaymentLinkDialog,
    DeliveryDaysDialog,
    PauseCancelSubscriptionDialog,
    DeleteOrderDialog, 
    AuthComponent,
    DeliveryDetailsComponent,
    InventoryComponent,
    AddInventoryDialog,
    CareRotationComponent,
    AddEditRotationDialog,
    ProductsComponent,
    EditProductDialog,
    LogoutComponent,
    AdministrationComponent,
    StatisticsComponent
  ],
  imports: [
    SharedModule,
    AppRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule.withConfig({ warnOnNgModelWithFormControl: 'never' }),
    MaterialModule,
    FlexLayoutModule,
    FirebaseModule,
    BrowserModule,
    BrowserAnimationsModule,
    MatPasswordStrengthModule,
    ChartsModule,
    NgxSkeletonSmartModule,
    NgxSkeletonLoaderModule.forRoot(),
  ],
  providers: [
    AppComponent,
    Products,
    DatePipe, 
    { provide: LOCALE_ID, useValue: 'en-GB' },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS},
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher}],
  entryComponents: [
    DeliveryDaysDialog,
    ChangeBoxDialog, 
    PauseCancelSubscriptionDialog,
    DeleteOrderDialog, 
    PaymentLinkDialog,
    AddCouponDialog,
    OrderHistoryDialog,
    AddInventoryDialog,
    EditProductDialog,
    AddEditRotationDialog],
  bootstrap: [AppComponent]
})
export class AppModule { }
