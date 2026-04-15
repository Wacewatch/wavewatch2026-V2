import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ContentGrid({ children, title, subtitle, link, icon }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      const w = scrollRef.current.offsetWidth * 0.7;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -w : w, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4 group/section">
      {title && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">{icon}{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-secondary">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-secondary">
              <ChevronRight className="w-4 h-4" />
            </button>
            {link && <Link to={link} className="text-sm text-blue-400 hover:underline ml-2">Voir tout</Link>}
          </div>
        </div>
      )}
      <div ref={scrollRef} className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {React.Children.map(children, child => (
          <div className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
