import { generateClient } from 'aws-amplify/data';
import { createPlannerRepository } from './cloudPlannerCore.js';

let repository;
export function getPlannerRepository() {
  if (!repository) {
    const client = generateClient({ authMode: 'userPool' });
    repository = createPlannerRepository(client.models);
  }
  return repository;
}
