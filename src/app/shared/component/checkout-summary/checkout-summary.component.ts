import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'checkout-summary',
  templateUrl: './checkout-summary.component.html',
  styleUrls: ['./checkout-summary.component.scss']
})
export class CheckoutSummaryComponent implements OnInit {
  @Input() checkoutSummary: any
  @Input() order: any
  
  showMore = false

  constructor() { }

  ngOnInit(): void {
  }

}
