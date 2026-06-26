import type { BlastPlatform } from '../types'
import type { PlatformCapabilities, PlatformProvider } from './types'
import { facebookProvider } from './facebook-provider'
import { instagramProvider } from './instagram-provider'
import { threadsProvider } from './threads-provider'
import { twitterProvider } from './twitter-provider'
import { whatsappSendMessage } from '../actions/whatsapp-send'
import { telegramSendMessage } from '../actions/telegram-send'

const whatsappCapabilities: PlatformCapabilities = {
  authType: 'cookie',
  supportsFeed: false,
  supportsKeyword: false,
  supportsManualTargets: true,
  supportsDM: true,
  supportsLike: false,
  defaultAction: 'chat',
  recommendedMaxActions: 10,
  preferDirectConnection: true,
  maturity: 'beta',
}

const telegramCapabilities: PlatformCapabilities = {
  authType: 'cookie',
  supportsFeed: false,
  supportsKeyword: false,
  supportsManualTargets: true,
  supportsDM: true,
  supportsLike: false,
  defaultAction: 'chat',
  recommendedMaxActions: 10,
  preferDirectConnection: true,
  maturity: 'experimental',
}

const whatsappProvider: PlatformProvider = {
  platform: 'whatsapp',
  capabilities: whatsappCapabilities,
  requiredCookieNames: () => [],
  validateSession: () => ({ ok: true }),
  async findTargets() {
    return []
  },
  async execute(_action, targetId, message) {
    return whatsappSendMessage(targetId, message)
  },
  resolveAction: () => 'chat',
}

const telegramProvider: PlatformProvider = {
  platform: 'telegram',
  capabilities: telegramCapabilities,
  requiredCookieNames: () => [],
  validateSession: () => ({ ok: true }),
  async findTargets() {
    return []
  },
  async execute(_action, targetId, message) {
    return telegramSendMessage(targetId, message)
  },
  resolveAction: () => 'chat',
}

const REGISTRY: Record<BlastPlatform, PlatformProvider> = {
  facebook: facebookProvider,
  instagram: instagramProvider,
  threads: threadsProvider,
  twitter: twitterProvider,
  whatsapp: whatsappProvider,
  telegram: telegramProvider,
}

export function getPlatformProvider(platform: BlastPlatform): PlatformProvider {
  const provider = REGISTRY[platform]
  if (!provider) throw new Error(`No provider for platform: ${platform}`)
  return provider
}

export function listPlatformProviders(): PlatformProvider[] {
  return Object.values(REGISTRY)
}

export {
  facebookProvider,
  instagramProvider,
  threadsProvider,
  twitterProvider,
  whatsappProvider,
  telegramProvider,
}
