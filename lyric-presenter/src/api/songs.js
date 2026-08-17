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

    if (req.method === 'POST') {
      const { title, language, slides } = req.body;
      const result = await collection.insertOne({ title, language, slides });
      return res.status(201).json({ id: result.insertedId.toString(), title, language, slides });
    }

    if (req.method === 'PUT') {
      const { id, title, language, slides } = req.body;
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { title, language, slides } }
      );
      return res.status(200).json({ id, title, language, slides });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await collection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}