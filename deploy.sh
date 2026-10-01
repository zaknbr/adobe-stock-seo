#!/bin/bash
set -e

echo "🚀 Building Adobe Stock AI SEO Generator production assets..."
npm run build

echo "📦 Syncing production assets to DigitalOcean server (stock.smartconverterbd.com)..."
scp -i /Users/zakaria/.gemini/antigravity/scratch/id_itibritto -r dist/* root@159.65.0.214:/home/adobestock/htdocs/stock.smartconverterbd.com/

echo "🔒 Setting correct permissions on server..."
ssh -i /Users/zakaria/.gemini/antigravity/scratch/id_itibritto root@159.65.0.214 "chown -R adobestock:adobestock /home/adobestock/htdocs/stock.smartconverterbd.com/ && chmod -R 755 /home/adobestock/htdocs/stock.smartconverterbd.com/"

echo "✅ Successfully deployed to https://stock.smartconverterbd.com!"
