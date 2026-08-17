// api/songs.js
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://ICOC:ICOC%401234@church-songs.7f6ysfq.mongodb.net/?appName=church-songs";
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  try {
    const client = await connectToDatabase();
    const db = client.db('church_db');
    const collection = db.collection('songs');

    if (req.method === 'GET') {
      const songs = await collection.find({}).toArray();
      // Map MongoDB _id to id for React frontend compatibility
      const formatted = songs.map(s => ({ ...s, id: s._id.toString() }));
      return res.status(200).json(formatted);
    }

    if (req.method === 'POST') {
      const songData = req.body;
      delete songData.id;
      delete songData._id;
      const result = await collection.insertOne(songData);
      return res.status(201).json({ ...songData, id: result.insertedId.toString() });
    }

    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;
      delete updateData._id;
      await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
      return res.status(200).json({ id, ...updateData });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await collection.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}