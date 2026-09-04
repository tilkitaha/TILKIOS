"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeDollarSign,
  Bell,
  Boxes,
  BrainCircuit,
  ChartNoAxesCombined,
  Check,
  CircleAlert,
  Clock3,
  Command,
  Database,
  LayoutDashboard,
  Megaphone,
  PlugZap,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  Store,
  Users,
  WalletCards,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import type { AgentName, DashboardData } from "@/lib/tilki-db";

type Recommendation = DashboardData["recommendations"][number];
type ViewName = "Dashboard" | AgentName | "Settings";

const agentMeta: Record<AgentName, { icon: LucideIcon; color: string; purpose: string }> = {
  "AI Manager": {
    icon: BrainCircuit,
    color: "text-orange-400",
    purpose: "Hedefleri görevlere ayırır ve doğru ajanı seçer.",
  },
  "Marketing AI": {
    icon: Megaphone,
    color: "text-pink-400",
    purpose: "İçerik, kampanya ve müşteri yorumlarını yönetir.",
  },
  "Sales AI": {
    icon: Users,
    color: "text-sky-400",
    purpose: "Müşteri takibi, teklif ve sadakat aksiyonları üretir.",
  },
  "Finance AI": {
    icon: WalletCards,
    color: "text-emerald-400",
    purpose: "Gelir, gider, kâr ve marj etkisini analiz eder.",
  },
  "Operations AI": {
    icon: Workflow,
    color: "text-violet-400",
    purpose: "Vardiya, yoğunluk ve süreç planlarını oluşturur.",
  },
  "Inventory AI": {
    icon: Boxes,
    color: "text-amber-400",
    purpose: "Stok ihtiyacını tahmin eder ve zayi riskini azaltır.",
  },
  "Analytics AI": {
    icon: ChartNoAxesCombined,
    color: "text-cyan-400",
    purpose: "Trendleri, tahminleri ve karar metriklerini açıklar.",
  },
};

const navItems: Array<{ label: ViewName; icon: LucideIcon }> = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "AI Manager", icon: BrainCircuit },
  { label: "Marketing AI", icon: Megaphone },
  { label: "Sales AI", icon: Users },
  { label: "Finance AI", icon: WalletCards },
  { label: "Operations AI", icon: Workflow },
  { label: "Inventory AI", icon: Boxes },
  { label: "Analytics AI", icon: ChartNoAxesCombined },
];

const money = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  bars,
}: {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  bars: number[];
}) {
  return (
    <article className="metric-grid min-w-0 rounded-2xl border bg-card/80 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="grid size-9 place-items-center rounded-xl border bg-background/60 text-orange-400">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {value}
          </strong>
          <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-emerald-400">
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
            {change > 0 ? "+" : ""}{change}%
          </span>
        </div>
        <div className="flex h-10 items-end gap-1" aria-hidden="true">
          {bars.map((bar, index) => (
            <span
              key={index}
              className="w-1.5 rounded-full bg-orange-500/70"
              style={{ height: `${bar}%` }}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-36 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_.8fr]">
        <Skeleton className="h-[32rem] rounded-2xl bg-muted" />
        <Skeleton className="h-[32rem] rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export default function TilkiDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState<ViewName>("Dashboard");
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [agent, setAgent] = useState<AgentName>("AI Manager");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Veriler yüklenemedi.");
      setData(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Veriler yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Veriler yüklenemedi.");
        return payload as DashboardData;
      })
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch((caught) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Veriler yüklenemedi.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const pageTitle = activeView === "Dashboard" ? "Kontrol merkezi" : activeView;
  const pageDescription =
    activeView === "Dashboard"
      ? "Bugünün performansı, riskleri ve AI ekibinin sıradaki kararları."
      : activeView === "Settings"
        ? "Veri kaynakları ve çalışma ortamı."
        : agentMeta[activeView].purpose;

  const scopedRecommendations = useMemo(() => {
    if (!data) return [];
    if (activeView === "Dashboard") return data.recommendations.slice(0, 4);
    if (activeView === "AI Manager") return data.recommendations;
    if (activeView === "Settings") return [];
    return data.recommendations.filter((item) => item.agent === activeView);
  }, [activeView, data]);

  async function updateStatus(id: string, status: "approved" | "dismissed") {
    setBusyId(id);
    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "İşlem kaydedilemedi.");
      setData((current) =>
        current
          ? {
              ...current,
              recommendations: current.recommendations.map((item) =>
                item.id === id ? { ...item, status, actionedAt: payload.actionedAt } : item
              ),
            }
          : current
      );
      setSelected(null);
      toast.success(status === "approved" ? "Öneri MVP ortamında uygulandı." : "Öneri reddedildi.");
      await loadDashboard();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "İşlem kaydedilemedi.");
    } finally {
      setBusyId(null);
    }
  }

  async function submitTask(event: FormEvent) {
    event.preventDefault();
    if (prompt.trim().length < 4) {
      toast.error("Görevi biraz daha ayrıntılı yaz.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, agent }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Görev oluşturulamadı.");
      setPrompt("");
      setActiveView("AI Manager");
      toast.success(`${payload.agent} yeni bir öneri hazırladı.`);
      await loadDashboard();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Görev oluşturulamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border p-5">
          <button
            className="flex items-center gap-3 text-left"
            onClick={() => setActiveView("Dashboard")}
            aria-label="TILKI OS ana sayfa"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_28px_rgba(255,107,26,.25)]">
              <Command className="size-5" aria-hidden="true" />
            </span>
            <span>
              <strong className="block text-[1.05rem] tracking-[0.16em]">TILKI OS</strong>
              <small className="text-xs text-muted-foreground">AI BUSINESS SYSTEM</small>
            </span>
          </button>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Çalışma alanı
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeView === item.label}
                      className="h-10 rounded-xl px-3 text-sm data-[active=true]:bg-orange-500/12 data-[active=true]:text-orange-300"
                    >
                      <button onClick={() => setActiveView(item.label)}>
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={activeView === "Settings"}
                className="h-10 rounded-xl px-3"
              >
                <button onClick={() => setActiveView("Settings")}>
                  <Settings aria-hidden="true" />
                  <span>Ayarlar ve entegrasyonlar</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="mt-2 flex items-center gap-3 rounded-xl border bg-background/60 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-orange-500/15 text-sm font-semibold text-orange-300">
              SK
            </span>
            <div className="min-w-0">
              <strong className="block truncate text-sm">Sem Kafe</strong>
              <span className="text-xs text-muted-foreground">MVP veri ortamı</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-transparent">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b bg-background/82 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="md:hidden" aria-label="Menüyü aç" />
            <div className="min-w-0 py-3">
              <h1 className="truncate text-lg font-semibold sm:text-xl">{pageTitle}</h1>
              <p className="hidden truncate text-sm text-muted-foreground sm:block">{pageDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden border-emerald-500/25 bg-emerald-500/8 px-3 py-1 text-emerald-300 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              7 ajan hazır
            </Badge>
            <Button variant="ghost" size="icon" aria-label="Bildirimler">
              <Bell aria-hidden="true" />
            </Button>
          </div>
        </header>

        {error ? (
          <div className="grid min-h-[70vh] place-items-center p-6">
            <div className="max-w-md rounded-2xl border bg-card p-7 text-center">
              <CircleAlert className="mx-auto size-8 text-orange-400" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold">Veri bağlantısı kurulamadı</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
              <Button className="mt-5" onClick={() => void loadDashboard()}>
                <RefreshCw aria-hidden="true" /> Yeniden dene
              </Button>
            </div>
          </div>
        ) : !data ? (
          <LoadingState />
        ) : activeView === "Settings" ? (
          <SettingsView data={data} />
        ) : (
          <div className="p-4 sm:p-6 lg:p-8">
            {activeView === "Dashboard" && (
              <section aria-label="Bugünün işletme metrikleri" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Günlük gelir" value={money.format(data.metrics.revenue)} change={data.metrics.revenueChange} icon={BadgeDollarSign} bars={[35, 54, 48, 72, 63, 86, 78]} />
                <MetricCard label="Sipariş" value={String(data.metrics.orders)} change={data.metrics.ordersChange} icon={Store} bars={[25, 42, 66, 51, 76, 82, 94]} />
                <MetricCard label="Net kâr" value={money.format(data.metrics.netProfit)} change={data.metrics.profitChange} icon={WalletCards} bars={[46, 41, 58, 67, 62, 81, 88]} />
                <MetricCard label="Müşteri puanı" value={`${data.metrics.rating.toFixed(1)} / 5`} change={data.metrics.ratingChange} icon={Sparkles} bars={[62, 65, 63, 71, 76, 83, 90]} />
              </section>
            )}

            <section className={`${activeView === "Dashboard" ? "mt-6 " : ""}grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,.78fr)]`}>
              <div className="min-w-0 rounded-2xl border bg-card/80">
                <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="size-5 text-orange-400" aria-hidden="true" />
                      <h2 className="text-lg font-semibold">AI karar kuyruğu</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Her işlem sen onayladıktan sonra uygulanır.</p>
                  </div>
                  <Badge variant="outline" className="border-orange-500/25 bg-orange-500/8 text-orange-300">
                    {scopedRecommendations.filter((item) => item.status === "pending").length} karar bekliyor
                  </Badge>
                </div>

                <Tabs defaultValue="pending" className="p-4 sm:p-5">
                  <TabsList variant="line" className="mb-4">
                    <TabsTrigger value="pending">Bekleyenler</TabsTrigger>
                    <TabsTrigger value="history">İşlem geçmişi</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending" className="space-y-3">
                    {scopedRecommendations.filter((item) => item.status === "pending").length === 0 ? (
                      <div className="rounded-xl border border-dashed p-8 text-center">
                        <Check className="mx-auto size-7 text-emerald-400" aria-hidden="true" />
                        <p className="mt-3 font-medium">Bekleyen karar yok</p>
                        <p className="mt-1 text-sm text-muted-foreground">Yeni bir görev vererek ajan ekibini çalıştırabilirsin.</p>
                      </div>
                    ) : (
                      scopedRecommendations
                        .filter((item) => item.status === "pending")
                        .map((item) => (
                          <RecommendationCard
                            key={item.id}
                            item={item}
                            busy={busyId === item.id}
                            onSelect={() => setSelected(item)}
                            onApprove={() => void updateStatus(item.id, "approved")}
                            onDismiss={() => void updateStatus(item.id, "dismissed")}
                          />
                        ))
                    )}
                  </TabsContent>
                  <TabsContent value="history" className="space-y-3">
                    {data.recommendations.filter((item) => item.status !== "pending").length === 0 ? (
                      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        Onaylanan ve reddedilen öneriler burada görünecek.
                      </div>
                    ) : (
                      data.recommendations
                        .filter((item) => item.status !== "pending")
                        .map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background/35 p-4">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{item.title}</p>
                              <span className="text-sm text-muted-foreground">{item.agent}</span>
                            </div>
                            <Badge variant={item.status === "approved" ? "default" : "secondary"}>
                              {item.status === "approved" ? "Uygulandı" : "Reddedildi"}
                            </Badge>
                          </div>
                        ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="min-w-0 space-y-4">
                <AgentComposer
                  agent={agent}
                  prompt={prompt}
                  submitting={submitting}
                  onAgentChange={setAgent}
                  onPromptChange={setPrompt}
                  onSubmit={submitTask}
                />
                <ActivityFeed data={data} />
              </div>
            </section>
          </div>
        )}
      </SidebarInset>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="border-border bg-card sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="mb-2 flex items-center gap-2 text-sm text-orange-300">
                  <Sparkles className="size-4" aria-hidden="true" /> {selected.agent}
                </div>
                <DialogTitle className="text-xl">{selected.title}</DialogTitle>
                <DialogDescription className="pt-2 text-base leading-7">{selected.detail}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 rounded-xl border bg-background/45 p-4 sm:grid-cols-2">
                <div><span className="block text-xs uppercase tracking-wider text-muted-foreground">Beklenen etki</span><strong className="mt-1 block text-sm">{selected.impact}</strong></div>
                <div><span className="block text-xs uppercase tracking-wider text-muted-foreground">Güven skoru</span><strong className="mt-1 block text-sm">%{selected.confidence}</strong></div>
              </div>
              {selected.status === "pending" && (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => void updateStatus(selected.id, "dismissed")} disabled={busyId === selected.id}><X aria-hidden="true" /> Reddet</Button>
                  <Button onClick={() => void updateStatus(selected.id, "approved")} disabled={busyId === selected.id}><Check aria-hidden="true" /> Onayla ve uygula</Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Toaster richColors position="bottom-right" />
    </SidebarProvider>
  );
}

function RecommendationCard({
  item,
  busy,
  onSelect,
  onApprove,
  onDismiss,
}: {
  item: Recommendation;
  busy: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onDismiss: () => void;
}) {
  const meta = agentMeta[item.agent];
  const Icon = meta.icon;
  return (
    <article className="group rounded-xl border bg-background/35 p-4 transition-colors hover:border-orange-500/30 sm:p-5">
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl border bg-card ${meta.color}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{item.agent}</span>
            {item.priority === "high" && <Badge variant="outline" className="border-orange-500/30 text-orange-300">Yüksek öncelik</Badge>}
          </div>
          <h3 className="mt-1 text-base font-semibold leading-6">{item.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-emerald-300">{item.impact}</span>
              <span className="text-muted-foreground">Güven %{item.confidence}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onSelect}>Detay</Button>
              <Button variant="outline" size="icon-sm" onClick={onDismiss} disabled={busy} aria-label={`${item.title} önerisini reddet`}><X aria-hidden="true" /></Button>
              <Button size="sm" onClick={onApprove} disabled={busy}>{busy ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />} Onayla</Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function AgentComposer({
  agent,
  prompt,
  submitting,
  onAgentChange,
  onPromptChange,
  onSubmit,
}: {
  agent: AgentName;
  prompt: string;
  submitting: boolean;
  onAgentChange: (agent: AgentName) => void;
  onPromptChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="orange-glow rounded-2xl border bg-card/90 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-orange-400" aria-hidden="true" />
        <h2 className="font-semibold">AI ekibine görev ver</h2>
      </div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">Hedefini yaz; sistem doğru ajanı seçip onaylanabilir bir aksiyon hazırlasın.</p>
      <div className="mt-4 space-y-3">
        <Select value={agent} onValueChange={(value) => onAgentChange(value as AgentName)}>
          <SelectTrigger className="w-full bg-background/40" aria-label="AI ajanı seç">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(agentMeta).map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder="Örn. Cuma akşamı için stok ve vardiya planı hazırla"
          className="min-h-28 resize-none bg-background/40 text-base leading-6"
          maxLength={500}
          aria-label="AI görev açıklaması"
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          {submitting ? "Ajan çalışıyor…" : "Görevi oluştur"}
        </Button>
      </div>
    </form>
  );
}

function ActivityFeed({ data }: { data: DashboardData }) {
  return (
    <section className="rounded-2xl border bg-card/75 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Son hareketler</h2>
        <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="mt-4 space-y-4">
        {data.activities.slice(0, 4).map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-orange-400" />
            <div className="min-w-0">
              <p className="text-sm leading-5">{activity.message}</p>
              <span className="mt-1 block text-xs text-muted-foreground">{activity.agent} · {new Date(activity.createdAt).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SettingsView({ data }: { data: DashboardData }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl border bg-card/80">
        <div className="border-b p-5 sm:p-6">
          <div className="flex items-center gap-2"><PlugZap className="size-5 text-orange-400" aria-hidden="true" /><h2 className="text-lg font-semibold">Entegrasyonlar</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">Bu MVP’de akışlar demo veri katmanında çalışıyor. Canlı hesap bağlantıları sonraki ürün aşamasıdır.</p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {data.integrations.map((integration) => (
            <article key={integration.id} className="flex items-center gap-3 rounded-xl border bg-background/35 p-4">
              <span className="grid size-10 place-items-center rounded-xl border bg-card text-orange-400"><Database className="size-4" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1"><strong className="block truncate text-sm">{integration.name}</strong><span className="text-xs text-muted-foreground">{integration.category}</span></div>
              <Badge variant="outline" className="border-amber-500/25 text-amber-300">Demo</Badge>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-4 rounded-2xl border bg-card/80 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">MVP işlem güvenliği</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {["Ajan öneriyi hazırlar", "İnsan sonucu kontrol eder", "Onaylanan işlem kaydedilir"].map((step, index) => (
            <div key={step} className="rounded-xl border bg-background/35 p-4"><span className="text-xs font-semibold text-orange-300">0{index + 1}</span><p className="mt-2 text-sm font-medium">{step}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}
