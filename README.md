# 🧸 famly-parent

CLI tool for [Famly](https://famly.co), allowing parents to access their child's naps, meals, nappies, and news feed posts from the terminal. Every command emits JSON to stdout (errors as JSON to stderr), so it's straightforward to wrap as a tool for an LLM agent.

## Unofficial

Not affiliated with or endorsed by Famly. Uses the same undocumented HTTP endpoints that power the parent web app at [app.famly.co](https://app.famly.co), so behaviour can change or break at any time. Use it only with your own parent account.

## Quick start

Requires Node.js 20+.

```sh
npm install -g https://github.com/willpote/famly-parent/archive/refs/heads/main.tar.gz

famly-parent login
famly-parent day | jq
famly-parent --help
```

The repo ships a pre-built `dist/` so no compile step runs on your machine. Installing from the tarball URL puts `famly-parent` on your PATH. To upgrade later, just run the same command again.

## Commands

Output is compact, single-line JSON. Pipe to `jq` for pretty-printing. `--child <id>` is optional if your account has only one child.

| Command | What it returns |
|---|---|
| `login` | Prompts for email / password / timezone, stores an access token at `~/.config/famly-parent/config.json` (mode 0600). Prints `{"status":"ok","email":…,"timezone":…}`. |
| `logout` | Clears the saved access token. Prints `{"status":"ok"}`. |
| `whoami` | Raw `/api/me/me/me` payload for the current user. |
| `children` | Array of `{id, name, site, image}` for each child on the account. |
| `day [--date YYYY-MM-DD]` | A single `ParsedDay` object: `{date, checkins, meals, naps, nappies, events, other}`. Default: today. |
| `naps [--days N \| --from X --to Y]` | Array of nap events `{kind:"nap", start, end, durationMinutes, loggedBy?}`. Default: last 5 days. |
| `meals [--days N]` | Array of meal events `{kind:"meal", time, meal, items:[{food, amount}], loggedBy?}`. Default: last 5 days. |
| `nappies [--days N]` | Array of nappy events `{kind:"nappy", time, diaperingType, rawType, note?, loggedBy?}`. Default: last 5 days. |
| `feed [--limit N] [--pages N] [--author NAME] [--mentions NAME]` | Array of raw feed items with `sender`, `receivers`, `body`, `images`, `likes`, `comments`, `createdDate`, `feedItemId`. Fetches 5 pages by default. |
| `calendar --child <id> [--from --to]` | Raw `/api/v2/calendar` response. |
| `summary --child <id>` | Raw `/api/v2/children/{id}/summary` response. |

Errors always go to stderr as JSON, e.g. `{"error":"no_access_token","hint":"Run: famly-parent login"}` or `{"error":"HTTP 401 Unauthorized","status":401}`.

### Sample output

`famly-parent naps --days 3 | jq`:

```json
[
  {
    "kind": "nap",
    "start": "2026-05-05T17:27:08+00:00",
    "end": "2026-05-05T20:55:28+00:00",
    "durationMinutes": 208
  },
  {
    "kind": "nap",
    "start": "2026-05-06T17:35:00+00:00",
    "end": "2026-05-06T18:40:00+00:00",
    "durationMinutes": 65
  }
]
```

`famly-parent day | jq`:

```json
{
  "date": "2026-05-07",
  "checkins": [
    { "kind": "checkin",  "time": "2026-05-07T15:43:05+00:00", "location": "<class>" },
    { "kind": "checkout", "time": "2026-05-07T21:53:08+00:00" }
  ],
  "meals": [
    {
      "kind": "meal",
      "time": "2026-05-07T09:15:00-05:00",
      "meal": "Breakfast",
      "items": [{ "food": "Pears and yogurt", "amount": 4 }]
    },
    {
      "kind": "meal",
      "time": "2026-05-07T11:35:00-05:00",
      "meal": "Lunch",
      "items": [{ "food": "Mac and cheese, broccoli and applesauce", "amount": 3 }]
    }
  ],
  "naps": [
    {
      "kind": "nap",
      "start": "2026-05-07T17:38:28+00:00",
      "end": "2026-05-07T19:30:00+00:00",
      "durationMinutes": 111
    }
  ],
  "nappies": [
    { "kind": "nappy", "time": "2026-05-07T14:30:00+00:00", "diaperingType": "wet", "rawType": "WET" },
    { "kind": "nappy", "time": "2026-05-07T16:20:00+00:00", "diaperingType": "wet", "rawType": "WET" },
    { "kind": "nappy", "time": "2026-05-07T19:30:00+00:00", "diaperingType": "wet", "rawType": "WET" }
  ],
  "events": [],
  "other": []
}
```

`famly-parent children | jq`:

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "name": "<child name>",
    "site": "<daycare site>",
    "image": "https://img.famly.co/image/..."
  }
]
```
