import React, { useState } from "react";
import {
  Upload,
  FileCode,
  ShieldAlert,
  Layers,
  Key,
  Binary,
  Copy,
  Check,
  Search,
  ExternalLink,
} from "lucide-react";
import { ApkAnalysisData } from "../types/apk";

interface ApkInspectorProps {
  currentApk: ApkAnalysisData;
  allSamples: ApkAnalysisData[];
  onSelectSample: (id: string) => void;
  onFileUpload: (file: File) => void;
  isParsingFile: boolean;
  onNavigateToDecompiler?: () => void;
}

export const ApkInspector: React.FC<ApkInspectorProps> = ({
  currentApk,
  allSamples,
  onSelectSample,
  onFileUpload,
  isParsingFile,
  onNavigateToDecompiler,
}) => {
  const [subTab, setSubTab] = useState<"perms" | "manifest" | "components" | "dex" | "cert">("perms");
  const [permSearch, setPermSearch] = useState("");
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(currentApk.manifestXml);
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const filteredPerms = currentApk.permissionDetails.filter(
    (p) =>
      p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.shortName.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(permSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Upload Zone & Target Selector Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Drag & Drop APK Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`p-5 rounded border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative ${
            isDragging
              ? "border-emerald-500 bg-emerald-950/20"
              : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700"
          }`}
        >
          <input
            type="file"
            accept=".apk"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileUpload(e.target.files[0]);
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload className={`w-8 h-8 mb-2 ${isParsingFile ? "animate-bounce text-emerald-400" : "text-neutral-400"}`} />
          <div className="font-mono text-sm text-neutral-200 font-medium">
            {isParsingFile ? "Decompressing & Parsing APK..." : "Drop any .APK file here"}
          </div>
          <div className="font-mono text-xs text-neutral-500 mt-1">
            Or click to browse from device (Analyzed locally in browser)
          </div>
        </div>

        {/* Sample Target Picker */}
        <div className="lg:col-span-2 p-4 rounded bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="font-mono text-xs text-neutral-400 uppercase tracking-wider mb-2">
              Select Pre-Configured Sample APK for Reverse Engineering:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {allSamples.map((sample) => {
                const isSelected = sample.id === currentApk.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => onSelectSample(sample.id)}
                    className={`p-2.5 rounded text-left transition-colors border font-mono text-xs ${
                      isSelected
                        ? "bg-neutral-800 border-emerald-500 text-neutral-100 shadow-sm"
                        : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                    }`}
                  >
                    <div className="truncate font-semibold">{sample.appName}</div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          sample.offlineVerdict === "SAFE"
                            ? "bg-emerald-400"
                            : sample.offlineVerdict === "MALICIOUS"
                            ? "bg-rose-400"
                            : "bg-amber-400"
                        }`}
                      ></span>
                      <span>{sample.offlineVerdict}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="tabular-nums">{sample.offlineRiskScore}/100</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>
              Active: <strong className="text-neutral-200">{currentApk.appName}</strong> ({currentApk.fileName})
            </span>
            <span>{(currentApk.fileSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
      </div>

      {/* Primary APK Metadata Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-neutral-500 text-[11px]">PACKAGE</div>
          <div className="text-neutral-200 font-semibold truncate mt-1" title={currentApk.packageName}>
            {currentApk.packageName}
          </div>
        </div>

        <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-neutral-500 text-[11px]">VERSION</div>
          <div className="text-neutral-200 font-semibold truncate mt-1">
            {currentApk.versionName} ({currentApk.versionCode})
          </div>
        </div>

        <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-neutral-500 text-[11px]">MIN / TARGET SDK</div>
          <div className="text-neutral-200 font-semibold tabular-nums mt-1">
            API {currentApk.minSdk} → API {currentApk.targetSdk}
          </div>
        </div>

        <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-neutral-500 text-[11px]">PERMISSIONS</div>
          <div className="text-neutral-200 font-semibold tabular-nums mt-1">
            {currentApk.permissions.length} total (
            <span className="text-rose-400">
              {currentApk.permissionDetails.filter((p) => p.protectionLevel === "dangerous").length} dangerous
            </span>
            )
          </div>
        </div>

        <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-neutral-500 text-[11px]">COMPONENTS</div>
          <div className="text-neutral-200 font-semibold tabular-nums mt-1">
            {currentApk.activities.length} acts · {currentApk.services.length} servs
          </div>
        </div>

        <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
          <div className="text-neutral-500 text-[11px]">SIGNING KEY</div>
          <div
            className={`font-semibold truncate mt-1 ${
              currentApk.certificate.isDebug ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {currentApk.certificate.isDebug ? "DEBUG KEY (UNTRUSTED)" : "RELEASE SIGNED"}
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-neutral-800 font-mono text-xs gap-2">
        <button
          onClick={() => setSubTab("perms")}
          className={`pb-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            subTab === "perms"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Permissions ({currentApk.permissions.length})</span>
        </button>

        <button
          onClick={() => setSubTab("manifest")}
          className={`pb-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            subTab === "manifest"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>AndroidManifest.xml</span>
        </button>

        <button
          onClick={() => setSubTab("components")}
          className={`pb-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            subTab === "components"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Components ({currentApk.components.length || currentApk.activities.length + currentApk.services.length})</span>
        </button>

        <button
          onClick={() => setSubTab("dex")}
          className={`pb-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            subTab === "dex"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Binary className="w-3.5 h-3.5" />
          <span>DEX Bytecode & Strings</span>
        </button>

        <button
          onClick={() => setSubTab("cert")}
          className={`pb-2.5 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            subTab === "cert"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Certificates & Keystore</span>
        </button>
      </div>

      {/* Tab 1: Permissions Matrix */}
      {subTab === "perms" && (
        <div className="space-y-4 font-mono">
          <div className="flex items-center gap-2 p-2 rounded bg-neutral-900 border border-neutral-800">
            <Search className="w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              placeholder="Filter permissions by name or category (e.g. SMS, CAMERA, PRIVACY)..."
              className="bg-transparent border-0 outline-none text-xs text-neutral-100 flex-1 placeholder:text-neutral-600"
            />
            {permSearch && (
              <button
                onClick={() => setPermSearch("")}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-2">
            {filteredPerms.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                No permissions matching query.
              </div>
            ) : (
              filteredPerms.map((perm) => {
                const isDangerous = perm.protectionLevel === "dangerous";
                return (
                  <div
                    key={perm.name}
                    className="p-3 rounded bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isDangerous
                              ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                              : "bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          {isDangerous ? "DANGEROUS" : "NORMAL"}
                        </span>
                        <span className="text-xs font-semibold text-neutral-200">
                          {perm.name}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">{perm.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="text-neutral-500 text-[11px]">{perm.category}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-neutral-400 text-xs">
                        Risk Weight:{" "}
                        <strong
                          className={
                            perm.riskWeight >= 8
                              ? "text-rose-400"
                              : perm.riskWeight >= 5
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }
                        >
                          {perm.riskWeight}/10
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: AndroidManifest.xml */}
      {subTab === "manifest" && (
        <div className="space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Decoded Android Binary XML (AXML) into standard readable XML structure
            </span>
            <div className="flex items-center gap-2">
              {onNavigateToDecompiler && (
                <button
                  onClick={onNavigateToDecompiler}
                  className="px-2.5 py-1 text-xs rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900 transition-colors flex items-center gap-1"
                >
                  <span>Edit in Code Studio →</span>
                </button>
              )}
              <button
                onClick={handleCopyManifest}
                className="px-2.5 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1 transition-colors"
              >
                {copiedManifest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedManifest ? "Copied" : "Copy Manifest"}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 overflow-x-auto max-h-[600px] leading-relaxed select-text">
            {currentApk.manifestXml}
          </pre>
        </div>
      )}

      {/* Tab 3: Components */}
      {subTab === "components" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Activities */}
            <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="text-neutral-400 font-bold uppercase text-[11px] flex items-center justify-between">
                <span>Activities ({currentApk.activities.length})</span>
                <span className="text-neutral-500">App entry points & screens</span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {currentApk.activities.length === 0 ? (
                  <div className="text-neutral-500 text-xs py-2">No activities declared</div>
                ) : (
                  currentApk.activities.map((act) => (
                    <div key={act} className="p-2 rounded bg-neutral-950/70 border border-neutral-800/80 truncate text-neutral-300">
                      {act}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Services */}
            <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="text-neutral-400 font-bold uppercase text-[11px] flex items-center justify-between">
                <span>Services ({currentApk.services.length})</span>
                <span className="text-neutral-500">Background tasks & daemons</span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {currentApk.services.length === 0 ? (
                  <div className="text-neutral-500 text-xs py-2">No background services declared</div>
                ) : (
                  currentApk.services.map((srv) => (
                    <div key={srv} className="p-2 rounded bg-neutral-950/70 border border-neutral-800/80 truncate text-neutral-300">
                      {srv}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Receivers */}
            <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="text-neutral-400 font-bold uppercase text-[11px] flex items-center justify-between">
                <span>Broadcast Receivers ({currentApk.receivers.length})</span>
                <span className="text-neutral-500">System event triggers (Boot, SMS, Network)</span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {currentApk.receivers.length === 0 ? (
                  <div className="text-neutral-500 text-xs py-2">No broadcast receivers declared</div>
                ) : (
                  currentApk.receivers.map((rec) => (
                    <div key={rec} className="p-2 rounded bg-neutral-950/70 border border-neutral-800/80 truncate text-neutral-300">
                      {rec}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Providers */}
            <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="text-neutral-400 font-bold uppercase text-[11px] flex items-center justify-between">
                <span>Content Providers ({currentApk.providers.length})</span>
                <span className="text-neutral-500">Database & file sharing handlers</span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {currentApk.providers.length === 0 ? (
                  <div className="text-neutral-500 text-xs py-2">No content providers declared</div>
                ) : (
                  currentApk.providers.map((prv) => (
                    <div key={prv} className="p-2 rounded bg-neutral-950/70 border border-neutral-800/80 truncate text-neutral-300">
                      {prv}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: DEX Bytecode & Strings */}
      {subTab === "dex" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
              <div className="text-neutral-500 text-[11px]">DEX HEADER MAGIC</div>
              <div className="text-neutral-200 font-semibold mt-1">{currentApk.dexInfo.magic}</div>
            </div>
            <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
              <div className="text-neutral-500 text-[11px]">ESTIMATED CLASSES</div>
              <div className="text-neutral-200 font-semibold tabular-nums mt-1">{currentApk.dexInfo.classCount}</div>
            </div>
            <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
              <div className="text-neutral-500 text-[11px]">METHOD REFERENCES</div>
              <div className="text-neutral-200 font-semibold tabular-nums mt-1">{currentApk.dexInfo.methodCount}</div>
            </div>
            <div className="p-3 rounded bg-neutral-900 border border-neutral-800">
              <div className="text-neutral-500 text-[11px]">MULTI-DEX</div>
              <div className="text-neutral-200 font-semibold mt-1">{currentApk.dexInfo.hasMultiDex ? "Yes (Split DEX)" : "No (Single DEX)"}</div>
            </div>
          </div>

          <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="text-neutral-300 font-bold uppercase text-xs flex items-center justify-between">
              <span>Suspicious API & Dynamic Code String Detections</span>
              <span className="text-neutral-500">Reflection, shell invocation, and dynamic loaders</span>
            </div>

            {currentApk.dexInfo.suspiciousStrings.length === 0 ? (
              <div className="p-3 rounded bg-neutral-950 text-neutral-400 text-xs">
                No high-risk static string patterns (DexClassLoader, /system/bin/sh, su) detected.
              </div>
            ) : (
              <div className="space-y-2">
                {currentApk.dexInfo.suspiciousStrings.map((str) => (
                  <div
                    key={str}
                    className="p-2.5 rounded bg-rose-950/30 border border-rose-900/60 text-rose-300 flex items-center justify-between"
                  >
                    <span>{str}</span>
                    <span className="text-[10px] uppercase font-bold text-rose-400">DETECTED IN DEX BYTECODE</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {currentApk.dexInfo.nativeLibraries.length > 0 && (
            <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="text-neutral-300 font-bold uppercase text-xs">Native C/C++ Libraries (/lib/*.so)</div>
              <div className="flex flex-wrap gap-2">
                {currentApk.dexInfo.nativeLibraries.map((lib) => (
                  <span key={lib} className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs">
                    {lib}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Certificates & Keystore */}
      {subTab === "cert" && (
        <div className="space-y-4 font-mono text-xs">
          <div
            className={`p-4 rounded border ${
              currentApk.certificate.isDebug
                ? "bg-rose-950/30 border-rose-800/80 text-rose-300"
                : "bg-emerald-950/30 border-emerald-800/80 text-emerald-300"
            }`}
          >
            <div className="font-bold text-sm mb-1">
              {currentApk.certificate.isDebug
                ? "WARNING: Signed with Android Public Debug Keystore"
                : "VALID: Signed with Authenticated Developer Keystore"}
            </div>
            <p className="text-xs opacity-90">
              {currentApk.certificate.isDebug
                ? "This APK was compiled with the default test keystore (CN=Android Debug). Untrusted for production or enterprise installation."
                : "The cryptographic certificate appears to be a legitimate non-debug developer identity key."}
            </p>
          </div>

          <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-3">
            <div>
              <div className="text-neutral-500 text-[11px]">CERTIFICATE SUBJECT</div>
              <div className="text-neutral-200 font-semibold mt-1">{currentApk.certificate.subject}</div>
            </div>
            <div>
              <div className="text-neutral-500 text-[11px]">ISSUER</div>
              <div className="text-neutral-200 mt-1">{currentApk.certificate.issuer}</div>
            </div>
            <div>
              <div className="text-neutral-500 text-[11px]">SIGNATURE SCHEMES</div>
              <div className="text-neutral-200 mt-1">{currentApk.certificate.schemes.join(" · ")}</div>
            </div>
            <div>
              <div className="text-neutral-500 text-[11px]">SHA-1 FINGERPRINT</div>
              <div className="text-neutral-300 text-xs bg-neutral-950 p-2 rounded border border-neutral-800 select-all mt-1">
                {currentApk.certificate.fingerprintSha1 || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-neutral-500 text-[11px]">SHA-256 FINGERPRINT</div>
              <div className="text-neutral-300 text-xs bg-neutral-950 p-2 rounded border border-neutral-800 select-all mt-1">
                {currentApk.certificate.fingerprintSha256 || "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
