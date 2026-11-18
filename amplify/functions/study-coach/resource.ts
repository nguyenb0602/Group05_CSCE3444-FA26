import { defineFunction, secret } from '@aws-amplify/backend';

// Keep the API key entirely on the server. Set GEMINI_API_KEY as an Amplify secret.
export const studyCoach = defineFunction({
  name: 'study-coach',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    GEMINI_API_KEY: secret('GEMINI_API_KEY'),
    GEMINI_MODEL: 'gemini-3.5-flash-lite',
  },
});
