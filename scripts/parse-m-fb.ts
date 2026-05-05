import fs from 'fs';

const html = fs.readFileSync('m_fb_notifications.html', 'utf8');

// The mobile site usually puts notifications in basic HTML
// E.g., <div class="..."><span><b>Name</b> commented on...</span></div>
// Let's strip script and style tags to see text content
let stripped = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
stripped = stripped.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

// Look for some known notification text structures if any
// Let's just grab the text
const text = stripped.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
console.log("Text content snippet:", text.substring(0, 1000));

// Or look for specific elements that look like notification lists
const lists = html.match(/<a[^>]+href="\/notifications\/[^>]+>(.*?)<\/a>/g);
if (lists) {
    console.log("Found notification links:", lists.length);
} else {
    console.log("No notification links found using standard a href pattern.");
}
