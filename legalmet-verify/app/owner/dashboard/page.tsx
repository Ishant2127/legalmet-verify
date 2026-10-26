"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Building2, 
  Scale, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  RefreshCw,
  FileText
} from "lucide-react";
import Link from "next/link";

export default function OwnerDashboardPage() {
  const [instruments, setInstruments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(prof);

        const { data: insts } = await supabase
          .from("instruments")
          .select(`
            id,
            instrument_name,
            instrument_type,
            serial_number,
            manufacturer,
            model_number,
            location,
            district,
            verification_applications (
              id,
              application_number,
              status,
              certificates (
                certificate_number,
                valid_until
              )
            )
          `)
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        setInstruments(insts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        
        {/* Header */}
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black text-amber-400 border border-zinc-800 rounded-xl">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                Trader & Device Owner Portal • Directorate of Legal Metrology
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                {profile?.full_name ? `${profile.full_name}'s Commercial Instruments` : "My Commercial Instruments"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-300 transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
              Refresh
            </button>
            <Link
              href="/owner/register-instrument"
              className="px-4 py-2 bg-black hover:bg-zinc-800 border border-amber-500 text-amber-400 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Register New Device
            </Link>
          </div>
        </div>

        {/* Instruments Grid */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 font-mono text-sm">
              Loading registered instruments...
            </div>
          ) : instruments.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Scale className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-zinc-400 text-sm">No measuring instruments declared yet.</p>
              <Link
                href="/owner/register-instrument"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black border border-amber-500 text-amber-400 text-xs font-mono rounded-xl hover:bg-zinc-800 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Register First Instrument
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <th className="p-4">Instrument Details</th>
                    <th className="p-4">Make & Serial No</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Verification Status</th>
                    <th className="p-4">Digital Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {instruments.map((inst) => {
                    const app = inst.verification_applications?.[0];
                    const cert = app?.certificates?.[0];
                    const isApproved = app?.status === "approved";

                    return (
                      <tr key={inst.id} className="hover:bg-zinc-950/40 transition">
                        <td className="p-4 align-top">
                          <p className="font-semibold text-zinc-100">{inst.instrument_name}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{inst.instrument_type}</p>
                        </td>
                        <td className="p-4 align-top">
                          <p className="font-medium text-zinc-300">
                            {inst.manufacturer} {inst.model_number ? `(${inst.model_number})` : ""}
                          </p>
                          <p className="font-mono text-xs text-amber-400 mt-1">S/N: {inst.serial_number}</p>
                        </td>
                        <td className="p-4 align-top">
                          <p className="text-xs text-zinc-300">{inst.location}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{inst.district}</p>
                        </td>
                        <td className="p-4 align-top">
                          {app ? (
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
                          ) : (
                            <span className="text-xs text-zinc-600 font-mono">No application</span>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          {cert ? (
                            <Link
                              href={`/verify?cert=${cert.certificate_number}`}
                              className="font-mono text-xs text-amber-400 hover:underline flex items-center gap-1"
                            >
                              {cert.certificate_number}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-xs text-zinc-600 font-mono">Awaiting inspection</span>
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
