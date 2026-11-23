import React, { useState } from 'react';
import { CellOverride, GoalType, GridSize, LevelConfig, SweetType } from '../game/types';
import { ALL_SWEETS } from '../game/types';
import { SWEET_META } from '../game/themes';
import { ArrowLeft, Download, Play, Save, Trash2, Upload } from 'lucide-react';

interface LevelEditorProps {
  customLevels: LevelConfig[];
  onBack: () => void;
  onPlaytest: (level: LevelConfig) => void;
  onSaveCustomLevel: (level: LevelConfig) => void;
  onDeleteCustomLevel: (id: number) => void;
}

type PaintTool = 'erase' | 'jelly1' | 'jelly2' | 'ice' | 'locked' | 'stone' | 'cherry' | 'hole';

export const LevelEditor: React.FC<LevelEditorProps> = ({
  customLevels,
  onBack,
  onPlaytest,
  onSaveCustomLevel,
  onDeleteCustomLevel,
}) => {
  const [name, setName] = useState('Custom Doomsday Op');
  const [gridSize, setGridSize] = useState<GridSize>(8);
  const [moves, setMoves] = useState(24);
  const [timeLimitSec, setTimeLimitSec] = useState<number>(0);
  const [goalType, setGoalType] = useState<GoalType>('jelly');
  const [goalTarget, setGoalTarget] = useState(20);
  const [goalSweet, setGoalSweet] = useState<SweetType>('laddu');
  const [tool, setTool] = useState<PaintTool>('jelly1');
  const [cells, setCells] = useState<Record<string, CellOverride>>({});
  const [jsonText, setJsonText] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const paintCell = (r: number, c: number) => {
    const key = `${r},${c}`;
    setCells((prev) => {
      const next = { ...prev };
      if (tool === 'erase') {
        delete next[key];
      } else if (tool === 'jelly1') {
        next[key] = { r, c, jelly: 1 };
      } else if (tool === 'jelly2') {
        next[key] = { r, c, jelly: 2 };
      } else if (tool === 'ice') {
        next[key] = { r, c, blocker: 'ice' };
      } else if (tool === 'locked') {
        next[key] = { r, c, blocker: 'locked' };
      } else if (tool === 'stone') {
        next[key] = { r, c, blocker: 'stone' };
      } else if (tool === 'cherry') {
        next[key] = { r, c, cherry: true };
      } else if (tool === 'hole') {
        next[key] = { r, c, hole: true };
      }
      return next;
    });
  };

  const buildConfig = (id = Date.now()): LevelConfig => {
    const layout = Object.values(cells).filter((o) => o.r < gridSize && o.c < gridSize);
    const jellyCount = layout.filter((o) => o.jelly).length;
    const cherryCount = layout.filter((o) => o.cherry).length;

    const finalTarget =
      goalType === 'jelly'
        ? Math.max(1, jellyCount)
        : goalType === 'cherry'
        ? Math.max(1, cherryCount)
        : goalTarget;

    return {
      id,
      name: name.trim() || 'Custom Doomsday Op',
      region: 'festival',
      rows: gridSize,
      cols: gridSize,
      moves: Math.max(5, Math.min(60, moves)),
      ...(timeLimitSec > 0 ? { timeLimitSec } : {}),
      goals: [
        {
          type: goalType,
          target: finalTarget,
          ...(goalType === 'collect' ? { sweet: goalSweet } : {}),
        },
      ],
      starThresholds: [2000, 3800, 6200],
      sweetTypesCount: 6,
      ...(goalType === 'boss' ? { bossName: 'Doomsday Drone Prime', bossHp: finalTarget } : {}),
      layout,
      isCustom: true,
    };
  };

  const handleExport = () => {
    const cfg = buildConfig();
    const str = JSON.stringify(cfg, null, 2);
    setJsonText(str);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(str).catch(() => {});
    }
    setStatusMsg('Mission JSON generated (and copied if supported).');
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText) as LevelConfig;
      if (!parsed || !parsed.rows || !parsed.goals) {
        setStatusMsg('Invalid mission JSON: missing rows or goals.');
        return;
      }
      const gs: GridSize = parsed.rows === 7 || parsed.rows === 8 || parsed.rows === 9 ? parsed.rows : 8;
      setName(parsed.name || 'Imported Mission');
      setGridSize(gs);
      setMoves(parsed.moves || 22);
      setTimeLimitSec(parsed.timeLimitSec || 0);
      if (parsed.goals[0]) {
        setGoalType(parsed.goals[0].type);
        setGoalTarget(parsed.goals[0].target);
        if (parsed.goals[0].sweet) setGoalSweet(parsed.goals[0].sweet);
      }
      const nextCells: Record<string, CellOverride> = {};
      for (const ov of parsed.layout ?? []) {
        nextCells[`${ov.r},${ov.c}`] = ov;
      }
      setCells(nextCells);
      setStatusMsg('Imported mission JSON into architect!');
    } catch {
      setStatusMsg('Could not parse JSON. Please check formatting.');
    }
  };

  const tools: Array<{ id: PaintTool; label: string; preview: string }> = [
    { id: 'jelly1', label: 'Shield 1', preview: 'bg-emerald-500' },
    { id: 'jelly2', label: 'Shield 2', preview: 'bg-teal-300' },
    { id: 'ice', label: 'Cryo', preview: 'bg-sky-400' },
    { id: 'locked', label: 'Lock', preview: 'bg-slate-600' },
    { id: 'stone', label: 'Wall', preview: 'bg-zinc-500' },
    { id: 'cherry', label: 'Tesseract', preview: 'bg-cyan-500' },
    { id: 'hole', label: 'Void', preview: 'bg-slate-900 border border-dashed border-slate-500' },
    { id: 'erase', label: 'Erase', preview: 'bg-slate-800 border border-emerald-500/50' },
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#05080F] via-[#091517] to-[#0B1220] text-slate-100 pb-10">
      <header className="sticky top-0 z-30 border-b border-emerald-500/25 bg-[#070C14]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base sm:text-lg font-extrabold text-white">Mission Architect</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const cfg = buildConfig();
                onSaveCustomLevel(cfg);
                setStatusMsg(`Saved "${cfg.name}" to your Custom Missions!`);
              }}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3.5 text-xs font-bold text-slate-100 hover:bg-slate-700"
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              onClick={() => onPlaytest(buildConfig())}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-xs font-black text-slate-950 hover:bg-emerald-400"
            >
              <Play className="w-4 h-4 fill-current" /> Playtest
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6">
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-[#0B121E]/95 p-5 shadow-lg">
          <div>
            <label className="block text-xs font-bold text-emerald-300 mb-1">Mission Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1">Grid Size</label>
              <div className="flex gap-1">
                {([7, 8, 9] as GridSize[]).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setGridSize(sz)}
                    className={`flex-1 min-h-[38px] rounded-lg text-xs font-bold border ${
                      gridSize === sz
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {sz}×{sz}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1">Turns</label>
              <input
                type="number"
                min={5}
                max={60}
                value={moves}
                onChange={(e) => setMoves(Number(e.target.value) || 20)}
                className="w-full min-h-[38px] rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1">Objective</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as GoalType)}
                className="w-full min-h-[40px] rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-sm text-white"
              >
                <option value="jelly">Clear Doom Shield</option>
                <option value="score">Reach Power</option>
                <option value="collect">Charge Relic</option>
                <option value="cherry">Drop Tesseracts</option>
                <option value="boss">Villain Boss HP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1">Timer (sec, 0=off)</label>
              <input
                type="number"
                min={0}
                max={300}
                value={timeLimitSec}
                onChange={(e) => setTimeLimitSec(Math.max(0, Number(e.target.value) || 0))}
                className="w-full min-h-[40px] rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white tabular-nums"
              />
            </div>
          </div>

          {(goalType === 'score' || goalType === 'collect' || goalType === 'boss') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1">Target</label>
                <input
                  type="number"
                  min={5}
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value) || 20)}
                  className="w-full min-h-[40px] rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white tabular-nums"
                />
              </div>
              {goalType === 'collect' && (
                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-1">Avenger Relic</label>
                  <select
                    value={goalSweet}
                    onChange={(e) => setGoalSweet(e.target.value as SweetType)}
                    className="w-full min-h-[40px] rounded-lg border border-slate-700 bg-slate-900 px-2 text-sm text-white"
                  >
                    {ALL_SWEETS.map((s) => (
                      <option key={s} value={s}>
                        {SWEET_META[s].name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-300">Tactical Tile Brush</span>
              <button
                onClick={() => setCells({})}
                className="text-xs font-semibold text-rose-400 hover:underline"
              >
                Clear Grid
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {tools.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTool(item.id)}
                  className={`flex min-h-[42px] flex-col items-center justify-center gap-1 rounded-xl border p-1.5 text-[11px] font-semibold ${
                    tool === item.id
                      ? 'border-emerald-400 bg-emerald-950/70 text-emerald-200 ring-2 ring-emerald-400/50'
                      : 'border-slate-800 bg-slate-900 text-slate-300'
                  }`}
                >
                  <span className={`h-3.5 w-3.5 rounded ${item.preview}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300">JSON Export / Import</span>
              <div className="flex gap-1.5">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-100 hover:bg-slate-700"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
                <button
                  onClick={handleImport}
                  className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-black text-slate-950 hover:bg-emerald-400"
                >
                  <Upload className="w-3.5 h-3.5" /> Import
                </button>
              </div>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste mission JSON here or click Export..."
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 font-mono text-[11px] text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {statusMsg && <p className="mt-1.5 text-xs font-semibold text-emerald-400">{statusMsg}</p>}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="rounded-3xl border border-slate-800 bg-[#0B121E]/95 p-4 sm:p-6 shadow-lg flex flex-col items-center">
            <div
              className="grid w-full max-w-[440px] aspect-square gap-1.5 rounded-2xl bg-slate-950 p-3 border border-emerald-500/40"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: gridSize }).map((_, r) =>
                Array.from({ length: gridSize }).map((__, c) => {
                  const ov = cells[`${r},${c}`];
                  let label = '';
                  let bg = 'bg-slate-900 border-slate-700/80 text-slate-300';
                  if (ov?.hole) {
                    bg = 'bg-transparent border-dashed border-slate-700 text-slate-500';
                    label = '×';
                  } else if (ov?.blocker === 'stone') {
                    bg = 'bg-zinc-600 text-white border-zinc-400';
                    label = 'W';
                  } else if (ov?.blocker === 'ice') {
                    bg = 'bg-sky-400/80 text-slate-950 border-sky-200';
                    label = '❄';
                  } else if (ov?.blocker === 'locked') {
                    bg = 'bg-slate-700 text-amber-300 border-slate-500';
                    label = '🔒';
                  } else if (ov?.cherry) {
                    bg = 'bg-cyan-500 text-slate-950 border-cyan-300';
                    label = '◆';
                  } else if (ov?.jelly === 2) {
                    bg = 'bg-teal-400 text-slate-950 border-teal-200';
                    label = 'S2';
                  } else if (ov?.jelly === 1) {
                    bg = 'bg-emerald-600 text-white border-emerald-400';
                    label = 'S1';
                  }
                  return (
                    <button
                      key={`${r},${c}`}
                      onClick={() => paintCell(r, c)}
                      className={`flex items-center justify-center rounded-lg border text-xs font-bold transition-transform active:scale-95 ${bg}`}
                    >
                      {label}
                    </button>
                  );
                })
              )}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Tap cells to paint Doom Shields, Cryo Stasis, Tesseracts, Walls, or Void tiles. Click Playtest anytime!
            </p>
          </div>

          {customLevels.length > 0 && (
            <div className="rounded-3xl border border-slate-800 bg-[#0B121E]/95 p-5 shadow-lg">
              <h2 className="text-sm font-bold text-white mb-3">Saved Custom Missions</h2>
              <div className="divide-y divide-slate-800">
                {customLevels.map((lvl) => (
                  <div key={lvl.id} className="flex items-center justify-between py-2.5 gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{lvl.name}</div>
                      <div className="text-xs text-slate-400">
                        {lvl.rows}×{lvl.cols} · {lvl.moves} turns · {lvl.goals[0]?.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onPlaytest(lvl)}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-emerald-400"
                      >
                        Deploy
                      </button>
                      <button
                        onClick={() => onDeleteCustomLevel(lvl.id)}
                        className="rounded-lg bg-rose-950/80 border border-rose-500/30 p-2 text-rose-400 hover:bg-rose-900"
                        aria-label="Delete custom mission"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
