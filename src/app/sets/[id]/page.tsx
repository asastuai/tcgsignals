import type { Metadata } from "next"
import { fetchSetById } from "@/lib/data"
import SetDetailPage from "./set-detail"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const set = await fetchSetById(id)

  if (!set) {
    return { title: "Set Not Found" }
  }

  const title = `${set.name} — ${set.cardCount} Cards`
  const description = `Browse all ${set.cardCount} cards from ${set.name} (${set.series}, ${set.tcg}). View prices, rarity breakdown, and find the most valuable cards in this set.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: set.imageUrl ? [{ url: set.imageUrl, alt: set.name }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params
  return <SetDetailPage id={id} />
}
