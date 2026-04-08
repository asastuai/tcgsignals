import type { Metadata } from "next"
import { fetchCardById } from "@/lib/data"
import { fmtUsd } from "@/lib/utils"
import CardDetailPage from "./card-detail"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const card = await fetchCardById(id)

  if (!card) {
    return { title: "Card Not Found" }
  }

  const title = `${card.name} - ${fmtUsd(card.price)} | ${card.set}`
  const description = `${card.name} from ${card.set} (${card.tcg}) — current price ${fmtUsd(card.price)}, ${card.change24h >= 0 ? "+" : ""}${card.change24h?.toFixed(1)}% 24h. Track price history, compare platforms, and find the best deals.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: card.image ? [{ url: card.image, width: 400, height: 560, alt: card.name }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: card.image ? [card.image] : [],
    },
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params
  return <CardDetailPage id={id} />
}
