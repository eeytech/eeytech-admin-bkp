"use client";

type StatusItem = {
  status: string;
  total: number;
  color: string;
};

type AppItem = {
  name: string;
  total: number;
};

type PeriodItem = {
  day: string;
  total: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  };
}

function donutSegmentPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

export function DashboardCharts({
  byStatus,
  byApp,
  byPeriod,
}: {
  byStatus: StatusItem[];
  byApp: AppItem[];
  byPeriod: PeriodItem[];
}) {
  const totalStatus = byStatus.reduce((sum, item) => sum + item.total, 0) || 1;
  let cumulativeAngle = 0;

  const maxBar = Math.max(...byApp.map((item) => item.total), 1);
  const maxLine = Math.max(...byPeriod.map((item) => item.total), 1);
  const linePoints = byPeriod
    .map((item, index) => {
      const x = byPeriod.length === 1 ? 0 : (index / (byPeriod.length - 1)) * 100;
      const y = 100 - (item.total / maxLine) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-md border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Chamados por status</h3>
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 220 220" className="h-44 w-44">
            {byStatus.map((item) => {
              const startAngle = cumulativeAngle;
              const delta = (item.total / totalStatus) * 360;
              const endAngle = startAngle + delta;
              cumulativeAngle = endAngle;

              return (
                <path
                  key={item.status}
                  d={donutSegmentPath(110, 110, 100, 62, startAngle, endAngle)}
                  fill={item.color}
                />
              );
            })}
            <circle cx="110" cy="110" r="55" fill="hsl(var(--card))" />
            <text x="110" y="108" textAnchor="middle" className="fill-foreground text-lg font-bold">
              {byStatus.reduce((sum, item) => sum + item.total, 0)}
            </text>
            <text x="110" y="126" textAnchor="middle" className="fill-muted-foreground text-[11px]">
              chamados
            </text>
          </svg>
          <div className="space-y-2 text-sm">
            {byStatus.map((item) => (
              <div key={item.status} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.status}</span>
                <strong>{item.total}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Chamados por aplicação</h3>
        <div className="space-y-2">
          {byApp.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="truncate">{item.name}</span>
                <strong>{item.total}</strong>
              </div>
              <div className="h-2 rounded bg-muted">
                <div
                  className="h-2 rounded bg-primary"
                  style={{ width: `${(item.total / maxBar) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Chamados por período (30 dias)</h3>
        <div className="h-40 rounded bg-muted/30 p-2">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <polyline
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              points={linePoints}
            />
          </svg>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{byPeriod[0]?.day ?? "-"}</span>
          <span>{byPeriod[Math.floor(byPeriod.length / 2)]?.day ?? "-"}</span>
          <span>{byPeriod[byPeriod.length - 1]?.day ?? "-"}</span>
        </div>
      </div>
    </div>
  );
}
