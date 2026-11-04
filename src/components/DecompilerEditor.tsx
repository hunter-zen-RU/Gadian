import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileCode,
  Folder,
  Sparkles,
  ShieldAlert,
  Wrench,
  Search,
  Copy,
  Check,
  Download,
  RotateCcw,
  Split,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit3,
  Maximize2,
  Minimize2,
  Layers,
  Terminal,
  Play,
  X,
  ChevronRight,
  ChevronDown,
  Code2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { ApkAnalysisData } from "../types/apk";
import { DecompiledFile, generateDecompiledTree } from "../utils/decompilerEngine";
import { recompileAndExportApk, triggerApkDownload, CompileProgress } from "../utils/apkCompiler";
import JSZip from "jszip";

interface DecompilerEditorProps {
  currentApk: ApkAnalysisData;
}

interface AiAssistResult {
  quickTake: string;
  explanation: string;
  vulnerabilities: Array<{
    title: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    description: string;
    suggestedFix?: string;
  }>;
  hardenedCode?: string;
}

export const DecompilerEditor: React.FC<DecompilerEditorProps> = ({ currentApk }) => {
  // Generate file tree when APK changes
  const initialFiles = useMemo(() => generateDecompiledTree(currentApk), [currentApk]);
  const [files, setFiles] = useState<DecompiledFile[]>(initialFiles);
  const [activePath, setActivePath] = useState<string>(initialFiles[0]?.path || "AndroidManifest.xml");
  const [openTabs, setOpenTabs] = useState<string[]>([initialFiles[0]?.path || "AndroidManifest.xml"]);

  // Full Screen Code Studio Mode
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [showConsole, setShowConsole] = useState(false);

  // Recompile state
  const [isRecompiling, setIsRecompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState<CompileProgress | null>(null);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [compileSuccess, setCompileSuccess] = useState<boolean | null>(null);

  // Update files whenever currentApk changes
  useEffect(() => {
    const updated = generateDecompiledTree(currentApk);
    setFiles(updated);
    setActivePath(updated[0]?.path || "AndroidManifest.xml");
    setOpenTabs([updated[0]?.path || "AndroidManifest.xml"]);
    setAiResult(null);
  }, [currentApk]);

  // Current active file
  const activeFile = files.find((f) => f.path === activePath) || files[0];
  const originalFile = initialFiles.find((f) => f.path === activePath) || activeFile;

  // Search in code & UI helpers
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI Assistant State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiAssistResult | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [appliedPatch, setAppliedPatch] = useState(false);

  // File editing handler
  const handleCodeChange = (newCode: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.path === activePath) {
          const isModified = newCode !== (initialFiles.find((init) => init.path === f.path)?.content || "");
          return { ...f, content: newCode, isModified };
        }
        return f;
      })
    );
  };

  const handleResetFile = () => {
    const orig = initialFiles.find((f) => f.path === activePath);
    if (orig) {
      handleCodeChange(orig.content);
    }
  };

  const handleCopyCode = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenTab = (path: string) => {
    if (!openTabs.includes(path)) {
      setOpenTabs((prev) => [...prev, path]);
    }
    setActivePath(path);
  };

  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabs.filter((p) => p !== path);
    setOpenTabs(remaining);
    if (activePath === path && remaining.length > 0) {
      setActivePath(remaining[remaining.length - 1]);
    }
  };

  // Export modified project as ZIP
  const handleExportZip = async () => {
    const zip = new JSZip();
    for (const f of files) {
      zip.file(f.path, f.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentApk.appName}_decompiled_source.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Recompile and Export APK package
  const handleRecompileApk = async () => {
    try {
      setIsRecompiling(true);
      setShowConsole(true);
      setCompileSuccess(null);
      setCompileLogs(["[*] Initializing GADIAN Fullscreen Code Studio Compiler..."]);

      const compileFiles = files.map((f) => ({
        path: f.path,
        content: f.content,
      }));

      const result = await recompileAndExportApk(
        compileFiles,
        currentApk.appName,
        currentApk.packageName,
        (progress) => {
          setCompileProgress(progress);
          setCompileLogs((prev) => [...prev, `[${progress.step.toUpperCase()}] ${progress.message}`]);
        }
      );

      if (result.success && result.apkBlob) {
        setCompileSuccess(true);
        triggerApkDownload(result.apkBlob, result.apkFileName);
      } else {
        setCompileSuccess(false);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setCompileSuccess(false);
      setCompileLogs((prev) => [...prev, `[ERROR] ${error.message}`]);
    } finally {
      setIsRecompiling(false);
    }
  };

  // AI Assistance Query Handler
  const handleAiAssist = async (action: "explain" | "audit" | "harden" | "custom") => {
    if (!activeFile) return;
    try {
      setIsAiLoading(true);
      setAiError(null);
      setAppliedPatch(false);

      const res = await fetch("/api/ai-code-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          filename: activeFile.name,
          code: activeFile.content,
          userPrompt: action === "custom" ? userPrompt : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "AI assistant failed to analyze code");
      }

      setAiResult(data.result);
      if (action === "custom") setUserPrompt("");
    } catch (err: unknown) {
      const error = err as Error;
      console.warn("AI code assist error:", error);
      setAiError(error.message || "Failed to query AI assistant");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiPatch = () => {
    if (aiResult?.hardenedCode) {
      handleCodeChange(aiResult.hardenedCode);
      setAppliedPatch(true);
      setTimeout(() => setAppliedPatch(false), 2500);
    }
  };

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const textBefore = target.value.substring(0, target.selectionStart);
    const linesBefore = textBefore.split("\n");
    const lineNum = linesBefore.length;
    const colNum = (linesBefore[linesBefore.length - 1]?.length || 0) + 1;
    setCursorPos({ line: lineNum, col: colNum });
  };

  const lines = (activeFile?.content || "").split("\n");
  const modifiedCount = files.filter((f) => f.isModified).length;

  return (
    <div
      className={
        isFullScreen
          ? "fixed inset-0 z-50 bg-neutral-950 flex flex-col h-screen w-screen overflow-hidden font-mono text-xs select-none"
          : "max-w-7xl mx-auto p-2 sm:p-4 space-y-3 font-mono text-xs"
      }
    >
      {/* Top IDE Toolbar */}
      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-neutral-100 font-bold text-sm tracking-wide">
              GADIAN CODE STUDIO
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
              IDE PRO
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-neutral-400 text-xs">
            <span>·</span>
            <span className="text-neutral-300 font-semibold">{currentApk.appName}</span>
            <span>({currentApk.packageName})</span>
            {modifiedCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                {modifiedCount} file(s) modified
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            title="Toggle File Explorer"
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
          >
            {showFileExplorer ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowAiPanel(!showAiPanel)}
            title="Toggle AI Co-Pilot Panel"
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400"
          >
            {showAiPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setDiffMode(!diffMode)}
            className={`px-2.5 py-1.5 rounded border transition-colors flex items-center gap-1.5 ${
              diffMode
                ? "bg-emerald-950 border-emerald-600/60 text-emerald-300"
                : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>{diffMode ? "Editor View" : "Diff View"}</span>
          </button>

          <button
            onClick={handleRecompileApk}
            disabled={isRecompiling}
            className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRecompiling ? "Compiling APK..." : "Recompile & Export APK"}</span>
          </button>

          <button
            onClick={handleExportZip}
            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Source (.zip)</span>
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="px-2.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5"
            title={isFullScreen ? "Exit Fullscreen Studio" : "Full Screen Code Studio"}
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isFullScreen ? "Exit Studio" : "Full Screen Studio"}</span>
          </button>
        </div>
      </div>

      {/* Main IDE Body (3 Panes: Explorer | Center Editor | AI Co-Pilot) */}
      <div
        className={
          isFullScreen
            ? "flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden bg-neutral-950"
            : "grid grid-cols-12 gap-3 min-h-[620px]"
        }
      >
        {/* Pane 1: File Explorer (Left) */}
        {showFileExplorer && (
          <div className="col-span-12 md:col-span-3 lg:col-span-2 rounded bg-neutral-900 border border-neutral-800 flex flex-col overflow-hidden">
            <div className="p-2.5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between text-neutral-400 text-[11px] font-bold">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-emerald-400" />
                <span>PROJECT TREE</span>
              </span>
              <span className="text-neutral-500 text-[10px]">{files.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-neutral-850">
              {files.map((file) => {
                const isSelected = file.path === activePath;
                return (
                  <button
                    key={file.path}
                    onClick={() => handleOpenTab(file.path)}
                    className={`w-full text-left p-2 rounded transition-colors flex items-center justify-between gap-1.5 text-xs ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30"
                        : "text-neutral-300 hover:bg-neutral-800/80 hover:text-neutral-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span className="truncate">{file.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {file.isModified && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Modified" />
                      )}
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-neutral-800 text-neutral-500 font-mono">
                        {file.language}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pane 2: Editor Center (Flexible Column width based on sidebars) */}
        <div
          className={`${
            showFileExplorer && showAiPanel
              ? "col-span-12 md:col-span-9 lg:col-span-7"
              : showFileExplorer || showAiPanel
              ? "col-span-12 md:col-span-9 lg:col-span-9"
              : "col-span-12"
          } rounded bg-neutral-900 border border-neutral-800 flex flex-col overflow-hidden`}
        >
          {/* Tab Bar */}
          <div className="bg-neutral-950 border-b border-neutral-800 flex items-center overflow-x-auto scrollbar-none px-1 pt-1 gap-1">
            {openTabs.map((path) => {
              const tabFile = files.find((f) => f.path === path);
              const isActive = path === activePath;
              return (
                <div
                  key={path}
                  onClick={() => setActivePath(path)}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-t text-xs cursor-pointer border-t-2 transition-colors ${
                    isActive
                      ? "bg-neutral-900 border-emerald-400 text-neutral-100 font-medium"
                      : "bg-neutral-950/80 border-transparent text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                  }`}
                >
                  <FileCode className="w-3 h-3 opacity-70" />
                  <span className="truncate max-w-[140px]">{tabFile?.name || path}</span>
                  {tabFile?.isModified && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  <button
                    onClick={(e) => handleCloseTab(path, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-neutral-500 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Breadcrumbs & Quick Search Tool */}
          <div className="px-3 py-2 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-400 truncate">
              <span className="text-neutral-500">{currentApk.appName}</span>
              <ChevronRight className="w-3 h-3 text-neutral-600" />
              <span className="text-emerald-400 font-semibold truncate">{activePath}</span>
              {activeFile?.isModified && (
                <span className="text-amber-400 text-[10px] ml-1">(unsaved edits)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5">
                <Search className="w-3 h-3 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find in file..."
                  className="bg-transparent border-0 outline-none text-neutral-200 text-[11px] w-28 sm:w-36 placeholder:text-neutral-600"
                />
              </div>

              <button
                onClick={handleCopyCode}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                onClick={handleResetFile}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 text-[11px] flex items-center gap-1"
                title="Discard edits and revert to original AST"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Main Code Editor Area */}
          <div className="flex-1 flex overflow-hidden relative">
            {diffMode ? (
              /* Side-by-Side Diff View */
              <div className="grid grid-cols-2 w-full h-full divide-x divide-neutral-800 overflow-auto">
                <div className="p-3 bg-neutral-950 font-mono text-[11px] text-neutral-400 overflow-auto select-text">
                  <div className="text-rose-400 font-bold mb-2 pb-1 border-b border-neutral-800 flex items-center gap-1">
                    <span>ORIGINAL DECOMPILED AST</span>
                  </div>
                  <pre>{originalFile?.content}</pre>
                </div>
                <div className="p-3 bg-neutral-950 font-mono text-[11px] text-emerald-300 overflow-auto select-text">
                  <div className="text-emerald-400 font-bold mb-2 pb-1 border-b border-neutral-800 flex items-center gap-1">
                    <span>CURRENT MODIFIED BUFFER</span>
                  </div>
                  <pre>{activeFile?.content}</pre>
                </div>
              </div>
            ) : (
              /* Professional Code Editor with Line Numbers */
              <div className="flex w-full h-full bg-neutral-950 overflow-hidden">
                {/* Line Numbers Gutter */}
                <div className="py-3 px-2 bg-neutral-950 text-neutral-600 text-right select-none font-mono text-[11px] border-r border-neutral-850 overflow-hidden min-w-[42px]">
                  {lines.map((_, i) => (
                    <div key={i} className="leading-5">
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Editable Codearea */}
                <textarea
                  ref={textareaRef}
                  value={activeFile?.content || ""}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onSelect={handleTextareaSelect}
                  onKeyUp={handleTextareaSelect}
                  onClick={handleTextareaSelect}
                  spellCheck={false}
                  className="flex-1 p-3 bg-neutral-950 text-neutral-200 font-mono text-[11px] leading-5 resize-none outline-none overflow-auto whitespace-pre selection:bg-emerald-500/30 selection:text-emerald-300"
                />
              </div>
            )}
          </div>

          {/* Bottom Diagnostics / Compiler Output Console Dock */}
          {showConsole && (
            <div className="h-44 border-t border-neutral-800 bg-neutral-950 flex flex-col shrink-0">
              <div className="p-2 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between text-[11px] font-bold text-neutral-300">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AIDE BUILD & COMPILATION CONSOLE</span>
                  {compileProgress && (
                    <span className="text-cyan-400 font-normal">
                      ({compileProgress.percent}% - {compileProgress.message})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {compileSuccess === true && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      BUILD SUCCESSFUL (.APK EXPORTED)
                    </span>
                  )}
                  {compileSuccess === false && (
                    <span className="text-rose-400 font-bold flex items-center gap-1 text-[10px]">
                      <AlertTriangle className="w-3 h-3" />
                      BUILD FAILED
                    </span>
                  )}
                  <button
                    onClick={() => setShowConsole(false)}
                    className="text-neutral-500 hover:text-neutral-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-2.5 overflow-y-auto font-mono text-[10px] text-neutral-300 space-y-1">
                {compileLogs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes("SUCCESS")
                        ? "text-emerald-400 font-bold"
                        : log.includes("ERROR")
                        ? "text-rose-400 font-bold"
                        : log.includes("AAPT")
                        ? "text-cyan-400"
                        : log.includes("ECJ")
                        ? "text-indigo-400"
                        : "text-neutral-400"
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editor Status Bar */}
          <div className="px-3 py-1.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
            <div className="flex items-center gap-3">
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>·</span>
              <span>{lines.length} lines</span>
              <span>·</span>
              <span>{(activeFile?.content.length || 0)} characters</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConsole(!showConsole)}
                className="hover:text-neutral-300 flex items-center gap-1 text-cyan-400"
              >
                <Terminal className="w-3 h-3" />
                <span>Compiler Console</span>
              </button>
              <span>UTF-8</span>
              <span className="uppercase text-emerald-400 font-semibold">{activeFile?.language}</span>
            </div>
          </div>
        </div>

        {/* Pane 3: AI Co-Pilot & Security Auditor (Right) */}
        {showAiPanel && (
          <div className="col-span-12 lg:col-span-3 rounded bg-neutral-900 border border-neutral-800 flex flex-col overflow-hidden">
            <div className="p-2.5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-neutral-200 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI REVERSE CO-PILOT</span>
              </div>
              <span className="text-[10px] text-emerald-400/80">Gemini 3.8</span>
            </div>

            {/* AI Action Buttons */}
            <div className="p-2 border-b border-neutral-800 bg-neutral-900/60 grid grid-cols-3 gap-1 text-[10px]">
              <button
                onClick={() => handleAiAssist("audit")}
                disabled={isAiLoading}
                className="py-1.5 px-2 rounded bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 transition-colors flex items-center justify-center gap-1 font-bold disabled:opacity-50"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Audit</span>
              </button>

              <button
                onClick={() => handleAiAssist("explain")}
                disabled={isAiLoading}
                className="py-1.5 px-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center justify-center gap-1 font-medium disabled:opacity-50"
              >
                <Eye className="w-3 h-3" />
                <span>Explain</span>
              </button>

              <button
                onClick={() => handleAiAssist("harden")}
                disabled={isAiLoading}
                className="py-1.5 px-2 rounded bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/60 transition-colors flex items-center justify-center gap-1 font-bold disabled:opacity-50"
              >
                <Wrench className="w-3 h-3" />
                <span>Harden</span>
              </button>
            </div>

            {/* AI Analysis Stream / Output Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {isAiLoading && (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                  <div className="text-neutral-400 text-xs">Gemini reverse engineering in progress...</div>
                </div>
              )}

              {aiError && (
                <div className="p-2.5 rounded bg-rose-950/40 border border-rose-900 text-rose-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Analysis Notice</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">{aiError}</p>
                </div>
              )}

              {!isAiLoading && !aiResult && !aiError && (
                <div className="py-8 text-center text-neutral-500 space-y-2">
                  <Code2 className="w-8 h-8 mx-auto opacity-40 text-emerald-400" />
                  <p className="text-xs">Click Audit, Explain, or Harden to inspect {activeFile?.name} with AI.</p>
                </div>
              )}

              {aiResult && (
                <div className="space-y-3">
                  {/* Quick Take Summary */}
                  <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 space-y-1">
                    <div className="text-emerald-400 font-bold text-[10px] uppercase">
                      Executive Verdict
                    </div>
                    <p className="text-neutral-200 text-xs leading-relaxed">{aiResult.quickTake}</p>
                  </div>

                  {/* Vulnerabilities List */}
                  {aiResult.vulnerabilities.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-neutral-400 font-bold text-[10px] uppercase flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        <span>Detected Vulnerabilities ({aiResult.vulnerabilities.length}):</span>
                      </div>

                      {aiResult.vulnerabilities.map((v, i) => (
                        <div key={i} className="p-2.5 rounded bg-rose-950/20 border border-rose-900/60 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-rose-300">{v.title}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                              {v.severity}
                            </span>
                          </div>
                          <p className="text-neutral-400 text-[11px]">{v.description}</p>
                          {v.suggestedFix && (
                            <div className="text-emerald-400 text-[10px] pt-1">
                              Fix: {v.suggestedFix}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Hardened Code Available -> 1-Click Apply */}
                  {aiResult.hardenedCode && (
                    <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-900/60 space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                        <span>Hardened Patch Ready</span>
                        <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Patched source ready to replace current editor buffer.
                      </p>
                      <button
                        onClick={handleApplyAiPatch}
                        className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        {appliedPatch ? <Check className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                        <span>{appliedPatch ? "Patch Applied!" : "Apply AI Patch to Editor"}</span>
                      </button>
                    </div>
                  )}

                  {/* Explanation text */}
                  <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 space-y-1 leading-relaxed whitespace-pre-wrap">
                    {aiResult.explanation}
                  </div>
                </div>
              )}
            </div>

            {/* Custom User AI Query Prompt Box */}
            <div className="p-2.5 border-t border-neutral-800 bg-neutral-950">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && userPrompt.trim()) {
                      handleAiAssist("custom");
                    }
                  }}
                  placeholder="Ask AI about this code..."
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleAiAssist("custom")}
                  disabled={!userPrompt.trim() || isAiLoading}
                  className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold transition-colors disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
