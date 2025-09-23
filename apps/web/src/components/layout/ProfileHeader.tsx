import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

const ProfileHeader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="relative max-w-7xl mx-auto px-6 rounded-2xl p-8 shadow-xl ring-1 ring-white/10 overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900">
        {/* Subtle canopy glow layers */}
        <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
          <div className="absolute -top-20 -right-10 h-64 w-64 bg-emerald-700/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-8 h-72 w-72 bg-teal-600/20 rounded-full blur-3xl" />
          <div className="absolute top-10 left-1/3 h-40 w-40 bg-lime-400/10 rounded-full blur-2xl" />
        </div>

        {/* Decorative leaf silhouette (professional, low opacity) */}
        <svg
          className="pointer-events-none absolute -right-6 -bottom-6 h-48 w-48 opacity-[0.08] text-lime-200"
          viewBox="0 0 200 200"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M118 12c-22 7-44 30-57 50-17 26-23 52-16 72 6 19 23 31 44 35 25 4 57-4 79-23 18-16 29-38 28-57-1-18-12-33-30-45-16-10-35-15-48-32z" />
          <path d="M55 160c12-8 30-12 43-28 14-16 20-40 19-61-1-21-9-38-20-49-13 7-26 19-36 34-12 18-18 38-18 55 0 20 5 36 12 49z" opacity=".7" />
        </svg>

        {/* Firefly accents (static dots for elegance) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-6 left-10 h-1.5 w-1.5 rounded-full bg-amber-200/70 shadow-[0_0_12px_2px_rgba(251,191,36,0.35)]" />
          <div className="absolute top-20 right-24 h-1.5 w-1.5 rounded-full bg-emerald-100/70 shadow-[0_0_12px_2px_rgba(190,242,100,0.25)]" />
          <div className="absolute bottom-16 left-1/3 h-1.5 w-1.5 rounded-full bg-amber-100/70 shadow-[0_0_12px_2px_rgba(253,230,138,0.25)]" />
        </div>
        <div className="flex items-center space-x-4">
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-emerald-50 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">My Profile</h1>
            </div>
            <p className="text-emerald-100/90 text-base leading-relaxed">
              Manage your personal information and learning preferences with our
              modern, secure profile system.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="bg-emerald-900/60 backdrop-blur-sm rounded-xl px-3 py-1.5 text-sm text-emerald-50 border border-white/10">
                Learning Preferences
              </div>
              <div className="bg-emerald-900/60 backdrop-blur-sm rounded-xl px-3 py-1.5 text-sm text-emerald-50 border border-white/10">
                Secure Data
              </div>
              <div className="bg-emerald-900/60 backdrop-blur-sm rounded-xl px-3 py-1.5 text-sm text-emerald-50 border border-white/10">
                Real-time Sync
              </div>
            </div>
          </div>
        </div>

        {/* Edge vignette for depth */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
      </div>

      {/* Bottom accent line */}
      <div className="relative mt-4 max-w-7xl mx-auto px-6">
        <Separator className="bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
        <div className="absolute inset-0 flex justify-center">
          <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-600 to-amber-300 rounded-full -mt-px"></div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
