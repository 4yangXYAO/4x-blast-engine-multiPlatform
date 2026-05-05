import fs from 'fs';

const html = fs.readFileSync('fb_search_posts.html', 'utf8');

// Look for post_id and text
const postIds = [...new Set(Array.from(html.matchAll(/"post_id":"([0-9]+)"/g)).map(m => m[1]))];
console.log('Post IDs found:', postIds.slice(0, 5));

const urls = [...new Set(Array.from(html.matchAll(/"url":"(https:\\\/\\\/www\.facebook\.com\\\/[^"]+)"/g)).map(m => m[1].replace(/\\\//g, '/')))];
const postUrls = urls.filter(u => u.includes('/posts/') || u.includes('/permalink/')).slice(0, 5);
console.log('Post URLs found:', postUrls);

const texts = Array.from(html.matchAll(/"text":"(.*?)"/g)).map(m => m[1]);
// filter out short or irrelevant texts
const relevantTexts = texts.filter(t => t.toLowerCase().includes('joki') && t.length > 20);
console.log('Relevant Texts:', relevantTexts.slice(0, 3));

