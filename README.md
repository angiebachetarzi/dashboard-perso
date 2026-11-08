# Personal dashboard

## Run locally

1. Copy `.env.example` to `.env` and set `DASHBOARD_PASSWORD` to a random password with at least 32 characters.
2. Install dependencies and run the local Netlify emulator:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The Netlify Vite plugin runs Functions and a sandboxed local Blobs store. Local edits do not change deployed data.

## Deploy to Netlify

1. Push this repository to GitHub and import it in Netlify.
2. In Netlify environment variables, set `DASHBOARD_PASSWORD` to a random password of at least 32 characters, scoped to Production only. Keep it server-side; do not add a `VITE_` prefix or commit it.
3. Deploy. `netlify.toml` configures the build, Functions, and `/api` routes.

The API requires the password for every read and write. Password stays in browser memory until you lock the dashboard. Netlify Blobs stores records in the Frankfurt (`eu-central-1`) region. The store starts with sample charts, sample notes, Reddit link, and an empty activity list.

## Security

No hosting setup can guarantee zero breach risk. Use a unique random password, enable two-factor authentication on your Netlify and GitHub accounts, and keep the password out of source control. Netlify Blobs is accessed only by the authenticated Function; the browser never receives Blobs credentials.
