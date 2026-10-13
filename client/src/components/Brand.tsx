import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { ArrowUpRight, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className={`brand ${inverse ? "brand--inverse" : ""}`} aria-label="Académie Nocturne — Accueil">
      <span className="brand-mark" aria-hidden="true"><i /><b /></span>
      <span className="brand-name">Académie<br /><em>Nocturne</em></span>
    </Link>
  );
}

export function Header() {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand inverse />
        <nav className="desktop-nav" aria-label="Navigation principale">
          <a href="/#programme">Le programme</a>
          <a href="/#approche">L'approche</a>
          <a href="/#temoignages">Témoignages</a>
        </nav>
        <div className="header-actions">
          {loading ? <span className="header-loading" aria-label="Chargement" /> : user ? <>
            <button className="nav-account" onClick={() => setLocation("/campus")}>Mon campus <ArrowUpRight size={15} /></button>
            <button className="nav-logout" aria-label="Se déconnecter" onClick={() => void logout()}><LogOut size={17} /></button>
          </> : <button className="nav-account" onClick={startLogin}>Connexion <ArrowUpRight size={15} /></button>}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <Brand inverse />
        <p>Une expérience d'apprentissage conçue pour aller à l'essentiel.</p>
        <span>© {new Date().getFullYear()} Académie Nocturne</span>
      </div>
    </footer>
  );
}
