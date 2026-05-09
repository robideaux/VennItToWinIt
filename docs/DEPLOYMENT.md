# Venn It To Win It — Deployment Guide

## Overview

This app is a fully static React + Vite build. No server or backend required.
The deployment pipeline is: **edit locally or on GitHub → push → auto-deploy to Netlify**.

Puzzle JSON files live inside the repo, so adding or updating puzzles is just a file edit + commit — no code changes needed.

---

## One-Time Setup

### Step 1 — Create a GitHub Account

If you don't already have one, sign up at https://github.com. The free plan is all you need.

### Step 2 — Push Your Project to GitHub

In your terminal, from the project root:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create a new repository on GitHub (click **+** → **New repository**), name it `venn-it-to-win-it`, keep it **Public**, and follow the instructions GitHub shows you to push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/venn-it-to-win-it.git
git branch -M main
git push -u origin main
```

Your code is now on GitHub.

### Step 3 — Create a Netlify Account

Sign up at https://netlify.com — use "Sign up with GitHub" to link your accounts in one step.

### Step 4 — Connect Your Repo to Netlify

1. In the Netlify dashboard, click **Add new site** → **Import an existing project**
2. Choose **GitHub** and authorize Netlify to access your repos
3. Select the `venn-it-to-win-it` repository
4. Configure the build settings:

| Setting | Value |
|---|---|
| **Branch to deploy** | `main` |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |

5. Click **Deploy site**

Netlify will build your project and give you a live URL like `https://random-name-123.netlify.app`.
The first deploy takes about 1–2 minutes.

### Step 5 — (Optional) Set a Custom Subdomain

In Netlify: **Site configuration** → **Domain management** → **Options** → **Edit site name**.
Change `random-name-123` to something like `vennittowinit` → your URL becomes `https://vennittowinit.netlify.app`. Free, no custom domain purchase needed.

### Step 6 — (Optional) Use a Custom Domain

If you own a domain (e.g. `mypuzzlegame.com`), you can point it to Netlify for free SSL and hosting:
**Domain management** → **Add a domain** → follow the DNS instructions Netlify provides.

---

## How Auto-Deploy Works

Once set up, Netlify watches your `main` branch on GitHub. Every time you push a commit:

1. Netlify detects the change automatically
2. Runs `npm run build`
3. Deploys the new `dist/` folder to their CDN
4. Your live site is updated — usually within **60–90 seconds**

You never need to touch Netlify again after the initial setup.

---

## Adding or Updating Puzzles

Puzzles are plain `.json` files in `/public/puzzles/`. You don't need to touch any React code to add new puzzles.

### Option A — Edit Directly on GitHub (Easiest, No Code Editor Needed)

1. Go to your repo on GitHub: `https://github.com/YOUR_USERNAME/venn-it-to-win-it`
2. Navigate to `public/puzzles/`
3. To **add a new puzzle**:
   - Click **Add file** → **Create new file**
   - Name it `puzzle-003.json` (increment the number)
   - Paste your puzzle JSON (see schema below)
   - Click **Commit changes** → **Commit directly to main**
4. To **edit an existing puzzle**:
   - Click the file name → click the pencil ✏️ icon
   - Make your edits
   - Click **Commit changes**
5. Don't forget to update `index.json` to reference new puzzles (same edit process)

Netlify picks up the commit and redeploys automatically.

### Option B — Edit Locally and Push

```bash
# Make your changes to public/puzzles/ files
git add public/puzzles/
git commit -m "Add puzzle: Ocean Animals"
git push
```

---

## Puzzle File Reference

### `/public/puzzles/index.json` — Puzzle Manifest

This file lists all available puzzles. Add one entry per puzzle.

```json
{
  "puzzles": [
    { "id": "puzzle-001", "title": "Example Puzzle",    "file": "puzzle-001.json" },
    { "id": "puzzle-002", "title": "Ocean Animals",     "file": "puzzle-002.json" },
    { "id": "puzzle-003", "title": "Your Next Puzzle",  "file": "puzzle-003.json" }
  ]
}
```

### `/public/puzzles/puzzle-XXX.json` — Individual Puzzle

```json
{
  "id": "puzzle-002",
  "title": "Ocean Animals",
  "maxAttempts": 5,
  "categories": {
    "A": "Category A Name",
    "B": "Category B Name",
    "C": "Category C Name"
  },
  "terms": [
    { "id": "t1", "label": "Term One",   "regions": ["A"] },
    { "id": "t2", "label": "Term Two",   "regions": ["B"] },
    { "id": "t3", "label": "Term Three", "regions": ["C"] },
    { "id": "t4", "label": "Term Four",  "regions": ["A", "B"] },
    { "id": "t5", "label": "Term Five",  "regions": ["A", "C"] },
    { "id": "t6", "label": "Term Six",   "regions": ["B", "C"] },
    { "id": "t7", "label": "Term Seven", "regions": ["A", "B", "C"] }
  ]
}
```

**Rules:**
- Always exactly **7 terms**
- Each term's `regions` array must be a unique combination — no two terms can share the same region key
- Valid `regions` combinations: `["A"]`, `["B"]`, `["C"]`, `["A","B"]`, `["A","C"]`, `["B","C"]`, `["A","B","C"]`
- Order inside `regions` doesn't matter — `["B","A"]` is treated the same as `["A","B"]`

---

## Netlify Free Tier Limits

For a personal puzzle game, you will very likely never hit these:

| Limit | Free Allowance |
|---|---|
| Bandwidth | 100 GB / month |
| Build minutes | 300 / month |
| Deploys | Unlimited |
| Sites | Unlimited |
| Custom domains | ✅ Included |
| HTTPS / SSL | ✅ Automatic |

100 GB of bandwidth supports roughly **1–5 million page loads per month** for a lightweight app like this.

---

## Troubleshooting

**Build fails on Netlify**
- Check that build command is `npm run build` and publish directory is `dist`
- View the build log in Netlify dashboard → **Deploys** → click the failed deploy

**Puzzle not showing up after adding it**
- Make sure you also updated `public/puzzles/index.json` with the new entry
- Check the JSON is valid — paste it into https://jsonlint.com to verify

**Site not updating after a push**
- Go to Netlify dashboard → **Deploys** — you should see a deploy in progress or completed
- If no deploy triggered, check that the branch is `main` in your Netlify site settings

**Local dev: puzzles not loading**
- Run `npm run dev` from the project root (Vite serves `/public` automatically)
- Make sure puzzle files are in `/public/puzzles/`, not `/src/`
