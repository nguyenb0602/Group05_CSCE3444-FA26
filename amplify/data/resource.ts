import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { studyCoach } from '../functions/study-coach/resource';

const schema = a.schema({
  Course: a.model({
    id: a.id().required(),
    name: a.string().required(),
    department: a.string().required(),
    code: a.string().required(),
    section: a.string().required(),
    professor: a.string().required(),
    color: a.string().required(),
    colorSource: a.string().required(),
    confidence: a.integer(),
    
    owner: a.string().authorization(
      allow => [allow.owner().to(['read', 'delete'])]),
  }).authorization(allow => [allow.owner()]),

  Event: a.model({
    id: a.id().required(),
    title: a.string().required(),
    type: a.string().required(),
    date: a.date().required(),
    // HH:mm, matching the existing <input type="time"> fields.
    time: a.string().required(),
    // Keep this optional for general events. The frontend verifies that a
    // chosen course is accessible to the current user before creating an event.
    courseId: a.id(),
    owner: a.string().authorization(
      allow => [allow.owner().to(['read', 'delete'])]),
  }).authorization(allow => [allow.owner()]),
  askStudyCoach: a.query()
    .arguments({ message: a.string().required(), context: a.string().required() })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(studyCoach)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});
