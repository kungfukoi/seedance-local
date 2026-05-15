import React from "react";
import {
  Activity,
  CalendarDays,
  DollarSign,
  Film,
  Image,
  Layers3,
  RefreshCcw,
  TrendingUp
} from "lucide-react";

const defaultPricing = {
  seedance: {
    standardCostPerSecond: 0.014,
    fastCostPerSecond: 0.0112
  },
  nanoBananaPro: {
    cost1K2K: 0.134,
    cost4K: 0.24
  },
  openAiImage2: {
    mediumCost: 0.053
  },
  textProcessing: {
    falRequestCost: 0.001,
    falVisionUnitCost: 0.01,
    falVideoUnitCost: 0.01
  }
};

const mediaColors = {
  text: "#f0c83b",
  image: "#3d85ff",
  video: "#58ce63"
};

export default function StatsDashboard() {
  const [history, setHistory] = React.useState([]);
  const [pricing, setPricing] = React.useState(defaultPricing);
  const [status, setStatus] = React.useState("loading");
  const [lastUpdated, setLastUpdated] = React.useState(null);

  React.useEffect(() => {
    refreshStats();
    const interval = window.setInterval(refreshStats, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const stats = React.useMemo(() => buildUsageStats(history, pricing), [history, pricing]);

  async function refreshStats() {
    try {
      setStatus((current) => (current === "loading" ? "loading" : "refreshing"));
      const response = await fetch("/api/stats");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load stats.");
      setHistory(Array.isArray(data.history) ? data.history : []);
      setPricing(data.pricing || defaultPricing);
      setStatus("ready");
      setLastUpdated(new Date());
    } catch {
      try {
        const response = await fetch("/api/history");
        setHistory(await response.json());
        setStatus("ready");
        setLastUpdated(new Date());
      } catch {
        setStatus("error");
      }
    }
  }

  return (
    <section className="stats-page">
      <header className="stats-hero">
        <div>
          <span className="stats-kicker">Past 30 days</span>
          <h1>Generation stats</h1>
        </div>
        <button onClick={refreshStats} disabled={status === "loading" || status === "refreshing"} title="Refresh stats">
          <RefreshCcw className={status === "refreshing" ? "spin" : ""} size={17} />
          <span>{lastUpdated ? `Updated ${timeLabel(lastUpdated)}` : "Syncing"}</span>
        </button>
      </header>

      <div className="stats-metrics">
        <MetricCard icon={<DollarSign size={20} />} label="Estimated spend" value={formatCurrency(stats.totalCost)} detail={`${formatCurrency(stats.averageCost)} avg / run`} />
        <MetricCard icon={<Activity size={20} />} label="Generations" value={stats.totalCount} detail={`${stats.videoCount} video, ${stats.imageCount} image, ${stats.textCount} text`} />
        <MetricCard icon={<Film size={20} />} label="Video seconds" value={`${stats.videoSeconds}s`} detail={`${stats.fastCount} fast runs`} />
        <MetricCard icon={<Layers3 size={20} />} label="Top project" value={stats.topProject?.name || "None yet"} detail={stats.topProject ? `${formatCurrency(stats.topProject.cost)} tracked` : "Waiting for runs"} />
      </div>

      <div className="stats-grid">
        <section className="stats-panel wide">
          <PanelTitle icon={<TrendingUp size={17} />} title="Cost over time" aside="Estimated USD" />
          <CostChart days={stats.days} />
        </section>

        <section className="stats-panel">
          <PanelTitle icon={<CalendarDays size={17} />} title="Daily volume" aside="30 days" />
          <VolumeBars days={stats.days} />
        </section>

        <section className="stats-panel">
          <PanelTitle icon={<Image size={17} />} title="Media mix" aside={`${stats.totalCount} total`} />
          <MediaSplit imageCount={stats.imageCount} videoCount={stats.videoCount} textCount={stats.textCount} />
        </section>

        <section className="stats-panel">
          <PanelTitle icon={<Activity size={17} />} title="Models" aside="By spend" />
          <RankedBars rows={stats.models} emptyLabel="No model usage yet" />
        </section>

        <section className="stats-panel">
          <PanelTitle icon={<Layers3 size={17} />} title="Projects" aside="By spend" />
          <RankedBars rows={stats.projects} emptyLabel="No project data yet" />
        </section>

        <section className="stats-panel wide">
          <PanelTitle icon={<CalendarDays size={17} />} title="Recent runs" aside="Auto-updating" />
          <RecentRuns rows={stats.recent} />
        </section>
      </div>

      <p className="cost-note">
        Costs use each run's recorded cost when available, with fal pricing defaults for older runs. Confirm final billing in fal.ai, Google Cloud, and OpenAI dashboards.
      </p>
    </section>
  );
}

function MetricCard({ icon, label, value, detail }) {
  return (
    <article className="metric-card">
      <span className="metric-icon">{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function PanelTitle({ icon, title, aside }) {
  return (
    <div className="panel-title">
      <span>
        {icon}
        {title}
      </span>
      <small>{aside}</small>
    </div>
  );
}

function CostChart({ days }) {
  const width = 680;
  const height = 220;
  const padding = 22;
  const maxCost = Math.max(1, ...days.map((day) => day.cost));
  const points = days.map((day, index) => {
    const x = padding + (index / Math.max(1, days.length - 1)) * (width - padding * 2);
    const y = height - padding - (day.cost / maxCost) * (height - padding * 2);
    return { x, y, day };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;

  return (
    <div className="chart-shell">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Estimated cost over the past 30 days">
        <defs>
          <linearGradient id="costFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ddc631" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#ddc631" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline className="chart-grid-line" points={`${padding},${height - padding} ${width - padding},${height - padding}`} />
        <polygon points={area} fill="url(#costFill)" />
        <polyline className="cost-line" points={line} />
        {points
          .filter((point) => point.day.cost > 0)
          .map((point) => (
            <circle key={point.day.key} cx={point.x} cy={point.y} r="4" />
          ))}
      </svg>
      <div className="chart-axis">
        <span>{formatShortDate(days[0]?.date)}</span>
        <span>{formatShortDate(days[14]?.date)}</span>
        <span>{formatShortDate(days.at(-1)?.date)}</span>
      </div>
    </div>
  );
}

function VolumeBars({ days }) {
  const maxCount = Math.max(1, ...days.map((day) => day.count));

  return (
    <div className="volume-bars" aria-label="Daily generation volume">
      {days.map((day, index) => (
        <div className="volume-bar" key={day.key} title={`${formatShortDate(day.date)}: ${day.count} generations`}>
          <span style={{ height: `${Math.max(4, (day.count / maxCount) * 100)}%` }} />
          {index % 7 === 0 && <small>{formatDay(day.date)}</small>}
        </div>
      ))}
    </div>
  );
}

function MediaSplit({ imageCount, videoCount, textCount }) {
  const totalCount = imageCount + videoCount + textCount;
  const total = Math.max(1, totalCount);
  const imagePercent = Math.round((imageCount / total) * 100);
  const videoPercent = Math.round((videoCount / total) * 100);
  const imageStop = imagePercent;
  const videoStop = imagePercent + videoPercent;
  const dominant = [
    { label: "image", count: imageCount },
    { label: "video", count: videoCount },
    { label: "text", count: textCount }
  ].sort((a, b) => b.count - a.count)[0];
  const donutBackground = totalCount
    ? `conic-gradient(${mediaColors.image} 0 ${imageStop}%, ${mediaColors.video} ${imageStop}% ${videoStop}%, ${mediaColors.text} ${videoStop}% 100%)`
    : "rgba(255, 255, 255, 0.08)";

  return (
    <div className="media-split">
      <div className="media-donut" style={{ background: donutBackground }}>
        <span>{totalCount}</span>
      </div>
      <div className="media-legend">
        <span>
          <i className="image-dot" />
          Images
          <strong>{imageCount}</strong>
        </span>
        <span>
          <i className="video-dot" />
          Videos
          <strong>{videoCount}</strong>
        </span>
        <span>
          <i className="text-dot" />
          Text
          <strong>{textCount}</strong>
        </span>
        <small>{dominant.count ? `${dominant.label} leads by count` : "No runs yet"}</small>
      </div>
    </div>
  );
}

function RankedBars({ rows, emptyLabel }) {
  const maxCost = Math.max(1, ...rows.map((row) => row.cost));

  if (!rows.length) {
    return <div className="empty-stats">{emptyLabel}</div>;
  }

  return (
    <div className="ranked-bars">
      {rows.slice(0, 6).map((row) => (
        <div className="ranked-row" key={row.name}>
          <div>
            <span>{row.name}</span>
            <small>{row.count} run{row.count === 1 ? "" : "s"}</small>
          </div>
          <div className="ranked-meter">
            <span style={{ width: `${(row.cost / maxCost) * 100}%` }} />
          </div>
          <strong>{formatCurrency(row.cost)}</strong>
        </div>
      ))}
    </div>
  );
}

function RecentRuns({ rows }) {
  if (!rows.length) {
    return <div className="empty-stats">No generations in the last 30 days yet.</div>;
  }

  return (
    <div className="recent-table">
      {rows.slice(0, 12).map((row) => (
        <article key={row.id}>
          <span className={`media-pill ${row.mediaType}`}>{row.mediaType}</span>
          <div>
            <strong>{row.modelName}</strong>
            <small>{row.projectName}</small>
          </div>
          <p>{row.prompt || "Untitled generation"}</p>
          <span>{formatShortDate(row.date)}</span>
          <strong>{formatCurrency(row.cost)}</strong>
        </article>
      ))}
    </div>
  );
}

function buildUsageStats(history, pricing) {
  const days = makeThirtyDays();
  const dayMap = new Map(days.map((day) => [day.key, day]));
  const normalized = history.map((item) => normalizeUsageItem(item, pricing)).filter((item) => item.inWindow);
  const modelMap = new Map();
  const projectMap = new Map();

  normalized.forEach((item) => {
    const day = dayMap.get(item.dayKey);
    if (day) {
      day.count += 1;
      day.cost += item.cost;
      if (item.mediaType === "image") day.imageCount += 1;
      if (item.mediaType === "video") day.videoCount += 1;
    }

    addAggregate(modelMap, item.modelName, item);
    addAggregate(projectMap, item.projectId, item, item.projectName);
  });

  days.forEach((day) => {
    day.cost = round(day.cost);
  });

  const models = aggregateRows(modelMap);
  const projects = aggregateRows(projectMap);
  const totalCost = round(normalized.reduce((sum, item) => sum + item.cost, 0));
  const totalCount = normalized.length;
  const videoCount = normalized.filter((item) => item.mediaType === "video").length;
  const imageCount = normalized.filter((item) => item.mediaType === "image").length;
  const textCount = normalized.filter((item) => item.mediaType === "text").length;
  const videoSeconds = normalized.reduce((sum, item) => sum + (item.mediaType === "video" ? item.durationSeconds : 0), 0);

  return {
    days,
    totalCost,
    totalCount,
    imageCount,
    videoCount,
    textCount,
    videoSeconds,
    fastCount: normalized.filter((item) => item.isFast).length,
    averageCost: totalCount ? round(totalCost / totalCount) : 0,
    topProject: projects[0],
    models,
    projects,
    recent: normalized.sort((a, b) => b.date - a.date)
  };
}

function normalizeUsageItem(item, pricing) {
  const date = new Date(item.createdAt || Date.now());
  const mediaType = item.mediaType || (item.localImage ? "image" : "video");
  const settings = item.settings || {};
  const modelName = item.modelName || inferModelName(item, mediaType);
  const projectId = item.project?.id || (mediaType === "image" ? "image" : mediaType === "text" ? "text" : "video");
  const projectName = item.project?.name || (mediaType === "image" ? "Image" : mediaType === "text" ? "Text" : "Video");
  const cost = resolvedItemCost(item, mediaType, pricing);
  const durationSeconds = mediaType === "video" ? durationToSeconds(settings.duration) : 0;
  const cutoff = startOfDay(new Date());
  cutoff.setDate(cutoff.getDate() - 29);

  return {
    id: item.id || `${item.createdAt}-${item.prompt}`,
    date,
    dayKey: dayKey(date),
    inWindow: date >= cutoff,
    mediaType,
    modelName,
    projectId,
    projectName,
    prompt: item.prompt,
    cost: round(cost),
    durationSeconds,
    isFast: settings.speed === "fast" || String(item.endpoint || "").includes("/fast/")
  };
}

function resolvedItemCost(item, mediaType, pricing) {
  const storedCost = Number(item.cost?.amountUsd);
  const hasTrustedStoredCost = Number.isFinite(storedCost) && item.cost?.pricingSource;

  if (hasTrustedStoredCost) return storedCost;
  if (mediaType === "image" && Number.isFinite(storedCost)) return storedCost;

  return estimateItemCost(item, mediaType, pricing);
}

function estimateItemCost(item, mediaType, pricing) {
  const settings = item.settings || {};

  if (mediaType === "image") {
    if (String(item.modelName || settings.model || "").toLowerCase().includes("openai")) {
      return pricing.openAiImage2?.mediumCost || defaultPricing.openAiImage2.mediumCost;
    }

    return String(settings.resolution || "").toUpperCase().includes("4K")
      ? pricing.nanoBananaPro.cost4K
      : pricing.nanoBananaPro.cost1K2K;
  }

  if (mediaType === "text") {
    const textPricing = pricing.textProcessing || defaultPricing.textProcessing;
    if (String(item.provider || settings.provider || "").toLowerCase() !== "fal") return 0;

    return (
      textPricing.falRequestCost +
      (Number(settings.imageInputCount || 0) > 0 ? textPricing.falVisionUnitCost : 0) +
      (Number(settings.videoInputCount || 0) > 0 ? textPricing.falVideoUnitCost : 0)
    );
  }

  const isFast = settings.speed === "fast" || String(item.endpoint || "").includes("/fast/");
  const rate = isFast ? pricing.seedance.fastCostPerSecond : pricing.seedance.standardCostPerSecond;
  return durationToSeconds(settings.duration) * rate;
}

function inferModelName(item, mediaType) {
  if (mediaType === "image") return "Nano Banana Pro";
  if (mediaType === "text") return item.settings?.model || "Text processing";
  return item.settings?.speed === "fast" || String(item.endpoint || "").includes("/fast/") ? "Seedance 2.0 Fast" : "Seedance 2.0";
}

function addAggregate(map, key, item, label = key) {
  const row = map.get(key) || { name: label, count: 0, cost: 0 };
  row.count += 1;
  row.cost = round(row.cost + item.cost);
  map.set(key, row);
}

function aggregateRows(map) {
  return [...map.values()].sort((a, b) => b.cost - a.cost);
}

function makeThirtyDays() {
  const today = startOfDay(new Date());

  return Array.from({ length: 30 }, (_value, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    return {
      date,
      key: dayKey(date),
      count: 0,
      cost: 0,
      imageCount: 0,
      videoCount: 0
    };
  });
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function durationToSeconds(duration) {
  if (duration === "auto") return 15;
  const match = String(duration || "15").match(/\d+/);
  return Number(match?.[0] || 15);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 10 ? 2 : 3
  }).format(Number(value || 0));
}

function formatShortDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function formatDay(date) {
  return new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date);
}

function timeLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function round(value) {
  return Math.round(Number(value || 0) * 10000) / 10000;
}
