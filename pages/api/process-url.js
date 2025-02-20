import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

async function scrapeWebsite(url) {
  let driver;
  try {
    const options = new chrome.Options();
    options.addArguments(
      '--headless', // Run in headless mode
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage'
    );

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    
    await driver.get(url);
    
    // Wait until body tag is loaded
    await driver.sleep(3000);
    
    const content = await driver.findElement(By.tagName('body')).getText();

    if (!content) throw new Error('No content found');
    return content.trim();

  } finally {
    if (driver) await driver.quit();
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
