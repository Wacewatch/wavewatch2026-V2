import { NextRequest, NextResponse } from "next/server"

/**
 * Proxy API pour les sites de jeux rétro
 * Contourne les vérifications de referer en faisant la requête côté serveur
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL manquante" }, { status: 400 })
  }

  // Validation de l'URL - uniquement les domaines autorisés
  const allowedDomains = [
    "retrogames.onl",
    "www.retrogames.onl",
    "gam.onl",
    "www.gam.onl",
    "play.webrcade.com",
    "emupedia.net",
    "retrogames.me",
    "www.retrogames.me",
  ]

  try {
    const targetUrl = new URL(url)
    const isAllowed = allowedDomains.some(
      (domain) => targetUrl.hostname === domain || targetUrl.hostname.endsWith(`.${domain}`)
    )

    if (!isAllowed) {
      return NextResponse.json({ error: "Domaine non autorisé" }, { status: 403 })
    }

    // Faire la requête avec le referer du site lui-même
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: targetUrl.origin + "/",
        Origin: targetUrl.origin,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
    })

    const contentType = response.headers.get("content-type") || "text/html"
    const content = await response.text()

    let modifiedContent = content
    const baseUrl = targetUrl.origin

    // Ajouter une balise base pour les ressources relatives
    if (modifiedContent.includes("<head>")) {
      modifiedContent = modifiedContent.replace(
        "<head>",
        `<head><base href="${baseUrl}/">`
      )
    } else if (modifiedContent.includes("<HEAD>")) {
      modifiedContent = modifiedContent.replace(
        "<HEAD>",
        `<HEAD><base href="${baseUrl}/">`
      )
    }

    return new NextResponse(modifiedContent, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement du contenu" },
      { status: 500 }
    )
  }
}
