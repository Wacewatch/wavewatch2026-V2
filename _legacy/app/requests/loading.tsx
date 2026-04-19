export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Demandes</h1>
        <p className="text-xl text-muted-foreground">Chargement des demandes...</p>
      </div>

      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20 w-full"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
