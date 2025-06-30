export enum ServiceType {
  AUTH_MO = 'authMO', // Mobile auth using OTP
  AUTH_EO = 'authEO', // Email auth using OTP
  VERIFY_MO = 'verifyMO', // Mobile verification using OTP
  VERIFY_EO = 'verifyEO', // Email verification using OTP
  VERIFY_EL = 'verifyEL', // Email verification using link
}
