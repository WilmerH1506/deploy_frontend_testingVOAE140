import { useState, useEffect } from "react"
import {
  GraduationCap, Target, Eye, Users, UserCheck, Mail, Award,
  Briefcase, Globe, Terminal, ChevronLeft, ChevronRight,
  Shield, Zap, Newspaper, PlusCircle, Pin, AlertCircle, Loader2, Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  UNAH_BLUE, UNAH_GOLD, UNAH_WHITE, UNAH_BLUE_SOFT,
  UNAH_BLUE_GRADIENT, UNAH_BLUE_LIGHT,
} from "@/lib/colors"
import { authStore } from "@/articulo-140/auth/store/authStore"
import { useAboutSections } from "@/articulo-140/hooks/activities/admin/useAboutSections"
import { useAboutPosts } from "@/articulo-140/hooks/activities/admin/useAboutPosts"
import { useIsMobile } from "@/hooks/use-mobile"

// ── Subcomponentes ────────────────────────────────────────────────────────────
import { PostCard, toBool, CATEGORY_CONFIG } from "./components/PostCard"
import { PostModal } from "./components/PostModal"
import { AdminPanel } from "./components/AdminPanel"
import { CloudinaryPicker } from "./components/CloudinaryPicker"
import { ObjectiveItem } from "./components/ObjetiveItem"
import type { SectionKey } from "./components/AdminPanel"

// ── Datos estáticos ───────────────────────────────────────────────────────────
import {
  TECH_STACK, COMPETENCIAS, AUTORIDADES,
  OBJETIVOS, GALLERY_IMAGES, getCodeLines,
} from "./data/about.data"

import type { Post, PostCategory, CreatePostBody } from "@/articulo-140/interfaces/about.response"

export const AboutPage = () => {
  const isAdmin = authStore((s) => s.isAdmin)()
  const isMobile = useIsMobile()

  const [panelOpen,      setPanelOpen]     = useState(false)
  const [postModalOpen,  setPostModalOpen]  = useState(false)
  const [editingPost,    setEditingPost]    = useState<Post | null>(null)
  const [pickerOpen,     setPickerOpen]     = useState(false)
  const [pickerCallback, setPickerCallback] = useState<((url: string) => void) | null>(null)
  const [activeCategory, setActiveCategory] = useState<PostCategory | "all">("all")
  const [currentSlide,   setCurrentSlide]   = useState(0)
  const [displayedText,  setDisplayedText]  = useState("")
  const [currentLine,    setCurrentLine]    = useState(0)
  const [stats, setStats] = useState({ hours: 0, digitalized: 0, paper: 0 })

  // ── Sections ──────────────────────────────────────────────────────────────────
  const { query: sectionsQuery, mutation: sectionsMutation } = useAboutSections()
  const rawSections   = sectionsQuery.data?.data?.[0]
  const sectionsReady = !sectionsQuery.isLoading && rawSections !== undefined

  const sections: Record<SectionKey, boolean> = {
    carousel:     toBool(rawSections?.carousel),
    misionVision: toBool(rawSections?.mision_vision),
    competencias: toBool(rawSections?.competencies),
    objetivos:    toBool(rawSections?.goals),
  }

  const handleToggleSection = (key: SectionKey) => {
    sectionsMutation.mutate({
      carousel:      key === "carousel"     ? !sections.carousel     : sections.carousel,
      mision_vision: key === "misionVision" ? !sections.misionVision : sections.misionVision,
      competencies:  key === "competencias" ? !sections.competencias : sections.competencias,
      goals:         key === "objetivos"    ? !sections.objetivos    : sections.objetivos,
    })
  }

  // ── Posts ─────────────────────────────────────────────────────────────────────
  const {
    query: postsQuery,
    createMutation, updateMutation, deleteMutation,
    toggleVisibilityMutation, togglePinMutation,
  } = useAboutPosts(isAdmin)

  const allPosts      = postsQuery.data?.data ?? []
  const filteredPosts = activeCategory === "all" ? allPosts : allPosts.filter(p => p.category === activeCategory)
  const pinnedPosts   = filteredPosts.filter(p => toBool(p.is_pinned))
  const normalPosts   = filteredPosts.filter(p => !toBool(p.is_pinned))

  const handleSavePost = (data: CreatePostBody, id?: string) => {
    id ? updateMutation.mutate({ id, data }) : createMutation.mutate(data)
    setEditingPost(null)
    setPostModalOpen(false)
  }
  const handleDeletePost    = (id: string) => { deleteMutation.mutate(id); setPostModalOpen(false); setEditingPost(null) }
  const handleTogglePin     = (id: string) => togglePinMutation.mutate(id)
  const handleToggleVisible = (id: string) => toggleVisibilityMutation.mutate(id)
  const openPickerFor       = (cb: (url: string) => void) => { setPickerCallback(() => cb); setPickerOpen(true) }
  const openEditPost        = (p: Post) => { setEditingPost(p); setPostModalOpen(true) }

  // ── Código animado ────────────────────────────────────────────────────────────
  const codeLines = getCodeLines(UNAH_BLUE, UNAH_GOLD)
  useEffect(() => {
    if (currentLine >= codeLines.length) return
    const line = codeLines[currentLine]; let charIndex = 0
    const timer = setInterval(() => {
      if (charIndex <= line.length) {
        setDisplayedText(prev => { const lines = prev.split('\n'); lines[currentLine] = line.slice(0, charIndex); return lines.join('\n') })
        charIndex++
      } else { clearInterval(timer); setTimeout(() => { setCurrentLine(p => p + 1); setDisplayedText(p => p + '\n') }, 100) }
    }, 30)
    return () => clearInterval(timer)
  }, [currentLine])

  // ── Estadísticas animadas ─────────────────────────────────────────────────────
  useEffect(() => {
    const anim = (end: number, setter: (v: number) => void, dur = 2000) => {
      let v = 0; const inc = end / (dur / 16)
      const t = setInterval(() => { v += inc; if (v >= end) { setter(end); clearInterval(t) } else setter(Math.floor(v)) }, 16)
      return () => clearInterval(t)
    }
    const c1 = anim(1250, (v) => setStats(p => ({ ...p, hours: v })))
    const c2 = anim(100,  (v) => setStats(p => ({ ...p, digitalized: v })))
    const c3 = anim(0,    (v) => setStats(p => ({ ...p, paper: v })), 1000)
    return () => { c1(); c2(); c3() }
  }, [])

  const isSavingPost = createMutation.isPending || updateMutation.isPending

  return (
    <div className="min-h-screen" style={{ background: UNAH_WHITE }}>

      {/* ── Modales ───────────────────────────────────────────────────────────── */}
      <CloudinaryPicker
        open={pickerOpen}
        onClose={() => { setPickerOpen(false); setPickerCallback(null) }}
        onSelect={(url) => { pickerCallback?.(url); setPickerOpen(false); setPickerCallback(null) }}
      />
      <PostModal
        open={postModalOpen} post={editingPost}
        onClose={() => { setPostModalOpen(false); setEditingPost(null) }}
        onSave={handleSavePost} onDelete={handleDeletePost}
        onOpenPicker={openPickerFor} isSaving={isSavingPost}
      />

      {/* ── Admin ─────────────────────────────────────────────────────────────── */}
      {isAdmin && (
        <>
          {/* Botón flotante: en mobile queda abajo al centro, en desktop abajo a la derecha */}
          <button
            onClick={() => setPanelOpen(true)}
            className="fixed z-30 flex items-center gap-2 font-semibold shadow-xl transition-all hover:scale-105 hover:opacity-90"
            style={{
              background: UNAH_BLUE,
              color: "#fff",
              // Mobile: ancho casi completo centrado en la parte inferior
              ...(isMobile
                ? { bottom: 16, left: "50%", transform: "translateX(-50%)", borderRadius: 999, paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12, fontSize: 14, whiteSpace: "nowrap" }
                : { bottom: 24, right: 24, borderRadius: 999, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, fontSize: 14 }
              ),
            }}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span>Administrar tablón</span>
          </button>

          {/* AdminPanel: full-width en mobile */}
          <AdminPanel
            open={panelOpen} onClose={() => setPanelOpen(false)}
            sections={sections} onToggleSection={handleToggleSection}
            onNewPost={() => { setEditingPost(null); setPostModalOpen(true) }}
            postCount={allPosts.length}
            isSavingSections={sectionsMutation.isPending}
          />
        </>
      )}

      {/* Padding extra en la parte inferior en mobile para que el FAB no tape contenido */}
      <div
        className="max-w-6xl mx-auto space-y-6 md:space-y-8"
        style={{
          paddingLeft: isMobile ? 12 : 16,
          paddingRight: isMobile ? 12 : 16,
          paddingTop: isMobile ? 16 : 32,
          paddingBottom: isAdmin && isMobile ? 80 : isMobile ? 24 : 32,
        }}
      >

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ background: UNAH_BLUE_SOFT }}>
          {/* En mobile: columna única. En desktop: dos columnas */}
          <div className={`grid gap-0 ${isMobile ? "grid-cols-1" : "md:grid-cols-2"} min-h-[${isMobile ? "auto" : "500px"}]`}>
            <div
              className="p-6 md:p-12 flex flex-col justify-center"
              style={{ borderBottom: isMobile ? `1px solid ${UNAH_BLUE}15` : undefined, borderRight: !isMobile ? `1px solid ${UNAH_BLUE}15` : undefined }}
            >
              <div className="space-y-4 md:space-y-6">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium border"
                  style={{ borderColor: `${UNAH_BLUE}30`, color: UNAH_BLUE, background: `${UNAH_BLUE}08` }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: UNAH_GOLD }} />
                  <span style={{ whiteSpace: "normal", lineHeight: "1.4" }}>UNAH - Ingeniería en Sistemas Computacionales</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold leading-tight text-gray-900">
                  Sistema de Gestión <span style={{ color: UNAH_BLUE }}>VOAE</span>
                </h1>
                <h2 className="text-lg md:text-2xl font-medium" style={{ color: UNAH_BLUE }}>
                  Universidad Nacional Autónoma de Honduras
                </h2>
                <p className="text-sm md:text-base leading-relaxed text-gray-600">
                  Sistema desarrollado por estudiantes de Ingeniería en Sistemas Computacionales para la gestión eficiente de horas VOAE.
                </p>
              </div>
            </div>

            {/* VS Code: visible completo en desktop, versión compacta en mobile */}
            <div className="flex flex-col rounded-br-2xl overflow-hidden" style={{ background: "#EFF6FF", borderTopRightRadius: isMobile ? 0 : undefined }}>
              <div className="flex items-center gap-2 px-4 py-2 md:py-3" style={{ background: "#DBEAFE", borderBottom: "1px solid #BFDBFE" }}>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500" />
                </div>
                <span className="mx-auto text-xs font-medium" style={{ color: "#3D5A8A" }}>sistema_voae.js</span>
              </div>
              {/* En mobile se muestra más pequeño con max-height para no ocupar demasiado */}
              <div
                className="flex flex-1 overflow-hidden py-3 md:py-4"
                style={{ maxHeight: isMobile ? 180 : undefined, overflowY: isMobile ? "hidden" : undefined }}
              >
                <pre className="font-mono text-xs md:text-sm leading-relaxed w-full overflow-x-auto">
                  {displayedText.split('\n').map((line, i) => (
                    <div
                      key={i}
                      className="flex"
                      style={{ minHeight: "1.5rem", background: i === currentLine ? "#DBEAFE" : "transparent" }}
                    >
                      <span
                        className="select-none text-right pr-3 md:pr-4 pl-3 md:pl-4 text-xs w-8 md:w-12 flex-shrink-0"
                        style={{ color: "#7B9FC7", lineHeight: "1.5rem" }}
                      >
                        {i + 1}
                      </span>
                      <span className="w-0.5 flex-shrink-0" style={{ background: i === currentLine ? UNAH_BLUE : "transparent" }} />
                      <span
                        className="pl-3 md:pl-4 pr-3 md:pr-4 w-full"
                        style={{ lineHeight: "1.5rem", color: line.includes('//') ? "#6B7AA0" : "#0D1117", fontStyle: line.includes('//') ? "italic" : "normal" }}
                      >
                        {line}{i === currentLine && <span className="animate-pulse" style={{ borderLeft: "2px solid #555550", marginLeft: "1px" }} />}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
              <div className="flex justify-between px-4 py-1 text-xs" style={{ background: "#BFDBFE", color: "#1E3A6E" }}>
                <span>main · JavaScript</span>
                <span style={{ color: UNAH_BLUE, fontWeight: 600 }}>VOAE UNAH</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Estadísticas ──────────────────────────────────────────────────── */}
        {/* Mobile: 1 col, tablet+: 3 col */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {[
            { label: "Horas Gestionadas",    value: `+${stats.hours.toLocaleString()}`, suffix: "+",  icon: <Zap className="w-5 h-5 md:w-6 md:h-6" />,    accent: UNAH_BLUE },
            { label: "Proceso Digitalizado", value: stats.digitalized,                  suffix: "%",  icon: <Globe className="w-5 h-5 md:w-6 md:h-6" />,  accent: UNAH_BLUE_GRADIENT },
            { label: "Papel Desperdiciado",  value: stats.paper,                         suffix: "kg", icon: <Shield className="w-5 h-5 md:w-6 md:h-6" />, accent: UNAH_BLUE_LIGHT },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl p-4 md:p-6 border"
              style={{ background: UNAH_BLUE_SOFT, borderColor: `${s.accent}20`, borderLeft: `4px solid ${s.accent}` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium" style={{ color: s.accent }}>{s.label}</p>
                  <p className="text-3xl md:text-4xl font-bold mt-1 md:mt-2" style={{ color: s.accent }}>
                    {s.value}<span style={{ color: UNAH_GOLD }}>{s.suffix}</span>
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center" style={{ background: `${s.accent}10`, color: s.accent }}>
                  {s.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tech Stack ────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 p-5 md:p-8" style={{ background: UNAH_BLUE_SOFT }}>
          <div className="flex items-center gap-3 mb-5 md:mb-6">
            <Terminal className="w-6 h-6 md:w-7 md:h-7" style={{ color: UNAH_BLUE }} />
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Stack Tecnológico</h2>
          </div>
          {/* Mobile: 4 col. Desktop: 8 col */}
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
            {TECH_STACK.map((t) => (
              <div
                key={t.name}
                className="aspect-square bg-white border border-blue-100 rounded-xl flex flex-col items-center justify-center p-2 md:p-4 hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                <img
                  src={t.iconUrl} alt={t.name}
                  className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
                <span className="text-[10px] md:text-xs font-medium text-gray-700 text-center leading-tight">{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tablón de noticias ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 p-5 md:p-8" style={{ background: UNAH_BLUE_SOFT }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-5 md:mb-6">
            <div className="flex items-center gap-3">
              <Newspaper className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0" style={{ color: UNAH_BLUE }} />
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Tablón de Noticias</h2>
                <p className="text-xs md:text-sm text-gray-500">
                  {filteredPosts.length} publicación{filteredPosts.length !== 1 ? "es" : ""}
                  {activeCategory !== "all" && ` en ${CATEGORY_CONFIG[activeCategory].label}`}
                </p>
              </div>
            </div>
            {isAdmin && (
              // En mobile el botón ocupa todo el ancho disponible para facilitar el toque
              <button
                onClick={() => { setEditingPost(null); setPostModalOpen(true) }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 w-full sm:w-auto"
                style={{ background: UNAH_BLUE, color: "#fff" }}
              >
                <PlusCircle className="w-4 h-4" /> Nueva publicación
              </button>
            )}
          </div>

          {/* Filtros: scroll horizontal en mobile */}
          <div className="flex gap-2 mb-5 md:mb-6 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {([["all", "Todas"], ...Object.entries(CATEGORY_CONFIG).map(([k, v]) => [k, v.label])] as [string, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key as PostCategory | "all")}
                className="px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all border flex-shrink-0"
                style={activeCategory === key
                  ? { background: UNAH_BLUE, color: "#fff", borderColor: UNAH_BLUE }
                  : { background: UNAH_WHITE, color: "#6b7280", borderColor: "#e5e7eb" }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Aviso posts ocultos */}
          {isAdmin && allPosts.some(p => !toBool(p.is_visible)) && (
            <div
              className="flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl mb-4 text-xs md:text-sm"
              style={{ background: `${UNAH_GOLD}15`, color: "#92400e", border: `1px solid ${UNAH_GOLD}40` }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Hay publicaciones ocultas visibles solo para administradores
            </div>
          )}

          {/* Feed */}
          {postsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12 md:py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: UNAH_BLUE }} />
            </div>
          ) : postsQuery.isError ? (
            <div className="text-center py-12 md:py-16 text-red-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-sm md:text-base">Error al cargar las publicaciones</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 md:py-16 text-gray-400">
              <Newspaper className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-sm md:text-base">
                {activeCategory === "all" ? "No hay publicaciones aún" : "No hay publicaciones en esta categoría"}
              </p>
              {isAdmin && activeCategory === "all" && (
                <p className="text-xs md:text-sm mt-1">Crea la primera desde el botón de arriba</p>
              )}
            </div>
          ) : (
            <div className="space-y-5 md:space-y-6">
              {pinnedPosts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5" style={{ color: UNAH_GOLD }} /> Fijadas
                  </p>
                  {/* Mobile: 1 col. sm: 2 col. lg: 3 col */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {pinnedPosts.map(post => (
                      <PostCard key={post.id} post={post} isAdmin={isAdmin}
                        onEdit={openEditPost} onTogglePin={handleTogglePin} onToggleVisible={handleToggleVisible} />
                    ))}
                  </div>
                </div>
              )}
              {normalPosts.length > 0 && (
                <div>
                  {pinnedPosts.length > 0 && (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recientes</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {normalPosts.map(post => (
                      <PostCard key={post.id} post={post} isAdmin={isAdmin}
                        onEdit={openEditPost} onTogglePin={handleTogglePin} onToggleVisible={handleToggleVisible} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Carrusel ──────────────────────────────────────────────────────── */}
        {sectionsReady && sections.carousel && (
          <div className="rounded-xl border border-gray-200 p-5 md:p-8" style={{ background: UNAH_BLUE_SOFT }}>
            <div className="flex items-center gap-3 mb-5 md:mb-6">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6" style={{ color: UNAH_BLUE }} />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Galería</h2>
            </div>
            <div className="relative">
              <div
                className="bg-gradient-to-br from-blue-50 to-white rounded-lg flex items-center justify-center border border-blue-100"
                style={{ height: isMobile ? 200 : 288 }}
              >
                <div className="text-center p-6 md:p-8">
                  <GraduationCap className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-3 md:mb-4 text-blue-200" />
                  <p className="text-sm md:text-base text-gray-600 font-semibold">{GALLERY_IMAGES[currentSlide].placeholder}</p>
                </div>
              </div>
              <Button
                variant="ghost" size="icon"
                onClick={() => setCurrentSlide((p) => (p - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full shadow-lg"
                style={{ color: UNAH_BLUE }}
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                onClick={() => setCurrentSlide((p) => (p + 1) % GALLERY_IMAGES.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full shadow-lg"
                style={{ color: UNAH_BLUE }}
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <div className="flex justify-center gap-2 mt-3 md:mt-4">
                {GALLERY_IMAGES.map((_, i) => (
                  <button
                    key={i} onClick={() => setCurrentSlide(i)}
                    className="h-2 rounded-full transition-all"
                    style={{ background: currentSlide === i ? UNAH_BLUE : "#d1d5db", width: currentSlide === i ? 32 : 8 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Misión y Visión ───────────────────────────────────────────────── */}
        {sectionsReady && sections.misionVision && (
          // Mobile: 1 col. md: 2 col
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div
              className="rounded-xl border p-6 md:p-8"
              style={{ background: UNAH_WHITE, borderColor: UNAH_BLUE, boxShadow: `0 4px 24px 0 ${UNAH_BLUE}20` }}
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <Target className="w-6 h-6 md:w-7 md:h-7" style={{ color: UNAH_BLUE }} />
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Misión</h2>
              </div>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                Proveer al estudiante los conocimientos teórico-prácticos necesarios en las áreas de desarrollo de software, administración de recursos, infraestructura y telecomunicaciones, con el fin de formar un profesional de clase mundial capaz de investigar, desarrollar, innovar y formular soluciones a los problemas y necesidades presentes y futuras del país.
              </p>
            </div>
            <div
              className="rounded-xl border p-6 md:p-8"
              style={{ background: UNAH_WHITE, borderColor: UNAH_BLUE_GRADIENT, boxShadow: `0 4px 24px 0 ${UNAH_BLUE_GRADIENT}20` }}
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <Eye className="w-6 h-6 md:w-7 md:h-7" style={{ color: UNAH_BLUE }} />
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Visión</h2>
              </div>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                Proveer al país profesionales íntegros, vinculados y comprometidos con la sociedad, que posean las capacidades y habilidades tecnológicas e investigativas necesarias para garantizar el desarrollo e integración de los procesos productivos del país.
              </p>
            </div>
          </div>
        )}

        {/* ── Competencias ──────────────────────────────────────────────────── */}
        {sectionsReady && sections.competencias && (
          <div className="rounded-xl border border-gray-200 p-5 md:p-8" style={{ background: UNAH_BLUE_SOFT }}>
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Áreas de Competencia</h2>
            </div>
            {/* Mobile: 1 col. md: 2 col. lg: 3 col */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {COMPETENCIAS.map((c, i) => (
                <div
                  key={i}
                  className={`${c.bgColor} border ${c.borderColor} rounded-2xl p-5 md:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className={`p-2.5 md:p-3 rounded-xl bg-gradient-to-br ${c.color} text-white flex-shrink-0`}>{c.icon}</div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-base md:text-lg mb-1">{c.title}</h3>
                      <p className="text-gray-600 text-xs md:text-sm">{c.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200 flex flex-wrap gap-1.5 md:gap-2">
                    {c.skills.map((sk, si) => (
                      <span key={si} className="px-2.5 md:px-3 py-1 bg-white text-gray-700 rounded-full text-[10px] md:text-xs font-medium border border-gray-200">{sk}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Objetivos ─────────────────────────────────────────────────────── */}
        {sectionsReady && sections.objetivos && (
          <div
            className="rounded-xl p-5 md:p-8"
            style={{ background: UNAH_WHITE, border: `2px solid ${UNAH_BLUE_GRADIENT}`, boxShadow: `0 4px 24px 0 ${UNAH_BLUE_GRADIENT}40` }}
          >
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-5 md:mb-6">Objetivos de la Carrera</h2>
            <div className="space-y-4 md:space-y-5">
              {OBJETIVOS.map((o, i) => <ObjectiveItem key={i} text={o.text} delay={o.delay} />)}
            </div>
          </div>
        )}

        {/* ── Autoridades ───────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 p-5 md:p-8" style={{ background: UNAH_BLUE_SOFT }}>
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Users className="w-6 h-6 md:w-7 md:h-7" style={{ color: UNAH_BLUE }} />
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Autoridades del Proyecto</h2>
          </div>
          {/* Mobile: 1 col. lg: 2 col */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
            {AUTORIDADES.map((a, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all"
                style={{ background: UNAH_WHITE }}
              >
                <div
                  className="p-5 md:p-8 relative"
                  style={{ borderTop: `4px solid ${a.accentColor}`, borderBottom: `1px solid ${UNAH_BLUE}15` }}
                >
                  <div className="absolute top-3 right-3 md:top-4 md:right-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ background: `${a.accentColor}10`, color: a.accentColor }}>
                      <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:gap-6">
                    <div
                      className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ background: `${a.accentColor}10`, borderColor: `${a.accentColor}30` }}
                    >
                      <span className="text-xl md:text-2xl font-bold" style={{ color: a.accentColor }}>{a.initials}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base md:text-xl font-bold text-gray-900 mb-0.5 md:mb-1 break-words">{a.name}</h3>
                      <p className="font-medium text-xs md:text-sm mb-0.5 md:mb-1" style={{ color: a.accentColor }}>{a.position}</p>
                      <p className="text-gray-500 text-xs md:text-sm break-words">{a.department}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 md:p-8">
                  <div className="flex items-start gap-3 mb-4 md:mb-6">
                    <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg flex-shrink-0"><Mail className="w-4 h-4 md:w-5 md:h-5 text-blue-600" /></div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Correo Institucional</p>
                      <p className="text-xs md:text-sm text-gray-700 font-medium break-all">{a.email}</p>
                    </div>
                  </div>
                  <div className="pt-3 md:pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <Award className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-800 text-sm md:text-base">Formación Académica</h4>
                    </div>
                    {a.education.map((item, ei) => (
                      <div key={ei} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full mt-1.5 md:mt-2 flex-shrink-0" />
                        <span className="text-xs md:text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200">
                    <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-blue-50 text-blue-700 rounded-full text-xs md:text-sm font-medium">
                      <UserCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />{a.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer institucional */}
          <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200 text-center">
            <div
              className="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-medium mb-3 md:mb-4 border"
              style={{ borderColor: `${UNAH_BLUE}30`, color: UNAH_BLUE, background: `${UNAH_BLUE}08` }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: UNAH_GOLD }} />
              Universidad Nacional Autónoma de Honduras
            </div>
            <p className="text-xs md:text-sm text-gray-700 mb-3 md:mb-4 px-2">
              Facultad de Ingeniería - Departamento de Ingeniería en Sistemas Computacionales
            </p>
            {/* En mobile los links se apilan verticalmente */}
            <div className={`flex ${isMobile ? "flex-col items-center gap-4" : "flex-row flex-wrap gap-6 justify-center"} mt-3 md:mt-4`}>
              <a
                href="https://is.unah.edu.hn/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold hover:underline text-sm"
              >
                <GraduationCap className="w-4 h-4 md:w-5 md:h-5 mr-2" />Departamento de Sistemas
              </a>
              {!isMobile && <div className="w-px h-6 bg-gray-300" />}
              <a
                href="https://www.unah.edu.hn/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold hover:underline text-sm"
              >
                <Globe className="w-4 h-4 md:w-5 md:h-5 mr-2" />Portal Institucional UNAH
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}