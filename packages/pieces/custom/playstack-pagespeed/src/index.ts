import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

const baseUrl = 'https://www.googleapis.com/pagespeedonline/v5';

export const pagespeedAuth = PieceAuth.SecretText({
  displayName: 'Google API key',
  description:
    'An API key with the PageSpeed Insights API enabled, from https://console.cloud.google.com/apis/credentials. Restrict it to that API.',
  required: true,
  validate: async ({ auth }) => {
    const result = await httpClient
      .sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/runPagespeed`,
        headers: { 'X-Goog-Api-Key': auth },
        queryParams: {
          url: 'https://example.com',
          category: 'performance',
          fields: 'id',
        },
        timeout: 90000,
      })
      .then(() => ({ valid: true as const }))
      .catch(() => ({
        valid: false as const,
        error: 'Google rejected that key for PageSpeed Insights.',
      }));
    return result;
  },
});

export const playstackPagespeed = createPiece({
  displayName: 'Google PageSpeed',
  description: 'Google PageSpeed Insights. Playstack connection.',
  auth: pagespeedAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://flows.playstack.com.au/brand/logo.svg',
  authors: ['playstack'],
  actions: [
    createCustomApiCallAction({
      auth: pagespeedAuth,
      baseUrl: () => baseUrl,
      authMapping: async (auth) => ({ 'X-Goog-Api-Key': auth.secret_text }),
    }),
  ],
  triggers: [],
});
