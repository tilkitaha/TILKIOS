import { env } from "cloudflare:workers";

export type AgentName =
  | "AI Manager"
  | "Marketing AI"
  | "Sales AI"
  | "Finance AI"
  | "Operations AI"
  | "Inventory AI"
  | "Analytics AI";

export type RecommendationStatus = "pending" | "approved" | "dismissed";

export interface DashboardData {
  metrics: {
    revenue: number;
    orders: number;
    netProfit: number;
    rating: number;
    revenueChange: number;
    ordersChange: number;
    profitChange: number;
    ratingChange: number;
    updatedAt: string;
  };
  recommendations: Array<{
    id: string;
    agent: AgentName;
    title: string;
    detail: string;
    impact: string;
    confidence: number;
    priority: "high" | "medium" | "low";
    status: RecommendationStatus;
    source: string;
    createdAt: string;
    actionedAt: string | null;
  }>;
  activities: Array<{
    id: number;
    agent: AgentName;
    message: string;
    status: string;
    createdAt: string;
  }>;
  integrations: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
    lastSyncAt: string | null;
  }>;
}

function getBinding() {
  if (!env.DB) {
    throw new Error("TILKI OS veri tabanı şu anda kullanılamıyor.");
  }
  return env.DB;
}

const demoRecommendations = [
  {
    id: "inventory-chicken-forecast",
    agent: "Inventory AI",
    title: "Akşam servisi için stok tamamla",
    detail:
      "Son dört cuma ve bugünkü sipariş hızına göre 17:00'dan önce 18 kg tavuk stoğu hazırlamak stok tükenmesi riskini azaltır.",
    impact: "Tahmini 2.400 TL gelir korunur",
    confidence: 91,
    priority: "high",
  },
  {
    id: "operations-peak-shift",
    agent: "Operations AI",
    title: "Yoğun saate bir personel ekle",
    detail:
      "18:30–21:00 arasında sipariş yoğunluğu normalin %34 üzerinde. Bu vardiyaya bir servis personeli eklenmesi öneriliyor.",
    impact: "Bekleme süresi yaklaşık 7 dk azalır",
    confidence: 88,
    priority: "high",
  },
  {
    id: "marketing-review-response",
    agent: "Marketing AI",
    title: "Yeni Google yorumuna yanıt ver",
    detail:
      "Servis süresiyle ilgili düşük puanlı yoruma empatik, kısa ve telafi teklif eden bir cevap taslağı hazırlandı.",
    impact: "İtibar ve geri dönüş olasılığı",
    confidence: 84,
    priority: "medium",
  },
  {
    id: "finance-menu-margin",
    agent: "Finance AI",
    title: "Akşam menüsünün marjını iyileştir",
    detail:
      "İçecek ve tatlı içeren paket menü, tekil ürün satışına göre ortalama sipariş marjını artırabilir.",
    impact: "Sipariş başına +%11 brüt marj",
    confidence: 79,
    priority: "medium",
  },
  {
    id: "sales-loyalty-return",
    agent: "Sales AI",
    title: "Pasif müşterileri geri kazan",
    detail:
      "Son 45 gündür sipariş vermeyen 14 sadakat müşterisi için hafta içi geçerli kişiselleştirilmiş teklif hazırlandı.",
    impact: "6–9 tekrar sipariş potansiyeli",
    confidence: 76,
    priority: "low",
  },
  {
    id: "analytics-friday-demand",
    agent: "Analytics AI",
    title: "Cuma talep artışına hazırlan",
    detail:
      "Hava durumu ve geçmiş sipariş desenine göre cuma akşamı siparişlerde %22 artış bekleniyor.",
    impact: "Daha doğru hazırlık ve vardiya planı",
    confidence: 86,
    priority: "medium",
  },
] as const;

async function seedDemoData() {
  const db = getBinding();
  const now = new Date().toISOString();
  const statements = [
    db
      .prepare(
        `INSERT OR IGNORE INTO business_snapshots
          (id, revenue, orders, net_profit, rating, revenue_change, orders_change, profit_change, rating_change, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(18420, 286, 5220, 4.2, 12.4, 8.1, 15.7, 0.2, now),
    db
      .prepare(
        `INSERT OR IGNORE INTO activities (id, agent, message, status, created_at)
         VALUES (1, ?, ?, ?, ?)`
      )
      .bind("Analytics AI", "Günlük performans özeti hazırlandı.", "completed", now),
  ];

  for (const item of demoRecommendations) {
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO recommendations
            (id, agent, title, detail, impact, confidence, priority, status, source, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'demo', ?)`
        )
        .bind(
          item.id,
          item.agent,
          item.title,
          item.detail,
          item.impact,
          item.confidence,
          item.priority,
          now
        )
    );
  }

  for (const [id, name, category] of [
    ["google-reviews", "Google Reviews", "Müşteri deneyimi"],
    ["instagram", "Instagram", "Pazarlama"],
    ["whatsapp", "WhatsApp Business", "Satış"],
    ["excel", "Excel / CSV", "Veri"],
    ["pos", "MOKA POS", "Ödeme"],
    ["delivery", "Yemeksepeti / Getir", "Sipariş"],
  ]) {
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO integrations
            (id, name, category, status, last_sync_at)
           VALUES (?, ?, ?, 'demo', ?)`
        )
        .bind(id, name, category, now)
    );
  }

  await db.batch(statements);
}

export async function getDashboardData(): Promise<DashboardData> {
  await seedDemoData();
  const db = getBinding();
  const [metricResult, recommendationsResult, activitiesResult, integrationsResult] =
    await Promise.all([
      db.prepare("SELECT * FROM business_snapshots WHERE id = 1").first(),
      db
        .prepare(
          `SELECT * FROM recommendations
           ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC`
        )
        .all(),
      db.prepare("SELECT * FROM activities ORDER BY id DESC LIMIT 8").all(),
      db.prepare("SELECT * FROM integrations ORDER BY name ASC").all(),
    ]);

  if (!metricResult) throw new Error("Demo işletme özeti oluşturulamadı.");
  const metric = metricResult as Record<string, number | string>;
  return {
    metrics: {
      revenue: Number(metric.revenue),
      orders: Number(metric.orders),
      netProfit: Number(metric.net_profit),
      rating: Number(metric.rating),
      revenueChange: Number(metric.revenue_change),
      ordersChange: Number(metric.orders_change),
      profitChange: Number(metric.profit_change),
      ratingChange: Number(metric.rating_change),
      updatedAt: String(metric.updated_at),
    },
    recommendations: (recommendationsResult.results ?? []).map((row) => ({
      id: String(row.id),
      agent: String(row.agent) as AgentName,
      title: String(row.title),
      detail: String(row.detail),
      impact: String(row.impact),
      confidence: Number(row.confidence),
      priority: String(row.priority) as "high" | "medium" | "low",
      status: String(row.status) as RecommendationStatus,
      source: String(row.source),
      createdAt: String(row.created_at),
      actionedAt: row.actioned_at ? String(row.actioned_at) : null,
    })),
    activities: (activitiesResult.results ?? []).map((row) => ({
      id: Number(row.id),
      agent: String(row.agent) as AgentName,
      message: String(row.message),
      status: String(row.status),
      createdAt: String(row.created_at),
    })),
    integrations: (integrationsResult.results ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      category: String(row.category),
      status: String(row.status),
      lastSyncAt: row.last_sync_at ? String(row.last_sync_at) : null,
    })),
  };
}

export async function updateRecommendation(id: string, status: RecommendationStatus) {
  const db = getBinding();
  const existing = await db
    .prepare("SELECT id, agent, title FROM recommendations WHERE id = ?")
    .bind(id)
    .first<{ id: string; agent: AgentName; title: string }>();
  if (!existing) return null;

  const now = new Date().toISOString();
  await db.batch([
    db.prepare("UPDATE recommendations SET status = ?, actioned_at = ? WHERE id = ?").bind(status, now, id),
    db
      .prepare("INSERT INTO activities (agent, message, status, created_at) VALUES (?, ?, ?, ?)")
      .bind(
        existing.agent,
        status === "approved"
          ? `“${existing.title}” önerisi onaylandı ve MVP ortamında uygulandı.`
          : `“${existing.title}” önerisi reddedildi.`,
        status,
        now
      ),
  ]);
  return { id, status, actionedAt: now };
}

function inferAgent(prompt: string, requestedAgent: AgentName): AgentName {
  if (requestedAgent !== "AI Manager") return requestedAgent;
  const value = prompt.toLocaleLowerCase("tr-TR");
  if (/stok|ürün|zayi|sipariş ver/.test(value)) return "Inventory AI";
  if (/yorum|instagram|reklam|içerik|kampanya/.test(value)) return "Marketing AI";
  if (/müşteri|satış|sadakat|teklif/.test(value)) return "Sales AI";
  if (/kâr|gider|gelir|maliyet|finans/.test(value)) return "Finance AI";
  if (/vardiya|personel|yoğun|operasyon|süreç/.test(value)) return "Operations AI";
  if (/tahmin|trend|rapor|analiz/.test(value)) return "Analytics AI";
  return "AI Manager";
}

export async function createAgentRecommendation(prompt: string, requestedAgent: AgentName) {
  const db = getBinding();
  const agent = inferAgent(prompt, requestedAgent);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const playbooks: Record<AgentName, { title: string; detail: string; impact: string }> = {
    "AI Manager": {
      title: "İşletme planını önceliklendir",
      detail: `“${prompt}” hedefi için veri kontrolü, sorumlu ajan seçimi ve onay adımlarından oluşan bir görev planı hazırlandı.`,
      impact: "Tek merkezden takip edilebilir görev",
    },
    "Marketing AI": {
      title: "Pazarlama aksiyonu hazırla",
      detail: `“${prompt}” talebine göre hedef kitle, kanal, mesaj ve başarı ölçütü içeren uygulanabilir kampanya taslağı oluşturuldu.`,
      impact: "Daha tutarlı müşteri iletişimi",
    },
    "Sales AI": {
      title: "Satış fırsatını göreve dönüştür",
      detail: `“${prompt}” talebi için müşteri segmenti, teklif ve takip zamanını içeren satış aksiyonu oluşturuldu.`,
      impact: "Takip edilebilir dönüşüm fırsatı",
    },
    "Finance AI": {
      title: "Finansal etkiyi değerlendir",
      detail: `“${prompt}” talebi gelir, maliyet ve marj etkisine ayrıldı; uygulama öncesi kontrol listesi hazırlandı.`,
      impact: "Marj etkisi görünür hale gelir",
    },
    "Operations AI": {
      title: "Operasyon görevini planla",
      detail: `“${prompt}” talebi için sorumlu, zaman aralığı ve kontrol noktaları belirlenerek uygulama planı oluşturuldu.`,
      impact: "Daha kısa ve ölçülebilir süreç",
    },
    "Inventory AI": {
      title: "Stok aksiyonu oluştur",
      detail: `“${prompt}” talebi mevcut stok, beklenen talep ve güvenlik payı açısından değerlendirildi; kontrollü sipariş önerisi hazırlandı.`,
      impact: "Stok tükenmesi ve zayi riski azalır",
    },
    "Analytics AI": {
      title: "Analiz planını oluştur",
      detail: `“${prompt}” talebi için gerekli metrikler, karşılaştırma dönemi ve karar eşiği tanımlandı.`,
      impact: "Veriye dayalı karar çerçevesi",
    },
  };

  const result = playbooks[agent];
  await db.batch([
    db
      .prepare(
        `INSERT INTO recommendations
          (id, agent, title, detail, impact, confidence, priority, status, source, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'medium', 'pending', 'user', ?)`
      )
      .bind(id, agent, result.title, result.detail, result.impact, 82, now),
    db
      .prepare("INSERT INTO activities (agent, message, status, created_at) VALUES (?, ?, 'created', ?)")
      .bind(agent, `Yeni görev önerisi oluşturuldu: ${result.title}`, now),
  ]);

  return {
    id,
    agent,
    ...result,
    confidence: 82,
    priority: "medium" as const,
    status: "pending" as const,
    source: "user",
    createdAt: now,
    actionedAt: null,
  };
}
