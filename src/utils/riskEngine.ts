import {
  ComponentInfo,
  DexInspection,
  HeuristicFinding,
  PermissionDetail,
  SafetyVerdict,
} from "../types/apk";

// Android Known Permission Registry with Risk Weights
export const KNOWN_PERMISSIONS: Record<
  string,
  {
    category: PermissionDetail["category"];
    protectionLevel: PermissionDetail["protectionLevel"];
    riskWeight: number;
    description: string;
  }
> = {
  "android.permission.BIND_ACCESSIBILITY_SERVICE": {
    category: "DEVICE_CONTROL",
    protectionLevel: "signatureOrSystem",
    riskWeight: 10,
    description: "Allows app to inspect full screen content, capture keystrokes, and interact on user behalf. Common in banking trojans.",
  },
  "android.permission.SYSTEM_ALERT_WINDOW": {
    category: "DEVICE_CONTROL",
    protectionLevel: "dangerous",
    riskWeight: 8,
    description: "Allows drawing overlay windows above other apps. High risk for phishing overlays and clickjacking.",
  },
  "android.permission.REQUEST_INSTALL_PACKAGES": {
    category: "SECURITY",
    protectionLevel: "dangerous",
    riskWeight: 8,
    description: "Allows initiating installation of other APKs. Typical vector for malware droppers and update hijackers.",
  },
  "android.permission.READ_SMS": {
    category: "SMS_CALL",
    protectionLevel: "dangerous",
    riskWeight: 9,
    description: "Allows reading SMS text messages, including 2FA verification codes and banking OTPs.",
  },
  "android.permission.RECEIVE_SMS": {
    category: "SMS_CALL",
    protectionLevel: "dangerous",
    riskWeight: 9,
    description: "Allows intercepting incoming SMS messages before the user sees them.",
  },
  "android.permission.SEND_SMS": {
    category: "SMS_CALL",
    protectionLevel: "dangerous",
    riskWeight: 9,
    description: "Allows sending SMS messages without confirmation. Potential for premium-rate toll fraud.",
  },
  "android.permission.RECORD_AUDIO": {
    category: "PRIVACY",
    protectionLevel: "dangerous",
    riskWeight: 7,
    description: "Allows background microphone recording without notification.",
  },
  "android.permission.CAMERA": {
    category: "PRIVACY",
    protectionLevel: "dangerous",
    riskWeight: 7,
    description: "Allows taking pictures and recording video using the camera.",
  },
  "android.permission.ACCESS_FINE_LOCATION": {
    category: "PRIVACY",
    protectionLevel: "dangerous",
    riskWeight: 6,
    description: "Allows precise GPS tracking down to meters.",
  },
  "android.permission.ACCESS_BACKGROUND_LOCATION": {
    category: "PRIVACY",
    protectionLevel: "dangerous",
    riskWeight: 8,
    description: "Allows location tracking while app is closed or running in background.",
  },
  "android.permission.READ_CALL_LOG": {
    category: "PRIVACY",
    protectionLevel: "dangerous",
    riskWeight: 8,
    description: "Allows reading incoming and outgoing phone call histories.",
  },
  "android.permission.READ_CONTACTS": {
    category: "PRIVACY",
    protectionLevel: "dangerous",
    riskWeight: 6,
    description: "Allows harvesting entire address book and contact details.",
  },
  "android.permission.READ_PHONE_STATE": {
    category: "PRIVACY",
    protectionLevel: "dangerous",
    riskWeight: 6,
    description: "Allows reading IMEI, phone number, carrier identity, and cellular network status.",
  },
  "android.permission.QUERY_ALL_PACKAGES": {
    category: "SECURITY",
    protectionLevel: "normal",
    riskWeight: 7,
    description: "Allows app to inspect every other installed application on device for reconnaissance.",
  },
  "android.permission.RECEIVE_BOOT_COMPLETED": {
    category: "SECURITY",
    protectionLevel: "normal",
    riskWeight: 5,
    description: "Allows app to automatically start services right when phone finishes booting.",
  },
  "android.permission.INTERNET": {
    category: "NETWORK",
    protectionLevel: "normal",
    riskWeight: 2,
    description: "Allows opening network sockets to communicate with internet servers.",
  },
  "android.permission.ACCESS_NETWORK_STATE": {
    category: "NETWORK",
    protectionLevel: "normal",
    riskWeight: 1,
    description: "Allows viewing WiFi and cellular connection states.",
  },
  "android.permission.VIBRATE": {
    category: "NORMAL",
    protectionLevel: "normal",
    riskWeight: 0,
    description: "Allows controlling device haptic vibrator.",
  },
  "android.permission.WAKE_LOCK": {
    category: "NORMAL",
    protectionLevel: "normal",
    riskWeight: 2,
    description: "Allows keeping CPU active and awake during background processing.",
  },
  "android.permission.WRITE_EXTERNAL_STORAGE": {
    category: "SECURITY",
    protectionLevel: "dangerous",
    riskWeight: 6,
    description: "Legacy access to write files to shared storage / SD card.",
  },
  "android.permission.READ_EXTERNAL_STORAGE": {
    category: "PRIVACY",
    protectionLevel: "dangerous",
    riskWeight: 5,
    description: "Legacy access to read all photos and files on device.",
  },
  "android.permission.FOREGROUND_SERVICE": {
    category: "NORMAL",
    protectionLevel: "normal",
    riskWeight: 2,
    description: "Allows running long-term background services visible to user.",
  },
};

export function parsePermissionDetails(permissions: string[]): PermissionDetail[] {
  return permissions.map((p) => {
    const shortName = p.split(".").pop() || p;
    const known = KNOWN_PERMISSIONS[p];
    if (known) {
      return {
        name: p,
        shortName,
        category: known.category,
        protectionLevel: known.protectionLevel,
        riskWeight: known.riskWeight,
        description: known.description,
      };
    }

    // Heuristic inference for unknown or custom permissions
    const isDangerousName =
      /SMS|CAMERA|AUDIO|RECORD|LOCATION|CONTACTS|CALL|INSTALL|ALERT|ACCESSIBILITY/i.test(p);
    return {
      name: p,
      shortName,
      category: isDangerousName ? "PRIVACY" : "NORMAL",
      protectionLevel: isDangerousName ? "dangerous" : "normal",
      riskWeight: isDangerousName ? 5 : 1,
      description: isDangerousName
        ? "Custom or non-standard permission with sensitive access capabilities."
        : "Standard operational permission.",
    };
  });
}

export function evaluateSecurity(params: {
  permissions: string[];
  components: ComponentInfo[];
  dexInfo: DexInspection;
  manifestXml: string;
  minSdk: number;
  targetSdk: number;
  isDebug: boolean;
}): {
  findings: HeuristicFinding[];
  riskScore: number;
  verdict: SafetyVerdict;
  rationale: string;
} {
  const findings: HeuristicFinding[] = [];
  let calculatedScore = 0;

  const permSet = new Set(params.permissions);

  // 1. Critical Permission Combinations
  if (
    permSet.has("android.permission.SYSTEM_ALERT_WINDOW") &&
    permSet.has("android.permission.BIND_ACCESSIBILITY_SERVICE")
  ) {
    findings.push({
      id: "COMBO_OVERLAY_ACCESSIBILITY",
      severity: "CRITICAL",
      title: "Overlay Hijack & Accessibility Service Trap",
      description:
        "The APK combines SYSTEM_ALERT_WINDOW and BIND_ACCESSIBILITY_SERVICE. This exact pairing is predominantly observed in banking malware to draw fake login overlays over legitimate banking apps and harvest credentials.",
      cweOrCategory: "CWE-1021 / CWE-250",
    });
    calculatedScore += 35;
  }

  if (
    (permSet.has("android.permission.READ_SMS") ||
      permSet.has("android.permission.RECEIVE_SMS")) &&
    permSet.has("android.permission.RECEIVE_BOOT_COMPLETED")
  ) {
    findings.push({
      id: "COMBO_SMS_BOOT",
      severity: "HIGH",
      title: "Background Boot SMS Interception",
      description:
        "App intercepts incoming SMS messages immediately upon device boot. Highly correlated with silent 2FA one-time code theft.",
      cweOrCategory: "CWE-200 / CWE-926",
    });
    calculatedScore += 25;
  }

  if (
    permSet.has("android.permission.REQUEST_INSTALL_PACKAGES") &&
    permSet.has("android.permission.INTERNET")
  ) {
    findings.push({
      id: "COMBO_DROPPER_INSTALL",
      severity: "HIGH",
      title: "Arbitrary Package Installer (Dropper Vector)",
      description:
        "App holds both internet capability and permission to request installing external APKs, allowing it to act as a stealth second-stage payload dropper.",
      cweOrCategory: "CWE-494",
    });
    calculatedScore += 20;
  }

  if (
    permSet.has("android.permission.RECORD_AUDIO") &&
    permSet.has("android.permission.RECEIVE_BOOT_COMPLETED") &&
    permSet.has("android.permission.INTERNET")
  ) {
    findings.push({
      id: "COMBO_SURVEILLANCE_AUDIO",
      severity: "HIGH",
      title: "Autonomous Background Audio Spyware Vector",
      description:
        "App can wake on boot, record room audio, and transmit data over network sockets without active user foreground involvement.",
      cweOrCategory: "CWE-359",
    });
    calculatedScore += 22;
  }

  // 2. Individual dangerous permissions weight
  const dangerousPerms = params.permissions.filter((p) => {
    const k = KNOWN_PERMISSIONS[p];
    return k && (k.riskWeight >= 7 || k.protectionLevel === "dangerous");
  });

  if (dangerousPerms.length > 6) {
    findings.push({
      id: "EXCESSIVE_DANGEROUS_PERMS",
      severity: "HIGH",
      title: "Excessive Sensitive Permissions Requested",
      description: `App requests ${dangerousPerms.length} high-privilege dangerous permissions, violating the principle of least privilege.`,
      cweOrCategory: "CWE-250",
    });
    calculatedScore += 18;
  } else if (dangerousPerms.length > 3) {
    findings.push({
      id: "ELEVATED_DANGEROUS_PERMS",
      severity: "MEDIUM",
      title: "Elevated Sensitive Permissions Set",
      description: `App requests ${dangerousPerms.length} sensitive permissions. Review operational justification.`,
      cweOrCategory: "CWE-250",
    });
    calculatedScore += 10;
  }

  // 3. SDK Version Invariants
  if (params.targetSdk > 0 && params.targetSdk < 28) {
    findings.push({
      id: "OUTDATED_TARGET_SDK",
      severity: "HIGH",
      title: `Obsolete Target SDK (${params.targetSdk})`,
      description:
        "Targeting Android API < 28 circumvents modern Android privacy sandboxes, including Scoped Storage and background execution restrictions.",
      cweOrCategory: "CWE-1104",
    });
    calculatedScore += 15;
  } else if (params.targetSdk > 0 && params.targetSdk < 31) {
    findings.push({
      id: "SUB_TARGET_SDK",
      severity: "LOW",
      title: `Aging Target SDK (${params.targetSdk})`,
      description:
        "App targets an older Android version. Play Store requires modern API 33+ targets for improved security posture.",
      cweOrCategory: "CWE-1104",
    });
    calculatedScore += 5;
  }

  // 4. Manifest Configuration Invariants
  if (/android:debuggable\s*=\s*["']true["']/i.test(params.manifestXml)) {
    findings.push({
      id: "DEBUGGABLE_BUILD",
      severity: "HIGH",
      title: "Application Is Debuggable",
      description:
        "android:debuggable is true. Production builds should never be debuggable as it permits ADB memory attachment, runtime hooking, and secret extraction.",
      cweOrCategory: "CWE-215",
    });
    calculatedScore += 18;
  }

  if (/android:usesCleartextTraffic\s*=\s*["']true["']/i.test(params.manifestXml)) {
    findings.push({
      id: "CLEARTEXT_TRAFFIC_ENABLED",
      severity: "MEDIUM",
      title: "Unencrypted HTTP Cleartext Traffic Permitted",
      description:
        "App permits unencrypted plain HTTP communication, exposing network tokens and payloads to Man-in-the-Middle (MITM) eavesdropping.",
      cweOrCategory: "CWE-319",
    });
    calculatedScore += 10;
  }

  // 5. Signature & Certificate Checks
  if (params.isDebug) {
    findings.push({
      id: "DEBUG_SIGNING_KEY",
      severity: "HIGH",
      title: "Signed with Insecure Android Debug Keystore",
      description:
        "The APK is signed with the public Android debug certificate (CN=Android Debug), not an authentic developer release key.",
      cweOrCategory: "CWE-295",
    });
    calculatedScore += 15;
  }

  // 6. Dex Code String & API Heuristics
  const suspiciousDexStrings = params.dexInfo?.suspiciousStrings || [];
  if (suspiciousDexStrings.length > 0) {
    const hasDexLoader = suspiciousDexStrings.some((s) => /DexClassLoader|InMemoryDex/i.test(s));
    const hasSu = suspiciousDexStrings.some((s) => /su|Runtime\.getRuntime|superSU/i.test(s));

    if (hasDexLoader) {
      findings.push({
        id: "DEX_DYNAMIC_CLASSLOADER",
        severity: "HIGH",
        title: "Dynamic Dex Bytecode Execution Detected",
        description:
          "Found references to DexClassLoader. This allows loading unverified remote executable code at runtime to bypass static app store scanners.",
        cweOrCategory: "CWE-94",
      });
      calculatedScore += 20;
    }

    if (hasSu) {
      findings.push({
        id: "DEX_ROOT_OR_SHELL",
        severity: "HIGH",
        title: "Root Shell Execution References",
        description:
          "Found references to system shell binaries (su, /system/bin/sh) or direct Runtime.exec invocations.",
        cweOrCategory: "CWE-78",
      });
      calculatedScore += 18;
    }
  }

  // 7. Component Exposure Checks
  const exportedComponents = params.components.filter(
    (c) => c.exported && !c.permission && c.name.toLowerCase() !== "mainactivity"
  );
  if (exportedComponents.length >= 3) {
    findings.push({
      id: "EXPOSED_COMPONENTS",
      severity: "MEDIUM",
      title: `${exportedComponents.length} Exported Components Without Permission Guard`,
      description:
        "Multiple activities, services, or receivers are exported without android:permission enforcement, leaving them callable by arbitrary 3rd party apps.",
      cweOrCategory: "CWE-926",
    });
    calculatedScore += 12;
  }

  // Clamp score
  const finalScore = Math.min(100, Math.max(0, calculatedScore));

  let verdict: SafetyVerdict = "SAFE";
  let rationale = "No significant malicious indicators or dangerous security flaws detected. Standard permissions aligned with typical app functionality.";

  if (finalScore >= 70) {
    verdict = "MALICIOUS";
    rationale = `High threat level detected (Risk Score: ${finalScore}/100). The APK contains critical threat indicators, including dangerous permission combinations, dropper vectors, or dynamic bytecode execution. Not recommended for installation.`;
  } else if (finalScore >= 45) {
    verdict = "SUSPICIOUS";
    rationale = `Moderate-to-high risk profile (Risk Score: ${finalScore}/100). The APK requests sensitive permissions or exhibits security weaknesses (e.g. outdated target SDK, unencrypted cleartext traffic, or debug signing) that warrant caution.`;
  } else if (finalScore >= 20) {
    verdict = "CAUTION";
    rationale = `Low-to-moderate risk profile (Risk Score: ${finalScore}/100). App requests standard sensitive permissions that require user review, but no active malware exploitation patterns were identified.`;
  }

  return {
    findings,
    riskScore: finalScore,
    verdict,
    rationale,
  };
}
