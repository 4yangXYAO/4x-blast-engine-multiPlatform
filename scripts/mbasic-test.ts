import axios from 'axios';

// Parse raw JSON or string cookies
function parseCookies(raw: string): string {
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      return arr.map((c: any) => `${c.name}=${c.value}`).join('; ');
    } catch (e) {
      return raw;
    }
  }
  return raw;
}

async function getNotifications(cookieHeader: string) {
  try {
    console.log('Fetching notifications from mbasic...');
    const res = await axios.get('https://mbasic.facebook.com/notifications', {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
      }
    });
    
    const html = res.data as string;
    
    // Look for notifications
    // In mbasic, unread notifications often have a specific style or are inside a table/div
    // Let's just grab the text of the first few links inside the notifications container
    const notifMatches = html.match(/<td valign="top" align="left">(.*?)<\/td>/g);
    
    if (notifMatches && notifMatches.length > 0) {
      console.log(`Found ${notifMatches.length} notification items.`);
      for (let i = 0; i < Math.min(5, notifMatches.length); i++) {
        // Strip HTML tags
        let text = notifMatches[i].replace(/<[^>]+>/g, '').trim();
        console.log(`- ${text}`);
      }
    } else {
      console.log('Could not parse notifications via standard regex. Here is a snippet of the page:');
      console.log(html.substring(0, 1000)); // Just print the title/header to see if logged in
      
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      console.log('Page Title:', titleMatch ? titleMatch[1] : 'Unknown');
    }
    
  } catch (err: any) {
    console.error('Error fetching notifications:', err.message);
  }
}

async function searchFacebook(cookieHeader: string, query: string) {
  try {
    console.log(`\nSearching for "${query}" on mbasic...`);
    const res = await axios.get(`https://mbasic.facebook.com/search/?query=${encodeURIComponent(query)}`, {
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
      }
    });
    
    const html = res.data as string;
    
    // Look for search results. Usually inside divs with specific classes or links
    const resultLinks = html.match(/<a href="([^"]+)"><span>([^<]+)<\/span><\/a>/g) || html.match(/<a[^>]+href="\/profile\.php\?id=[^>]+>(.*?)<\/a>/g);
    
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    console.log('Search Page Title:', titleMatch ? titleMatch[1] : 'Unknown');
    
    if (html.includes('class="bz"')) {
        console.log("Search page loaded successfully.");
    }
    
    // Print snippet to analyze search result DOM
    const snippetIndex = html.indexOf('id="browse_result_area"');
    if (snippetIndex > -1) {
        console.log("Found result area:");
        // Just extract plain text from result area
        const resultArea = html.substring(snippetIndex, snippetIndex + 2000).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        console.log(resultArea.substring(0, 500) + '...');
    }

  } catch (err: any) {
    console.error('Error searching:', err.message);
  }
}

async function main() {
  const cookieInput = process.argv[2];
  if (!cookieInput) {
    console.error('Please provide cookies');
    process.exit(1);
  }
  
  const cookieHeader = parseCookies(cookieInput);
  await getNotifications(cookieHeader);
  await searchFacebook(cookieHeader, 'jual beli');
}

main();