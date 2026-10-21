import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { fridgeitClient } from './client';

export const fridgeitAuth = PieceAuth.CustomAuth({
  displayName: 'FridgeIt dashboard',
  description:
    'Sign in with a FridgeIt dashboard account kept for Playstack Flows, not a personal login.',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Dashboard URL',
      required: true,
      defaultValue: 'https://fridgeit.umkgroup.com.au',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const result = await fridgeitClient
      .login({ auth })
      .then(() => ({ valid: true as const }))
      .catch(() => ({
        valid: false as const,
        error: 'FridgeIt rejected that email and password.',
      }));
    return result;
  },
});
