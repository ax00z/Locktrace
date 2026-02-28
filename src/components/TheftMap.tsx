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
  return [Math.floor(w / 2 + (lng - s.centerLng) * scale), Math.floor(h / 2 - (lat - s.centerLat) * scale * 1.3)];
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
    
    // Strict pixel mapping to prevent blurring
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Tactical Background
    ctx.fillStyle = dark ? '#090a0c' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Sharp Grid
    const gridColor = dark ? '#1a1d24' : '#f4f4f5';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const step = 0.02;
    const tl = toLatLng(0, 0, map, width, height);
    const br = toLatLng(width, height, map, width, height);

    for (let lat = Math.floor(tl.lat / step) * step; lat >= br.lat; lat -= step) {
      const [, y] = toPixel(lat, 0, map, width, height);
      ctx.beginPath(); ctx.moveTo(0, Math.floor(y) + 0.5); ctx.lineTo(width, Math.floor(y) + 0.5); ctx.stroke();
    }
    for (let lng = Math.floor(tl.lng / step) * step; lng <= br.lng; lng += step) {
      const [x] = toPixel(0, lng, map, width, height);
      ctx.beginPath(); ctx.moveTo(Math.floor(x) + 0.5, 0); ctx.lineTo(Math.floor(x) + 0.5, height); ctx.stroke();
    }

    // Land Boundary
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
    ctx.fillStyle = dark ? '#0f1115' : '#fafafa';
    ctx.fill();
    ctx.strokeStyle = dark ? '#22262f' : '#e4e4e7';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lake Ontario
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
    ctx.fillStyle = dark ? '#0a0b0e' : '#f4f4f5';
    ctx.fill();

    const [lakeX, lakeY] = toPixel(43.55, -79.38, map, width, height);
    ctx.fillStyle = dark ? '#525866' : '#a1a1aa';
    ctx.font = `bold ${Math.max(10, 12 * map.zoom / 2.5)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('LAKE ONTARIO', lakeX, lakeY);

    // Matrix View (replaces blurry heatmap)
    if (viewMode === 'heatmap') {
      const cellSize = Math.max(8, 20 / map.zoom * 2.5);
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
          
          let color = `rgba(59, 130, 246, ${Math.min(0.8, t + 0.2)})`; // Blue
          if (t > 0.5) color = `rgba(234, 179, 8, ${Math.min(0.9, t + 0.2)})`; // Yellow
          if (t > 0.8) color = `rgba(239, 68, 68, ${Math.min(1, t + 0.2)})`; // Red

          ctx.fillStyle = color;
          // Sharp rectangle rendering
          ctx.fillRect(gx * cellSize + 1, gy * cellSize + 1, cellSize - 2, cellSize - 2);
        });
      }
    } else {
      // Scatter (Sharp Blocks)
      const size = Math.max(2, 3 * map.zoom / 2.5);
      filteredRecords.forEach((rec) => {
        const [x, y] = toPixel(rec.lat, rec.lng, map, width, height);
        if (x < -10 || x > width + 10 || y < -10 || y > height + 10) return;

        const active = hovered?.id === rec.id || selectedRecord?.id === rec.id;
        ctx.fillStyle = rec.type === 'auto' ? '#eab308' : '#3b82f6';

        if (active) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);
        } else {
          ctx.fillRect(x - size, y - size, size * 2, size * 2);
        }
      });
    }

    // Tactical Overlays (Scale & North)
    ctx.fillStyle = dark ? '#525866' : '#a1a1aa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const km = (1 / (map.zoom * 800)) * 100 * 111;
    ctx.fillText(`[ SCALE: ~${km.toFixed(1)}KM ]`, 15, height - 15);

    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', width - 25, 25);
    ctx.beginPath(); ctx.moveTo(width - 25, 28); ctx.lineTo(width - 25, 45);
    ctx.strokeStyle = dark ? '#525866' : '#a1a1aa';
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
        if (Math.abs(mx - px) < 8 && Math.abs(my - py) < 8) { found = r; break; }
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
      if (Math.abs(mx - px) < 10 && Math.abs(my - py) < 10) { setSelectedRecord(r); return; }
    }
    setSelectedRecord(null);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const d = e.deltaY > 0 ? -0.2 : 0.2;
    setMap((p) => ({ ...p, zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, p.zoom + d * p.zoom * 0.15)) }));
  };

  const btnClass = `w-8 h-8 flex items-center justify-center transition-none border ${
    dark
      ? 'bg-[#090a0c] border-[#22262f] text-[#8a919e] hover:text-white hover:bg-[#111318]'
      : 'bg-white border-[#e4e4e7] text-[#52525b] hover:text-black hover:bg-[#f4f4f5]'
  }`;

  const overlayClass = `px-3 py-1.5 border font-mono uppercase ${
    dark ? 'bg-[#090a0c] border-[#22262f]' : 'bg-white border-[#e4e4e7]'
  }`;

  const overlayText = dark ? 'text-[#e2e4e9]' : 'text-[#09090b]';

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[400px] overflow-hidden border ${dark ? 'border-[#22262f]' : 'border-[#e4e4e7]'}`}>
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${dragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        onWheel={onWheel}
        style={{ imageRendering: 'pixelated' }}
      />

      <div className="absolute top-3 right-3 flex flex-col gap-[1px]">
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
        <div className={`${overlayClass} flex items-center gap-2`}>
          <Crosshair className={`w-3 h-3 ${overlayText}`} />
          <span className={`text-[10px] tracking-widest ${overlayText}`}>
            {map.centerLat.toFixed(4)}, {map.centerLng.toFixed(4)}
          </span>
        </div>
        <div className={overlayClass}>
          <span className={`text-[10px] tracking-widest ${overlayText}`}>
            {filteredRecords.length.toLocaleString()} POINTS
          </span>
        </div>
      </div>

      <div className={`absolute bottom-3 right-3 ${overlayClass}`}>
        {viewMode === 'scatter' ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#eab308]" />
              <span className={`text-[10px] tracking-widest ${overlayText}`}>AUTO</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#3b82f6]" />
              <span className={`text-[10px] tracking-widest ${overlayText}`}>BIKE</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className={`text-[10px] tracking-widest ${overlayText}`}>DENSITY</span>
            <div className="w-16 h-1.5 bg-gradient-to-r from-[#3b82f6] via-[#eab308] to-[#ef4444]" />
            <div className="flex justify-between">
              <span className={`text-[9px] ${dark ? 'text-[#8a919e]' : 'text-[#52525b]'}`}>LOW</span>
              <span className={`text-[9px] ${dark ? 'text-[#8a919e]' : 'text-[#52525b]'}`}>HIGH</span>
            </div>
          </div>
        )}
      </div>

      {hovered && viewMode === 'scatter' && (
        <div
          className={`absolute z-50 pointer-events-none ${overlayClass} shadow-2xl`}
          style={{ left: mouse.x + 15, top: mouse.y - 10 }}
        >
          <div className="flex items-center gap-2 mb-1 border-b pb-1 border-current">
            <div className={`w-2 h-2 ${hovered.type === 'auto' ? 'bg-[#eab308]' : 'bg-[#3b82f6]'}`} />
            <span className={`text-[10px] font-bold tracking-widest ${overlayText}`}>
              {hovered.type} THEFT
            </span>
          </div>
          <div className={`text-[9px] space-y-1 mt-2 tracking-widest ${dark ? 'text-[#8a919e]' : 'text-[#52525b]'}`}>
            <div>LOC: {hovered.neighbourhood}</div>
            <div>TME: {hovered.date} [{String(hovered.hour).padStart(2, '0')}:00]</div>
          </div>
        </div>
      )}
    </div>
  );
}