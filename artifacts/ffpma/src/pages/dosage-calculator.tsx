import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Syringe, Beaker, Info, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CalculationResult {
  volumeToInject: number;
  concentration: number;
  mcgPerUnit: number;
}

export default function DosageCalculatorPage() {
  const [peptideAmount, setPeptideAmount] = useState<string>("5");
  const [peptideUnit, setPeptideUnit] = useState<string>("mg");
  const [bwWater, setBwWater] = useState<string>("2");
  const [desiredDose, setDesiredDose] = useState<string>("250");
  const [doseUnit, setDoseUnit] = useState<string>("mcg");
  const [result, setResult] = useState<CalculationResult | null>(null);

  const [ivWeight, setIvWeight] = useState<string>("70");
  const [ivWeightUnit, setIvWeightUnit] = useState<string>("kg");
  const [ivDosePerKg, setIvDosePerKg] = useState<string>("10");
  const [ivConcentration, setIvConcentration] = useState<string>("100");
  const [ivResult, setIvResult] = useState<{ totalDose: number; volumeNeeded: number } | null>(null);

  const calculatePeptideDose = () => {
    const peptideMg = peptideUnit === "mg" ? parseFloat(peptideAmount) : parseFloat(peptideAmount) / 1000;
    const waterMl = parseFloat(bwWater);
    const doseMcg = doseUnit === "mcg" ? parseFloat(desiredDose) : parseFloat(desiredDose) * 1000;

    if (isNaN(peptideMg) || isNaN(waterMl) || isNaN(doseMcg) || waterMl === 0) {
      return;
    }

    const concentrationMcgPerMl = (peptideMg * 1000) / waterMl;
    const volumeToInject = doseMcg / concentrationMcgPerMl;

    setResult({
      volumeToInject: Math.round(volumeToInject * 1000) / 1000,
      concentration: Math.round(concentrationMcgPerMl * 100) / 100,
      mcgPerUnit: Math.round((concentrationMcgPerMl / 100) * 100) / 100,
    });
  };

  const calculateIvDose = () => {
    const weightKg = ivWeightUnit === "kg" ? parseFloat(ivWeight) : parseFloat(ivWeight) * 0.453592;
    const dosePerKg = parseFloat(ivDosePerKg);
    const concentration = parseFloat(ivConcentration);

    if (isNaN(weightKg) || isNaN(dosePerKg) || isNaN(concentration) || concentration === 0) {
      return;
    }

    const totalDose = weightKg * dosePerKg;
    const volumeNeeded = totalDose / concentration;

    setIvResult({
      totalDose: Math.round(totalDose * 100) / 100,
      volumeNeeded: Math.round(volumeNeeded * 100) / 100,
    });
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary/10">
              <Calculator className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                Dosage Calculator
              </h1>
              <p className="text-muted-foreground">
                Calculate peptide reconstitution and IV dosages
              </p>
            </div>
          </div>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Educational Use Only</AlertTitle>
          <AlertDescription>
            These calculators are provided for educational purposes. Always verify calculations with a qualified healthcare provider before administration.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="peptide" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="peptide" className="flex items-center gap-2" data-testid="tab-peptide">
              <Syringe className="h-4 w-4" />
              Peptide Calculator
            </TabsTrigger>
            <TabsTrigger value="iv" className="flex items-center gap-2" data-testid="tab-iv">
              <Beaker className="h-4 w-4" />
              IV Calculator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="peptide">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Syringe className="h-5 w-5 text-primary" />
                    Peptide Reconstitution Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate the volume to inject based on your peptide vial and desired dose
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="peptide-amount">Peptide Amount in Vial</Label>
                      <div className="flex gap-2">
                        <Input
                          id="peptide-amount"
                          type="number"
                          value={peptideAmount}
                          onChange={(e) => setPeptideAmount(e.target.value)}
                          placeholder="5"
                          data-testid="input-peptide-amount"
                        />
                        <Select value={peptideUnit} onValueChange={setPeptideUnit}>
                          <SelectTrigger className="w-24" data-testid="select-peptide-unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mg">mg</SelectItem>
                            <SelectItem value="mcg">mcg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bw-water">Bacteriostatic Water (mL)</Label>
                      <Input
                        id="bw-water"
                        type="number"
                        value={bwWater}
                        onChange={(e) => setBwWater(e.target.value)}
                        placeholder="2"
                        data-testid="input-bw-water"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="desired-dose">Desired Dose</Label>
                      <div className="flex gap-2">
                        <Input
                          id="desired-dose"
                          type="number"
                          value={desiredDose}
                          onChange={(e) => setDesiredDose(e.target.value)}
                          placeholder="250"
                          data-testid="input-desired-dose"
                        />
                        <Select value={doseUnit} onValueChange={setDoseUnit}>
                          <SelectTrigger className="w-24" data-testid="select-dose-unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcg">mcg</SelectItem>
                            <SelectItem value="mg">mg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button onClick={calculatePeptideDose} className="w-full" data-testid="button-calculate-peptide">
                    Calculate Dose
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>
                    Your calculated injection volume and concentration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result ? (
                    <div className="space-y-4">
                      <div className="rounded-md bg-primary/10 p-4">
                        <div className="text-sm text-muted-foreground mb-1">Volume to Inject</div>
                        <div className="text-3xl font-bold text-primary" data-testid="text-volume-result">
                          {result.volumeToInject} mL
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          ({Math.round(result.volumeToInject * 100)} units on insulin syringe)
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-md border p-3">
                          <div className="text-sm text-muted-foreground">Concentration</div>
                          <div className="text-lg font-semibold" data-testid="text-concentration">
                            {result.concentration} mcg/mL
                          </div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-sm text-muted-foreground">mcg per Insulin Unit</div>
                          <div className="text-lg font-semibold" data-testid="text-mcg-per-unit">
                            {result.mcgPerUnit} mcg/IU
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <Info className="h-10 w-10 mb-3 opacity-50" />
                      <p>Enter your peptide details and click calculate to see results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Common Peptide Dosages Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { name: "BPC-157", dose: "250-500 mcg", frequency: "1-2x daily" },
                    { name: "TB-500", dose: "2.5-5 mg", frequency: "2x weekly" },
                    { name: "Thymosin Alpha-1", dose: "1.6 mg", frequency: "2x weekly" },
                    { name: "GHK-Cu", dose: "200-400 mcg", frequency: "1x daily" },
                    { name: "Ipamorelin", dose: "200-300 mcg", frequency: "2-3x daily" },
                    { name: "CJC-1295", dose: "100-300 mcg", frequency: "1x daily" },
                    { name: "Epithalon", dose: "5-10 mg", frequency: "1x daily" },
                    { name: "Semax", dose: "300-600 mcg", frequency: "1-2x daily" },
                  ].map((peptide) => (
                    <div key={peptide.name} className="rounded-md border p-3">
                      <div className="font-medium">{peptide.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {peptide.dose} | {peptide.frequency}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="iv">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-secondary" />
                    IV Dosage Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate IV medication dosages based on member weight
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="member-weight">Member Weight</Label>
                      <div className="flex gap-2">
                        <Input
                          id="member-weight"
                          type="number"
                          value={ivWeight}
                          onChange={(e) => setIvWeight(e.target.value)}
                          placeholder="70"
                          data-testid="input-iv-weight"
                        />
                        <Select value={ivWeightUnit} onValueChange={setIvWeightUnit}>
                          <SelectTrigger className="w-20" data-testid="select-weight-unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="lbs">lbs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dose-per-kg">Dose per kg (mg/kg)</Label>
                      <Input
                        id="dose-per-kg"
                        type="number"
                        value={ivDosePerKg}
                        onChange={(e) => setIvDosePerKg(e.target.value)}
                        placeholder="10"
                        data-testid="input-dose-per-kg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="concentration">Drug Concentration (mg/mL)</Label>
                    <Input
                      id="concentration"
                      type="number"
                      value={ivConcentration}
                      onChange={(e) => setIvConcentration(e.target.value)}
                      placeholder="100"
                      data-testid="input-iv-concentration"
                    />
                  </div>

                  <Button onClick={calculateIvDose} className="w-full" data-testid="button-calculate-iv">
                    Calculate IV Dose
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                  <CardDescription>
                    Your calculated IV dosage and volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ivResult ? (
                    <div className="space-y-4">
                      <div className="rounded-md bg-secondary/10 p-4">
                        <div className="text-sm text-muted-foreground mb-1">Total Dose Required</div>
                        <div className="text-3xl font-bold text-secondary" data-testid="text-iv-dose">
                          {ivResult.totalDose} mg
                        </div>
                      </div>

                      <div className="rounded-md bg-primary/10 p-4">
                        <div className="text-sm text-muted-foreground mb-1">Volume to Administer</div>
                        <div className="text-3xl font-bold text-primary" data-testid="text-iv-volume">
                          {ivResult.volumeNeeded} mL
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <Info className="h-10 w-10 mb-3 opacity-50" />
                      <p>Enter member details and click calculate to see results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Common IV Therapy Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: "Vitamin C (High Dose)", standard: "25-100g", notes: "Diluted in saline" },
                    { name: "Magnesium Chloride", standard: "2-4g", notes: "Slow IV push" },
                    { name: "Glutathione", standard: "600-2400mg", notes: "IV push" },
                    { name: "NAD+", standard: "250-1000mg", notes: "Slow infusion 2-4 hrs" },
                    { name: "Myers Cocktail", standard: "Standard mix", notes: "30-45 min infusion" },
                    { name: "Alpha Lipoic Acid", standard: "300-600mg", notes: "IV infusion" },
                  ].map((therapy) => (
                    <div key={therapy.name} className="rounded-md border p-3">
                      <div className="font-medium">{therapy.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {therapy.standard}
                      </div>
                      <Badge variant="outline" className="mt-1">{therapy.notes}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
