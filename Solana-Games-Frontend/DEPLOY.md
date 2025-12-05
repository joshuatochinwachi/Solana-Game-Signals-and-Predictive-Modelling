# Deployment Guide

## 1. Local Production Verification (Recommended First Step)
Before deploying to the web, verify the production build locally. This ensures that what you see is exactly what users will see.

1. **Build the project** (if you haven't already):
   ```bash
   npm run build
   ```

2. **Run the local preview server**:
   ```bash
   npm run preview
   ```
   This will start a local web server (usually at `http://localhost:4173`) serving the optimized `dist/` folder. Open this URL in your browser to test the application.

## 2. Deploying to Vercel (Easiest)
Vercel is the recommended host for Vite/React applications.

1. **Install Vercel CLI** (optional, or use the web UI):
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts (accept defaults).
   - It will automatically detect Vite and configure the build settings.

3. **Environment Variables**:
   - Go to your Vercel Project Settings > Environment Variables.
   - Add `VITE_API_BASE_URL` with the value: `https://solana-game-signals-and-predictive-modelling-production.up.railway.app`

## 3. Deploying to Netlify

1. **Drag and Drop**:
   - Run `npm run build`.
   - Drag the `dist` folder to the [Netlify Drop](https://app.netlify.com/drop) page.

2. **Git Integration (Recommended)**:
   - Push your code to GitHub.
   - Connect your repo in Netlify.
   - Build command: `npm run build`
   - Publish directory: `dist`
   - **Important**: Add the `VITE_API_BASE_URL` environment variable in Netlify Site Settings.

## Troubleshooting
- **Routing Issues**: If refreshing a page gives a 404, ensure your host is configured for Single Page Apps (SPA). Vercel handles this automatically. For Netlify, you may need a `_redirects` file in the `public` folder with `/* /index.html 200`.

## 4. Custom Domains
### Vercel
1. Go to your **Project Settings** > **Domains**.
2. Enter your domain (e.g., `analytics.solanagames.com`) and click **Add**.
3. Follow the DNS instructions provided by Vercel:
   - **A Record**: Point `@` to `76.76.21.21`.
   - **CNAME Record**: Point `www` to `cname.vercel-dns.com`.
4. Vercel will automatically generate an SSL certificate for you.

### Netlify
1. Go to **Domain Management** > **Domains**.
2. Click **Add custom domain**.
3. Enter your domain name.
4. Update your DNS settings at your registrar (like GoDaddy or Namecheap) to point to Netlify's load balancer or use Netlify DNS.

