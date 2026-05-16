import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const channelId = 'UCize2SQoXPI6RFQYbIGemIg';
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    
    const response = await fetch(rssUrl, { next: { revalidate: 3600 } }); // Cache for 1 hour
    const xml = await response.text();
    
    // Simple regex to find the first video ID in the RSS feed
    const match = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const videoId = match ? match[1] : null;

    if (!videoId) {
      return NextResponse.json({ error: 'No video found' }, { status: 404 });
    }

    return NextResponse.json({ videoId });
  } catch (err) {
    console.error('[latest-video API error]', err);
    return NextResponse.json({ error: 'Failed to fetch latest video' }, { status: 500 });
  }
}
