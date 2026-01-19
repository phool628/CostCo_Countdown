const axios = require('axios');
const cheerio = require('cheerio');
const chrono = require('chrono-node');

// Fallback date if scraping fails (can be overridden by env variable)
const FALLBACK_DATE = process.env.COSTCO_OPENING_DATE || '2026-03-01T09:00:00';

// News sources to scrape
const SOURCES = [
  {
    name: 'Times Union',
    url: 'https://www.timesunion.com/search/?q=costco+guilderland+opening',
    selector: 'article, .headline, .story',
  },
  {
    name: 'CBS 6 Albany',
    url: 'https://cbs6albany.com/?s=costco+opening',
    selector: 'article, .entry-title, .post',
  },
  {
    name: 'Fox 23 Albany', 
    url: 'https://www.fox23news.com/?s=costco+albany',
    selector: 'article, .headline, .story',
  },
  {
    name: 'Costco',
    url: 'https://www.costco.com/warehouse-locations',
    selector: '.location-details, .warehouse-info',
  }
];

// Keywords to look for
const KEYWORDS = [
  'opening',
  'opens',
  'grand opening',
  'guilderland',
  'albany',
  'costco',
  'new store',
  'launch'
];

/**
 * Scrape a single source for opening date information
 */
async function scrapeSource(source) {
  try {
    const response = await axios.get(source.url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const elements = $(source.selector);
    
    let foundDates = [];
    
    elements.each((i, elem) => {
      const text = $(elem).text();
      
      // Check if text contains relevant keywords
      const hasKeywords = KEYWORDS.some(keyword => 
        text.toLowerCase().includes(keyword)
      );
      
      if (hasKeywords) {
        // Try to extract dates from the text
        const parsedDates = chrono.parse(text);
        
        parsedDates.forEach(parsed => {
          const date = parsed.start.date();
          // Only consider future dates
          if (date > new Date()) {
            foundDates.push({
              date: date,
              source: source.name,
              text: text.substring(0, 200), // First 200 chars for context
              confidence: parsed.start.isCertain() ? 'high' : 'medium'
            });
          }
        });
      }
    });
    
    return foundDates;
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error.message);
    return [];
  }
}

/**
 * Main handler for Vercel serverless function
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Starting scrape of all sources...');
    
    // Scrape all sources in parallel
    const allResults = await Promise.all(
      SOURCES.map(source => scrapeSource(source))
    );
    
    // Flatten results
    const allDates = allResults.flat();
    
    // Sort by date (earliest first) and confidence
    allDates.sort((a, b) => {
      const dateCompare = a.date - b.date;
      if (dateCompare !== 0) return dateCompare;
      
      // If dates are same, prefer higher confidence
      if (a.confidence === 'high' && b.confidence !== 'high') return -1;
      if (a.confidence !== 'high' && b.confidence === 'high') return 1;
      return 0;
    });
    
    console.log(`Found ${allDates.length} potential dates`);
    
    // Use the most likely date, or fallback
    let openingDate;
    let dataSource;
    let confidence;
    let context;
    
    if (allDates.length > 0) {
      const best = allDates[0];
      openingDate = best.date.toISOString();
      dataSource = best.source;
      confidence = best.confidence;
      context = best.text;
    } else {
      openingDate = FALLBACK_DATE;
      dataSource = 'manual/fallback';
      confidence = 'fallback';
      context = 'No dates found via scraping, using fallback date';
    }
    
    // Return the result
    return res.status(200).json({
      success: true,
      openingDate: openingDate,
      source: dataSource,
      confidence: confidence,
      context: context,
      scrapedAt: new Date().toISOString(),
      totalDatesFound: allDates.length,
      allDates: allDates.slice(0, 5).map(d => ({
        date: d.date.toISOString(),
        source: d.source,
        confidence: d.confidence
      }))
    });
    
  } catch (error) {
    console.error('Error in opening-date API:', error);
    
    // Return fallback on error
    return res.status(200).json({
      success: false,
      openingDate: FALLBACK_DATE,
      source: 'fallback',
      confidence: 'fallback',
      error: error.message,
      scrapedAt: new Date().toISOString()
    });
  }
};
