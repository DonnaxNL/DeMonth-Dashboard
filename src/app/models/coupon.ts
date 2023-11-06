export class Coupon {
    constructor(
        public id: string,
        public name: string,
        public discount: number,
        public type?: string,
        public limit?: number,
        public expireDate?: any,
        public used?: string,
        public usedBy?: Array<String>,
        public usedByUid?: string,
        public usedByUser?: any
    ) { }
}