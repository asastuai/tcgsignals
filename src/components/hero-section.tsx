import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, BarChart3, Shield } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* Ambient glow - single subtle accent, not overdone */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Pill badge */}
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
            Live market data
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            {"Track Every Card. "}
            <span className="text-primary">Catch Every Signal.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg text-pretty">
            Real-time price tracking for Pokemon, One Piece, Yu-Gi-Oh and MTG. Make smarter decisions backed by market data.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/explorer">
                Explore Cards
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/portfolio">Track Portfolio</Link>
            </Button>
          </div>
        </div>

        {/* Stats row - clean, no cards, just numbers */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40">
          {[
            { icon: BarChart3, value: "21,300+", label: "Cards tracked" },
            { icon: TrendingUp, value: "$2.4B", label: "Market volume" },
            { icon: Shield, value: "5 TCGs", label: "Supported" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 bg-card py-5 px-3">
              <stat.icon className="mb-1 h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
