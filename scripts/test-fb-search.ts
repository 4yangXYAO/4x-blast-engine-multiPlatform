#!/usr/bin/env ts-node
/**
 * Test script for Facebook Finder GraphQL search
 * Usage:
 *   ts-node scripts/test-fb-search.ts '<cookies-string>' [search-term] [limit]
 *
 * Examples:
 *   # Default search term "jual beli" with limit 30
 *   ts-node scripts/test-fb-search.ts 'c_user=12345; xs=abc123; datr=xyz'
 *
 *   # Custom search term
 *   ts-node scripts/test-fb-search.ts 'c_user=12345; xs=abc123; datr=xyz' 'jual mobil'
 *
 *   # Custom search term and limit
 *   ts-node scripts/test-fb-search.ts 'c_user=12345; xs=abc123; datr=xyz' 'jual mobil' 50
 */

import { findFacebookTargets } from '../src/adapters/providers/meta/facebook/facebook-finder'

async function main() {
  const cookieString = process.argv[2]
  const searchTerm = process.argv[3] || 'jual beli'
  const limitStr = process.argv[4]
  const limit = limitStr ? parseInt(limitStr, 10) : 30

  if (!cookieString) {
    console.error('❌ Error: Please provide Facebook cookies as argument')
    console.error('')
    console.error('Usage:')
    console.error('  ts-node scripts/test-fb-search.ts \'<cookies-string>\' [search-term] [limit]')
    console.error('')
    console.error('Examples:')
    console.error('  # Default search for "jual beli":')
    console.error(
      "  ts-node scripts/test-fb-search.ts 'c_user=12345; xs=abc123; datr=xyz'"
    )
    console.error('')
    console.error('  # Custom search term:')
    console.error(
      "  ts-node scripts/test-fb-search.ts 'c_user=12345; xs=abc123; datr=xyz' 'jual mobil' 50"
    )
    process.exit(1)
  }

  try {
    console.log('🔍 Facebook Finder GraphQL Search Test')
    console.log('━'.repeat(50))
    console.log(`📝 Search term: "${searchTerm}"`)
    console.log(`📊 Limit: ${limit}`)
    console.log(`🍪 Cookie provided: ${cookieString.length} chars`)
    console.log('━'.repeat(50))
    console.log('')

    console.log('⏳ Searching Facebook for targets...')
    const result = await findFacebookTargets(searchTerm, cookieString, limit)

    console.log('✅ Search completed successfully!')
    console.log('')
    console.log('📊 Results:')
    console.log(`  • Post IDs found: ${result.postIds.length}`)
    console.log(`  • User IDs found: ${result.userIds.length}`)
    console.log('')

    if (result.postIds.length > 0) {
      console.log('📌 Post IDs (first 5):')
      result.postIds.slice(0, 5).forEach((id, idx) => {
        console.log(`    ${idx + 1}. ${id}`)
      })
      if (result.postIds.length > 5) {
        console.log(`    ... and ${result.postIds.length - 5} more`)
      }
      console.log('')
    }

    if (result.userIds.length > 0) {
      console.log('👤 User IDs (first 5):')
      result.userIds.slice(0, 5).forEach((id, idx) => {
        console.log(`    ${idx + 1}. ${id}`)
      })
      if (result.userIds.length > 5) {
        console.log(`    ... and ${result.userIds.length - 5} more`)
      }
      console.log('')
    }

    if (result.postIds.length === 0 && result.userIds.length === 0) {
      console.log('⚠️  No targets found - may have fallen back to targets.txt')
      console.log('')
    }

    console.log('━'.repeat(50))
    console.log('✨ Test completed successfully')
  } catch (error: any) {
    console.error('')
    console.error('❌ Error during search:')
    console.error(`   ${error?.message || String(error)}`)
    console.error('')
    if (error?.stack) {
      console.error('Stack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main()
