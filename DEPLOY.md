# VPS (`srv1745734`)

`/root/kovanica-web` and `/root/kovanica-ledger` are **not git repos.** Clone
sidecars. Do not `git -C` them.

Kovanica owns `127.0.0.1:3010` (web), `127.0.0.1:8080` (explorer HTTP),
`0.0.0.0:9000` (P2P). Leave dashboard / trader / postgres / docker alone.

---

## Seed (already done 2026-08-21)

Explorer listens on TCP 9000. Keep:

```
KOVANICA_LISTEN=0.0.0.0:9000
KOVANICA_PEERS=off
KOVANICA_MINE=0
KOVANICA_FAUCET=0
KOVANICA_ALLOW_RESET=0
KOVANICA_OPERATOR=0
KOVANICA_POW=1
KOVANICA_DATA=/root/kovanica-ledger/data
```

**9000 must be open on the host firewall** or clones cannot join. Check:

```sh
ss -tlnp | grep 9000
ufw status | grep 9000 || true
ufw allow 9000/tcp comment kovanica-p2p
```

Also open **9000/tcp** in the cloud panel (Contabo/Hetzner/security group) if
one exists. Cloudflare does **not** proxy 9000.

---

## Ship UI (Telegram links gone)

The last rsync failed because `npm run build` writes **`.vercel/output`**
(App Builder / Vercel). The VPS process is a Node server on **3010** and
needs **`.output/server/index.mjs`**.

```sh
pm2 show kovanica-web
ls -la /root/kovanica-web

cd /tmp
rm -rf kovanica-web-build
git clone --depth 1 https://github.com/KovanicaDAG/kovanica-web.git kovanica-web-build
cd kovanica-web-build
npm ci
npm run build:vps

test -f .output/server/index.mjs || { echo "missing .output/server/index.mjs"; exit 1; }

mkdir -p /root/kovanica-web/.output
rsync -a --delete .output/ /root/kovanica-web/.output/

pm2 delete kovanica-web
cd /root/kovanica-web
HOST=127.0.0.1 PORT=3010 pm2 start .output/server/index.mjs --name kovanica-web
pm2 save
```

Confirm:

```sh
curl -s http://127.0.0.1:3010/ | grep -E 'Telegram|coin.webp|Create wallet'
curl -s https://kovanica.online/ | grep -E 'Telegram|t.me'
```

There must be **no** `t.me` / `Telegram Mini App`. Purge Cloudflare cache for
`kovanica.online` if the old header still shows.

Optional (kills the Telegram **bot process**, not required to clear the site):

```sh
pm2 stop kovanica-bot
pm2 save
```

Do not start `ton-grid-bot`.
