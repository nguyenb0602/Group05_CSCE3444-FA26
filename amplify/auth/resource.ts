import { defineAuth } from '@aws-amplify/backend';

// Verified email + password sign-in through Amazon Cognito.
export const auth = defineAuth({
  loginWith: { email: true },
  userAttributes: {
    fullname: { mutable: true, required: false },
  },
});
