import { createHttpClient, parseCookies } from '../src/utils/http-client';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function main() {
  const cookieInput = process.argv[2];
  if (!cookieInput) {
    console.log('Provide cookie json');
    return;
  }
  const cookies = parseCookies(cookieInput);
  
  const client = createHttpClient({
    baseURL: 'https://mbasic.facebook.com',
    headers: {
      'Cookie': cookies,
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    }
  });

  // 1. Go to messages to see if we can read DMs
  console.log('Fetching /messages...');
  const msgRes = await client.get('/messages/');
  fs.writeFileSync('mbasic_messages.html', msgRes?.data || '');
  
  const $ = cheerio.load(msgRes?.data || '');
  console.log('Page Title:', $('title').text());
  
  // Extract unread messages
  const unreadMessages: any[] = [];
  $('table').each((i, el) => {
    // If a table row has a link to /messages/read/
    const links = $(el).find('a[href^="/messages/read/"]');
    if (links.length > 0) {
      const name = links.text();
      const href = links.attr('href');
      // In mbasic, unread usually has strong tag or specific structure, let's just dump the text
      const snippet = $(el).text();
      unreadMessages.push({ name, href, snippet });
    }
  });
  console.log('Messages Found:', unreadMessages.slice(0, 3));
}

main().catch(console.error);
