import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { listDeliveryEvents } from './lib/actions/list-delivery-events';
import { fridgeitAuth } from './lib/auth';
import { fridgeitClient } from './lib/client';

export const playstackFridgeit = createPiece({
  displayName: 'FridgeIt',
  description: 'FridgeIt delivery notifications dashboard, built by Playstack.',
  auth: fridgeitAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://flows.playstack.com.au/brand/logo.svg',
  authors: ['playstack'],
  actions: [
    listDeliveryEvents,
    createCustomApiCallAction({
      auth: fridgeitAuth,
      baseUrl: (auth) =>
        auth ? `${fridgeitClient.trimBaseUrl(auth.props.baseUrl)}/api/v1` : '',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${await fridgeitClient.login({
          auth: auth.props,
        })}`,
      }),
    }),
  ],
  triggers: [],
});
