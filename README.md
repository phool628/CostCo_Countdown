# Costco Albany Opening Countdown

A beautiful countdown timer for the new Costco opening in Guilderland (Albany), New York with **automated news scraping** from multiple sources!

## 🤖 Automated Date Detection

This countdown automatically scrapes these sources every 5 minutes for opening date information:

- **Times Union** (Albany, NY)
- **CBS 6 Albany**
- **Fox 23 Albany**
- **Costco.com**

The system uses AI-powered date extraction to find the most likely opening date and updates the countdown automatically.

## 🚀 Deploy to Vercel

1. **Push to GitHub** (already done!)

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click **"New Project"**
   - Import your **`CostCo_Countdown`** repository
   - Click **"Deploy"**
   
3. **That's it!** Vercel will:
   - Install dependencies automatically
   - Deploy the serverless API
   - Make your site live in ~30 seconds

## 🔧 How It Works

### Architecture
```
┌─────────────┐
│  Frontend   │  ← User sees countdown
│ (index.html)│
└──────┬──────┘
       │ Fetches every 5 min
       ▼
┌─────────────────┐
│   Vercel API    │  ← Scrapes news sources
│ /api/opening-   │     (runs on every request)
│    date.js      │
└────────┬────────┘
         │
         ├──► Times Union
         ├──► CBS 6 Albany
         ├──► Fox 23 Albany
         └──► Costco.com
```

### Date Detection Process

1. **Scrape** - API scrapes all 4 news sources in parallel
2. **Parse** - Extracts dates using AI (chrono-node library)
3. **Filter** - Only future dates mentioning "Costco" + "opening" + "Guilderland/Albany"
4. **Rank** - Sorts by confidence and earliest date
5. **Return** - Sends best date to frontend

### Response Format

```json
{
  "success": true,
  "openingDate": "2026-06-15T10:00:00.000Z",
  "source": "Times Union",
  "confidence": "high",
  "context": "Costco announces grand opening...",
  "scrapedAt": "2026-01-19T12:00:00.000Z",
  "totalDatesFound": 3,
  "allDates": [...]
}
```

## 📝 Manual Override

If the automated scraping isn't finding the correct date, you can manually set it:

### Option 1: Environment Variable (Recommended)
In Vercel dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add: `COSTCO_OPENING_DATE` = `2026-06-15T10:00:00`
4. Redeploy

### Option 2: Edit Fallback in Code
Edit `api/opening-date.js` line 5:
```javascript
const FALLBACK_DATE = '2026-06-15T10:00:00';
```

## ✨ Features

- ⏱️ **Real-time countdown** in days, hours, minutes, and seconds
- 🤖 **Automated scraping** from 4 news sources
- 📱 **Fully responsive** design (mobile + desktop)
- 🎨 **Beautiful UI** with Costco brand colors
- 🔄 **Auto-refresh** - Checks for updates every 5 minutes
- 📊 **Confidence indicators** - Shows data source and reliability
- 🎉 **Celebration mode** when store opens
- 💫 **Smooth animations** and hover effects

## ⚙️ Configuration

### Update News Sources

Edit `api/opening-date.js` to change which sites to scrape:

```javascript
const SOURCES = [
  {
    name: 'Your News Site',
    url: 'https://example.com/search?q=costco',
    selector: 'article, .headline', // CSS selector for content
  },
  // ... more sources
];
```

### Adjust Refresh Rate

Edit `index.html` line ~225 to change how often the API is called:

```javascript
// Refresh every 5 minutes (5 * 60 * 1000 ms)
setInterval(fetchOpeningDate, 5 * 60 * 1000);
```

## 🐛 Troubleshooting

### "Using fallback date" message
- News sources haven't published the opening date yet
- Or scraper needs adjustment for new site layouts
- Set manual override via environment variable

### API timeouts
- Vercel hobby plan has 10-second timeout
- If sources are slow, reduce number of sources
- Or upgrade to Vercel Pro

### Wrong date detected
- Check API response at `https://your-site.vercel.app/api/opening-date`
- Verify which source provided the date
- Use manual override if needed

## 📦 Dependencies

- **axios** - HTTP requests to news sites
- **cheerio** - HTML parsing (like jQuery for Node.js)
- **chrono-node** - AI-powered date extraction from text

## 🔐 Privacy & Legal

- Scraping is for personal/educational use
- Respects robots.txt when possible
- Uses polite request intervals
- No data is stored or shared

## 📍 Location

**Costco Wholesale**  
Guilderland (Albany), New York

---

Made with ❤️ for the Albany community

*Note: Web scraping is inherently fragile. Sites may change their HTML structure, which can break the scraper. This project includes fallback mechanisms to ensure the countdown continues working even if automated scraping fails.*
