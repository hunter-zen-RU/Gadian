import { ApkAnalysisData } from "../types/apk";
import { parsePermissionDetails } from "../utils/riskEngine";

export const SAMPLE_APKS: ApkAnalysisData[] = [
  {
    id: "sample-signal",
    fileName: "org.thoughtcrime.securesms_v7.12.apk",
    fileSize: 42100000,
    appName: "Signal Private Messenger",
    packageName: "org.thoughtcrime.securesms",
    versionName: "7.12.3",
    versionCode: 1392,
    minSdk: 26,
    targetSdk: 34,
    compileSdk: 34,
    permissions: [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_CONTACTS",
      "android.permission.VIBRATE",
      "android.permission.WAKE_LOCK",
      "android.permission.FOREGROUND_SERVICE",
    ],
    permissionDetails: parsePermissionDetails([
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_CONTACTS",
      "android.permission.VIBRATE",
      "android.permission.WAKE_LOCK",
      "android.permission.FOREGROUND_SERVICE",
    ]),
    components: [
      {
        name: "org.thoughtcrime.securesms.MainActivity",
        type: "activity",
        exported: true,
        intentFilters: ["android.intent.action.MAIN", "android.intent.category.LAUNCHER"],
      },
      {
        name: "org.thoughtcrime.securesms.ConversationActivity",
        type: "activity",
        exported: false,
        intentFilters: [],
      },
      {
        name: "org.thoughtcrime.securesms.service.KeyCachingService",
        type: "service",
        exported: false,
        intentFilters: [],
      },
    ],
    activities: [
      "org.thoughtcrime.securesms.MainActivity",
      "org.thoughtcrime.securesms.ConversationActivity",
      "org.thoughtcrime.securesms.ShareActivity",
    ],
    services: [
      "org.thoughtcrime.securesms.service.KeyCachingService",
      "org.thoughtcrime.securesms.service.WebRtcCallService",
    ],
    receivers: [
      "org.thoughtcrime.securesms.notifications.FcmReceiver",
    ],
    providers: [
      "org.thoughtcrime.securesms.providers.PartProvider",
    ],
    manifestXml: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="org.thoughtcrime.securesms"
    android:versionCode="1392"
    android:versionName="7.12.3">

    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

    <application
        android:name=".ApplicationContext"
        android:icon="@drawable/icon"
        android:label="Signal"
        android:allowBackup="false"
        android:usesCleartextTraffic="false">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service android:name=".service.KeyCachingService" android:exported="false" />
    </application>
</manifest>`,
    certificate: {
      subject: "CN=Signal Messenger LLC, O=Signal, L=Mountain View, ST=CA, C=US",
      issuer: "CN=Signal Messenger LLC, O=Signal, L=Mountain View, ST=CA, C=US",
      validFrom: "2015-05-18",
      validTo: "2045-05-18",
      fingerprintSha1: "29:F7:9C:AB:3A:42:0D:37:37:F9:91:02:44:A2:72:DE:0D:7E:B6:5C",
      fingerprintSha256: "D3:C5:16:D4:6C:6C:3E:D0:30:2C:16:B3:34:64:14:0C:6F:D4:53:DF:EE:0B:01:A0:68:54:99:91:D9:D8:1A:16",
      isDebug: false,
      schemes: ["v1 (JAR)", "v2 (APK Signature)", "v3 (Key Rotation)"],
    },
    dexInfo: {
      magic: "dex\n039\0",
      fileSize: 18450120,
      classCount: 12450,
      methodCount: 84320,
      hasMultiDex: true,
      suspiciousStrings: [],
      nativeLibraries: ["libsignal-client.so", "libwebrtc.so"],
    },
    heuristicFindings: [],
    offlineRiskScore: 8,
    offlineVerdict: "SAFE",
    offlineVerdictRationale: "Clean security profile. Production cryptographic signature verified. Modern Target SDK 34 with Scoped Storage. Standard permissions strictly justified for end-to-end messaging. Zero dangerous overlay or dropper heuristics.",
  },
  {
    id: "sample-bank-trojan",
    fileName: "QuickBank_Auth_2FA_v2.1.apk",
    fileSize: 4890000,
    appName: "QuickBank 2FA Security",
    packageName: "com.bankutility.secauth.app",
    versionName: "2.1.0",
    versionCode: 21,
    minSdk: 21,
    targetSdk: 26,
    compileSdk: 28,
    permissions: [
      "android.permission.INTERNET",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.BIND_ACCESSIBILITY_SERVICE",
      "android.permission.READ_SMS",
      "android.permission.RECEIVE_SMS",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.READ_PHONE_STATE",
      "android.permission.REQUEST_INSTALL_PACKAGES",
    ],
    permissionDetails: parsePermissionDetails([
      "android.permission.INTERNET",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.BIND_ACCESSIBILITY_SERVICE",
      "android.permission.READ_SMS",
      "android.permission.RECEIVE_SMS",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.READ_PHONE_STATE",
      "android.permission.REQUEST_INSTALL_PACKAGES",
    ]),
    components: [
      {
        name: "com.bankutility.secauth.app.MainActivity",
        type: "activity",
        exported: true,
        intentFilters: ["android.intent.action.MAIN"],
      },
      {
        name: "com.bankutility.secauth.app.AutoClickService",
        type: "service",
        exported: true,
        permission: "android.permission.BIND_ACCESSIBILITY_SERVICE",
        intentFilters: ["android.accessibilityservice.AccessibilityService"],
      },
      {
        name: "com.bankutility.secauth.app.BootReceiver",
        type: "receiver",
        exported: true,
        intentFilters: ["android.intent.action.BOOT_COMPLETED"],
      },
    ],
    activities: [
      "com.bankutility.secauth.app.MainActivity",
      "com.bankutility.secauth.app.OverlayDialogActivity",
    ],
    services: [
      "com.bankutility.secauth.app.AutoClickService",
      "com.bankutility.secauth.app.BackgroundSyncWorker",
    ],
    receivers: [
      "com.bankutility.secauth.app.BootReceiver",
      "com.bankutility.secauth.app.SmsCatchReceiver",
    ],
    providers: [],
    manifestXml: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.bankutility.secauth.app"
    android:versionCode="21"
    android:versionName="2.1.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="26" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.RECEIVE_SMS" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

    <application
        android:label="QuickBank 2FA Security"
        android:debuggable="true"
        android:usesCleartextTraffic="true">

        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".AutoClickService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
        </service>

        <receiver android:name=".BootReceiver" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>
    </application>
</manifest>`,
    certificate: {
      subject: "CN=Android Debug, O=Android, C=US",
      issuer: "CN=Android Debug, O=Android, C=US",
      validFrom: "2024-01-01",
      validTo: "2054-01-01",
      fingerprintSha1: "27:12:35:AA:DE:8F:00:19:B2:44:CD:EF:01:23:45:67:89:AB:CD:EF",
      fingerprintSha256: "61:ED:37:7E:85:D3:86:A8:DF:EE:6B:86:4B:D8:5B:0B:FA:A5:AF:81:FF:8B:D0:68:5A:F3:A8:12:5E:21:A6:45",
      isDebug: true,
      schemes: ["v1 (JAR)"],
    },
    dexInfo: {
      magic: "dex\n035\0",
      fileSize: 3120000,
      classCount: 184,
      methodCount: 1240,
      hasMultiDex: false,
      suspiciousStrings: [
        "DexClassLoader",
        "Runtime.getRuntime",
        "android.provider.Telephony.SMS_RECEIVED",
        "AccessibilityService",
        "TYPE_VIEW_CLICKED",
        "getDeviceId",
        "http://",
      ],
      nativeLibraries: [],
    },
    heuristicFindings: [
      {
        id: "COMBO_OVERLAY_ACCESSIBILITY",
        severity: "CRITICAL",
        title: "Overlay Hijack & Accessibility Service Trap",
        description: "The APK combines SYSTEM_ALERT_WINDOW and BIND_ACCESSIBILITY_SERVICE. This exact pairing is used by banking trojans to draw fake login overlays over legitimate banking apps and harvest credentials.",
        cweOrCategory: "CWE-1021 / CWE-250",
      },
      {
        id: "COMBO_SMS_BOOT",
        severity: "HIGH",
        title: "Background Boot SMS Interception",
        description: "App intercepts incoming SMS messages immediately upon device boot. Highly correlated with silent 2FA one-time code theft.",
        cweOrCategory: "CWE-200 / CWE-926",
      },
      {
        id: "DEBUG_SIGNING_KEY",
        severity: "HIGH",
        title: "Signed with Insecure Android Debug Keystore",
        description: "The APK is signed with the public Android debug certificate (CN=Android Debug), typical of repackaged or untrusted binaries.",
        cweOrCategory: "CWE-295",
      },
      {
        id: "DEX_DYNAMIC_CLASSLOADER",
        severity: "HIGH",
        title: "Dynamic Dex Bytecode Execution Detected",
        description: "Found references to DexClassLoader in DEX strings. Allows downloading and loading unverified remote executable code at runtime.",
        cweOrCategory: "CWE-94",
      },
      {
        id: "OUTDATED_TARGET_SDK",
        severity: "HIGH",
        title: "Obsolete Target SDK (26)",
        description: "Targeting Android API < 28 circumvents modern Android privacy sandboxes, including background execution restrictions.",
        cweOrCategory: "CWE-1104",
      },
    ],
    offlineRiskScore: 94,
    offlineVerdict: "MALICIOUS",
    offlineVerdictRationale: "CRITICAL THREAT LEVEL (Score 94/100). Classic Banking Trojan / Anatsa signature pattern: combines SYSTEM_ALERT_WINDOW with BIND_ACCESSIBILITY_SERVICE for tapjacking, intercepts incoming SMS OTPs on boot, employs DexClassLoader for dynamic payload dropping, and is signed with a debug keystore. REJECT AND DO NOT INSTALL.",
  },
  {
    id: "sample-adware",
    fileName: "Ultra_Flashlight_LED_Pro_v1.4.apk",
    fileSize: 8400000,
    appName: "Ultra Flashlight LED Pro",
    packageName: "com.tool.flash.ledlight.free",
    versionName: "1.4.0",
    versionCode: 14,
    minSdk: 21,
    targetSdk: 28,
    compileSdk: 28,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.READ_PHONE_STATE",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.WAKE_LOCK",
    ],
    permissionDetails: parsePermissionDetails([
      "android.permission.CAMERA",
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.READ_PHONE_STATE",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.WAKE_LOCK",
    ]),
    components: [
      {
        name: "com.tool.flash.ledlight.MainActivity",
        type: "activity",
        exported: true,
        intentFilters: ["android.intent.action.MAIN"],
      },
      {
        name: "com.tool.flash.ledlight.AdDaemonService",
        type: "service",
        exported: false,
        intentFilters: [],
      },
    ],
    activities: [
      "com.tool.flash.ledlight.MainActivity",
      "com.tool.flash.ledlight.AdFullInterstitialActivity",
    ],
    services: [
      "com.tool.flash.ledlight.AdDaemonService",
    ],
    receivers: [
      "com.tool.flash.ledlight.BootReceiver",
    ],
    providers: [],
    manifestXml: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.tool.flash.ledlight.free"
    android:versionCode="14"
    android:versionName="1.4.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="28" />

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:label="Ultra Flashlight LED Pro"
        android:usesCleartextTraffic="true">
        <activity android:name=".MainActivity" android:exported="true" />
    </application>
</manifest>`,
    certificate: {
      subject: "CN=Flashlight Software Lab, O=Software Lab, C=CN",
      issuer: "CN=Flashlight Software Lab, O=Software Lab, C=CN",
      validFrom: "2019-01-01",
      validTo: "2044-01-01",
      fingerprintSha1: "B4:12:88:99:AA:CC:DD:EE:11:22:33:44:55:66:77:88:99:00:AA:BB",
      fingerprintSha256: "CC:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11",
      isDebug: false,
      schemes: ["v1 (JAR)", "v2 (APK Signature)"],
    },
    dexInfo: {
      magic: "dex\n035\0",
      fileSize: 4500000,
      classCount: 920,
      methodCount: 7800,
      hasMultiDex: false,
      suspiciousStrings: [
        "http://",
        "getDeviceId",
      ],
      nativeLibraries: [],
    },
    heuristicFindings: [
      {
        id: "ELEVATED_DANGEROUS_PERMS",
        severity: "MEDIUM",
        title: "Disproportionate Permission Scope",
        description: "A utility flashlight application demands Phone Identity (READ_PHONE_STATE), Coarse Geolocation, and Overlay Window capabilities. These permissions are irrelevant to flashlight operations and typically serve aggressive ad-tracking SDKs.",
        cweOrCategory: "CWE-250",
      },
      {
        id: "CLEARTEXT_TRAFFIC_ENABLED",
        severity: "MEDIUM",
        title: "Unencrypted HTTP Cleartext Traffic Permitted",
        description: "android:usesCleartextTraffic is enabled, allowing unencrypted telemetry transmission.",
        cweOrCategory: "CWE-319",
      },
    ],
    offlineRiskScore: 48,
    offlineVerdict: "CAUTION",
    offlineVerdictRationale: "ELEVATED RISK / ADWARE SUSPECT (Score 48/100). The application contains non-essential permissions (READ_PHONE_STATE, SYSTEM_ALERT_WINDOW, LOCATION) that significantly exceed its purported utility. Likely intrusive adware or data harvester. Proceed with caution.",
  },
  {
    id: "sample-spyware",
    fileName: "FastBattery_Cooler_Optimizer_v3.0.apk",
    fileSize: 6720000,
    appName: "Fast Battery Cooler & Cleaner",
    packageName: "com.sysopt.battery.saver.pro",
    versionName: "3.0.1",
    versionCode: 301,
    minSdk: 21,
    targetSdk: 27,
    compileSdk: 28,
    permissions: [
      "android.permission.INTERNET",
      "android.permission.RECORD_AUDIO",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.READ_CONTACTS",
      "android.permission.READ_CALL_LOG",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.QUERY_ALL_PACKAGES",
      "android.permission.REQUEST_INSTALL_PACKAGES",
      "android.permission.WAKE_LOCK",
    ],
    permissionDetails: parsePermissionDetails([
      "android.permission.INTERNET",
      "android.permission.RECORD_AUDIO",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.READ_CONTACTS",
      "android.permission.READ_CALL_LOG",
      "android.permission.RECEIVE_BOOT_COMPLETED",
      "android.permission.QUERY_ALL_PACKAGES",
      "android.permission.REQUEST_INSTALL_PACKAGES",
      "android.permission.WAKE_LOCK",
    ]),
    components: [
      {
        name: "com.sysopt.battery.saver.MainActivity",
        type: "activity",
        exported: true,
        intentFilters: ["android.intent.action.MAIN"],
      },
      {
        name: "com.sysopt.battery.saver.CoolerService",
        type: "service",
        exported: true,
        intentFilters: [],
      },
    ],
    activities: [
      "com.sysopt.battery.saver.MainActivity",
    ],
    services: [
      "com.sysopt.battery.saver.CoolerService",
      "com.sysopt.battery.saver.TelemetryService",
    ],
    receivers: [
      "com.sysopt.battery.saver.BootReceiver",
    ],
    providers: [],
    manifestXml: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.sysopt.battery.saver.pro"
    android:versionCode="301"
    android:versionName="3.0.1">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="27" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.READ_CALL_LOG" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:label="Fast Battery Cooler & Cleaner"
        android:allowBackup="true"
        android:usesCleartextTraffic="true">
        <activity android:name=".MainActivity" android:exported="true" />
    </application>
</manifest>`,
    certificate: {
      subject: "CN=SysOpt Global Mobile, O=SysOpt, C=SG",
      issuer: "CN=SysOpt Global Mobile, O=SysOpt, C=SG",
      validFrom: "2020-03-10",
      validTo: "2045-03-10",
      fingerprintSha1: "E1:34:55:77:99:BB:DD:FF:00:22:44:66:88:AA:CC:EE:11:33:55:77",
      fingerprintSha256: "AA:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:AA:BB:CC:DD:EE",
      isDebug: false,
      schemes: ["v1 (JAR)", "v2 (APK Signature)"],
    },
    dexInfo: {
      magic: "dex\n035\0",
      fileSize: 5200000,
      classCount: 1100,
      methodCount: 8900,
      hasMultiDex: false,
      suspiciousStrings: [
        "Runtime.getRuntime",
        "/system/bin/sh",
        "getDeviceId",
        "http://",
      ],
      nativeLibraries: [],
    },
    heuristicFindings: [
      {
        id: "COMBO_SURVEILLANCE_AUDIO",
        severity: "HIGH",
        title: "Autonomous Background Audio Spyware Vector",
        description: "App combines background boot execution with RECORD_AUDIO, BACKGROUND_LOCATION, and network transmission.",
        cweOrCategory: "CWE-359",
      },
      {
        id: "COMBO_DROPPER_INSTALL",
        severity: "HIGH",
        title: "Arbitrary Package Installer (Dropper Vector)",
        description: "App requests REQUEST_INSTALL_PACKAGES alongside INTERNET, allowing it to act as an unverified APK payload dropper.",
        cweOrCategory: "CWE-494",
      },
      {
        id: "OUTDATED_TARGET_SDK",
        severity: "HIGH",
        title: "Obsolete Target SDK (27)",
        description: "Bypasses modern Android 9+ Scoped Storage and background location access restrictions.",
        cweOrCategory: "CWE-1104",
      },
    ],
    offlineRiskScore: 72,
    offlineVerdict: "SUSPICIOUS",
    offlineVerdictRationale: "HIGH RISK / SPYWARE INDICATORS (Score 72/100). Disguised as a system battery optimizer, this binary requests covert audio recording, continuous background GPS tracking, contact harvesting, and external APK installation. Strong indicators of stalkerware or commercial surveillance.",
  },
];
