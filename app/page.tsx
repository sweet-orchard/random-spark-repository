"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Plus, Trash2, Sparkles, X, Clock, Hash, Pencil, Check, UserCircle2, Settings, LayoutGrid, Search, ChevronRight, FolderOpen, Layers, ArrowLeft, MoreHorizontal, Zap, LogOut } from "lucide-react";
import { motion, AnimatePresence, animate } from "framer-motion";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  description?: string | null;
  created_at: string;
  user_id?: string;
}

interface SpinRecord {
  id: string;
  title: string;
  description?: string;
  taskId?: string;
  ts: number;
}

interface SpinSpace {
  id: string;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEM_H = 56;
const REEL_H = 336;
const CENTER = REEL_H / 2 - ITEM_H / 2;

// ─── Audio ───────────────────────────────────────────────────────────────────
function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  function ctx() {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current)
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }
  const tick = useCallback(() => {
    const c = ctx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = "sine"; o.frequency.setValueAtTime(1100, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(700, c.currentTime + 0.022);
    g.gain.setValueAtTime(0.016, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.028);
    o.start(c.currentTime); o.stop(c.currentTime + 0.03);
  }, []);
  const win = useCallback(() => {
    const c = ctx(); if (!c) return;
    [{ freq: 659.25, t: 0 }, { freq: 987.77, t: 0.2 }].forEach(({ freq, t }) => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0, c.currentTime + t);
      g.gain.linearRampToValueAtTime(0.05, c.currentTime + t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t + 1.0);
      o.start(c.currentTime + t); o.stop(c.currentTime + t + 1.1);
    });
  }, []);
  return { tick, win };
}

function fireConfetti() {
  const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#FF8B94", "#C7CEEA", "#FFDAC1", "#B4A7D6"];
  const base = { spread: 52, ticks: 75, zIndex: 9999, colors, startVelocity: 20 };
  confetti({ ...base, particleCount: 30, origin: { x: 0.38, y: 0.6 } });
  setTimeout(() => confetti({ ...base, particleCount: 28, origin: { x: 0.62, y: 0.6 } }), 85);
}

// ─── SpinnerReel ──────────────────────────────────────────────────────────────
function SpinnerReel({ tasks, spinnerRef, isSpinning, winningItemIndex }: {
  tasks: Task[]; spinnerRef: React.RefObject<HTMLDivElement | null>; isSpinning: boolean; winningItemIndex: number | null;
}) {
  return (
    <div style={{ position: "relative", height: REEL_H, background: "#fafaf9", border: "1px solid #e9e9e7", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 104, background: "linear-gradient(to bottom, #fafaf9 35%, transparent)", zIndex: 10, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: "auto 0 0 0", height: 104, background: "linear-gradient(to top, #fafaf9 35%, transparent)", zIndex: 10, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: "0 0 auto 0", top: CENTER, height: ITEM_H, background: isSpinning ? "transparent" : "#f0efec", borderTop: isSpinning ? "none" : "1px solid #e9e9e7", borderBottom: isSpinning ? "none" : "1px solid #e9e9e7", transition: "all 0.35s ease", zIndex: 1 }} />
      <div style={{ position: "absolute", left: 0, top: CENTER + 14, width: 2, height: ITEM_H - 28, background: isSpinning ? "#d4d0cb" : "#37352f", borderRadius: "0 2px 2px 0", transition: "background 0.4s ease", zIndex: 20 }} />
      {tasks.length === 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "rgba(55,53,47,0.3)", zIndex: 20 }}>
          <Sparkles style={{ width: 20, height: 20, opacity: 0.5 }} />
          <span style={{ fontSize: 15 }}>Add items to spin</span>
        </div>
      )}
      {tasks.length > 0 && (
        <div style={{ position: "absolute", inset: "0 0 auto 0", top: 0, paddingTop: CENTER, zIndex: 5 }}>
          <div ref={spinnerRef} className="will-change-transform">
            {Array.from({ length: 140 }).map((_, i) => {
              const task = tasks[i % tasks.length];
              if (!task) return null;
              const isWin = winningItemIndex === i && !isSpinning;
              return (
                <div key={`${i}-${task.id}`} style={{ height: ITEM_H, display: "flex", alignItems: "center", paddingLeft: 40, paddingRight: 20 }}>
                  <span style={{ fontSize: isWin ? 17 : 15, fontWeight: isWin ? 600 : 400, color: isWin ? "#37352f" : "rgba(55,53,47,0.28)", letterSpacing: isWin ? "-0.015em" : "0", transition: "all 0.22s ease", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                    {task.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HistoryItem ──────────────────────────────────────────────────────────────
function HistoryItem({ record, onDelete, isMobile }: { record: SpinRecord; onDelete: (id: string) => void; isMobile: boolean }) {
  const time = new Date(record.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <motion.div layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.15 } }} className="group"
      style={{ padding: isMobile ? "10px 12px" : "8px 10px", borderRadius: 8, cursor: "default", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0efec")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontSize: isMobile ? 14 : 13, fontWeight: 500, color: "#37352f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{record.title}</div>
          <div style={{ fontSize: 11, color: "rgba(55,53,47,0.35)", flexShrink: 0 }}>{time}</div>
        </div>
        {record.description ? <div style={{ fontSize: 12, color: "rgba(55,53,47,0.5)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.description}</div> : null}
      </div>
      <button onClick={() => onDelete(record.id)} className="opacity-0 group-hover:opacity-100"
        style={{ border: "none", background: "none", cursor: "pointer", padding: isMobile ? 6 : 4, borderRadius: 4, color: "rgba(55,53,47,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: isMobile ? 1 : undefined, transition: "all 100ms" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(235,87,87,0.08)"; e.currentTarget.style.color = "rgb(235,87,87)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(55,53,47,0.35)"; }}
      >
        <Trash2 style={{ width: 12, height: 12 }} />
      </button>
    </motion.div>
  );
}

// ─── WinnerModal ──────────────────────────────────────────────────────────────
function WinnerModal({ winner, onClose, onDelete, onRespin }: { winner: Task; onClose: () => void; onDelete: (id: string) => void; onRespin: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.18 } }} exit={{ opacity: 0, transition: { duration: 0.14 } }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(15,15,15,0.45)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }} exit={{ opacity: 0, y: 6, transition: { duration: 0.14 } }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 380, background: "#ffffff", borderRadius: 8, border: "1px solid #e9e9e7", boxShadow: "0 2px 8px rgba(15,15,15,0.06), 0 12px 32px rgba(15,15,15,0.09)", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e9e9e7" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#37352f" }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#37352f" }}>Picked for you</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 4, color: "rgba(55,53,47,0.4)", display: "flex", alignItems: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f0efec")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div style={{ padding: "36px 24px 28px", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(55,53,47,0.4)", marginBottom: 12 }}>Next up</p>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#37352f", letterSpacing: "-0.02em", lineHeight: 1.3, margin: 0 }}>{winner.title}</h2>
          {winner.description ? <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.5, color: "rgba(55,53,47,0.62)" }}>{winner.description}</p> : null}
        </div>
        <div style={{ display: "flex", gap: 8, padding: "0 16px 16px" }}>
          <button onClick={onClose} style={{ flex: 1, height: 38, borderRadius: 5, border: "none", background: "#37352f", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "background 120ms ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2d2c27")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#37352f")}
          >Got it</button>
          <button onClick={() => { onClose(); setTimeout(onRespin, 80); }} style={{ flex: 1, height: 38, borderRadius: 5, border: "1px solid #e9e9e7", background: "#f7f6f3", color: "rgba(55,53,47,0.65)", fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "background 120ms ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f0efec")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f7f6f3")}
          >Spin again</button>
          <button onClick={() => onDelete(winner.id)} style={{ width: 38, height: 38, borderRadius: 5, border: "1px solid #e9e9e7", background: "#f7f6f3", color: "rgba(55,53,47,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 120ms ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(235,87,87,0.07)"; e.currentTarget.style.color = "rgb(235,87,87)"; e.currentTarget.style.borderColor = "rgba(235,87,87,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f7f6f3"; e.currentTarget.style.color = "rgba(55,53,47,0.4)"; e.currentTarget.style.borderColor = "#e9e9e7"; }}
            title="Remove item"
          >
            <Trash2 style={{ width: 12, height: 12 }} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── FolderDetailModal ────────────────────────────────────────────────────────
function FolderDetailModal({
  folderId, folderName, spins, spinSearch,
  onClose, onSelectSpin, onAddSpin, onDeleteSpin, onRenameSpin,
}: {
  folderId: string; folderName: string; spins: SpinSpace[]; spinSearch: string;
  onClose: () => void; onSelectSpin: (spinId: string) => void; onAddSpin: (name: string) => void; onDeleteSpin: (spinId: string) => void; onRenameSpin: (spinId: string, name: string) => void;
}) {
  const [newSpinName, setNewSpinName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const filtered = spins.filter((s) => s.name.toLowerCase().includes(spinSearch.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,15,15,0.3)", zIndex: 45, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}
    >
      <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }} exit={{ y: 8, opacity: 0, transition: { duration: 0.14 } }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 540, background: "#fff", border: "1px solid #e1dfdb", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 40px rgba(0,0,0,0.1)" }}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid #f0efec", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0efec", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FolderOpen style={{ width: 15, height: 15, color: "#37352f" }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#37352f" }}>{folderName}</div>
              <div style={{ fontSize: 12, color: "rgba(55,53,47,0.45)", marginTop: 1 }}>{spins.length} spin list{spins.length !== 1 ? "s" : ""}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 6, borderRadius: 8, color: "rgba(55,53,47,0.4)", display: "flex" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f0efec")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Spin list */}
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          <AnimatePresence>
            {filtered.length === 0 && (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "rgba(55,53,47,0.35)", fontSize: 14 }}>
                No spin lists yet
              </div>
            )}
            {filtered.map((spin, i) => (
              <motion.div key={spin.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px", borderBottom: "1px solid #f7f6f3" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fafaf9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4d0cb", flexShrink: 0, transition: "background 150ms" }} />

                {editingId === spin.id ? (
                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && editingName.trim()) { onRenameSpin(spin.id, editingName.trim()); setEditingId(null); } if (e.key === "Escape") setEditingId(null); }}
                    onBlur={() => { if (editingName.trim()) onRenameSpin(spin.id, editingName.trim()); setEditingId(null); }}
                    autoFocus
                    style={{ flex: 1, border: "1px solid #d4d0cb", borderRadius: 6, padding: "5px 8px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                  />
                ) : (
                  <button onClick={() => { onSelectSpin(spin.id); onClose(); }}
                    style={{ flex: 1, border: "none", background: "transparent", textAlign: "left", cursor: "pointer", fontSize: 14, color: "#37352f", fontWeight: 400, padding: "2px 0", fontFamily: "inherit" }}
                  >
                    {spin.name}
                  </button>
                )}

                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => { setEditingId(spin.id); setEditingName(spin.name); }}
                    style={{ border: "1px solid #e9e9e7", background: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer", color: "rgba(55,53,47,0.6)", display: "flex", alignItems: "center", gap: 4 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f6f3")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                  >
                    <Pencil style={{ width: 11, height: 11 }} />
                  </button>
                  {spins.length > 1 && (
                    <button onClick={() => onDeleteSpin(spin.id)}
                      style={{ border: "1px solid #f0c6c6", background: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 12, cursor: "pointer", color: "rgba(210,69,69,0.8)", display: "flex", alignItems: "center" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(235,87,87,0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                    >
                      <Trash2 style={{ width: 11, height: 11 }} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add spin */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f0efec", display: "flex", gap: 8 }}>
          <input value={newSpinName} onChange={(e) => setNewSpinName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newSpinName.trim()) { onAddSpin(newSpinName.trim()); setNewSpinName(""); } }}
            placeholder="New spin list name…"
            style={{ flex: 1, border: "1px solid #e1dfdb", borderRadius: 8, padding: "8px 11px", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#37352f" }}
          />
          <button onClick={() => { if (newSpinName.trim()) { onAddSpin(newSpinName.trim()); setNewSpinName(""); } }}
            style={{ border: "none", background: newSpinName.trim() ? "#37352f" : "#ecebe8", color: newSpinName.trim() ? "#fff" : "rgba(55,53,47,0.35)", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: newSpinName.trim() ? "pointer" : "not-allowed", transition: "all 120ms", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus style={{ width: 13, height: 13 }} />
            Add
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TaskSpin() {
  const router = useRouter();
  const DEFAULT_PAGE_TITLE = "TaskSpin";
  const DEFAULT_FOLDER_ID = "default-folder";
  const DEFAULT_SPIN_ID = "main-spin";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskIdsBySpin, setTaskIdsBySpin] = useState<Record<string, string[]>>({ [DEFAULT_SPIN_ID]: [] });
  const [history, setHistory] = useState<SpinRecord[]>([]);
  const [historyBySpin, setHistoryBySpin] = useState<Record<string, SpinRecord[]>>({ [DEFAULT_SPIN_ID]: [] });
  const [newTask, setNewTask] = useState("");
  const [pageTitle, setPageTitle] = useState(DEFAULT_PAGE_TITLE);
  const [titlesBySpin, setTitlesBySpin] = useState<Record<string, string>>({ [DEFAULT_SPIN_ID]: DEFAULT_PAGE_TITLE });
  const [spinSpaces, setSpinSpaces] = useState<SpinSpace[]>([{ id: DEFAULT_FOLDER_ID, name: "Main folder" }]);
  const [spinsByFolder, setSpinsByFolder] = useState<Record<string, SpinSpace[]>>({ [DEFAULT_FOLDER_ID]: [{ id: DEFAULT_SPIN_ID, name: "Main spin" }] });
  const [activeFolderId, setActiveFolderId] = useState(DEFAULT_FOLDER_ID);
  const [activeSpinId, setActiveSpinId] = useState(DEFAULT_SPIN_ID);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [spinSearch, setSpinSearch] = useState("");
  const [recentSpinIds, setRecentSpinIds] = useState<string[]>([DEFAULT_SPIN_ID]);
  const [selectedFolderForDetail, setSelectedFolderForDetail] = useState<string | null>(null);
  const [isEditingPageCopy, setIsEditingPageCopy] = useState(false);
  const [draftPageTitle, setDraftPageTitle] = useState(DEFAULT_PAGE_TITLE);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [winIdx, setWinIdx] = useState<number | null>(null);
  const [winner, setWinner] = useState<Task | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(800);
  const [mobilePanelHeight, setMobilePanelHeight] = useState(300);

  const spinnerRef = useRef<HTMLDivElement>(null);
  const mobileDragStartYRef = useRef(0);
  const mobileDragStartHeightRef = useRef(300);
  const { tick, win } = useAudio();

  function readDescriptions(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(window.localStorage.getItem("taskspin_descriptions") || "{}"); } catch { return {}; }
  }
  function writeDescriptions(value: Record<string, string>) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("taskspin_descriptions", JSON.stringify(value));
  }
  function mergeDescriptions(rows: Task[]) {
    const descriptions = readDescriptions();
    return rows.map((task) => ({ ...task, description: task.description ?? descriptions[task.id] ?? "" }));
  }

  function selectSpin(spinId: string) {
    setActiveSpinId(spinId);
    const nextTitle = titlesBySpin[spinId] || DEFAULT_PAGE_TITLE;
    setPageTitle(nextTitle); setDraftPageTitle(nextTitle);
    setHistory(historyBySpin[spinId] || []);
    setRecentSpinIds((current) => [spinId, ...current.filter((id) => id !== spinId)].slice(0, 6));
  }

  function selectFolder(folderId: string) {
    setActiveFolderId(folderId);
    const folderSpins = spinsByFolder[folderId] || [];
    if (folderSpins.length > 0) selectSpin(folderSpins[0].id);
  }

  function createFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const folderId = crypto.randomUUID();
    const firstSpinId = crypto.randomUUID();
    setSpinSpaces((current) => [...current, { id: folderId, name }]);
    setSpinsByFolder((current) => ({ ...current, [folderId]: [{ id: firstSpinId, name: "Main spin" }] }));
    setTaskIdsBySpin((current) => ({ ...current, [firstSpinId]: [] }));
    setTitlesBySpin((current) => ({ ...current, [firstSpinId]: "Main spin" }));
    setHistoryBySpin((current) => ({ ...current, [firstSpinId]: [] }));
    setNewFolderName("");
    setShowNewFolderInput(false);
  }

  function createSpinList(folderId: string, name: string) {
    if (!name.trim()) return;
    const id = crypto.randomUUID();
    setSpinsByFolder((current) => ({ ...current, [folderId]: [...(current[folderId] || []), { id, name: name.trim() }] }));
    setTitlesBySpin((current) => ({ ...current, [id]: name.trim() }));
    setTaskIdsBySpin((current) => ({ ...current, [id]: [] }));
    setHistoryBySpin((current) => ({ ...current, [id]: [] }));
  }

  function removeSpinList(folderId: string, spinId: string) {
    const folderSpins = spinsByFolder[folderId] || [];
    if (folderSpins.length <= 1) return;
    setSpinsByFolder((current) => ({ ...current, [folderId]: (current[folderId] || []).filter((spin) => spin.id !== spinId) }));
    setTitlesBySpin((current) => { const next = { ...current }; delete next[spinId]; return next; });
    setTaskIdsBySpin((current) => { const next = { ...current }; delete next[spinId]; return next; });
    setHistoryBySpin((current) => { const next = { ...current }; delete next[spinId]; return next; });
    setRecentSpinIds((current) => current.filter((id) => id !== spinId));
    if (activeSpinId === spinId) {
      const remaining = folderSpins.filter((spin) => spin.id !== spinId);
      if (remaining[0]) selectSpin(remaining[0].id);
    }
  }

  function renameSpinList(folderId: string, spinId: string, newName: string) {
    setSpinsByFolder((current) => ({ ...current, [folderId]: (current[folderId] || []).map((spin) => spin.id === spinId ? { ...spin, name: newName } : spin) }));
    setTitlesBySpin((current) => ({ ...current, [spinId]: newName }));
    if (activeSpinId === spinId) { setPageTitle(newName); setDraftPageTitle(newName); }
  }

  function removeFolder(id: string) {
    if (id === DEFAULT_FOLDER_ID) return;
    const spinIdsToDelete = (spinsByFolder[id] || []).map((spin) => spin.id);
    setSpinSpaces((current) => current.filter((spin) => spin.id !== id));
    setSpinsByFolder((current) => { const next = { ...current }; delete next[id]; return next; });
    setTaskIdsBySpin((current) => { const next = { ...current }; spinIdsToDelete.forEach((spinId) => delete next[spinId]); return next; });
    setTitlesBySpin((current) => { const next = { ...current }; spinIdsToDelete.forEach((spinId) => delete next[spinId]); return next; });
    setHistoryBySpin((current) => { const next = { ...current }; spinIdsToDelete.forEach((spinId) => delete next[spinId]); return next; });
    if (activeFolderId === id) selectFolder(DEFAULT_FOLDER_ID);
    setRecentSpinIds((current) => current.filter((spinId) => !spinIdsToDelete.includes(spinId)));
  }

  async function deleteEverything() {
    const accepted = typeof window !== "undefined" && window.confirm("Delete all spins, tasks, and history?");
    if (!accepted) return;
    if (currentUserId) await supabase.from("tasks").delete().eq("user_id", currentUserId);
    setTasks([]); setSpinSpaces([{ id: DEFAULT_FOLDER_ID, name: "Main folder" }]);
    setSpinsByFolder({ [DEFAULT_FOLDER_ID]: [{ id: DEFAULT_SPIN_ID, name: "Main spin" }] });
    setTaskIdsBySpin({ [DEFAULT_SPIN_ID]: [] }); setTitlesBySpin({ [DEFAULT_SPIN_ID]: DEFAULT_PAGE_TITLE });
    setHistoryBySpin({ [DEFAULT_SPIN_ID]: [] }); setActiveFolderId(DEFAULT_FOLDER_ID); setActiveSpinId(DEFAULT_SPIN_ID);
    setPageTitle(DEFAULT_PAGE_TITLE); setDraftPageTitle(DEFAULT_PAGE_TITLE); setHistory([]); setRecentSpinIds([DEFAULT_SPIN_ID]);
    if (typeof window !== "undefined") {
      ["taskspin_spaces", "taskspin_spins_by_folder", "taskspin_active_space", "taskspin_active_folder",
        "taskspin_titles_by_space", "taskspin_task_ids_by_space", "taskspin_histories_by_space", "taskspin_descriptions"].forEach((k) => window.localStorage.removeItem(k));
    }
  }

  async function addTask(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newTask.trim()) return;
    if (!currentUserId) return;
    const { data, error } = await supabase.from("tasks").insert([{ title: newTask.trim(), user_id: currentUserId }]).select().single();
    if (!error && data) {
      setNewTask("");
      setTasks((current) => [...current, { ...data, description: data.description ?? "" }]);
      setTaskIdsBySpin((current) => ({ ...current, [activeSpinId]: [...(current[activeSpinId] || []), data.id] }));
    }
  }

  async function deleteTask(id: string) {
    if (!currentUserId) return;
    const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", currentUserId);
    if (!error) {
      const descriptions = readDescriptions(); delete descriptions[id]; writeDescriptions(descriptions);
      setTasks((current) => current.filter((task) => task.id !== id));
      setTaskIdsBySpin((current) => { const next: Record<string, string[]> = {}; Object.keys(current).forEach((spinId) => { next[spinId] = (current[spinId] || []).filter((taskId) => taskId !== id); }); return next; });
      setWinner(null);
      setHistory((h) => h.filter((item) => item.taskId !== id));
    }
  }

  async function saveTaskEdits(id: string) {
    const title = editingTitle.trim(); if (!title) return;
    const description = editingDescription.trim();
    if (!currentUserId) return;
    const { error } = await supabase.from("tasks").update({ title }).eq("id", id).eq("user_id", currentUserId);
    if (!error) {
      const descriptions = readDescriptions();
      if (description) descriptions[id] = description; else delete descriptions[id];
      writeDescriptions(descriptions);
      await supabase.from("tasks").update({ description }).eq("id", id).eq("user_id", currentUserId);
      setTasks((current) => current.map((task) => (task.id === id ? { ...task, title, description } : task)));
      setHistory((current) => current.map((record) => (record.taskId === id ? { ...record, title, description } : record)));
      if (winner?.id === id) setWinner({ ...winner, title, description });
      setEditingTaskId(null);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function startEditingTask(task: Task) { setEditingTaskId(task.id); setEditingTitle(task.title); setEditingDescription(task.description || ""); }
  function deleteHistoryItem(id: string) { setHistory((current) => current.filter((item) => item.id !== id)); }

  const visibleTaskIds = taskIdsBySpin[activeSpinId] || [];
  const visibleTasks = tasks.filter((task) => visibleTaskIds.includes(task.id));
  const spinsInActiveFolder = spinsByFolder[activeFolderId] || [];
  const activeFolderName = spinSpaces.find((s) => s.id === activeFolderId)?.name || "Folder";
  const activeSpinName = titlesBySpin[activeSpinId] || "Spin";
  const recentSpins = recentSpinIds.map((id) => {
    const folder = spinSpaces.find((space) => (spinsByFolder[space.id] || []).some((spin) => spin.id === id));
    return folder ? { id, name: titlesBySpin[id] || "Untitled spin", folderName: folder.name } : null;
  }).filter((spin): spin is { id: string; name: string; folderName: string } => Boolean(spin));

  const spin = useCallback(() => {
    if (visibleTasks.length === 0 || isSpinning) return;
    const startIdx = selectedIndex ?? 0;
    if (spinnerRef.current) spinnerRef.current.style.transform = `translateY(-${startIdx * ITEM_H}px)`;
    setIsSpinning(true); setWinIdx(null); setWinner(null);
    const target = Math.floor(Math.random() * visibleTasks.length);
    const finalIdx = startIdx + 50 + (visibleTasks.length - ((startIdx + 50) % visibleTasks.length)) + target;
    let lastTick = startIdx;
    animate(startIdx * ITEM_H, finalIdx * ITEM_H, {
      type: "tween", duration: 3.8, ease: [0.08, 0.94, 0.2, 1],
      onUpdate: (v) => {
        if (spinnerRef.current) spinnerRef.current.style.transform = `translateY(-${v}px)`;
        const cur = Math.floor(v / ITEM_H);
        if (cur > lastTick) { lastTick = cur; tick(); }
      },
      onComplete: () => {
        setIsSpinning(false); setSelectedIndex(target); setWinIdx(finalIdx);
        setTimeout(() => {
          win(); fireConfetti();
          const w = visibleTasks[target];
          setWinner(w);
          setHistory((h) => [{ id: crypto.randomUUID(), taskId: w.id, title: w.title, description: w.description || "", ts: Date.now() }, ...h].slice(0, 12));
        }, 200);
      },
    });
  }, [visibleTasks, isSpinning, selectedIndex, tick, win]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        router.replace("/login");
        setIsAuthLoading(false);
        return;
      }
      setCurrentUserId(data.user.id);
      void (async () => {
        const { data: rows } = await supabase.from("tasks").select("*").eq("user_id", data.user.id).order("created_at", { ascending: true });
        if (!rows) return;
        const merged = mergeDescriptions(rows);
        setTasks(merged);
        setTaskIdsBySpin((current) => {
          if ((current[DEFAULT_SPIN_ID] || []).length > 0) return current;
          return { ...current, [DEFAULT_SPIN_ID]: merged.map((task) => task.id) };
        });
      })();
      setIsAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        setCurrentUserId(null);
        router.replace("/login");
        return;
      }
      setCurrentUserId(session.user.id);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedSpaces = window.localStorage.getItem("taskspin_spaces");
      const savedActive = window.localStorage.getItem("taskspin_active_space");
      const savedActiveFolder = window.localStorage.getItem("taskspin_active_folder");
      const savedTitles = window.localStorage.getItem("taskspin_titles_by_space");
      const savedTaskIds = window.localStorage.getItem("taskspin_task_ids_by_space");
      const savedHistories = window.localStorage.getItem("taskspin_histories_by_space");
      const savedSpinsByFolder = window.localStorage.getItem("taskspin_spins_by_folder");
      const savedRecent = window.localStorage.getItem("taskspin_recent_spaces");
      const nextSpaces: SpinSpace[] = savedSpaces ? JSON.parse(savedSpaces) : [{ id: DEFAULT_FOLDER_ID, name: "Main folder" }];
      const nextSpinsByFolder: Record<string, SpinSpace[]> = savedSpinsByFolder ? JSON.parse(savedSpinsByFolder) : nextSpaces.reduce((acc, folder, index) => { const derivedSpinId = index === 0 ? DEFAULT_SPIN_ID : crypto.randomUUID(); acc[folder.id] = [{ id: derivedSpinId, name: folder.name === "Main folder" ? "Main spin" : folder.name }]; return acc; }, {} as Record<string, SpinSpace[]>);
      const nextTitles: Record<string, string> = savedTitles ? JSON.parse(savedTitles) : { [DEFAULT_SPIN_ID]: DEFAULT_PAGE_TITLE };
      const nextTaskIds: Record<string, string[]> = savedTaskIds ? JSON.parse(savedTaskIds) : { [DEFAULT_SPIN_ID]: [] };
      const nextHistories: Record<string, SpinRecord[]> = savedHistories ? JSON.parse(savedHistories) : { [DEFAULT_SPIN_ID]: [] };
      const nextRecent: string[] = savedRecent ? JSON.parse(savedRecent) : [DEFAULT_SPIN_ID];
      const fallbackSpin = nextSpinsByFolder[nextSpaces[0]?.id]?.[0]?.id || DEFAULT_SPIN_ID;
      const nextActive = savedActive && nextTitles[savedActive] ? savedActive : fallbackSpin;
      const nextActiveFolder = savedActiveFolder && nextSpaces.some((space) => space.id === savedActiveFolder) ? savedActiveFolder : nextSpaces[0]?.id || DEFAULT_FOLDER_ID;
      setSpinSpaces(nextSpaces); setSpinsByFolder(nextSpinsByFolder); setTitlesBySpin(nextTitles); setTaskIdsBySpin(nextTaskIds);
      setHistoryBySpin(nextHistories); setActiveFolderId(nextActiveFolder); setActiveSpinId(nextActive);
      const nextTitle = nextTitles[nextActive] || DEFAULT_PAGE_TITLE;
      setPageTitle(nextTitle); setDraftPageTitle(nextTitle);
      setHistory(nextHistories[nextActive] || []);
      setRecentSpinIds(nextRecent.filter((id) => Boolean(nextTitles[id])));
    } catch {}
  }, []);
  useEffect(() => { setHistoryBySpin((current) => ({ ...current, [activeSpinId]: history })); }, [history, activeSpinId]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("taskspin_spaces", JSON.stringify(spinSpaces));
    window.localStorage.setItem("taskspin_spins_by_folder", JSON.stringify(spinsByFolder));
    window.localStorage.setItem("taskspin_active_space", activeSpinId);
    window.localStorage.setItem("taskspin_active_folder", activeFolderId);
    window.localStorage.setItem("taskspin_titles_by_space", JSON.stringify(titlesBySpin));
    window.localStorage.setItem("taskspin_task_ids_by_space", JSON.stringify(taskIdsBySpin));
    window.localStorage.setItem("taskspin_histories_by_space", JSON.stringify(historyBySpin));
    window.localStorage.setItem("taskspin_recent_spaces", JSON.stringify(recentSpinIds));
  }, [spinSpaces, spinsByFolder, activeSpinId, activeFolderId, titlesBySpin, taskIdsBySpin, historyBySpin, recentSpinIds]);
  useEffect(() => { const fn = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") spin(); }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); }, [spin]);
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = viewportWidth <= 640;
  const isTablet = viewportWidth <= 1024;
  const isSmallMobile = viewportWidth <= 480;
  const headerHeight = isMobile ? 52 : 48;
  const mobilePanelMinHeight = isSmallMobile ? 170 : 210;
  const mobilePanelMaxHeight = Math.max(mobilePanelMinHeight + 40, viewportHeight - headerHeight - 110);
  const clampedMobilePanelHeight = Math.min(mobilePanelMaxHeight, Math.max(mobilePanelMinHeight, mobilePanelHeight));

  const startMobilePanelDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    e.preventDefault();
    mobileDragStartYRef.current = e.clientY;
    mobileDragStartHeightRef.current = clampedMobilePanelHeight;

    const onMove = (event: PointerEvent) => {
      const delta = mobileDragStartYRef.current - event.clientY;
      const next = Math.min(mobilePanelMaxHeight, Math.max(mobilePanelMinHeight, mobileDragStartHeightRef.current + delta));
      setMobilePanelHeight(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [isMobile, clampedMobilePanelHeight, mobilePanelMinHeight, mobilePanelMaxHeight]);

  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(55,53,47,0.4)" };

  // ── Spin page styles (unchanged) ────────────────────────────────────────────
  const mobileBottomInset = Math.round(clampedMobilePanelHeight) + 28;
  const containerStyle: React.CSSProperties = { width: "100%", maxWidth: 840, margin: "0 auto", padding: isSmallMobile ? `20px 12px ${mobileBottomInset}px` : isMobile ? `28px 16px ${mobileBottomInset}px` : isTablet ? "40px 32px 56px" : "52px 56px 80px", boxSizing: "border-box" };
  const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: isTablet ? "1fr" : "minmax(0, 1fr) 280px", gap: isSmallMobile ? 24 : isTablet ? 32 : 40, alignItems: "start" };
  const titleStyle: React.CSSProperties = { fontSize: isSmallMobile ? 28 : isMobile ? 30 : 32, fontWeight: 700, letterSpacing: "-0.025em", color: "#37352f", margin: 0 };
  const spinButtonStyle: React.CSSProperties = { height: isMobile ? 46 : 42, borderRadius: 6, border: "none", background: visibleTasks.length === 0 || isSpinning ? "#f7f6f3" : "#37352f", color: visibleTasks.length === 0 || isSpinning ? "rgba(55,53,47,0.3)" : "#ffffff", fontSize: isMobile ? 16 : 15, fontWeight: 500, cursor: visibleTasks.length === 0 || isSpinning ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 120ms ease", fontFamily: "inherit", width: "100%" };
  const formStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: isMobile ? "10px 12px" : "9px 10px", borderRadius: 8, border: "1px solid #e9e9e7", background: "#ffffff", transition: "border-color 120ms, box-shadow 120ms" };
  const listStyle: React.CSSProperties = { display: "flex", flexDirection: "column", maxHeight: isTablet ? 360 : 420, overflowY: "auto" };
  const mobileItemsListStyle: React.CSSProperties = { flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" };
  const sidebarStyle: React.CSSProperties = { width: isMobile ? "calc(100% - 24px)" : isTablet ? "100%" : 260, height: isMobile ? clampedMobilePanelHeight : undefined, maxHeight: isMobile ? clampedMobilePanelHeight : isTablet ? 260 : `calc(100vh - ${headerHeight}px)`, borderTop: isMobile ? "1px solid #e9e9e7" : "none", borderRight: isMobile ? "1px solid #e9e9e7" : isTablet ? "none" : "1px solid #e9e9e7", borderBottom: isMobile ? "1px solid #e9e9e7" : isTablet ? "1px solid #e9e9e7" : "none", borderLeft: isMobile ? "1px solid #e9e9e7" : "none", background: "#fbfbfa", display: "flex", flexDirection: "column", padding: isSmallMobile ? "12px 10px" : isMobile ? "14px 12px" : "16px 10px", flexShrink: 0, position: isMobile ? "fixed" : isTablet ? "relative" : "sticky", left: isMobile ? 12 : 0, right: isMobile ? 12 : undefined, bottom: isMobile ? 12 : undefined, top: isMobile ? undefined : isTablet ? undefined : headerHeight, zIndex: isMobile ? 30 : 10, borderRadius: isMobile ? 16 : 0, boxShadow: isMobile ? "0 10px 30px rgba(15,15,15,0.08)" : "none", overflow: "hidden" };

  if (isAuthLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fff", color: "rgba(55,53,47,0.55)", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" }}>
        Checking session...
      </div>
    );
  }
  if (!currentUserId) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#ffffff", color: "#37352f", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" }}>

      {/* ══════════════════════════════════════════════
          IMPROVED NAVBAR
      ══════════════════════════════════════════════ */}
      <header style={{ height: headerHeight, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 14px" : "0 20px", borderBottom: "1px solid #e9e9e7", position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", flexShrink: 0 }}>

        {/* LEFT: Logo + breadcrumb nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, minWidth: 0, flex: 1 }}>

          {/* Logo mark */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginRight: 16, flexShrink: 0 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#37352f", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap style={{ width: 13, height: 13, color: "#fff" }} />
            </div>
            {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: "#37352f", letterSpacing: "-0.01em" }}>TaskSpin</span>}
          </div>

          {!showDashboard ? (
            <>
              {/* Divider */}
              <div style={{ width: 1, height: 16, background: "#e9e9e7", marginRight: 16, flexShrink: 0 }} />

              {/* Breadcrumb: Folder */}
              <button
                onClick={() => setShowDashboard(true)}
                style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "transparent", cursor: "pointer", padding: "4px 8px", borderRadius: 6, color: "rgba(55,53,47,0.55)", fontSize: 13, fontWeight: 400, transition: "all 100ms", flexShrink: 0, fontFamily: "inherit" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f7f6f3"; e.currentTarget.style.color = "#37352f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(55,53,47,0.55)"; }}
              >
                <FolderOpen style={{ width: 13, height: 13, flexShrink: 0 }} />
                {!isSmallMobile && <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeFolderName}</span>}
              </button>

              <ChevronRight style={{ width: 13, height: 13, color: "#d4d0cb", flexShrink: 0 }} />

              {/* Breadcrumb: Spin selector */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <select
                  value={activeSpinId}
                  onChange={(e) => selectSpin(e.target.value)}
                  style={{ appearance: "none", WebkitAppearance: "none", border: "none", background: "transparent", cursor: "pointer", padding: "4px 20px 4px 8px", borderRadius: 6, color: "#37352f", fontSize: 13, fontWeight: 500, fontFamily: "inherit", maxWidth: isMobile ? 110 : 160, overflow: "hidden", textOverflow: "ellipsis", outline: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f6f3")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {spinsInActiveFolder.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronRight style={{ width: 10, height: 10, color: "#a09d98", position: "absolute", right: 4, top: "50%", transform: "translateY(-50%) rotate(90deg)", pointerEvents: "none" }} />
              </div>

              {/* Change folder / switch spin quick action */}
              {!isMobile && (
                <button
                  onClick={() => { const folder = spinSpaces.find((s) => s.id === activeFolderId); if (folder) setSelectedFolderForDetail(activeFolderId); }}
                  style={{ marginLeft: 4, border: "1px solid #e9e9e7", background: "#fff", cursor: "pointer", padding: "3px 8px", borderRadius: 6, color: "rgba(55,53,47,0.4)", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, transition: "all 100ms", fontFamily: "inherit" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f7f6f3"; e.currentTarget.style.color = "#37352f"; e.currentTarget.style.borderColor = "#d4d0cb"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "rgba(55,53,47,0.4)"; e.currentTarget.style.borderColor = "#e9e9e7"; }}
                >
                  <Layers style={{ width: 11, height: 11 }} />
                  {spinsInActiveFolder.length} list{spinsInActiveFolder.length !== 1 ? "s" : ""}
                </button>
              )}
            </>
          ) : (
            <>
              <div style={{ width: 1, height: 16, background: "#e9e9e7", marginRight: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "#37352f" }}>Dashboard</span>
            </>
          )}
        </div>

        {/* RIGHT: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {showDashboard ? (
            <button
              onClick={() => setShowDashboard(false)}
              style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #e9e9e7", background: "#fff", cursor: "pointer", padding: "6px 11px", borderRadius: 8, color: "#37352f", fontSize: 13, fontWeight: 500, fontFamily: "inherit", transition: "all 100ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f6f3")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              <ArrowLeft style={{ width: 13, height: 13 }} />
              {!isMobile && "Back to spin"}
            </button>
          ) : (
            <button
              onClick={() => setShowDashboard(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #e9e9e7", background: "#fff", cursor: "pointer", padding: "6px 11px", borderRadius: 8, color: "rgba(55,53,47,0.65)", fontSize: 13, fontWeight: 400, fontFamily: "inherit", transition: "all 100ms" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f7f6f3"; e.currentTarget.style.color = "#37352f"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "rgba(55,53,47,0.65)"; }}
            >
              <LayoutGrid style={{ width: 13, height: 13 }} />
              {!isMobile && "Dashboard"}
            </button>
          )}

          {/* Account button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowSettings((v) => !v)}
              style={{ border: "1px solid #e9e9e7", borderRadius: "50%", background: "#fff", width: 32, height: 32, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "rgba(55,53,47,0.6)", transition: "all 100ms" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f7f6f3"; e.currentTarget.style.color = "#37352f"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "rgba(55,53,47,0.6)"; }}
            >
              <UserCircle2 style={{ width: 17, height: 17 }} />
            </button>
            <AnimatePresence>
              {showSettings && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } }}
                  style={{ position: "absolute", right: 0, top: 38, width: 176, background: "#fff", border: "1px solid #e9e9e7", borderRadius: 10, boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.08)", padding: "5px", zIndex: 30 }}
                >
                  {[
                    { icon: <LayoutGrid style={{ width: 13, height: 13 }} />, label: "Dashboard", action: () => { setShowDashboard(true); setShowSettings(false); } },
                    { icon: <Settings style={{ width: 13, height: 13 }} />, label: "Settings", action: () => setShowSettings(false) },
                    { icon: <LogOut style={{ width: 13, height: 13 }} />, label: "Sign out", action: () => { setShowSettings(false); void handleSignOut(); } },
                  ].map((item) => (
                    <button key={item.label} onClick={item.action}
                      style={{ width: "100%", border: "none", background: "transparent", color: "#37352f", textAlign: "left", padding: "8px 10px", borderRadius: 7, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f6f3")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ color: "rgba(55,53,47,0.5)" }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          SPIN PAGE (unchanged)
      ══════════════════════════════════════════════ */}
      {!showDashboard && (
        <div style={{ display: "flex", flex: 1, flexDirection: isTablet ? "column" : "row", minWidth: 0 }}>
          {/* Sidebar */}
          <aside style={sidebarStyle}>
            {isMobile ? (
              <>
                <div
                  onPointerDown={startMobilePanelDrag}
                  style={{ display: "flex", justifyContent: "center", padding: "2px 0 8px", cursor: "ns-resize", touchAction: "none" }}
                  title="Drag to resize"
                >
                  <div style={{ width: 44, height: 5, borderRadius: 999, background: "rgba(55,53,47,0.2)" }} />
                </div>
                <div style={{ padding: "2px 4px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderBottom: "1px solid #ecebe8", marginBottom: 8 }}>
                  <span style={labelStyle}>Items</span>
                  {visibleTasks.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(55,53,47,0.42)", background: "#f3f2ef", borderRadius: 999, padding: "3px 8px" }}>{visibleTasks.length}</span>}
                </div>
                <form onSubmit={addTask} style={formStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(55,53,47,0.22)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(55,53,47,0.04)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#e9e9e7"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <Plus style={{ width: 14, height: 14, color: "rgba(55,53,47,0.3)", flexShrink: 0 }} />
                  <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="New item…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, color: "#37352f", fontFamily: "inherit", minWidth: 0 }} />
                  <button type="submit" disabled={!newTask.trim()}
                    style={{ border: "none", background: newTask.trim() ? "rgba(35,131,226,0.09)" : "#f7f6f3", color: newTask.trim() ? "#2383e2" : "rgba(55,53,47,0.35)", borderRadius: 6, fontSize: 13, fontWeight: 600, padding: "8px 12px", cursor: newTask.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "background 120ms", flexShrink: 0 }}
                  >Add</button>
                </form>
                <div style={{ ...mobileItemsListStyle, marginTop: 8 }}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {visibleTasks.map((task) => (
                      <motion.div key={task.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.16, ease: "easeOut" } }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="group"
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 8px", borderRadius: 8, gap: 10 }}
                      >
                        <div style={{ minWidth: 0, flex: 1, fontSize: 14, color: "#37352f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                          {task.title}
                        </div>
                        <button onClick={() => deleteTask(task.id)}
                          style={{ border: "none", background: "none", cursor: "pointer", padding: 6, borderRadius: 4, color: "rgba(55,53,47,0.3)", display: "flex", alignItems: "center", flexShrink: 0 }}
                        >
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {visibleTasks.length === 0 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "18px 12px", border: "1px dashed #e9e9e7", borderRadius: 5, color: "rgba(55,53,47,0.3)", textAlign: "center" }}>
                      <Hash style={{ width: 16, height: 16, opacity: 0.7 }} />
                      <span style={{ fontSize: 14 }}>No items yet</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: "0 8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ ...labelStyle, marginBottom: 0, display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock style={{ width: 12, height: 12 }} />
                    Recent picks
                  </div>
                  {history.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(55,53,47,0.42)", background: "#f3f2ef", borderRadius: 999, padding: "3px 8px" }}>{history.length}</span>}
                </div>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                  <AnimatePresence mode="popLayout">
                    {history.map((r) => <HistoryItem key={r.id} record={r} onDelete={deleteHistoryItem} isMobile={isMobile} />)}
                  </AnimatePresence>
                  {history.length === 0 && <p style={{ fontSize: 13, color: "rgba(55,53,47,0.25)", padding: "6px 8px", fontStyle: "italic" }}>No spins yet</p>}
                </div>
              </>
            )}
          </aside>

          {/* Main canvas */}
          <main style={{ flex: 1, overflowY: "auto" }}>
            <div style={containerStyle}>
              {/* Title */}
              <div style={{ marginBottom: 40 }}>
                {isEditingPageCopy ? (
                  <input type="text" value={draftPageTitle} onChange={(e) => { const value = e.target.value; setDraftPageTitle(value); const nextTitle = value || DEFAULT_PAGE_TITLE; setPageTitle(nextTitle); setTitlesBySpin((current) => ({ ...current, [activeSpinId]: nextTitle })); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const nextTitle = draftPageTitle.trim() || DEFAULT_PAGE_TITLE; setDraftPageTitle(nextTitle); setPageTitle(nextTitle); setTitlesBySpin((current) => ({ ...current, [activeSpinId]: nextTitle })); setIsEditingPageCopy(false); } }}
                    onBlur={() => { const nextTitle = draftPageTitle.trim() || DEFAULT_PAGE_TITLE; setDraftPageTitle(nextTitle); setPageTitle(nextTitle); setTitlesBySpin((current) => ({ ...current, [activeSpinId]: nextTitle })); setIsEditingPageCopy(false); }}
                    style={{ ...titleStyle, border: "1px solid #e1dfdb", borderRadius: 8, padding: "8px 12px", outline: "none", background: "#fff", width: "100%" }}
                    autoFocus
                  />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h1 style={{ ...titleStyle, cursor: "text" }} onDoubleClick={() => { setDraftPageTitle(pageTitle); setIsEditingPageCopy(true); }}>{pageTitle}</h1>
                    <button onClick={() => setIsEditingPageCopy(true)} style={{ width: 28, height: 28, border: "none", background: "transparent", color: "rgba(55,53,47,0.45)", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f6f3")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Pencil style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                )}
                <div style={{ height: 1, background: "#e9e9e7", marginTop: 24 }} />
              </div>

              <div style={gridStyle}>
                {/* Spinner */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                  <span style={labelStyle}>Spin to decide</span>
                  <SpinnerReel tasks={visibleTasks} spinnerRef={spinnerRef} isSpinning={isSpinning} winningItemIndex={winIdx} />
                  <button onClick={spin} disabled={visibleTasks.length === 0 || isSpinning} style={spinButtonStyle}
                    onMouseEnter={(e) => { if (visibleTasks.length > 0 && !isSpinning) e.currentTarget.style.background = "#2d2c27"; }}
                    onMouseLeave={(e) => { if (visibleTasks.length > 0 && !isSpinning) e.currentTarget.style.background = "#37352f"; }}
                  >
                    <Sparkles style={{ width: isMobile ? 16 : 15, height: isMobile ? 16 : 15 }} className={isSpinning ? "animate-spin" : ""} />
                    {isSpinning ? "Spinning…" : "Spin"}
                  </button>
                  <p style={{ fontSize: isMobile ? 14 : 13, color: "rgba(55,53,47,0.28)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
                    Type <kbd style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: "#f7f6f3", border: "1px solid #e0deda", color: "rgba(55,53,47,0.5)", fontFamily: "inherit", margin: "0 4px" }}>⌘ Enter</kbd> to spin
                  </p>
                </div>

                {/* Items */}
                {!isMobile && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={labelStyle}>Items</span>
                    {visibleTasks.length > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(55,53,47,0.4)", background: "#f7f6f3", border: "1px solid #e9e9e7", borderRadius: 3, padding: "2px 7px" }}>{visibleTasks.length}</span>}
                  </div>
                  <form onSubmit={addTask} style={formStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(55,53,47,0.22)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(55,53,47,0.04)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#e9e9e7"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <Plus style={{ width: 14, height: 14, color: "rgba(55,53,47,0.3)", flexShrink: 0 }} />
                    <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="New item…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: isMobile ? 15 : 14, color: "#37352f", fontFamily: "inherit", minWidth: 0 }} />
                    <button type="submit" disabled={!newTask.trim()}
                      style={{ border: "none", background: newTask.trim() ? "rgba(35,131,226,0.09)" : "#f7f6f3", color: newTask.trim() ? "#2383e2" : "rgba(55,53,47,0.35)", borderRadius: 6, fontSize: isMobile ? 13 : 12, fontWeight: 600, padding: isMobile ? "8px 12px" : "7px 11px", cursor: newTask.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "background 120ms", flexShrink: 0 }}
                      onMouseEnter={(e) => { if (newTask.trim()) e.currentTarget.style.background = "rgba(35,131,226,0.16)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = newTask.trim() ? "rgba(35,131,226,0.09)" : "#f7f6f3"; }}
                    >Add</button>
                  </form>
                  <div style={listStyle}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {visibleTasks.map((task) => (
                        <motion.div key={task.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.16, ease: "easeOut" } }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="group"
                          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: isMobile ? "12px 12px" : "10px 12px", borderRadius: 8, cursor: "default", gap: 10 }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f6f3")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, flex: 1 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(55,53,47,0.18)", flexShrink: 0, marginTop: 8 }} />
                            {editingTaskId === task.id ? (
                              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                                <input type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} style={{ width: "100%", border: "1px solid #e1dfdb", outline: "none", background: "#fff", fontSize: 14, color: "#37352f", fontFamily: "inherit", borderRadius: 6, padding: "8px 10px" }} />
                                <textarea value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} rows={2} placeholder="Add a description…" style={{ width: "100%", resize: "vertical", border: "1px solid #e1dfdb", outline: "none", background: "#fff", fontSize: 13, color: "#37352f", fontFamily: "inherit", borderRadius: 6, padding: "8px 10px", lineHeight: 1.45 }} />
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button onClick={() => saveTaskEdits(task.id)} style={{ border: "none", background: "#37352f", color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, padding: "7px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><Check style={{ width: 12, height: 12 }} />Save</button>
                                  <button onClick={() => setEditingTaskId(null)} style={{ border: "1px solid #e1dfdb", background: "#fff", color: "rgba(55,53,47,0.7)", borderRadius: 6, fontSize: 12, fontWeight: 600, padding: "7px 10px", cursor: "pointer" }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: isMobile ? 15 : 14, color: "#37352f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{task.title}</div>
                                {task.description ? <div style={{ fontSize: 12, color: "rgba(55,53,47,0.52)", marginTop: 4, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2 as any, WebkitBoxOrient: "vertical" as any }}>{task.description}</div> : null}
                              </div>
                            )}
                          </div>
                          {editingTaskId !== task.id && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 8 }}>
                              <button onClick={() => startEditingTask(task)} className="opacity-0 group-hover:opacity-100"
                                style={{ border: "none", background: "none", cursor: "pointer", padding: isMobile ? 8 : 6, borderRadius: 4, color: "rgba(55,53,47,0.32)", display: "flex", alignItems: "center", transition: "all 100ms", opacity: isTablet ? 1 : undefined }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#ecebe8"; e.currentTarget.style.color = "#37352f"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(55,53,47,0.32)"; }}
                              >
                                <Pencil style={{ width: isMobile ? 14 : 13, height: isMobile ? 14 : 13 }} />
                              </button>
                              <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100"
                                style={{ border: "none", background: "none", cursor: "pointer", padding: isMobile ? 8 : 6, borderRadius: 4, color: "rgba(55,53,47,0.3)", display: "flex", alignItems: "center", transition: "all 100ms", opacity: isTablet ? 1 : undefined }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(235,87,87,0.08)"; e.currentTarget.style.color = "rgb(235,87,87)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(55,53,47,0.3)"; }}
                              >
                                <Trash2 style={{ width: isMobile ? 14 : 13, height: isMobile ? 14 : 13 }} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {visibleTasks.length === 0 && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: isMobile ? "28px 12px" : "32px 0", border: "1px dashed #e9e9e7", borderRadius: 5, color: "rgba(55,53,47,0.3)", textAlign: "center" }}>
                        <Hash style={{ width: 16, height: 16, opacity: 0.7 }} />
                        <span style={{ fontSize: isMobile ? 15 : 14 }}>No items yet</span>
                        <span style={{ fontSize: isMobile ? 14 : 13, color: "rgba(55,53,47,0.22)" }}>Add something above</span>
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>

              {isMobile && (
                <div style={{ marginTop: 28 }}>
                  <div style={{ padding: "0 2px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ ...labelStyle, marginBottom: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock style={{ width: 12, height: 12 }} />
                      Recent picks
                    </div>
                    {history.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(55,53,47,0.42)", background: "#f3f2ef", borderRadius: 999, padding: "3px 8px" }}>{history.length}</span>}
                  </div>
                  <div style={{ background: "#fbfbfa", border: "1px solid #e9e9e7", borderRadius: 12, padding: "8px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
                    <AnimatePresence mode="popLayout">
                      {history.map((r) => <HistoryItem key={r.id} record={r} onDelete={deleteHistoryItem} isMobile={isMobile} />)}
                    </AnimatePresence>
                    {history.length === 0 && <p style={{ fontSize: 13, color: "rgba(55,53,47,0.25)", padding: "10px 8px", fontStyle: "italic", margin: 0 }}>No spins yet</p>}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          IMPROVED DASHBOARD
      ══════════════════════════════════════════════ */}
      {showDashboard && (
        <main style={{ flex: 1, overflowY: "auto", background: "#f8f8f6" }}>
          <div style={{ maxWidth: 1060, margin: "0 auto", padding: isMobile ? "24px 16px 40px" : "36px 40px 60px" }}>

            {/* Dashboard header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 700, letterSpacing: "-0.02em", color: "#2f2d29" }}>Your Folders</h2>
                <p style={{ margin: "5px 0 0", color: "rgba(55,53,47,0.5)", fontSize: 13, lineHeight: 1.5 }}>Organize your spin lists into folders. Click a folder to manage its spin lists.</p>
              </div>
              <button
                onClick={deleteEverything}
                style={{ flexShrink: 0, border: "1px solid #f0d5d5", background: "#fff", borderRadius: 8, padding: "7px 12px", cursor: "pointer", color: "rgba(200,60,60,0.85)", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "all 120ms" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(235,87,87,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                <Trash2 style={{ width: 12, height: 12 }} />
                {!isMobile && "Delete everything"}
              </button>
            </div>

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#fff", border: "1px solid #e1dfdb", borderRadius: 10, padding: "9px 12px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <Search style={{ width: 14, height: 14, color: "rgba(55,53,47,0.4)", flexShrink: 0 }} />
              <input value={spinSearch} onChange={(e) => setSpinSearch(e.target.value)} placeholder="Search folders and spin lists…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#37352f", fontFamily: "inherit" }} />
              {spinSearch && <button onClick={() => setSpinSearch("")} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2, color: "rgba(55,53,47,0.4)", display: "flex" }}><X style={{ width: 13, height: 13 }} /></button>}
            </div>

            {/* Folder grid */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fill, minmax(140px, 180px))", gap: 12, marginBottom: 28 }}>
              {spinSpaces
                .filter((s) => !spinSearch || s.name.toLowerCase().includes(spinSearch.toLowerCase()) || (spinsByFolder[s.id] || []).some((spin) => spin.name.toLowerCase().includes(spinSearch.toLowerCase())))
                .map((space) => {
                  const spinsInFolder = spinsByFolder[space.id] || [];
                  const isActive = activeFolderId === space.id;
                  const totalItems = spinsInFolder.reduce((sum, spin) => sum + (taskIdsBySpin[spin.id] || []).length, 0);
                  return (
                    <motion.div key={space.id} whileHover={{ y: -2, transition: { duration: 0.12 } }}
                      style={{ position: "relative", border: isActive ? "1.5px solid #37352f" : "1px solid #e1dfdb", background: isActive ? "#fff" : "#fff", borderRadius: 14, padding: "18px 18px 16px", cursor: "pointer", boxShadow: isActive ? "0 4px 12px rgba(55,53,47,0.08)" : "0 1px 4px rgba(0,0,0,0.03)", transition: "border-color 150ms, box-shadow 150ms", aspectRatio: "1 / 1", display: "flex", flexDirection: "column" }}
                      onClick={() => setSelectedFolderForDetail(space.id)}
                    >
                      {/* Folder icon row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: isActive ? "#37352f" : "#f0efec", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 150ms" }}>
                          <FolderOpen style={{ width: 16, height: 16, color: isActive ? "#fff" : "#37352f" }} />
                        </div>
                        {space.id !== DEFAULT_FOLDER_ID && (
                          <button onClick={(e) => { e.stopPropagation(); removeFolder(space.id); }}
                            style={{ border: "1px solid #f0d5d5", background: "#fff", borderRadius: 7, padding: "4px 6px", color: "rgba(200,60,60,0.7)", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 100ms", opacity: 0 }}
                            className="folder-delete-btn"
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = "rgba(235,87,87,0.05)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0"; }}
                          >
                            <Trash2 style={{ width: 11, height: 11 }} />
                          </button>
                        )}
                      </div>

                      {/* Folder name */}
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#2f2d29", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{space.name}</div>

                      {/* Stats row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto" }}>
                        <span style={{ fontSize: 12, color: "rgba(55,53,47,0.5)" }}>{spinsInFolder.length} spin{spinsInFolder.length !== 1 ? "s" : ""}</span>
                        {totalItems > 0 && (
                          <>
                            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(55,53,47,0.25)", display: "inline-block" }} />
                            <span style={{ fontSize: 12, color: "rgba(55,53,47,0.4)" }}>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
                          </>
                        )}
                      </div>

                    </motion.div>
                  );
                })}

              {/* New folder card */}
              {showNewFolderInput ? (
                <div style={{ border: "1.5px dashed #d4d0cb", borderRadius: 14, padding: "18px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, background: "rgba(255,255,255,0.6)", aspectRatio: "1 / 1" }}>
                  <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && newFolderName.trim()) createFolder(); if (e.key === "Escape") { setNewFolderName(""); setShowNewFolderInput(false); } }}
                    onBlur={() => { if (!newFolderName.trim()) setShowNewFolderInput(false); }}
                    placeholder="Folder name…"
                    autoFocus
                    style={{ border: "1px solid #d8d4cc", background: "#fff", borderRadius: 8, padding: "9px 11px", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#37352f" }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={createFolder} style={{ flex: 1, border: "none", background: "#37352f", color: "#fff", borderRadius: 7, padding: "7px 0", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Create</button>
                    <button onClick={() => { setNewFolderName(""); setShowNewFolderInput(false); }} style={{ flex: 1, border: "1px solid #e1dfdb", background: "#fff", color: "rgba(55,53,47,0.6)", borderRadius: 7, padding: "7px 0", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowNewFolderInput(true)}
                  style={{ border: "1.5px dashed #d4d0cb", borderRadius: 14, padding: "18px", cursor: "pointer", background: "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, aspectRatio: "1 / 1", transition: "all 120ms", color: "rgba(55,53,47,0.45)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#a09d98"; e.currentTarget.style.color = "#37352f"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "#d4d0cb"; e.currentTarget.style.color = "rgba(55,53,47,0.45)"; }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "#f0efec", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus style={{ width: 16, height: 16 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>New folder</span>
                </button>
              )}
            </div>

            {/* Recent spins section */}
            {recentSpins.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(55,53,47,0.4)", marginBottom: 10 }}>Recently opened</div>
                <div style={{ background: "#fff", border: "1px solid #e1dfdb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                  {recentSpins
                    .filter((spin) => !spinSearch || spin.name.toLowerCase().includes(spinSearch.toLowerCase()) || spin.folderName.toLowerCase().includes(spinSearch.toLowerCase()))
                    .map((spin, i, arr) => (
                      <button key={`recent-${spin.id}`}
                        onClick={() => { const folder = spinSpaces.find((space) => (spinsByFolder[space.id] || []).some((s) => s.id === spin.id)); if (folder) { setActiveFolderId(folder.id); } selectSpin(spin.id); setShowDashboard(false); }}
                        style={{ width: "100%", border: "none", borderBottom: i < arr.length - 1 ? "1px solid #f7f6f3" : "none", background: "#fff", color: "#37352f", textAlign: "left", padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, cursor: "pointer", transition: "background 80ms", gap: 12, fontFamily: "inherit" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fafaf9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: spin.id === activeSpinId ? "#37352f" : "#d4d0cb", flexShrink: 0 }} />
                          <span style={{ fontWeight: spin.id === activeSpinId ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{spin.name}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: "rgba(55,53,47,0.4)", background: "#f7f6f3", borderRadius: 4, padding: "2px 7px" }}>{spin.folderName}</span>
                          <ChevronRight style={{ width: 13, height: 13, color: "#d4d0cb" }} />
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── Folder detail modal ── */}
      <AnimatePresence>
        {selectedFolderForDetail && (
          <FolderDetailModal
            folderId={selectedFolderForDetail}
            folderName={spinSpaces.find((s) => s.id === selectedFolderForDetail)?.name || ""}
            spins={spinsByFolder[selectedFolderForDetail] || []}
            spinSearch={spinSearch}
            onClose={() => setSelectedFolderForDetail(null)}
            onSelectSpin={(spinId) => { selectFolder(selectedFolderForDetail); selectSpin(spinId); setShowDashboard(false); }}
            onAddSpin={(name) => createSpinList(selectedFolderForDetail, name)}
            onDeleteSpin={(spinId) => removeSpinList(selectedFolderForDetail, spinId)}
            onRenameSpin={(spinId, name) => renameSpinList(selectedFolderForDetail, spinId, name)}
          />
        )}
      </AnimatePresence>

      {/* ── Winner modal ── */}
      <AnimatePresence>
        {winner && !showDashboard && (
          <WinnerModal winner={winner} onClose={() => setWinner(null)} onDelete={deleteTask} onRespin={spin} />
        )}
      </AnimatePresence>
    </div>
  );
}
