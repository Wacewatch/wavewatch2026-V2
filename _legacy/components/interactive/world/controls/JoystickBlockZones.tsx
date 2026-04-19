"use client"

// Zones de blocage au-dessus des joysticks pour éviter les touches accidentelles
export function JoystickBlockZones() {
  return (
    <>
      {/* Zone de blocage au-dessus du joystick gauche (mouvement) */}
      <div
        className="fixed bottom-60 left-8 w-36 h-24 z-15 select-none touch-none"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      />
      {/* Zone de blocage au-dessus du joystick droit (caméra) */}
      <div
        className="fixed bottom-60 right-8 w-36 h-24 z-15 select-none touch-none"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      />
    </>
  )
}
