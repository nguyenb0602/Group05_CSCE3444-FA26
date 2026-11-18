import { generateClient } from 'aws-amplify/data';

// Only used after Amplify.configure() in main.jsx.
export async function askStudyCoach(message, context) {
  const client = generateClient({authMode: 'userPool'});
  if (!client.queries?.askStudyCoach) {
    throw new Error('The AI backend has not been deployed yet. Your local study recommendations still work.');
  }
  const response = await client.queries.askStudyCoach({ message, context });
  if (response.errors?.length) throw new Error(response.errors.map(e=>e.message).join('; '));
  if (typeof response.data !== 'string') throw new Error('AI returned an empty response.');
  return response.data;
}
