#!/usr/bin/env ts-node
import { getNotifications } from '../src/adapters/providers/meta/facebook/facebook-notif'

async function main() {
  const cookieString = process.argv[2]
  try {
    const notifs = await getNotifications(cookieString, 2, false)
  } catch (e: any) {
    console.error(e)
  }
}
main()
