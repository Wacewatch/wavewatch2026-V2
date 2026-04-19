export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  category:
    | "movie"
    | "tv"
    | "anime"
    | "tv-channel"
    | "radio"
    | "retrogaming"
    | "playlist"
    | "vip"
    | "social"
    | "general"
  icon: string
  color: string
  requirement_type: "count" | "streak" | "time" | "rating" | "special"
  requirement_value: number
  points: number
  rarity: "common" | "rare" | "epic" | "legendary"
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  progress: number
  achievement?: Achievement
}

export interface AchievementProgress {
  achievement: Achievement
  unlocked: boolean
  progress: number
  percentage: number
}

export class AchievementSystem {
  // Check and unlock achievements based on user stats
  static checkAchievements(stats: any): string[] {
    const unlockedCodes: string[] = []

    // Movie achievements (15 achievements)
    if (stats.moviesWatched >= 1) unlockedCodes.push("movie_first")
    if (stats.moviesWatched >= 5) unlockedCodes.push("movie_5")
    if (stats.moviesWatched >= 10) unlockedCodes.push("movie_10")
    if (stats.moviesWatched >= 25) unlockedCodes.push("movie_25")
    if (stats.moviesWatched >= 50) unlockedCodes.push("movie_50")
    if (stats.moviesWatched >= 100) unlockedCodes.push("movie_100")
    if (stats.moviesWatched >= 250) unlockedCodes.push("movie_250")
    if (stats.moviesWatched >= 500) unlockedCodes.push("movie_500")
    if (stats.moviesWatched >= 1000) unlockedCodes.push("movie_1000")
    if (stats.likesMovies >= 10) unlockedCodes.push("movie_like_10")
    if (stats.likesMovies >= 50) unlockedCodes.push("movie_like_50")
    if (stats.likesMovies >= 100) unlockedCodes.push("movie_like_100")
    if (stats.moviesFavorites >= 25) unlockedCodes.push("movie_fav_25")
    if (stats.moviesFavorites >= 50) unlockedCodes.push("movie_fav_50")
    if (stats.moviesFavorites >= 100) unlockedCodes.push("movie_fav_100")

    // TV achievements (15 achievements)
    if (stats.showsWatched >= 1) unlockedCodes.push("tv_first")
    if (stats.showsWatched >= 5) unlockedCodes.push("tv_5")
    if (stats.showsWatched >= 10) unlockedCodes.push("tv_10")
    if (stats.showsWatched >= 25) unlockedCodes.push("tv_25")
    if (stats.showsWatched >= 50) unlockedCodes.push("tv_50")
    if (stats.showsWatched >= 100) unlockedCodes.push("tv_100")
    if (stats.showsWatched >= 250) unlockedCodes.push("tv_250")
    if (stats.episodesWatched >= 10) unlockedCodes.push("tv_episodes_10")
    if (stats.episodesWatched >= 50) unlockedCodes.push("tv_episodes_50")
    if (stats.episodesWatched >= 100) unlockedCodes.push("tv_episodes_100")
    if (stats.episodesWatched >= 250) unlockedCodes.push("tv_episodes_250")
    if (stats.episodesWatched >= 500) unlockedCodes.push("tv_episodes_500")
    if (stats.episodesWatched >= 1000) unlockedCodes.push("tv_episodes_1000")
    if (stats.episodesWatched >= 2000) unlockedCodes.push("tv_episodes_2000")
    if (stats.likesTVShows >= 25) unlockedCodes.push("tv_like_25")
    if (stats.likesTVShows >= 50) unlockedCodes.push("tv_like_50")

    // Anime achievements (10 achievements)
    if (stats.animeWatched >= 1) unlockedCodes.push("anime_first")
    if (stats.animeWatched >= 5) unlockedCodes.push("anime_5")
    if (stats.animeWatched >= 10) unlockedCodes.push("anime_10")
    if (stats.animeWatched >= 25) unlockedCodes.push("anime_25")
    if (stats.animeWatched >= 50) unlockedCodes.push("anime_50")
    if (stats.animeWatched >= 100) unlockedCodes.push("anime_100")
    if (stats.animeWatched >= 250) unlockedCodes.push("anime_250")
    if (stats.animeWatched >= 500) unlockedCodes.push("anime_500")
    if (stats.likesAnime >= 20) unlockedCodes.push("anime_like_20")
    if (stats.likesAnime >= 50) unlockedCodes.push("anime_like_50")
    if (stats.likesAnime >= 100) unlockedCodes.push("anime_like_100")
    if (stats.animeFavorites >= 25) unlockedCodes.push("anime_fav_25")
    if (stats.animeFavorites >= 50) unlockedCodes.push("anime_fav_50")
    if (stats.animeFavorites >= 100) unlockedCodes.push("anime_fav_100")

    // TV Channel achievements (10 achievements)
    if (stats.tvChannelsFavorites >= 1) unlockedCodes.push("tv_channel_first")
    if (stats.tvChannelsFavorites >= 3) unlockedCodes.push("tv_channel_3")
    if (stats.tvChannelsFavorites >= 5) unlockedCodes.push("tv_channel_5")
    if (stats.tvChannelsFavorites >= 10) unlockedCodes.push("tv_channel_10")
    if (stats.tvChannelsFavorites >= 20) unlockedCodes.push("tv_channel_20")
    if (stats.tvChannelsFavorites >= 50) unlockedCodes.push("tv_channel_50")
    if (stats.likesTVChannels >= 5) unlockedCodes.push("tv_channel_like_5")
    if (stats.likesTVChannels >= 10) unlockedCodes.push("tv_channel_like_10")
    if (stats.likesTVChannels >= 25) unlockedCodes.push("tv_channel_like_25")
    if (stats.likesTVChannels >= 50) unlockedCodes.push("tv_channel_like_50")
    if (stats.tvChannelsWatched >= 10) unlockedCodes.push("tv_channel_watch_10")
    if (stats.tvChannelsWatched >= 50) unlockedCodes.push("tv_channel_watch_50")
    if (stats.tvChannelsWatched >= 100) unlockedCodes.push("tv_channel_watch_100")

    // Radio achievements (10 achievements)
    const radioFavorites = stats.radioFavorites || 0
    if (radioFavorites >= 1) unlockedCodes.push("radio_first")
    if (radioFavorites >= 3) unlockedCodes.push("radio_3")
    if (radioFavorites >= 5) unlockedCodes.push("radio_5")
    if (radioFavorites >= 10) unlockedCodes.push("radio_10")
    if (radioFavorites >= 20) unlockedCodes.push("radio_20")
    if (radioFavorites >= 50) unlockedCodes.push("radio_50")
    if (stats.likesRadio >= 5) unlockedCodes.push("radio_like_5")
    if (stats.likesRadio >= 10) unlockedCodes.push("radio_like_10")
    if (stats.likesRadio >= 25) unlockedCodes.push("radio_like_25")
    if (stats.likesRadio >= 50) unlockedCodes.push("radio_like_50")
    if (stats.radioListened >= 10) unlockedCodes.push("radio_listen_10")
    if (stats.radioListened >= 50) unlockedCodes.push("radio_listen_50")
    if (stats.radioListened >= 100) unlockedCodes.push("radio_listen_100")

    // Retrogaming achievements (10 achievements)
    const gamesFavorites = stats.gamesFavorites || 0
    if (gamesFavorites >= 1) unlockedCodes.push("game_first")
    if (gamesFavorites >= 5) unlockedCodes.push("game_5")
    if (gamesFavorites >= 10) unlockedCodes.push("game_10")
    if (gamesFavorites >= 25) unlockedCodes.push("game_25")
    if (gamesFavorites >= 50) unlockedCodes.push("game_50")
    if (gamesFavorites >= 100) unlockedCodes.push("game_100")
    if (gamesFavorites >= 250) unlockedCodes.push("game_250")
    if (stats.likesGames >= 10) unlockedCodes.push("game_like_10")
    if (stats.likesGames >= 20) unlockedCodes.push("game_like_20")
    if (stats.likesGames >= 50) unlockedCodes.push("game_like_50")
    if (stats.gamesPlayed >= 25) unlockedCodes.push("game_play_25")
    if (stats.gamesPlayed >= 100) unlockedCodes.push("game_play_100")

    // Playlist achievements (10 achievements)
    if (stats.playlistsCreated >= 1) unlockedCodes.push("playlist_first")
    if (stats.playlistsCreated >= 3) unlockedCodes.push("playlist_3")
    if (stats.playlistsCreated >= 5) unlockedCodes.push("playlist_5")
    if (stats.playlistsCreated >= 10) unlockedCodes.push("playlist_10")
    if (stats.playlistsCreated >= 25) unlockedCodes.push("playlist_25")
    if (stats.playlistsCreated >= 50) unlockedCodes.push("playlist_50")
    if (stats.likesPlaylists >= 5) unlockedCodes.push("playlist_like_5")
    if (stats.likesPlaylists >= 10) unlockedCodes.push("playlist_like_10")
    if (stats.likesPlaylists >= 25) unlockedCodes.push("playlist_like_25")
    if (stats.likesPlaylists >= 50) unlockedCodes.push("playlist_like_50")
    if (stats.playlistItems >= 50) unlockedCodes.push("playlist_items_50")
    if (stats.playlistItems >= 100) unlockedCodes.push("playlist_items_100")
    if (stats.playlistItems >= 250) unlockedCodes.push("playlist_items_250")

    // Social achievements (10 achievements)
    if (stats.totalLikes >= 10) unlockedCodes.push("social_likes_10")
    if (stats.totalLikes >= 25) unlockedCodes.push("social_likes_25")
    if (stats.totalLikes >= 50) unlockedCodes.push("social_likes_50")
    if (stats.totalLikes >= 100) unlockedCodes.push("social_likes_100")
    if (stats.totalLikes >= 250) unlockedCodes.push("social_likes_250")
    if (stats.totalLikes >= 500) unlockedCodes.push("social_likes_500")
    if (stats.totalLikes >= 1000) unlockedCodes.push("social_likes_1000")
    const totalFavorites = stats.favoritesCount || 0
    if (totalFavorites >= 25) unlockedCodes.push("social_favorites_25")
    if (totalFavorites >= 50) unlockedCodes.push("social_favorites_50")
    if (totalFavorites >= 100) unlockedCodes.push("social_favorites_100")
    if (totalFavorites >= 250) unlockedCodes.push("social_favorites_250")
    if (totalFavorites >= 500) unlockedCodes.push("social_favorites_500")

    // General achievements (15 achievements)
    if (stats.watchingStreak >= 3) unlockedCodes.push("general_streak_3")
    if (stats.watchingStreak >= 7) unlockedCodes.push("general_streak_7")
    if (stats.watchingStreak >= 14) unlockedCodes.push("general_streak_14")
    if (stats.watchingStreak >= 30) unlockedCodes.push("general_streak_30")
    if (stats.watchingStreak >= 60) unlockedCodes.push("general_streak_60")
    if (stats.watchingStreak >= 100) unlockedCodes.push("general_streak_100")
    if (stats.watchingStreak >= 365) unlockedCodes.push("general_streak_365")
    if (stats.totalWatchTime >= 60) unlockedCodes.push("general_time_1h")
    if (stats.totalWatchTime >= 360) unlockedCodes.push("general_time_6h")
    if (stats.totalWatchTime >= 720) unlockedCodes.push("general_time_12h")
    if (stats.totalWatchTime >= 1440) unlockedCodes.push("general_time_24h")
    if (stats.totalWatchTime >= 4320) unlockedCodes.push("general_time_3d")
    if (stats.totalWatchTime >= 10080) unlockedCodes.push("general_time_week")
    if (stats.totalWatchTime >= 21600) unlockedCodes.push("general_time_2weeks")
    if (stats.totalWatchTime >= 43200) unlockedCodes.push("general_time_month")
    if (stats.totalWatchTime >= 129600) unlockedCodes.push("general_time_3months")

    return unlockedCodes
  }

  // Calculate progress for an achievement
  static calculateProgress(achievement: Achievement, stats: any): number {
    const code = achievement.code

    // Movies
    if (code.startsWith("movie_") && !code.includes("like") && !code.includes("fav")) {
      return Math.min(stats.moviesWatched, achievement.requirement_value)
    }
    if (code.includes("movie_like")) {
      return Math.min(stats.likesMovies, achievement.requirement_value)
    }
    if (code.includes("movie_fav")) {
      return Math.min(stats.moviesFavorites, achievement.requirement_value)
    }

    // TV Shows
    if (code.startsWith("tv_") && !code.includes("episode") && !code.includes("like") && !code.includes("channel")) {
      return Math.min(stats.showsWatched, achievement.requirement_value)
    }
    if (code.includes("tv_episodes")) {
      return Math.min(stats.episodesWatched, achievement.requirement_value)
    }
    if (code.includes("tv_like")) {
      return Math.min(stats.likesTVShows, achievement.requirement_value)
    }

    // Anime
    if (code.startsWith("anime_") && !code.includes("like") && !code.includes("fav")) {
      return Math.min(stats.animeWatched, achievement.requirement_value)
    }
    if (code.includes("anime_like")) {
      return Math.min(stats.likesAnime, achievement.requirement_value)
    }
    if (code.includes("anime_fav")) {
      return Math.min(stats.animeFavorites, achievement.requirement_value)
    }

    // TV Channels
    if (code.startsWith("tv_channel_") && !code.includes("like") && !code.includes("watch")) {
      return Math.min(stats.tvChannelsFavorites, achievement.requirement_value)
    }
    if (code.includes("tv_channel_like")) {
      return Math.min(stats.likesTVChannels, achievement.requirement_value)
    }
    if (code.includes("tv_channel_watch")) {
      return Math.min(stats.tvChannelsWatched, achievement.requirement_value)
    }

    // Radio
    if (code.startsWith("radio_") && !code.includes("like") && !code.includes("listen")) {
      return Math.min(stats.radioFavorites || 0, achievement.requirement_value)
    }
    if (code.includes("radio_like")) {
      return Math.min(stats.likesRadio, achievement.requirement_value)
    }
    if (code.includes("radio_listen")) {
      return Math.min(stats.radioListened, achievement.requirement_value)
    }

    // Retrogaming
    if (code.startsWith("game_") && !code.includes("like") && !code.includes("play")) {
      return Math.min(stats.gamesFavorites || 0, achievement.requirement_value)
    }
    if (code.includes("game_like")) {
      return Math.min(stats.likesGames, achievement.requirement_value)
    }
    if (code.includes("game_play")) {
      return Math.min(stats.gamesPlayed, achievement.requirement_value)
    }

    // Playlists
    if (code.startsWith("playlist_") && !code.includes("like") && !code.includes("items")) {
      return Math.min(stats.playlistsCreated, achievement.requirement_value)
    }
    if (code.includes("playlist_like")) {
      return Math.min(stats.likesPlaylists, achievement.requirement_value)
    }
    if (code.includes("playlist_items")) {
      return Math.min(stats.playlistItems, achievement.requirement_value)
    }

    // Social
    if (code.includes("social_likes")) {
      return Math.min(stats.totalLikes, achievement.requirement_value)
    }
    if (code.includes("social_favorites")) {
      return Math.min(stats.favoritesCount || 0, achievement.requirement_value)
    }

    // General
    if (code.includes("streak")) {
      return Math.min(stats.watchingStreak, achievement.requirement_value)
    }
    if (code.includes("time")) {
      return Math.min(stats.totalWatchTime, achievement.requirement_value)
    }

    return 0
  }

  // Get rarity color
  static getRarityColor(rarity: string): string {
    switch (rarity) {
      case "common":
        return "text-gray-400 border-gray-600"
      case "rare":
        return "text-blue-400 border-blue-600"
      case "epic":
        return "text-purple-400 border-purple-600"
      case "legendary":
        return "text-yellow-400 border-yellow-600"
      default:
        return "text-gray-400 border-gray-600"
    }
  }

  // Get rarity badge background
  static getRarityBg(rarity: string): string {
    switch (rarity) {
      case "common":
        return "bg-gray-900/50"
      case "rare":
        return "bg-blue-900/50"
      case "epic":
        return "bg-purple-900/50"
      case "legendary":
        return "bg-yellow-900/50"
      default:
        return "bg-gray-900/50"
    }
  }
}
