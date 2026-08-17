// api/songs.js
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://ICOC:ICOC%401234@church-songs.7f6ysfq.mongodb.net/?appName=church-songs";
let cachedClient = null;

async function getMongoClient() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = await getMongoClient();
    const db = client.db('church_db');
    const collection = db.collection('songs');

    // Parse body if received as string
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    // --- GET ALL SONGS ---
    if (req.method === 'GET') {
      const songs = await collection.find({}).toArray();
      const formatted = songs.map(s => ({
        id: s._id.toString(),
        title: s.title || '',
        language: s.language || 'English',
        slides: s.slides || []
      }));
      return res.status(200).json(formatted);
    }

    // --- CREATE NEW SONG ---
    if (req.method === 'POST') {
      const { title, language, slides } = body || {};
      const result = await collection.insertOne({ 
        title: title || 'Untitled', 
        language: language || 'English', 
        slides: slides || [] 
      });
      return res.status(201).json({ id: result.insertedId.toString(), title, language, slides });
    }

    // --- UPDATE EXISTING SONG ---
    if (req.method === 'PUT') {
      const { id, title, language, slides } = body || {};
      if (!id) return res.status(400).json({ error: 'Missing song ID' });

      let filter = { _id: id };
      if (ObjectId.isValid(id)) {
        filter = { _id: new ObjectId(id) };
      }

      await collection.updateOne(
        filter,
        { $set: { title, language, slides: slides || [] } }
      );
      return res.status(200).json({ id, title, language, slides });
    }

    // --- DELETE SONG ---
    if (req.method === 'DELETE') {
      // Extract ID from query params, URL search, or body
      let id = req.query?.id || body?.id;
      if (!id && req.url) {
        const urlParams = new URL(req.url, 'http://localhost').searchParams;
        id = urlParams.get('id');
      }

      if (!id) {
        return res.status(400).json({ error: 'Song ID is required for deletion' });
      }

      let filter = { _id: id };
      if (ObjectId.isValid(id)) {
        filter = { _id: new ObjectId(id) };
      }

      const result = await collection.deleteOne(filter);
      
      if (result.deletedCount === 0) {
        // Fallback check if stored under custom 'id' property
        await collection.deleteOne({ id: id });
      }

      return res.status(200).json({ success: true, deletedId: id });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}