# jdp-games

## GitHub Pages Preview

This repository is configured to publish static pages through GitHub Pages using a workflow at `.github/workflows/deploy-pages.yml`.

### Available pages

- `/` -> `index.html`
- `/bubble-shooter/`
- `/ruby-rhythm/`
- `/wordscapes/`

### Source organization

- Each game page is organized in its own folder with an `index.html` entry file.

### One-time GitHub setting

In your repository settings, open **Pages** and set **Source** to **GitHub Actions**.
After that, every push to `main` redeploys previews automatically.
