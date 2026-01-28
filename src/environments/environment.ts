// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  api: '/api/', // Using relative path for development - will be configured for deployment
  stripePublicKey: 'pk_test_51SuRgi2KcqO1GUZP8kxeFzorQlkClPbvh1c8AJpJn9Uer3IAGCr88ZjX7ukVTL1KMIBGyn7XGsuBreuacb1FdjuF00PDencxcz' // Replace with your actual Stripe publishable key
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a different impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.