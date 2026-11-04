export type SafetyVerdict = 'SAFE' | 'CAUTION' | 'SUSPICIOUS' | 'MALICIOUS';

export interface PermissionDetail {
  name: string;
  shortName: string;
  category: 'PRIVACY' | 'SECURITY' | 'SMS_CALL' | 'DEVICE_CONTROL' | 'NETWORK' | 'NORMAL';
  protectionLevel: 'dangerous' | 'normal' | 'signature' | 'signatureOrSystem';
  riskWeight: number; // 0 to 10
  description: string;
}

export interface ComponentInfo {
  name: string;
  type: 'activity' | 'service' | 'receiver' | 'provider';
  exported: boolean;
  permission?: string;
  intentFilters: string[];
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom?: string;
  validTo?: string;
  fingerprintSha1?: string;
  fingerprintSha256?: string;
  isDebug: boolean;
  schemes: string[]; // e.g. ["v1 (JAR)", "v2 (APK Signature)"]
}

export interface DexInspection {
  magic: string;
  fileSize: number;
  classCount: number;
  methodCount: number;
  hasMultiDex: boolean;
  suspiciousStrings: string[];
  nativeLibraries: string[];
}

export interface HeuristicFinding {
  id: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  cweOrCategory?: string;
}

export interface ApkAnalysisData {
  id: string;
  fileName: string;
  fileSize: number;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number | string;
  minSdk: number;
  targetSdk: number;
  compileSdk?: number;
  permissions: string[];
  permissionDetails: PermissionDetail[];
  components: ComponentInfo[];
  activities: string[];
  services: string[];
  receivers: string[];
  providers: string[];
  manifestXml: string;
  certificate: CertificateInfo;
  dexInfo: DexInspection;
  heuristicFindings: HeuristicFinding[];
  offlineRiskScore: number; // 0 to 100
  offlineVerdict: SafetyVerdict;
  offlineVerdictRationale: string;
}

export interface OnlineGeminiAudit {
  safetyRecommendation: SafetyVerdict;
  confidenceScore: number;
  executiveSummary: string;
  verdictRationale: string;
  threatCategories: {
    name: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }[];
  dangerousCombinations: {
    permissions: string[];
    risk: string;
  }[];
  mitreAttackTechniques: {
    id: string;
    name: string;
    relevantEvidence: string;
  }[];
  developerRemediation: string[];
}
