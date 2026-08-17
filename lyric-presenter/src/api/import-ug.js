export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { url } = req.body;
  if (!url || !url.includes('ultimate-guitar.com')) {
    return res.status(400).json({ error: 'Please enter a valid Ultimate Guitar URL.' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = await response.text();
    const match = html.match(/class="js-store" data-content="([^"]+)"/);

    if (!match) {
      return res.status(404).json({ error: 'Unable to extract song content from Ultimate Guitar.' });
    }

    const decoded = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const store = JSON.parse(decoded);
    const tabData = store?.store?.page?.data?.tab_view?.wiki_tab?.content;
    const songName = store?.store?.page?.data?.tab?.song_name || '';

    if (!tabData) {
      return res.status(404).json({ error: 'No tab text found on this page.' });
    }

    // Convert [ch]C[/ch] -> [C] and [tab]...[/tab]
    let cleanText = tabData
      .replace(/\[ch\](.*?)\[\/ch\]/g, '[$1]')
      .replace(/\[\/?tab\]/g, '');

    // Split into verse/chorus blocks and separate by ---
    const rawSections = cleanText.split(/\n\s*\n/);
    const slides = rawSections
      .map(sec => sec.trim())
      .filter(sec => sec.length > 0)
      .join('\n\n---\n\n');

    return res.status(200).json({
      title: songName,
      slidesText: slides
    });
  } catch (error) {
    console.error('UG Import error:', error);
    return res.status(500).json({ error: 'Failed to import from Ultimate Guitar: ' + error.message });
  }
}