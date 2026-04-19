"use client"

import { X, Crown, RotateCcw } from "lucide-react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Suspense } from "react"

interface AvatarStyle {
  skinTone: string
  bodyColor: string
  hairStyle: string
  hairColor: string
  faceSmiley: string
  accessory: string
}

interface CustomizationOption {
  category: string
  value: string
  label: string
  is_premium: boolean
}

interface UserProfile {
  is_vip?: boolean
  is_vip_plus?: boolean
  is_admin?: boolean
}

interface AvatarCustomizerProps {
  myAvatarStyle: AvatarStyle
  saveAvatarStyle: (style: AvatarStyle) => void
  customizationOptions: CustomizationOption[]
  userProfile: UserProfile | null
  onClose: () => void
}

// Composant de prévisualisation 3D de l'avatar
function AvatarPreview3D({ avatarStyle }: { avatarStyle: AvatarStyle }) {
  const style = {
    bodyColor: avatarStyle?.bodyColor || "#3b82f6",
    skinTone: avatarStyle?.skinTone || "#fbbf24",
    hairStyle: avatarStyle?.hairStyle || "short",
    hairColor: avatarStyle?.hairColor || "#1f2937",
    accessory: avatarStyle?.accessory || "none",
  }

  return (
    <group position={[0, -1.1, 0]}>
      {/* Torso */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[0.5, 0.6, 0.3]} />
        <meshStandardMaterial color={style.bodyColor} />
      </mesh>

      {/* Head */}
      <mesh castShadow position={[0, 1.8, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={style.skinTone} />
      </mesh>

      {/* Hair - Short */}
      {style.hairStyle === "short" && (
        <mesh castShadow position={[0, 2.05, 0]}>
          <boxGeometry args={[0.42, 0.15, 0.42]} />
          <meshStandardMaterial color={style.hairColor} />
        </mesh>
      )}

      {/* Hair - Long */}
      {style.hairStyle === "long" && (
        <>
          <mesh castShadow position={[0, 2.05, 0]}>
            <boxGeometry args={[0.42, 0.15, 0.42]} />
            <meshStandardMaterial color={style.hairColor} />
          </mesh>
          <mesh castShadow position={[0, 1.7, -0.2]}>
            <boxGeometry args={[0.42, 0.5, 0.1]} />
            <meshStandardMaterial color={style.hairColor} />
          </mesh>
        </>
      )}

      {/* Left Arm */}
      <mesh castShadow position={[-0.35, 1.2, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={style.skinTone} />
      </mesh>

      {/* Right Arm */}
      <mesh castShadow position={[0.35, 1.2, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={style.skinTone} />
      </mesh>

      {/* Left Leg */}
      <mesh castShadow position={[-0.15, 0.65, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color={style.bodyColor} />
      </mesh>

      {/* Right Leg */}
      <mesh castShadow position={[0.15, 0.65, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color={style.bodyColor} />
      </mesh>

      {/* ========== ACCESSOIRES ========== */}

      {/* Chapeau */}
      {style.accessory === "hat" && (
        <mesh castShadow position={[0, 2.25, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.15, 16]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      )}

      {/* Lunettes */}
      {style.accessory === "glasses" && (
        <group position={[0, 1.85, 0.22]}>
          <mesh>
            <boxGeometry args={[0.35, 0.08, 0.02]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh position={[-0.1, 0, 0.01]}>
            <boxGeometry args={[0.12, 0.06, 0.01]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} />
          </mesh>
          <mesh position={[0.1, 0, 0.01]}>
            <boxGeometry args={[0.12, 0.06, 0.01]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.3} />
          </mesh>
        </group>
      )}

      {/* Lunettes de soleil */}
      {style.accessory === "sunglasses" && (
        <group position={[0, 1.85, 0.22]}>
          <mesh>
            <boxGeometry args={[0.38, 0.1, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-0.1, 0, 0.01]}>
            <boxGeometry args={[0.14, 0.08, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0.1, 0, 0.01]}>
            <boxGeometry args={[0.14, 0.08, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* Casquette */}
      {style.accessory === "cap" && (
        <group position={[0, 2.1, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <mesh castShadow position={[0, -0.02, 0.2]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.3, 0.02, 0.15]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      )}

      {/* Casque Audio */}
      {style.accessory === "headphones" && (
        <group position={[0, 1.95, 0]}>
          <mesh castShadow position={[0, 0.15, 0]}>
            <torusGeometry args={[0.22, 0.03, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <mesh castShadow position={[-0.25, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh castShadow position={[0.25, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      )}

      {/* Couronne Admin */}
      {style.accessory === "admin_crown" && (
        <group position={[0, 2.2, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.22, 0.12, 6]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={`preview-crown-${i}`} castShadow position={[Math.cos((i * Math.PI * 2) / 6) * 0.18, 0.12, Math.sin((i * Math.PI * 2) / 6) * 0.18]}>
              <coneGeometry args={[0.04, 0.12, 4]} />
              <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>
      )}

      {/* Couronne VIP+ */}
      {style.accessory === "vip_plus_crown" && (
        <group position={[0, 2.2, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.2, 0.1, 5]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={`preview-vip-crown-${i}`} castShadow position={[Math.cos((i * Math.PI * 2) / 5) * 0.16, 0.1, Math.sin((i * Math.PI * 2) / 5) * 0.16]}>
              <coneGeometry args={[0.03, 0.1, 4]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
      )}

      {/* Aura Dorée */}
      {style.accessory === "admin_aura" && (
        <group position={[0, 1.5, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6, 0.02, 8, 32]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.25, 0.02, 8, 32]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {/* Badge Staff */}
      {style.accessory === "staff_badge" && (
        <group position={[0.2, 1.35, 0.16]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.12, 0.02]} />
            <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* Badge VIP */}
      {style.accessory === "vip_badge" && (
        <group position={[0.2, 1.35, 0.16]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.12, 0.02]} />
            <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* Hologramme */}
      {style.accessory === "hologram" && (
        <group position={[0, 2.2, 0]}>
          <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            <boxGeometry args={[0.18, 0.18, 0.18]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.5} transparent opacity={0.9} wireframe wireframeLinewidth={2} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.02, 8, 32]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.2} transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* Visière Néon */}
      {style.accessory === "neon_visor" && (
        <group position={[0, 1.85, 0.22]}>
          <mesh>
            <boxGeometry args={[0.42, 0.1, 0.02]} />
            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.8} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.44, 0.01, 0.03]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.44, 0.01, 0.03]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
          </mesh>
        </group>
      )}
    </group>
  )
}

export function AvatarCustomizer({
  myAvatarStyle,
  saveAvatarStyle,
  customizationOptions,
  userProfile,
  onClose,
}: AvatarCustomizerProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-black/90 backdrop-blur-xl rounded-xl w-full max-w-4xl max-h-[90vh] border-2 border-white/30 shadow-2xl flex flex-col">
        {/* Header fixe */}
        <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-white/20">
          <h3 className="text-white font-bold text-2xl">Personnaliser Avatar</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Prévisualisation 3D - fixe à gauche */}
          <div className="lg:w-1/3 p-4 border-b lg:border-b-0 lg:border-r border-white/20 flex-shrink-0">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-white/10">
              <div className="h-52 lg:h-64">
                <Canvas
                  camera={{ position: [0, 1.5, 4], fov: 40 }}
                  gl={{ antialias: true, alpha: true }}
                >
                  <Suspense fallback={null}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 5, 5]} intensity={0.8} />
                    <directionalLight position={[-5, 3, -5]} intensity={0.4} />
                    <AvatarPreview3D avatarStyle={myAvatarStyle} />
                    <OrbitControls
                      enableZoom={false}
                      enablePan={false}
                      minPolarAngle={Math.PI / 3}
                      maxPolarAngle={Math.PI / 2}
                    />
                  </Suspense>
                </Canvas>
              </div>
              <div className="p-2 bg-black/50 text-center">
                <p className="text-white/60 text-xs flex items-center justify-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Glissez pour faire tourner
                </p>
                <p className="text-xl mt-1">
                  {myAvatarStyle.faceSmiley === "none" ? (
                    <span className="text-white/40 text-xs">Pas de visage</span>
                  ) : (
                    myAvatarStyle.faceSmiley
                  )}
                </p>
              </div>
            </div>
            {/* Bouton Sauvegarder sous la prévisualisation */}
            <button
              onClick={onClose}
              className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 font-bold text-lg"
            >
              Sauvegarder
            </button>
          </div>

          {/* Options de personnalisation - scrollable */}
          <div className="lg:w-2/3 p-6 space-y-6 overflow-y-auto">
            {/* Skin Tone */}
            <div>
              <label className="text-white font-semibold mb-3 block">Teinte de peau</label>
              <div className="grid grid-cols-6 gap-3">
                {["#fbbf24", "#f59e0b", "#d97706", "#92400e", "#7c2d12", "#451a03"].map((color) => (
                  <button
                    key={color}
                    onClick={() => saveAvatarStyle({ ...myAvatarStyle, skinTone: color })}
                    className={`w-12 h-12 rounded-full border-4 transition-all ${
                      myAvatarStyle.skinTone === color ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Body Color */}
            <div>
              <label className="text-white font-semibold mb-3 block">Couleur du corps</label>
              <div className="grid grid-cols-6 gap-3">
                {["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"].map((color) => (
                  <button
                    key={color}
                    onClick={() => saveAvatarStyle({ ...myAvatarStyle, bodyColor: color })}
                    className={`w-12 h-12 rounded-full border-4 transition-all ${
                      myAvatarStyle.bodyColor === color ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div>
              <label className="text-white font-semibold mb-3 block">Style de cheveux</label>
              <div className="grid grid-cols-3 gap-3">
                {["short", "long", "none"].map((style) => {
                  const option = customizationOptions.find((o) => o.category === "hair_style" && o.value === style)
                  const isLocked =
                    option?.is_premium && !userProfile?.is_vip && !userProfile?.is_vip_plus && !userProfile?.is_admin

                  const labels: Record<string, string> = {
                    short: "Courts",
                    long: "Longs",
                    none: "Chauve"
                  }

                  return (
                    <button
                      key={style}
                      onClick={() => !isLocked && saveAvatarStyle({ ...myAvatarStyle, hairStyle: style })}
                      disabled={isLocked}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        myAvatarStyle.hairStyle === style
                          ? "border-blue-500 bg-blue-500/20"
                          : "border-white/20 bg-white/5"
                      } ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"}`}
                    >
                      <div className="text-white font-medium flex items-center justify-center gap-2">
                        {isLocked && <Crown className="w-4 h-4 text-yellow-400" />}
                        {option?.label || labels[style] || style}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Hair Color */}
            <div>
              <label className="text-white font-semibold mb-3 block">Couleur des cheveux</label>
              <div className="grid grid-cols-6 gap-3">
                {["#1f2937", "#92400e", "#fbbf24", "#ef4444", "#8b5cf6", "#ec4899"].map((color) => (
                  <button
                    key={color}
                    onClick={() => saveAvatarStyle({ ...myAvatarStyle, hairColor: color })}
                    className={`w-12 h-12 rounded-full border-4 transition-all ${
                      myAvatarStyle.hairColor === color ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Face Smiley */}
            <div>
              <label className="text-white font-semibold mb-3 block">Visage (Smiley)</label>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { emoji: "none", label: "Aucun", premium: false },
                  { emoji: "😊", label: "Souriant", premium: false },
                  { emoji: "😎", label: "Cool", premium: false },
                  { emoji: "🤓", label: "Intello", premium: false },
                  { emoji: "😇", label: "Ange", premium: true, level: "vip" },
                  { emoji: "🤩", label: "Star", premium: true, level: "vip" },
                  { emoji: "😈", label: "Diable", premium: true, level: "vip_plus" },
                  { emoji: "🤖", label: "Robot", premium: true, level: "vip_plus" },
                  { emoji: "👽", label: "Alien", premium: true, level: "vip_plus" },
                  { emoji: "🔥", label: "Feu", premium: true, level: "admin" },
                  { emoji: "⭐", label: "Étoile", premium: true, level: "admin" },
                ].map((face) => {
                  const isLocked =
                    face.premium &&
                    ((face.level === "vip" &&
                      !userProfile?.is_vip &&
                      !userProfile?.is_vip_plus &&
                      !userProfile?.is_admin) ||
                      (face.level === "vip_plus" && !userProfile?.is_vip_plus && !userProfile?.is_admin) ||
                      (face.level === "admin" && !userProfile?.is_admin))

                  return (
                    <button
                      key={face.emoji}
                      onClick={() => !isLocked && saveAvatarStyle({ ...myAvatarStyle, faceSmiley: face.emoji })}
                      disabled={isLocked}
                      className={`p-3 rounded-lg border-2 transition-all relative ${
                        myAvatarStyle.faceSmiley === face.emoji
                          ? "border-blue-500 bg-blue-500/20 scale-110"
                          : "border-white/20 bg-white/5"
                      } ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"}`}
                      title={face.label}
                    >
                      <div className="text-3xl">
                        {face.emoji === "none" ? (
                          <span className="text-white/40 text-sm font-medium">Aucun</span>
                        ) : (
                          face.emoji
                        )}
                      </div>
                      {isLocked && (
                        <div className="absolute top-1 right-1">
                          <Crown className="w-3 h-3 text-yellow-400" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Accessory */}
            <div>
              <label className="text-white font-semibold mb-3 block">Accessoire</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "none", label: "Aucun", premium: false },
                  { value: "glasses", label: "Lunettes", premium: false },
                  { value: "sunglasses", label: "Lunettes Soleil", premium: true, level: "vip" },
                  { value: "hat", label: "Chapeau", premium: false },
                  { value: "cap", label: "Casquette", premium: true, level: "vip" },
                  { value: "headphones", label: "Casque Audio", premium: true, level: "vip" },
                  { value: "vip_badge", label: "Badge VIP", premium: true, level: "vip" },
                  { value: "staff_badge", label: "Badge Staff", premium: true, level: "vip" },
                  { value: "vip_plus_crown", label: "Couronne VIP+", premium: true, level: "vip_plus" },
                  { value: "hologram", label: "Hologramme", premium: true, level: "vip_plus" },
                  { value: "neon_visor", label: "Visière Néon", premium: true, level: "vip_plus" },
                  { value: "admin_crown", label: "Couronne Admin", premium: true, level: "admin" },
                  { value: "admin_aura", label: "Aura Dorée", premium: true, level: "admin" },
                ].map((acc) => {
                  const isLocked =
                    acc.premium &&
                    ((acc.level === "vip" &&
                      !userProfile?.is_vip &&
                      !userProfile?.is_vip_plus &&
                      !userProfile?.is_admin) ||
                      (acc.level === "vip_plus" && !userProfile?.is_vip_plus && !userProfile?.is_admin) ||
                      (acc.level === "admin" && !userProfile?.is_admin))

                  return (
                    <button
                      key={acc.value}
                      onClick={() => !isLocked && saveAvatarStyle({ ...myAvatarStyle, accessory: acc.value })}
                      disabled={isLocked}
                      className={`p-2 rounded-lg border-2 transition-all relative ${
                        myAvatarStyle.accessory === acc.value
                          ? "border-blue-500 bg-blue-500/20"
                          : "border-white/20 bg-white/5"
                      } ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"}`}
                    >
                      <div className="text-white text-xs font-medium flex items-center justify-center gap-1">
                        {acc.label}
                      </div>
                      {isLocked && (
                        <div className="absolute top-1 right-1">
                          <Crown className="w-3 h-3 text-yellow-400" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
