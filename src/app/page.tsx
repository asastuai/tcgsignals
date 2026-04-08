import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { PriceTicker } from "@/components/price-ticker"
import { MarketOverview } from "@/components/market-overview"
import { TopMovers } from "@/components/top-movers"
import { TrendingCards } from "@/components/trending-cards"
import { RecentlyListed } from "@/components/recently-listed"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <PriceTicker />
        <MarketOverview />
        <TopMovers />
        <TrendingCards />
        <RecentlyListed />
      </main>
      <Footer />
    </div>
  )
}
