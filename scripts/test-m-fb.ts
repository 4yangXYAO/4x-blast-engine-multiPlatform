import axios from 'axios';
function parseCookies(raw: string): string {
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      return arr.map((c: any) => `${c.name}=${c.value}`).join('; ');
    } catch (e) { return raw; }
  }
  return raw;
}
async function main() {
  const cookieInput = process.argv[2];
  const cookieHeader = parseCookies(cookieInput);

  try {
    const client = axios.create({
      baseURL: 'https://m.facebook.com',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    console.log('Fetching m.facebook.com/notifications.php...');
    const res = await client.get('/notifications.php');
    const html = res.data as string;
    
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    console.log('Title:', titleMatch ? titleMatch[1] : 'Unknown');
    
    // Attempt to extract unread notifications.
    // They are often inside JSON blobs in modern mobile FB too.
    const unreadCount = html.match(/"notifications_unseen_count":(\d+)/);
    console.log('Unseen count:', unreadCount ? unreadCount[1] : 'Not found');
    
    const notifTexts = html.match(/"text":\{"text":"(.*?)"\}/g);
    if (notifTexts) {
        console.log(`Found ${notifTexts.length} notification texts.`);
        for (let i = 0; i < Math.min(5, notifTexts.length); i++) {
            console.log(`- ${notifTexts[i]}`);
        }
    } else {
        console.log("No notification texts found using JSON regex.");
        // Try looking for standard HTML links
        const links = html.match(/<a[^>]+href="\/notifications\/[^>]+>(.*?)<\/a>/g);
        if (links) {
            console.log(`Found ${links.length} notification links.`);
        }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}
main();
