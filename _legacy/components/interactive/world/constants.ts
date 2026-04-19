// Constants for the Interactive World

import { CollisionZone, WorldSettings } from './types'

// ========== SPAWN POSITIONS ==========
export const DEFAULT_SPAWN_POSITION = { x: 4.5, y: -0.35, z: -27 }
export const DEFAULT_ROTATION = 0 // Face buildings

// ========== DEFAULT AVATAR STYLE ==========
export const DEFAULT_AVATAR_STYLE = {
  bodyColor: "#3b82f6",
  headColor: "#fbbf24",
  hairStyle: "short",
  hairColor: "#1f2937",
  skinTone: "#fbbf24",
  accessory: "none",
  faceSmiley: "😊",
}

// ========== DEFAULT WORLD SETTINGS ==========
export const DEFAULT_WORLD_SETTINGS: WorldSettings = {
  maxCapacity: 100,
  worldMode: "day",
  voiceChatEnabled: false,
  playerInteractionsEnabled: true,
  showStatusBadges: true,
  enableChat: true,
  enableEmojis: true,
  enableJumping: true,
}

// ========== COLLISION ZONES ==========
// ID format: TYPE_NUMBER (ex: BLDG_1, TREE_1, LAMP_1, BUSH_1)
// Pour déplacer un élément, modifie les valeurs x et z correspondantes
// lowQuality: false = visible en toutes qualités, true = masqué en qualité basse
// NOTE: Collisions retirées pour buissons, bancs, arbres et sapin pour alléger le rendu
export const ALL_COLLISION_ZONES: CollisionZone[] = [
  // ========== BÂTIMENTS (toujours visibles) ==========
  { id: "BLDG_CINEMA", x: 15, z: 0, width: 9, depth: 9, label: "Cinéma", color: "#ef4444", lowQuality: false },
  { id: "BLDG_ARCADE", x: 0, z: 15, width: 10, depth: 10, label: "Arcade", color: "#8b5cf6", lowQuality: false },
  { id: "BLDG_STADIUM", x: 25, z: -15, width: 12, depth: 10, label: "Stade", color: "#22c55e", lowQuality: false },
  { id: "BLDG_DISCO", x: -15, z: -20, width: 10, depth: 8, label: "Discothèque", color: "#ec4899", lowQuality: false },
  // Bâtiments décoratifs (collision active mais pas d'interaction)
  { id: "BLDG_2", x: -15, z: 5, width: 5, depth: 4, label: "Bâtiment Bleu", color: "#0ea5e9", lowQuality: false },
  { id: "BLDG_3", x: -15, z: -8, width: 4, depth: 4, label: "Bâtiment Orange", color: "#f59e0b", lowQuality: false },

  // ========== ARBRES (collision retirée pour performance) ==========
  // Les arbres restent visibles mais sans collision

  // ========== LAMPADAIRES (collision retirée pour performance) ==========
  // Les lampadaires restent visibles mais sans collision

  // ========== BANCS (collision retirée pour performance) ==========
  // Les bancs restent visibles mais sans collision

  // ========== BUISSONS (collision retirée pour performance) ==========
  // Les buissons restent visibles mais sans collision

  // ========== SAPIN DE NOËL (collision retirée pour performance) ==========
  // Le sapin reste visible mais sans collision
]

// ========== DISCO COLLISION ZONES ==========
export const DISCO_COLLISION_ZONES: CollisionZone[] = [
  // DJ booth (table centrale au fond)
  { x: 0, z: -12, width: 7, depth: 3 },
  // Bar area (côté droit)
  { x: 16, z: 5, width: 4, depth: 9 },
  // Enceintes gauche
  { x: -18, z: -10, width: 3, depth: 3 },
  // Enceintes droite
  { x: 18, z: -10, width: 3, depth: 3 },
  // Mur du fond (derrière les écrans)
  { x: 0, z: -17, width: 40, depth: 1 },
  // Mur gauche
  { x: -20, z: 0, width: 1, depth: 35 },
  // Mur droit
  { x: 20, z: 0, width: 1, depth: 35 },
]

// ========== TREE POSITIONS ==========
export const TREE_POSITIONS_LOW_QUALITY: [number, number][] = [
  [-24.1, -13.4],
  [15, -15],
]

export const TREE_POSITIONS_FULL: [number, number][] = [
  [-24.1, -13.4],
  [-6.1, -25.2],
  [15, -15],
  [-18, 10],
  [18, 10],
  [-10, 15],
  [10, 15],
]

// ========== LAMPPOST POSITIONS ==========
export const LAMPPOST_POSITIONS_LOW_QUALITY: [number, number][] = [
  [0, -10],
]

export const LAMPPOST_POSITIONS_FULL: [number, number][] = [
  [-10, -10],
  [0, -10],
  [10, -10],
  [-10, 10],
  [10, 10],
]

// ========== BENCH POSITIONS ==========
export const BENCH_POSITIONS: number[] = [-12, 12]

// ========== BUSH POSITIONS ==========
export const BUSH_POSITIONS: [number, number][] = [
  [5, -10],
  [-5, -10],
  [10, 5],
  [-10, 5],
  [12, -5],
  [-12, -5],
]

// ========== CHRISTMAS TREE POSITION ==========
export const CHRISTMAS_TREE_POSITION: [number, number, number] = [0, 0, -8]
export const CHRISTMAS_TREE_SCALE = 1.5

// ========== DISCO AUDIO DEFAULTS ==========
export const DEFAULT_DISCO_STREAM_URLS: string[] = [
  'https://stream.nightride.fm/nightride.m4a',
  'https://stream.nightride.fm/chillsynth.m4a',
  'https://ice1.somafm.com/groovesalad-128-mp3',
  'https://ice1.somafm.com/spacestation-128-mp3',
]
export const DEFAULT_DISCO_VOLUME = 70

// ========== QUICK EMOJIS ==========
export const QUICK_EMOJIS = ["😀", "😂", "😍", "🎉", "👍", "👋", "🔥", "💯"]

// ========== TIMING CONSTANTS ==========
export const CHAT_BUBBLE_DURATION = 5000 // 5 seconds
export const PLAYER_REFRESH_INTERVAL = 5000 // 5 seconds
export const HEARTBEAT_INTERVAL = 10000 // 10 seconds
export const AFK_TIMEOUT = 3 * 60 * 60 * 1000 // 3 hours in milliseconds
export const AFK_CHECK_INTERVAL = 60000 // 1 minute
export const DB_UPDATE_THROTTLE = 100 // 100ms minimum between DB updates

// ========== ANIMATION CONSTANTS ==========
export const WALK_ANIMATION_SPEED = 4
export const LEG_SWING_AMPLITUDE = 0.4
export const ARM_SWING_AMPLITUDE = 0.25
export const JUMP_HEIGHT = 2
export const JUMP_DURATION = 400 // ms

// ========== CAMERA CONSTANTS ==========
export const FPS_CAMERA_SENSITIVITY = 0.002
export const DEFAULT_CAMERA_DISTANCE = 15
export const MIN_CAMERA_DISTANCE = 5
export const MAX_CAMERA_DISTANCE = 30

// ========== MOVEMENT CONSTANTS ==========
export const PLAYER_SPEED = 0.15
export const MOBILE_JOYSTICK_SPEED_MULTIPLIER = 1

// ========== UI CONSTANTS ==========
export const NAMEPLATE_DISTANCE_FACTOR = 8
export const MAX_CHAT_MESSAGE_WIDTH = 200

// ========== GRAPHICS QUALITY SETTINGS ==========
export type GraphicsQuality = "low" | "medium" | "high"

// Configuration détaillée pour chaque niveau de qualité
export interface GraphicsQualityConfig {
  shadows: boolean
  shadowMapSize: number
  antialias: boolean
  maxPointLights: number
  enableFog: boolean
  enableParticles: boolean
  enableAnimatedLights: boolean
  powerPreference: "default" | "high-performance" | "low-power"
}

export const GRAPHICS_QUALITY_CONFIGS: Record<GraphicsQuality, GraphicsQualityConfig> = {
  low: {
    shadows: false,
    shadowMapSize: 512,
    antialias: false,
    maxPointLights: 4,
    enableFog: false,
    enableParticles: false,
    enableAnimatedLights: false,
    powerPreference: "low-power",
  },
  medium: {
    shadows: false,
    shadowMapSize: 1024,
    antialias: true,
    maxPointLights: 8,
    enableFog: true,
    enableParticles: false,
    enableAnimatedLights: true,
    powerPreference: "default",
  },
  high: {
    shadows: true,
    shadowMapSize: 2048,
    antialias: true,
    maxPointLights: 16,
    enableFog: true,
    enableParticles: true,
    enableAnimatedLights: true,
    powerPreference: "high-performance",
  },
}

export const getGraphicsConfig = (quality: GraphicsQuality): GraphicsQualityConfig => {
  return GRAPHICS_QUALITY_CONFIGS[quality]
}

export const getCollisionZonesForQuality = (quality: GraphicsQuality): CollisionZone[] => {
  if (quality === "low") {
    return ALL_COLLISION_ZONES.filter(zone => !zone.lowQuality)
  }
  return ALL_COLLISION_ZONES
}

export const getTreePositionsForQuality = (quality: GraphicsQuality): [number, number][] => {
  if (quality === "low") {
    return TREE_POSITIONS_LOW_QUALITY
  }
  return TREE_POSITIONS_FULL
}

export const getLamppostPositionsForQuality = (quality: GraphicsQuality): [number, number][] => {
  if (quality === "low") {
    return LAMPPOST_POSITIONS_LOW_QUALITY
  }
  return LAMPPOST_POSITIONS_FULL
}
