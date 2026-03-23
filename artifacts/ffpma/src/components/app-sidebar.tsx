import { Link, useLocation } from "wouter";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  Building2,
  Syringe,
  Activity,
  BookOpen,
  LogOut,
  LogIn,
  User,
  Bot,
  Calculator,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  Apple,
  Headphones,
  Dna,
  Scale,
  Sparkles,
  Radio,
  Droplets,
  Network,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { FFLogoFull } from "@/components/ff-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@shared/schema";
import { SmartSearch } from "@/components/SmartSearch";

const DNAHelixPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
    viewBox="0 0 100 800"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="50%" stopColor="#0891b2" />
        <stop offset="100%" stopColor="#d4a017" />
      </linearGradient>
    </defs>
    {[...Array(20)].map((_, i) => {
      const y = i * 40;
      const offset = Math.sin(i * 0.5) * 15;
      return (
        <g key={i}>
          <ellipse cx={50 + offset} cy={y} rx="25" ry="3" fill="url(#dnaGradient)" />
          <ellipse cx={50 - offset} cy={y + 20} rx="25" ry="3" fill="url(#dnaGradient)" />
          <line x1={50 + offset} y1={y} x2={50 - offset} y2={y + 20} stroke="url(#dnaGradient)" strokeWidth="1" />
        </g>
      );
    })}
  </svg>
);

interface AppSidebarProps {
  userRole?: UserRole;
}

const mainMenuItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "About / Handbook", url: "/about", icon: BookOpen },
  { title: "Products", url: "/products", icon: Package },
  { title: "Programs", url: "/programs", icon: Activity },
];

const memberMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Activity },
  { title: "Cart", url: "/cart", icon: ShoppingCart },
  { title: "My Orders", url: "/orders", icon: ShoppingCart },
  { title: "My Contracts", url: "/contracts", icon: FileText },
  { title: "Messages", url: "/chat", icon: MessageSquare },
];

const resourceMenuItems = [
  { title: "All Resources", url: "/resources", icon: BookOpen },
  { title: "Support Hub", url: "/support", icon: Headphones },
  { title: "Diane - Dietician AI", url: "/diane", icon: Apple },
  { title: "Training Hub", url: "/training", icon: GraduationCap },
  { title: "Protocols", url: "/protocols", icon: ClipboardList },
  { title: "Detox Protocols", url: "/resources/detox-protocols", icon: Droplets },
  { title: "Library", url: "/library", icon: FileText },
  { title: "Peptide Console", url: "/resources/peptide-console", icon: Bot },
  { title: "Protocol Builder", url: "/resources/protocol-builder", icon: Dna },
  { title: "Protocol Assembly", url: "/protocol-assembly", icon: Sparkles },
  { title: "Dosage Calculator", url: "/resources/dosage-calculator", icon: Calculator },
  { title: "Compound Interactions", url: "/resources/compound-interactions", icon: Droplets },
  { title: "Frequency Library", url: "/frequency-library", icon: Radio },
];

const doctorMenuItems = [
  { title: "My Clinic", url: "/clinic", icon: Building2 },
  { title: "Referral Network", url: "/doctor/downline", icon: Users },
  { title: "Members", url: "/clinic/members", icon: Users },
  { title: "IV Program", url: "/clinic/iv-program", icon: Syringe },
  { title: "Contracts", url: "/clinic/contracts", icon: FileText },
];

const adminMenuItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Activity },
  { title: "Diane AI Monitor", url: "/admin/diane", icon: Bot },
  { title: "Members Roster", url: "/admin/members", icon: Users },
  { title: "WordPress Sync", url: "/admin/sync", icon: RefreshCw },
  { title: "Manage Clinics", url: "/admin/clinics", icon: Building2 },
  { title: "Clinic Nodes", url: "/admin/clinic-nodes", icon: Network },
  { title: "Contract Review", url: "/trustee/contract-review", icon: Scale },
];


export function AppSidebar({ userRole = "member" }: AppSidebarProps) {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin":
      case "trustee":
        return "destructive";
      case "doctor":
      case "clinic":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "trustee":
        return "Trustee";
      case "doctor":
        return "Doctor";
      case "clinic":
        return "Clinic";
      default:
        return "Member";
    }
  };

  return (
    <Sidebar className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-white/10 relative overflow-hidden">
      <DNAHelixPattern />
      <SidebarHeader className="p-4 relative z-10">
        <Link href="/" data-testid="link-logo" className="block">
          <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 via-slate-900/50 to-amber-500/10 border border-cyan-500/20 backdrop-blur-sm hover:border-amber-500/30 transition-all">
            <img 
              src="/assets/ff_pma_header_logo.png" 
              alt="Forgotten Formula PMA" 
              className="h-16 w-auto mx-auto mb-2"
            />
            <p className="text-center text-xs font-semibold text-white/90 tracking-wide">Forgotten Formula PMA <span className="text-amber-400/80">&times;</span> ALLIO</p>
            <p className="text-center text-[10px] text-cyan-400/70 mt-1 italic tracking-wide">Restoring What Medicine Forgot.</p>
          </div>
        </Link>
        <div className="mt-3">
          <SmartSearch 
            placeholder="Smart Search..." 
            onSearch={(query) => console.log('Search:', query)}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="relative z-10 px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 uppercase text-[10px] tracking-wider font-semibold px-3">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/5 my-2" />
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 uppercase text-[10px] tracking-wider font-semibold px-3">Resources & Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAuthenticated && (
          <>
            <SidebarSeparator className="bg-white/5 my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-slate-500 uppercase text-[10px] tracking-wider font-semibold px-3">My Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {memberMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {(userRole === "doctor" || userRole === "clinic" || userRole === "admin" || userRole === "trustee") && (
          <>
            <SidebarSeparator className="bg-white/5 my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-slate-500 uppercase text-[10px] tracking-wider font-semibold px-3">Clinic Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {doctorMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {(userRole === "admin" || userRole === "trustee") && (
          <>
            <SidebarSeparator className="bg-white/5 my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-slate-500 uppercase text-[10px] tracking-wider font-semibold px-3">Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 relative z-10">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-cyan-500/20 backdrop-blur-sm">
            <Avatar className="h-9 w-9 ring-2 ring-cyan-500/30">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-amber-500 text-white">
                {user.firstName?.[0] || user.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate text-white">
                {user.firstName || user.email?.split("@")[0] || "Member"}
              </span>
              <Badge
                variant={getRoleBadgeVariant(userRole)}
                className="w-fit text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
              >
                {getRoleLabel(userRole)}
              </Badge>
            </div>
            <SidebarMenuButton
              size="sm"
              onClick={() => logout()}
              data-testid="button-logout"
              className="shrink-0 text-slate-400 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </SidebarMenuButton>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 via-slate-900/50 to-amber-500/20 border border-cyan-500/30 backdrop-blur-sm">
            <SidebarMenuButton asChild data-testid="link-login" className="w-full justify-center text-white hover:bg-white/10">
              <Link href="/login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-cyan-400" />
                <span className="font-medium">Member Sign In</span>
              </Link>
            </SidebarMenuButton>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
