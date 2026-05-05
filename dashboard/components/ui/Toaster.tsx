'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster({ position = 'top-right', theme = 'dark', ...props }: { position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'; theme?: 'dark' | 'light' | 'system' }) {
  return <SonnerToaster position={position} theme={theme} {...props} />
}

export { toast } from 'sonner'

export default Toaster
