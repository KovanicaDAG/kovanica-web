# VPS (`srv1745734`)

Shared box. **Do not change ports of other apps.** Kovanica owns only the
binds below.

`/root/kovanica-web` and `/root/kovanica-ledger` are **deploy trees, not git
repos.** Do not `git -C` them — that is the fatal you already hit. Clone into
a sidecar directory, build, copy artifacts.

Origin sits behind Cloudflare. nginx 80/443 is shared.

## Reserved (do not reuse)

| Process | Bind | nginx |
| --- | --- | --- |
| `pm2 kovanica-web` | `127.0.0.1:3010` | apex, wallet, map (`kovanica-web`) |
| `pm2 kovanica-explorer` | `127.0.0.1:8080` | `explorer.kovanica.online` |
| P2P | `0.0.0.0:9000` | not proxied — **must listen** after the seed restart |

Never `npm ci` or `cargo build` inside a running tree. Leave dashboard, trader,
postgres, docker, 5000/5173/8000/4000 alone.

pm2 names to leave running: `dashboard-api`, `dashboard-ui`, `ecosystem.live*`,
`kovanica-backend`, `live-worker`, `monitor-bot`, `trading-engine`.
Stopped (do not start): `kovanica-bot`, `ton-grid-bot`.

---

## 1. Restart the seed so clones can join (do this first)

```sh
ss -tlnp | grep -E '3010|8080|9000'
pm2 show kovanica-explorer

# sidecar clone — do not git -C /root/kovanica-ledger
cd /root
git clone --depth 1 https://github.com/KovanicaDAG/kovanica-node.git kovanica-node
cd /root/kovanica-node
cargo build --release -p kovanica-node

# keep the live chain directory (adjust if pm2 cwd/data differs)
export KOVANICA_DATA=/root/kovanica-ledger/data
install -m 755 /root/kovanica-node/target/release/kovanica-node \
  /root/kovanica-ledger/target/release/kovanica-node

# seed listens, does not dial itself
pm2 restart kovanica-explorer --update-env -- \
  # if env is not picked up, set it on the process:
true
pm2 set kovanica-explorer 2>/dev/null || true
```

If `pm2 env` is easier, set these on `kovanica-explorer` then restart:

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

HTTP explorer stays `127.0.0.1:8080`. Open **9000/tcp** inbound (ufw/security group). Do not bind 80/443/3010/8080/5000/5173/8000.

Done when:

```sh
curl -s http://127.0.0.1:8080/api/p2p
# {"path":"tcp","listen":"0.0.0.0:9000", ...}
curl -s https://explorer.kovanica.online/api/p2p
ss -tlnp | grep 9000
```

If `listen` is still empty, the process did not pick up `KOVANICA_LISTEN` — paste `pm2 show kovanica-explorer` and stop.

---

## 2. Ship this UI to 3010 (after a local `npm run build`)

Do **not** `npm ci` in `/root/kovanica-web`. Build in `/tmp`, rsync `.output` (or the Vercel output this app actually emits):

```sh
cd /tmp
rm -rf kovanica-web-build
git clone --depth 1 https://github.com/KovanicaDAG/kovanica-web.git kovanica-web-build
cd kovanica-web-build
npm ci
npm run build

# TanStack/Nitro on Vercel writes .vercel/output; older builds used .output
if [ -d .output ]; then
  rsync -a --delete .output/ /root/kovanica-web/.output/
elif [ -d .vercel/output ]; then
  rsync -a --delete .vercel/output/ /root/kovanica-web/.vercel/output/
fi
pm2 restart kovanica-web
```

kovanica.online should then show tap / wallet / map, not Telegram.

---

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
