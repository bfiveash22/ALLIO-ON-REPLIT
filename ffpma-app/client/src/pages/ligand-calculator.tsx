
import { 
  healthConditions, 
  cannabinoids as rawCannabinoids, 
  proteinTargets as rawProteins, 
  productMappings, 
  calculateLigandScore, 
  getConditionsByCategory 
} from "@shared/ecs-data";

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Check, ChevronRight, Beaker, Target, Package, Brain, Heart, Shield, Sparkles, Info, X, Dna, Activity } from 'lucide-react';

interface Cannabinoid {
  id: string;
  name: string;
  fullName: string;
  type: string;
  psychoactive: boolean;
  description: string;
  proteinTargets: string[];
  bindingAffinities: Record<string, number>;
}

interface ProteinTarget {
  id: string;
  symbol: string;
  name: string;
  module: number;
  icValue: number;
  functions: string[];
  relatedConditions: string[];
}

interface HealthCondition {
  id: string;
  name: string;
  category: string;
  keggPathways: string[];
  proteinTargets: string[];
  effectType: string;
  description: string;
}

interface ProductMapping {
  productName: string;
  productType: string;
  cannabinoids: string[];
  primaryIndications: string[];
  ligandScore: number;
  aggregatedScore?: number;
}

interface Module {
  module: number;
  name: string;
  targets: string[];
  score: number;
}

const categoryIcons: Record<string, any> = {
  'Neurodegenerative': Brain,
  'Mental Health': Heart,
  'Pain & Inflammation': Activity,
  'Neurological': Brain,
  'Cancer Support': Shield,
  'Metabolic': Activity,
  'Cardiovascular': Heart,
  'Immune': Shield,
  'Sleep & Recovery': Sparkles,
  'Dermatological': Sparkles,
  'GI & Digestive': Activity
};

const categoryColors: Record<string, string> = {
  'Neurodegenerative': 'from-purple-500 to-violet-500',
  'Mental Health': 'from-pink-500 to-rose-500',
  'Pain & Inflammation': 'from-orange-500 to-amber-500',
  'Neurological': 'from-indigo-500 to-purple-500',
  'Cancer Support': 'from-red-500 to-rose-500',
  'Metabolic': 'from-emerald-500 to-green-500',
  'Cardiovascular': 'from-red-500 to-pink-500',
  'Immune': 'from-blue-500 to-cyan-500',
  'Sleep & Recovery': 'from-violet-500 to-purple-500',
  'Dermatological': 'from-amber-500 to-yellow-500',
  'GI & Digestive': 'from-lime-500 to-green-500'
};

const moduleColors: Record<number, string> = {
  1: 'from-green-500 to-emerald-500',
  2: 'from-blue-500 to-cyan-500',
  3: 'from-orange-500 to-amber-500',
  4: 'from-purple-500 to-violet-500'
};

export default function ECSCalculatorClient() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'select' | 'results'>('select');
  const [loading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  
  // Data states
  const [categories, setCategories] = useState<Record<string, HealthCondition[]>>({});
  const [cannabinoids] = useState(rawCannabinoids);
  const [proteins] = useState(rawProteins);
  const [products] = useState(productMappings);
  
  // Results states
  const [results, setResults] = useState<{
    selectedConditions: HealthCondition[];
    matchingCannabinoids: Cannabinoid[];
    targetProteins: ProteinTarget[];
    recommendedProducts: ProductMapping[];
    pathwayAnalysis: {
      modules: Module[];
      totalScore: number;
      conditionCount: number;
    };
  } | null>(null);
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showCannabinoidDetail, setShowCannabinoidDetail] = useState<Cannabinoid | null>(null);
  const [showProteinDetail, setShowProteinDetail] = useState<ProteinTarget | null>(null);

  

  
  const toggleCondition = (conditionId: string) => {
    setSelectedConditions(prev =>
      prev.includes(conditionId)
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  
  const analyzeConditions = async () => {
    if (selectedConditions.length === 0) return;
    setAnalyzing(true);
    
    // Simulate slight delay for UX
    await new Promise(r => setTimeout(r, 500));
    
    const analyses = selectedConditions.map(id => calculateLigandScore(id));
    
    const allCannabinoids = new Set<string>();
    const allProteins = new Set<string>();
    const allProducts = new Map<string, { product: any; score: number }>();
    const allModules = new Map<number, { module: number; name: string; targets: Set<string>; score: number }>();

    analyses.forEach(analysis => {
      analysis.matchingCannabinoids.forEach(c => allCannabinoids.add(c.id));
      analysis.targetProteins.forEach(p => allProteins.add(p.symbol));
      
      analysis.recommendedProducts.forEach(p => {
        const existing = allProducts.get(p.productName);
        const matchScore = (p as any).matchScore || 0;
        if (existing) {
          existing.score = Math.max(existing.score, matchScore);
        } else {
          allProducts.set(p.productName, { product: p, score: matchScore });
        }
      });

      analysis.pathwayAnalysis.modules.forEach(m => {
        const existing = allModules.get(m.module);
        if (existing) {
          m.targets.forEach(t => existing.targets.add(t));
          existing.score = Math.max(existing.score, m.score);
        } else {
          allModules.set(m.module, { ...m, targets: new Set(m.targets) });
        }
      });
    });

    const aggregatedModules = Array.from(allModules.values()).map(m => ({
      ...m,
      targets: Array.from(m.targets)
    }));

    const totalScore = aggregatedModules.reduce((sum, m) => sum + m.score, 0);

    setResults({
      selectedConditions: analyses.map(a => a.condition).filter(Boolean) as HealthCondition[],
      matchingCannabinoids: cannabinoids.filter(c => allCannabinoids.has(c.id)),
      targetProteins: proteins.filter(p => allProteins.has(p.symbol)),
      recommendedProducts: Array.from(allProducts.values())
        .sort((a, b) => b.score - a.score)
        .map(({ product, score }) => ({ ...product, aggregatedScore: score })) as any[],
      pathwayAnalysis: {
        modules: aggregatedModules as any[],
        totalScore,
        conditionCount: selectedConditions.length
      }
    });
    setStep('results');
    setAnalyzing(false);
  };


  const resetCalculator = () => {
    setSelectedConditions([]);
    setResults(null);
    setStep('select');
  };

  const filteredCategories = Object.entries(categories).reduce((acc, [cat, conditions]) => {
    const filtered = conditions.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) acc[cat] = filtered;
    return acc;
  }, {} as Record<string, HealthCondition[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Dna className="w-16 h-16 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-300">Loading ECS Pathway Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => step === 'results' ? resetCalculator() : setLocation('/dashboard')}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{step === 'results' ? 'Start Over' : 'Dashboard'}</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                <Dna className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">ECS Ligand Calculator</h1>
                <p className="text-xs text-gray-400">Endocannabinoid System Pathway Analysis</p>
              </div>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'select' ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Introduction */}
              <div className="glass rounded-2xl p-6 border border-purple-500/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                    <Beaker className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Select Your Health Conditions</h2>
                    <p className="text-gray-400 text-sm">
                      This calculator uses network-based pharmacology research to analyze cannabinoid-protein interactions 
                      across 18 essential targets and 4 functional modules. Select one or more conditions to discover 
                      which cannabinoids and FF products target the relevant ligand pathways.
                    </p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conditions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Selected Conditions Summary */}
              {selectedConditions.length > 0 && (
                <div className="glass rounded-xl p-4 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">{selectedConditions.length} condition(s) selected</span>
                    <button
                      onClick={analyzeConditions}
                      disabled={analyzing}
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                    >
                      {analyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4" />
                          Analyze Pathways
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedConditions.map(id => {
                      const condition = Object.values(categories).flat().find(c => c.id === id);
                      return condition ? (
                        <span
                          key={id}
                          className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-300 flex items-center gap-2"
                        >
                          {condition.name}
                          <button onClick={() => toggleCondition(id)} className="hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Condition Categories */}
              <div className="space-y-4">
                {Object.entries(filteredCategories).map(([category, conditions]) => {
                  const IconComponent = categoryIcons[category] || Activity;
                  const isExpanded = expandedCategory === category;
                  const colorClass = categoryColors[category] || 'from-gray-500 to-gray-600';
                  
                  return (
                    <div key={category} className="glass rounded-xl overflow-hidden border border-white/10">
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : category)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-white">{category}</h3>
                            <p className="text-sm text-gray-400">{conditions.length} conditions</p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/10"
                          >
                            <div className="p-4 grid gap-2">
                              {conditions.map(condition => {
                                const isSelected = selectedConditions.includes(condition.id);
                                return (
                                  <button
                                    key={condition.id}
                                    onClick={() => toggleCondition(condition.id)}
                                    className={`p-3 rounded-lg text-left transition-all flex items-start gap-3 ${
                                      isSelected
                                        ? 'bg-purple-500/20 border border-purple-500/50'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 ${
                                      isSelected ? 'bg-purple-500' : 'bg-white/10'
                                    }`}>
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">{condition.name}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                          condition.effectType === 'beneficial' ? 'bg-green-500/20 text-green-400' :
                                          condition.effectType === 'research' ? 'bg-yellow-500/20 text-yellow-400' :
                                          'bg-red-500/20 text-red-400'
                                        }`}>
                                          {condition.effectType}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{condition.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {condition.proteinTargets.slice(0, 4).map(target => (
                                          <span key={target} className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-500">
                                            {target}
                                          </span>
                                        ))}
                                        {condition.proteinTargets.length > 4 && (
                                          <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-500">
                                            +{condition.proteinTargets.length - 4} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {results && (
                <>
                  {/* Results Summary */}
                  <div className="glass rounded-2xl p-6 border border-purple-500/20">
                    <h2 className="text-xl font-bold text-white mb-4">Pathway Analysis Results</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-purple-400">{results.selectedConditions.length}</div>
                        <div className="text-sm text-gray-400">Conditions</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-cyan-400">{results.matchingCannabinoids.length}</div>
                        <div className="text-sm text-gray-400">Cannabinoids</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-amber-400">{results.targetProteins.length}</div>
                        <div className="text-sm text-gray-400">Protein Targets</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-emerald-400">{results.pathwayAnalysis.totalScore.toFixed(2)}</div>
                        <div className="text-sm text-gray-400">IC Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Functional Modules */}
                  <div className="glass rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-400" />
                      Functional Modules Targeted
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {results.pathwayAnalysis.modules.map(module => (
                        <div
                          key={module.module}
                          className={`rounded-xl p-4 bg-gradient-to-br ${moduleColors[module.module]} bg-opacity-10 border border-white/10`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white">Module {module.module}</span>
                            <span className="text-sm text-white/70">IC: {module.score.toFixed(2)}</span>
                          </div>
                          <p className="text-sm text-white/80 mb-3">{module.name}</p>
                          <div className="flex flex-wrap gap-1">
                            {module.targets.map(target => (
                              <button
                                key={target}
                                onClick={() => setShowProteinDetail(proteins.find(p => p.symbol === target) || null)}
                                className="px-2 py-1 bg-white/10 rounded text-xs text-white hover:bg-white/20 transition-colors"
                              >
                                {target}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Matching Cannabinoids */}
                  <div className="glass rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Beaker className="w-5 h-5 text-cyan-400" />
                      Recommended Cannabinoids
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.matchingCannabinoids.map(cannabinoid => (
                        <button
                          key={cannabinoid.id}
                          onClick={() => setShowCannabinoidDetail(cannabinoid)}
                          className="glass rounded-xl p-4 text-left hover:bg-white/5 transition-colors border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-white text-lg">{cannabinoid.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              cannabinoid.psychoactive ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {cannabinoid.psychoactive ? 'Psychoactive' : 'Non-Psychoactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{cannabinoid.fullName}</p>
                          <div className="flex flex-wrap gap-1">
                            {cannabinoid.proteinTargets.filter(t => 
                              results.targetProteins.some(p => p.symbol === t)
                            ).slice(0, 4).map(target => (
                              <span key={target} className="px-2 py-0.5 bg-cyan-500/20 rounded text-xs text-cyan-400">
                                {target}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Products */}
                  <div className="glass rounded-2xl p-6 border border-purple-500/20">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-emerald-400" />
                      FF Product Recommendations
                    </h3>
                    <div className="space-y-4">
                      {results.recommendedProducts.filter(p => p.ligandScore > 0).map((product, index) => (
                        <div
                          key={product.productName}
                          className={`rounded-xl p-4 border ${
                            index === 0 ? 'bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-500/30' : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {index === 0 && (
                                  <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-violet-500 rounded text-xs text-white font-medium">
                                    Best Match
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  product.productType === 'supplement' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                                }`}>
                                  {product.productType}
                                </span>
                              </div>
                              <h4 className="font-semibold text-white text-lg">{product.productName}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {product.cannabinoids.map(c => (
                                  <span key={c} className="px-2 py-1 bg-purple-500/20 rounded text-sm text-purple-300">
                                    {c}
                                  </span>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {product.primaryIndications.map(ind => (
                                  <span key={ind} className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400">
                                    {ind}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-white">{product.ligandScore}/10</div>
                              <div className="text-xs text-gray-400">Ligand Score</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Conditions Detail */}
                  <div className="glass rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Selected Conditions</h3>
                    <div className="space-y-3">
                      {results.selectedConditions.map(condition => (
                        <div key={condition.id} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">{condition.name}</span>
                            <span className="px-2 py-0.5 bg-purple-500/20 rounded text-xs text-purple-400">
                              {condition.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{condition.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cannabinoid Detail Modal */}
      <AnimatePresence>
        {showCannabinoidDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCannabinoidDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{showCannabinoidDetail.name}</h3>
                  <p className="text-sm text-gray-400">{showCannabinoidDetail.fullName}</p>
                </div>
                <button
                  onClick={() => setShowCannabinoidDetail(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <p className="text-gray-300 mb-4">{showCannabinoidDetail.description}</p>
              
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  showCannabinoidDetail.type === 'acidic' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {showCannabinoidDetail.type}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  showCannabinoidDetail.psychoactive ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {showCannabinoidDetail.psychoactive ? 'Psychoactive' : 'Non-Psychoactive'}
                </span>
              </div>

              <h4 className="font-semibold text-white mb-2">Protein Targets & Binding Affinities</h4>
              <div className="space-y-2">
                {showCannabinoidDetail.proteinTargets.map(target => {
                  const affinity = showCannabinoidDetail.bindingAffinities[target];
                  return (
                    <div key={target} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                      <span className="text-white">{target}</span>
                      {affinity && (
                        <span className="text-sm text-gray-400">{affinity} kcal/mol</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Protein Detail Modal */}
      <AnimatePresence>
        {showProteinDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProteinDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{showProteinDetail.symbol}</h3>
                  <p className="text-sm text-gray-400">{showProteinDetail.name}</p>
                </div>
                <button
                  onClick={() => setShowProteinDetail(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm bg-gradient-to-r ${moduleColors[showProteinDetail.module]} text-white`}>
                  Module {showProteinDetail.module}
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400">
                  IC: {showProteinDetail.icValue.toFixed(2)}
                </span>
              </div>

              <h4 className="font-semibold text-white mb-2">Functions</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {showProteinDetail.functions.map(fn => (
                  <span key={fn} className="px-2 py-1 bg-white/10 rounded text-sm text-gray-300">
                    {fn}
                  </span>
                ))}
              </div>

              <h4 className="font-semibold text-white mb-2">Related Conditions</h4>
              <div className="flex flex-wrap gap-2">
                {showProteinDetail.relatedConditions.map(cond => (
                  <span key={cond} className="px-2 py-1 bg-cyan-500/20 rounded text-sm text-cyan-400">
                    {cond}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
