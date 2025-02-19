import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const pinecone = new Pinecone({ apiKey:process.env.PINECONE_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { message } = req.body;
    
    // Generate query embedding
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const embeddingResult = await model.embedContent(message);
    const queryEmbedding = embeddingResult.embedding;

    if (!queryEmbedding?.values?.length) {
        throw new Error('Failed to generate embeddings');
      }
    
    // Query Pinecone
    const index = pinecone.Index('url-chatbot');
    const results = await index.query({
      vector: queryEmbedding.values,
      topK: 3,
      includeMetadata: true
    });
    
    // Generate response with Gemini
    const context = results.matches.map(m => m.metadata.content).join('\n');
    const chatModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Context: ${context}\n\nQuestion: ${message}\n\nAnswer:`;
    
    const result = await chatModel.generateContent(prompt);
    const response = await result.response.text();

    res.status(200).json({ response });
} catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process request',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}