import { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import type { TheftRecord } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair } from 'lucide-react';

const CENTER = { lat: 43.7, lng: -79.4 };
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 12;

interface MapState {
  centerLat: number;
  centerLng: number;
  zoom: number;
}

function toPixel(lat: number, lng: number, s: MapState, w: number, h: number): [number, number] {
  const scale = s.zoom * 800;
  return [w / 2 + (lng - s.centerLng) * scale, h / 2 - (lat - s.centerLat) * scale * 1.3];
}

function toLatLng(px: number, py: number, s: MapState, w: number, h: number) {
  const scale = s.zoom * 800;
  return { lat: -(py - h / 2) / (scale * 1.3) + s.centerLat, lng: (px - w / 2) / scale + s.centerLng };
}

export function TheftMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const { viewMode, selectedRecord, setSelectedRecord, theme } = useStore();
  const filteredRecords = useStore((s) => s.filteredRecords());
  const dark = theme === 'dark';

  const [map, setMap] = useState<MapState>({ centerLat: CENTER.lat, centerLng: CENTER.lng, zoom: 2.5 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<TheftRecord | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [dims, setDims] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width: Math.floor(width), height: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dims;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    if (dark) {
      bg.addColorStop(0, '#040d1a');
      bg.addColorStop(1, '#0a1628');
    } else {
      bg.addColorStop(0, '#e8eef6');
      bg.addColorStop(1, '#d8e4f0');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const gridColor = dark ? 'rgba(17, 42, 74, 0.4)' : 'rgba(160, 185, 210, 0.3)';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    const step = 0.02;
    const tl = toLatLng(0, 0, map, width, height);
    const br = toLatLng(width, height, map, width, height);

    for (let lat = Math.floor(tl.lat / step) * step; lat >= br.lat; lat -= step) {
      const [, y] = toPixel(lat, 0, map, width, height);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    for (let lng = Math.floor(tl.lng / step) * step; lng <= br.lng; lng += step) {
      const [x] = toPixel(0, lng, map, width, height);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }

    const boundary = [
      [43.855, -79.639], [43.855, -79.115], [43.58, -79.115],
      [43.58, -79.26], [43.60, -79.44], [43.59, -79.50],
      [43.60, -79.55], [43.63, -79.60], [43.70, -79.639],
    ];
    ctx.beginPath();
    boundary.forEach(([lat, lng], i) => {
      const [x, y] = toPixel(lat, lng, map, width, height);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = dark ? 'rgba(10, 22, 40, 0.6)' : 'rgba(200, 215, 235, 0.4)';
    ctx.fill();
    ctx.strokeStyle = dark ? 'rgba(30, 80, 140, 0.35)' : 'rgba(80, 120, 180, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const roads = [
      [[43.86, -79.39], [43.58, -79.39]],
      [[43.73, -79.64], [43.73, -79.12]],
      [[43.65, -79.64], [43.65, -79.12]],
      [[43.78, -79.64], [43.78, -79.12]],
      [[43.86, -79.49], [43.58, -79.49]],
      [[43.86, -79.33], [43.58, -79.33]],
    ];
    ctx.strokeStyle = dark ? 'rgba(30, 80, 140, 0.2)' : 'rgba(140, 170, 200, 0.25)';
    ctx.lineWidth = 1;
    roads.forEach((road) => {
      ctx.beginPath();
      road.forEach(([lat, lng], i) => {
        const [x, y] = toPixel(lat, lng, map, width, height);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    const lake = [
      [43.63, -79.64], [43.60, -79.55], [43.59, -79.45],
      [43.60, -79.35], [43.58, -79.20], [43.58, -79.11],
      [43.50, -79.11], [43.50, -79.64],
    ];
    ctx.beginPath();
    lake.forEach(([lat, lng], i) => {
      const [x, y] = toPixel(lat, lng, map, width, height);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    if (dark) {
      const lakeGrad = ctx.createLinearGradient(0, height * 0.7, 0, height);
      lakeGrad.addColorStop(0, 'rgba(8, 60, 120, 0.2)');
      lakeGrad.addColorStop(1, 'rgba(8, 60, 120, 0.08)');
      ctx.fillStyle = lakeGrad;
    } else {
      ctx.fillStyle = 'rgba(100, 160, 220, 0.15)';
    }
    ctx.fill();
    ctx.strokeStyle = dark ? 'rgba(30, 100, 180, 0.25)' : 'rgba(80, 140, 200, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const [lakeX, lakeY] = toPixel(43.55, -79.38, map, width, height);
    ctx.fillStyle = dark ? 'rgba(30, 100, 180, 0.4)' : 'rgba(50, 100, 160, 0.4)';
    ctx.font = `${Math.max(10, 12 * map.zoom / 2.5)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText('Lake Ontario', lakeX, lakeY);

    if (map.zoom > 2) {
      const labels: [number, number, string][] = [
        [43.77, -79.41, 'North York'], [43.72, -79.26, 'Scarborough'],
        [43.71, -79.52, 'Etobicoke'], [43.66, -79.38, 'Downtown'],
        [43.69, -79.35, 'East York'], [43.65, -79.44, 'Liberty Village'],
        [43.68, -79.30, 'The Beaches'], [43.76, -79.33, 'Don Mills'],
      ];
      ctx.fillStyle = dark ? 'rgba(100, 160, 220, 0.35)' : 'rgba(60, 100, 150, 0.4)';
      ctx.font = `${Math.max(9, 10 * map.zoom / 2.5)}px system-ui`;
      labels.forEach(([lat, lng, name]) => {
        const [x, y] = toPixel(lat, lng, map, width, height);
        if (x > 0 && x < width && y > 0 && y < height) ctx.fillText(name, x, y);
      });
    }

    if (viewMode === 'heatmap') {
      const cellSize = Math.max(3, 15 / map.zoom * 2.5);
      const grid = new Map<string, number>();
      let max = 0;

      filteredRecords.forEach((r) => {
        const [x, y] = toPixel(r.lat, r.lng, map, width, height);
        if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;
        const key = `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
        const count = (grid.get(key) || 0) + 1;
        grid.set(key, count);
        if (count > max) max = count;
      });

      if (max > 0) {
        grid.forEach((count, key) => {
          const [gxS, gyS] = key.split(',');
          const gx = parseInt(gxS), gy = parseInt(gyS);
          const t = count / max;
          const radius = cellSize * (1 + t * 2);
          const cx = gx * cellSize + cellSize / 2;
          const cy = gy * cellSize + cellSize / 2;
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

          if (t > 0.7) {
            grad.addColorStop(0, `rgba(255, 100, 80, ${0.6 * t})`);
            grad.addColorStop(0.4, `rgba(255, 160, 60, ${0.4 * t})`);
            grad.addColorStop(1, 'rgba(255, 160, 60, 0)');
          } else if (t > 0.3) {
            grad.addColorStop(0, `rgba(60, 180, 220, ${0.5 * t})`);
            grad.addColorStop(0.5, `rgba(40, 140, 200, ${0.3 * t})`);
            grad.addColorStop(1, 'rgba(40, 140, 200, 0)');
          } else {
            grad.addColorStop(0, `rgba(20, 120, 180, ${0.4 * t})`);
            grad.addColorStop(0.5, `rgba(20, 120, 180, ${0.2 * t})`);
            grad.addColorStop(1, 'rgba(20, 120, 180, 0)');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    } else {
      const r = Math.max(2, 3 * map.zoom / 2.5);
      filteredRecords.forEach((rec) => {
        const [x, y] = toPixel(rec.lat, rec.lng, map, width, height);
        if (x < -10 || x > width + 10 || y < -10 || y > height + 10) return;

        const active = hovered?.id === rec.id || selectedRecord?.id === rec.id;
        const color = rec.type === 'auto' ? 'rgba(255, 100, 80, 0.7)' : 'rgba(60, 180, 240, 0.7)';

        if (active) {
          ctx.beginPath();
          ctx.arc(x, y, r * 4, 0, Math.PI * 2);
          ctx.fillStyle = rec.type === 'auto' ? 'rgba(255, 100, 80, 0.15)' : 'rgba(60, 180, 240, 0.15)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, active ? r * 1.8 : r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (active) {
          ctx.strokeStyle = rec.type === 'auto' ? '#ff6450' : '#3cb4f0';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    }

    ctx.fillStyle = dark ? 'rgba(100, 160, 220, 0.5)' : 'rgba(60, 100, 160, 0.5)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    const km = (1 / (map.zoom * 800)) * 100 * 111;
    ctx.fillText(`~${km.toFixed(1)} km`, 15, height - 15);
    ctx.strokeStyle = dark ? 'rgba(100, 160, 220, 0.3)' : 'rgba(60, 100, 160, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(15, height - 22); ctx.lineTo(115, height - 22); ctx.stroke();

    ctx.fillStyle = dark ? 'rgba(100, 160, 220, 0.4)' : 'rgba(60, 100, 160, 0.4)';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('N', width - 25, 25);
    ctx.beginPath(); ctx.moveTo(width - 25, 28); ctx.lineTo(width - 25, 45);
    ctx.strokeStyle = dark ? 'rgba(100, 160, 220, 0.3)' : 'rgba(60, 100, 160, 0.3)';
    ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - 25, 28); ctx.lineTo(width - 22, 34); ctx.lineTo(width - 28, 34);
    ctx.closePath(); ctx.fill();
  }, [dims, map, filteredRecords, viewMode, hovered, selectedRecord, dark]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  const onMouseDown = (e: React.MouseEvent) => { setDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); };

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    setMouse({ x: mx, y: my });

    if (dragging) {
      const scale = map.zoom * 800;
      setMap((p) => ({
        ...p,
        centerLng: p.centerLng - (e.clientX - dragStart.x) / scale,
        centerLat: p.centerLat + (e.clientY - dragStart.y) / (scale * 1.3),
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (viewMode === 'scatter') {
      let found: TheftRecord | null = null;
      for (const r of filteredRecords) {
        const [px, py] = toPixel(r.lat, r.lng, map, dims.width, dims.height);
        if (Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < 8) { found = r; break; }
      }
      setHovered(found);
    }
  };

  const onMouseUp = () => setDragging(false);
  const onMouseLeave = () => { setDragging(false); setHovered(null); };

  const onClick = (e: React.MouseEvent) => {
    if (viewMode !== 'scatter') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    for (const r of filteredRecords) {
      const [px, py] = toPixel(r.lat, r.lng, map, dims.width, dims.height);
      if (Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < 10) { setSelectedRecord(r); return; }
    }
    setSelectedRecord(null);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const d = e.deltaY > 0 ? -0.2 : 0.2;
    setMap((p) => ({ ...p, zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, p.zoom + d * p.zoom * 0.15)) }));
  };

  const btnClass = `w-8 h-8 backdrop-blur rounded-lg flex items-center justify-center transition-colors border ${
    dark
      ? 'bg-[#0a1628]/90 border-[#112a4a] text-blue-300/60 hover:text-white hover:bg-[#112a4a]'
      : 'bg-white/90 border-[#d0daea] text-[#5a7a9a] hover:text-[#0a1628] hover:bg-white'
  }`;

  const overlayClass = `backdrop-blur rounded-lg px-2 py-1 border ${
    dark ? 'bg-[#0a1628]/80 border-[#112a4a]' : 'bg-white/80 border-[#d0daea]'
  }`;

  const overlayText = dark ? 'text-blue-300/50' : 'text-[#5a7a9a]';

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border shadow-2xl ${dark ? 'border-[#112a4a]' : 'border-[#d0daea]'}`}>
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        onWheel={onWheel}
      />

      <div className="absolute top-3 right-3 flex flex-col gap-1">
        {[
          { action: () => setMap((p) => ({ ...p, zoom: Math.min(MAX_ZOOM, p.zoom * 1.3) })), icon: ZoomIn },
          { action: () => setMap((p) => ({ ...p, zoom: Math.max(MIN_ZOOM, p.zoom / 1.3) })), icon: ZoomOut },
          { action: () => setMap({ centerLat: CENTER.lat, centerLng: CENTER.lng, zoom: 2.5 }), icon: RotateCcw },
        ].map(({ action, icon: Icon }, i) => (
          <button key={i} onClick={action} className={btnClass}>
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div className="absolute top-3 left-3 flex flex-col gap-1">
        <div className={`${overlayClass} flex items-center gap-1`}>
          <Crosshair className={`w-3 h-3 ${overlayText}`} />
          <span className={`text-[10px] font-mono ${overlayText}`}>
            {map.centerLat.toFixed(4)}, {map.centerLng.toFixed(4)}
          </span>
        </div>
        <div className={overlayClass}>
          <span className={`text-[10px] ${overlayText}`}>
            {filteredRecords.length.toLocaleString()} points
          </span>
        </div>
      </div>

      <div className={`absolute bottom-3 right-3 backdrop-blur rounded-lg px-3 py-2 border ${dark ? 'bg-[#0a1628]/90 border-[#112a4a]' : 'bg-white/90 border-[#d0daea]'}`}>
        {viewMode === 'scatter' ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff6450]" />
              <span className={`text-[10px] ${dark ? 'text-blue-200/70' : 'text-[#3a5a7a]'}`}>Auto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#3cb4f0]" />
              <span className={`text-[10px] ${dark ? 'text-blue-200/70' : 'text-[#3a5a7a]'}`}>Bike</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className={`text-[10px] font-medium ${overlayText}`}>Density</span>
            <div className="w-14 h-2 rounded-full bg-gradient-to-r from-[#1478b4] via-[#3cb4dc] to-[#ff6450]" />
            <div className="flex justify-between">
              <span className={`text-[9px] ${dark ? 'text-blue-400/40' : 'text-[#8aa8c8]'}`}>Low</span>
              <span className={`text-[9px] ${dark ? 'text-blue-400/40' : 'text-[#8aa8c8]'}`}>High</span>
            </div>
          </div>
        )}
      </div>

      {hovered && viewMode === 'scatter' && (
        <div
          className={`absolute z-50 pointer-events-none backdrop-blur rounded-lg px-3 py-2 border shadow-xl ${dark ? 'bg-[#0a1628]/95 border-[#1e508c]' : 'bg-white/95 border-[#d0daea]'}`}
          style={{ left: mouse.x + 15, top: mouse.y - 10 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{hovered.type === 'auto' ? '🚗' : '🚲'}</span>
            <span className={`text-xs font-semibold capitalize ${dark ? 'text-white' : 'text-[#0a1628]'}`}>{hovered.type} Theft</span>
          </div>
          <div className={`text-[10px] space-y-0.5 ${dark ? 'text-blue-300/60' : 'text-[#5a7a9a]'}`}>
            <div>{hovered.neighbourhood}</div>
            <div>{hovered.date} at {String(hovered.hour).padStart(2, '0')}:00</div>
          </div>
        </div>
      )}
    </div>
  );
}
