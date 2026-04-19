# Extended tutorial: Deploy this site with Cloudflare Pages

This guide walks through publishing the Democracy Index static site (`index.html`, `country-profiles.html`, `data/`, etc.) to **Cloudflare Pages** so you get a public **HTTPS** URL like `https://your-project.pages.dev`.

---

## What you get

- **Free** hosting on Cloudflare’s global network (CDN).
- **Automatic HTTPS** and a short URL on `***.pages.dev`** (no paid domain required).
- **Auto-deploy** on every `git push` to your main branch (optional but recommended).
- **Capacity**: Static sites handle many simultaneous visitors; dozens of users at once is normal for this stack.

---

## Prerequisites

Install or have ready:


| Requirement                         | Notes                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Git**                             | [git-scm.com](https://git-scm.com/) — required to push code.                                                     |
| **GitHub account**                  | [github.com](https://github.com) (or GitLab; Cloudflare supports both).                                          |
| **Cloudflare account**              | Free signup at [dash.cloudflare.com](https://dash.cloudflare.com).                                               |
| **Node.js** (only on your computer) | For `npm run ingest:excel` when you change Excel data — **not** required on Cloudflare’s servers for deployment. |


This repository should **not** upload `node_modules/` to Git (see `.gitignore`). The live site only needs the HTML, CSS/JS, `data/*.js`, `data/*.json`, and assets.

---

## Part A — Prepare the project locally

### A1. Regenerate data from the workbook (when needed)

Whenever `the index/part 3 democracy.xlsx` changes:

```bash
cd /path/to/DGW
npm install
npm run ingest:excel
```

This updates `data/ingested-excel.json` and `data/ingested-excel.js`. **Commit these files** so the website shows current scores online.

### A2. Confirm files exist

At the repository root you should have:

- `index.html`, `country-profiles.html`, `indicators.html`, `references.html`
- `data/ingested-excel.js`, `data/ingested-excel.json`, `data/dgw-loader.js`
- `package.json` (optional for documentation; build on Pages can stay empty)

### A3. Initialize Git (if you haven’t)

```bash
cd /path/to/DGW
git init
git add .
git commit -m "Initial commit: Democracy Index site"
```

### A4. Create a GitHub repository

1. On GitHub: **New repository**.
2. Name it (e.g. `democracy-index-latam`).
3. Leave it **empty** (no README) if you will push an existing folder; or follow GitHub’s “push an existing repository” instructions.

Link remote and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with yours.

---

## Part B — Cloudflare Pages (connect GitHub)

### B1. Log in to Cloudflare

1. Open [dash.cloudflare.com](https://dash.cloudflare.com).
2. Sign up or log in (email is fine; no paid plan required).

### B2. Create a Pages project from Git

1. In the sidebar: **Workers & Pages** (or **Compute** → **Workers & Pages**, depending on the UI).
2. **Create application** → choose **Pages** → **Connect to Git**.
3. **Connect GitHub** (or GitLab): authorize Cloudflare to read repositories when prompted.
4. Select the repository you pushed (e.g. `democracy-index-latam`).

### B3. Configure the build

Use settings that match a **static site at the repository root** (no bundler):


| Setting                    | Value                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project name**           | Choose a short name — it becomes part of `**https://<project-name>.pages.dev`**. Example: `dgw-latam`.                                                                          |
| **Production branch**      | `main` (or `master` if that’s what you use).                                                                                                                                    |
| **Framework preset**       | **None**.                                                                                                                                                                       |
| **Build command**          | **Leave empty.** (No `npm run build` required for this project.)                                                                                                                |
| **Build output directory** | `**/`** or `**.**` or root — meaning “site files live at repo root”. If the UI asks for a folder name, use the option that points at where `index.html` sits (repository root). |


**Important:** If Cloudflare shows an advanced **Root directory** field and your `index.html` is **not** in a subfolder, leave root empty or `/`.

Click **Save and Deploy** (wording may vary).

### B4. Wait for the first deployment

- The dashboard shows build logs. For a static site with no build command, it should finish quickly.
- When status is **Success**, open the assigned `***.pages.dev`** URL.

### B5. Test

- Open `https://<your-project-name>.pages.dev/` — you should see the home page.
- Open `country-profiles.html`, `indicators.html` — they should load.
- If the map or scores are missing, check that `data/ingested-excel.js` was committed and paths are still `data/...` (relative to site root).

---

## Part C — Updating the site after data or content changes

Every time you change the Excel file or HTML:

1. Locally:
  ```bash
   npm run ingest:excel
  ```
2. Commit everything that changed (especially under `data/`):
  ```bash
   git add .
   git commit -m "Update index data from workbook"
   git push
  ```
3. Cloudflare Pages will **start a new deployment** automatically (usually 1–3 minutes).
4. Refresh the live URL; use **hard refresh** (Ctrl+F5 / Cmd+Shift+R) if the browser cached old JS.

---

## Part D — Optional: previews for pull requests

In the Pages project: **Settings** → **Builds & deployments** → enable **Preview deployments** for pull requests (if available on your plan). Useful if you use branches for drafts.

---

## Part E — Troubleshooting

### Build fails: “Output directory not found” or “No files”

- Confirm **Build output directory** is the folder that **contains `index.html`** after the build step. Here there is **no** build step — output is the **repository root**, so use `/` or `.` as the docs above describe.
- Confirm `index.html` is committed: `git ls-files index.html`.

### Site loads but map or scores are blank

- Ensure `data/ingested-excel.js` and `data/ingested-excel.json` are in the repo and not listed only in `.gitignore`.
- Run `npm run ingest:excel` locally, commit the `data/` files, push again.

### 404 on `country-profiles.html`

- File names are case-sensitive on the server: use exact names (`country-profiles.html`).

### University Wi‑Fi / eduroam blocks the site

- Try the same URL on **mobile data**. If it works: the network may filter certain domains — only your institution’s IT can whitelist `***.pages.dev`** or HTTPS to Cloudflare. This is not fixed by changing HTML.

### Wrong project URL

- **Rename** is in Pages project **Settings** → **Domains** / project name (depends on Cloudflare UI version). The default `pages.dev` subdomain is tied to the project name at creation.

---

## Part F — Optional: deploy from terminal with Wrangler (advanced)

If you prefer the CLI instead of Git integration:

1. Install Wrangler: `npm install -g wrangler`
2. Log in: `wrangler login` (browser flow).
3. From the project root (where `index.html` lives):
  ```bash
   npx wrangler pages deploy . --project-name=YOUR_PROJECT_NAME
  ```

Use a **Cloudflare API token** only on your machine; never commit it. Git-based deploys (Part B) are simpler for ongoing updates.

---

## Quick checklist

- Repo on GitHub with `index.html` at root and `data/` committed  
- Pages project: preset **None**, empty build command, output = repo root  
- After Excel edits: `npm run ingest:excel` → commit `data/*` → `git push`  
- Share `**https://<project-name>.pages.dev`** with readers

You’re done when the `pages.dev` URL loads all pages and shows current scores.