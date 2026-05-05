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
    console.log('Fetching facebook homepage...');
    const res = await axios.get('https://www.facebook.com/', {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const html = res.data as string;
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/);
    console.log('Title:', titleMatch ? titleMatch[1] : 'Unknown');
    console.log('Logged in?', !html.includes('"login_form"'));
    
    // Look for unread notifications count in JSON initial data
    const notifMatch = html.match(/"notifications_unseen_count":(\d+)/);
    console.log('Unread Notifications Count (from JSON state):', notifMatch ? notifMatch[1] : 'Not found');
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}
main();
