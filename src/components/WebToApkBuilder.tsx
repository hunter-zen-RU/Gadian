import React, { useState } from "react";
import {
  Globe,
  Smartphone,
  Download,
  Settings,
  Code2,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
  Terminal,
  Sparkles,
  Layers,
  WifiOff,
  Palette,
  Image as ImageIcon,
  Play,
  RotateCcw,
  Sliders,
  Camera,
  MapPin,
  RefreshCw,
  FolderArchive,
  Gamepad2,
  Upload,
} from "lucide-react";
import {
  WebToApkConfig,
  generateWebToApkFiles,
  createWebToApkZip,
} from "../utils/webToApkGenerator";
import { recompileAndExportApk, triggerApkDownload, CompileProgress } from "../utils/apkCompiler";

export const WebToApkBuilder: React.FC = () => {
  const [config, setConfig] = useState<WebToApkConfig>({
    url: "https://example.com",
    appName: "My Web App",
    packageName: "com.webapp.mobile",
    versionName: "1.0.0",
    versionCode: 1,
    orientation: "portrait",

    // Theming
    statusBarColor: "#090d16",
    navBarColor: "#090d16",
    statusBarStyle: "light_icons",
    enableFullscreen: false,

    // Splash Screen
    enableSplash: true,
    splashDurationMs: 2500,
    splashBgColor: "#090d16",
    splashTitle: "My Web App",
    splashSubtitle: "Fast · Secure · Native",
    splashIcon: "globe",
    splashAnimation: "fade",

    // App Icon
    iconSymbol: "globe",
    iconBgColor: "#10b981",
    iconShape: "squircle",

    // WebView
    enableCache: true,
    enableSwipeRefresh: true,
    enableCamera: false,
    enableGeolocation: false,
    enableFileUploads: true,
    enableZoom: true,
    userAgentMode: "default",
    externalLinkHandling: "in_app",
    allowedDomains: "",

    // Offline
    offlineTitle: "Connection Lost",
    offlineMessage: "Could not reach target web address. Please check your network.",
    offlineRetryText: "Retry Connection",
    enableOfflineGame: true,
  });

  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "app" | "splash" | "icon" | "theme" | "webview" | "offline"
  >("app");
  const [activePreviewMode, setActivePreviewMode] = useState<
    "splash" | "webapp" | "homescreen" | "offline"
  >("splash");
  const [activeCodeTab, setActiveCodeTab] = useState<"java" | "manifest" | "splash" | "offline">("java");

  // Replay splash animation state
  const [splashKey, setSplashKey] = useState(0);

  // Compilation & Export states
  const [isCompilingApk, setIsCompilingApk] = useState(false);
  const [isPackagingZip, setIsPackagingZip] = useState(false);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [compileSuccess, setCompileSuccess] = useState<boolean | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const files = generateWebToApkFiles(config);
  const javaFile = files.find((f) => f.path.endsWith("MainActivity.java"));
  const splashFile = files.find((f) => f.path.endsWith("SplashActivity.java"));
  const manifestFile = files.find((f) => f.path === "AndroidManifest.xml");
  const offlineFile = files.find((f) => f.path.endsWith("offline.html"));

  const handleDownloadZip = async () => {
    try {
      setIsPackagingZip(true);
      const blob = await createWebToApkZip(config);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.appName.replace(/\s+/g, "_")}_WebToApk_AIDE.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to build web-to-apk zip:", err);
    } finally {
      setIsPackagingZip(false);
    }
  };

  const handleCompileAndDownloadApk = async () => {
    try {
      setIsCompilingApk(true);
      setCompileSuccess(null);
      setCompileLogs(["[*] Compiling Web-To-APK wrapper into native Android binary..."]);

      const compileFiles = files.map((f) => ({
        path: f.path,
        content: f.content,
      }));

      const result = await recompileAndExportApk(
        compileFiles,
        config.appName,
        config.packageName,
        (progress) => {
          setCompileLogs((prev) => [...prev, `[${progress.step.toUpperCase()}] ${progress.message}`]);
        }
      );

      if (result.success && result.apkBlob) {
        setCompileSuccess(true);
        triggerApkDownload(result.apkBlob, `${config.appName.replace(/\s+/g, "_")}.apk`);
      } else {
        setCompileSuccess(false);
      }
    } catch (err) {
      console.error("Compilation failed:", err);
      setCompileSuccess(false);
    } finally {
      setIsCompilingApk(false);
    }
  };

  const handleCopyActiveCode = () => {
    const code =
      activeCodeTab === "java"
        ? javaFile?.content
        : activeCodeTab === "splash"
        ? splashFile?.content
        : activeCodeTab === "manifest"
        ? manifestFile?.content
        : offlineFile?.content;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const curlSnippet = `curl -X POST https://${window.location.host}/api/web-to-apk \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "${config.url}",
    "appName": "${config.appName}",
    "packageName": "${config.packageName}",
    "orientation": "${config.orientation}",
    "enableCache": ${config.enableCache},
    "enableSplash": ${config.enableSplash}
  }'`;

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="p-5 rounded bg-neutral-900 border border-neutral-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs">
              <Globe className="w-4 h-4" />
              <span>GADIAN Web-To-APK Generator · Advanced Android Studio</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-100">
              Convert Websites & PWAs into Production Android APKs
            </h2>
            <p className="text-neutral-400 text-xs max-w-3xl leading-relaxed">
              Full visual customizer with animated splash screen, customized app icon, hardware acceleration, offline fallback gaming, and direct on-device AIDE or APK binary compilation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCompileAndDownloadApk}
              disabled={isCompilingApk}
              className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isCompilingApk ? "Compiling APK..." : "Compile & Download .APK"}</span>
            </button>

            <button
              onClick={handleDownloadZip}
              disabled={isPackagingZip}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isPackagingZip ? "Packing..." : "Download AIDE Project (.zip)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Configuration on Left (7 cols) & Phone Preview on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Tab Configuration Workbench (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded bg-neutral-950 border border-neutral-800 space-y-5">
          {/* Settings Section Tabs */}
          <div className="flex items-center overflow-x-auto gap-1 border-b border-neutral-800 pb-2">
            {[
              { id: "app", label: "App & URL", icon: Globe },
              { id: "splash", label: "Splash Screen", icon: Sparkles },
              { id: "icon", label: "App Icon", icon: ImageIcon },
              { id: "theme", label: "Theming & UI", icon: Palette },
              { id: "webview", label: "WebView & HW", icon: Settings },
              { id: "offline", label: "Offline Mode", icon: WifiOff },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSettingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-bold"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: App & URL */}
          {activeSettingsTab === "app" && (
            <div className="space-y-4">
              <div>
                <label className="text-neutral-400 block mb-1">Target Web URL (PWA / Website):</label>
                <input
                  type="url"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://my-app.com"
                  className="w-full p-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 focus:border-emerald-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">App Name (Launcher Title):</label>
                  <input
                    type="text"
                    value={config.appName}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        appName: e.target.value,
                        splashTitle: config.splashTitle === config.appName ? e.target.value : config.splashTitle,
                      })
                    }
                    className="w-full p-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Package Name (ApplicationId):</label>
                  <input
                    type="text"
                    value={config.packageName}
                    onChange={(e) => setConfig({ ...config, packageName: e.target.value })}
                    className="w-full p-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-100 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Version Name:</label>
                  <input
                    type="text"
                    value={config.versionName}
                    onChange={(e) => setConfig({ ...config, versionName: e.target.value })}
                    className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Version Code:</label>
                  <input
                    type="number"
                    value={config.versionCode}
                    onChange={(e) => setConfig({ ...config, versionCode: Number(e.target.value) || 1 })}
                    className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Orientation:</label>
                  <select
                    value={config.orientation}
                    onChange={(e) => setConfig({ ...config, orientation: e.target.value as any })}
                    className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                    <option value="sensor">Auto-Rotate</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Splash Screen */}
          {activeSettingsTab === "splash" && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded bg-neutral-900 border border-neutral-800">
                <input
                  type="checkbox"
                  checked={config.enableSplash}
                  onChange={(e) => setConfig({ ...config, enableSplash: e.target.checked })}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-neutral-200 font-bold">Enable Animated Splash Screen</span>
              </label>

              {config.enableSplash && (
                <div className="space-y-3 p-4 rounded bg-neutral-900/40 border border-neutral-800/80">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-neutral-400 block mb-1">
                        Splash Duration: {(config.splashDurationMs / 1000).toFixed(1)}s
                      </label>
                      <input
                        type="range"
                        min="1000"
                        max="5000"
                        step="500"
                        value={config.splashDurationMs}
                        onChange={(e) => setConfig({ ...config, splashDurationMs: Number(e.target.value) })}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-neutral-400 block mb-1">Animation Style:</label>
                      <select
                        value={config.splashAnimation}
                        onChange={(e) => setConfig({ ...config, splashAnimation: e.target.value as any })}
                        className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                      >
                        <option value="fade">Fade In</option>
                        <option value="zoom">Zoom Scale</option>
                        <option value="slide">Slide Up</option>
                        <option value="pulse">Pulse Glow</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-neutral-400 block mb-1">Splash Title:</label>
                      <input
                        type="text"
                        value={config.splashTitle}
                        onChange={(e) => setConfig({ ...config, splashTitle: e.target.value })}
                        className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400 block mb-1">Splash Subtitle / Tagline:</label>
                      <input
                        type="text"
                        value={config.splashSubtitle}
                        onChange={(e) => setConfig({ ...config, splashSubtitle: e.target.value })}
                        className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">Splash Background Color:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.splashBgColor}
                        onChange={(e) => setConfig({ ...config, splashBgColor: e.target.value })}
                        className="w-10 h-8 rounded bg-transparent cursor-pointer border border-neutral-800"
                      />
                      <input
                        type="text"
                        value={config.splashBgColor}
                        onChange={(e) => setConfig({ ...config, splashBgColor: e.target.value })}
                        className="flex-1 p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                      />
                      {["#090d16", "#000000", "#0f172a", "#1e1b4b", "#064e3b"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setConfig({ ...config, splashBgColor: c })}
                          style={{ backgroundColor: c }}
                          className="w-6 h-6 rounded border border-neutral-700 shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: App Icon */}
          {activeSettingsTab === "icon" && (
            <div className="space-y-4">
              <div>
                <label className="text-neutral-400 block mb-1">Select App Icon Symbol:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "globe", label: "Web", icon: Globe },
                    { id: "shield", label: "Shield", icon: ShieldCheck },
                    { id: "rocket", label: "Rocket", icon: Sparkles },
                    { id: "smartphone", label: "Mobile", icon: Smartphone },
                    { id: "code", label: "Dev", icon: Code2 },
                    { id: "store", label: "Shop", icon: Layers },
                    { id: "bolt", label: "Lightning", icon: Play },
                    { id: "terminal", label: "Terminal", icon: Terminal },
                  ].map((sym) => {
                    const Icon = sym.icon;
                    const isSelected = config.iconSymbol === sym.id;
                    return (
                      <button
                        key={sym.id}
                        onClick={() => setConfig({ ...config, iconSymbol: sym.id as any })}
                        className={`p-3 rounded border text-center transition-colors flex flex-col items-center gap-1 ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400 font-bold"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px]">{sym.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Icon Shape:</label>
                  <select
                    value={config.iconShape}
                    onChange={(e) => setConfig({ ...config, iconShape: e.target.value as any })}
                    className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                  >
                    <option value="squircle">Squircle (Android 13+ Adaptive)</option>
                    <option value="rounded">Rounded Rectangle</option>
                    <option value="circle">Full Circle</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Icon Accent Color:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.iconBgColor}
                      onChange={(e) => setConfig({ ...config, iconBgColor: e.target.value })}
                      className="w-10 h-8 rounded bg-transparent cursor-pointer border border-neutral-800"
                    />
                    <input
                      type="text"
                      value={config.iconBgColor}
                      onChange={(e) => setConfig({ ...config, iconBgColor: e.target.value })}
                      className="flex-1 p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Or Upload Custom PNG Icon:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setConfig({ ...config, customIconUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Theming & UI */}
          {activeSettingsTab === "theme" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Status Bar Color:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.statusBarColor}
                      onChange={(e) => setConfig({ ...config, statusBarColor: e.target.value })}
                      className="w-10 h-8 rounded bg-transparent cursor-pointer border border-neutral-800"
                    />
                    <input
                      type="text"
                      value={config.statusBarColor}
                      onChange={(e) => setConfig({ ...config, statusBarColor: e.target.value })}
                      className="flex-1 p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Navigation Bar Color:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.navBarColor}
                      onChange={(e) => setConfig({ ...config, navBarColor: e.target.value })}
                      className="w-10 h-8 rounded bg-transparent cursor-pointer border border-neutral-800"
                    />
                    <input
                      type="text"
                      value={config.navBarColor}
                      onChange={(e) => setConfig({ ...config, navBarColor: e.target.value })}
                      className="flex-1 p-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer p-3 rounded bg-neutral-900 border border-neutral-800">
                <input
                  type="checkbox"
                  checked={config.enableFullscreen}
                  onChange={(e) => setConfig({ ...config, enableFullscreen: e.target.checked })}
                  className="rounded text-emerald-500"
                />
                <span className="text-neutral-200 font-bold">Immersive Fullscreen Mode (Hide Android Status Bar)</span>
              </label>
            </div>
          )}

          {/* TAB 5: WebView & Hardware Options */}
          {activeSettingsTab === "webview" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2 cursor-pointer p-3 rounded bg-neutral-900 border border-neutral-800">
                  <input
                    type="checkbox"
                    checked={config.enableCache}
                    onChange={(e) => setConfig({ ...config, enableCache: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span className="text-neutral-200">Offline Caching (PWA support)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-3 rounded bg-neutral-900 border border-neutral-800">
                  <input
                    type="checkbox"
                    checked={config.enableSwipeRefresh}
                    onChange={(e) => setConfig({ ...config, enableSwipeRefresh: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span className="text-neutral-200">Pull-to-Refresh</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-3 rounded bg-neutral-900 border border-neutral-800">
                  <input
                    type="checkbox"
                    checked={config.enableCamera}
                    onChange={(e) => setConfig({ ...config, enableCamera: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span className="text-neutral-200">Camera Access Support</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-3 rounded bg-neutral-900 border border-neutral-800">
                  <input
                    type="checkbox"
                    checked={config.enableGeolocation}
                    onChange={(e) => setConfig({ ...config, enableGeolocation: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span className="text-neutral-200">Geolocation GPS Support</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-3 rounded bg-neutral-900 border border-neutral-800">
                  <input
                    type="checkbox"
                    checked={config.enableFileUploads}
                    onChange={(e) => setConfig({ ...config, enableFileUploads: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span className="text-neutral-200">HTML5 File Chooser Uploads</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-3 rounded bg-neutral-900 border border-neutral-800">
                  <input
                    type="checkbox"
                    checked={config.enableZoom}
                    onChange={(e) => setConfig({ ...config, enableZoom: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span className="text-neutral-200">Pinch-to-Zoom Gesture</span>
                </label>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">External Link Navigation Policy:</label>
                <select
                  value={config.externalLinkHandling}
                  onChange={(e) => setConfig({ ...config, externalLinkHandling: e.target.value as any })}
                  className="w-full p-2.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                >
                  <option value="in_app">Stay in App (All links open in WebView)</option>
                  <option value="browser">External links open in system default browser</option>
                  <option value="whitelist">Domain Whitelist restriction</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 6: Offline Experience */}
          {activeSettingsTab === "offline" && (
            <div className="space-y-3">
              <div>
                <label className="text-neutral-400 block mb-1">Offline Screen Title:</label>
                <input
                  type="text"
                  value={config.offlineTitle}
                  onChange={(e) => setConfig({ ...config, offlineTitle: e.target.value })}
                  className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Offline Message Description:</label>
                <textarea
                  value={config.offlineMessage}
                  onChange={(e) => setConfig({ ...config, offlineMessage: e.target.value })}
                  rows={3}
                  className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Retry Button Text:</label>
                  <input
                    type="text"
                    value={config.offlineRetryText}
                    onChange={(e) => setConfig({ ...config, offlineRetryText: e.target.value })}
                    className="w-full p-2 rounded bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer p-3 rounded bg-neutral-900 border border-neutral-800 self-end">
                  <input
                    type="checkbox"
                    checked={config.enableOfflineGame}
                    onChange={(e) => setConfig({ ...config, enableOfflineGame: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span className="text-neutral-200">Include Offline Tap Runner Game</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Smartphone Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded bg-neutral-900 border border-neutral-800 text-[11px]">
            <button
              onClick={() => {
                setActivePreviewMode("splash");
                setSplashKey((k) => k + 1);
              }}
              className={`px-2.5 py-1 rounded transition-colors ${
                activePreviewMode === "splash" ? "bg-emerald-600 text-neutral-950 font-bold" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Splash
            </button>
            <button
              onClick={() => setActivePreviewMode("webapp")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activePreviewMode === "webapp" ? "bg-emerald-600 text-neutral-950 font-bold" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Web App
            </button>
            <button
              onClick={() => setActivePreviewMode("homescreen")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activePreviewMode === "homescreen" ? "bg-emerald-600 text-neutral-950 font-bold" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              App Icon
            </button>
            <button
              onClick={() => setActivePreviewMode("offline")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activePreviewMode === "offline" ? "bg-emerald-600 text-neutral-950 font-bold" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Offline
            </button>
          </div>

          {/* Realistic Smartphone Shell */}
          <div className="w-[280px] sm:w-[310px] h-[580px] rounded-[36px] bg-neutral-900 border-[6px] border-neutral-800 shadow-2xl relative flex flex-col overflow-hidden">
            {/* Top Speaker / Camera Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-neutral-800 rounded-full z-30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-neutral-950 mr-2" />
              <div className="w-8 h-1 rounded-full bg-neutral-900" />
            </div>

            {/* Android Status Bar */}
            {!config.enableFullscreen && (
              <div
                style={{ backgroundColor: config.statusBarColor }}
                className="h-7 px-4 pt-1 flex items-center justify-between text-[10px] text-neutral-300 z-20 shrink-0 font-sans"
              >
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* Inner Phone Screen Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-neutral-950">
              {activePreviewMode === "splash" ? (
                /* Splash Screen Simulation */
                <div
                  key={splashKey}
                  style={{ backgroundColor: config.splashBgColor }}
                  className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700"
                >
                  <div
                    style={{
                      backgroundColor: config.iconBgColor,
                      borderRadius:
                        config.iconShape === "circle"
                          ? "9999px"
                          : config.iconShape === "squircle"
                          ? "24px"
                          : "14px",
                    }}
                    className="w-20 h-20 flex items-center justify-center shadow-lg mb-4"
                  >
                    {config.customIconUrl ? (
                      <img src={config.customIconUrl} alt="logo" className="w-16 h-16 rounded object-cover" />
                    ) : (
                      <Globe className="w-10 h-10 text-neutral-950" />
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-neutral-100">{config.splashTitle || config.appName}</h3>
                  <p className="text-xs text-neutral-400 mt-1">{config.splashSubtitle}</p>

                  <div className="mt-8 flex items-center gap-2">
                    <button
                      onClick={() => setSplashKey((k) => k + 1)}
                      className="px-3 py-1 rounded bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-[10px] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Replay Animation</span>
                    </button>
                  </div>
                </div>
              ) : activePreviewMode === "webapp" ? (
                /* Running Web App Simulation */
                <div className="flex-1 flex flex-col">
                  {/* Fake In-App Browser Address Header */}
                  <div className="p-2 bg-neutral-900 border-b border-neutral-800 flex items-center gap-1.5 text-[10px] text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span className="truncate flex-1 font-mono">{config.url}</span>
                    <RefreshCw className="w-3 h-3 text-neutral-500" />
                  </div>

                  {/* Web Page Mock Content */}
                  <div className="flex-1 p-4 bg-neutral-950 text-neutral-100 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="h-6 w-32 bg-neutral-800 rounded animate-pulse" />
                      <div className="h-28 w-full bg-neutral-900 rounded-lg p-3 border border-neutral-800 space-y-2">
                        <div className="h-4 w-40 bg-emerald-500/20 rounded" />
                        <div className="h-3 w-56 bg-neutral-800 rounded" />
                        <div className="h-3 w-48 bg-neutral-800 rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-16 bg-neutral-900 rounded border border-neutral-800" />
                        <div className="h-16 bg-neutral-900 rounded border border-neutral-800" />
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-neutral-600">
                      Hardware Acceleration: Android WebView Engine
                    </div>
                  </div>
                </div>
              ) : activePreviewMode === "homescreen" ? (
                /* Android Home Screen Grid Simulation */
                <div className="flex-1 p-6 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-neutral-950 flex flex-col justify-between">
                  <div className="text-center text-xs text-neutral-400 font-sans mt-4">Tuesday, Oct 6</div>

                  {/* App Icon Grid Item */}
                  <div className="flex flex-col items-center">
                    <div
                      style={{
                        backgroundColor: config.iconBgColor,
                        borderRadius:
                          config.iconShape === "circle"
                            ? "9999px"
                            : config.iconShape === "squircle"
                            ? "22px"
                            : "14px",
                      }}
                      className="w-16 h-16 flex items-center justify-center shadow-xl shadow-emerald-500/10 cursor-pointer"
                    >
                      {config.customIconUrl ? (
                        <img src={config.customIconUrl} alt="icon" className="w-14 h-14 rounded object-cover" />
                      ) : (
                        <Globe className="w-8 h-8 text-neutral-950" />
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-200 font-medium mt-1.5 truncate max-w-[90px]">
                      {config.appName}
                    </span>
                  </div>

                  {/* Bottom Dock */}
                  <div className="h-12 w-full bg-neutral-900/60 backdrop-blur rounded-2xl flex items-center justify-around px-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-800" />
                    <div className="w-8 h-8 rounded-full bg-neutral-800" />
                    <div className="w-8 h-8 rounded-full bg-neutral-800" />
                  </div>
                </div>
              ) : (
                /* Offline Template Preview */
                <div className="flex-1 p-4 bg-neutral-950 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl mb-3">
                    ⚡
                  </div>
                  <h4 className="font-bold text-sm text-cyan-300">{config.offlineTitle}</h4>
                  <p className="text-[11px] text-neutral-400 my-2 max-w-xs">{config.offlineMessage}</p>
                  <button className="w-full py-2 rounded bg-emerald-600 text-neutral-950 font-bold text-xs mt-2">
                    {config.offlineRetryText}
                  </button>
                  {config.enableOfflineGame && (
                    <div className="mt-3 p-2 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 w-full">
                      🎮 Embedded Mini Tap-Jump Game Enabled
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Gesture Navigation Bar */}
            <div
              style={{ backgroundColor: config.navBarColor }}
              className="h-6 flex items-center justify-center z-20 shrink-0"
            >
              <div className="w-24 h-1 bg-neutral-600 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Compiler Progress Logs Console */}
      {compileLogs.length > 0 && (
        <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-300 font-bold text-xs">
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Web-To-APK Compilation Status</span>
            </span>
            {compileSuccess === true && (
              <span className="text-emerald-400 font-bold">.APK GENERATED & DOWNLOADED</span>
            )}
          </div>
          <div className="p-3 rounded bg-neutral-950 font-mono text-[10px] text-emerald-400 space-y-1 max-h-32 overflow-y-auto">
            {compileLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Code Inspector & REST API Snippet Drawer */}
      <div className="p-5 rounded bg-neutral-950 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <div className="font-bold text-neutral-200 text-xs flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Generated AIDE Source Files & REST cURL API</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyActiveCode}
              className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs flex items-center gap-1"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? "Copied" : "Copy Code"}</span>
            </button>
          </div>
        </div>

        {/* Code Tabs */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveCodeTab("java")}
            className={`px-3 py-1 rounded ${
              activeCodeTab === "java" ? "bg-neutral-800 text-emerald-400 font-bold" : "text-neutral-400 hover:bg-neutral-900"
            }`}
          >
            MainActivity.java
          </button>
          {config.enableSplash && (
            <button
              onClick={() => setActiveCodeTab("splash")}
              className={`px-3 py-1 rounded ${
                activeCodeTab === "splash" ? "bg-neutral-800 text-emerald-400 font-bold" : "text-neutral-400 hover:bg-neutral-900"
              }`}
            >
              SplashActivity.java
            </button>
          )}
          <button
            onClick={() => setActiveCodeTab("manifest")}
            className={`px-3 py-1 rounded ${
              activeCodeTab === "manifest" ? "bg-neutral-800 text-emerald-400 font-bold" : "text-neutral-400 hover:bg-neutral-900"
            }`}
          >
            AndroidManifest.xml
          </button>
          <button
            onClick={() => setActiveCodeTab("offline")}
            className={`px-3 py-1 rounded ${
              activeCodeTab === "offline" ? "bg-neutral-800 text-emerald-400 font-bold" : "text-neutral-400 hover:bg-neutral-900"
            }`}
          >
            offline.html
          </button>
        </div>

        <pre className="p-4 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed">
          {activeCodeTab === "java"
            ? javaFile?.content
            : activeCodeTab === "splash"
            ? splashFile?.content
            : activeCodeTab === "manifest"
            ? manifestFile?.content
            : offlineFile?.content}
        </pre>

        {/* REST API cURL snippet */}
        <div className="pt-2">
          <div className="text-neutral-400 text-[11px] mb-1 font-bold flex items-center justify-between">
            <span>Automate via REST API (POST /api/web-to-apk):</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(curlSnippet);
                setCopiedCurl(true);
                setTimeout(() => setCopiedCurl(false), 2000);
              }}
              className="text-emerald-400 hover:underline text-[10px]"
            >
              {copiedCurl ? "Copied curl!" : "Copy curl command"}
            </button>
          </div>
          <pre className="p-2.5 rounded bg-neutral-900 text-neutral-400 font-mono text-[10px] overflow-x-auto">
            {curlSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
