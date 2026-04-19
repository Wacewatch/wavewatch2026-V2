"use client"

import { Sky } from "@react-three/drei"
import type { GraphicsQuality } from "../types"
import { getGraphicsConfig } from "../constants"

interface WorldEnvironmentProps {
  worldMode: "day" | "night" | "sunset" | "christmas"
  graphicsQuality: GraphicsQuality
  isIndoors?: boolean
}

/**
 * WorldEnvironment - Handles sky, lighting, and fog based on world mode
 * Extracted from world-3d-v2.tsx for better organization
 *
 * Quality settings:
 * - High: Shadows enabled, full shadow map resolution, fog enabled
 * - Medium: No shadows, fog enabled, full lighting
 * - Low: No shadows, no fog, reduced lighting
 */
export function WorldEnvironment({ worldMode, graphicsQuality, isIndoors = false }: WorldEnvironmentProps) {
  const config = getGraphicsConfig(graphicsQuality)
  const { shadows, shadowMapSize, enableFog } = config

  // Ambient light intensity varies by quality (higher in low quality to compensate for no shadows)
  const ambientBoost = graphicsQuality === "low" ? 1.3 : graphicsQuality === "medium" ? 1.15 : 1.0

  return (
    <>
      {worldMode === "day" && (
        <>
          <Sky sunPosition={[100, 20, 100]} inclination={0.6} azimuth={0.25} />
          <ambientLight intensity={0.4 * ambientBoost} />
          <directionalLight
            position={[20, 40, 20]}
            intensity={1.5}
            castShadow={shadows}
            shadow-mapSize={shadows ? [shadowMapSize, shadowMapSize] : undefined}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-camera-near={1}
            shadow-camera-far={100}
          />
        </>
      )}

      {worldMode === "night" && (
        <>
          <Sky sunPosition={[100, -20, 100]} inclination={0.1} azimuth={0.25} />
          <ambientLight intensity={0.15 * ambientBoost} />
          <directionalLight
            position={[20, 40, 20]}
            intensity={0.3}
            color="#4466ff"
            castShadow={shadows}
            shadow-mapSize={shadows ? [shadowMapSize, shadowMapSize] : undefined}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-camera-near={1}
            shadow-camera-far={100}
          />
        </>
      )}

      {worldMode === "sunset" && (
        <>
          <Sky sunPosition={[100, 2, 100]} inclination={0.3} azimuth={0.1} />
          <ambientLight intensity={0.3 * ambientBoost} />
          <directionalLight
            position={[20, 30, 20]}
            intensity={1.0}
            color="#ff8844"
            castShadow={shadows}
            shadow-mapSize={shadows ? [shadowMapSize, shadowMapSize] : undefined}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-camera-near={1}
            shadow-camera-far={100}
          />
        </>
      )}

      {worldMode === "christmas" && (
        <>
          {/* Winter sky - cold blue tint, low sun position */}
          <Sky sunPosition={[100, 8, 100]} inclination={0.4} azimuth={0.25} />
          {/* Cool ambient light for winter atmosphere */}
          <ambientLight intensity={0.35 * ambientBoost} color="#e8f4ff" />
          {/* Main sun - softer and cooler */}
          <directionalLight
            position={[20, 35, 20]}
            intensity={0.9}
            color="#fff5e6"
            castShadow={shadows}
            shadow-mapSize={shadows ? [shadowMapSize, shadowMapSize] : undefined}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-camera-near={1}
            shadow-camera-far={100}
          />
          {/* Subtle fog for winter atmosphere - disabled indoors or when fog disabled */}
          {!isIndoors && enableFog && <fog attach="fog" args={["#d0e8ff", 30, 80]} />}
        </>
      )}

      <hemisphereLight
        intensity={(worldMode === "christmas" ? 0.4 : 0.3) * ambientBoost}
        groundColor={worldMode === "christmas" ? "#a0c4e8" : "#6b7280"}
      />
    </>
  )
}
