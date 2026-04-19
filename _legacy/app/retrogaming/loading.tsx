export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span className="text-blue-400">🎮</span>
          Retrogaming
        </h1>
        <p className="text-muted-foreground">Chargement des jeux rétro...</p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 w-full"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
