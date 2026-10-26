"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Building2, 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ExternalLink,
  RefreshCw,
  Search
} from "lucide-react";
import Link from "next/link";

interface Application {
  id: string;
  application_number: string;
  status: string;
  created_at: string;
  instrument_id: string;
  owner_id: string;
  instruments?: {
    instrument_name: string;
    instrument_type: string;
    serial_number: string;
    manufacturer: string;
    model_number: string;
    district: string;
  };
  profiles?: {
    full_name: string;
    organization: string;
  };
  certificates?: {
    certificate_number: string;
    valid_until: string;
  }[];
}

export default function OfficialApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("verification_applications")
        .select(`
          id,
          application_number,
          status,
          created_at,
          instrument_id,
          owner_id,
          instruments (
            instrument_name,
            instrument_type,
            serial_number,
            manufacturer,
            model_number,
            district
          ),
          profiles:owner_id (
            full_name,
            organization
          ),
          certificates (
            certificate_number,
            valid_until
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage({ type: "error", text: "Failed to load verification applications: " + error.message });
      } else {
        setApplications((data as any) || []);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Unexpected error: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleIssueCertificate = async (appId: string) => {
    setIssuingId(appId);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("issue_certificate", {
        app_id: appId,
      });

      if (error) {
        setMessage({ type: "error", text: "Error issuing certificate: " + error.message });
      } else if (data?.success) {
        setMessage({ 
          type: "success", 
          text: `Certificate ${data.certificate_number} issued successfully!` 
        });
        await fetchApplications();
      } else {
        setMessage({ type: "error", text: data?.error || "Failed to issue certificate." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "An error occurred: " + err.message });
    } finally {
      setIssuingId(null);
    }
  };

  const filteredApps = applications.filter((app) => {
    const term = searchTerm.toLowerCase();
    return (
      app.application_number?.toLowerCase().includes(term) ||
      app.instruments?.instrument_name?.toLowerCase().includes(term) ||
      app.instruments?.serial_number?.toLowerCase().includes(term) ||
      app.profiles?.full_name?.toLowerCase().includes(term) ||
      app.status?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black text-amber-400 border border-zinc-800 rounded-xl">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                Directorate of Legal Metrology • Inspection Desk
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                Official Verification Queue
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchApplications}
              disabled={loading}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-300 transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
              Refresh
            </button>
            <Link
              href="/verify"
              className="px-4 py-2 bg-black hover:bg-zinc-800 border border-amber-500/40 text-amber-400 rounded-xl text-xs font-mono transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Public Registry
            </Link>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
              message.type === "success"
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                : "bg-red-950/40 border-red-900 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search applications by number, device name, serial number, or trader..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border rounded-xl bg-zinc-900 border-zinc-800 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Applications List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 font-mono text-sm">
              Loading verification applications from registry...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 font-mono text-sm">
              No verification applications found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <th className="p-4">App Ref</th>
                    <th className="p-4">Instrument & Specs</th>
                    <th className="p-4">Owner / Establishment</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Certificate</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {filteredApps.map((app) => {
                    const cert = app.certificates?.[0];
                    const isApproved = app.status === "approved";

                    return (
                      <tr key={app.id} className="hover:bg-zinc-950/40 transition">
                        <td className="p-4 align-top font-mono text-xs text-amber-400 font-bold">
                          {app.application_number}
                          <span className="block text-[10px] text-zinc-500 font-normal mt-0.5">
                            {new Date(app.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4 align-top">
                          <p className="font-semibold text-zinc-100">
                            {app.instruments?.instrument_name || "Standard Instrument"}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {app.instruments?.manufacturer} • {app.instruments?.model_number}
                          </p>
                          <p className="font-mono text-[11px] text-zinc-500 mt-1">
                            S/N: {app.instruments?.serial_number}
                          </p>
                        </td>
                        <td className="p-4 align-top">
                          <p className="font-medium text-zinc-200">
                            {app.profiles?.full_name || "Registered Trader"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {app.profiles?.organization || app.instruments?.district || "General Trade"}
                          </p>
                        </td>
                        <td className="p-4 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase font-bold ${
                              isApproved
                                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                                : "bg-amber-950/60 text-amber-300 border border-amber-800"
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4 align-top">
                          {cert ? (
                            <div>
                              <Link
                                href={`/verify?cert=${cert.certificate_number}`}
                                className="font-mono text-xs text-amber-400 hover:underline flex items-center gap-1"
                              >
                                {cert.certificate_number}
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                              <span className="text-[10px] text-zinc-500 block mt-0.5">
                                Valid until: {new Date(cert.valid_until).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-600 font-mono">Pending Issuance</span>
                          )}
                        </td>
                        <td className="p-4 align-top text-right">
                          {!isApproved ? (
                            <button
                              onClick={() => handleIssueCertificate(app.id)}
                              disabled={issuingId === app.id}
                              className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 border border-amber-500 text-amber-400 rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {issuingId === app.id ? "Issuing..." : "Approve & Issue"}
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-400 font-mono">Verified</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
