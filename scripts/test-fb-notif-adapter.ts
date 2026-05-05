#!/usr/bin/env ts-node
import { getNotifications } from '../src/adapters/providers/meta/facebook/facebook-notif'

async function main() {
  const cookieString = process.argv[2]
  if (!cookieString) {
    console.error('Provide cookies as argument')
    process.exit(1)
  }

  try {
    console.log('Fetching top 10 notifications via adapter...')
    const notifs = await getNotifications(cookieString, 10, false)
    console.log(`Found ${notifs.length} notifications:`)
    notifs.forEach((n, idx) => {
      const unreadTag = n.isUnread ? '🟢 [UNREAD]' : '⚪ [READ]'
      console.log(`\n[${idx+1}] ${unreadTag} ${n.title}`)
      console.log(`    URL: ${n.url}`)
      console.log(`    Time: ${new Date(n.creationTime * 1000).toLocaleString()}`)
    })
  } catch (e: any) {
    console.error('Failed:', e?.message || e)
  }
}
main()
