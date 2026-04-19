// Main export file for the Interactive World components

// Types
export * from "./types"

// Constants
export * from "./constants"

// Audio management
export * from "./audio"

// Avatar components
export { RealisticAvatar, LocalPlayerAvatar, InterpolatedPlayer } from "./avatar"

// Camera components
export { CameraFollower, FirstPersonCamera } from "./camera"

// Disco components
export { DiscoWalls, DiscoVisualizer, DJBoothStarburst, SideEqualizer } from "./disco"

// Environment components
export {
  RealisticTree,
  SnowyTree,
  ChristmasTree,
  ChristmasLights,
  RealisticLamppost,
  SnowParticles,
  WorldEnvironment,
  WorldGround,
  WorldDecorations,
  CentralPlaza,
  PathNetwork,
  AmbientLamppost,
  AmbientLamppostCollection,
  CitySkyline,
} from "./environment"

// Controls components
export { MobileJoystick, CameraJoystick, CenterTouchZone, JoystickBlockZones } from "./controls"

// UI components
export {
  ChatInput,
  SettingsModal,
  MapModal,
  AvatarCustomizer,
  CinemaModal,
  ClosedModal,
  ArcadeModal,
  ArcadeGameView,
  ExternalGameModal,
  StadiumModal,
  StadiumInfoBar,
  QuickActionsPanel,
  RoomActionButtons,
  ActionButtons,
  MenuDropdown,
  ChatModal,
  MovieFullscreenModal,
  WorldLoadingScreen,
  VoiceChatPanel,
  QuestsModal, // Added QuestsModal export
} from "./ui"

// Building components
export {
  DiscoBuilding,
  CinemaBuilding,
  ArcadeBuilding,
  StadiumBuilding,
  DecorativeBuildings,
  InfoPanel,
} from "./buildings"

// Scene components
export { StadiumInterior, DiscoInterior, ArcadeInterior, CinemaInterior } from "./scenes"

// Hooks
export {
  useRoomNavigation,
  useStadiumSeating,
  useCinemaSeats,
  usePlayerMovement,
  useWorldChat,
  useWorldSettings,
  useDataLoaders,
  useWorldPreloader,
  LOADING_STEPS,
  useVoiceChat,
} from "./hooks"
export type { LoadingStep } from "./hooks"

// Debug components
export { CollisionDebugVisualization } from "./debug"
