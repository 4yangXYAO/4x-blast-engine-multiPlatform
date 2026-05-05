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
    // First, let's grab the homepage to get fb_dtsg and lsd
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

    console.log('Fetching homepage for tokens...');
    const res = await client.get('/');
    const html = res.data as string;
    
    let fb_dtsg = '';
    const dtsgMatch = html.match(/"DTSGInitialData",\[\],\{"token":"([^"]+)"\}/);
    if (dtsgMatch) {
      fb_dtsg = dtsgMatch[1];
    } else {
        const fallbackMatch = html.match(/"name":"fb_dtsg","value":"([^"]+)"/);
        if (fallbackMatch) fb_dtsg = fallbackMatch[1];
    }
    
    let lsd = '';
    const lsdMatch = html.match(/"LSD",\[\],\{"token":"([^"]+)"\}/);
    if (lsdMatch) {
      lsd = lsdMatch[1];
    }

    console.log(`fb_dtsg: ${fb_dtsg}, lsd: ${lsd}`);

    if (!fb_dtsg) {
      console.error('Could not find fb_dtsg');
      return;
    }

    // Now test standard CometNotificationsDropdownQuery
    const docId = '27180281571556607'; // Older common ID, let's see if it works, or we will get a missing document error

    const variables = JSON.stringify({
      "count": 5,
      "environment": "MAIN_SURFACE",
      "menuUseEntryPoint": true,
      "scale": 1
    });

    const data = new URLSearchParams();
    data.append('fb_dtsg', fb_dtsg);
    data.append('lsd', lsd);
    data.append('variables', variables);
    data.append('doc_id', docId);

    console.log('Sending GraphQL request for notifications...');
    const gqlRes = await client.post('/api/graphql/', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-FB-Friendly-Name': 'CometNotificationsDropdownQuery',
        'X-ASBD-ID': '129477'
      }
    });

    console.log('Response:', JSON.stringify(gqlRes.data, null, 2));

  } catch (err: any) {
    if (err.response) {
      console.error('Response Error:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
  }
}
main();
