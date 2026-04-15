import React from 'react';
import { Link } from 'react-router-dom';

export default function ContentGrid({ children, title, subtitle, link, icon }) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">{icon}{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {link && <Link to={link} className="text-sm text-blue-400 hover:underline">Voir tout</Link>}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {children}
      </div>
    </div>
  );
}
