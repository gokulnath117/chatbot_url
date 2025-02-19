import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chromium } from 'playwright'; // Changed from puppeteer

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

async function scrapeWebsite(url) {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Add additional waiting for content stability
    await page.waitForLoadState('networkidle');

    const content = await page.evaluate(() => {
      const body = document.querySelector('body');
      return body?.innerText 
        ? body.innerText.replace(/\s+/g, ' ').trim()
        : '';
    });

    if (!content) throw new Error('No content found');
    return content;

  } finally {
    if (browser) await browser.close();
  }
}

async function generateEmbeddings(text) {
  const model = genAI.getGenerativeModel({ model: 'embedding-001' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { url } = req.body;
    
    // Scrape website
    const content = await scrapeWebsite(url);
    
    // Generate embeddings
    const embeddings = await generateEmbeddings(content);
    
    // Store in Pinecone
    const index = pinecone.Index(process.env.PINECONE_INDEX);
    await index.upsert([{
      id: `doc_${Date.now()}`,
      values: embeddings,
      metadata: { url, content }
    }]);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}