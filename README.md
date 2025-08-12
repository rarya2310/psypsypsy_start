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

## Deploy to BigRock (cPanel/Apache hosting)

1. Build locally: `npm run build`.
2. Upload the contents of `dist/` to your hosting root (usually `public_html/` for your main domain).
3. Ensure this file exists at `public_html/.htaccess` and contains SPA rewrites:

```
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
```

4. If your site is in a subfolder (e.g., `public_html/app/`), update your Vite base path in `vite.config.ts` as needed:

```ts
export default defineConfig({
  base: '/', // or '/app/' if deployed under a subfolder
  plugins: [react()],
});
```

5. Clear any server/site cache from cPanel if changes don’t appear immediately.

## Domain: psypsypsy.in

- Point your domain to the hosting where you upload `dist/` (BigRock). If using BigRock DNS, set the A record to the hosting IP (from your cPanel) and ensure `www` CNAME points to `psypsypsy.in`.
- Use their SSL (AutoSSL/Let’s Encrypt) to enable HTTPS.

## Instagram Link

The homepage includes a link to `https://www.instagram.com/psypsypsy_r1` under the hero.
