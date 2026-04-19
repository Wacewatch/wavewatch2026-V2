import { HelpCircle, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export const metadata = {
  title: "FAQ - Questions Fréquentes - WaveWatch",
  description: "Trouvez des réponses aux questions les plus fréquemment posées sur WaveWatch",
}

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <HelpCircle className="w-10 h-10 text-blue-400" />
          <h1 className="text-4xl font-bold text-white">FAQ</h1>
        </div>
        <p className="text-gray-400 text-lg">Questions Fréquemment Posées</p>
      </div>

      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Général</CardTitle>
          <CardDescription className="text-gray-400">Questions générales sur WaveWatch</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">Qu'est-ce que WaveWatch ?</AccordionTrigger>
              <AccordionContent className="text-gray-300">
                WaveWatch est une plateforme de streaming premium qui vous permet d'accéder à une vaste collection de
                films, séries, animés, chaînes TV, radios et bien plus encore. Notre objectif est de vous offrir une
                expérience de divertissement complète et personnalisée.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">WaveWatch est-il gratuit ?</AccordionTrigger>
              <AccordionContent className="text-gray-300">
                WaveWatch propose un accès gratuit avec des fonctionnalités de base. Pour débloquer des fonctionnalités
                premium comme les thèmes exclusifs, l'accès prioritaire aux nouveautés et plus encore, vous pouvez
                souscrire à un abonnement VIP ou VIP+.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">Comment créer un compte ?</AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Cliquez sur le bouton "Inscription" en haut à droite de la page. Remplissez le formulaire avec votre
                adresse email et choisissez un mot de passe sécurisé. Vous recevrez un email de confirmation pour
                activer votre compte.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Sur quels appareils puis-je utiliser WaveWatch ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                WaveWatch est accessible depuis n'importe quel appareil avec un navigateur web moderne : ordinateurs
                (Windows, macOS, Linux), smartphones et tablettes (iOS, Android), et smart TVs avec navigateur intégré.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Contenu</CardTitle>
          <CardDescription className="text-gray-400">Questions sur le contenu disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Quel type de contenu est disponible ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                WaveWatch propose une large gamme de contenus : films (tous genres), séries TV, animés, chaînes TV en
                direct, radios FM, jeux rétro, et bientôt de la musique, des logiciels, des jeux et des ebooks.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                À quelle fréquence le contenu est-il mis à jour ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Notre catalogue est mis à jour régulièrement avec les dernières sorties. Les nouveautés sont ajoutées
                quotidiennement pour les films et séries, et nous mettons à jour nos chaînes TV et radios en temps réel.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Puis-je télécharger du contenu pour le regarder hors ligne ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Actuellement, WaveWatch est une plateforme de streaming en ligne uniquement. Le téléchargement hors
                ligne n'est pas disponible pour le moment, mais cette fonctionnalité est en cours de développement pour
                les membres VIP+.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Comment rechercher du contenu spécifique ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Utilisez la barre de recherche en haut de la page. Vous pouvez rechercher par titre, acteur, réalisateur
                ou genre. Les résultats incluent des films, séries, animés et autres contenus correspondant à votre
                recherche.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Playlists</CardTitle>
          <CardDescription className="text-gray-400">Gestion de vos playlists personnelles</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Comment créer une playlist ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Allez dans votre tableau de bord et cliquez sur "Créer une playlist". Donnez-lui un nom, une description
                et choisissez si elle sera publique ou privée. Vous pouvez ensuite ajouter du contenu en cliquant sur le
                bouton "+" sur n'importe quel film, série ou autre média.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Quelle est la différence entre une playlist publique et privée ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Une playlist privée n'est visible que par vous. Une playlist publique peut être découverte et consultée
                par tous les utilisateurs de WaveWatch. Les autres utilisateurs peuvent liker, commenter et ajouter vos
                playlists publiques à leurs favoris.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Puis-je personnaliser l'apparence de ma playlist ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Oui ! Vous pouvez choisir une couleur de thème pour votre playlist. Les membres VIP et VIP+ ont accès à
                des thèmes premium avec des dégradés et des effets visuels exclusifs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Combien de playlists puis-je créer ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Les membres standard peuvent créer jusqu'à 10 playlists. Les membres VIP peuvent en créer jusqu'à 50, et
                les membres VIP+ ont un nombre illimité de playlists.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Abonnements VIP</CardTitle>
          <CardDescription className="text-gray-400">Informations sur les abonnements premium</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Quels sont les avantages du statut VIP ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Les membres VIP bénéficient de : thèmes premium exclusifs, accès prioritaire aux nouveautés, jusqu'à 50
                playlists, badge VIP sur le profil, et support prioritaire.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Quelle est la différence entre VIP et VIP+ ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                VIP+ inclut tous les avantages VIP plus : thèmes premium supplémentaires, playlists illimitées, accès
                anticipé aux nouvelles fonctionnalités, téléchargement hors ligne (bientôt disponible), et badge VIP+
                exclusif.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">Comment devenir VIP ?</AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Cliquez sur le bouton "Devenir VIP" dans votre profil ou dans le menu utilisateur. Choisissez votre
                formule (VIP ou VIP+) et suivez les instructions de paiement. Votre statut sera activé immédiatement
                après le paiement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Puis-je annuler mon abonnement VIP ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Oui, vous pouvez annuler votre abonnement à tout moment depuis votre profil. Vous conserverez vos
                avantages VIP jusqu'à la fin de votre période de facturation en cours.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Technique</CardTitle>
          <CardDescription className="text-gray-400">Questions techniques et dépannage</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Quelle vitesse internet est recommandée ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Nous recommandons une connexion d'au moins 5 Mbps pour une qualité SD, 10 Mbps pour du HD, et 25 Mbps ou
                plus pour du Full HD/4K. Pour les chaînes TV en direct, une connexion stable de 10 Mbps minimum est
                idéale.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Le lecteur vidéo ne fonctionne pas, que faire ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Essayez ces solutions : 1) Actualisez la page (F5), 2) Videz le cache de votre navigateur, 3) Essayez un
                autre navigateur, 4) Vérifiez que JavaScript est activé, 5) Désactivez temporairement les bloqueurs de
                publicités. Si le problème persiste, contactez le support.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Comment améliorer la qualité de streaming ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Pour une meilleure qualité : 1) Utilisez une connexion filaire plutôt que Wi-Fi, 2) Fermez les autres
                applications utilisant internet, 3) Configurez un DNS rapide comme 1.1.1.1 (voir notre page DNS & VPN),
                4) Vérifiez que personne d'autre n'utilise votre connexion pour du streaming ou téléchargement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Puis-je utiliser un VPN avec WaveWatch ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Oui, WaveWatch fonctionne parfaitement avec un VPN. Nous recommandons Proton VPN pour sa fiabilité et sa
                version gratuite. Consultez notre page DNS & VPN pour plus d'informations sur la configuration.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Comment changer le thème de l'interface ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Allez dans votre profil et faites défiler jusqu'à la section "Thèmes". Cliquez sur le thème de votre
                choix pour l'appliquer immédiatement. Les membres VIP et VIP+ ont accès à des thèmes premium exclusifs.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Compte et Sécurité</CardTitle>
          <CardDescription className="text-gray-400">Protection de votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Comment réinitialiser mon mot de passe ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Sur la page de connexion, cliquez sur "Mot de passe oublié ?". Entrez votre adresse email et vous
                recevrez un lien pour réinitialiser votre mot de passe. Le lien est valide pendant 24 heures.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Comment sécuriser mon compte ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Utilisez un mot de passe fort et unique, ne le partagez jamais, déconnectez-vous sur les appareils
                publics, et changez régulièrement votre mot de passe. L'authentification à deux facteurs sera bientôt
                disponible pour une sécurité renforcée.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Puis-je supprimer mon compte ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Oui, vous pouvez supprimer votre compte depuis les paramètres de votre profil. Attention : cette action
                est irréversible et supprimera toutes vos données, playlists et historique.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-gray-700">
              <AccordionTrigger className="text-white hover:text-blue-400">
                Comment contacter le support ?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Vous pouvez contacter notre équipe via la page "Écrire au staff" accessible depuis le footer. Les
                membres VIP et VIP+ bénéficient d'un support prioritaire avec des temps de réponse plus rapides.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700 mt-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Search className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-white mb-2">Vous ne trouvez pas votre réponse ?</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Si vous n'avez pas trouvé la réponse à votre question, n'hésitez pas à contacter notre équipe de
                support. Nous sommes là pour vous aider !
              </p>
              <a
                href="/contact-staff"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Contacter le support →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
