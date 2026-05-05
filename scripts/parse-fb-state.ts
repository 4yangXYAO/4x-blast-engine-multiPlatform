import fs from 'fs';

const html = fs.readFileSync('fb_notifications.html', 'utf8');

// Try a broader search for script tags containing notif_id
const scripts = html.match(/<script.*?>(.*?)<\/script>/g);
let count = 0;
if (scripts) {
    for (const script of scripts) {
        if (script.includes('notif_id')) {
            fs.writeFileSync(`fb_state_notif_${count}.json`, script);
            console.log(`Saved notification state script to fb_state_notif_${count}.json`);
            count++;
        }
    }
}
