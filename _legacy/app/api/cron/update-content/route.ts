// API route pour les mises à jour automatiques (peut être utilisée avec des services comme Vercel Cron)
import { NextResponse } from "next/server"
import { contentUpdater } from "@/lib/content-updater"

export async function GET() {
  try {
    console.log("Démarrage de la mise à jour automatique du contenu TMDB...")

    const result = await contentUpdater.forceUpdateAll()

    console.log("Mise à jour automatique terminée avec succès")

    return NextResponse.json({
      success: true,
      message: "Mise à jour automatique terminée",
      timestamp: new Date().toISOString(),
      data: result,
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour automatique:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour automatique",
        details: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
