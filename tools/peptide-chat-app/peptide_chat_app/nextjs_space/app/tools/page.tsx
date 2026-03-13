'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Beaker, Calculator, Droplets, ArrowLeft, Search, AlertTriangle, Info, Syringe, Activity, Clock } from 'lucide-react';

// Reconstitution data for peptides
const reconstitutionData: Record<string, {
  solvent: 'BAC' | 'Acetic' | 'Sterile' | 'BAC/Acetic';
  reason: string;
  ratio: string;
  notes: string;
}> = {
  // Acetic Acid peptides (gelling/stability issues)
  'GHRP-2': { solvent: 'Acetic', reason: 'Prevents gelling, improves stability', ratio: '0.6% acetic acid water', notes: 'Can gel in BAC water. Use acetic acid for long-term storage.' },
  'GHRP-6': { solvent: 'Acetic', reason: 'Prevents aggregation', ratio: '0.6% acetic acid water', notes: 'Prone to aggregation in BAC. Acetic improves shelf life.' },
  'IGF-1 LR3': { solvent: 'Acetic', reason: 'Required for stability - will degrade rapidly in BAC', ratio: '0.6% acetic acid + BAC mix', notes: 'MUST use acetic acid. Very unstable peptide. Store frozen.' },
  'IGF-1 DES': { solvent: 'Acetic', reason: 'Required for stability', ratio: '0.6% acetic acid water', notes: 'Short half-life. Use acetic acid for reconstitution.' },
  'MGF (Mechano Growth Factor)': { solvent: 'Acetic', reason: 'Prevents degradation', ratio: '0.6% acetic acid water', notes: 'Unstable peptide. Acetic acid essential.' },
  'PEG-MGF': { solvent: 'Acetic', reason: 'Improves stability of PEGylated form', ratio: '0.6% acetic acid or BAC', notes: 'More stable than MGF but acetic still preferred.' },
  'Follistatin 344': { solvent: 'Acetic', reason: 'Protein stability', ratio: '0.6% acetic acid water', notes: 'Large protein - requires careful handling. Acetic improves storage.' },
  'ACE-031': { solvent: 'Acetic', reason: 'Protein stability at reconstitution', ratio: '0.6% acetic acid water', notes: 'Research compound. Acetic recommended.' },
  
  // BAC Water peptides (standard)
  'BPC-157': { solvent: 'BAC', reason: 'Very stable peptide', ratio: '1-2mL per 5mg vial', notes: 'Highly stable. BAC water is ideal. Can also use sterile water for single-use.' },
  'TB-500 (Thymosin Beta-4)': { solvent: 'BAC', reason: 'Good stability in BAC', ratio: '1-2mL per 5mg vial', notes: 'Stable peptide. BAC water recommended for multi-use.' },
  'BPC-157/TB-500 Blend': { solvent: 'BAC', reason: 'Both components stable in BAC', ratio: '1mL per 10mg blend', notes: 'Blend is stable. Standard BAC reconstitution.' },
  'GHK-Cu': { solvent: 'BAC', reason: 'Copper peptide - very stable', ratio: '2-3mL per 50mg vial', notes: 'Extremely stable. Can also use sterile saline for injections.' },
  'GLOW Blend (BPC-157/GHK-Cu/TB-500)': { solvent: 'BAC', reason: 'All components BAC-compatible', ratio: '3mL per 70mg vial', notes: 'Multi-peptide blend. BAC maintains stability.' },
  'LL-37': { solvent: 'BAC', reason: 'Stable antimicrobial peptide', ratio: '1mL per 5mg vial', notes: 'Can cause injection site reaction. BAC is standard.' },
  'Epithalon (Epitalon)': { solvent: 'BAC', reason: 'Small tetrapeptide - very stable', ratio: '1mL per 10mg vial', notes: 'Highly stable. BAC or sterile water both work well.' },
  'Tesamorelin': { solvent: 'BAC', reason: 'FDA-approved, standard reconstitution', ratio: '2mL per 5mg vial', notes: 'Follow manufacturer instructions. BAC is standard.' },
  'Ipamorelin': { solvent: 'BAC', reason: 'Highly stable pentapeptide', ratio: '1-2mL per 5mg vial', notes: 'Very stable. BAC water is ideal.' },
  'Sermorelin': { solvent: 'BAC', reason: 'Good stability profile', ratio: '2mL per 5mg vial', notes: 'Stable at proper storage. BAC recommended.' },
  'CJC-1295/Ipamorelin Blend': { solvent: 'BAC', reason: 'Both components stable', ratio: '2mL per blend vial', notes: 'Popular combination. BAC water standard.' },
  'Tesamorelin/Ipamorelin Blend': { solvent: 'BAC', reason: 'Both FDA-studied compounds', ratio: '2mL per blend', notes: 'Premium GH blend. BAC water.' },
  'HGH (Somatropin)': { solvent: 'BAC', reason: 'Standard pharmaceutical reconstitution', ratio: 'Per manufacturer - usually 1-2mL', notes: 'Pharmaceutical grade. Follow package insert. BAC or supplied diluent.' },
  'Semaglutide': { solvent: 'BAC', reason: 'Stable GLP-1 analog', ratio: '1-2mL per 5mg vial', notes: 'Very stable. BAC water. Can store 4-6 weeks refrigerated.' },
  'Tirzepatide': { solvent: 'BAC', reason: 'Dual GIP/GLP-1 - stable formulation', ratio: 'Per manufacturer', notes: 'Newer compound. BAC water standard.' },
  'Retatrutide': { solvent: 'BAC', reason: 'Triple agonist - stable', ratio: '1-2mL per vial', notes: 'Research compound. BAC water recommended.' },
  'MOTS-C': { solvent: 'BAC', reason: 'Mitochondrial peptide - stable', ratio: '1mL per 5mg vial', notes: 'Stable peptide. BAC or sterile water.' },
  'Thymosin Alpha-1': { solvent: 'BAC', reason: 'Immunomodulator - very stable', ratio: '1mL per 5mg vial', notes: 'Pharmaceutical grade available. Very stable.' },
  'KPV': { solvent: 'BAC', reason: 'Small tripeptide - highly stable', ratio: '1mL per 5mg vial', notes: 'Alpha-MSH fragment. Very stable.' },
  'ARA 290 10mg': { solvent: 'BAC', reason: 'EPO derivative - stable in BAC', ratio: '2mL per 10mg vial (5mg/mL)', notes: 'Neuroprotective/anti-inflammatory. 2-4mg SubQ daily for neuropathy protocols.' },
  'Semax': { solvent: 'BAC', reason: 'Stable nootropic peptide', ratio: '1mL per 5mg vial', notes: 'Often comes as nasal spray. For injection, use BAC.' },
  'Selank': { solvent: 'BAC', reason: 'Stable anxiolytic peptide', ratio: '1mL per 5mg vial', notes: 'Similar to Semax. BAC for injection form.' },
  'Pinealon': { solvent: 'BAC', reason: 'Khavinson bioregulator - stable', ratio: '1mL per vial', notes: 'Small tripeptide. Very stable.' },
  'P21': { solvent: 'BAC', reason: 'CNTF mimetic - stable', ratio: '1mL per vial', notes: 'Nootropic peptide. BAC water.' },
  'PE-22-28': { solvent: 'BAC', reason: 'Research nootropic - stable', ratio: '1mL per vial', notes: 'Similar to Semax. BAC recommended.' },
  'Humanin': { solvent: 'BAC', reason: 'Mitochondrial peptide', ratio: '1mL per vial', notes: 'Neuroprotective. BAC water standard.' },
  'DSIP (Delta Sleep)': { solvent: 'BAC', reason: 'Stable sleep peptide', ratio: '1mL per 5mg vial', notes: 'Stable at refrigerator temps. BAC water.' },
  'Cerebrolysin': { solvent: 'Sterile', reason: 'Pre-mixed pharmaceutical', ratio: 'N/A - Pre-mixed', notes: 'Comes as ready-to-use solution (215.2mg/mL). Do NOT reconstitute. IM or IV only.' },
  'Klotho': { solvent: 'BAC', reason: 'Research peptide', ratio: '1-2mL per vial', notes: 'Emerging peptide. Follow supplier guidelines. Gentle reconstitution recommended.' },
  'PT-141 (Bremelanotide)': { solvent: 'BAC', reason: 'FDA-approved - standard protocol', ratio: '1-2mL per 10mg vial', notes: 'Stable peptide. BAC water.' },
  'Melanotan II': { solvent: 'BAC', reason: 'Stable tanning peptide', ratio: '1-2mL per 10mg vial', notes: 'Very stable. Can last 4-6 weeks refrigerated.' },
  'Kisspeptin': { solvent: 'BAC', reason: 'GnRH regulator - stable', ratio: '1mL per vial', notes: 'Research peptide. BAC water.' },
  'Oxytocin': { solvent: 'Sterile', reason: 'Hormone - sensitive to preservatives', ratio: '1mL sterile water', notes: 'Use sterile water for nasal. BAC okay for SubQ.' },
  'NAD+': { solvent: 'Sterile', reason: 'Not a peptide - coenzyme', ratio: '2-5mL per 500mg vial', notes: 'Use sterile saline for IV. Sterile water for SubQ. No BAC for IV.' },
  'SS-31 (Elamipretide)': { solvent: 'BAC', reason: 'Mitochondrial peptide - stable', ratio: '1mL per vial', notes: 'Research compound. BAC water.' },
  'FOXO4-DRI': { solvent: 'BAC', reason: 'Senolytic peptide - stable', ratio: '1mL per vial', notes: 'Expensive compound. Handle carefully. BAC water.' },
  'PNC-27': { solvent: 'BAC', reason: 'Research peptide', ratio: '1mL per vial', notes: 'Oncology research. BAC water standard.' },
  'Pancragen': { solvent: 'BAC', reason: 'Khavinson bioregulator - stable', ratio: '1mL per 10mg vial', notes: 'Pancreatic support. IM or SubQ.' },
  'HEP-1': { solvent: 'BAC', reason: 'Hepatoprotective peptide', ratio: '1mL per vial', notes: 'Research compound. BAC water.' },
  'Follistatin': { solvent: 'Acetic', reason: 'Protein stability', ratio: '0.6% acetic acid', notes: 'Large protein. Requires acetic acid.' },
  'AICAR': { solvent: 'BAC', reason: 'AMPK activator - stable', ratio: '2mL per 50mg vial', notes: 'Not a peptide but often grouped. BAC water.' },
  // Bioregulators
  'Ovagen': { solvent: 'BAC', reason: 'Khavinson bioregulator - stable tripeptide', ratio: '1mL per 10mg vial', notes: 'Liver support peptide. Very stable. IM or SubQ.' },
  'Livagen': { solvent: 'BAC', reason: 'Khavinson bioregulator - stable tetrapeptide', ratio: '1mL per 10mg vial', notes: 'Chromatin regulation peptide. Very stable.' },
  'Testagen': { solvent: 'BAC', reason: 'Khavinson bioregulator - stable', ratio: '1mL per 10mg vial', notes: 'Testicular support peptide. IM preferred.' },
  'Cardiogen': { solvent: 'BAC', reason: 'Khavinson bioregulator - stable', ratio: '1mL per 10mg vial', notes: 'Cardiac support peptide. IM or SubQ.' },
  'Thymogen': { solvent: 'BAC', reason: 'Khavinson bioregulator dipeptide', ratio: '1mL per 10mg vial', notes: 'Immune support. Also available as nasal spray.' },
  'Cartalax': { solvent: 'BAC', reason: 'Khavinson bioregulator - stable', ratio: '1mL per 10mg vial', notes: 'Cartilage/joint support. IM preferred.' },
  'Pineal/Epitalon Blend': { solvent: 'BAC', reason: 'Both components stable', ratio: '1mL per blend vial', notes: 'Anti-aging blend. SubQ at bedtime.' },
  'KGLOW Blend (KPV/BPC/GHK-Cu/TB4)': { solvent: 'BAC', reason: 'All components BAC-compatible', ratio: '2mL per blend vial', notes: 'Premium healing/beauty blend. SubQ daily or EOD.' },
};

const peptideVialSizes: Record<string, number[]> = {
  'BPC-157': [5, 10],
  'TB-500 (Thymosin Beta-4)': [5, 10],
  'Ipamorelin': [5, 10],
  'Semaglutide': [3, 5, 10],
  'Tirzepatide': [5, 10, 15],
  'Melanotan II': [10],
  'PT-141 (Bremelanotide)': [10],
  'GHK-Cu': [50, 100],
  'Epithalon (Epitalon)': [10, 50],
  'Tesamorelin': [2, 5],
  'Sermorelin': [5, 15],
  'MOTS-C': [5, 10],
  'Thymosin Alpha-1': [5, 10],
  'NAD+': [100, 500, 1000],
  'LL-37': [5],
  'Semax': [5, 10],
  'Selank': [5, 10],
  'DSIP (Delta Sleep)': [5],
  'HGH (Somatropin)': [10, 36],
  'Retatrutide': [5, 10],
};

export default function ToolsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  
  const [activeTab, setActiveTab] = useState<'calculator' | 'reconstitution' | 'iv-calculator' | 'iv-dilution'>(
    (tabParam as any) || 'calculator'
  );
  const [search, setSearch] = useState('');
  
  // Peptide Calculator state
  const [vialSizeInput, setVialSizeInput] = useState('5');
  const [bacVolumeInput, setBacVolumeInput] = useState('1');
  const [desiredDoseInput, setDesiredDoseInput] = useState('250');
  const [selectedPeptide, setSelectedPeptide] = useState('');

  // IV Calculator state
  const [ivVolumeInput, setIvVolumeInput] = useState('500');
  const [ivTimeHoursInput, setIvTimeHoursInput] = useState('2');
  const [ivTimeMinutesInput, setIvTimeMinutesInput] = useState('0');
  const [ivDropFactorInput, setIvDropFactorInput] = useState('15');

  // IV Dilution Calculator state
  const [drugAmountInput, setDrugAmountInput] = useState('1000');
  const [diluentVolumeInput, setDiluentVolumeInput] = useState('250');
  const [desiredConcentrationInput, setDesiredConcentrationInput] = useState('');
  
  // Parsed numeric values for peptide calculations
  const vialSize = parseFloat(vialSizeInput) || 0;
  const bacVolume = parseFloat(bacVolumeInput) || 0;
  const desiredDose = parseFloat(desiredDoseInput) || 0;

  // Parsed numeric values for IV calculations
  const ivVolume = parseFloat(ivVolumeInput) || 0;
  const ivTimeHours = parseFloat(ivTimeHoursInput) || 0;
  const ivTimeMinutes = parseFloat(ivTimeMinutesInput) || 0;
  const ivDropFactor = parseFloat(ivDropFactorInput) || 15;
  const drugAmount = parseFloat(drugAmountInput) || 0;
  const diluentVolume = parseFloat(diluentVolumeInput) || 0;
  
  // IV Drip Rate calculations
  const totalMinutes = (ivTimeHours * 60) + ivTimeMinutes;
  const mlPerHour = totalMinutes > 0 ? (ivVolume / totalMinutes) * 60 : 0;
  const mlPerMinute = totalMinutes > 0 ? ivVolume / totalMinutes : 0;
  const dropsPerMinute = totalMinutes > 0 ? (ivVolume * ivDropFactor) / totalMinutes : 0;

  // IV Dilution calculations
  const finalConcentration = diluentVolume > 0 ? drugAmount / diluentVolume : 0; // mg/mL

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (tabParam && ['calculator', 'reconstitution', 'iv-calculator', 'iv-dilution'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);
  
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" /></div>;
  }
  
  const concentration = vialSize / bacVolume; // mg/mL
  const volumeNeeded = desiredDose / (concentration * 1000); // mL
  const unitsNeeded = volumeNeeded * 100; // units (100 units = 1mL)
  const dosesPerVial = (vialSize * 1000) / desiredDose;
  
  const filteredPeptides = Object.entries(reconstitutionData).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );
  
  const aceticPeptides = Object.entries(reconstitutionData).filter(([, data]) => 
    data.solvent === 'Acetic' || data.solvent === 'BAC/Acetic'
  );
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Beaker className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Clinical Tools
            </span>
          </div>
          <div className="w-20" />
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab Groups */}
        <div className="space-y-4 mb-8">
          {/* Peptide Tools */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide mr-2 self-center">Peptides:</span>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition text-sm ${
                activeTab === 'calculator' ? 'bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Dosing Calculator
            </button>
            <button
              onClick={() => setActiveTab('reconstitution')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition text-sm ${
                activeTab === 'reconstitution' ? 'bg-cyan-500 text-white' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <Droplets className="w-4 h-4" />
              Reconstitution Guide
            </button>
          </div>
          
          {/* IV Tools */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide mr-2 self-center">IV Therapy:</span>
            <button
              onClick={() => setActiveTab('iv-calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition text-sm ${
                activeTab === 'iv-calculator' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              Drip Rate Calculator
            </button>
            <button
              onClick={() => setActiveTab('iv-dilution')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition text-sm ${
                activeTab === 'iv-dilution' ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <Syringe className="w-4 h-4" />
              Dilution Calculator
            </button>
          </div>
        </div>
        
        {activeTab === 'calculator' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-cyan-400" />
                Peptide Dosing Calculator
              </h2>
              
              {/* Peptide Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Select Peptide (Optional)</label>
                <select
                  value={selectedPeptide}
                  onChange={(e) => {
                    setSelectedPeptide(e.target.value);
                    const sizes = peptideVialSizes[e.target.value];
                    if (sizes) setVialSizeInput(sizes[0].toString());
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- Select or enter custom values --</option>
                  {Object.keys(peptideVialSizes).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              
              {/* Vial Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Vial Size (mg)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {(selectedPeptide && peptideVialSizes[selectedPeptide] ? peptideVialSizes[selectedPeptide] : [2, 5, 10, 15]).map(size => (
                    <button
                      key={size}
                      onClick={() => setVialSizeInput(size.toString())}
                      className={`px-4 py-2 rounded-lg transition ${vialSize === size ? 'bg-cyan-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                      {size}mg
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vialSizeInput}
                  onChange={(e) => setVialSizeInput(e.target.value)}
                  placeholder="Enter vial size in mg"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              
              {/* BAC Water Volume */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Reconstitution Volume (mL BAC Water)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[0.5, 1, 1.5, 2, 2.5, 3].map(vol => (
                    <button
                      key={vol}
                      onClick={() => setBacVolumeInput(vol.toString())}
                      className={`px-4 py-2 rounded-lg transition ${bacVolume === vol ? 'bg-cyan-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                      {vol}mL
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={bacVolumeInput}
                  onChange={(e) => setBacVolumeInput(e.target.value)}
                  placeholder="Enter volume in mL"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              
              {/* Desired Dose */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Desired Dose (mcg)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[100, 200, 250, 300, 500, 1000, 2000].map(dose => (
                    <button
                      key={dose}
                      onClick={() => setDesiredDoseInput(dose.toString())}
                      className={`px-4 py-2 rounded-lg transition ${desiredDose === dose ? 'bg-cyan-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                      {dose >= 1000 ? `${dose/1000}mg` : `${dose}mcg`}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={desiredDoseInput}
                  onChange={(e) => setDesiredDoseInput(e.target.value)}
                  placeholder="Enter dose in mcg"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
            
            {/* Results Section */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6 border-2 border-cyan-500/30">
                <h3 className="text-xl font-bold mb-4 text-cyan-400">Calculation Results</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400">Concentration</span>
                    <span className="text-2xl font-bold text-white">{concentration.toFixed(2)} mg/mL</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400">Volume per Dose</span>
                    <span className="text-2xl font-bold text-cyan-400">{volumeNeeded.toFixed(3)} mL</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                    <span className="text-slate-300">Insulin Syringe Units</span>
                    <span className="text-3xl font-bold text-cyan-400">{unitsNeeded.toFixed(1)} units</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400">Doses per Vial</span>
                    <span className="text-2xl font-bold text-emerald-400">{dosesPerVial.toFixed(0)} doses</span>
                  </div>
                </div>
              </div>
              
              {/* Quick Reference */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  Quick Reference
                </h3>
                <div className="text-sm text-slate-400 space-y-2">
                  <p>• <strong>100 units</strong> = 1 mL on insulin syringe</p>
                  <p>• <strong>10 units</strong> = 0.1 mL</p>
                  <p>• <strong>1 unit</strong> = 0.01 mL = 10 microliters</p>
                  <p>• Standard insulin syringe: U-100 (100 units/mL)</p>
                  <p>• Always inject slowly SubQ at 45° angle</p>
                </div>
              </div>
              
              {selectedPeptide && reconstitutionData[selectedPeptide] && (
                <div className={`glass rounded-2xl p-6 border-2 ${reconstitutionData[selectedPeptide].solvent === 'Acetic' ? 'border-amber-500/50' : 'border-emerald-500/50'}`}>
                  <h3 className="text-lg font-bold mb-2">{selectedPeptide} Reconstitution</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${reconstitutionData[selectedPeptide].solvent === 'Acetic' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {reconstitutionData[selectedPeptide].solvent === 'Acetic' ? '⚠️ Acetic Acid Required' : '✓ BAC Water'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{reconstitutionData[selectedPeptide].notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'reconstitution' && (
          <div>
            {/* Warning Box for Acetic Acid */}
            <div className="glass rounded-2xl p-6 mb-8 border-2 border-amber-500/50 bg-amber-500/5">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
                Peptides Requiring Acetic Acid (Gelling Risk)
              </h3>
              <p className="text-slate-400 mb-4">
                These peptides can gel, aggregate, or degrade rapidly in bacteriostatic water. Use 0.6% acetic acid water for reconstitution:
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {aceticPeptides.map(([name, data]) => (
                  <div key={name} className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <p className="font-medium text-amber-300">{name}</p>
                    <p className="text-xs text-slate-400 mt-1">{data.reason}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search peptides..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            
            {/* Full Reference Table */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="text-left px-6 py-4 font-medium text-slate-300">Peptide</th>
                      <th className="text-left px-6 py-4 font-medium text-slate-300">Solvent</th>
                      <th className="text-left px-6 py-4 font-medium text-slate-300">Ratio</th>
                      <th className="text-left px-6 py-4 font-medium text-slate-300">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredPeptides.map(([name, data]) => (
                      <tr key={name} className="hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4 font-medium">{name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            data.solvent === 'Acetic' ? 'bg-amber-500/20 text-amber-400' :
                            data.solvent === 'Sterile' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {data.solvent === 'Acetic' ? 'Acetic Acid' : data.solvent === 'Sterile' ? 'Sterile Water' : 'BAC Water'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{data.ratio}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{data.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-6 glass rounded-xl p-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-slate-400">BAC Water - Bacteriostatic water (0.9% benzyl alcohol)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-slate-400">Acetic Acid - 0.6% acetic acid water (prevents gelling)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-slate-400">Sterile Water - Preservative-free (for IV or single-use)</span>
              </div>
            </div>
          </div>
        )}

        {/* IV Drip Rate Calculator */}
        {activeTab === 'iv-calculator' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-emerald-400" />
                IV Drip Rate Calculator
              </h2>

              {/* Total Volume */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Total Volume to Infuse (mL)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[100, 250, 500, 1000].map(vol => (
                    <button
                      key={vol}
                      onClick={() => setIvVolumeInput(vol.toString())}
                      className={`px-4 py-2 rounded-lg transition ${ivVolume === vol ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                      {vol} mL
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={ivVolumeInput}
                  onChange={(e) => setIvVolumeInput(e.target.value)}
                  placeholder="Enter volume in mL"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Infusion Time */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Infusion Time</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Hours</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={ivTimeHoursInput}
                      onChange={(e) => setIvTimeHoursInput(e.target.value)}
                      placeholder="Hours"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Minutes</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={ivTimeMinutesInput}
                      onChange={(e) => setIvTimeMinutesInput(e.target.value)}
                      placeholder="Minutes"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {[{h: 0, m: 30}, {h: 1, m: 0}, {h: 1, m: 30}, {h: 2, m: 0}, {h: 3, m: 0}, {h: 4, m: 0}].map(({h, m}) => (
                    <button
                      key={`${h}-${m}`}
                      onClick={() => { setIvTimeHoursInput(h.toString()); setIvTimeMinutesInput(m.toString()); }}
                      className={`px-3 py-1.5 rounded-lg transition text-sm ${
                        ivTimeHours === h && ivTimeMinutes === m ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {h > 0 ? `${h}h` : ''}{m > 0 ? ` ${m}m` : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop Factor */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">IV Tubing Drop Factor (gtt/mL)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[10, 15, 20, 60].map(factor => (
                    <button
                      key={factor}
                      onClick={() => setIvDropFactorInput(factor.toString())}
                      className={`px-4 py-2 rounded-lg transition ${ivDropFactor === factor ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                      {factor} gtt/mL
                      <span className="text-xs ml-1 opacity-70">
                        {factor === 10 ? '(macro)' : factor === 15 ? '(macro)' : factor === 20 ? '(macro)' : '(micro)'}
                      </span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={ivDropFactorInput}
                  onChange={(e) => setIvDropFactorInput(e.target.value)}
                  placeholder="Enter drop factor"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6 border-2 border-emerald-500/30">
                <h3 className="text-xl font-bold mb-4 text-emerald-400">Drip Rate Results</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                    <span className="text-slate-300">Drops per Minute</span>
                    <span className="text-3xl font-bold text-emerald-400">{dropsPerMinute.toFixed(1)} gtt/min</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400">mL per Hour</span>
                    <span className="text-2xl font-bold text-white">{mlPerHour.toFixed(1)} mL/hr</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400">mL per Minute</span>
                    <span className="text-2xl font-bold text-white">{mlPerMinute.toFixed(2)} mL/min</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400">Total Time</span>
                    <span className="text-xl font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-400" />
                      {ivTimeHours > 0 ? `${ivTimeHours}h ` : ''}{ivTimeMinutes > 0 ? `${ivTimeMinutes}m` : ivTimeHours > 0 ? '' : '0m'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  IV Drip Quick Reference
                </h3>
                <div className="text-sm text-slate-400 space-y-2">
                  <p>• <strong>Macrodrip (10-20 gtt/mL):</strong> Used for rapid fluid replacement</p>
                  <p>• <strong>Microdrip (60 gtt/mL):</strong> Used for precise medication delivery</p>
                  <p>• <strong>Formula:</strong> Drops/min = (Volume × Drop Factor) / Time in minutes</p>
                  <p>• Always verify drip rate with pump settings when available</p>
                  <p>• Monitor patient response and adjust as needed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* IV Dilution Calculator */}
        {activeTab === 'iv-dilution' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Syringe className="w-6 h-6 text-emerald-400" />
                IV Dilution Calculator
              </h2>

              {/* Drug Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Drug Amount (mg)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[500, 1000, 1500, 2000, 3000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setDrugAmountInput(amt.toString())}
                      className={`px-4 py-2 rounded-lg transition ${drugAmount === amt ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                      {amt >= 1000 ? `${amt/1000}g` : `${amt}mg`}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={drugAmountInput}
                  onChange={(e) => setDrugAmountInput(e.target.value)}
                  placeholder="Enter drug amount in mg"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Diluent Volume */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Diluent Volume (mL)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[100, 250, 500, 1000].map(vol => (
                    <button
                      key={vol}
                      onClick={() => setDiluentVolumeInput(vol.toString())}
                      className={`px-4 py-2 rounded-lg transition ${diluentVolume === vol ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                      {vol} mL
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={diluentVolumeInput}
                  onChange={(e) => setDiluentVolumeInput(e.target.value)}
                  placeholder="Enter diluent volume in mL"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Common IV Dilutions Reference */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <h4 className="font-medium text-white mb-3">Common FF Protocol Dilutions</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>EDTA 3g</span>
                    <span className="text-emerald-400">500 mL NS → 6 mg/mL</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Vitamin C 25g</span>
                    <span className="text-emerald-400">500 mL NS → 50 mg/mL</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>NAD+ 500mg</span>
                    <span className="text-emerald-400">250 mL NS → 2 mg/mL</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ALA 600mg</span>
                    <span className="text-emerald-400">250 mL NS → 2.4 mg/mL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6 border-2 border-emerald-500/30">
                <h3 className="text-xl font-bold mb-4 text-emerald-400">Dilution Results</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                    <span className="text-slate-300">Final Concentration</span>
                    <span className="text-3xl font-bold text-emerald-400">{finalConcentration.toFixed(2)} mg/mL</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400">Drug Amount</span>
                    <span className="text-xl font-bold text-white">
                      {drugAmount >= 1000 ? `${(drugAmount/1000).toFixed(1)}g` : `${drugAmount}mg`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400">Total Volume</span>
                    <span className="text-xl font-bold text-white">{diluentVolume} mL</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl">
                    <span className="text-slate-400">mcg per mL</span>
                    <span className="text-xl font-bold text-white">{(finalConcentration * 1000).toFixed(0)} mcg/mL</span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Important Reminders
                </h3>
                <div className="text-sm text-slate-400 space-y-2">
                  <p>• <strong>Always verify compatibility</strong> of drug with diluent (NS vs D5W)</p>
                  <p>• <strong>Check osmolarity</strong> for high concentration solutions</p>
                  <p>• <strong>Use light-protected tubing</strong> for photosensitive drugs (ALA, NAD+)</p>
                  <p>• <strong>Label all preparations</strong> with drug, concentration, date, and initials</p>
                  <p>• <strong>Follow FF PMA protocols</strong> for specific dilution requirements</p>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  Dilution Formula
                </h3>
                <div className="bg-slate-800/70 rounded-lg p-4 font-mono text-center">
                  <p className="text-emerald-400 text-lg">Concentration = Drug Amount ÷ Total Volume</p>
                  <p className="text-slate-500 text-sm mt-2">mg/mL = mg ÷ mL</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
