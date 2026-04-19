export type VIPLevel = "free" | "vip" | "vip_plus" | "beta" | "uploader"

export interface VIPUser {
  id: string
  username: string
  level: VIPLevel
  subscriptionDate: Date
  totalContribution: number
  monthlyContribution: number
}

export class VIPSystem {
  private static STORAGE_KEY = "wavewatch_vip_users"

  static getVIPUsers(): VIPUser[] {
    if (typeof window === "undefined") return []
    try {
      const users = localStorage.getItem(this.STORAGE_KEY)
      return users
        ? JSON.parse(users).map((user: any) => ({
            ...user,
            subscriptionDate: new Date(user.subscriptionDate),
          }))
        : []
    } catch {
      return []
    }
  }

  static getUserVIPStatus(userId: string): VIPLevel {
    if (!userId) return "free"
    const vipUsers = this.getVIPUsers()
    const user = vipUsers.find((u) => u.id === userId)
    return user?.level || "free"
  }

  static upgradeUser(userId: string, username: string, level: VIPLevel): void {
    if (typeof window === "undefined" || !userId || !username) return

    const vipUsers = this.getVIPUsers()
    const existingUserIndex = vipUsers.findIndex((u) => u.id === userId)

    const monthlyPrice = level === "vip" ? 0.99 : level === "vip_plus" ? 1.99 : 0

    if (existingUserIndex >= 0) {
      // Mettre à jour l'utilisateur existant
      vipUsers[existingUserIndex].level = level
      vipUsers[existingUserIndex].monthlyContribution = monthlyPrice
      if (level !== "free") {
        vipUsers[existingUserIndex].totalContribution += monthlyPrice
      }
    } else if (level !== "free") {
      // Ajouter un nouvel utilisateur VIP
      const newVIPUser: VIPUser = {
        id: userId,
        username,
        level,
        subscriptionDate: new Date(),
        totalContribution: monthlyPrice,
        monthlyContribution: monthlyPrice,
      }
      vipUsers.push(newVIPUser)
    }

    // Supprimer si retour au gratuit
    if (level === "free" && existingUserIndex >= 0) {
      vipUsers.splice(existingUserIndex, 1)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(vipUsers))
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("vip-updated"))
    }
  }

  static removeUserPrivileges(userId: string): void {
    if (typeof window === "undefined" || !userId) return

    const vipUsers = this.getVIPUsers()
    const filteredUsers = vipUsers.filter((u) => u.id !== userId)

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredUsers))
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("vip-updated"))
    }
  }

  static getVIPBadge(level: VIPLevel): { text: string; color: string } {
    switch (level) {
      case "vip":
        return { text: "VIP", color: "text-yellow-600 border-yellow-600" }
      case "vip_plus":
        return { text: "VIP+", color: "text-purple-600 border-purple-600" }
      case "beta":
        return { text: "BETA", color: "text-cyan-400 border-cyan-400" }
      case "uploader":
        return { text: "UPLOADER", color: "text-green-500 border-green-500" }
      default:
        return { text: "", color: "" }
    }
  }

  static getUsernameColor(level: VIPLevel): string {
    switch (level) {
      case "vip":
        return "text-yellow-600"
      case "vip_plus":
        return "text-purple-600"
      case "beta":
        return "text-cyan-400"
      case "uploader":
        return "text-green-500"
      default:
        return "text-foreground"
    }
  }

  static getTopSupporters(limit = 10): VIPUser[] {
    const vipUsers = this.getVIPUsers()
    return vipUsers
      .filter((user) => user.level !== "free" && user.level !== "beta")
      .sort((a, b) => b.totalContribution - a.totalContribution)
      .slice(0, limit)
  }

  static getTotalRevenue(): number {
    const vipUsers = this.getVIPUsers()
    return vipUsers.reduce((total, user) => total + user.totalContribution, 0)
  }

  static getVIPStats(): {
    totalVIP: number
    totalVIPPlus: number
    totalBeta: number
    monthlyRevenue: number
    totalRevenue: number
  } {
    const vipUsers = this.getVIPUsers()
    return {
      totalVIP: vipUsers.filter((u) => u.level === "vip").length,
      totalVIPPlus: vipUsers.filter((u) => u.level === "vip_plus").length,
      totalBeta: vipUsers.filter((u) => u.level === "beta").length,
      monthlyRevenue: vipUsers.reduce((total, user) => total + user.monthlyContribution, 0),
      totalRevenue: vipUsers.reduce((total, user) => total + user.totalContribution, 0),
    }
  }

  static getVIPPricing() {
    return {
      free: {
        name: "Gratuit",
        price: 0,
        description: "Accès complet à tout le contenu",
        features: ["Streaming illimité", "Tous les films et séries", "Toutes les chaînes TV", "Support communautaire"],
      },
      vip: {
        name: "VIP",
        price: "0,99€",
        description: "Soutenez WaveWatch + Badge VIP",
        features: [
          "Tout du plan Gratuit",
          "Badge VIP exclusif",
          "Pseudo en couleur dorée",
          "Classement des top supporters",
          "Soutien au développement",
        ],
      },
      vip_plus: {
        name: "VIP+",
        price: "1,99€",
        description: "Soutien premium + Badge VIP+",
        features: [
          "Tout du plan Gratuit",
          "Badge VIP+ exclusif",
          "Pseudo en couleur violette",
          "Priorité dans le classement",
          "Soutien premium au développement",
        ],
      },
      uploader: {
        name: "Uploader",
        price: "0€",
        description: "Uploader de contenu",
        features: ["Uploader des vidéos", "Accès à l'espace uploader", "Support au contenu"],
      },
    }
  }
}
