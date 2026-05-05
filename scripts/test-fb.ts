#!/usr/bin/env ts-node
/**
 * Test script for FacebookCookieAdapter
 * Usage:
 *   ts-node scripts/test-fb.ts '<cookies-json-array>'
 *
 * Example with JSON array of cookies:
 *   ts-node scripts/test-fb.ts '[{"name":"c_user","value":"12345"},{"name":"xs","value":"abc123"},{"name":"csrftoken","value":"token123"}]'
 *
 * Or with plain cookie string:
 *   ts-node scripts/test-fb.ts 'c_user=12345; xs=abc123; csrftoken=token123'
 */
import { FacebookCookieAdapter } from '../src/adapters/providers/meta/facebook/facebook-cookies'

async function main() {
  const cookieInput = process.argv[2]

  if (!cookieInput) {
    console.error('❌ Error: Please provide cookies as argument')
    console.error('')
    console.error('Usage:')
    console.error('  JSON array:   ts-node scripts/test-fb.ts \'[{"name":"c_user","value":"123"}]\'')
    console.error('  Plain string: ts-node scripts/test-fb.ts \'c_user=123; xs=token\'')
    process.exit(1)
  }

  try {
    console.log('🔍 Initializing FacebookCookieAdapter...')
    const adapter = new FacebookCookieAdapter(cookieInput, {
      logger: (msg: string) => console.log(`[FB-ADAPTER] ${msg}`),
    })

    console.log('🔗 Connecting to Facebook...')
    await adapter.connect()
    console.log('✅ Connected successfully')

    console.log('\n📤 Sending test message to Facebook page...')
    const testMessage = `Test message from joki-blast-engine - ${new Date().toISOString()}`
    const result = await adapter.sendMessage('page', testMessage)

    if (result.success) {
      console.log('✅ Message sent successfully')
      console.log(`   Response:`, result)
    } else {
      console.error('❌ Message failed to send')
      console.error(`   Error: ${result.error}`)
      console.error(`   Code: ${result.code}`)
    }

    console.log('\n🔌 Disconnecting...')
    await adapter.disconnect()
    console.log('✅ Disconnected')

    process.exit(result.success ? 0 : 1)
  } catch (error: any) {
    console.error('❌ Fatal error:')
    console.error(`   ${error?.message ?? String(error)}`)
    console.error('\nFull error:')
    console.error(error)
    process.exit(1)
  }
}

main()
