"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Crown, Save, Loader2 } from "lucide-react"

export function CustomizationOptionsPanel({ options }: { options: any[] }) {
  const [localOptions, setLocalOptions] = useState(options)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const groupedOptions = localOptions.reduce((acc: any, option: any) => {
    if (!acc[option.category]) {
      acc[option.category] = []
    }
    acc[option.category].push(option)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    hairStyle: "Coiffures",
    hairColor: "Couleurs de Cheveux",
    skinTone: "Teints de Peau",
    topColor: "Couleurs de Haut",
    bottomColor: "Couleurs de Bas",
    shoeColor: "Couleurs de Chaussures",
    accessory: "Accessoires",
  }

  const handleToggleOption = (optionId: string, currentActive: boolean) => {
    setLocalOptions((prev) => prev.map((opt) => (opt.id === optionId ? { ...opt, is_active: !currentActive } : opt)))
  }

  const handleTogglePremium = (optionId: string, currentPremium: boolean) => {
    setLocalOptions((prev) => prev.map((opt) => (opt.id === optionId ? { ...opt, is_premium: !currentPremium } : opt)))
  }

  const handleSaveAll = async () => {
    setIsSaving(true)

    try {
      // Update all modified options
      for (const option of localOptions) {
        const originalOption = options.find((o) => o.id === option.id)
        if (
          originalOption &&
          (originalOption.is_active !== option.is_active || originalOption.is_premium !== option.is_premium)
        ) {
          const { error } = await supabase
            .from("avatar_customization_options")
            .update({
              is_active: option.is_active ?? true,
              is_premium: option.is_premium ?? false,
            })
            .eq("id", option.id)

          if (error) {
            console.error("Error updating option:", error)
            throw error
          }
        }
      }

      toast({
        title: "Sauvegardé",
        description: "Les options de personnalisation ont été mises à jour",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Sauvegarder les modifications
        </Button>
      </div>

      {Object.entries(groupedOptions).map(([category, items]: [string, any]) => (
        <div key={category} className="space-y-3">
          <h3 className="font-semibold text-lg text-white">{categoryLabels[category] || category}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((option: any) => (
              <div
                key={option.id}
                className={`p-3 border rounded-lg space-y-2 transition-opacity ${
                  option.is_active === false ? "opacity-50 bg-gray-800/50" : "bg-gray-800"
                } border-gray-700`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{option.label}</span>
                  <div className="flex items-center gap-2">
                    {option.is_premium && <Crown className="w-4 h-4 text-yellow-500" />}
                  </div>
                </div>

                {category.includes("Color") || category === "skinTone" ? (
                  <div className="h-8 rounded border border-gray-600" style={{ background: option.value }} />
                ) : (
                  <div className="text-xs text-gray-400">{option.value}</div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={option.is_active !== false}
                      onCheckedChange={() => handleToggleOption(option.id, option.is_active !== false)}
                    />
                    <span className="text-xs text-gray-400">{option.is_active !== false ? "Actif" : "Inactif"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={option.is_premium === true}
                      onCheckedChange={() => handleTogglePremium(option.id, option.is_premium === true)}
                    />
                    <span className="text-xs text-gray-400">VIP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-4 border-t border-gray-700">
        <Button onClick={handleSaveAll} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Sauvegarder les modifications
        </Button>
      </div>
    </div>
  )
}
