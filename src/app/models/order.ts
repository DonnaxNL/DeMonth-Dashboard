export class Order {
    constructor(
        public boxId: string,
        public boxName: string,
        public boxBasePrice: number,
        public products: any,
        public productQuantity: number,
        public deliveryDate: Date,
        public deliveryDaysApart: any,
        public paymentPlan: any,
        public isSubscription: boolean,
        public checkoutPrice: number,
        public subTotal: number,
        public fsOrderId?: string,
        public fsOrderRef?: string,
        public checkoutSummary?: any
    ) { }
}