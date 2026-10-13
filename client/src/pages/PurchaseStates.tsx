import { useAuth } from "@/_core/hooks/useAuth";
import { Footer, Header } from "@/components/Brand";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock3, MoveLeft, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";

export function PurchaseSuccess() {
  const { user } = useAuth();
  const status = trpc.academy.status.useQuery(undefined, { enabled: Boolean(user), retry: false, refetchInterval: 2500 });
  const ready = status.data?.enrolled;
  return <StatePage icon={ready ? <CheckCircle2/> : <Clock3/>} eyebrow={ready ? "Paiement confirmé" : "Confirmation en cours"} title={ready ? "Votre accès est ouvert." : "Nous activons votre accès."} copy={ready ? "Votre paiement a été validé et votre parcours est désormais disponible." : "Stripe vient de confirmer votre paiement. Cette page se met à jour automatiquement dès que votre accès est prêt."}>
    {ready ? <Link href="/campus" className="button-link">Entrer dans mon campus</Link> : <button onClick={() => void status.refetch()}>Actualiser le statut</button>}
  </StatePage>;
}

export function PurchaseCancelled() {
  return <StatePage icon={<ShieldCheck/>} eyebrow="Paiement non finalisé" title="Votre place reste disponible." copy="Aucun paiement n'a été enregistré. Vous pourrez reprendre votre inscription quand vous le souhaiterez."><Link href="/#tarif" className="button-link"><MoveLeft size={17}/> Revenir à l'offre</Link></StatePage>;
}

function StatePage({ icon, eyebrow, title, copy, children }: { icon: ReactNode; eyebrow: string; title: string; copy: string; children: ReactNode }) {
  return <div className="gate-page"><Header/><main className="gate-card state-card"><div className="state-icon">{icon}</div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{copy}</p><div className="state-actions">{children}</div></main><Footer/></div>;
}
