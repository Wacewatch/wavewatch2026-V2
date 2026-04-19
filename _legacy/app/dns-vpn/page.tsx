import { Shield, Globe, Lock, CheckCircle, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "DNS & VPN - WaveWatch",
  description: "Guide pour configurer un DNS sécurisé et un VPN gratuit",
}

export default function DnsVpnPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">DNS & VPN</h1>
        <p className="text-gray-400 text-lg">
          Protégez votre vie privée en ligne avec un DNS sécurisé et un VPN gratuit
        </p>
      </div>

      {/* DNS Section */}
      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8 text-blue-400" />
            <CardTitle className="text-2xl text-white">DNS Cloudflare 1.1.1.1</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            Un DNS rapide, sécurisé et respectueux de votre vie privée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Pourquoi utiliser 1.1.1.1 ?</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Plus rapide :</strong> L'un des DNS les plus rapides au monde
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Sécurisé :</strong> Protection contre les sites malveillants
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Privé :</strong> Cloudflare ne vend pas vos données de navigation
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Gratuit :</strong> 100% gratuit, sans publicité
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Configuration sur Windows</h3>
            <ol className="space-y-3 text-gray-300 list-decimal list-inside">
              <li>
                Ouvrez les <strong>Paramètres</strong> Windows
              </li>
              <li>
                Allez dans <strong>Réseau et Internet</strong> → <strong>Paramètres réseau avancés</strong>
              </li>
              <li>
                Cliquez sur votre connexion active, puis sur <strong>Afficher les propriétés supplémentaires</strong>
              </li>
              <li>
                Cliquez sur <strong>Modifier</strong> à côté de "Attribution du serveur DNS"
              </li>
              <li>Sélectionnez "Manuel" et activez IPv4</li>
              <li>
                Entrez les serveurs DNS :
                <div className="bg-gray-800 p-3 rounded mt-2 font-mono text-sm">
                  <div>DNS préféré : 1.1.1.1</div>
                  <div>DNS auxiliaire : 1.0.0.1</div>
                </div>
              </li>
              <li>
                Cliquez sur <strong>Enregistrer</strong>
              </li>
            </ol>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Configuration sur macOS</h3>
            <ol className="space-y-3 text-gray-300 list-decimal list-inside">
              <li>
                Ouvrez <strong>Préférences Système</strong> → <strong>Réseau</strong>
              </li>
              <li>Sélectionnez votre connexion active (Wi-Fi ou Ethernet)</li>
              <li>
                Cliquez sur <strong>Avancé</strong>
              </li>
              <li>
                Allez dans l'onglet <strong>DNS</strong>
              </li>
              <li>
                Cliquez sur le bouton <strong>+</strong> et ajoutez :
                <div className="bg-gray-800 p-3 rounded mt-2 font-mono text-sm">
                  <div>1.1.1.1</div>
                  <div>1.0.0.1</div>
                </div>
              </li>
              <li>
                Cliquez sur <strong>OK</strong> puis <strong>Appliquer</strong>
              </li>
            </ol>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Configuration sur Android</h3>
            <ol className="space-y-3 text-gray-300 list-decimal list-inside">
              <li>
                Ouvrez <strong>Paramètres</strong> → <strong>Réseau et Internet</strong>
              </li>
              <li>
                Appuyez sur <strong>DNS privé</strong>
              </li>
              <li>
                Sélectionnez <strong>Nom d'hôte du fournisseur DNS privé</strong>
              </li>
              <li>
                Entrez :{" "}
                <span className="font-mono bg-gray-800 px-2 py-1 rounded">1dot1dot1dot1.cloudflare-dns.com</span>
              </li>
              <li>
                Appuyez sur <strong>Enregistrer</strong>
              </li>
            </ol>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Configuration sur iOS</h3>
            <ol className="space-y-3 text-gray-300 list-decimal list-inside">
              <li>
                Téléchargez l'application <strong>1.1.1.1</strong> depuis l'App Store
              </li>
              <li>Ouvrez l'application</li>
              <li>Appuyez sur le bouton pour activer le DNS 1.1.1.1</li>
              <li>Autorisez l'ajout de la configuration VPN quand demandé</li>
            </ol>
          </div>

          <Button asChild className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            <a href="https://1.1.1.1/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              En savoir plus sur 1.1.1.1
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* VPN Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-8 h-8 text-purple-400" />
            <CardTitle className="text-2xl text-white">Proton VPN</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            Un VPN gratuit, sécurisé et sans limite de données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Pourquoi utiliser Proton VPN ?</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Gratuit :</strong> Version gratuite sans limite de données
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Sécurisé :</strong> Chiffrement de niveau militaire
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Sans logs :</strong> Aucun enregistrement de votre activité
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Open Source :</strong> Code source auditable publiquement
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Basé en Suisse :</strong> Protection par les lois suisses sur la vie privée
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Installation et configuration</h3>
            <ol className="space-y-3 text-gray-300 list-decimal list-inside">
              <li>
                Rendez-vous sur{" "}
                <a
                  href="https://protonvpn.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  protonvpn.com
                </a>
              </li>
              <li>Créez un compte gratuit (aucune carte bancaire requise)</li>
              <li>
                Téléchargez l'application pour votre système :
                <ul className="ml-6 mt-2 space-y-1 list-disc">
                  <li>Windows, macOS, Linux</li>
                  <li>Android, iOS</li>
                  <li>Extensions navigateur (Chrome, Firefox)</li>
                </ul>
              </li>
              <li>Installez l'application et connectez-vous avec votre compte</li>
              <li>
                Cliquez sur <strong>Quick Connect</strong> pour vous connecter au serveur le plus rapide
              </li>
              <li>Votre connexion est maintenant sécurisée et anonyme !</li>
            </ol>
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-white mb-1">Version gratuite vs Premium</h4>
                <p className="text-gray-300 text-sm">
                  La version gratuite offre un accès à 3 pays et une vitesse moyenne. Pour plus de serveurs, une vitesse
                  maximale et des fonctionnalités avancées, vous pouvez passer à la version Premium.
                </p>
              </div>
            </div>
          </div>

          <Button asChild className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
            <a
              href="https://protonvpn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Télécharger Proton VPN
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 mt-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-white mb-2">Pourquoi combiner DNS et VPN ?</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Utiliser un DNS sécurisé comme 1.1.1.1 améliore la vitesse et la sécurité de vos requêtes DNS, tandis
                qu'un VPN comme Proton VPN chiffre tout votre trafic internet. Ensemble, ils offrent une protection
                complète de votre vie privée en ligne : le DNS protège vos requêtes de noms de domaine, et le VPN masque
                votre adresse IP et chiffre toutes vos données.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
