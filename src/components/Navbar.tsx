"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Menu, X, TrendingUp, Zap, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setMenuOpen(false);
    }
  }

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <Zap className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
          <span className="text-lg font-bold tracking-tight">
            TCG<span className="text-accent">Signals</span>
          </span>
        </Link>

        {/* Search bar - desktop */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-md mx-4"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cartas, sets, booster boxes..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-secondary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
            />
          </div>
        </form>

        {/* Nav links - desktop */}
        <div className="hidden md:flex items-center gap-5 text-sm">
          <Link
            href="/search?tcg=pokemon"
            className="text-text-secondary hover:text-pokemon transition-colors font-medium"
          >
            Pokemon
          </Link>
          <Link
            href="/search?tcg=onepiece"
            className="text-text-secondary hover:text-onepiece transition-colors font-medium"
          >
            One Piece
          </Link>
          <Link
            href="/sets"
            className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors font-medium"
          >
            <Layers className="w-4 h-4" />
            Sets
          </Link>
          <Link
            href="/search?view=trending"
            className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors font-medium"
          >
            <TrendingUp className="w-4 h-4" />
            Trending
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile: theme + menu */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu - animated */}
      <div
        className={`md:hidden border-t border-border overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-4 space-y-4 bg-bg-secondary">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar cartas..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </form>
          <div className="flex flex-col gap-3 text-sm">
            <Link
              href="/search?tcg=pokemon"
              onClick={() => setMenuOpen(false)}
              className="text-text-secondary hover:text-pokemon py-1 font-medium"
            >
              Pokemon
            </Link>
            <Link
              href="/search?tcg=onepiece"
              onClick={() => setMenuOpen(false)}
              className="text-text-secondary hover:text-onepiece py-1 font-medium"
            >
              One Piece
            </Link>
            <Link
              href="/sets"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-1.5 text-text-secondary hover:text-accent py-1 font-medium"
            >
              <Layers className="w-4 h-4" />
              Sets
            </Link>
            <Link
              href="/search?view=trending"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-1.5 text-text-secondary hover:text-accent py-1 font-medium"
            >
              <TrendingUp className="w-4 h-4" />
              Trending
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
