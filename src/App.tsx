import React, { useState } from "react";
import { Header } from "./components/Header";
import { TerminalView } from "./components/TerminalView";
import { ApkInspector } from "./components/ApkInspector";
import { DecompilerEditor } from "./components/DecompilerEditor";
import { WebToApkBuilder } from "./components/WebToApkBuilder";
import { AssetManager } from "./components/AssetManager";
import { SecurityAudit } from "./components/SecurityAudit";
import { AideSourceExplorer } from "./components/AideSourceExplorer";
import { DeveloperTools } from "./components/DeveloperTools";
import { SAMPLE_APKS } from "./data/sampleApks";
import { ApkAnalysisData, OnlineGeminiAudit } from "./types/apk";
import { parseApkFile } from "./utils/apkParser";
import { createAideProjectZip } from "./utils/aideProjectGenerator";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "terminal" | "inspector" | "decompiler" | "webtoapk" | "assets" | "audit" | "aide" | "tools"
  >("terminal");

  // Default target is the banking trojan to immediately illustrate security risk evaluation
  const [currentApk, setCurrentApk] = useState<ApkAnalysisData>(SAMPLE_APKS[1]);
  const [allSamples, setAllSamples] = useState<ApkAnalysisData[]>(SAMPLE_APKS);

  const [onlineAudit, setOnlineAudit] = useState<OnlineGeminiAudit | null>(null);
  const [isAuditingOnline, setIsAuditingOnline] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSelectSample = (sampleId: string) => {
    const found = allSamples.find((s) => s.id === sampleId);
    if (found) {
      setCurrentApk(found);
      setOnlineAudit(null);
      setOnlineError(null);
      showNotification(`Switched target APK to ${found.appName}`);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".apk") && !file.type.includes("package-archive")) {
      showNotification("Please select a valid Android .apk file.");
      return;
    }

    try {
      setIsParsingFile(true);
      showNotification(`Parsing APK archive: ${file.name}...`);
      const parsed = await parseApkFile(file, file.name);

      setCurrentApk(parsed);
      setAllSamples((prev) => [parsed, ...prev.filter((p) => p.id !== parsed.id)]);
      setOnlineAudit(null);
      setOnlineError(null);
      showNotification(`Successfully decompiled and analyzed ${parsed.appName}`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("APK parsing error:", error);
      showNotification(`Failed to parse APK: ${error.message || "Invalid zip or manifest structure"}`);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDownloadAideZip = async () => {
    try {
      setIsDownloadingZip(true);
      showNotification("Assembling Project GADIAN AIDE source files...");
      const blob = await createAideProjectZip();

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "GADIAN-AIDE-Project.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification("GADIAN-AIDE-Project.zip ready! Extract in AIDE on Android to compile.");
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Failed to build AIDE zip:", error);
      showNotification(`Error generating AIDE project zip: ${error.message}`);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleTriggerOnlineAudit = async () => {
    try {
      setIsAuditingOnline(true);
      setOnlineError(null);
      showNotification("Sending static AST to Gemini 3.8 Flash security engine...");

      const res = await fetch("/api/analyze-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apkData: {
            appName: currentApk.appName,
            packageName: currentApk.packageName,
            versionName: currentApk.versionName,
            versionCode: currentApk.versionCode,
            minSdk: currentApk.minSdk,
            targetSdk: currentApk.targetSdk,
            permissions: currentApk.permissions,
            activities: currentApk.activities,
            services: currentApk.services,
            receivers: currentApk.receivers,
            dexInfo: currentApk.dexInfo,
            certificate: currentApk.certificate,
            heuristicFindings: currentApk.heuristicFindings.map((f) => `[${f.severity}] ${f.title}: ${f.description}`),
            offlineRiskScore: currentApk.offlineRiskScore,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Online security audit failed");
      }

      setOnlineAudit(data.result);
      if (data.isFallback) {
        showNotification("Security threat analysis completed (Heuristic threat engine)!");
      } else {
        showNotification("Gemini online security audit completed!");
      }
      // Automatically switch to Security Audit tab if user is on inspector or terminal
      if (activeTab === "inspector") {
        setActiveTab("audit");
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Online audit error:", error);
      setOnlineError(error.message || "Failed to reach online threat intelligence server.");
      showNotification(`Online audit failed: ${error.message}`);
    } finally {
      setIsAuditingOnline(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDownloadAideZip={handleDownloadAideZip}
        isDownloadingZip={isDownloadingZip}
        onTriggerOnlineAudit={handleTriggerOnlineAudit}
        isAuditingOnline={isAuditingOnline}
        hasOnlineResult={Boolean(onlineAudit)}
      />

      <main className="flex-1">
        {activeTab === "terminal" && (
          <TerminalView
            currentApk={currentApk}
            onlineAudit={onlineAudit}
            onSelectSample={handleSelectSample}
            onTriggerOnlineAudit={handleTriggerOnlineAudit}
            onDownloadAideZip={handleDownloadAideZip}
            isAuditingOnline={isAuditingOnline}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "inspector" && (
          <ApkInspector
            currentApk={currentApk}
            allSamples={allSamples}
            onSelectSample={handleSelectSample}
            onFileUpload={handleFileUpload}
            isParsingFile={isParsingFile}
            onNavigateToDecompiler={() => setActiveTab("decompiler")}
          />
        )}

        {activeTab === "decompiler" && (
          <DecompilerEditor currentApk={currentApk} />
        )}

        {activeTab === "webtoapk" && <WebToApkBuilder />}

        {activeTab === "assets" && <AssetManager currentApk={currentApk} />}

        {activeTab === "audit" && (
          <SecurityAudit
            currentApk={currentApk}
            onlineAudit={onlineAudit}
            onTriggerOnlineAudit={handleTriggerOnlineAudit}
            isAuditingOnline={isAuditingOnline}
            onlineError={onlineError}
          />
        )}

        {activeTab === "aide" && (
          <AideSourceExplorer
            onDownloadAideZip={handleDownloadAideZip}
            isDownloadingZip={isDownloadingZip}
          />
        )}

        {activeTab === "tools" && <DeveloperTools />}
      </main>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 p-3 rounded bg-neutral-900 border border-emerald-500/50 text-emerald-300 text-xs font-mono shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          {notification}
        </div>
      )}
    </div>
  );
}
