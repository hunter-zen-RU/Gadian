import React, { useState, useMemo } from "react";
import {
  FolderArchive,
  Image as ImageIcon,
  FileJson,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  Download,
  Upload,
  Plus,
  Search,
  Eye,
  Check,
  AlertTriangle,
  Lock,
  Binary,
  Code2,
  Layers,
  Sparkles,
  Volume2,
  FileText,
  Save,
  RotateCcw,
} from "lucide-react";
import { ApkAnalysisData } from "../types/apk";
import {
  ApkAsset,
  AssetCategory,
  extractAssetsFromApk,
  packageAssetsZip,
} from "../utils/apkAssetManager";
import { recompileAndExportApk, triggerApkDownload } from "../utils/apkCompiler";

interface AssetManagerProps {
  currentApk: ApkAnalysisData;
}

export const AssetManager: React.FC<AssetManagerProps> = ({ currentApk }) => {
  const initialAssets = useMemo(() => extractAssetsFromApk(currentApk), [currentApk]);
  const [assets, setAssets] = useState<ApkAsset[]>(initialAssets);
  const [selectedAsset, setSelectedAsset] = useState<ApkAsset | null>(initialAssets[0] || null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isExporting, setIsExporting] = useState(false);
  const [isRecompiling, setIsRecompiling] = useState(false);
  const [recompileLogs, setRecompileLogs] = useState<string[]>([]);

  // Editing state for selected asset
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New asset modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPath, setNewPath] = useState("assets/custom_payload.json");
  const [newCategory, setNewCategory] = useState<AssetCategory>("config");
  const [newContent, setNewContent] = useState('{\n  "custom_feature": true\n}');

  // Update assets when target APK changes
  React.useEffect(() => {
    const updated = extractAssetsFromApk(currentApk);
    setAssets(updated);
    setSelectedAsset(updated[0] || null);
    setIsEditing(false);
  }, [currentApk]);

  // When selectedAsset changes, sync editedContent
  React.useEffect(() => {
    if (selectedAsset) {
      setEditedContent(selectedAsset.content || "");
      setIsEditing(false);
    }
  }, [selectedAsset]);

  const filteredAssets = assets.filter((a) => {
    const matchQuery =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.path.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "ALL" || a.category === categoryFilter;
    return matchQuery && matchCat;
  });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: assets.length };
    for (const a of assets) {
      counts[a.category] = (counts[a.category] || 0) + 1;
    }
    return counts;
  }, [assets]);

  const handleDownloadAll = async () => {
    try {
      setIsExporting(true);
      const blob = await packageAssetsZip(assets);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentApk.appName}_all_assets_and_src.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to package assets:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSingle = (asset: ApkAsset) => {
    const blob = new Blob([asset.content || `[BINARY_CONTENT: ${asset.name}]`], {
      type: asset.mimeType,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = asset.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveAssetEdit = () => {
    if (!selectedAsset) return;
    setAssets((prev) =>
      prev.map((a) =>
        a.id === selectedAsset.id
          ? { ...a, content: editedContent, size: editedContent.length }
          : a
      )
    );
    setSelectedAsset((prev) => (prev ? { ...prev, content: editedContent, size: editedContent.length } : null));
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddAsset = () => {
    if (!newPath.trim()) return;
    const isSrc = newPath.startsWith("src/");
    const isRes = newPath.startsWith("res/");
    const detectedCat: AssetCategory = isSrc
      ? "source"
      : isRes && newPath.includes("layout")
      ? "layout"
      : isRes && newPath.includes("drawable")
      ? "images"
      : newCategory;

    const newAsset: ApkAsset = {
      id: `custom-${Date.now()}`,
      path: newPath.trim(),
      name: newPath.split("/").pop() || "custom.txt",
      category: detectedCat,
      size: newContent.length,
      mimeType: newPath.endsWith(".json")
        ? "application/json"
        : newPath.endsWith(".xml")
        ? "application/xml"
        : newPath.endsWith(".java")
        ? "text/x-java-source"
        : "text/plain",
      securityRisk: "NONE",
      previewType: newPath.endsWith(".json")
        ? "json"
        : newPath.endsWith(".xml")
        ? "xml"
        : "text",
      content: newContent,
    };
    setAssets([newAsset, ...assets]);
    setSelectedAsset(newAsset);
    setShowAddModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isImage = file.type.startsWith("image/");
    const isText =
      file.type.startsWith("text/") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".xml") ||
      file.name.endsWith(".java");

    if (isImage) {
      reader.readAsDataURL(file);
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const asset: ApkAsset = {
          id: `upload-${Date.now()}`,
          path: `res/drawable/${file.name}`,
          name: file.name,
          category: "images",
          size: file.size,
          mimeType: file.type || "image/png",
          securityRisk: "NONE",
          previewType: "image",
          content: dataUrl,
        };
        setAssets([asset, ...assets]);
        setSelectedAsset(asset);
      };
    } else {
      reader.readAsText(file);
      reader.onload = () => {
        const textContent = reader.result as string;
        const isJava = file.name.endsWith(".java");
        const asset: ApkAsset = {
          id: `upload-${Date.now()}`,
          path: isJava ? `src/${currentApk.packageName.replace(/\./g, "/")}/${file.name}` : `assets/${file.name}`,
          name: file.name,
          category: isJava ? "source" : "config",
          size: file.size,
          mimeType: file.type || "text/plain",
          securityRisk: "NONE",
          previewType: file.name.endsWith(".json") ? "json" : file.name.endsWith(".xml") ? "xml" : "text",
          content: textContent,
        };
        setAssets([asset, ...assets]);
        setSelectedAsset(asset);
      };
    }
  };

  const handleRecompileApk = async () => {
    try {
      setIsRecompiling(true);
      setRecompileLogs(["[*] Compiling all modified assets & source code into APK..."]);

      const compileFiles = assets.map((a) => ({
        path: a.path,
        content: a.content || `[BINARY_CONTENT: ${a.name}]`,
      }));

      const result = await recompileAndExportApk(
        compileFiles,
        currentApk.appName,
        currentApk.packageName,
        (p) => {
          setRecompileLogs((prev) => [...prev, `[${p.step.toUpperCase()}] ${p.message}`]);
        }
      );

      if (result.success && result.apkBlob) {
        triggerApkDownload(result.apkBlob, result.apkFileName);
      }
    } catch (err) {
      console.error("Recompilation error:", err);
    } finally {
      setIsRecompiling(false);
    }
  };

  const criticalCount = assets.filter((a) => a.securityRisk === "CRITICAL").length;
  const highCount = assets.filter((a) => a.securityRisk === "HIGH").length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="p-5 rounded bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-neutral-200 font-bold text-sm">
              Universal APK Asset & Source Catalog
            </span>
            <span className="text-neutral-500 text-xs">·</span>
            <span className="text-neutral-400 text-xs">{currentApk.appName}</span>
          </div>
          <p className="text-neutral-400 text-[11px] max-w-3xl leading-relaxed">
            Full project asset inspection including decompiled Java sources (`/src`), drawables (`/res/drawable`), layouts (`/res/layout`), string resources, web assets, and cryptographic signatures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload File</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Asset</span>
          </button>

          <button
            onClick={handleRecompileApk}
            disabled={isRecompiling}
            className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isRecompiling ? "Compiling APK..." : "Recompile & Export APK"}</span>
          </button>

          <button
            onClick={handleDownloadAll}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Packing..." : "Export All (.zip)"}</span>
          </button>
        </div>
      </div>

      {/* Security Threat Summary */}
      {(criticalCount > 0 || highCount > 0) && (
        <div className="p-4 rounded bg-rose-950/30 border border-rose-800/80 text-rose-300 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-xs uppercase">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Asset Security Threat Warning</span>
          </div>
          <p className="text-[11px] text-neutral-300">
            Detected {criticalCount} CRITICAL and {highCount} HIGH risk items in this APK archive (e.g. secondary executable droppers, overlay traps, or unencrypted C2 endpoints).
          </p>
        </div>
      )}

      {/* Category Pills & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: "ALL", label: "All Items" },
            { id: "source", label: "Source Code (src/)" },
            { id: "images", label: "Drawables & Icons" },
            { id: "layout", label: "Layouts (res/layout)" },
            { id: "values", label: "Strings & Values" },
            { id: "web", label: "Web Bundles (assets/)" },
            { id: "config", label: "Configs & Manifest" },
            { id: "binaries", label: "Native (.so) & Dex" },
            { id: "crypto", label: "Signatures (META-INF)" },
          ].map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-bold"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded bg-neutral-900 border border-neutral-800">
          <Search className="w-3.5 h-3.5 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search across all files by path or name (e.g. MainActivity.java, ic_launcher, strings.xml)..."
            className="bg-transparent border-0 outline-none text-neutral-100 flex-1 placeholder:text-neutral-600 text-xs"
          />
        </div>
      </div>

      {/* 2-Column Studio: Left File List & Right Interactive Preview/Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Asset File Catalog (6 cols) */}
        <div className="lg:col-span-6 rounded bg-neutral-950 border border-neutral-800 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between text-neutral-400 text-[11px]">
            <span>FILE PATH & REPOSITORY ({filteredAssets.length})</span>
            <span>CATEGORY / RISK</span>
          </div>

          <div className="divide-y divide-neutral-800/80 max-h-[620px] overflow-y-auto">
            {filteredAssets.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">No assets match your search or filter.</div>
            ) : (
              filteredAssets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-3 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs ${
                      isSelected
                        ? "bg-neutral-850 border-l-2 border-emerald-400 text-neutral-100"
                        : "hover:bg-neutral-900/60 text-neutral-300"
                    }`}
                  >
                    <div className="space-y-0.5 truncate flex-1">
                      <div className="font-semibold truncate flex items-center gap-1.5">
                        {asset.category === "source" ? (
                          <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : asset.category === "images" ? (
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : asset.category === "layout" ? (
                          <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        ) : asset.category === "binaries" ? (
                          <Binary className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        )}
                        <span className="truncate">{asset.path}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 flex items-center gap-2">
                        <span>{(asset.size / 1024).toFixed(1)} KB</span>
                        <span>·</span>
                        <span className="uppercase text-neutral-400">{asset.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {asset.securityRisk === "CRITICAL" ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                          CRITICAL
                        </span>
                      ) : asset.securityRisk === "HIGH" ? (
                        <span className="px-2 py-0.5 rounded bg-rose-900/50 text-rose-400 text-[10px] font-bold">
                          HIGH
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px]">
                          CLEAN
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Asset Detail, Previewer & In-Place Editor (6 cols) */}
        <div className="lg:col-span-6 rounded bg-neutral-950 border border-neutral-800 p-4 space-y-4 flex flex-col justify-between">
          {selectedAsset ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="space-y-0.5 truncate">
                  <div className="font-bold text-neutral-100 text-xs truncate flex items-center gap-2">
                    <span>{selectedAsset.name}</span>
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px] uppercase">
                      {selectedAsset.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate">{selectedAsset.path}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedAsset.content && (
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                        isEditing
                          ? "bg-amber-600 text-neutral-950 font-bold"
                          : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                      }`}
                    >
                      <Code2 className="w-3 h-3" />
                      <span>{isEditing ? "Viewing Mode" : "Edit Asset"}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDownloadSingle(selectedAsset)}
                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Security Risk Notice */}
              {selectedAsset.riskDetail && (
                <div className="p-3 rounded bg-rose-950/30 border border-rose-800/80 text-rose-300 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Security Threat Detected:</span>
                  </div>
                  <p>{selectedAsset.riskDetail}</p>
                </div>
              )}

              {/* In-Place Content Editor / Previewer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase font-bold">
                  <span>Asset Content ({selectedAsset.previewType}):</span>
                  {isEditing && (
                    <span className="text-amber-400 font-normal">Editing mode active</span>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={14}
                      className="w-full p-3 rounded bg-neutral-900 border border-neutral-700 text-neutral-100 font-mono text-[11px] leading-relaxed outline-none focus:border-emerald-500"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setEditedContent(selectedAsset.content || "");
                          setIsEditing(false);
                        }}
                        className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSaveAssetEdit}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                ) : selectedAsset.previewType === "image" ? (
                  <div className="p-6 rounded bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center gap-3">
                    <img
                      src={selectedAsset.content}
                      alt={selectedAsset.name}
                      className="max-h-48 max-w-full rounded shadow-lg border border-neutral-700"
                    />
                    <div className="text-[10px] text-neutral-400">
                      Raster Image Preview (PNG/Drawable)
                    </div>
                  </div>
                ) : selectedAsset.previewType === "audio" ? (
                  <div className="p-6 rounded bg-neutral-900 border border-neutral-800 text-center space-y-2">
                    <Volume2 className="w-8 h-8 mx-auto text-cyan-400 animate-pulse" />
                    <div className="text-neutral-200 font-bold">{selectedAsset.name}</div>
                    <div className="text-neutral-500 text-[10px]">
                      Audio Resource ({selectedAsset.mimeType})
                    </div>
                  </div>
                ) : selectedAsset.previewType === "binary" ? (
                  <div className="p-6 rounded bg-neutral-900 border border-neutral-800 text-center text-neutral-400 space-y-2">
                    <Binary className="w-8 h-8 mx-auto text-amber-400" />
                    <div className="font-bold text-neutral-200">
                      Compiled Bytecode / Shared Object ELF Container
                    </div>
                    <div className="text-[10px] text-neutral-500 max-w-xs mx-auto">
                      Raw architecture binary ({selectedAsset.mimeType}). To inspect disassembled class bytecodes, switch to the Decompiler Studio tab.
                    </div>
                  </div>
                ) : (
                  <pre className="p-3 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] overflow-auto max-h-[380px] leading-relaxed select-text font-mono">
                    {selectedAsset.content}
                  </pre>
                )}

                {savedSuccess && (
                  <div className="p-2 rounded bg-emerald-950 text-emerald-300 text-center text-[11px] font-bold">
                    Asset modified successfully!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-neutral-500">Select an asset to inspect.</div>
          )}

          <div className="pt-3 border-t border-neutral-800 text-[10px] text-neutral-500 flex items-center justify-between">
            <span>Size: {selectedAsset ? `${(selectedAsset.size / 1024).toFixed(2)} KB` : "0 KB"}</span>
            <span>MIME: {selectedAsset?.mimeType || "application/octet-stream"}</span>
          </div>
        </div>
      </div>

      {/* Recompile Progress Logs */}
      {recompileLogs.length > 0 && (
        <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-300 font-bold text-xs">
            <span>APK Recompilation Output Console</span>
            <button
              onClick={() => setRecompileLogs([])}
              className="text-neutral-500 hover:text-neutral-300 text-[10px]"
            >
              Clear
            </button>
          </div>
          <div className="p-3 rounded bg-neutral-950 font-mono text-[10px] text-emerald-400 space-y-1 max-h-36 overflow-y-auto">
            {recompileLogs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Custom Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded bg-neutral-900 border border-neutral-800 p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-100 text-sm">Add New Asset / Source to APK</span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-neutral-400 block mb-1">Target Path (e.g. src/... or res/... or assets/...):</label>
                <input
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="src/com/example/Helper.java or assets/config.json"
                  className="w-full p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Category:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AssetCategory)}
                  className="w-full p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 outline-none text-xs"
                >
                  <option value="source">Source Code (src/)</option>
                  <option value="config">Configuration / JSON</option>
                  <option value="layout">Layout XML (res/layout)</option>
                  <option value="values">Values XML (res/values)</option>
                  <option value="images">Drawables & Images</option>
                  <option value="web">Web Bundles</option>
                  <option value="other">Other Asset</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Content:</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  className="w-full p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAsset}
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold"
              >
                Insert Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
