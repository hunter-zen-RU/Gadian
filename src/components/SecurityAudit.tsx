import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { ApkAnalysisData, OnlineGeminiAudit } from "../types/apk";

interface SecurityAuditProps {
  currentApk: ApkAnalysisData;
  onlineAudit: OnlineGeminiAudit | null;
  onTriggerOnlineAudit: () => void;
  isAuditingOnline: boolean;
  onlineError: string | null;
}

export const SecurityAudit: React.FC<SecurityAuditProps> = ({
  currentApk,
  onlineAudit,
  onTriggerOnlineAudit,
  isAuditingOnline,
  onlineError,
}) => {
  const verdict = onlineAudit?.safetyRecommendation || currentApk.offlineVerdict;
  const isSafe = verdict === "SAFE";
  const isMalicious = verdict === "MALICIOUS";
  const isSuspicious = verdict === "SUSPICIOUS";
  const isCaution = verdict === "CAUTION";

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Primary Safety Verdict Banner */}
      <div
        className={`p-6 rounded border font-mono transition-all ${
          isSafe
            ? "bg-emerald-950/20 border-emerald-600/40 text-emerald-300"
            : isMalicious
            ? "bg-rose-950/30 border-rose-600/50 text-rose-300"
            : "bg-amber-950/25 border-amber-600/40 text-amber-300"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-lg border ${
                isSafe
                  ? "bg-emerald-900/30 border-emerald-500/40 text-emerald-400"
                  : isMalicious
                  ? "bg-rose-900/40 border-rose-500/50 text-rose-400"
                  : "bg-amber-900/30 border-amber-500/40 text-amber-400"
              }`}
            >
              {isSafe && <ShieldCheck className="w-8 h-8" />}
              {isMalicious && <ShieldAlert className="w-8 h-8" />}
              {!isSafe && !isMalicious && <AlertTriangle className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider opacity-75">
                GADIAN Threat Intelligence Verdict
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                RECOMMENDATION: {verdict}
              </h2>
              <p className="text-xs sm:text-sm opacity-90 max-w-2xl">
                {onlineAudit
                  ? onlineAudit.executiveSummary
                  : currentApk.offlineVerdictRationale}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0 bg-neutral-950/50 p-4 rounded border border-neutral-800/80">
            <div className="text-xs text-neutral-400">Offline Threat Score</div>
            <div className="text-3xl font-bold tabular-nums">
              {currentApk.offlineRiskScore}
              <span className="text-sm font-normal text-neutral-500">/100</span>
            </div>
            <div className="text-[11px] text-neutral-400">
              {onlineAudit
                ? `AI Confidence: ${onlineAudit.confidenceScore}%`
                : "Calculated via Offline AST"}
            </div>
          </div>
        </div>
      </div>

      {/* Online AI Security Audit Callout */}
      <div className="p-5 rounded bg-neutral-900 border border-neutral-800 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Online Deep Threat Intelligence (Gemini 3.8 Flash)</span>
            </div>
            <p className="text-xs text-neutral-400 max-w-xl">
              Sends decompiled AST, permissions matrix, and DEX string tables to Gemini 3.8 Flash for reverse-engineering debriefing, MITRE ATT&CK Mobile mapping, and developer remediation.
            </p>
          </div>

          <button
            onClick={onTriggerOnlineAudit}
            disabled={isAuditingOnline}
            className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditingOnline ? "animate-spin" : ""}`} />
            <span>{isAuditingOnline ? "Analyzing Bytecode..." : onlineAudit ? "Re-Run AI Audit" : "Run Online AI Audit"}</span>
          </button>
        </div>

        {onlineError && (
          <div className="mt-3 p-3 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {onlineError}
          </div>
        )}
      </div>

      {/* Online Gemini Intelligence Report (If Available) */}
      {onlineAudit && (
        <div className="space-y-6 font-mono">
          <div className="text-sm font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Online Threat Debrief & Reverse Engineering Breakdown</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Verdict Rationale */}
            <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="text-xs font-bold text-neutral-400 uppercase">Verdict Rationale</div>
              <p className="text-xs text-neutral-300 leading-relaxed">{onlineAudit.verdictRationale}</p>
            </div>

            {/* Dangerous Permission Combinations */}
            <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="text-xs font-bold text-neutral-400 uppercase">
                High-Risk Permission Interactions
              </div>
              {onlineAudit.dangerousCombinations.length === 0 ? (
                <p className="text-xs text-neutral-500">No weaponized permission combinations detected.</p>
              ) : (
                <div className="space-y-2">
                  {onlineAudit.dangerousCombinations.map((combo, i) => (
                    <div key={i} className="p-2.5 rounded bg-rose-950/20 border border-rose-900/60 text-xs">
                      <div className="font-semibold text-rose-300">{combo.permissions.join(" + ")}</div>
                      <div className="text-neutral-400 mt-1">{combo.risk}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Threat Categories */}
          {onlineAudit.threatCategories.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-neutral-400 uppercase">Identified Threat Vectors</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {onlineAudit.threatCategories.map((cat, i) => (
                  <div key={i} className="p-3.5 rounded bg-neutral-900 border border-neutral-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-200">{cat.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          cat.severity === "CRITICAL"
                            ? "bg-rose-950 text-rose-400 border border-rose-800"
                            : cat.severity === "HIGH"
                            ? "bg-rose-900/60 text-rose-300"
                            : cat.severity === "MEDIUM"
                            ? "bg-amber-900/50 text-amber-300"
                            : "bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        {cat.severity}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{cat.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MITRE ATT&CK Mobile Matrix Mapping */}
          {onlineAudit.mitreAttackTechniques.length > 0 && (
            <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="text-xs font-bold text-neutral-300 uppercase">
                MITRE ATT&CK® for Mobile Techniques Mapped
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {onlineAudit.mitreAttackTechniques.map((tech) => (
                  <div key={tech.id} className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold text-xs">{tech.id}</span>
                      <span className="text-neutral-200 font-semibold text-xs">{tech.name}</span>
                    </div>
                    <p className="text-xs text-neutral-400">{tech.relevantEvidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Developer Remediation & Hardening Steps */}
          {onlineAudit.developerRemediation.length > 0 && (
            <div className="p-4 rounded bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="text-xs font-bold text-neutral-300 uppercase">
                Developer Hardening & Security Remediation Checklist
              </div>
              <ul className="space-y-2 text-xs text-neutral-300">
                {onlineAudit.developerRemediation.map((rem, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rem}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Offline Heuristic Findings Matrix */}
      <div className="space-y-3 font-mono">
        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Offline Static & Heuristic AST Rule Results ({currentApk.heuristicFindings.length})
        </div>

        {currentApk.heuristicFindings.length === 0 ? (
          <div className="p-6 rounded bg-neutral-900 border border-neutral-800 text-center text-xs text-neutral-400">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <span>No offline heuristic alarms triggered. Baseline manifest and bytecode pass verification.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {currentApk.heuristicFindings.map((finding) => {
              const isCrit = finding.severity === "CRITICAL" || finding.severity === "HIGH";
              return (
                <div
                  key={finding.id}
                  className={`p-4 rounded border ${
                    isCrit
                      ? "bg-rose-950/20 border-rose-800/60 text-neutral-200"
                      : "bg-neutral-900 border-neutral-800 text-neutral-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          finding.severity === "CRITICAL"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : finding.severity === "HIGH"
                            ? "bg-rose-900/50 text-rose-300"
                            : "bg-amber-900/50 text-amber-300"
                        }`}
                      >
                        {finding.severity}
                      </span>
                      <span className="font-semibold text-xs sm:text-sm text-neutral-100">
                        {finding.title}
                      </span>
                    </div>

                    {finding.cweOrCategory && (
                      <span className="text-[11px] text-neutral-500">{finding.cweOrCategory}</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{finding.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
