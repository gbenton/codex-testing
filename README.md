# Mini Tower Defense

A lightweight browser tower defense game built with vanilla HTML, CSS, and JavaScript.

## Play online (GitHub Pages)

If you do not have a local computer, you can play directly from GitHub Pages.

1. Push this repository to your GitHub account.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push any commit to your default branch (or run the workflow manually from **Actions**).
5. After the workflow completes, open:

```text
https://<your-github-username>.github.io/<your-repo-name>/
```

This repo includes a workflow at `.github/workflows/deploy-pages.yml` that deploys the static site automatically. (bump)

## Run locally

Because this project uses static assets only, run any static server from the repo root, for example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How to play

- Click on grass tiles to place towers.
- Towers automatically fire at enemies in range.
- Survive all waves before enemies reduce your lives to 0.
