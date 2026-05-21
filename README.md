# jdp-games

A collection of small, static browser games, published as previews through
GitHub Pages.

## Available games

The landing page ([index.html](index.html)) now separates games by status:

- Approved games appear in the `Approved` section.
- Pending games appear in the `Pending` section.

Game metadata lives in [games.js](games.js). Change a game from `pending` to
`approved` there when it is ready to ship.

## Source organization

Each game lives in its own folder. Games with an `index.html` entry file
(`bubble-shooter`, `flying-ruby`, `ruby-breaker-v2`, `ruby-rhythm`) are
reachable at the folder URL; the rest link directly to a named `.html` file.

## GitHub Pages

The repo is a plain static site — a `.nojekyll` file disables Jekyll
processing so all folders and files publish as-is. In repository
**Settings → Pages**, set the publishing source to the branch you deploy from.

> Note: there is no `.github/workflows/` deploy action in the repo. If you
> later switch to **GitHub Actions** as the Pages source, add the workflow
> file and update this section.
