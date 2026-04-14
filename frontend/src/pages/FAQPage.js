import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  { q: "Comment regarder un film ou une serie ?", a: "Cliquez sur le contenu souhaite, puis appuyez sur le bouton 'Regarder' pour acceder au streaming." },
  { q: "Comment devenir VIP ?", a: "Rendez-vous sur la page Abonnement pour decouvrir nos offres VIP et VIP+. Vous pouvez aussi tenter votre chance avec le jeu VIP quotidien." },
  { q: "Les contenus sont-ils gratuits ?", a: "Oui, l'acces basique est entierement gratuit. Les plans VIP offrent des fonctionnalites supplementaires." },
  { q: "Comment creer une playlist ?", a: "Connectez-vous, allez dans 'Mes Playlists' et cliquez sur 'Creer'. Vous pouvez ajouter des contenus depuis les pages de detail." },
  { q: "Comment signaler un probleme ?", a: "Utilisez la page 'Ecrire au staff' accessible depuis le footer pour nous contacter directement." },
  { q: "Puis-je changer le theme ?", a: "Oui ! Cliquez sur l'icone palette dans la barre de navigation pour acceder aux themes. Les membres VIP ont acces a des themes exclusifs." },
  { q: "Comment fonctionne l'historique ?", a: "Votre historique de visionnage est automatiquement enregistre quand vous regardez un contenu. Retrouvez-le dans votre tableau de bord." },
];

export default function FAQPage() {
  const [open, setOpen] = useState(null);
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl" data-testid="faq-page">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3"><HelpCircle className="w-8 h-8" />FAQ</h1>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
              <span className="font-medium">{f.q}</span>
              {open === i ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </button>
            {open === i && <div className="px-4 pb-4 text-muted-foreground">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
