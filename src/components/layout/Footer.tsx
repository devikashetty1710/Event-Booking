import React from 'react'
import { School, MapPin, Phone, Mail, ShieldCheck } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 text-white font-extrabold text-base mb-2">
              <School className="w-5 h-5 text-indigo-400" />
              <span>Nitte CampusConnect</span>
            </div>
            <p className="text-slate-300 font-medium text-xs mb-3">
              "One Campus. One Calendar. Smarter Events."
            </p>
            <p className="text-slate-400 text-xs max-w-md leading-relaxed">
              Centralized venue discovery and smart event booking portal for NMAM Institute of Technology (NMAMIT), Nitte. Eliminates spreadsheet confusion and prevents scheduling overlaps.
            </p>
            <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Restricted to verified @nmamit.in and @nitte.in institutional credentials</span>
            </div>
          </div>

          {/* Col 2: Featured Real Venues */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Real Campus Venues
            </h4>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>• Nandini Seminar Hall (APJ Kalam Block)</li>
              <li>• Shambavi Seminar Hall (APJ Kalam Block)</li>
              <li>• Sambhram Hall (Ramanujan Block)</li>
              <li>• Phalguni Hall (Ramanujan Block)</li>
            </ul>
          </div>

          {/* Col 3: Contact & Campus Info */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Campus Facilities Office
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>NMAMIT Campus, Nitte, Karkala Taluk, Udupi, Karnataka – 574110</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>facilities@nmamit.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>+91 8258 281263 / 281264</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} NMAM Institute of Technology, Nitte. User Interface Design Subject Project.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">Timezone: Asia/Kolkata (IST)</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Safe Concurrency Lock Active</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
