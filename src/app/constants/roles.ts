export class roles {
    // [create, read, update, delete, mollie]
    static ADMIN = [true, true, true, true, true]
    static EMPLOYEE = [true, true, true, true, true]
    static ANALYST = [false, true, false, false, false]
    static CUSTOMER = [false, false, false, false, false]
}