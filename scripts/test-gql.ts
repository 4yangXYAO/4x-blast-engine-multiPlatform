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
  
  const cUserMatch = cookieHeader.match(/\bc_user=([^;\s]+)/)
  const cUser = cUserMatch?.[1] ?? ''

  try {
    const pageClient = axios.create({
      baseURL: 'https://www.facebook.com',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    console.log('Fetching homepage...');
    const pageRes = await pageClient.get('/');
    const html = pageRes.data as string;
    
    if (html.includes('"login_form"')) {
        console.log('Cookie expired or invalid');
        return;
    }
    console.log('Homepage loaded');
    
    const dtsgMatch =
      html.match(/"DTSGInitialData"[^}]*"token":"([^"]+)"/) ||
      html.match(/name="fb_dtsg"\s+value="([^"]+)"/) ||
      html.match(/"DTSGInitData"[^}]*"token":"([^"]+)"/);
    const fbDtsg = dtsgMatch?.[1] ?? '';
    
    const lsdMatch =
      html.match(/"LSD",[^,]*,"token":"([^"]+)"/) ||
      html.match(/name="lsd"\s+value="([^"]+)"/) ||
      html.match(/"lsd":"([^"]+)"/);
    const lsd = lsdMatch?.[1] ?? '';
    
    console.log(`Extracted fb_dtsg: ${fbDtsg.substring(0, 10)}... lsd: ${lsd}`);
    
    // Now let's try getting Notifications!
    // Often notifications are loaded via GraphQL
    // Let's try MWGQL
    
    const params = new URLSearchParams({
      av: cUser,
      __user: cUser,
      __a: '1',
      __req: '1',
      fb_dtsg: fbDtsg,
      lsd: lsd,
      // Notification comet query doc id
      doc_id: '5010620635677840', // Common one for CometNotificationsDropdownQuery
      variables: JSON.stringify({
        environment: "WEB_BADGE",
        menuUseVPV: false,
        scale: 1
      }),
      fb_api_caller_class: 'RelayModern',
      fb_api_req_friendly_name: 'CometNotificationsDropdownQuery',
    });

    console.log('Fetching notifications...');
    const gqlClient = axios.create({
      baseURL: 'https://www.facebook.com',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*',
        'Origin': 'https://www.facebook.com',
        'Referer': 'https://www.facebook.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      }
    });

    const res = await gqlClient.post('/api/graphql/', params.toString());
    console.log('Success! Data:', JSON.stringify(res.data).substring(0, 500));
    
  } catch (err: any) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}
main();
