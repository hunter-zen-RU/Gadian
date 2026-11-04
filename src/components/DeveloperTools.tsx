import React, { useState } from "react";
import {
  Search,
  BookOpen,
  Shield,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { KNOWN_PERMISSIONS } from "../utils/riskEngine";

export const DeveloperTools: React.FC = () => {
  const [permQuery, setPermQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Playground state
  const [hasOverlay, setHasOverlay] = useState(false);
  const [hasAccessibility, setHasAccessibility] = useState(false);
  const [hasSmsBoot, setHasSmsBoot] = useState(false);
  const [hasDropper, setHasDropper] = useState(false);
  const [isDebugKey, setIsDebugKey] = useState(false);
  const [targetSdk, setTargetSdk] = useState(33);

  // Calculate playground risk score
  let simScore = 0;
  if (hasOverlay && hasAccessibility) simScore += 40;
  else if (hasOverlay) simScore += 15;
  else if (hasAccessibility) simScore += 25;

  if (hasSmsBoot) simScore += 25;
  if (hasDropper) simScore += 20;
  if (isDebugKey) simScore += 15;
  if (targetSdk < 28) simScore += 15;
  simScore = Math.min(100, simScore);

  let simVerdict = "SAFE";
  if (simScore >= 70) simVerdict = "MALICIOUS";
  else if (simScore >= 45) simVerdict = "SUSPICIOUS";
  else if (simScore >= 20) simVerdict = "CAUTION";

  const allPermsList = Object.entries(KNOWN_PERMISSIONS).map(([name, data]) => ({
    name,
    ...data,
  }));

  const filteredPerms = allPermsList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(permQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(permQuery.toLowerCase());
    const matchesCat =
      selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-mono text-xs">
      {/* Tool 1: Security Risk Simulator Playground */}
      <div className="p-5 rounded bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs">
          <Sliders className="w-4 h-4" />
          <span>GADIAN Offline Heuristic Simulation Playground</span>
        </div>
        <p className="text-neutral-400">
          Simulate APK manifest configurations and see how GADIAN's heuristic rules calculate the Risk Score (0-100) and Safety Verdict in real time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          <label className="flex items-center gap-2 p-3 rounded bg-neutral-950 border border-neutral-800 cursor-pointer">
            <input
              type="checkbox"
              checked={hasOverlay}
              onChange={(e) => setHasOverlay(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span className="text-neutral-200">SYSTEM_ALERT_WINDOW (Overlay)</span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded bg-neutral-950 border border-neutral-800 cursor-pointer">
            <input
              type="checkbox"
              checked={hasAccessibility}
              onChange={(e) => setHasAccessibility(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span className="text-neutral-200">BIND_ACCESSIBILITY_SERVICE</span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded bg-neutral-950 border border-neutral-800 cursor-pointer">
            <input
              type="checkbox"
              checked={hasSmsBoot}
              onChange={(e) => setHasSmsBoot(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span className="text-neutral-200">READ_SMS + BOOT_COMPLETED</span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded bg-neutral-950 border border-neutral-800 cursor-pointer">
            <input
              type="checkbox"
              checked={hasDropper}
              onChange={(e) => setHasDropper(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span className="text-neutral-200">REQUEST_INSTALL_PACKAGES + INTERNET</span>
          </label>

          <label className="flex items-center gap-2 p-3 rounded bg-neutral-950 border border-neutral-800 cursor-pointer">
            <input
              type="checkbox"
              checked={isDebugKey}
              onChange={(e) => setIsDebugKey(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span className="text-neutral-200">Android Debug Keystore Signed</span>
          </label>

          <div className="p-3 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <span className="text-neutral-300">Target SDK:</span>
            <select
              value={targetSdk}
              onChange={(e) => setTargetSdk(parseInt(e.target.value, 10))}
              className="bg-neutral-900 border border-neutral-700 text-neutral-100 rounded px-2 py-1 text-xs"
            >
              <option value={34}>API 34 (Android 14)</option>
              <option value={33}>API 33 (Android 13)</option>
              <option value={28}>API 28 (Android 9)</option>
              <option value={26}>API 26 (Android 8 - Obsolete)</option>
              <option value={21}>API 21 (Android 5 - Legacy)</option>
            </select>
          </div>
        </div>

        {/* Simulator Verdict Output Bar */}
        <div className="p-3.5 rounded bg-neutral-950 border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400">Simulated Score:</span>
            <span className="text-xl font-bold tabular-nums text-neutral-100">
              {simScore}/100
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Safety Verdict:</span>
            <span
              className={`px-3 py-1 rounded font-bold text-xs ${
                simVerdict === "SAFE"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : simVerdict === "MALICIOUS"
                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                  : "bg-amber-950 text-amber-400 border border-amber-800"
              }`}
            >
              {simVerdict}
            </span>
          </div>
        </div>
      </div>

      {/* Tool 2: Searchable Android Permission Security Dictionary */}
      <div className="p-5 rounded bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs">
            <BookOpen className="w-4 h-4" />
            <span>Android Permission Security Dictionary & Threat Index</span>
          </div>
          <div className="text-neutral-500 text-[11px]">
            {filteredPerms.length} entries matching
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 p-2 rounded bg-neutral-950 border border-neutral-800">
            <Search className="w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={permQuery}
              onChange={(e) => setPermQuery(e.target.value)}
              placeholder="Search permissions by name or risk explanation..."
              className="bg-transparent border-0 outline-none text-neutral-100 text-xs flex-1 placeholder:text-neutral-600"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="DEVICE_CONTROL">Device Control</option>
            <option value="PRIVACY">Privacy & Tracking</option>
            <option value="SMS_CALL">SMS & Calls</option>
            <option value="SECURITY">Security / Droppers</option>
            <option value="NETWORK">Network Sockets</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>

        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {filteredPerms.map((perm) => (
            <div
              key={perm.name}
              className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-100 text-xs">
                  {perm.name}
                </span>
                <span className="text-[11px] text-neutral-400">
                  Risk Weight: <strong className="text-neutral-200">{perm.riskWeight}/10</strong>
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed text-[11px]">
                {perm.description}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-neutral-500 pt-1">
                <span>Category: {perm.category}</span>
                <span>·</span>
                <span>Protection: {perm.protectionLevel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tool 3: Developer REST API Endpoints Explorer */}
      <ApiEndpointsSection />
    </div>
  );
};

const ApiEndpointsSection: React.FC = () => {
  const [selectedApi, setSelectedApi] = useState<string>("/api/web-to-apk");
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [testUrl, setTestUrl] = useState("https://my-app.com");
  const [testApkUrl, setTestApkUrl] = useState("https://example.com/sample.apk");

  const handleTestApi = async () => {
    try {
      setIsCalling(true);
      setApiResponse(null);

      let url = selectedApi;
      let method = "POST";
      let body: any = null;

      if (selectedApi === "/api/endpoints") {
        method = "GET";
      } else if (selectedApi === "/api/health") {
        method = "GET";
      } else if (selectedApi === "/api/web-to-apk") {
        body = {
          url: testUrl,
          appName: "Test Web App",
          packageName: "com.test.webapp",
          orientation: "portrait",
          enableCache: true,
        };
      } else if (selectedApi === "/api/download-apk-url") {
        body = { apkUrl: testApkUrl };
      } else if (selectedApi === "/api/extract-assets") {
        body = { packageName: "com.test.webapp" };
      }

      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      const error = err as Error;
      setApiResponse(JSON.stringify({ error: error.message }, null, 2));
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="p-5 rounded bg-neutral-900 border border-neutral-800 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-xs">
          <span>Developer REST API Interactive Explorer</span>
        </div>
        <span className="text-neutral-500 text-[11px]">Direct JSON endpoints for automation</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-neutral-400 block mb-1">Select Endpoint to Test:</label>
            <select
              value={selectedApi}
              onChange={(e) => {
                setSelectedApi(e.target.value);
                setApiResponse(null);
              }}
              className="w-full p-2.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 outline-none text-xs"
            >
              <option value="/api/web-to-apk">POST /api/web-to-apk (Generate Web-to-APK Project)</option>
              <option value="/api/download-apk-url">POST /api/download-apk-url (Fetch & Inspect Remote APK)</option>
              <option value="/api/extract-assets">POST /api/extract-assets (Extract APK Assets Catalog)</option>
              <option value="/api/endpoints">GET /api/endpoints (Discovery Registry)</option>
              <option value="/api/health">GET /api/health (Engine Status)</option>
            </select>
          </div>

          {selectedApi === "/api/web-to-apk" && (
            <div>
              <label className="text-neutral-400 block mb-1">Target Website URL parameter:</label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="w-full p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs"
              />
            </div>
          )}

          {selectedApi === "/api/download-apk-url" && (
            <div>
              <label className="text-neutral-400 block mb-1">Target APK Download URL:</label>
              <input
                type="text"
                value={testApkUrl}
                onChange={(e) => setTestApkUrl(e.target.value)}
                className="w-full p-2 rounded bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs"
              />
            </div>
          )}

          <button
            onClick={handleTestApi}
            disabled={isCalling}
            className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold transition-colors text-xs disabled:opacity-50"
          >
            {isCalling ? "Executing Request..." : `Execute ${selectedApi}`}
          </button>
        </div>

        <div>
          <label className="text-neutral-400 block mb-1">API JSON Response:</label>
          <pre className="p-3 rounded bg-neutral-950 border border-neutral-800 text-neutral-300 text-[11px] overflow-auto h-[180px] leading-relaxed">
            {apiResponse || "// Click 'Execute' to dispatch request to GADIAN server..."}
          </pre>
        </div>
      </div>
    </div>
  );
};
