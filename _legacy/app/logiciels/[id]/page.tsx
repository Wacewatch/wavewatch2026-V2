import { supabase } from "@/lib/supabase-client"
import { SoftwareDetails } from "@/components/software-details"
import { notFound } from "next/navigation"

interface SoftwarePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SoftwarePage({ params }: SoftwarePageProps) {
  const { id } = await params

  try {
    const { data: software, error } = await supabase
      .from("software")
      .select("*")
      .eq("id", Number.parseInt(id))
      .eq("is_active", true)
      .single()

    if (error || !software) {
      notFound()
    }

    return <SoftwareDetails software={software} />
  } catch (error) {
    console.error("Error fetching software details:", error)
    notFound()
  }
}
