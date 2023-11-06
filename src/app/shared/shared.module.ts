import { NgModule } from '@angular/core';
import { MaterialModule } from './modules/material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from '../app-routing.module';
import { CommonModule } from '@angular/common';
import { FirebaseModule } from './modules/firebase.module';
import { AddressViewComponent } from './component/address-view/address-view.component';
import { NavbarComponent } from './component/navbar/navbar.component';
import { FormComponent } from './component/forms/address/form.component';
import { CountryPipe } from './pipes/country.pipe';
import { CustomCurrencyPipe } from './pipes/currency-space.pipe';
import { CheckoutSummaryComponent } from './component/checkout-summary/checkout-summary.component';

@NgModule({
  imports: [
    AppRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule.withConfig({ warnOnNgModelWithFormControl: 'never' }),
    MaterialModule,
    FlexLayoutModule,
    FirebaseModule,
  ],
  exports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    FlexLayoutModule,
    FirebaseModule,
    AddressViewComponent,
    CheckoutSummaryComponent,
    NavbarComponent,
    CountryPipe,
    CustomCurrencyPipe
  ],
  declarations: [
    AddressViewComponent,
    CheckoutSummaryComponent,
    FormComponent,
    NavbarComponent,
    CountryPipe,
    CustomCurrencyPipe
  ],
  providers: [
    FormComponent
  ]
})

export class SharedModule {
}