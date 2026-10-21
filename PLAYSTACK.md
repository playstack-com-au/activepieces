# Playstack fork of Activepieces

This fork exists only to rebrand Activepieces as Playstack Flows. Keep the changes small so upstream releases merge cleanly.

## What we changed

- `packages/server/api/src/app/flags/theme.ts`: `defaultTheme` name, primary colour (#73a2ff) and logo paths. Community Edition always uses this theme, so it is the one place the app's branding comes from.
- `packages/web/vite.config.mts`: browser tab title and favicon.
- `packages/web/public/logo.svg`, `logo-180.png`, `logo-192.png`, `favicon.ico`: Playstack icon.
- `packages/web/public/brand/`: icon and full logo used by the theme.
- `.github/workflows/playstack-image.yml`: builds `ghcr.io/playstack-com-au/activepieces` on every push to the `playstack` branch.
- `packages/pieces/custom/playstack-*`: our own pieces (FridgeIt, DataForSEO, Google PageSpeed) so their logins live in Flows connections, not in steps. The `Dockerfile` builds them and keeps them in the image.

Nothing under `packages/ee` or `packages/server/api/src/app/ee` is touched. Those folders are under Activepieces' commercial licence.

## Upgrading to a new Activepieces release

```bash
git fetch https://github.com/activepieces/activepieces refs/tags/<version>:refs/tags/<version>
git checkout playstack
git merge <version>
git push origin playstack
```

Merge release tags, not upstream `main`. Releases carry database migrations that can't be rolled back, so the server should only ever move forward one tested release at a time.

## Our own pieces

Community Edition can't upload custom pieces, so ours ship inside the image and load through `AP_DEV_PIECES`. The Flows server's `.env` must have:

```
AP_DEV_PIECES=playstack-fridgeit,playstack-dataforseo,playstack-pagespeed
```

To add a piece: create it under `packages/pieces/custom/playstack-<name>`, add its path to `tsconfig.base.json`, add it to the piece build line in the `Dockerfile` and to `AP_DEV_PIECES`. Bump a piece's `version` in its `package.json` whenever its props change.

## Deploying

On the Flows server, point both the `app` and `worker` services at `ghcr.io/playstack-com-au/activepieces:<version>`, then:

```bash
docker compose pull && docker compose up -d
```
