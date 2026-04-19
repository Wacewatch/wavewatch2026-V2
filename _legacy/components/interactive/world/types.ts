// Types and interfaces for the Interactive World

export interface WorldProps {
  userId: string
  userProfile: any
}

export interface InteractiveWorldProps {
  userId: string
  userProfile: any
}

export interface AvatarStyle {
  bodyColor?: string
  headColor?: string
  skinTone?: string
  hairStyle?: string
  hairColor?: string
  accessory?: string
  faceSmiley?: string
}

export interface Position {
  x: number
  y: number
  z: number
}

export interface PlayerProfile {
  id: string
  user_id: string
  username: string
  avatar_style: AvatarStyle
  position_x: number
  position_y: number
  position_z: number
  rotation: number
  current_room: string | null
  is_online: boolean
  last_seen: string
  user_profiles?: {
    username: string
    is_admin: boolean
    is_vip: boolean
    is_vip_plus: boolean
  }
}

export interface ChatBubble {
  message: string
  timestamp: number
}

export interface PlayerAction {
  type: "jump" | "emoji"
  data?: string
  timestamp: number
}

export interface CinemaRoom {
  id: string
  room_number: number
  name: string
  capacity: number
  theme: string
  movie_tmdb_id: number | null
  movie_title: string | null
  movie_poster: string | null
  schedule_start: string | null
  schedule_end: string | null
  is_open: boolean
  access_level: string
  embed_url: string | null
}

export interface CinemaSeat {
  id: string
  room_id: string
  row_number: number
  seat_number: number
  user_id: string | null
  is_occupied: boolean
  occupied_at: string | null
  position_x?: number
  position_z?: number
}

export interface ArcadeMachine {
  id: string
  name: string
  game_url: string
  thumbnail_url: string | null
  is_active: boolean
  position_x: number
  position_z: number
  open_in_new_tab?: boolean
  use_proxy?: boolean
}

export interface Stadium {
  id: string
  name: string
  match_title: string | null
  embed_url: string | null
  schedule_start: string | null
  schedule_end: string | null
  is_open: boolean
  access_level: string
}

export interface StadiumSeat {
  section: "left" | "right" | "center"
  row: number
  seat: number
}

export interface WorldSettings {
  maxCapacity: number
  worldMode: "day" | "night" | "sunset" | "christmas"
  voiceChatEnabled: boolean
  playerInteractionsEnabled: boolean
  showStatusBadges: boolean
  enableChat: boolean
  enableEmojis: boolean
  enableJumping: boolean
}

export interface CollisionZone {
  id?: string
  x: number
  z: number
  width: number
  depth: number
  name?: string
  label?: string
  color?: string
  lowQuality?: boolean
}

export interface NearbyBuilding {
  type: string
  name: string
  distance: number
}

export interface FPSRotation {
  yaw: number
  pitch: number
}
