import { useAuth } from "@/_core/hooks/useAuth";
import { Header, Footer } from "@/components/Brand";
import { trpc } from "@/lib/trpc";
import { COURSE_OFFER, findLesson, TOTAL_LESSONS } from "@shared/course";
import { Check, ChevronRight, Download, LockKeyhole, Play, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";

function sessionHeaders(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    const token = raw?.split(";").find(item => item.trim().startsWith("webdev_app_session="))?.trim().slice("webdev_app_session=".length);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

async function downloadResource(lessonId: string, resource: string) {
  const response = await fetch(`/api/academy/resources/${lessonId}`, { credentials: "include", headers: sessionHeaders() });
  if (!response.ok) throw new Error("La ressource n'est pas disponible pour le moment.");
  const href = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${resource.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.txt`;
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export default function Campus() {
  const { user, loading } = useAuth();
  const [, params] = useRoute("/campus/lecon/:lessonId");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const status = trpc.academy.status.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const completeLesson = trpc.academy.completeLesson.useMutation({ onSuccess: () => void utils.academy.status.invalidate() });
  const completed = useMemo(() => new Set(status.data?.completedLessonIds ?? []), [status.data?.completedLessonIds]);
  const allLessons = COURSE_OFFER.modules.flatMap(module => module.lessons);
  const resumedLessonId = allLessons.find(lesson => !completed.has(lesson.id))?.id ?? allLessons[allLessons.length - 1].id;
  const activeLesson = findLesson(params?.lessonId ?? resumedLessonId) ?? allLessons[0];
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!status.data?.enrolled) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    void fetch(`/api/academy/video/${activeLesson.id}`, { credentials: "include", headers: sessionHeaders() })
      .then(response => response.ok ? response.blob() : Promise.reject(new Error("Video unavailable")))
      .then(blob => { objectUrl = URL.createObjectURL(blob); if (!cancelled) setVideoUrl(objectUrl); })
      .catch(() => { if (!cancelled) setVideoUrl(null); });
    return () => { cancelled = true; setVideoUrl(null); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [activeLesson.id, status.data?.enrolled]);
  const activeIndex = allLessons.findIndex(lesson => lesson.id === activeLesson.id);
  const progress = Math.round((completed.size / TOTAL_LESSONS) * 100);

  if (loading || (user && status.isLoading)) return <div className="page-loading">Préparation de votre campus…</div>;
  if (!user) return <AccessGate />;
  if (!status.data?.enrolled) return <EnrollmentGate />;

  const nextLesson = allLessons[activeIndex + 1];
  return (
    <div className="campus-page">
      <Header />
      <main className="campus-shell">
        <section className="campus-hero">
          <div><p className="eyebrow">Votre espace apprenant</p><h1>Bonjour, {user.name?.split(" ")[0] || "vous"}.</h1><p>Continuez là où votre attention compte le plus.</p></div>
          <div className="progress-orbit"><span>{progress}%</span><small>terminé</small></div>
        </section>
        <div className="campus-layout">
          <aside className="course-rail" aria-label="Parcours de formation">
            <div className="rail-top"><span>Parcours</span><strong>{completed.size}/{TOTAL_LESSONS} leçons</strong></div>
            {COURSE_OFFER.modules.map(module => <section className="module-nav" key={module.id}>
              <p><b>{module.number}</b>{module.eyebrow}</p><h2>{module.title}</h2>
              {module.lessons.map(lesson => <button key={lesson.id} className={`lesson-nav ${lesson.id === activeLesson.id ? "is-active" : ""}`} onClick={() => setLocation(`/campus/lecon/${lesson.id}`)}>
                <span className={completed.has(lesson.id) ? "complete-dot" : "play-dot"}>{completed.has(lesson.id) ? <Check size={12} /> : <Play size={11} fill="currentColor" />}</span>
                <span><strong>{lesson.title}</strong><small>{lesson.duration} · {lesson.format}</small></span>
              </button>)}
            </section>)}
          </aside>
          <article className="lesson-stage">
            <div className="video-frame">{videoUrl ? <video className="lesson-video" controls preload="metadata" src={videoUrl}>Votre navigateur ne peut pas lire cette vidéo.</video> : <div className="video-loading"><Play size={23} fill="currentColor"/><span>Préparation de la leçon vidéo…</span></div>}</div>
            <div className="lesson-copy"><div className="lesson-meta"><span>{activeLesson.format}</span><span>{activeLesson.duration}</span></div><h1>{activeLesson.title}</h1><p className="lesson-summary">{activeLesson.summary}</p><div className="lesson-note"><Sparkles size={18}/><p><strong>À retenir</strong> — Cherchez la netteté avant la complexité. Une décision claire vaut plus qu'une idée brillante laissée sans structure.</p></div></div>
            <div className="lesson-actions">
              {activeLesson.resource && <button className="resource-button" onClick={() => void downloadResource(activeLesson.id, activeLesson.resource!).catch(error => window.alert(error.message))}><Download size={17} /> Télécharger « {activeLesson.resource} »</button>}
              <button className={`complete-button ${completed.has(activeLesson.id) ? "done" : ""}`} disabled={completed.has(activeLesson.id) || completeLesson.isPending} onClick={() => completeLesson.mutate({ lessonId: activeLesson.id })}><Check size={18} /> {completed.has(activeLesson.id) ? "Leçon terminée" : "Marquer comme terminée"}</button>
            </div>
            {nextLesson && <button className="next-lesson" onClick={() => setLocation(`/campus/lecon/${nextLesson.id}`)}><span>À suivre</span><strong>{nextLesson.title}</strong><ChevronRight size={20} /></button>}
          </article>
        </div>
        <section className="orders-panel"><div><p className="eyebrow">Vos achats</p><h2>Historique</h2></div><div>{status.data.purchases.length ? status.data.purchases.map(order => <p key={`${order.courseSlug}-${order.completedAt}`}><strong>Le Système Signature</strong><span>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(order.completedAt))} · {(order.amountCents / 100).toLocaleString("fr-FR", { style: "currency", currency: order.currency })} · {order.status === "paid" ? "Payé" : order.status}</span></p>) : <p><span>Aucun achat enregistré.</span></p>}</div></section>
      </main>
      <Footer />
    </div>
  );
}

function AccessGate() { return <div className="gate-page"><Header /><main className="gate-card"><LockKeyhole size={28}/><p className="eyebrow">Espace privé</p><h1>Votre place vous attend.</h1><p>Connectez-vous pour retrouver votre progression et vos ressources.</p><button onClick={() => window.location.assign("/")}>Revenir découvrir le programme</button></main><Footer /></div>; }
function EnrollmentGate() { return <div className="gate-page"><Header /><main className="gate-card"><Sparkles size={28}/><p className="eyebrow">Accès réservé</p><h1>Le campus s'ouvre après votre inscription.</h1><p>Votre compte est prêt. Il ne manque plus que votre place dans la formation.</p><Link href="/#tarif" className="button-link">Voir l'offre <ChevronRight size={17}/></Link></main><Footer /></div>; }
