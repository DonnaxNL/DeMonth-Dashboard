import { Component, Input, OnInit } from "@angular/core";
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { TranslateService, LangChangeEvent } from "@ngx-translate/core";
import { UserAddress } from "src/app/models/address";
import { UserData } from "src/app/models/userdata";
import { MyErrorStateMatcher } from "src/app/shared/errormatcher";
import { Helper } from "src/app/shared/helper";

@Component({
    selector: 'form-component',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
    @Input() currentUserData: UserData;
    @Input() userAddress: UserAddress;
    @Input() appearance: string;
    @Input() component: string;
    @Input() formType: string;

    editMode = false;
    editModeAddAddress = false;
    changeSubscriptionAddress = false;
    hidePassword = true;
    countries = [['nl', 'Nederland'], ['be', 'België'], ['de', 'Duitsland'], ['fr', 'Frankrijk'], ['uk', 'Verenigd Koninkrijk']];
    minDate = new Date(1950);
    maxDate = new Date();

    // Form Control - new user
    formGroup: FormGroup;
    mobileNoFormControl: AbstractControl;
    matcher = new MyErrorStateMatcher();

    constructor(
        private _formBuilder: FormBuilder,
        private helper: Helper,
        public translate: TranslateService
    ) { }

    ngOnInit(): void {
        this.formValidation()
    }

    formValidation() {
        if (this.formType == 'standard') {
            this.mobileNoFormControl = new FormControl('', [Validators.pattern("^[0-9]*$")]);
            this.formGroup = this._formBuilder.group({
                firstName: new FormControl('', [Validators.required]),
                lastNamePrefix: null,
                lastName: new FormControl('', [Validators.required]),
                street: new FormControl('', [Validators.required]),
                houseNo: new FormControl('', [Validators.required]),
                streetOther: null,
                city: new FormControl('', [Validators.required]),
                postalCode: new FormControl('', [Validators.required, Validators.minLength(4)]),
                country: new FormControl('', [Validators.required]),
                mobileNo: this.mobileNoFormControl,
                birthDate: null
            });
        } else if (this.formType == 'additional') {
            this.formGroup = this._formBuilder.group({
                firstName: new FormControl('', [Validators.required]),
                lastNamePrefix: null,
                lastName: new FormControl('', [Validators.required]),
                street: new FormControl('', [Validators.required]),
                houseNo: new FormControl('', [Validators.required]),
                streetOther: null,
                city: new FormControl('', [Validators.required]),
                postalCode: new FormControl('', [Validators.required, Validators.minLength(4)]),
                country: new FormControl('', [Validators.required])
            });
        }
    }

    isFormGroupValid() {
        return null
        // console.log(this.formGroup)
        // if (this.formGroup && this.formGroup.valid) {
        //     return this.helper.userAddressToMap(this.userAddress, this.formType == 'additional');
        // } else if (this.formGroup) {
        //     this.helper.validateAllFormFields(this.formGroup);
        //     return null
        // } else {
        //     console.log('formGroup null')
        //     return null
        // }
    }

    onChangeInput() {
        
    }
}