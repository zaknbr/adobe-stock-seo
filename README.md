# Adobe Stock AI SEO Metadata & Bulk CSV Generator

An automated AI-powered metadata generator designed specifically for Adobe Stock contributors. It generates high-ranking, commercial intent titles (max 200 chars), strictly weighted top-10 keywords (45-50 total), accurate category classification (1-21), and instant downloadable CSV files for bulk upload.

---

## 🌟 Key Features

1. **Adobe Stock Search Algorithm Optimized:**
   - **Titles:** Under 200 characters with primary commercial keywords in the first 4-6 words.
   - **Keywords:** 45-50 keywords ordered strictly by relevance (Positions 1-10 are weighted highest by Adobe Stock's ranking algorithm).
   - **Categories:** Auto-selects from Adobe Stock's official 21 categories.
2. **Bulk Processing (100–300+ Images):**
   - Drag & drop single files, batches, or whole directories.
   - Client-side image resizing keeps memory low and makes Vision AI analysis ultra-fast.
   - Parallel queue processing with concurrency control.
3. **Adobe Stock Bulk CSV Export:**
   - Compliant RFC 4180 CSV export formatted: `Filename,Title,Keywords,Category,Releases`.
   - 1-click download ready for Adobe Stock Contributor Portal.
4. **Zero-Cost & Unlimited Sharing:**
   - Fully client-side processing using Google Gemini 2.5 Flash / 1.5 Flash.
   - Users can input their own free Gemini API key (stored safely in browser LocalStorage).

---

## 🚀 Running Locally

```bash
# 1. Navigate to directory
cd /Users/zakaria/.gemini/antigravity/scratch/adobe-stock-seo-generator

# 2. Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🌐 Deploying to DigitalOcean (e.g. stock.smartconverterbd.com)

### Option 1: Static Deployment (Nginx / DigitalOcean Droplet)
1. Build the production assets:
   ```bash
   npm run build
   ```
2. Upload the contents of the `dist/` folder to your server's web root (e.g. `/var/www/stock.smartconverterbd.com/html`).
3. Set your Nginx configuration:
   ```nginx
   server {
       server_name stock.smartconverterbd.com;
       root /var/www/stock.smartconverterbd.com/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
4. Issue SSL with Certbot:
   ```bash
   certbot --nginx -d stock.smartconverterbd.com
   ```

### Option 2: Docker Container
```bash
docker build -t adobe-stock-seo .
docker run -d -p 80:80 --name adobe-stock-seo-app adobe-stock-seo
```

---

## 🔑 How to Get a Free Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **"Create API Key"** and paste it into the app's settings.
