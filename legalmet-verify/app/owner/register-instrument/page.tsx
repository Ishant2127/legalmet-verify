"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Send
} from "lucide-react";
import Link from "next/link";

export default function RegisterInstrumentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    instrument_name: "",
    instrument_type: "Weighing Scale",
    manufacturer: "",
    model_number: "",
    serial_number: "",
    location: "",
    district: "Central District",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to register an instrument.");
        setLoading(false);
        return;
      }

      // 1. Insert instrument
      const { data: inst, error: instError } = await supabase
        .from("instruments")
        .insert({
          owner_id: user.id,
          instrument_name: form.instrument_name,
          instrument_type: form.instrument_type,
          manufacturer: form.manufacturer,
          model_number: form.model_number,
          serial_number: form.serial_number,
          location: form.location,
          district: form.district,
        })
        .select()
        .single();

      if (instError) {
        throw new Error(instError.message);
      }

      // 2. Automatically create verification application
      const appNumber = `LMV-APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error: appError } = await supabase
        .from("verification_applications")
        .insert({
          instrument_id: inst.id,
          owner_id: user.id,
          application_number: appNumber,
          status: "pending",
        });

      if (appError) {
        throw new Error(appError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/owner/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to register instrument.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/owner/dashboard"
            className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <span className="text-[11px] font-mono text-amber-400 uppercase font-bold">
            Form LMV-01: Instrument Declaration
          </span>
        </div>

        {/* Card Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6 border-b border-zinc-800 pb-5">
            <div className="p-3 bg-black text-amber-400 border border-zinc-800 rounded-xl">
              <Scale className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Register Device for Verification
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Declare commercial weighing or measuring apparatus to request mandatory official certification.
              </p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Instrument registered and application filed! Redirecting to dashboard...</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                Instrument Description / Name *
              </label>
              <input
                type="text"
                name="instrument_name"
                required
                placeholder="e.g. 50kg Digital Platform Scale"
                value={form.instrument_name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Category / Type *
                </label>
                <select
                  name="instrument_type"
                  value={form.instrument_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Weighing Scale">Weighing Scale</option>
                  <option value="Heavy Weighing System">Heavy Weighing System (Weighbridge)</option>
                  <option value="Flow Meter">Flow Meter / Fuel Dispenser</option>
                  <option value="Linear Measure">Linear Measure / Tape</option>
                  <option value="Capacity Measure">Capacity Measure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Serial Number *
                </label>
                <input
                  type="text"
                  name="serial_number"
                  required
                  placeholder="e.g. SN-998822-X"
                  value={form.serial_number}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Manufacturer *
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  required
                  placeholder="e.g. METTLER TOLEDO / Essae"
                  value={form.manufacturer}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Model Number
                </label>
                <input
                  type="text"
                  name="model_number"
                  placeholder="e.g. Model PS-500"
                  value={form.model_number}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Physical Installation Address *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="e.g. Market Yard 4, Shop 12"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                  Metrology District *
                </label>
                <select
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Central District">Central District</option>
                  <option value="North District">North District</option>
                  <option value="South District">South District</option>
                  <option value="East District">East District</option>
                  <option value="West District">West District</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
              <Link
                href="/owner/dashboard"
                className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-black hover:bg-zinc-800 border border-amber-500 text-amber-400 rounded-xl text-xs font-medium transition shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? "Submitting..." : "Submit for Verification"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
