import React, { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { ApkAnalysisData, OnlineGeminiAudit } from "../types/apk";
import { recompileAndExportApk, triggerApkDownload } from "../utils/apkCompiler";
import { generateDecompiledTree } from "../utils/decompilerEngine";

interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "success" | "banner" | "warning";
  text: string;
  timestamp: string;
}

interface TerminalViewProps {
  currentApk: ApkAnalysisData;
  onlineAudit: OnlineGeminiAudit | null;
  onSelectSample: (id: string) => void;
  onTriggerOnlineAudit: () => void;
  onDownloadAideZip: () => void;
  isAuditingOnline: boolean;
  onNavigateToTab: (tab: "inspector" | "decompiler" | "webtoapk" | "assets" | "audit" | "aide" | "tools") => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({
  currentApk,
  onlineAudit,
  onSelectSample,
  onTriggerOnlineAudit,
  onDownloadAideZip,
  isAuditingOnline,
  onNavigateToTab,
}) => {
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: "line-1",
      type: "banner",
      text: "╔═══════════════════════════════════════════════════════════════════════════════╗",
      timestamp: getTime(),
    },
    {
      id: "line-2",
      type: "banner",
      text: "║  GADIAN // Mobile APK Static & Heuristic Security Terminal Engine v1.4.2       ║",
      timestamp: getTime(),
    },
    {
      id: "line-3",
      type: "banner",
      text: "║  Compilation Target: AIDE App (Android Native IDE) · Pure Java/Android SDK     ║",
      timestamp: getTime(),
    },
    {
      id: "line-4",
      type: "banner",
      text: "║  Offline Engine: Heuristics & Static AST · Online Engine: Gemini 3.8 Flash      ║",
      timestamp: getTime(),
    },
    {
      id: "line-5",
      type: "banner",
      text: "╚═══════════════════════════════════════════════════════════════════════════════╝",
      timestamp: getTime(),
    },
    {
      id: "line-6",
      type: "output",
      text: `Loaded Target: ${currentApk.appName} (${currentApk.packageName})`,
      timestamp: getTime(),
    },
    {
      id: "line-7",
      type: "success",
      text: `Safety Verdict: [${currentApk.offlineVerdict}] (Offline Risk Score: ${currentApk.offlineRiskScore}/100)`,
      timestamp: getTime(),
    },
    {
      id: "line-8",
      type: "output",
      text: "Type 'help' to inspect commands, or tap quick command triggers below.",
      timestamp: getTime(),
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  function getTime() {
    const now = new Date();
    return now.toTimeString().split(" ")[0];
  }

  const handleCommand = (rawCmd: string) => {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    const time = getTime();
    const newLines: TerminalLine[] = [
      ...lines,
      { id: `cmd-${Date.now()}`, type: "input", text: `gadian> ${cmd}`, timestamp: time },
    ];

    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);

    const parts = cmd.split(/\s+/);
    const action = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ");

    switch (action) {
      case "help":
        newLines.push({
          id: `out-${Date.now()}-1`,
          type: "output",
          text: `AVAILABLE GADIAN COMMANDS:
  inspect             - Execute full static & heuristic inspection summary
  decompile           - Launch Decompiler Studio & Code Editor with AI Co-Pilot
  webtoapk            - Convert Website or PWA to native compilable Android APK
  assets              - Audit & extract bundled APK assets (/assets, /res)
  api                 - View available GADIAN REST API endpoints & curl examples
  info                - Display package identity, version, and SDK invariants
  audit               - Display offline threat assessment & Safety Verdict
  audit --online      - Execute Gemini 3.8 Flash deep threat debrief
  perms               - List requested permissions with danger weights & categories
  manifest            - Print decoded AndroidManifest.xml
  cert                - Inspect certificate fingerprints and debug keystore status
  dex                 - Display DEX header metrics and suspicious string detections
  sample <name>       - Switch test sample: 'signal', 'trojan', 'adware', 'spyware'
  recompile           - Recompile & assemble modified AST into signed .apk
  export-apk          - Alias for recompile & export signed APK package
  aide                - View AIDE Android project structure & compilation steps
  export-aide         - Download complete AIDE project source (.zip)
  clear               - Clear terminal screen`,
          timestamp: time,
        });
        break;

      case "clear":
      case "cls":
        setLines([]);
        setInputVal("");
        return;

      case "info":
        newLines.push({
          id: `out-${Date.now()}-info`,
          type: "output",
          text: `[APK PACKAGE INFORMATION]
File:            ${currentApk.fileName} (${(currentApk.fileSize / 1024 / 1024).toFixed(2)} MB)
Application:     ${currentApk.appName}
Package:         ${currentApk.packageName}
Version:         ${currentApk.versionName} (Build ${currentApk.versionCode})
SDK Range:       Min API ${currentApk.minSdk} -> Target API ${currentApk.targetSdk}
Total Perms:     ${currentApk.permissions.length} (${currentApk.permissionDetails.filter((p) => p.protectionLevel === "dangerous").length} dangerous)
Activities:      ${currentApk.activities.length} (${currentApk.components.filter((c) => c.type === "activity" && c.exported).length} exported)
Services:        ${currentApk.services.length}
Receivers:       ${currentApk.receivers.length}`,
          timestamp: time,
        });
        break;

      case "perms":
      case "permissions":
        newLines.push({
          id: `out-${Date.now()}-perms`,
          type: "output",
          text: `[REQUESTED PERMISSIONS (${currentApk.permissions.length})]
${currentApk.permissionDetails
  .map(
    (p) =>
      `  ${p.protectionLevel === "dangerous" ? "[DANGEROUS]" : "[NORMAL]   "} ${p.name}\n    Category: ${p.category} · Risk Weight: ${p.riskWeight}/10\n    Summary: ${p.description}`
  )
  .join("\n")}`,
          timestamp: time,
        });
        break;

      case "cert":
      case "certificate":
      case "signature":
        newLines.push({
          id: `out-${Date.now()}-cert`,
          type: currentApk.certificate.isDebug ? "warning" : "success",
          text: `[APK SIGNATURE & CERTIFICATE]
Subject:         ${currentApk.certificate.subject}
Issuer:          ${currentApk.certificate.issuer}
Debug Key:       ${currentApk.certificate.isDebug ? "YES [ALERT: Public Android Debug Key]" : "NO [Verified Release Key]"}
Schemes:         ${currentApk.certificate.schemes.join(", ")}
SHA-1 Hash:      ${currentApk.certificate.fingerprintSha1 || "N/A"}
SHA-256 Hash:    ${currentApk.certificate.fingerprintSha256 || "N/A"}`,
          timestamp: time,
        });
        break;

      case "dex":
        newLines.push({
          id: `out-${Date.now()}-dex`,
          type: "output",
          text: `[DEX BYTECODE & STRINGS]
Magic Header:    ${currentApk.dexInfo.magic}
Class Count:     ${currentApk.dexInfo.classCount}
Method Count:    ${currentApk.dexInfo.methodCount}
Multi-Dex:       ${currentApk.dexInfo.hasMultiDex ? "Yes" : "No"}
Native (.so):    ${currentApk.dexInfo.nativeLibraries.join(", ") || "None"}
Suspicious API / Reflection String Matches:
${currentApk.dexInfo.suspiciousStrings.length > 0 ? currentApk.dexInfo.suspiciousStrings.map((s) => `  ! [MATCH] ${s}`).join("\n") : "  None identified"}`,
          timestamp: time,
        });
        break;

      case "manifest":
        newLines.push({
          id: `out-${Date.now()}-man`,
          type: "output",
          text: `[DECOMPILED AndroidManifest.xml]\n${currentApk.manifestXml.slice(0, 2000)}${currentApk.manifestXml.length > 2000 ? "\n... (truncated for terminal view, see APK Inspector tab for full file)" : ""}`,
          timestamp: time,
        });
        break;

      case "inspect":
        newLines.push({
          id: `out-${Date.now()}-insp`,
          type:
            currentApk.offlineVerdict === "SAFE"
              ? "success"
              : currentApk.offlineVerdict === "MALICIOUS"
              ? "error"
              : "warning",
          text: `===============================================================
 INSPECTION REPORT: ${currentApk.appName}
===============================================================
 Package:        ${currentApk.packageName}
 Safety Verdict: [${currentApk.offlineVerdict}] (Risk Score: ${currentApk.offlineRiskScore}/100)
 Rationale:      ${currentApk.offlineVerdictRationale}

 Critical Findings (${currentApk.heuristicFindings.length}):
${currentApk.heuristicFindings.length === 0 ? "  None. Clean baseline." : currentApk.heuristicFindings.map((f) => `  * [${f.severity}] ${f.title}\n    ${f.description}`).join("\n")}`,
          timestamp: time,
        });
        break;

      case "audit":
        if (arg === "--online") {
          newLines.push({
            id: `out-${Date.now()}-aud-on`,
            type: "output",
            text: "[*] Dispatching static AST payload to Gemini 3.8 Flash online security auditor...",
            timestamp: time,
          });
          onTriggerOnlineAudit();
        } else {
          newLines.push({
            id: `out-${Date.now()}-aud`,
            type:
              currentApk.offlineVerdict === "SAFE"
                ? "success"
                : currentApk.offlineVerdict === "MALICIOUS"
                ? "error"
                : "warning",
            text: `[OFFLINE SECURITY AUDIT]
Verdict:             ${currentApk.offlineVerdict}
Risk Score:          ${currentApk.offlineRiskScore}/100
Evaluated Perms:     ${currentApk.permissions.length}
Triggered Findings:  ${currentApk.heuristicFindings.length}
Recommendation:      ${currentApk.offlineVerdict === "SAFE" ? "Verified Safe for installation." : currentApk.offlineVerdict === "MALICIOUS" ? "DANGEROUS: Do not install or execute." : "Review requested permissions carefully."}`,
            timestamp: time,
          });
        }
        break;

      case "sample": {
        const target = arg.toLowerCase();
        if (target.includes("signal") || target.includes("clean") || target.includes("safe")) {
          onSelectSample("sample-signal");
          newLines.push({ id: `out-${Date.now()}`, type: "success", text: "Switched target to: Signal Private Messenger (SAFE sample)", timestamp: time });
        } else if (target.includes("trojan") || target.includes("bank") || target.includes("malware")) {
          onSelectSample("sample-bank-trojan");
          newLines.push({ id: `out-${Date.now()}`, type: "error", text: "Switched target to: QuickBank Authenticator 2FA (BANKING TROJAN sample)", timestamp: time });
        } else if (target.includes("adware") || target.includes("flash")) {
          onSelectSample("sample-adware");
          newLines.push({ id: `out-${Date.now()}`, type: "warning", text: "Switched target to: Ultra Flashlight LED Pro (ADWARE sample)", timestamp: time });
        } else if (target.includes("spyware") || target.includes("battery")) {
          onSelectSample("sample-spyware");
          newLines.push({ id: `out-${Date.now()}`, type: "error", text: "Switched target to: FastBattery Cooler Optimizer (SPYWARE sample)", timestamp: time });
        } else {
          newLines.push({
            id: `out-${Date.now()}`,
            type: "error",
            text: "Unknown sample. Use: sample signal | sample trojan | sample adware | sample spyware",
            timestamp: time,
          });
        }
        break;
      }

      case "decompile":
      case "editor":
        newLines.push({
          id: `out-${Date.now()}-dec`,
          type: "success",
          text: "[*] Launching GADIAN Online Decompiler & Code Editor with AI assistance...",
          timestamp: time,
        });
        onNavigateToTab("decompiler");
        break;

      case "webtoapk":
      case "web2apk":
        newLines.push({
          id: `out-${Date.now()}-w2a`,
          type: "success",
          text: "[*] Opening GADIAN Web-To-APK Generator & Native Android Wrapper Studio...",
          timestamp: time,
        });
        onNavigateToTab("webtoapk");
        break;

      case "assets":
      case "asset-manager":
        newLines.push({
          id: `out-${Date.now()}-ast`,
          type: "success",
          text: `[*] Opening APK Asset & Resource Manager for ${currentApk.appName} (assets/res/META-INF)...`,
          timestamp: time,
        });
        onNavigateToTab("assets");
        break;

      case "api":
      case "endpoints":
        newLines.push({
          id: `out-${Date.now()}-api`,
          type: "output",
          text: `[GADIAN REST API ENDPOINTS]
  GET  /api/health            - Engine status & capabilities check
  GET  /api/endpoints         - REST API discovery schema
  POST /api/analyze-gemini     - Deep mobile threat reverse-engineering with Gemini 3.8 Flash
  POST /api/ai-code-assist     - Code auditor & hardening assistant (explain/audit/harden)
  POST /api/web-to-apk        - Generate native Android compilable Web-To-APK wrapper project
  POST /api/download-apk-url  - Verify & download remote APK via direct URL
  POST /api/extract-assets    - Catalog and audit bundled APK assets

Example Web-To-APK curl call:
  curl -X POST /api/web-to-apk -H "Content-Type: application/json" \\
    -d '{"url":"https://my-site.com","appName":"My App","packageName":"com.myapp.mobile"}'`,
          timestamp: time,
        });
        break;

      case "aide":
        newLines.push({
          id: `out-${Date.now()}-aide`,
          type: "output",
          text: `[AIDE COMPILATION SPECIFICATION]
Project Name: GADIAN (Android APK Auditor)
Build Framework: AIDE (Android IDE for Phone & Tablet)
SDK Support: Min API 21 (Lollipop), Target API 33 (Android 13)
Java Files:
  - com.gadian.analyzer.MainActivity (Terminal console interface)
  - com.gadian.analyzer.SecurityAuditor (Offline heuristic engine)
  - com.gadian.analyzer.OnlineThreatClient (REST AI bridge)
Layouts:
  - res/layout/activity_main.xml (Cyber console layout)
To compile directly on an Android device:
1. Export project via 'export-aide'
2. Extract to /sdcard/AppProjects/GADIAN
3. Launch AIDE app -> Open Project -> Tap Run!`,
          timestamp: time,
        });
        break;

      case "export-aide":
      case "export":
        newLines.push({
          id: `out-${Date.now()}-exp`,
          type: "success",
          text: "[*] Packing GADIAN source files into AIDE-ready ZIP archive...",
          timestamp: time,
        });
        onDownloadAideZip();
        break;

      case "recompile":
      case "export-apk":
      case "compile": {
        newLines.push({
          id: `out-${Date.now()}-rcp1`,
          type: "output",
          text: `[*] Initiating Android Package Recompilation for '${currentApk.appName}' (${currentApk.packageName})...`,
          timestamp: time,
        });
        const decompiledFiles = generateDecompiledTree(currentApk);
        const compileFiles = decompiledFiles.map((f) => ({
          path: f.path,
          content: f.content,
        }));

        recompileAndExportApk(
          compileFiles,
          currentApk.appName,
          currentApk.packageName,
          (prog) => {
            setLines((prev) => [
              ...prev,
              {
                id: `out-${Date.now()}-${prog.step}`,
                type: prog.step === "error" ? "error" : "output",
                text: `[${prog.percent}%] ${prog.message}`,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          }
        ).then((res) => {
          if (res.success && res.apkBlob) {
            triggerApkDownload(res.apkBlob, res.apkFileName);
            setLines((prev) => [
              ...prev,
              {
                id: `out-${Date.now()}-done`,
                type: "success",
                text: `[+] BUILD SUCCESSFUL! Downloaded '${res.apkFileName}' (${((res.fileSizeBytes || 0) / 1024).toFixed(1)} KB). Signed with Android TestKey.`,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          } else {
            setLines((prev) => [
              ...prev,
              {
                id: `out-${Date.now()}-fail`,
                type: "error",
                text: `[-] Recompilation failed: ${res.errors.join(", ")}`,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          }
        }).catch((e: unknown) => {
          const err = e as Error;
          setLines((prev) => [
            ...prev,
            {
              id: `out-${Date.now()}-err`,
              type: "error",
              text: `[-] Fatal compiler error: ${err?.message || err}`,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        });
        break;
      }

      default:
        newLines.push({
          id: `out-${Date.now()}-err`,
          type: "error",
          text: `gadian: command not found: '${action}'. Type 'help' to view available commands.`,
          timestamp: time,
        });
        break;
    }

    setLines(newLines);
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(inputVal);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx >= history.length) {
          setHistoryIdx(-1);
          setInputVal("");
        } else {
          setHistoryIdx(nextIdx);
          setInputVal(history[nextIdx]);
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto p-3 sm:p-6 gap-3">
      {/* Target Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-neutral-400">Target APK:</span>
          <span className="text-neutral-100 font-semibold">{currentApk.appName}</span>
          <span className="text-neutral-500">({currentApk.packageName})</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Verdict:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-xs ${
                currentApk.offlineVerdict === "SAFE"
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                  : currentApk.offlineVerdict === "MALICIOUS"
                  ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                  : "bg-amber-950/80 text-amber-400 border border-amber-800/60"
              }`}
            >
              {currentApk.offlineVerdict}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Risk Score:</span>
            <span className="tabular-nums font-semibold text-neutral-200">
              {currentApk.offlineRiskScore}/100
            </span>
          </div>

          <button
            onClick={() => onNavigateToTab("decompiler")}
            className="text-neutral-400 hover:text-emerald-400 transition-colors"
          >
            Code Studio →
          </button>
          <button
            onClick={() => onNavigateToTab("audit")}
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
          >
            Audit Report →
          </button>
        </div>
      </div>

      {/* Terminal Screen Console */}
      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="flex-1 overflow-y-auto p-4 rounded bg-neutral-950 border border-neutral-800 font-mono text-xs sm:text-sm text-neutral-300 shadow-inner select-text cursor-text relative"
      >
        {/* Subtle Terminal Watermark / Grid Background */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.25)_51%)] bg-[length:100%_4px] opacity-40"></div>

        <div className="relative z-10 space-y-1.5">
          {lines.map((line) => {
            let color = "text-neutral-300";
            if (line.type === "banner") color = "text-emerald-400/90";
            if (line.type === "input") color = "text-cyan-400 font-semibold";
            if (line.type === "error") color = "text-rose-400";
            if (line.type === "success") color = "text-emerald-400 font-medium";
            if (line.type === "warning") color = "text-amber-400";

            return (
              <div key={line.id} className="leading-relaxed whitespace-pre-wrap break-all">
                {line.type === "input" && (
                  <span className="text-neutral-600 mr-2 text-[10px] select-none">
                    [{line.timestamp}]
                  </span>
                )}
                <span className={color}>{line.text}</span>
              </div>
            );
          })}

          {onlineAudit && (
            <div className="my-3 p-3 rounded bg-neutral-900/90 border border-emerald-600/40 text-neutral-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                <Sparkles className="w-4 h-4" />
                <span>ONLINE INTELLIGENCE DEBRIEF (Gemini 3.8 Flash)</span>
              </div>
              <p className="mb-2 text-neutral-300">{onlineAudit.executiveSummary}</p>
              <div className="text-neutral-400 mb-1">Verdict Rationale:</div>
              <p className="text-neutral-300 mb-2">{onlineAudit.verdictRationale}</p>
              {onlineAudit.dangerousCombinations.length > 0 && (
                <div className="mt-2 text-rose-300">
                  <span className="font-semibold">Dangerous Perm Combos: </span>
                  {onlineAudit.dangerousCombinations.map((c) => c.permissions.join(" + ")).join("; ")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Interactive Buttons (Zero-Friction for Devs & Mobile Users) */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono">
        <span className="text-neutral-500 mr-1 hidden sm:inline">Quick Exec:</span>
        <button
          onClick={() => handleCommand("inspect")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
        >
          inspect
        </button>
        <button
          onClick={() => handleCommand("decompile")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 font-medium transition-colors"
        >
          decompile
        </button>
        <button
          onClick={() => handleCommand("audit")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
        >
          audit
        </button>
        <button
          onClick={() => handleCommand("audit --online")}
          className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>audit --online</span>
        </button>
        <button
          onClick={() => handleCommand("perms")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
        >
          perms
        </button>
        <button
          onClick={() => handleCommand("cert")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
        >
          cert
        </button>
        <button
          onClick={() => handleCommand("dex")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
        >
          dex
        </button>
        <button
          onClick={() => handleCommand("sample trojan")}
          className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors"
        >
          sample trojan
        </button>
        <button
          onClick={() => handleCommand("sample signal")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
        >
          sample safe
        </button>
        <button
          onClick={() => handleCommand("webtoapk")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-400 transition-colors"
        >
          webtoapk
        </button>
        <button
          onClick={() => handleCommand("assets")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-colors"
        >
          assets
        </button>
        <button
          onClick={() => handleCommand("api")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
        >
          api
        </button>
        <button
          onClick={() => handleCommand("recompile")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-purple-400 transition-colors"
        >
          recompile
        </button>
        <button
          onClick={() => handleCommand("export-aide")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 transition-colors"
        >
          export-aide
        </button>
        <button
          onClick={() => handleCommand("clear")}
          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition-colors ml-auto"
        >
          clear
        </button>
      </div>

      {/* Terminal Input Line */}
      <div className="flex items-center gap-2 p-2 rounded bg-neutral-900 border border-neutral-800 font-mono text-sm">
        <span className="text-emerald-400 font-bold select-none pl-2">gadian&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command ('help', 'inspect', 'perms', 'audit --online', 'aide')..."
          className="flex-1 bg-transparent border-0 outline-none text-neutral-100 placeholder:text-neutral-600 font-mono text-xs sm:text-sm"
          autoFocus
        />
        <button
          onClick={() => handleCommand(inputVal)}
          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs flex items-center gap-1 transition-colors"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>EXEC</span>
        </button>
      </div>
    </div>
  );
};
