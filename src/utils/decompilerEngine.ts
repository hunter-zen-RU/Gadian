import { ApkAnalysisData } from "../types/apk";

export interface DecompiledFile {
  path: string;
  name: string;
  language: "java" | "xml" | "smali" | "text" | "json";
  content: string;
  category: "manifest" | "java" | "smali" | "res" | "meta";
  isModified?: boolean;
}

export function generateDecompiledTree(apk: ApkAnalysisData): DecompiledFile[] {
  const files: DecompiledFile[] = [];

  // 1. AndroidManifest.xml
  files.push({
    path: "AndroidManifest.xml",
    name: "AndroidManifest.xml",
    language: "xml",
    content: apk.manifestXml,
    category: "manifest",
  });

  // 2. Generate decompiled Java files based on discovered components and activities
  const pkgPath = apk.packageName.replace(/\./g, "/");

  // Main Activity Java
  const mainActName = apk.activities[0] || `${apk.packageName}.MainActivity`;
  const mainActSimple = mainActName.split(".").pop() || "MainActivity";

  files.push({
    path: `src/${pkgPath}/${mainActSimple}.java`,
    name: `${mainActSimple}.java`,
    language: "java",
    content: `package ${apk.packageName};

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
${apk.permissions.includes("android.permission.SYSTEM_ALERT_WINDOW") ? "import android.provider.Settings;\nimport android.net.Uri;\n" : ""}${apk.dexInfo.suspiciousStrings.includes("DexClassLoader") ? "import dalvik.system.DexClassLoader;\nimport java.io.File;\n" : ""}
/**
 * Decompiled with GADIAN Reverse Engineering Engine v1.4
 * Package: ${apk.packageName}
 * Target SDK: ${apk.targetSdk} | Min SDK: ${apk.minSdk}
 */
public class ${mainActSimple} extends Activity {

    private static final String TAG = "${mainActSimple}";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "Application entry initialized.");

        checkRuntimePermissions();
        initializeCoreEngine();
    }

    private void checkRuntimePermissions() {
        // Requested permissions: ${apk.permissions.slice(0, 5).join(", ")}
${apk.permissions.includes("android.permission.SYSTEM_ALERT_WINDOW") ? `        if (!Settings.canDrawOverlays(this)) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
            startActivityForResult(intent, 5469);
        }` : "        // Standard runtime permission checks"}
    }

    private void initializeCoreEngine() {
${apk.dexInfo.suspiciousStrings.includes("DexClassLoader") ? `        // WARNING: Suspicious dynamic class loading detected in static analysis
        try {
            File dexFile = new File(getCacheDir(), "payload.apk");
            File optimizedDex = getDir("outdex", 0);
            DexClassLoader loader = new DexClassLoader(dexFile.getAbsolutePath(),
                    optimizedDex.getAbsolutePath(), null, getClassLoader());
            Class<?> clazz = loader.loadClass("com.payload.DropperStub");
            clazz.getMethod("start").invoke(null);
        } catch (Exception e) {
            Log.e(TAG, "Dynamic load exception: " + e.getMessage());
        }` : `        Log.d(TAG, "Engine started normally with ${apk.activities.length} activities.");`}
    }
}
`,
    category: "java",
  });

  // Secondary components (e.g. Services, Receivers)
  if (apk.services.length > 0) {
    const srvName = apk.services[0];
    const srvSimple = srvName.split(".").pop() || "CoreService";
    const isAccessibility = apk.permissions.includes("android.permission.BIND_ACCESSIBILITY_SERVICE") || srvName.toLowerCase().includes("accessibility");

    files.push({
      path: `src/${pkgPath}/${srvSimple}.java`,
      name: `${srvSimple}.java`,
      language: "java",
      content: `package ${apk.packageName};

${isAccessibility ? "import android.accessibilityservice.AccessibilityService;\nimport android.view.accessibility.AccessibilityEvent;\n" : "import android.app.Service;\nimport android.content.Intent;\nimport android.os.IBinder;\n"}import android.util.Log;

/**
 * Decompiled Background Component: ${srvSimple}
 * Declared in manifest: ${srvName}
 */
public class ${srvSimple} extends ${isAccessibility ? "AccessibilityService" : "Service"} {

    private static final String TAG = "${srvSimple}";

${isAccessibility ? `    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        int eventType = event.getEventType();
        CharSequence pkg = event.getPackageName();
        Log.d(TAG, "Accessibility event caught from: " + pkg + ", type: " + eventType);

        // Heuristic signature check: Tapjacking or UI tree scraping
        if (event.getText() != null && !event.getText().isEmpty()) {
            Log.v(TAG, "Captured screen text elements: " + event.getText());
        }
    }

    @Override
    public void onInterrupt() {
        Log.w(TAG, "Service interrupted");
    }` : `    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Service started in background");
        return START_STICKY;
    }`}
}
`,
      category: "java",
    });
  }

  // Smali Disassembly View
  files.push({
    path: `smali/${pkgPath}/${mainActSimple}.smali`,
    name: `${mainActSimple}.smali`,
    language: "smali",
    content: `.class public L${pkgPath}/${mainActSimple};
.super Landroid/app/Activity;
.source "${mainActSimple}.java"

# static fields
.field private static final TAG:Ljava/lang/String; = "${mainActSimple}"

# direct methods
.method public constructor <init>()V
    .registers 1
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .registers 4
    .param p1, "savedInstanceState"

    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    const-string v0, "${mainActSimple}"
    const-string v1, "Application entry initialized."
    invoke-static {v0, v1}, Landroid/util/Log;->i(Ljava/lang/String;Ljava/lang/String;)I

    invoke-direct {p0}, L${pkgPath}/${mainActSimple};->initializeCoreEngine()V
    return-void
.end method

.method private initializeCoreEngine()V
    .registers 3
    const-string v0, "${mainActSimple}"
    const-string v1, "Disassembled Dalvik bytecode execution block."
    invoke-static {v0, v1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I
    return-void
.end method
`,
    category: "smali",
  });

  // Resources: strings.xml
  files.push({
    path: "res/values/strings.xml",
    name: "strings.xml",
    language: "xml",
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${apk.appName}</string>
    <string name="package_id">${apk.packageName}</string>
    <string name="version_label">${apk.versionName}</string>
</resources>
`,
    category: "res",
  });

  // META-INF manifest
  files.push({
    path: "META-INF/MANIFEST.MF",
    name: "MANIFEST.MF",
    language: "text",
    content: `Manifest-Version: 1.0
Created-By: 1.8.0_292 (AdoptOpenJDK)
Built-By: GADIAN-Reverse-Engine
Signer-Subject: ${apk.certificate.subject}
Signer-Issuer: ${apk.certificate.issuer}
Debug-Keystore: ${apk.certificate.isDebug ? "true" : "false"}
Schemes: ${apk.certificate.schemes.join(", ")}
`,
    category: "meta",
  });

  return files;
}
