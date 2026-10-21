import { createAction, Property } from '@activepieces/pieces-framework';
import { fridgeitAuth } from '../auth';
import { DeliveryEvent, fridgeitClient } from '../client';

export const listDeliveryEvents = createAction({
  auth: fridgeitAuth,
  name: 'list_delivery_events',
  displayName: 'List delivery events',
  description:
    'Signs in to the FridgeIt dashboard and returns every delivery event for the given accounts and dates, all pages included, with duplicates removed.',
  props: {
    accountIds: Property.Array({
      displayName: 'Account IDs',
      description: 'CartonCloud account IDs, e.g. 1222 and 1223.',
      required: true,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'e.g. sms_sent. Leave empty for every status.',
      required: false,
    }),
    fromDate: Property.ShortText({
      displayName: 'From',
      description: 'ISO date or date-time.',
      required: false,
    }),
    toDate: Property.ShortText({
      displayName: 'To',
      description: 'ISO date or date-time.',
      required: false,
    }),
    maxPages: Property.Number({
      displayName: 'Max pages per account',
      required: false,
      defaultValue: 5,
    }),
    failsafe: Property.Checkbox({
      displayName: 'Return error as output',
      description:
        'On a failed sign-in or request, output an empty list and the error instead of failing the step.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { accountIds, status, fromDate, toDate, maxPages, failsafe } =
      context.propsValue;
    const ids = accountIds
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0);
    const result = await collectEvents({
      auth: context.auth.props,
      accountIds: ids,
      status: status ?? undefined,
      fromDate: fromDate ?? undefined,
      toDate: toDate ?? undefined,
      maxPages: maxPages ?? 5,
    }).catch((error: unknown) => {
      if (!failsafe) {
        throw error;
      }
      return {
        ok: false,
        items: [],
        eventsSeen: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    });
    return result;
  },
});

async function collectEvents({
  auth,
  accountIds,
  status,
  fromDate,
  toDate,
  maxPages,
}: CollectEventsParams): Promise<CollectEventsResult> {
  const token = await fridgeitClient.login({ auth });
  const perAccount = await Promise.all(
    accountIds.map((accountId) =>
      fridgeitClient.listDeliveryEvents({
        auth,
        token,
        accountId,
        status,
        fromDate,
        toDate,
        pageSize: 200,
        maxPages,
      })
    )
  );
  const items = dedupe(perAccount.flat());
  return { ok: true, items, eventsSeen: items.length, error: null };
}

function dedupe(events: DeliveryEvent[]): DeliveryEvent[] {
  const byKey = new Map(
    events.map((event) => [
      event.event_id ??
        `${event.sms_message_sid ?? ''}-${event.created_at ?? ''}`,
      event,
    ])
  );
  return Array.from(byKey.values());
}

type CollectEventsParams = {
  auth: { baseUrl: string; email: string; password: string };
  accountIds: string[];
  status: string | undefined;
  fromDate: string | undefined;
  toDate: string | undefined;
  maxPages: number;
};

type CollectEventsResult = {
  ok: boolean;
  items: DeliveryEvent[];
  eventsSeen: number;
  error: string | null;
};
