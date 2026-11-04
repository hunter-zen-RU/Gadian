import JSZip from "jszip";

export interface AideFile {
  path: string;
  name: string;
  category: "manifest" | "java" | "layout" | "config" | "docs";
  content: string;
}

export function getAideProjectFiles(): AideFile[] {
  return [
    {
      path: "AndroidManifest.xml",
      name: "AndroidManifest.xml",
      category: "manifest",
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.gadian.analyzer"
    android:versionCode="1"
    android:versionName="1.0.0-GADIAN">

    <!-- Permissions required by GADIAN to inspect device APKs and reach online intelligence -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <!-- Android 11+ permission to query installed APKs for scanning -->
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/GadianTerminalTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Allows opening .apk files directly with GADIAN from file managers -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="application/vnd.android.package-archive" />
            </intent-filter>
        </activity>

    </application>

</manifest>`,
    },
    {
      path: "project.properties",
      name: "project.properties",
      category: "config",
      content: `# Project target for AIDE (Android IDE)
# Target Android API 33 (Android 13) or 30+
target=android-33
`,
    },
    {
      path: "build.gradle",
      name: "build.gradle",
      category: "config",
      content: `// AIDE-compatible Gradle build configuration
// Compiles directly inside AIDE on Android devices without external PC
apply plugin: 'com.android.application'

android {
    compileSdkVersion 33
    buildToolsVersion "30.0.3"

    defaultConfig {
        applicationId "com.gadian.analyzer"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0-GADIAN"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    // Pure Android SDK implementation - no heavy studio dependencies to avoid AIDE build errors
}
`,
    },
    {
      path: "src/com/gadian/analyzer/MainActivity.java",
      name: "MainActivity.java",
      category: "java",
      content: `package com.gadian.analyzer;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.OpenableColumns;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ScrollView;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.List;

/**
 * GADIAN Project - Main Terminal Console Activity
 * Targeted for AIDE compilation on Android (no Android Studio required)
 */
public class MainActivity extends Activity {

    private static final int REQ_PICK_APK = 1001;

    private TextView tvTerminal;
    private ScrollView svTerminal;
    private EditText etCommand;
    private Button btnRun;
    private Button btnPickApk;
    private Button btnOnlineAudit;

    private File currentTargetApk = null;
    private SecurityAuditor.AuditResult lastAuditResult = null;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initViews();
        printBanner();

        // Check if opened via Intent (e.g. user tapped .apk file in file manager)
        Intent intent = getIntent();
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction())) {
            Uri dataUri = intent.getData();
            if (dataUri != null) {
                handleIncomingUri(dataUri);
            }
        }
    }

    private void initViews() {
        tvTerminal = (TextView) findViewById(R.id.tvTerminal);
        svTerminal = (ScrollView) findViewById(R.id.svTerminal);
        etCommand = (EditText) findViewById(R.id.etCommand);
        btnRun = (Button) findViewById(R.id.btnRun);
        btnPickApk = (Button) findViewById(R.id.btnPickApk);
        btnOnlineAudit = (Button) findViewById(R.id.btnOnlineAudit);

        btnRun.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                executeCommand(etCommand.getText().toString().trim());
                etCommand.setText("");
            }
        });

        etCommand.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
                if (actionId == EditorInfo.IME_ACTION_DONE || 
                   (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER)) {
                    executeCommand(etCommand.getText().toString().trim());
                    etCommand.setText("");
                    return true;
                }
                return false;
            }
        });

        btnPickApk.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent pickIntent = new Intent(Intent.ACTION_GET_CONTENT);
                pickIntent.setType("application/vnd.android.package-archive");
                pickIntent.addCategory(Intent.CATEGORY_OPENABLE);
                startActivityForResult(Intent.createChooser(pickIntent, "Select APK for GADIAN"), REQ_PICK_APK);
            }
        });

        btnOnlineAudit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (currentTargetApk == null) {
                    printLine("[!] No APK loaded. Tap [PICK APK] or run: scan <path>", "#f85149");
                    return;
                }
                executeOnlineThreatAudit();
            }
        });
    }

    private void printBanner() {
        appendTerminal("====================================================", "#58a6ff");
        appendTerminal(" GADIAN // Mobile APK Security Auditor v1.0", "#3fb950");
        appendTerminal(" Engine: AIDE Native Compiler Target (Pure Java/Android)", "#8b949e");
        appendTerminal(" Mode: Offline Heuristics + Online Cloud Intelligence", "#8b949e");
        appendTerminal("====================================================", "#58a6ff");
        appendTerminal("Type 'help' to view available commands.", "#c9d1d9");
        appendTerminal("Ready. Tap [PICK APK] or enter 'scan <path>'.\\n", "#58a6ff");
    }

    private void executeCommand(String cmd) {
        if (cmd == null || cmd.isEmpty()) return;
        appendTerminal("$ " + cmd, "#58a6ff");

        String lower = cmd.toLowerCase();
        if ("help".equals(lower)) {
            showHelp();
        } else if ("clear".equals(lower) || "cls".equals(lower)) {
            tvTerminal.setText("");
            printBanner();
        } else if ("list-apps".equals(lower)) {
            listInstalledApps();
        } else if (lower.startsWith("scan ") || lower.startsWith("inspect ")) {
            String path = cmd.substring(cmd.indexOf(' ') + 1).trim();
            scanApkPath(path);
        } else if ("perms".equals(lower) || "permissions".equals(lower)) {
            showPermissions();
        } else if ("cert".equals(lower) || "signature".equals(lower)) {
            showCertificate();
        } else if ("audit".equals(lower) || "security".equals(lower)) {
            runLocalSecurityAudit();
        } else if ("online".equals(lower)) {
            executeOnlineThreatAudit();
        } else {
            appendTerminal("Unknown command: '" + cmd + "'. Type 'help' for commands.", "#f85149");
        }
    }

    private void showHelp() {
        appendTerminal("GADIAN COMMANDS:", "#3fb950");
        appendTerminal("  scan <filepath>   - Perform full static inspection on APK", "#c9d1d9");
        appendTerminal("  perms             - Inspect requested permissions & danger level", "#c9d1d9");
        appendTerminal("  cert              - Inspect APK signing key and debug status", "#c9d1d9");
        appendTerminal("  audit             - Calculate risk score & safety verdict (Offline)", "#c9d1d9");
        appendTerminal("  online            - Query online threat intelligence engine", "#c9d1d9");
        appendTerminal("  list-apps         - List installed package names on this device", "#c9d1d9");
        appendTerminal("  clear             - Clear terminal screen", "#c9d1d9");
    }

    private void scanApkPath(String path) {
        File file = new File(path);
        if (!file.exists()) {
            appendTerminal("[ERROR] File not found: " + path, "#f85149");
            return;
        }
        analyzeApkFile(file);
    }

    private void analyzeApkFile(final File file) {
        currentTargetApk = file;
        appendTerminal("[*] Loading: " + file.getName() + " (" + (file.length() / 1024) + " KB)...", "#58a6ff");

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    PackageManager pm = getPackageManager();
                    PackageInfo pkgInfo = pm.getPackageArchiveInfo(
                        file.getAbsolutePath(),
                        PackageManager.GET_PERMISSIONS | PackageManager.GET_ACTIVITIES |
                        PackageManager.GET_SERVICES | PackageManager.GET_RECEIVERS |
                        PackageManager.GET_SIGNATURES
                    );

                    if (pkgInfo == null) {
                        mainHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                appendTerminal("[!] Failed to parse APK metadata. File might be corrupted.", "#f85149");
                            }
                        });
                        return;
                    }

                    // Run offline security auditor
                    lastAuditResult = SecurityAuditor.evaluate(MainActivity.this, file, pkgInfo);

                    mainHandler.post(new Runnable() {
                        @Override
                        public void run() {
                            displayAuditSummary(lastAuditResult);
                        }
                    });

                } catch (final Exception e) {
                    mainHandler.post(new Runnable() {
                        @Override
                        public void run() {
                            appendTerminal("[EXCEPTION] " + e.getMessage(), "#f85149");
                        }
                    });
                }
            }
        }).start();
    }

    private void displayAuditSummary(SecurityAuditor.AuditResult result) {
        appendTerminal("\\n[+] APK ANALYSIS COMPLETED", "#3fb950");
        appendTerminal("  Package:    " + result.packageName, "#c9d1d9");
        appendTerminal("  Version:    " + result.versionName + " (" + result.versionCode + ")", "#c9d1d9");
        appendTerminal("  Target SDK: " + result.targetSdk, "#c9d1d9");
        appendTerminal("  Perms:      " + result.permissions.size() + " (" + result.dangerousPermsCount + " sensitive)", "#c9d1d9");
        appendTerminal("  Signature:  " + (result.isDebugKey ? "DEBUG KEY (UNTRUSTED)" : "RELEASE KEY (OK)"), 
            result.isDebugKey ? "#f85149" : "#3fb950");

        String scoreColor = "#3fb950";
        if (result.riskScore >= 70) scoreColor = "#f85149";
        else if (result.riskScore >= 45) scoreColor = "#d29922";
        else if (result.riskScore >= 20) scoreColor = "#e3b341";

        appendTerminal("\\n[*] SAFETY VERDICT: [" + result.verdict + "]", scoreColor);
        appendTerminal("    Calculated Risk Score: " + result.riskScore + "/100", scoreColor);
        appendTerminal("    Rationale: " + result.rationale, "#c9d1d9");

        if (!result.findings.isEmpty()) {
            appendTerminal("\\n[-] THREAT FINDINGS DETECTED (" + result.findings.size() + "):", "#d29922");
            for (String f : result.findings) {
                appendTerminal("  * " + f, "#f85149");
            }
        }
        appendTerminal("\\nRun 'perms' for permission breakdown or 'online' for AI threat intelligence.\\n", "#58a6ff");
    }

    private void showPermissions() {
        if (lastAuditResult == null) {
            appendTerminal("[!] No APK analyzed yet. Scan an APK first.", "#f85149");
            return;
        }
        appendTerminal("\\n[PERMISSIONS (" + lastAuditResult.permissions.size() + ")]:", "#58a6ff");
        for (String p : lastAuditResult.permissions) {
            boolean isDang = SecurityAuditor.isDangerous(p);
            appendTerminal("  " + (isDang ? "[!] " : "[.] ") + p, isDang ? "#f85149" : "#8b949e");
        }
    }

    private void showCertificate() {
        if (lastAuditResult == null) {
            appendTerminal("[!] No APK analyzed yet. Scan an APK first.", "#f85149");
            return;
        }
        appendTerminal("\\n[SIGNATURE & CERTIFICATE]:", "#58a6ff");
        appendTerminal("  Debug Keystore: " + lastAuditResult.isDebugKey, lastAuditResult.isDebugKey ? "#f85149" : "#3fb950");
        appendTerminal("  Cert Fingerprint SHA1: " + lastAuditResult.certSha1, "#c9d1d9");
    }

    private void runLocalSecurityAudit() {
        if (lastAuditResult == null) {
            appendTerminal("[!] No APK analyzed yet. Scan an APK first.", "#f85149");
            return;
        }
        displayAuditSummary(lastAuditResult);
    }

    private void executeOnlineThreatAudit() {
        if (lastAuditResult == null) {
            appendTerminal("[!] Scan an APK first before requesting online intelligence.", "#f85149");
            return;
        }
        appendTerminal("[*] Connecting to GADIAN Online Security Intelligence...", "#58a6ff");
        new Thread(new Runnable() {
            @Override
            public void run() {
                final String response = OnlineThreatClient.queryAudit(lastAuditResult);
                mainHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        appendTerminal("\\n[ONLINE INTELLIGENCE DEBRIEF]:", "#3fb950");
                        appendTerminal(response, "#c9d1d9");
                    }
                });
            }
        }).start();
    }

    private void listInstalledApps() {
        appendTerminal("[*] Querying installed packages...", "#58a6ff");
        PackageManager pm = getPackageManager();
        List<PackageInfo> installed = pm.getInstalledPackages(0);
        int count = 0;
        for (PackageInfo pi : installed) {
            if ((pi.applicationInfo.flags & android.content.pm.ApplicationInfo.FLAG_SYSTEM) == 0) {
                appendTerminal("  - " + pi.packageName + " (" + pi.versionName + ")", "#8b949e");
                count++;
                if (count >= 20) {
                    appendTerminal("  ... (showing 20 user apps out of " + installed.size() + ")", "#58a6ff");
                    break;
                }
            }
        }
    }

    private void handleIncomingUri(Uri uri) {
        try {
            InputStream in = getContentResolver().openInputStream(uri);
            if (in == null) return;
            File tempApk = new File(getCacheDir(), "imported_target.apk");
            FileOutputStream out = new FileOutputStream(tempApk);
            byte[] buf = new byte[8192];
            int read;
            while ((read = in.read(buf)) != -1) {
                out.write(buf, 0, read);
            }
            in.close();
            out.close();
            analyzeApkFile(tempApk);
        } catch (Exception e) {
            appendTerminal("[ERROR importing APK] " + e.getMessage(), "#f85149");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_PICK_APK && resultCode == RESULT_OK && data != null) {
            Uri uri = data.getData();
            if (uri != null) {
                handleIncomingUri(uri);
            }
        }
    }

    private void appendTerminal(String text, String colorHex) {
        tvTerminal.append(text + "\\n");
        svTerminal.post(new Runnable() {
            @Override
            public void run() {
                svTerminal.fullScroll(ScrollView.FOCUS_DOWN);
            }
        });
    }

    private void printLine(String text, String colorHex) {
        appendTerminal(text, colorHex);
    }
}
`,
    },
    {
      path: "src/com/gadian/analyzer/SecurityAuditor.java",
      name: "SecurityAuditor.java",
      category: "java",
      content: `package com.gadian.analyzer;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.Signature;
import java.io.File;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * GADIAN Offline Security & Heuristic Auditor
 * Runs natively in Java on Android devices (compatible with AIDE compilation)
 */
public class SecurityAuditor {

    public static class AuditResult {
        public String packageName;
        public String versionName;
        public int versionCode;
        public int targetSdk;
        public List<String> permissions = new ArrayList<String>();
        public int dangerousPermsCount;
        public boolean isDebugKey;
        public String certSha1;
        public int riskScore; // 0 to 100
        public String verdict; // SAFE, CAUTION, SUSPICIOUS, MALICIOUS
        public String rationale;
        public List<String> findings = new ArrayList<String>();
    }

    private static final Set<String> HIGH_RISK_PERMS = new HashSet<String>(Arrays.asList(
        "android.permission.BIND_ACCESSIBILITY_SERVICE",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.REQUEST_INSTALL_PACKAGES",
        "android.permission.READ_SMS",
        "android.permission.RECEIVE_SMS",
        "android.permission.SEND_SMS",
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.READ_CONTACTS",
        "android.permission.READ_CALL_LOG",
        "android.permission.READ_PHONE_STATE",
        "android.permission.QUERY_ALL_PACKAGES"
    ));

    public static boolean isDangerous(String perm) {
        return HIGH_RISK_PERMS.contains(perm);
    }

    public static AuditResult evaluate(Context ctx, File apkFile, PackageInfo pi) {
        AuditResult res = new AuditResult();
        res.packageName = pi.packageName;
        res.versionName = pi.versionName != null ? pi.versionName : "1.0";
        res.versionCode = pi.versionCode;
        res.targetSdk = pi.applicationInfo != null ? pi.applicationInfo.targetSdkVersion : 0;

        Set<String> permSet = new HashSet<String>();
        if (pi.requestedPermissions != null) {
            for (String p : pi.requestedPermissions) {
                res.permissions.add(p);
                permSet.add(p);
                if (isDangerous(p)) {
                    res.dangerousPermsCount++;
                }
            }
        }

        // Certificate inspection
        res.isDebugKey = false;
        res.certSha1 = "Unavailable";
        if (pi.signatures != null && pi.signatures.length > 0) {
            Signature sig = pi.signatures[0];
            res.certSha1 = calculateSha1(sig.toByteArray());
            String sigString = sig.toCharsString().toLowerCase();
            if (sigString.contains("android debug") || sigString.contains("androiddebugkey")) {
                res.isDebugKey = true;
            }
        }

        int score = 0;

        // Threat Combination 1: Overlay Hijack + Accessibility Keylogger
        if (permSet.contains("android.permission.SYSTEM_ALERT_WINDOW") &&
            permSet.contains("android.permission.BIND_ACCESSIBILITY_SERVICE")) {
            res.findings.add("CRITICAL: Overlay + Accessibility Service combination (typical banking trojan / keylogger vector).");
            score += 40;
        }

        // Threat Combination 2: SMS interception on boot
        if ((permSet.contains("android.permission.READ_SMS") || permSet.contains("android.permission.RECEIVE_SMS")) &&
            permSet.contains("android.permission.RECEIVE_BOOT_COMPLETED")) {
            res.findings.add("HIGH: Background SMS interception on boot (potential 2FA OTP theft).");
            score += 25;
        }

        // Threat Combination 3: Dropper Installer
        if (permSet.contains("android.permission.REQUEST_INSTALL_PACKAGES") &&
            permSet.contains("android.permission.INTERNET")) {
            res.findings.add("HIGH: App can download and request installation of unknown APK packages (Dropper vector).");
            score += 20;
        }

        // Target SDK checks
        if (res.targetSdk > 0 && res.targetSdk < 28) {
            res.findings.add("HIGH: Obsolete Target SDK (" + res.targetSdk + ") bypasses modern Android privacy protections.");
            score += 15;
        }

        // Debug key
        if (res.isDebugKey) {
            res.findings.add("MEDIUM: App is signed with public Android Debug certificate instead of a verified developer key.");
            score += 15;
        }

        // Dangerous perms quantity
        if (res.dangerousPermsCount >= 6) {
            res.findings.add("HIGH: Requests excessive sensitive permissions (" + res.dangerousPermsCount + " sensitive perms).");
            score += 20;
        } else if (res.dangerousPermsCount >= 3) {
            score += 10;
        }

        res.riskScore = Math.min(100, score);

        if (res.riskScore >= 70) {
            res.verdict = "MALICIOUS";
            res.rationale = "High-risk behavior detected. Extreme danger of credential theft, remote payload drops, or screen overlay hijacks. NOT SAFE.";
        } else if (res.riskScore >= 45) {
            res.verdict = "SUSPICIOUS";
            res.rationale = "Suspicious capabilities detected. App contains sensitive capabilities that exceed standard functional requirements.";
        } else if (res.riskScore >= 20) {
            res.verdict = "CAUTION";
            res.rationale = "Standard utility with elevated permissions. Review specific features before granting runtime access.";
        } else {
            res.verdict = "SAFE";
            res.rationale = "Clean profile. No high-risk malware patterns detected. Compliant with safe application guidelines.";
        }

        return res;
    }

    private static String calculateSha1(byte[] cert) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(cert);
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02X:", b));
            }
            if (sb.length() > 0) sb.setLength(sb.length() - 1);
            return sb.toString();
        } catch (Exception e) {
            return "ERROR";
        }
    }
}
`,
    },
    {
      path: "src/com/gadian/analyzer/OnlineThreatClient.java",
      name: "OnlineThreatClient.java",
      category: "java",
      content: `package com.gadian.analyzer;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * GADIAN Online Threat Intelligence Client
 * Uses pure Java HttpURLConnection to work seamlessly in AIDE without external networking libraries.
 */
public class OnlineThreatClient {

    // Default endpoint: point to GADIAN server or local proxy
    private static final String DEFAULT_ENDPOINT = "https://gadian-security.run.app/api/analyze-gemini";

    public static String queryAudit(SecurityAuditor.AuditResult audit) {
        try {
            // Build minimal JSON payload
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\\"apkData\\":{");
            json.append("\\"packageName\\":\\"").append(audit.packageName).append("\\",");
            json.append("\\"versionName\\":\\"").append(audit.versionName).append("\\",");
            json.append("\\"targetSdk\\":").append(audit.targetSdk).append(",");
            json.append("\\"offlineRiskScore\\":").append(audit.riskScore).append(",");
            json.append("\\"permissions\\":[");
            for (int i = 0; i < audit.permissions.size(); i++) {
                json.append("\\"").append(audit.permissions.get(i)).append("\\"");
                if (i < audit.permissions.size() - 1) json.append(",");
            }
            json.append("],");
            json.append("\\"heuristicFindings\\":[");
            for (int i = 0; i < audit.findings.size(); i++) {
                json.append("\\"").append(audit.findings.get(i).replace("\"", "\\\"")).append("\\"");
                if (i < audit.findings.size() - 1) json.append(",");
            }
            json.append("]");
            json.append("}}");

            // Perform HTTP Request
            URL url = new URL(DEFAULT_ENDPOINT);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("User-Agent", "GADIAN-Android-AIDE/1.0");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(12000);
            conn.setDoOutput(true);

            OutputStream os = conn.getOutputStream();
            os.write(json.toString().getBytes("UTF-8"));
            os.close();

            int code = conn.getResponseCode();
            if (code == 200) {
                BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line).append("\\n");
                }
                br.close();
                return sb.toString();
            } else {
                return "[Offline Fallback] Cloud intelligence unreachable (HTTP " + code + "). Local heuristic verdict is definitive: [" + audit.verdict + "].";
            }
        } catch (Exception e) {
            return "[Offline Fallback] " + e.getMessage() + ". Local heuristic verdict: [" + audit.verdict + "] (" + audit.riskScore + "/100).";
        }
    }
}
`,
    },
    {
      path: "res/layout/activity_main.xml",
      name: "activity_main.xml",
      category: "layout",
      content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="#0d1117"
    android:padding="8dp">

    <!-- Terminal Header Bar -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:background="#161b22"
        android:padding="8dp"
        android:gravity="center_vertical">

        <TextView
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="GADIAN // TERMINAL"
            android:textColor="#3fb950"
            android:textSize="14sp"
            android:textStyle="bold"
            android:typeface="monospace" />

        <Button
            android:id="@+id/btnPickApk"
            android:layout_width="wrap_content"
            android:layout_height="36dp"
            android:text="PICK APK"
            android:textColor="#ffffff"
            android:textSize="11sp"
            android:background="#21262d" />

        <Button
            android:id="@+id/btnOnlineAudit"
            android:layout_width="wrap_content"
            android:layout_height="36dp"
            android:layout_marginLeft="6dp"
            android:text="AI AUDIT"
            android:textColor="#ffffff"
            android:textSize="11sp"
            android:background="#238636" />
    </LinearLayout>

    <!-- Monospace Terminal Screen Output -->
    <ScrollView
        android:id="@+id/svTerminal"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:background="#0d1117"
        android:padding="6dp">

        <TextView
            android:id="@+id/tvTerminal"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="#c9d1d9"
            android:textSize="12sp"
            android:typeface="monospace" />
    </ScrollView>

    <!-- Command Prompt Input -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:background="#161b22"
        android:padding="4dp"
        android:gravity="center_vertical">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="gadian&gt; "
            android:textColor="#58a6ff"
            android:textSize="13sp"
            android:textStyle="bold"
            android:typeface="monospace" />

        <EditText
            android:id="@+id/etCommand"
            android:layout_width="0dp"
            android:layout_height="40dp"
            android:layout_weight="1"
            android:hint="Type 'help' or command..."
            android:textColor="#ffffff"
            android:textColorHint="#484f58"
            android:textSize="13sp"
            android:typeface="monospace"
            android:background="@null"
            android:imeOptions="actionDone"
            android:singleLine="true" />

        <Button
            android:id="@+id/btnRun"
            android:layout_width="wrap_content"
            android:layout_height="36dp"
            android:text="EXEC"
            android:textColor="#ffffff"
            android:textSize="11sp"
            android:background="#30363d" />
    </LinearLayout>

</LinearLayout>`,
    },
    {
      path: "res/values/strings.xml",
      name: "strings.xml",
      category: "layout",
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">GADIAN</string>
</resources>`,
    },
    {
      path: "res/values/colors.xml",
      name: "colors.xml",
      category: "layout",
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="terminal_bg">#0d1117</color>
    <color name="terminal_surface">#161b22</color>
    <color name="terminal_green">#3fb950</color>
    <color name="terminal_blue">#58a6ff</color>
    <color name="terminal_red">#f85149</color>
    <color name="terminal_amber">#d29922</color>
    <color name="terminal_text">#c9d1d9</color>
</resources>`,
    },
    {
      path: "res/values/styles.xml",
      name: "styles.xml",
      category: "layout",
      content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="GadianTerminalTheme" parent="@android:style/Theme.NoTitleBar">
        <item name="android:windowBackground">@color/terminal_bg</item>
    </style>
</resources>`,
    },
    {
      path: "HOW_TO_COMPILE_IN_AIDE.md",
      name: "HOW_TO_COMPILE_IN_AIDE.md",
      category: "docs",
      content: `# Compiling Project GADIAN in AIDE (Android IDE)

This project is tailored specifically for **AIDE for Android**, allowing compilation and testing directly on an Android smartphone or tablet without Android Studio or a PC.

## Step-by-Step Instructions:

1. **Extract Project to Storage**:
   - Download the \`GADIAN-AIDE-Project.zip\` file.
   - Unpack it using any file manager (e.g. ZArchiver or Solid Explorer) to:
     \`/sdcard/AppProjects/GADIAN\`

2. **Open in AIDE**:
   - Launch the **AIDE** app on your Android device.
   - Tap **Files** -> Navigate to \`/sdcard/AppProjects/GADIAN\`.
   - Tap on the folder or select **Open Android Project**.
   - AIDE will detect \`AndroidManifest.xml\` and \`project.properties\`.

3. **Build & Run**:
   - Tap the **Run (Play)** icon in the top action bar of AIDE.
   - AIDE will compile the Java classes (\`MainActivity.java\`, \`SecurityAuditor.java\`, \`OnlineThreatClient.java\`), package the Dex bytecode, sign the APK with the local AIDE test key, and prompt you to install.

4. **Using GADIAN on Device**:
   - Tap **[PICK APK]** to select any \`.apk\` from your Downloads folder.
   - Or type in the terminal:
     \`scan /sdcard/Download/sample.apk\`
     \`perms\`
     \`cert\`
     \`audit\`
     \`online\`
   - Check whether the APK is **SAFE**, **CAUTION**, **SUSPICIOUS**, or **MALICIOUS**!
`,
    },
  ];
}

export async function createAideProjectZip(): Promise<Blob> {
  const zip = new JSZip();
  const files = getAideProjectFiles();

  for (const f of files) {
    zip.file(`GADIAN/${f.path}`, f.content);
  }

  return await zip.generateAsync({ type: "blob" });
}
