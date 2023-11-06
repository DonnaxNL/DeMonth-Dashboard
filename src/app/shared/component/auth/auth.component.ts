import { Component, OnInit, AfterViewInit, OnChanges, OnDestroy, Input, Output } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { FormGroup, AbstractControl, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AppComponent } from 'src/app/app.component';
import { AuthProcessService, AuthProvider } from 'src/app/services/auth-service';

export const EMAIL_REGEX = new RegExp(['^(([^<>()[\\]\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\.,;:\\s@\"]+)*)',
    '|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.',
    '[0-9]{1,3}\])|(([a-zA-Z\\-0-9]+\\.)+',
    '[a-zA-Z]{2,}))$'].join(''));

export const PHONE_NUMBER_REGEX = new RegExp(['^[+]{0,1}[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s\\.]{0,1}[(]{0,1}[0-9]{1,4}[)]{0,1}[-\\s\\./0-9]{4,12}$'].join(''));

@Component({
    selector: 'auth-component',
    templateUrl: 'auth.component.html',
    styleUrls: ['auth.component.scss']
})
export class AuthComponent implements OnInit, AfterViewInit, OnDestroy {
    // Events
    @Output() onSuccess: any;
    @Output() onError: any;

    isLoading = false

    authProvider = AuthProvider

    public signInFormGroup: FormGroup;
    public signUpFormGroup: FormGroup;
    public resetPasswordFormGroup: FormGroup;

    signInEmailFormControl: AbstractControl;
    signInPasswordFormControl: AbstractControl;

    signUpFirstNameFormControl: AbstractControl;
    signUpLastNameFormControl: AbstractControl;
    signUpEmailFormControl: AbstractControl;
    signUpPasswordFormControl: AbstractControl;
    signUpPasswordConfirmationFormControl: AbstractControl;
    resetPasswordEmailFormControl: AbstractControl;

    passwordMaxLength = 60
    passwordMinLength = 8
    nameMaxLength = 50
    nameMinLength = 6

    constructor(
        private router: Router,
        private app: AppComponent,
        private auth: AngularFireAuth,
        private authProcess: AuthProcessService,
        private snackBar: MatSnackBar
    ) {
        this.onSuccess = authProcess.onSuccessEmitter;
        this.onError = authProcess.onErrorEmitter;
    }

    public ngOnInit(): void {
        // auth form's initialization
        this._initSignInFormGroupBuilder();
    }

    ngAfterViewInit(): void {

    }

    ngOnDestroy(): void {

    }

    private _initSignInFormGroupBuilder() {
        this.signInFormGroup = new FormGroup({});
        this.signInFormGroup.registerControl('email', this.signInEmailFormControl = new FormControl('',
            [
                Validators.required,
                Validators.pattern(EMAIL_REGEX)
            ]));
        this.signInFormGroup.registerControl('password', this.signInPasswordFormControl = new FormControl('',
            [
                Validators.required,
                Validators.minLength(this.passwordMinLength),
                Validators.maxLength(this.passwordMaxLength)
            ]));
    }

    googleSignIn() {
       this.authProcess.signInWith(this.authProvider.Google) 
    }

    async signIn() {
        if (!this.signInFormGroup.valid) {
          return;
        }
        try {
          this.isLoading = true;
          await this.authProcess.signInWith(this.authProvider.EmailAndPassword, {
            email: this.signInFormGroup.value.email,
            password: this.signInFormGroup.value.password
          });
        } finally {
          this.isLoading = false;
        }
    }
}