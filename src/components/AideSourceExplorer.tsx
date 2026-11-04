import React, { useState } from "react";
import {
  Download,
  FileCode,
  Folder,
  Copy,
  Check,
  Smartphone,
  Terminal,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { AideFile, getAideProjectFiles } from "../utils/aideProjectGenerator";

interface AideSourceExplorerProps {
  onDownloadAideZip: () => void;
  isDownloadingZip: boolean;
}

export const AideSourceExplorer: React.FC<AideSourceExplorerProps> = ({
  onDownloadAideZip,
  isDownloadingZip,
}) => {
  const files = getAideProjectFiles();
  const [selectedFile, setSelectedFile] = useState<AideFile>(
    files.find((f) => f.name === "MainActivity.java") || files[0]
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-mono text-xs">
      {/* Banner: Targeted for AIDE on Android */}
      <div className="p-6 rounded bg-neutral-900 border border-neutral-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs">
              <Smartphone className="w-4 h-4" />
              <span>Project GADIAN · Native AIDE Android Target</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-100">
              Compilable in AIDE (Android IDE) · No Android Studio Required
            </h2>
            <p className="text-neutral-400 max-w-3xl leading-relaxed">
              Standard Android Studio Gradle projects with AGP 8+ fail to compile inside mobile AIDE apps due to heavy daemon requirements. Project GADIAN is engineered with a pure Java/Android SDK architecture and standard <code className="text-neutral-200">project.properties</code> + Ant/AIDE configuration, enabling instant on-device compilation, APK signing, and execution directly from your Android phone or tablet.
            </p>
          </div>

          <button
            onClick={onDownloadAideZip}
            disabled={isDownloadingZip}
            className="px-5 py-3 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingZip ? "Generating ZIP..." : "Download GADIAN AIDE Project (.zip)"}</span>
          </button>
        </div>
      </div>

      {/* 4-Step Visual AIDE Compilation Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded bg-neutral-950 border border-neutral-800 space-y-1.5">
          <div className="text-emerald-400 font-bold text-xs">01. DOWNLOAD & EXTRACT</div>
          <div className="text-neutral-200 font-semibold">Place in AppProjects</div>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            Download the zip archive and extract it using any file manager (e.g. ZArchiver) to <code className="text-neutral-300">/sdcard/AppProjects/GADIAN</code>.
          </p>
        </div>

        <div className="p-4 rounded bg-neutral-950 border border-neutral-800 space-y-1.5">
          <div className="text-emerald-400 font-bold text-xs">02. OPEN IN AIDE</div>
          <div className="text-neutral-200 font-semibold">Load Native Project</div>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            Launch the AIDE app on your phone. Tap <strong>Open Project</strong> and select the GADIAN directory. AIDE will automatically detect the manifest and SDK targets.
          </p>
        </div>

        <div className="p-4 rounded bg-neutral-950 border border-neutral-800 space-y-1.5">
          <div className="text-emerald-400 font-bold text-xs">03. COMPILE & RUN</div>
          <div className="text-neutral-200 font-semibold">Instant Mobile Build</div>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            Tap the <strong>Run (Play)</strong> icon. AIDE compiles Java bytecode, packages resources, signs with test key, and prompts you to install GADIAN.
          </p>
        </div>

        <div className="p-4 rounded bg-neutral-950 border border-neutral-800 space-y-1.5">
          <div className="text-emerald-400 font-bold text-xs">04. AUDIT OTHER APKS</div>
          <div className="text-neutral-200 font-semibold">Inspect & Recommend</div>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            Use GADIAN on your phone to pick any APK from storage, evaluate permissions, calculate offline risk scores, and check Safety Verdicts!
          </p>
        </div>
      </div>

      {/* Code File Explorer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded border border-neutral-800 bg-neutral-950 overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="p-3 border-r border-neutral-800 bg-neutral-900/60 space-y-1">
          <div className="text-neutral-500 uppercase tracking-wider text-[10px] px-2 py-1">
            GADIAN Source Tree
          </div>

          <div className="space-y-0.5">
            {files.map((file) => {
              const isSelected = file.path === selectedFile.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-2.5 py-1.5 rounded transition-colors flex items-center gap-2 truncate text-xs ${
                    isSelected
                      ? "bg-neutral-800 text-emerald-400 font-semibold"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  }`}
                  title={file.path}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{file.path}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Content Viewer */}
        <div className="md:col-span-3 flex flex-col h-[560px]">
          <div className="p-3 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">File:</span>
              <span className="text-neutral-100 font-semibold">{selectedFile.path}</span>
              <span className="text-neutral-500 text-[10px]">
                ({selectedFile.content.split("\n").length} lines)
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Code"}</span>
            </button>
          </div>

          <pre className="flex-1 overflow-auto p-4 bg-neutral-950 text-neutral-300 text-xs leading-relaxed font-mono select-text">
            {selectedFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
