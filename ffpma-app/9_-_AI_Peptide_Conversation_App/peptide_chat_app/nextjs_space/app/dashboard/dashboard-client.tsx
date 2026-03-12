'use client';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Beaker, LogOut, Search, Calculator, Droplets, GraduationCap, Sparkles, ArrowRight, Loader2, BarChart, Syringe, Activity, Stethoscope, Target } from 'lucide-react';

interface Peptide {
  id: string;
  name: string;
  discoveryYear: string;
  era: string;
  description: string;
  personaTrait: string;
  imageUrl?: string;
}

interface IVTherapy {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string[];
  personaTrait: string;
  infusionTime: string;
}

interface IMTherapy {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string[];
  personaTrait: string;
  frequency: string;
}

const eraColors: Record<string, string> = {
  'Regenerative & Healing': 'from-emerald-500 to-teal-500',
  'Growth Hormone Peptides': 'from-cyan-500 to-blue-500',
  'Metabolic & Weight Loss': 'from-green-500 to-emerald-500',
  'Metabolic & Performance': 'from-lime-500 to-green-500',
  'Immune & Inflammation': 'from-blue-500 to-indigo-500',
  'Cognitive & Neuroprotective': 'from-violet-500 to-purple-600',
  'Sexual Health': 'from-pink-500 to-rose-500',
  'Anti-Aging & Longevity': 'from-amber-500 to-orange-500',
  'Cancer & Specialized': 'from-red-500 to-rose-600'
};

const ivCategoryColors: Record<string, string> = {
  'Detoxification': 'from-emerald-500 to-green-500',
  'General Wellness': 'from-cyan-500 to-blue-500',
  'Immune & Oncology Support': 'from-amber-500 to-orange-500',
  'Anti-Aging & Cellular Repair': 'from-violet-500 to-purple-500',
  'Oxidative Therapy': 'from-red-500 to-rose-500',
  'Anti-Inflammatory & Pain': 'from-blue-500 to-indigo-500',
  'Metabolic & Neuroprotection': 'from-teal-500 to-cyan-500',
  'Oncology Support': 'from-pink-500 to-rose-500',
  'Liver & Cellular Repair': 'from-lime-500 to-green-500',
  'Anti-Inflammatory & Oncology Support': 'from-yellow-500 to-amber-500',
  'Nutritional Support': 'from-sky-500 to-blue-500'
};

const imCategoryColors: Record<string, string> = {
  'Fat Dissolving': 'from-amber-500 to-orange-500',
  'Energy & Cellular': 'from-yellow-500 to-amber-500',
  'Anti-Aging': 'from-violet-500 to-purple-500',
  'Metabolic': 'from-lime-500 to-green-500',
  'Wellness': 'from-cyan-500 to-blue-500',
  'Immune Support': 'from-emerald-500 to-teal-500',
  'Beauty & Hair': 'from-pink-500 to-rose-500',
  'Anti-Aging & Cardiovascular': 'from-red-500 to-rose-600'
};

export default function DashboardClient({ userName, isAdmin }: { userName: string; isAdmin: boolean }) {
  const [activeTab, setActiveTab] = useState<'peptides' | 'iv' | 'im'>('peptides');
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [ivTherapies, setIvTherapies] = useState<IVTherapy[]>([]);
  const [imTherapies, setImTherapies] = useState<IMTherapy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIMCategory, setSelectedIMCategory] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch peptides
    fetch('/api/peptides')
      .then(res => res.json())
      .then(data => {
        setPeptides(data || []);
      })
      .catch(() => {});

    // Fetch IV therapies
    fetch('/api/iv-therapies')
      .then(res => res.json())
      .then(data => {
        setIvTherapies(data || []);
      })
      .catch(() => {});

    // Fetch IM therapies
    fetch('/api/im-therapies')
      .then(res => res.json())
      .then(data => {
        setImTherapies(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const eras = [...new Set(peptides?.map(p => p?.era) || [])];
  const categories = [...new Set(ivTherapies?.map(iv => iv?.category) || [])];
  const imCategories = [...new Set(imTherapies?.map(im => im?.category) || [])];

  const filteredPeptides = peptides?.filter(p => {
    const matchSearch = p?.name?.toLowerCase()?.includes(search?.toLowerCase() || '') ||
                       p?.description?.toLowerCase()?.includes(search?.toLowerCase() || '');
    const matchEra = !selectedEra || p?.era === selectedEra;
    return matchSearch && matchEra;
  }) || [];

  const filteredIVs = ivTherapies?.filter(iv => {
    const matchSearch = iv?.name?.toLowerCase()?.includes(search?.toLowerCase() || '') ||
                       iv?.description?.toLowerCase()?.includes(search?.toLowerCase() || '');
    const matchCategory = !selectedCategory || iv?.category === selectedCategory;
    return matchSearch && matchCategory;
  }) || [];

  const filteredIMs = imTherapies?.filter(im => {
    const matchSearch = im?.name?.toLowerCase()?.includes(search?.toLowerCase() || '') ||
                       im?.description?.toLowerCase()?.includes(search?.toLowerCase() || '');
    const matchCategory = !selectedIMCategory || im?.category === selectedIMCategory;
    return matchSearch && matchCategory;
  }) || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Beaker className="w-8 h-8 text-cyan-400" />
              <Syringe className="w-4 h-4 text-emerald-400 absolute -bottom-1 -right-1" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              FF Intelligence Console
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition text-white font-medium"
              >
                <BarChart className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <Link
              href="/tools"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 transition text-white font-medium"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Tools</span>
            </Link>
            <span className="text-slate-400 hidden sm:block">Welcome, {userName}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-block px-4 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium mb-4">
            2026 Edition — Forgotten Formula PMA — Licensed Practitioners & Staff Only
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Clinical Intelligence Console
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto mb-6">
            AI-powered clinical consultations for peptides and IV therapies. Protocols, dosing, monitoring guidelines, 
            and practical clinical pearls from the 2026 PMA Manual.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-800/50 rounded-2xl p-1.5 border border-slate-700 flex-wrap justify-center gap-1">
            <button
              onClick={() => { setActiveTab('peptides'); setSearch(''); setSelectedEra(null); setSelectedCategory(null); setSelectedIMCategory(null); }}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'peptides' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Beaker className="w-5 h-5" />
              <span className="hidden sm:inline">Peptides</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">{peptides.length}</span>
            </button>
            <button
              onClick={() => { setActiveTab('iv'); setSearch(''); setSelectedEra(null); setSelectedCategory(null); setSelectedIMCategory(null); }}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'iv' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Syringe className="w-5 h-5" />
              <span className="hidden sm:inline">IV</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">{ivTherapies.length}</span>
            </button>
            <button
              onClick={() => { setActiveTab('im'); setSearch(''); setSelectedEra(null); setSelectedCategory(null); setSelectedIMCategory(null); }}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'im' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-5 h-5" />
              <span className="hidden sm:inline">IM</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-white/20">{imTherapies.length}</span>
            </button>
          </div>
        </div>
        
        {/* Quick Tools */}
        <div className="flex justify-center gap-4 flex-wrap mb-8">
          {activeTab === 'peptides' && (
            <>
              <Link
                href="/tools"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition text-white font-medium text-sm"
              >
                <Calculator className="w-4 h-4" />
                Dosing Calculator
              </Link>
              <Link
                href="/tools?tab=reconstitution"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition text-white font-medium text-sm"
              >
                <Droplets className="w-4 h-4" />
                Reconstitution Guide
              </Link>
              <Link
                href="/learn"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition text-white font-medium text-sm"
              >
                <GraduationCap className="w-4 h-4" />
                Learning Center
              </Link>
            </>
          )}
          {activeTab === 'iv' && (
            <>
              <Link
                href="/tools?tab=iv-calculator"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition text-white font-medium text-sm"
              >
                <Activity className="w-4 h-4" />
                IV Drip Calculator
              </Link>
              <Link
                href="/tools?tab=iv-dilution"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition text-white font-medium text-sm"
              >
                <Droplets className="w-4 h-4" />
                Dilution Calculator
              </Link>
              <Link
                href="/nurse"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 transition text-white font-medium text-sm"
              >
                <Stethoscope className="w-4 h-4" />
                IV Nurse Assistant
              </Link>
            </>
          )}
          {activeTab === 'im' && (
            <>
              <Link
                href="/tools"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition text-white font-medium text-sm"
              >
                <Calculator className="w-4 h-4" />
                Dosing Calculator
              </Link>
              <Link
                href="/tools?tab=reconstitution"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 transition text-white font-medium text-sm"
              >
                <Droplets className="w-4 h-4" />
                Reconstitution Guide
              </Link>
              <Link
                href="/learn"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 transition text-white font-medium text-sm"
              >
                <GraduationCap className="w-4 h-4" />
                Learning Center
              </Link>
            </>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'peptides' ? 'Search peptides...' : activeTab === 'iv' ? 'Search IV therapies...' : 'Search IM therapies...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-cyan-500 focus:outline-none transition"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {activeTab === 'peptides' && (
              <>
                <button
                  onClick={() => setSelectedEra(null)}
                  className={`px-4 py-2 rounded-lg transition ${!selectedEra ? 'bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                  All
                </button>
                {eras?.slice(0, 4)?.map(era => (
                  <button
                    key={era}
                    onClick={() => setSelectedEra(era === selectedEra ? null : era)}
                    className={`px-4 py-2 rounded-lg transition truncate max-w-[150px] ${era === selectedEra ? 'bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                  >
                    {era}
                  </button>
                ))}
              </>
            )}
            {activeTab === 'iv' && (
              <>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-lg transition ${!selectedCategory ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                  All
                </button>
                {categories?.slice(0, 4)?.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                    className={`px-4 py-2 rounded-lg transition truncate max-w-[150px] ${cat === selectedCategory ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                  >
                    {cat}
                  </button>
                ))}
              </>
            )}
            {activeTab === 'im' && (
              <>
                <button
                  onClick={() => setSelectedIMCategory(null)}
                  className={`px-4 py-2 rounded-lg transition ${!selectedIMCategory ? 'bg-amber-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                  All
                </button>
                {imCategories?.slice(0, 4)?.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedIMCategory(cat === selectedIMCategory ? null : cat)}
                    className={`px-4 py-2 rounded-lg transition truncate max-w-[150px] ${cat === selectedIMCategory ? 'bg-amber-500 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}
                  >
                    {cat}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
          </div>
        ) : activeTab === 'peptides' ? (
          /* Peptide Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeptides?.map((peptide, i) => (
              <motion.div
                key={peptide?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/chat/${peptide?.id}`)}
                className="glass rounded-2xl overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300"
              >
                <div className={`h-2 bg-gradient-to-r ${eraColors[peptide?.era] || 'from-slate-500 to-slate-600'}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">
                        {peptide?.name}
                      </h3>
                      <p className="text-sm text-slate-400">{peptide?.era}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300">
                      {peptide?.personaTrait}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                    {peptide?.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Discovered {peptide?.discoveryYear}</span>
                    <span className="flex items-center gap-1 text-cyan-400 text-sm font-medium group-hover:gap-2 transition-all">
                      Chat <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : activeTab === 'iv' ? (
          /* IV Therapy Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIVs?.map((iv, i) => (
              <motion.div
                key={iv?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/iv-chat/${iv?.id}`)}
                className="glass rounded-2xl overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
              >
                <div className={`h-2 bg-gradient-to-r ${ivCategoryColors[iv?.category] || 'from-slate-500 to-slate-600'}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition">
                        {iv?.name}
                      </h3>
                      <p className="text-sm text-slate-400">{iv?.category}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                      {iv?.personaTrait}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                    {iv?.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> {iv?.infusionTime}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
                      Consult <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* IM Therapy Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIMs?.map((im, i) => (
              <motion.div
                key={im?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/im-chat/${im?.id}`)}
                className="glass rounded-2xl overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300"
              >
                <div className={`h-2 bg-gradient-to-r ${imCategoryColors[im?.category] || 'from-amber-500 to-orange-500'}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition">
                        {im?.name}
                      </h3>
                      <p className="text-sm text-slate-400">{im?.category}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300">
                      {im?.personaTrait}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-3 mb-4">
                    {im?.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Target className="w-3 h-3" /> {im?.frequency}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 text-sm font-medium group-hover:gap-2 transition-all">
                      Consult <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {!loading && activeTab === 'peptides' && filteredPeptides.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No peptides found matching your search.</p>
          </div>
        )}

        {!loading && activeTab === 'iv' && filteredIVs.length === 0 && (
          <div className="text-center py-20">
            <Syringe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No IV therapies found matching your search.</p>
          </div>
        )}

        {!loading && activeTab === 'im' && filteredIMs.length === 0 && (
          <div className="text-center py-20">
            <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No IM therapies found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}
