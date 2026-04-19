import { type NextRequest, NextResponse } from "next/server"
import { contentUpdater } from "@/lib/content-updater"

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()

    let result
    switch (type) {
      case "movies":
        result = await contentUpdater.forceUpdateMovies()
        break
      case "tvshows":
        result = await contentUpdater.forceUpdateTVShows()
        break
      case "anime":
        result = await contentUpdater.forceUpdateAnime()
        break
      case "calendar":
        result = await contentUpdater.forceUpdateCalendar()
        break
      case "all":
        result = await contentUpdater.forceUpdateAll()
        break
      default:
        return NextResponse.json({ error: "Type de mise à jour invalide" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Mise à jour ${type} terminée`,
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const cacheInfo = contentUpdater.getCacheInfo()
    return NextResponse.json({
      success: true,
      cacheInfo,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des informations de cache",
      },
      { status: 500 },
    )
  }
}
