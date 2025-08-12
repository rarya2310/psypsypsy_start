# PSYPSYPSY Opening

Single-page app built with Vite + React. This README includes deployment steps to BigRock for the domain psypsypsy.in.

## Develop

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

This outputs static files to the `dist/` folder.

## Deploy to GitHub Pages

1. Push your code to GitHub.
2. The workflow `.github/workflows/gh-pages.yml` will build and deploy your site to the `gh-pages` branch automatically on every push to `main`.
3. A `CNAME` file is added so your site will be served at `https://psypsypsy.in`.

## DNS setup for custom domain

In your BigRock DNS panel:

- Add a CNAME record:
  - Name: `www`
  - Value: `psypsypsy.in`
- Add A records for apex domain (psypsypsy.in) pointing to GitHub Pages IPs:
  - 185.199.108.153
  - 185.199.109.153
  - 185.199.110.153
  - 185.199.111.153

## Vite base path

If you deploy to a subfolder, set `base` in `vite.config.ts` accordingly. For root domain, default is fine.

## Instagram Link

The homepage includes a link to `https://www.instagram.com/psypsypsy_r1` under the hero.
