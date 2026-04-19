import { Badge } from "@/components/ui/badge"

interface ClassificationBadgeProps {
  certification: string | null | undefined
  className?: string
}

export function ClassificationBadge({ certification, className = "" }: ClassificationBadgeProps) {
  if (!certification) return null

  // Normaliser la certification
  const cert = certification.toUpperCase().trim()

  // Déterminer le type et la couleur
  let displayText = cert
  let colorClass = "border-gray-500 text-gray-400"

  // Tout public (vert)
  if (cert === "TP" || cert === "U" || cert === "G" || cert === "TOUS PUBLICS") {
    displayText = "Tout public"
    colorClass = "border-green-500 text-green-400 bg-green-950/30"
  }
  // -10 ans (orange)
  else if (cert === "-10" || cert === "10" || cert === "PG") {
    displayText = "Déconseillé -10 ans"
    colorClass = "border-orange-500 text-orange-400 bg-orange-950/30"
  }
  // -12 ans (orange)
  else if (cert === "-12" || cert === "12" || cert === "12A" || cert === "PG-13") {
    displayText = "Déconseillé -12 ans"
    colorClass = "border-orange-500 text-orange-400 bg-orange-950/30"
  }
  // -16 ans (rouge)
  else if (cert === "-16" || cert === "16" || cert === "15" || cert === "15A" || cert === "R") {
    displayText = "Interdit -16 ans"
    colorClass = "border-red-500 text-red-400 bg-red-950/30"
  }
  // -18 ans (rouge foncé)
  else if (cert === "-18" || cert === "18" || cert === "NC-17" || cert === "X" || cert === "R18" || cert === "TV-MA") {
    displayText = "Interdit -18 ans"
    colorClass = "border-red-600 text-red-500 bg-red-950/50"
  }

  return (
    <Badge variant="outline" className={`font-semibold ${colorClass} ${className}`}>
      {displayText}
    </Badge>
  )
}
