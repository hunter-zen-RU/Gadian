import React from "react";
import { Terminal, Shield, FileCode, Cpu, Download, Sparkles, Code2, Globe, FolderArchive } from "lucide-react";

interface HeaderProps {
  activeTab: "terminal" | "inspector" | "decompiler" | "webtoapk" | "assets" | "audit" | "aide" | "tools";
  onTabChange: (tab: "terminal" | "inspector" | "decompiler" | "webtoapk" | "assets" | "audit" | "aide" | "tools") => void;
  onDownloadAideZip: () => void;
  isDownloadingZip: boolean;
  onTriggerOnlineAudit: () => void;
  isAuditingOnline: boolean;
  hasOnlineResult: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onDownloadAideZip,
  isDownloadingZip,
  onTriggerOnlineAudit,
  isAuditingOnline,
  hasOnlineResult,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark (Single text element in display face) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <button
            onClick={() => onTabChange("terminal")}
            className="text-left font-mono font-bold tracking-tight text-neutral-100 text-lg hover:text-emerald-400 transition-colors"
          >
            GADIAN
          </button>
        </div>

        {/* Zone 2: Navigation Links / Workspace Tabs */}
        <nav className="hidden lg:flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => onTabChange("terminal")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "terminal"
                ? "bg-neutral-800 text-emerald-400 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          <button
            onClick={() => onTabChange("inspector")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "inspector"
                ? "bg-neutral-800 text-emerald-400 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>

          <button
            onClick={() => onTabChange("decompiler")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "decompiler"
                ? "bg-neutral-800 text-emerald-400 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Editor & AI</span>
          </button>

          <button
            onClick={() => onTabChange("webtoapk")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "webtoapk"
                ? "bg-neutral-800 text-emerald-400 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web to APK</span>
          </button>

          <button
            onClick={() => onTabChange("assets")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "assets"
                ? "bg-neutral-800 text-emerald-400 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Assets</span>
          </button>

          <button
            onClick={() => onTabChange("audit")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-neutral-800 text-emerald-400 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Audit</span>
          </button>

          <button
            onClick={() => onTabChange("aide")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "aide"
                ? "bg-neutral-800 text-emerald-400 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>AIDE Project</span>
          </button>

          <button
            onClick={() => onTabChange("tools")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "tools"
                ? "bg-neutral-800 text-emerald-400 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
            }`}
          >
            <span>Dev Tools & API</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onTriggerOnlineAudit}
            disabled={isAuditingOnline}
            className={`px-3 py-1.5 text-xs font-mono rounded flex items-center gap-1.5 transition-colors whitespace-nowrap border ${
              hasOnlineResult
                ? "bg-emerald-950/60 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60"
                : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAuditingOnline ? "animate-spin text-emerald-400" : "text-emerald-400"}`} />
            <span>{isAuditingOnline ? "Analyzing..." : hasOnlineResult ? "AI Debrief Ready" : "Online AI Audit"}</span>
          </button>

          <button
            onClick={onDownloadAideZip}
            disabled={isDownloadingZip}
            className="px-3.5 py-1.5 text-xs font-mono font-medium rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingZip ? "Building..." : "Export AIDE Project"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center gap-1 border-t border-neutral-800/80 px-2 py-1.5 bg-neutral-950 text-xs font-mono overflow-x-auto scrollbar-none">
        <button
          onClick={() => onTabChange("terminal")}
          className={`px-2.5 py-1 rounded shrink-0 ${activeTab === "terminal" ? "text-emerald-400 bg-neutral-900" : "text-neutral-400"}`}
        >
          Terminal
        </button>
        <button
          onClick={() => onTabChange("inspector")}
          className={`px-2.5 py-1 rounded shrink-0 ${activeTab === "inspector" ? "text-emerald-400 bg-neutral-900" : "text-neutral-400"}`}
        >
          Inspector
        </button>
        <button
          onClick={() => onTabChange("decompiler")}
          className={`px-2.5 py-1 rounded shrink-0 ${activeTab === "decompiler" ? "text-emerald-400 bg-neutral-900" : "text-neutral-400"}`}
        >
          Editor & AI
        </button>
        <button
          onClick={() => onTabChange("webtoapk")}
          className={`px-2.5 py-1 rounded shrink-0 ${activeTab === "webtoapk" ? "text-emerald-400 bg-neutral-900" : "text-neutral-400"}`}
        >
          Web to APK
        </button>
        <button
          onClick={() => onTabChange("assets")}
          className={`px-2.5 py-1 rounded shrink-0 ${activeTab === "assets" ? "text-emerald-400 bg-neutral-900" : "text-neutral-400"}`}
        >
          Assets
        </button>
        <button
          onClick={() => onTabChange("audit")}
          className={`px-2.5 py-1 rounded shrink-0 ${activeTab === "audit" ? "text-emerald-400 bg-neutral-900" : "text-neutral-400"}`}
        >
          Audit
        </button>
        <button
          onClick={() => onTabChange("aide")}
          className={`px-2.5 py-1 rounded shrink-0 ${activeTab === "aide" ? "text-emerald-400 bg-neutral-900" : "text-neutral-400"}`}
        >
          AIDE Code
        </button>
        <button
          onClick={() => onTabChange("tools")}
          className={`px-2.5 py-1 rounded shrink-0 ${activeTab === "tools" ? "text-emerald-400 bg-neutral-900" : "text-neutral-400"}`}
        >
          Dev Tools & API
        </button>
      </div>
    </header>
  );
};
