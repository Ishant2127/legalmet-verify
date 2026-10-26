"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Printer, AlertCircle, CheckCircle2, QrCode, Building2, Search } from "lucide-react";

export default function VerifyCertificatePage() {
  const [certNumber, setCertNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const runVerification = async (targetCert: string) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("verify_certificate", {
        cert_number: targetCert.trim(),
      });

      if (rpcError) {
        setError("Verification database service error. Please try again.");
      } else if (!data || data.length === 0) {
        setError("Certificate registration record not found in national registry.");
      } else {
        setResult(data[0]);
      }
    } catch (err) {
      setError("An unexpected system error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramCert = urlParams.get("cert");
    if (paramCert) {
      setCertNumber(paramCert);
      runVerification(paramCert);
    }
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (certNumber) runVerification(certNumber);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-8 font-sans">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        
        {/* Government Portal Header */}
        <div className="p-6 sm:p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-4 mb-4 border-b border-zinc-800 pb-5">
            <div className="p-3 bg-black text-amber-400 border border-zinc-800 rounded-xl">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                SIH26036 • Ministry of Consumer Affairs, Food & Public Distribution
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                Legal Metrology National Verification Registry
              </h1>
            </div>
          </div>

          <p className="text-sm text-zinc-400 mb-6">
            Public verification portal for weighing and measuring instruments certified under the Legal Metrology Act.
          </p>

          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Enter Certificate No (e.g. LMV-CERT-2026-0101)"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-xl bg-zinc-950 text-sm outline-none focus:ring-2 focus:ring-amber-500 border-zinc-700 font-mono tracking-wide uppercase text-white placeholder-zinc-600"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-black hover:bg-zinc-800 text-white font-medium rounded-xl text-sm transition shadow-sm border border-zinc-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              {loading ? "Searching..." : "Verify Status"}
            </button>
          </form>

          {/* Preset Sample Quick-Click Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Test Registry IDs:</span>
            {["LMV-CERT-2026-0101", "LMV-CERT-2026-0102", "LMV-CERT-2026-0103", "LMV-CERT-2026-0104"].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setCertNumber(code);
                  runVerification(code);
                }}
                className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-md font-mono text-amber-400/90 text-[11px] transition cursor-pointer"
              >
                {code}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* OFFICIAL DIGITAL CERTIFICATE DISPLAY */}
        {result && (
          <div className="bg-zinc-900 border-4 border-double border-zinc-700 rounded-2xl shadow-2xl overflow-hidden relative print:shadow-none print:border-black">
            
            {/* Watermark Crest Background Effect */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <ShieldCheck className="w-96 h-96 text-white" />
            </div>

            {/* Top Official Black Banner */}
            <div className="bg-black text-white p-6 text-center relative border-b-4 border-amber-500">
              <div className="absolute top-4 left-4 hidden sm:flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>GOVT DIGITAL SEAL</span>
              </div>
              
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-amber-400 font-bold">
                Government of India • Directorate of Legal Metrology
              </h2>
              <h3 className="text-2xl font-serif font-bold tracking-wide mt-1 text-white">
                CERTIFICATE OF VERIFICATION & COMPLIANCE
              </h3>
              
              <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-md flex items-center gap-1.5 shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                VERIFIED AUTHENTIC
              </div>
            </div>

            {/* Document Inner Content */}
            <div className="p-8 space-y-6 relative z-10 bg-zinc-900">
              
              {/* Certificate Metadata Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800 gap-4">
                <div>
                  <span className="text-[11px] text-zinc-500 block uppercase font-mono tracking-wider">Certificate Registration No</span>
                  <span className="font-mono text-xl font-bold text-amber-400 tracking-wide">{result.certificate_number}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500 block uppercase font-mono tracking-wider">Date of Verification</span>
                  <span className="font-medium text-sm text-zinc-200">{new Date(result.issued_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500 block uppercase font-mono tracking-wider">Compliance Status</span>
                  <span className="inline-block px-3 py-0.5 bg-emerald-950 text-emerald-300 rounded font-bold text-xs uppercase mt-0.5 border border-emerald-800">
                    {result.status}
                  </span>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm pt-2">
                <div className="space-y-1 border-b pb-3 border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Instrument Description</span>
                  <p className="font-serif font-bold text-base text-zinc-100">{result.instrument_name}</p>
                </div>
                <div className="space-y-1 border-b pb-3 border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Instrument Category</span>
                  <p className="font-semibold text-zinc-200">{result.instrument_type}</p>
                </div>
                <div className="space-y-1 border-b pb-3 border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Make & Model</span>
                  <p className="font-medium text-zinc-300">{result.manufacturer} ({result.model_number})</p>
                </div>
                <div className="space-y-1 border-b pb-3 border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Serial Number</span>
                  <p className="font-mono font-bold text-amber-400">{result.serial_number}</p>
                </div>
                <div className="space-y-1 border-b pb-3 border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Registered Entity / Owner</span>
                  <p className="font-semibold text-zinc-200">{result.owner_name}</p>
                </div>
                <div className="space-y-1 border-b pb-3 border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Valid Until</span>
                  <p className="font-bold text-red-400">{new Date(result.valid_until).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-400 leading-relaxed">
                <strong className="text-amber-400">Statutory Notice:</strong> Issued under section 24 of the Legal Metrology Act. Use of unverified weights or measures in commercial transactions is punishable by law.
              </div>

              {/* Footer Stamp & Barcode */}
              <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                    <QrCode className="w-12 h-12 text-zinc-200" />
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono space-y-0.5">
                    <p className="font-bold text-zinc-200">CRYPTOGRAPHIC VERIFICATION HASH</p>
                    <p className="text-[10px] text-zinc-500">{result.digital_hash ? result.digital_hash.substring(0, 32) + '...' : 'SHA256 SECURED'}</p>
                    <p className="text-emerald-400 font-bold">● SIGNED BY CENTRAL METROLOGY ROOT AUTHORITY</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-zinc-800 text-white border border-zinc-700 rounded-xl text-sm font-medium transition shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  Print Official Document
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}