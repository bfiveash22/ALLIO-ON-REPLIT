import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, Mail, Building2, Users, Activity, Grid, Network } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NetworkDoctor {
  id: string;
  drName: string;
  clinicName?: string;
  phoneNumber?: string;
  practiceType?: string;
  address?: string;
  city?: string;
  state?: string;
  email?: string;
  onMap?: boolean;
  onboardedBy?: string;
}

type ViewMode = 'network' | 'grid';

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  doctor: NetworkDoctor;
}

function NetworkVisualization({ doctors, onSelectDoctor }: { doctors: NetworkDoctor[], onSelectDoctor: (d: NetworkDoctor) => void }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  const { nodes, stateNodes, connections } = useMemo(() => {
    const stateGroups: Record<string, NetworkDoctor[]> = {};
    doctors.forEach(d => {
      const state = d.state || 'Unknown';
      if (!stateGroups[state]) stateGroups[state] = [];
      stateGroups[state].push(d);
    });
    
    const stateColors: Record<string, string> = {
      'TX': '#06b6d4', 'NE': '#8b5cf6', 'CA': '#f59e0b', 'FL': '#10b981',
      'NY': '#ef4444', 'AZ': '#f97316', 'CO': '#3b82f6', 'OH': '#ec4899',
      'PA': '#14b8a6', 'IL': '#84cc16', 'GA': '#6366f1', 'NC': '#22d3ee',
      'Unknown': '#64748b'
    };
    
    const stateList = Object.keys(stateGroups).sort((a, b) => stateGroups[b].length - stateGroups[a].length);
    const centerX = 400, centerY = 300;
    const stateRadius = 180;
    
    const stateNodeList: { state: string; x: number; y: number; count: number; color: string }[] = [];
    const nodeList: NetworkNode[] = [];
    const connList: { from: string; to: string }[] = [];
    
    stateList.forEach((state, stateIndex) => {
      const angle = (stateIndex / stateList.length) * 2 * Math.PI - Math.PI / 2;
      const stateX = centerX + Math.cos(angle) * stateRadius;
      const stateY = centerY + Math.sin(angle) * stateRadius;
      const color = stateColors[state] || '#64748b';
      
      stateNodeList.push({ state, x: stateX, y: stateY, count: stateGroups[state].length, color });
      
      const doctorsInState = stateGroups[state];
      const docRadius = Math.min(80, 20 + doctorsInState.length * 3);
      
      doctorsInState.forEach((doctor, docIndex) => {
        const docAngle = (docIndex / doctorsInState.length) * 2 * Math.PI;
        const docX = stateX + Math.cos(docAngle) * docRadius;
        const docY = stateY + Math.sin(docAngle) * docRadius;
        
        nodeList.push({
          id: doctor.id,
          x: docX,
          y: docY,
          radius: doctor.onMap ? 6 : 4,
          color,
          doctor
        });
        
        connList.push({ from: `state-${state}`, to: doctor.id });
      });
    });
    
    return { nodes: nodeList, stateNodes: stateNodeList, connections: connList };
  }, [doctors]);

  const selectedDoctor = selectedNode ? nodes.find(n => n.id === selectedNode)?.doctor : null;

  return (
    <div className="relative bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
      <svg 
        viewBox="0 0 800 600" 
        className="w-full h-[500px]"
        data-testid="network-visualization"
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <circle cx="400" cy="300" r="120" fill="url(#centerGlow)" />
        <circle cx="400" cy="300" r="60" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
        <text x="400" y="295" textAnchor="middle" fill="#06b6d4" fontSize="12" fontWeight="bold">ALLIO</text>
        <text x="400" y="310" textAnchor="middle" fill="#94a3b8" fontSize="8">NETWORK</text>
        
        {stateNodes.map((sn) => (
          <line
            key={`conn-center-${sn.state}`}
            x1="400" y1="300"
            x2={sn.x} y2={sn.y}
            stroke={sn.color}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        ))}
        
        {nodes.map((node) => {
          const stateNode = stateNodes.find(s => s.state === (node.doctor.state || 'Unknown'));
          if (!stateNode) return null;
          return (
            <line
              key={`conn-${node.id}`}
              x1={stateNode.x} y1={stateNode.y}
              x2={node.x} y2={node.y}
              stroke={node.color}
              strokeWidth="0.5"
              strokeOpacity="0.2"
            />
          );
        })}
        
        {stateNodes.map((sn) => (
          <g key={`state-${sn.state}`}>
            <circle
              cx={sn.x} cy={sn.y}
              r={Math.min(25, 12 + sn.count)}
              fill={sn.color}
              fillOpacity="0.2"
              stroke={sn.color}
              strokeWidth="2"
            />
            <text
              x={sn.x} y={sn.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={sn.color}
              fontSize="10"
              fontWeight="bold"
            >
              {sn.state}
            </text>
            <text
              x={sn.x} y={sn.y + 12}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="8"
            >
              {sn.count}
            </text>
          </g>
        ))}
        
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x} cy={node.y}
              r={hoveredNode === node.id || selectedNode === node.id ? node.radius * 1.5 : node.radius}
              fill={node.color}
              fillOpacity={hoveredNode === node.id || selectedNode === node.id ? 1 : 0.7}
              stroke={selectedNode === node.id ? '#fff' : 'none'}
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => {
                setSelectedNode(node.id);
                onSelectDoctor(node.doctor);
              }}
              data-testid={`node-doctor-${node.id}`}
            />
            {(hoveredNode === node.id) && (
              <text
                x={node.x} y={node.y - 12}
                textAnchor="middle"
                fill="#fff"
                fontSize="9"
                pointerEvents="none"
              >
                {node.doctor.drName.split(' ').slice(0, 2).join(' ')}
              </text>
            )}
          </g>
        ))}
      </svg>
      
      {selectedDoctor && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 bg-slate-800/95 rounded-lg p-4 border border-cyan-500/30"
          data-testid="panel-selected-doctor"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-white" data-testid="text-selected-doctor-name">{selectedDoctor.drName}</h3>
              {selectedDoctor.clinicName && <p className="text-cyan-400 text-sm" data-testid="text-selected-clinic-name">{selectedDoctor.clinicName}</p>}
            </div>
            {selectedDoctor.practiceType && (
              <Badge className="bg-blue-500/20 text-blue-400" data-testid="badge-practice-type">{selectedDoctor.practiceType}</Badge>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-400">
            {selectedDoctor.address && <span className="flex items-center gap-1" data-testid="text-selected-location"><MapPin className="w-3 h-3" />{selectedDoctor.city}, {selectedDoctor.state}</span>}
            {selectedDoctor.phoneNumber && <span className="flex items-center gap-1" data-testid="text-selected-phone"><Phone className="w-3 h-3" />{selectedDoctor.phoneNumber}</span>}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function DoctorNetwork() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('network');
  const [selectedDoctor, setSelectedDoctor] = useState<NetworkDoctor | null>(null);

  const { data: doctors = [], isLoading } = useQuery<NetworkDoctor[]>({
    queryKey: ["/api/network-doctors"],
  });

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = 
      doc.drName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.clinicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.practiceType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = !selectedState || doc.state === selectedState;
    return matchesSearch && matchesState;
  });

  const states = Array.from(new Set(doctors.map(d => d.state).filter(Boolean))).sort() as string[];
  const practiceTypes = Array.from(new Set(doctors.map(d => d.practiceType).filter(Boolean))) as string[];

  const stats = {
    total: doctors.length,
    onMap: doctors.filter(d => d.onMap).length,
    practiceTypes: practiceTypes.length,
    states: states.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
            ALLIO Doctor Network
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Our nationwide network of practitioners using ALLIO for true healing
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-cyan-500/30">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Doctors</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.onMap}</div>
              <div className="text-sm text-gray-400">On Map</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.practiceTypes}</div>
              <div className="text-sm text-gray-400">Practice Types</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-amber-500/30">
            <CardContent className="p-4 text-center">
              <Building2 className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.states}</div>
              <div className="text-sm text-gray-400">States</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search doctors, clinics, cities, or practice types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
              data-testid="input-doctor-search"
            />
          </div>
          <select
            value={selectedState || ""}
            onChange={(e) => setSelectedState(e.target.value || null)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-white"
            data-testid="select-state-filter"
          >
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'network' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('network')}
              className={viewMode === 'network' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-slate-600'}
              data-testid="button-view-network"
            >
              <Network className="w-4 h-4 mr-1" />
              Network
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-slate-600'}
              data-testid="button-view-grid"
            >
              <Grid className="w-4 h-4 mr-1" />
              Grid
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading doctor network...</p>
          </div>
        ) : viewMode === 'network' ? (
          <NetworkVisualization 
            doctors={filteredDoctors} 
            onSelectDoctor={setSelectedDoctor} 
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card 
                  className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-colors"
                  data-testid={`card-doctor-${doctor.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-white">{doctor.drName}</CardTitle>
                      {doctor.onMap && (
                        <Badge variant="outline" className="text-green-400 border-green-400/50">
                          On Map
                        </Badge>
                      )}
                    </div>
                    {doctor.clinicName && doctor.clinicName !== doctor.drName && (
                      <p className="text-cyan-400 text-sm">{doctor.clinicName}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {doctor.practiceType && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-none">
                        {doctor.practiceType}
                      </Badge>
                    )}
                    {doctor.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-400">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{doctor.address}</span>
                      </div>
                    )}
                    {doctor.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{doctor.phoneNumber}</span>
                      </div>
                    )}
                    {doctor.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{doctor.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {filteredDoctors.length > 0 && (
          <p className="text-center text-gray-400 mt-8" data-testid="text-doctor-count">
            Showing {filteredDoctors.length} of {doctors.length} doctors in the network.
          </p>
        )}

        {filteredDoctors.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No doctors found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
