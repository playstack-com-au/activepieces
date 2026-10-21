import { httpClient, HttpMethod } from '@activepieces/pieces-common';

async function login({ auth }: { auth: FridgeitCredentials }): Promise<string> {
  const response = await fetch(
    `${trimBaseUrl(auth.baseUrl)}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: auth.email, password: auth.password }),
      signal: AbortSignal.timeout(20000),
    }
  ).catch(() => {
    throw new Error('FridgeIt login failed (dashboard unreachable)');
  });
  if (!response.ok) {
    throw new Error(`FridgeIt login failed (HTTP ${response.status})`);
  }
  const payload: unknown = await response.json().catch(() => null);
  const token = readToken(payload);
  if (!token) {
    throw new Error('FridgeIt login returned no access token');
  }
  return token;
}

async function listDeliveryEvents({
  auth,
  token,
  accountId,
  status,
  fromDate,
  toDate,
  pageSize,
  maxPages,
}: ListDeliveryEventsParams): Promise<DeliveryEvent[]> {
  const pages = await fetchPages({
    auth,
    token,
    accountId,
    status,
    fromDate,
    toDate,
    pageSize,
    remaining: maxPages,
    cursor: undefined,
    seenCursors: [],
  });
  return pages;
}

async function fetchPages({
  auth,
  token,
  accountId,
  status,
  fromDate,
  toDate,
  pageSize,
  remaining,
  cursor,
  seenCursors,
}: FetchPagesParams): Promise<DeliveryEvent[]> {
  if (remaining <= 0) {
    return [];
  }
  const response = await httpClient.sendRequest<DeliveryEventsPage>({
    method: HttpMethod.GET,
    url: `${trimBaseUrl(auth.baseUrl)}/api/v1/delivery-events`,
    headers: { Authorization: `Bearer ${token}` },
    queryParams: buildQuery({
      account_id: accountId,
      status,
      from_date: fromDate,
      to_date: toDate,
      limit: String(pageSize),
      cursor,
    }),
    timeout: 20000,
  });
  const items = Array.isArray(response.body.items) ? response.body.items : [];
  const next = response.body.next_cursor;
  if (!next || seenCursors.includes(next) || items.length === 0) {
    return items;
  }
  const rest = await fetchPages({
    auth,
    token,
    accountId,
    status,
    fromDate,
    toDate,
    pageSize,
    remaining: remaining - 1,
    cursor: next,
    seenCursors: [...seenCursors, next],
  });
  return [...items, ...rest];
}

function buildQuery(
  values: Record<string, string | undefined>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === 'string' && entry[1].length > 0
    )
  );
}

function readToken(payload: unknown): string | null {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'access_token' in payload &&
    typeof payload.access_token === 'string' &&
    payload.access_token.length > 0
  ) {
    return payload.access_token;
  }
  return null;
}

function trimBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export const fridgeitClient = { login, listDeliveryEvents, trimBaseUrl };

export type FridgeitCredentials = {
  baseUrl: string;
  email: string;
  password: string;
};

export type DeliveryEvent = Record<string, unknown> & {
  event_id?: string;
  sms_message_sid?: string;
  created_at?: string;
};

type DeliveryEventsPage = {
  items?: DeliveryEvent[];
  next_cursor?: string | null;
};

type ListDeliveryEventsParams = {
  auth: FridgeitCredentials;
  token: string;
  accountId: string;
  status: string | undefined;
  fromDate: string | undefined;
  toDate: string | undefined;
  pageSize: number;
  maxPages: number;
};

type FetchPagesParams = Omit<ListDeliveryEventsParams, 'maxPages'> & {
  remaining: number;
  cursor: string | undefined;
  seenCursors: string[];
};
