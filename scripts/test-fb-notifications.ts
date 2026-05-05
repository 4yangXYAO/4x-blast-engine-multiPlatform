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
      baseURL: 'https://www.facebook.com',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    console.log('Fetching www.facebook.com/notifications...');
    const res = await client.get('/notifications');
    const html = res.data as string;
    
    // Look for notifications state in the raw HTML payload
    const unreadCount = html.match(/"notifications_unseen_count":(\d+)/);
    console.log('Unseen Count:', unreadCount ? unreadCount[1] : '0');
    
    const notifNodes = html.match(/"node":\{"id":"notif_[^"]+","creation_time":\d+,"url":"[^"]+","body":\{"text":"(.*?)"\}/g);
    
    if (notifNodes) {
        console.log(`Found ${notifNodes.length} notifications via Regex!`);
        for(let i = 0; i < Math.min(5, notifNodes.length); i++) {
           const textMatch = notifNodes[i].match(/"text":"(.*?)"\}/);
           if (textMatch) {
               console.log(`- ${textMatch[1]}`);
           }
        }
    } else {
        // Fallback broad regex for any "body":{"text":"..."} inside the page
        const broadTexts = html.match(/"body":\{"text":"(.*?)"\}/g);
        if (broadTexts) {
            console.log(`Found ${broadTexts.length} generic texts.`);
            for(let i = 0; i < Math.min(5, broadTexts.length); i++) {
               const textMatch = broadTexts[i].match(/"text":"(.*?)"\}/);
               if (textMatch) {
                   console.log(`- ${textMatch[1]}`);
               }
            }
        } else {
            console.log("No notifications found. Account might not have any recent ones, or layout changed.");
        }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}
main();
