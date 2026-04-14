import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API, { TMDB_IMG } from '../lib/api';
import ContentCard from '../components/ContentCard';
import { LoadingSpinner } from '../components/Loading';

export default function ActorDetailPage() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/api/tmdb/person/${id}`).then(({ data }) => setPerson(data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!person) return <div className="container mx-auto px-4 py-12 text-center">Acteur non trouve</div>;

  const allCredits = [...(person.movie_credits?.cast || []), ...(person.tv_credits?.cast || [])].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 24);

  return (
    <div className="container mx-auto px-4 py-8" data-testid="actor-detail-page">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div><div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted"><img src={person.profile_path ? `${TMDB_IMG}/w500${person.profile_path}` : 'https://placehold.co/500x750/333/ccc?text=?'} alt={person.name} className="w-full h-full object-cover" /></div></div>
        <div className="md:col-span-3 space-y-4">
          <h1 className="text-3xl font-bold">{person.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {person.birthday && <span>Ne(e) le {new Date(person.birthday).toLocaleDateString('fr-FR')}</span>}
            {person.place_of_birth && <span>{person.place_of_birth}</span>}
            <span>{person.known_for_department}</span>
          </div>
          {person.biography && <p className="text-base leading-relaxed text-muted-foreground">{person.biography}</p>}
        </div>
      </div>
      {allCredits.length > 0 && (
        <div><h2 className="text-2xl font-bold mb-4">Filmographie</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allCredits.map((c, i) => <ContentCard key={`${c.id}-${i}`} item={c} type={c.title ? 'movie' : 'tv'} />)}
          </div>
        </div>
      )}
    </div>
  );
}
