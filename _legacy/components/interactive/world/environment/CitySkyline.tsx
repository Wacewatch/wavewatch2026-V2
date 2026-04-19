"use client"

import { useMemo } from "react"
import * as THREE from "three"

interface CitySkylineProps {
  worldMode: "day" | "night" | "sunset" | "christmas"
  graphicsQuality: "low" | "medium" | "high"
}

// Configuration d'une montagne
interface MountainConfig {
  position: [number, number, number]
  scale: [number, number, number] // largeur base, hauteur, profondeur base
  color: string
  snowCap?: boolean // Sommet enneigé
}

// Configuration d'un petit bâtiment/chalet
interface ChaletConfig {
  position: [number, number, number]
  scale: number // Échelle uniforme
  color: string
  roofColor: string
  type: "chalet" | "house" | "barn"
}

// Couleurs des montagnes selon le mode
const MOUNTAIN_COLORS = {
  day: {
    near: ["#6b7280", "#78716c", "#71717a"], // Gris rocheux
    far: ["#9ca3af", "#a1a1aa", "#a8a29e"], // Plus clair au loin
    snow: "#f8fafc",
  },
  night: {
    near: ["#1f2937", "#292524", "#27272a"],
    far: ["#374151", "#3f3f46", "#44403c"],
    snow: "#cbd5e1",
  },
  sunset: {
    near: ["#78716c", "#6b7280", "#71717a"],
    far: ["#f97316", "#fb923c", "#fdba74"], // Teintes orangées au loin
    snow: "#fef3c7",
  },
  christmas: {
    near: ["#e2e8f0", "#d1d5db", "#e5e7eb"], // Montagnes enneigées
    far: ["#f1f5f9", "#f3f4f6", "#fafafa"],
    snow: "#ffffff",
  },
}

// Couleurs des chalets selon le mode
const CHALET_COLORS = {
  day: {
    walls: ["#d4a574", "#c9a066", "#b8956a", "#a68c5b"], // Bois clair
    roofs: ["#8b4513", "#a0522d", "#964B00", "#6b4423"], // Toits bruns/rouges
  },
  night: {
    walls: ["#78593a", "#6b4f33", "#5c442c", "#4d3925"],
    roofs: ["#3d2314", "#4a2c1a", "#382010", "#2d1810"],
  },
  sunset: {
    walls: ["#deb887", "#d4a574", "#c9a066", "#bc9158"],
    roofs: ["#a0522d", "#b8652d", "#c97030", "#8b4513"],
  },
  christmas: {
    walls: ["#f5f0e8", "#ede4d8", "#e5dac8", "#ddd0b8"], // Chalets enneigés
    roofs: ["#dc2626", "#b91c1c", "#991b1b", "#7f1d1d"], // Toits rouges de Noël
  },
}

// Générer les montagnes autour du périmètre
function generateMountains(): MountainConfig[] {
  const mountains: MountainConfig[] = []

  // ============================================================
  // MONTAGNES TRÈS LOINTAINES (visibles en LOW quality) - tout autour
  // ============================================================

  // --- NORD (z < -80) ---
  mountains.push(
    { position: [-80, 0, -90], scale: [60, 45, 40], color: "#9ca3af", snowCap: true },
    { position: [-30, 0, -100], scale: [70, 55, 45], color: "#a1a1aa", snowCap: true },
    { position: [25, 0, -95], scale: [65, 50, 42], color: "#9ca3af", snowCap: true },
    { position: [75, 0, -85], scale: [55, 42, 38], color: "#a8a29e", snowCap: true },
  )

  // --- EST (x > 80) ---
  mountains.push(
    { position: [90, 0, -50], scale: [55, 42, 40], color: "#9ca3af", snowCap: true },
    { position: [95, 0, 0], scale: [60, 48, 42], color: "#a1a1aa", snowCap: true },
    { position: [88, 0, 50], scale: [50, 38, 38], color: "#a8a29e", snowCap: true },
  )

  // --- OUEST (x < -80) ---
  mountains.push(
    { position: [-92, 0, -45], scale: [58, 44, 42], color: "#a1a1aa", snowCap: true },
    { position: [-95, 0, 10], scale: [62, 50, 45], color: "#9ca3af", snowCap: true },
    { position: [-88, 0, 55], scale: [52, 40, 38], color: "#a8a29e", snowCap: true },
  )

  // --- SUD (z > 80) ---
  mountains.push(
    { position: [-60, 0, 90], scale: [55, 40, 40], color: "#9ca3af", snowCap: true },
    { position: [0, 0, 95], scale: [65, 48, 45], color: "#a1a1aa", snowCap: true },
    { position: [60, 0, 88], scale: [50, 38, 38], color: "#a8a29e", snowCap: true },
  )

  // --- COINS (diagonales lointaines) ---
  mountains.push(
    { position: [-85, 0, -85], scale: [50, 40, 40], color: "#a8a29e", snowCap: true },
    { position: [85, 0, -85], scale: [48, 38, 38], color: "#9ca3af", snowCap: true },
    { position: [-85, 0, 85], scale: [45, 35, 35], color: "#a1a1aa", snowCap: true },
    { position: [85, 0, 85], scale: [48, 36, 36], color: "#a8a29e", snowCap: true },
  )

  // ============================================================
  // MONTAGNES MOYENNES (masquées en LOW quality)
  // ============================================================

  // --- NORD moyennes ---
  mountains.push(
    { position: [-60, 0, -60], scale: [45, 30, 35], color: "#78716c", snowCap: true },
    { position: [-15, 0, -65], scale: [50, 35, 38], color: "#6b7280", snowCap: true },
    { position: [35, 0, -58], scale: [42, 28, 32], color: "#71717a", snowCap: true },
    { position: [70, 0, -55], scale: [38, 25, 30], color: "#78716c", snowCap: false },
  )

  // --- EST moyennes ---
  mountains.push(
    { position: [65, 0, -25], scale: [40, 28, 32], color: "#78716c", snowCap: true },
    { position: [70, 0, 20], scale: [38, 25, 30], color: "#6b7280", snowCap: false },
    { position: [62, 0, 50], scale: [35, 22, 28], color: "#71717a", snowCap: false },
  )

  // --- OUEST moyennes ---
  mountains.push(
    { position: [-68, 0, -20], scale: [42, 30, 34], color: "#78716c", snowCap: true },
    { position: [-72, 0, 25], scale: [38, 26, 30], color: "#6b7280", snowCap: false },
    { position: [-65, 0, 55], scale: [36, 24, 28], color: "#71717a", snowCap: false },
  )

  // --- SUD moyennes ---
  mountains.push(
    { position: [-45, 0, 65], scale: [40, 25, 32], color: "#78716c", snowCap: false },
    { position: [10, 0, 70], scale: [45, 28, 35], color: "#6b7280", snowCap: false },
    { position: [50, 0, 62], scale: [38, 24, 30], color: "#71717a", snowCap: false },
  )

  // ============================================================
  // COLLINES PROCHES (masquées en LOW quality)
  // ============================================================

  // Nord (pas de colline au centre pour dégager la vue depuis le spawn)
  mountains.push(
    { position: [-45, 0, -42], scale: [30, 15, 25], color: "#6b7280", snowCap: false },
    { position: [50, 0, -40], scale: [28, 14, 22], color: "#71717a", snowCap: false },
  )

  // Est
  mountains.push(
    { position: [48, 0, -10], scale: [25, 12, 20], color: "#78716c", snowCap: false },
    { position: [45, 0, 35], scale: [28, 14, 22], color: "#6b7280", snowCap: false },
  )

  // Ouest
  mountains.push(
    { position: [-50, 0, -5], scale: [26, 13, 21], color: "#71717a", snowCap: false },
    { position: [-48, 0, 38], scale: [30, 15, 24], color: "#78716c", snowCap: false },
  )

  // Sud
  mountains.push(
    { position: [-30, 0, 48], scale: [28, 14, 22], color: "#6b7280", snowCap: false },
    { position: [25, 0, 50], scale: [26, 12, 20], color: "#71717a", snowCap: false },
  )

  return mountains
}

// Générer les petits chalets/maisons autour de la zone jouable
function generateChalets(): ChaletConfig[] {
  const chalets: ChaletConfig[] = []

  // Chalets au nord (entre la zone jouable et les montagnes)
  chalets.push(
    { position: [-35, 0, -35], scale: 1.2, color: "#d4a574", roofColor: "#8b4513", type: "chalet" },
    { position: [-20, 0, -38], scale: 0.9, color: "#c9a066", roofColor: "#a0522d", type: "house" },
    { position: [15, 0, -36], scale: 1.0, color: "#b8956a", roofColor: "#964B00", type: "chalet" },
    { position: [38, 0, -34], scale: 0.8, color: "#d4a574", roofColor: "#6b4423", type: "barn" },
  )

  // Chalets à l'est
  chalets.push(
    { position: [42, 0, -15], scale: 1.1, color: "#c9a066", roofColor: "#8b4513", type: "chalet" },
    { position: [45, 0, 10], scale: 0.85, color: "#a68c5b", roofColor: "#a0522d", type: "house" },
    { position: [40, 0, 32], scale: 0.95, color: "#d4a574", roofColor: "#964B00", type: "barn" },
  )

  // Chalets à l'ouest
  chalets.push(
    { position: [-42, 0, -10], scale: 1.0, color: "#b8956a", roofColor: "#6b4423", type: "chalet" },
    { position: [-45, 0, 15], scale: 0.9, color: "#c9a066", roofColor: "#8b4513", type: "house" },
    { position: [-38, 0, 35], scale: 1.15, color: "#d4a574", roofColor: "#a0522d", type: "chalet" },
  )

  // Chalets au sud
  chalets.push(
    { position: [-25, 0, 42], scale: 0.85, color: "#a68c5b", roofColor: "#964B00", type: "house" },
    { position: [5, 0, 45], scale: 1.0, color: "#b8956a", roofColor: "#8b4513", type: "barn" },
    { position: [30, 0, 40], scale: 0.95, color: "#c9a066", roofColor: "#6b4423", type: "chalet" },
  )

  return chalets
}

// Composant Montagne avec géométrie en cône
function Mountain({
  config,
  colors,
  isChristmas,
}: {
  config: MountainConfig
  colors: typeof MOUNTAIN_COLORS.day
  isChristmas: boolean
}) {
  const [x, y, z] = config.position
  const [width, height, depth] = config.scale

  // Déterminer la couleur selon la distance
  const distance = Math.sqrt(x * x + z * z)
  const colorPalette = distance > 70 ? colors.far : colors.near
  const colorIndex = Math.abs(Math.floor(x + z)) % colorPalette.length
  const mountainColor = isChristmas ? colors.snow : colorPalette[colorIndex]

  // Rotation fixe basée sur la position (pas de random pour éviter le flickering)
  const rotation = useMemo(() => ((x + z) * 0.1) % (Math.PI * 2), [x, z])

  return (
    <group position={[x, y, z]}>
      {/* Corps principal de la montagne */}
      <mesh position={[0, height / 2, 0]} rotation={[0, rotation, 0]}>
        <coneGeometry args={[width / 2, height, 6]} />
        <meshStandardMaterial
          color={mountainColor}
          roughness={0.95}
          metalness={0}
          flatShading
        />
      </mesh>

      {/* Sommet enneigé */}
      {(config.snowCap || isChristmas) && (
        <mesh position={[0, height * 0.75, 0]}>
          <coneGeometry args={[width / 5, height / 3, 6]} />
          <meshStandardMaterial
            color={colors.snow}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* Colline secondaire pour plus de volume */}
      <mesh position={[width / 4, height / 6, depth / 5]} rotation={[0, rotation + 0.5, 0]}>
        <coneGeometry args={[width / 4, height / 2.5, 5]} />
        <meshStandardMaterial
          color={mountainColor}
          roughness={0.95}
          metalness={0}
          flatShading
        />
      </mesh>
    </group>
  )
}

// Composant Chalet/Maison de montagne
function Chalet({
  config,
  colors,
  isChristmas,
}: {
  config: ChaletConfig
  colors: typeof CHALET_COLORS.day
  isChristmas: boolean
}) {
  const [x, y, z] = config.position
  const scale = config.scale

  // Sélectionner les couleurs
  const colorIndex = Math.abs(Math.floor(x + z)) % colors.walls.length
  const wallColor = colors.walls[colorIndex]
  const roofColor = isChristmas ? colors.roofs[0] : colors.roofs[colorIndex]

  const baseHeight = config.type === "barn" ? 3 : 2.5
  const baseWidth = config.type === "barn" ? 4 : 3
  const baseDepth = config.type === "barn" ? 5 : 3.5
  const roofHeight = config.type === "chalet" ? 2.5 : 2

  return (
    <group position={[x, y, z]} scale={[scale, scale, scale]}>
      {/* Corps du bâtiment */}
      <mesh position={[0, baseHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[baseWidth, baseHeight, baseDepth]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Toit en triangle */}
      <mesh
        position={[0, baseHeight + roofHeight / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <coneGeometry args={[baseDepth / 1.3, roofHeight, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.85} />
      </mesh>

      {/* Neige sur le toit en mode Noël */}
      {isChristmas && (
        <mesh position={[0, baseHeight + roofHeight / 2 + 0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
          <coneGeometry args={[baseDepth / 1.25, roofHeight * 0.3, 4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} />
        </mesh>
      )}

      {/* Cheminée */}
      {config.type !== "barn" && (
        <mesh position={[baseWidth / 4, baseHeight + roofHeight * 0.6, 0]}>
          <boxGeometry args={[0.4, 1.2, 0.4]} />
          <meshStandardMaterial color="#78716c" roughness={0.95} />
        </mesh>
      )}

      {/* Porte */}
      <mesh position={[0, 0.75, baseDepth / 2 + 0.01]}>
        <boxGeometry args={[0.8, 1.5, 0.1]} />
        <meshStandardMaterial color="#5c442c" roughness={0.9} />
      </mesh>

      {/* Fenêtres */}
      <mesh position={[baseWidth / 3, baseHeight / 2 + 0.3, baseDepth / 2 + 0.01]}>
        <boxGeometry args={[0.6, 0.6, 0.05]} />
        <meshStandardMaterial color="#87ceeb" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[-baseWidth / 3, baseHeight / 2 + 0.3, baseDepth / 2 + 0.01]}>
        <boxGeometry args={[0.6, 0.6, 0.05]} />
        <meshStandardMaterial color="#87ceeb" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  )
}

// Sapins pour l'ambiance montagne
function PineTree({ position, scale = 1, isChristmas }: { position: [number, number, number]; scale?: number; isChristmas: boolean }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Tronc */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 2, 6]} />
        <meshStandardMaterial color="#5c442c" roughness={0.95} />
      </mesh>
      {/* Feuillage en 3 couches */}
      <mesh position={[0, 3, 0]}>
        <coneGeometry args={[1.5, 3, 6]} />
        <meshStandardMaterial color={isChristmas ? "#f0fdf4" : "#166534"} roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[1.1, 2.5, 6]} />
        <meshStandardMaterial color={isChristmas ? "#f0fdf4" : "#15803d"} roughness={0.9} />
      </mesh>
      <mesh position={[0, 5.8, 0]}>
        <coneGeometry args={[0.7, 2, 6]} />
        <meshStandardMaterial color={isChristmas ? "#ffffff" : "#16a34a"} roughness={0.9} />
      </mesh>
    </group>
  )
}

// Segment de rambarde en bois
function FenceSegment({
  position,
  rotation = 0,
  length = 6
}: {
  position: [number, number, number]
  rotation?: number
  length?: number
}) {
  const woodColor = "#8B4513" // Brun bois
  const woodColorDark = "#654321" // Brun foncé pour les poteaux

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Poteau gauche */}
      <mesh position={[-length / 2, 0.6, 0]}>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color={woodColorDark} roughness={0.9} />
      </mesh>
      {/* Poteau droit */}
      <mesh position={[length / 2, 0.6, 0]}>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color={woodColorDark} roughness={0.9} />
      </mesh>
      {/* Barre horizontale haute */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[length, 0.1, 0.08]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>
      {/* Barre horizontale basse */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[length, 0.1, 0.08]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>
    </group>
  )
}

// Arche d'entrée avec barrière fermée
function EntryArch({ position }: { position: [number, number, number] }) {
  const woodColor = "#8B4513" // Brun bois
  const woodColorDark = "#654321" // Brun foncé pour les poteaux
  const metalColor = "#71717a" // Gris métal pour la barrière

  return (
    <group position={position}>
      {/* Poteau gauche de l'arche */}
      <mesh position={[-2, 1.5, 0]}>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial color={woodColorDark} roughness={0.9} />
      </mesh>
      {/* Poteau droit de l'arche */}
      <mesh position={[2, 1.5, 0]}>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial color={woodColorDark} roughness={0.9} />
      </mesh>

      {/* Barre horizontale du haut (linteau) */}
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[4.6, 0.3, 0.3]} />
        <meshStandardMaterial color={woodColor} roughness={0.85} />
      </mesh>

      {/* Petite décoration sur le linteau */}
      <mesh position={[0, 3.4, 0]}>
        <boxGeometry args={[1.5, 0.2, 0.2]} />
        <meshStandardMaterial color={woodColorDark} roughness={0.9} />
      </mesh>

      {/* Barrière fermée */}
      {/* Barre horizontale haute de la barrière */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[3.5, 0.1, 0.1]} />
        <meshStandardMaterial color={metalColor} roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Barre horizontale milieu de la barrière */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[3.5, 0.1, 0.1]} />
        <meshStandardMaterial color={metalColor} roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Barre horizontale basse de la barrière */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[3.5, 0.1, 0.1]} />
        <meshStandardMaterial color={metalColor} roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Barreaux verticaux de la barrière */}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => (
        <mesh key={`bar-${i}`} position={[x, 1.2, 0]}>
          <boxGeometry args={[0.08, 1.4, 0.08]} />
          <meshStandardMaterial color={metalColor} roughness={0.7} metalness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// Configuration des rambardes autour de la map (±28)
// Note: ouverture au niveau du chemin vers les montagnes (x ≈ 4.5, z = -28.5)
const FENCE_SEGMENTS: Array<{ pos: [number, number, number]; rotation: number; length: number }> = [
  // Bordure NORD (z = -28) - rambardes horizontales avec ouverture pour le chemin
  { pos: [-24, 0, -28.5], rotation: 0, length: 8 },
  { pos: [-14, 0, -28.5], rotation: 0, length: 8 },
  { pos: [-5, 0, -28.5], rotation: 0, length: 6 }, // Réduit pour laisser passage
  // OUVERTURE pour le chemin vers les montagnes (x ≈ 4.5)
  { pos: [14, 0, -28.5], rotation: 0, length: 6 }, // Réduit pour laisser passage
  { pos: [22, 0, -28.5], rotation: 0, length: 8 },

  // Bordure SUD (z = 28) - rambardes horizontales
  { pos: [-24, 0, 28.5], rotation: 0, length: 8 },
  { pos: [-14, 0, 28.5], rotation: 0, length: 8 },
  { pos: [-4, 0, 28.5], rotation: 0, length: 8 },
  { pos: [6, 0, 28.5], rotation: 0, length: 8 },
  { pos: [16, 0, 28.5], rotation: 0, length: 8 },
  { pos: [24, 0, 28.5], rotation: 0, length: 8 },

  // Bordure EST (x = 28) - rambardes verticales (rotation 90°)
  { pos: [28.5, 0, -24], rotation: Math.PI / 2, length: 8 },
  { pos: [28.5, 0, -14], rotation: Math.PI / 2, length: 8 },
  { pos: [28.5, 0, -4], rotation: Math.PI / 2, length: 8 },
  { pos: [28.5, 0, 6], rotation: Math.PI / 2, length: 8 },
  { pos: [28.5, 0, 16], rotation: Math.PI / 2, length: 8 },
  { pos: [28.5, 0, 24], rotation: Math.PI / 2, length: 8 },

  // Bordure OUEST (x = -28) - rambardes verticales (rotation 90°)
  { pos: [-28.5, 0, -24], rotation: Math.PI / 2, length: 8 },
  { pos: [-28.5, 0, -14], rotation: Math.PI / 2, length: 8 },
  { pos: [-28.5, 0, -4], rotation: Math.PI / 2, length: 8 },
  { pos: [-28.5, 0, 6], rotation: Math.PI / 2, length: 8 },
  { pos: [-28.5, 0, 16], rotation: Math.PI / 2, length: 8 },
  { pos: [-28.5, 0, 24], rotation: Math.PI / 2, length: 8 },
]

// Composant principal
export function CitySkyline({ worldMode, graphicsQuality }: CitySkylineProps) {
  const isChristmas = worldMode === "christmas"

  // Générer les configurations
  const mountains = useMemo(() => generateMountains(), [])
  const chalets = useMemo(() => generateChalets(), [])

  // Positions des sapins (éparpillés dans le paysage)
  const pineTreePositions = useMemo(() => [
    // Groupe nord
    [-50, 0, -38] as [number, number, number],
    [-42, 0, -40] as [number, number, number],
    [-8, 0, -42] as [number, number, number],
    [8, 0, -40] as [number, number, number],
    [48, 0, -38] as [number, number, number],
    // Groupe est
    [48, 0, -5] as [number, number, number],
    [50, 0, 20] as [number, number, number],
    [45, 0, 38] as [number, number, number],
    // Groupe ouest
    [-50, 0, -5] as [number, number, number],
    [-48, 0, 22] as [number, number, number],
    [-42, 0, 40] as [number, number, number],
    // Groupe sud
    [-35, 0, 48] as [number, number, number],
    [12, 0, 50] as [number, number, number],
    [40, 0, 46] as [number, number, number],
    // Sapins supplémentaires près des montagnes
    [-65, 0, -50] as [number, number, number],
    [-25, 0, -52] as [number, number, number],
    [30, 0, -48] as [number, number, number],
    [60, 0, -45] as [number, number, number],
  ], [])

  // Couleurs selon le mode
  const mountainColors = MOUNTAIN_COLORS[worldMode]
  const chaletColors = CHALET_COLORS[worldMode]

  // Filtrer selon la qualité graphique
  const visibleMountains = useMemo(() => {
    if (graphicsQuality === "low") {
      // En basse qualité, garder UNIQUEMENT les montagnes très lointaines (>80 unités du centre)
      return mountains.filter((m) => {
        const [x, , z] = m.position
        return Math.abs(x) > 80 || Math.abs(z) > 80
      })
    }
    return mountains
  }, [mountains, graphicsQuality])

  const visibleChalets = useMemo(() => {
    if (graphicsQuality === "low") {
      return [] // Pas de chalets en basse qualité
    }
    return chalets
  }, [chalets, graphicsQuality])

  const visibleTrees = useMemo(() => {
    if (graphicsQuality === "low") {
      return pineTreePositions.filter((_, i) => i % 3 === 0) // 1/3 des arbres
    }
    if (graphicsQuality === "medium") {
      return pineTreePositions.filter((_, i) => i % 2 === 0) // Moitié des arbres
    }
    return pineTreePositions
  }, [pineTreePositions, graphicsQuality])

  return (
    <group>
      {/* Montagnes */}
      {visibleMountains.map((config, index) => (
        <Mountain
          key={`mountain-${index}-${config.position[0]}-${config.position[2]}`}
          config={config}
          colors={mountainColors}
          isChristmas={isChristmas}
        />
      ))}

      {/* Chalets et maisons */}
      {visibleChalets.map((config, index) => (
        <Chalet
          key={`chalet-${index}-${config.position[0]}-${config.position[2]}`}
          config={config}
          colors={chaletColors}
          isChristmas={isChristmas}
        />
      ))}

      {/* Sapins */}
      {visibleTrees.map((pos, index) => (
        <PineTree
          key={`pine-${index}-${pos[0]}-${pos[2]}`}
          position={pos}
          scale={0.8 + ((Math.abs(pos[0] + pos[2]) * 7) % 10) / 25}
          isChristmas={isChristmas}
        />
      ))}

      {/* Rambardes en bois autour des limites de la map */}
      {FENCE_SEGMENTS.map((fence, index) => (
        <FenceSegment
          key={`fence-${index}-${fence.pos[0]}-${fence.pos[2]}`}
          position={fence.pos}
          rotation={fence.rotation}
          length={fence.length}
        />
      ))}

      {/* Arche d'entrée avec barrière fermée - à l'ouverture du chemin vers les montagnes */}
      <EntryArch position={[4.7, 0, -28.5]} />
    </group>
  )
}
