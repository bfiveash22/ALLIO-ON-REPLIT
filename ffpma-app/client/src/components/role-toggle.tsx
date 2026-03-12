import { useLocation } from "wouter";
import { Eye, Crown, Users, Shield, Stethoscope } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ViewRole = "trustee" | "member" | "admin" | "doctor";

interface RoleToggleProps {
  currentRole?: ViewRole;
  className?: string;
}

const roleIcons = {
  trustee: Crown,
  member: Users,
  admin: Shield,
  doctor: Stethoscope,
};

const roleLabels = {
  trustee: "Trustee View",
  member: "Member View",
  admin: "Admin View",
  doctor: "Doctor View",
};

const roleRoutes = {
  trustee: "/trustee",
  member: "/dashboard",
  admin: "/admin",
  doctor: "/doctors",
};

export function RoleToggle({ currentRole = "member", className = "" }: RoleToggleProps) {
  const [, setLocation] = useLocation();

  const handleViewChange = (value: string) => {
    const route = roleRoutes[value as ViewRole];
    if (route) {
      setLocation(route);
    }
  };

  const CurrentIcon = roleIcons[currentRole];

  return (
    <Select value={currentRole} onValueChange={handleViewChange}>
      <SelectTrigger 
        className={`w-[160px] bg-white/10 border-white/20 text-white ${className}`} 
        data-testid="select-view-as"
      >
        <Eye className="w-4 h-4 mr-2" />
        <SelectValue placeholder="View as..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="trustee">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Trustee View
          </div>
        </SelectItem>
        <SelectItem value="member">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Member View
          </div>
        </SelectItem>
        <SelectItem value="admin">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admin View
          </div>
        </SelectItem>
        <SelectItem value="doctor">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Doctor View
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
