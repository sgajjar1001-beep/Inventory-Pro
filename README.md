<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/427d0096-8b6c-4cad-8c02-2edcb2ca82e2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## GitHub Pages Deployment

This project is configured for GitHub Pages using the repository name `Inventory-Pro`.

- The Vite base path is already set to `/Inventory-Pro/` in `vite.config.ts`.
- A GitHub Actions workflow will build the app and publish the `dist` folder to the `gh-pages` branch.
- Once deployed, the live URL will be:
  `https://sgajjar1001-beep.github.io/Inventory-Pro/`

To deploy automatically, push to `main` or `master` and GitHub Actions will build and publish the site.

If you want to build locally instead, run:

```bash
npm run build:site
```
