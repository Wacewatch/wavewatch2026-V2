export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Anime</h1>
        <p className="text-xl text-muted-foreground">Chargement des animes...</p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 w-full"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
