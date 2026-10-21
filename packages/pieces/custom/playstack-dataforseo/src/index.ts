import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

const baseUrl = 'https://api.dataforseo.com/v3';

export const dataforseoAuth = PieceAuth.BasicAuth({
  displayName: 'DataForSEO',
  description:
    'Your DataForSEO API login and API password, from https://app.dataforseo.com/api-access (not your account sign-in password).',
  required: true,
  username: Property.ShortText({
    displayName: 'API login',
    required: true,
  }),
  password: PieceAuth.SecretText({
    displayName: 'API password',
    required: true,
  }),
  validate: async ({ auth }) => {
    const result = await httpClient
      .sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/appendix/user_data`,
        headers: { Authorization: basicHeader(auth) },
      })
      .then(() => ({ valid: true as const }))
      .catch(() => ({
        valid: false as const,
        error: 'DataForSEO rejected that API login and password.',
      }));
    return result;
  },
});

export const playstackDataforseo = createPiece({
  displayName: 'DataForSEO',
  description: 'SERP, AI answer and SEO data. Playstack connection.',
  auth: dataforseoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://flows.playstack.com.au/brand/logo.svg',
  authors: ['playstack'],
  actions: [
    createCustomApiCallAction({
      auth: dataforseoAuth,
      baseUrl: () => baseUrl,
      authMapping: async (auth) => ({ Authorization: basicHeader(auth) }),
    }),
  ],
  triggers: [],
});

function basicHeader(auth: { username: string; password: string }): string {
  return `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString(
    'base64'
  )}`;
}
