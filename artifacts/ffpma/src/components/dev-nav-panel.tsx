import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, ChevronRight, Navigation, X, Database, Globe, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface NavSection {
  title: string;
  icon: string;
  routes: { path: string; label: string }[];
}

const navSections: NavSection[] = [
  {
    title: 'Public',
    icon: '🌐',
    routes: [
      { path: '/', label: 'Landing Page' },
      { path: '/about', label: 'About' },
      { path: '/login', label: 'Login' },
      { path: '/join', label: 'Member Signup' },
      { path: '/nexus', label: 'Formula Allio (AI Hub)' },
    ]
  },
  {
    title: 'Products & Shopping',
    icon: '🛒',
    routes: [
      { path: '/products', label: 'Product Catalog' },
      { path: '/cart', label: 'Shopping Cart' },
      { path: '/orders', label: 'Order History' },
    ]
  },
  {
    title: 'Training & Education',
    icon: '📚',
    routes: [
      { path: '/training', label: 'Training Programs' },
      { path: '/quizzes', label: 'All Quizzes' },
      { path: '/library', label: 'Pattern Library' },
      { path: '/protocols', label: 'Healing Protocols' },
      { path: '/programs', label: 'Programs' },
    ]
  },
  {
    title: 'Resources & Tools',
    icon: '🔧',
    routes: [
      { path: '/resources', label: 'Resources Hub' },
      { path: '/resources/peptide-console', label: 'Peptide Console' },
      { path: '/resources/dosage-calculator', label: 'Dosage Calculator' },
      { path: '/resources/ecs-tool', label: 'ECS Tool' },
      { path: '/resources/ligand-calculator', label: 'Ligand Calculator' },
      { path: '/resources/blood-samples', label: 'Blood Analysis' },
      { path: '/resources/marketing-studio', label: 'Marketing Studio' },
      { path: '/resources/asset-gallery', label: 'Asset Gallery' },
      { path: '/video-studio', label: 'Video Studio' },
    ]
  },
  {
    title: 'Member Area',
    icon: '👤',
    routes: [
      { path: '/member', label: 'Member Dashboard' },
      { path: '/member-onboarding', label: 'Onboarding' },
      { path: '/contracts', label: 'Contracts' },
    ]
  },
  {
    title: 'Clinic Portal',
    icon: '🏥',
    routes: [
      { path: '/clinic', label: 'Clinic Dashboard' },
      { path: '/clinic/members', label: 'Clinic Members' },
      { path: '/clinic/iv-program', label: 'IV Program' },
      { path: '/clinic/contracts', label: 'Clinic Contracts' },
    ]
  },
  {
    title: 'Doctor Portal',
    icon: '⚕️',
    routes: [
      { path: '/doctors', label: 'Doctors Portal' },
      { path: '/doctor/signup', label: 'Doctor Signup' },
      { path: '/doctor/downline', label: 'Doctor Network' },
      { path: '/doctor-network', label: 'Network Overview' },
    ]
  },
  {
    title: 'Support & Chat',
    icon: '💬',
    routes: [
      { path: '/support', label: 'Support Hub' },
      { path: '/chat', label: 'AI Chat' },
      { path: '/diane', label: 'DIANE Agent' },
    ]
  },
  {
    title: 'Admin',
    icon: '⚙️',
    routes: [
      { path: '/admin', label: 'Admin Dashboard' },
      { path: '/admin/diane', label: 'Admin DIANE' },
      { path: '/admin/sync', label: 'WooCommerce Sync' },
      { path: '/admin/members', label: 'Member Management' },
      { path: '/admin/clinics', label: 'Clinic Management' },
      { path: '/admin/backoffice', label: 'Back Office' },
      { path: '/dashboard', label: 'Dashboard' },
    ]
  },
  {
    title: 'Trustee',
    icon: '🔐',
    routes: [
      { path: '/trustee', label: 'Trustee Command Center' },
    ]
  },
];

export function DevNavPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Public']));
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return null;

  let roles: string[] = [];
  if (Array.isArray(user.wpRoles)) {
    roles = user.wpRoles;
  } else if (typeof user.wpRoles === 'string') {
    try {
      roles = JSON.parse(user.wpRoles);
    } catch (e) {
      roles = user.wpRoles.split(',').map((r: string) => r.trim());
    }
  }

  const userEmail = typeof user.email === 'string' ? user.email.toLowerCase() : '';
  const isAdmin = roles.includes('administrator') || userEmail.includes('blake');
  const isDoctor = roles.includes('doctor');

  if (!isAdmin && !isDoctor) {
    return null;
  }

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  const totalRoutes = navSections.reduce((acc, s) => acc + s.routes.length, 0);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        title="Developer Navigation"
        data-testid="dev-nav-toggle"
      >
        <Navigation className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 max-h-[80vh] bg-slate-900 border border-cyan-500/30 rounded-lg shadow-2xl overflow-hidden" data-testid="dev-nav-panel">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-white" />
          <span className="font-semibold text-white">Dev Navigation</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white">{totalRoutes} pages</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white transition"
          data-testid="dev-nav-close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-2 border-b border-cyan-500/20 bg-slate-800/50">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Globe className="w-3 h-3" />
          <span>Current: </span>
          <code className="bg-slate-700 px-1.5 py-0.5 rounded text-cyan-400">{location}</code>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[60vh] p-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-1">
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-slate-300 hover:bg-slate-800 rounded transition"
              data-testid={`dev-nav-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {expandedSections.has(section.title) ? (
                <ChevronDown className="w-4 h-4 text-cyan-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
              <span>{section.icon}</span>
              <span className="text-sm font-medium">{section.title}</span>
              <span className="ml-auto text-xs text-slate-500">{section.routes.length}</span>
            </button>

            {expandedSections.has(section.title) && (
              <div className="ml-6 border-l border-slate-700 pl-2">
                {section.routes.map((route) => {
                  const isActive = location === route.path;
                  return (
                    <button
                      key={route.path}
                      onClick={() => navigateTo(route.path)}
                      className={`w-full flex items-center gap-2 px-2 py-1 text-left text-sm rounded transition ${isActive
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      data-testid={`dev-nav-link-${route.path.replace(/\//g, '-').slice(1) || 'home'}`}
                    >
                      {isActive && <CheckCircle2 className="w-3 h-3 text-cyan-400" />}
                      <span>{route.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-cyan-500/20 bg-slate-800/50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Database className="w-3 h-3" />
          <span>Data Source: PostgreSQL (Real)</span>
          <Shield className="w-3 h-3 ml-2 text-green-500" />
        </div>
      </div>
    </div>
  );
}
