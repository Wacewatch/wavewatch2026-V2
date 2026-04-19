// Audio management for the Interactive World (Disco)
// These are global singleton states that persist across component re-renders

import { DEFAULT_DISCO_STREAM_URLS, DEFAULT_DISCO_VOLUME } from './constants'

// Global audio context and analyser for disco
export let discoAudioContext: AudioContext | null = null
export let discoAnalyser: AnalyserNode | null = null
export let discoAudioElement: HTMLAudioElement | null = null
export let discoFrequencyData: Uint8Array | null = null
export let discoSourceConnected = false

// Global flag to track if audio has been initialized
export let discoAudioInitializedGlobal = false

// Global disco stream URLs (loaded from database)
export let globalDiscoStreamUrls: string[] = [...DEFAULT_DISCO_STREAM_URLS]
export let globalDiscoVolume = DEFAULT_DISCO_VOLUME
export let globalDiscoIsOpen = true
export let globalArcadeIsOpen = true

// Setters for global state
export function setDiscoAudioContext(ctx: AudioContext | null) {
  discoAudioContext = ctx
}

export function setDiscoAnalyser(analyser: AnalyserNode | null) {
  discoAnalyser = analyser
}

export function setDiscoAudioElement(element: HTMLAudioElement | null) {
  discoAudioElement = element
}

export function setDiscoFrequencyData(data: Uint8Array | null) {
  discoFrequencyData = data
}

export function setDiscoSourceConnected(connected: boolean) {
  discoSourceConnected = connected
}

export function setDiscoAudioInitializedGlobal(initialized: boolean) {
  discoAudioInitializedGlobal = initialized
}

export function setGlobalDiscoStreamUrls(urls: string[]) {
  globalDiscoStreamUrls = urls
}

export function setGlobalDiscoVolume(volume: number) {
  globalDiscoVolume = volume
}

export function setGlobalDiscoIsOpen(isOpen: boolean) {
  globalDiscoIsOpen = isOpen
}

export function setGlobalArcadeIsOpen(isOpen: boolean) {
  globalArcadeIsOpen = isOpen
}

// Helper function to get frequency data for visualizers
export function getDiscoFrequencyData(): Uint8Array | null {
  if (discoAnalyser && discoFrequencyData) {
    discoAnalyser.getByteFrequencyData(discoFrequencyData)
    return discoFrequencyData
  }
  return null
}

// Helper function to check if disco audio is playing
export function isDiscoAudioPlaying(): boolean {
  return discoAudioElement !== null && !discoAudioElement.paused
}

// Helper function to set disco volume
export function setDiscoVolume(volume: number) {
  if (discoAudioElement) {
    discoAudioElement.volume = Math.max(0, Math.min(1, volume / 100))
  }
}

// Helper function to mute/unmute disco audio
export function setDiscoMuted(muted: boolean) {
  if (discoAudioElement) {
    discoAudioElement.volume = muted ? 0 : (globalDiscoVolume / 100)
  }
  // Also store in window for other components to access
  if (typeof window !== 'undefined') {
    (window as typeof window & { discoMuted?: boolean }).discoMuted = muted
  }
}

// Cleanup function to stop disco audio
export function cleanupDiscoAudio() {
  if (discoAudioElement) {
    discoAudioElement.pause()
    discoAudioElement.src = ''
  }
  if (discoAudioContext && discoAudioContext.state !== 'closed') {
    discoAudioContext.close().catch(() => {})
  }
  discoAudioContext = null
  discoAnalyser = null
  discoAudioElement = null
  discoFrequencyData = null
  discoSourceConnected = false
  discoAudioInitializedGlobal = false
}
