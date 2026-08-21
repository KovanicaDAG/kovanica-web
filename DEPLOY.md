# VPS (`srv1745734`)

Shared box. **Do not change ports of other apps.** Kovanica owns only the
binds below. Rebuild UI off-box, rsync `.output`, `pm2 restart kovanica-web`.

Origin sits behind Cloudflare. nginx 80/443 is shared.

## Reserved (do not reuse)

| Process | Bind | nginx |
| --- | --- | --- |
| `pm2 kovanica-web` | `127.0.0.1:3010` | apex, wallet, map (`kovanica-web`) |
| `pm2 kovanica-explorer` | `127.0.0.1:8080` | `explorer.kovanica.online` |
| P2P (when enabled) | `0.0.0.0:9000` | not proxied — not listening as of 2026-08-21 |

Trees: `/root/kovanica-web`, `/root/kovanica-ledger`.

`KOVANICA_MINE=0` `KOVANICA_FAUCET=0` `KOVANICA_ALLOW_RESET=0` `KOVANICA_POW=1`.

Never `npm ci` or `cargo build` over a running explorer unless that tree is
the one you intend to ship.

## Occupied by other apps (leave alone)

| Bind | Who |
| --- | --- |
| `127.0.0.1:5000` | `pm2 kovanica-backend` |
| `0.0.0.0:5173` | `pm2 dashboard-ui` |
| `0.0.0.0:8000` | uvicorn (`dashboard-api` / trading) |
| `127.0.0.1:4000` | python |
| `127.0.0.1:5432` | postgres |
| docker `3000` `3001` `5678` `8086` `19999` | docker-proxy |
| `80` / `443` | nginx (shared) |
| `22` | sshd |

nginx vhosts that are **not** this UI/node: `app.kovanica.online`,
`bot.kovanica.online`, `dash.kovanica.online`, `trader.kovanica.online`,
`claudes.online`, `nft-kovanica`.

pm2 names to leave running: `dashboard-api`, `dashboard-ui`, `ecosystem.live*`,
`kovanica-backend`, `live-worker`, `monitor-bot`, `trading-engine`.
`ton-grid-bot` is already stopped.

`pm2 kovanica-bot` is the old Telegram process — not this network. Do not
point this app at it. Stop it only when you decide to.

## Ship UI

```sh
npm run build:vps
rsync -a --delete .output/ root@VPS:/root/kovanica-web/.output/
ssh root@VPS 'pm2 restart kovanica-web'
```
