import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";
import {
  User,
  ShoppingBag,
  Download,
  MapPin,
  Settings,
  CreditCard,
  Eye,
  Package,
  Home,
  Save,
  Lock,
  CheckCircle,
  AlertCircle,
  Shield,
  Phone,
  Mail,
} from "lucide-react";

interface Address {
  id?: string;
  type: "billing" | "shipping";
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const TABS = [
  { value: "overview", label: "Overview", icon: Home },
  { value: "orders", label: "Orders", icon: ShoppingBag },
  { value: "downloads", label: "Downloads", icon: Download },
  { value: "addresses", label: "Addresses", icon: MapPin },
  { value: "details", label: "Account Details", icon: Settings },
  { value: "payment", label: "Payment Methods", icon: CreditCard },
];

export default function MyAccountPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "overview";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && TABS.some(t => t.value === tab)) {
      setActiveTab(tab);
    }
  }, [location]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [billingAddress, setBillingAddress] = useState<Address>({
    type: "billing",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    phone: "",
  });
  const [shippingAddress, setShippingAddress] = useState<Address>({
    type: "shipping",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    phone: "",
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  const formatPrice = (price: string | number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(price));

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "delivered": return "default";
      case "shipped": return "secondary";
      case "processing": return "outline";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated", description: "Your account details have been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsEditingProfile(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile. Please try again.", variant: "destructive" });
    },
  });

  const savePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to change password");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to change password. Please check your current password.", variant: "destructive" });
    },
  });

  const saveAddressMutation = useMutation({
    mutationFn: async (address: Address) => {
      const res = await fetch("/api/profile/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(address),
      });
      if (!res.ok) throw new Error("Failed to save address");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Address saved", description: "Your address has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save address.", variant: "destructive" });
    },
  });

  const handlePasswordSave = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    savePasswordMutation.mutate(passwordForm);
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "M"}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
              <p className="text-slate-400 text-sm">{user?.email}</p>
            </div>
            <Badge className="ml-auto bg-cyan-500/20 text-cyan-300 border-cyan-500/30 gap-1">
              <Shield className="h-3 w-3" />
              PMA Member
            </Badge>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto bg-slate-800/50 p-1 rounded-xl border border-white/10">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300"
                data-testid={`tab-account-${tab.value}`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "cyan" },
                { label: "Member Status", value: "Active", icon: Shield, color: "green" },
                { label: "Downloads", value: "0", icon: Download, color: "violet" },
                { label: "Saved Cards", value: "0", icon: CreditCard, color: "amber" },
              ].map((stat) => (
                <Card key={stat.label} className={`bg-${stat.color}-500/10 border-${stat.color}-500/20`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                      <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-slate-400">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <ShoppingBag className="h-5 w-5 text-cyan-400" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <p className="text-sm font-mono text-white">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                        </div>
                        <Badge variant={getStatusVariant(order.status || "pending")}>
                          {order.status || "Pending"}
                        </Badge>
                        <p className="text-sm font-medium text-white">{formatPrice(order.total)}</p>
                      </div>
                    ))}
                    <Button asChild variant="outline" size="sm" className="w-full border-white/20 text-white mt-2">
                      <Link href="/orders">View All Orders</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No orders yet</p>
                    <Button asChild size="sm" className="mt-3 bg-cyan-600 hover:bg-cyan-500">
                      <Link href="/products">Browse Products</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Order History</CardTitle>
                <CardDescription className="text-slate-400">All your past and current orders</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 gap-4" data-testid={`order-row-${order.id}`}>
                        <div className="min-w-0">
                          <p className="text-sm font-mono text-white">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                        </div>
                        <Badge variant={getStatusVariant(order.status || "pending")}>
                          {order.status || "Pending"}
                        </Badge>
                        <p className="text-sm font-medium text-white whitespace-nowrap">{formatPrice(order.total)}</p>
                        <Button variant="ghost" size="sm" asChild className="text-cyan-400 hover:text-cyan-300 shrink-0">
                          <Link href={`/orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">You haven't placed any orders yet.</p>
                    <Button asChild className="bg-cyan-600 hover:bg-cyan-500">
                      <Link href="/products">Start Shopping</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="downloads" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Download className="h-5 w-5 text-violet-400" />
                  Digital Downloads
                </CardTitle>
                <CardDescription className="text-slate-400">Access your purchased digital products and documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Download className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-white font-medium mb-2">No downloads available</p>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto">
                    When you purchase digital products (protocols, guides, documents), they will appear here for download.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="mt-6 space-y-6">
            {[
              { title: "Billing Address", type: "billing" as const, address: billingAddress, setAddress: setBillingAddress },
              { title: "Shipping Address", type: "shipping" as const, address: shippingAddress, setAddress: setShippingAddress },
            ].map(({ title, type, address, setAddress }) => (
              <Card key={type} className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-400" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-400 text-sm">First Name</Label>
                      <Input
                        value={address.firstName}
                        onChange={(e) => setAddress({ ...address, firstName: e.target.value })}
                        className="bg-slate-800/50 border-white/10 text-white mt-1"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Last Name</Label>
                      <Input
                        value={address.lastName}
                        onChange={(e) => setAddress({ ...address, lastName: e.target.value })}
                        className="bg-slate-800/50 border-white/10 text-white mt-1"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Street Address</Label>
                    <Input
                      value={address.address1}
                      onChange={(e) => setAddress({ ...address, address1: e.target.value })}
                      className="bg-slate-800/50 border-white/10 text-white mt-1"
                      placeholder="123 Healing Way"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Apartment, Suite, etc. (optional)</Label>
                    <Input
                      value={address.address2 || ""}
                      onChange={(e) => setAddress({ ...address, address2: e.target.value })}
                      className="bg-slate-800/50 border-white/10 text-white mt-1"
                      placeholder="Apt 2B"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-400 text-sm">City</Label>
                      <Input
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="bg-slate-800/50 border-white/10 text-white mt-1"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">State</Label>
                      <Input
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className="bg-slate-800/50 border-white/10 text-white mt-1"
                        placeholder="CA"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">ZIP Code</Label>
                      <Input
                        value={address.zip}
                        onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                        className="bg-slate-800/50 border-white/10 text-white mt-1"
                        placeholder="90210"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Phone (optional)</Label>
                    <Input
                      value={address.phone || ""}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="bg-slate-800/50 border-white/10 text-white mt-1"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <Button
                    onClick={() => saveAddressMutation.mutate(address)}
                    disabled={saveAddressMutation.isPending}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save {title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="details" className="mt-6 space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-cyan-400" />
                    Profile Information
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    {isEditingProfile ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingProfile ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-400 text-sm">First Name</Label>
                        <Input
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          className="bg-slate-800/50 border-white/10 text-white mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Last Name</Label>
                        <Input
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          className="bg-slate-800/50 border-white/10 text-white mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email Address
                      </Label>
                      <Input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="bg-slate-800/50 border-white/10 text-white mt-1"
                      />
                    </div>
                    <Button
                      onClick={() => saveProfileMutation.mutate(profileForm)}
                      disabled={saveProfileMutation.isPending}
                      className="bg-cyan-600 hover:bg-cyan-500 gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saveProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <User className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400">Name</p>
                        <p className="text-white">{user?.firstName} {user?.lastName || ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400">Email</p>
                        <p className="text-white">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-400" />
                  Change Password
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Update your account password. You'll need to use your new password next time you log in.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-400 text-sm">Current Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="bg-slate-800/50 border-white/10 text-white mt-1"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-sm">New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="bg-slate-800/50 border-white/10 text-white mt-1"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label className="text-slate-400 text-sm">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="bg-slate-800/50 border-white/10 text-white mt-1"
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  onClick={handlePasswordSave}
                  disabled={savePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword}
                  className="bg-amber-600 hover:bg-amber-500 gap-2"
                >
                  <Lock className="h-4 w-4" />
                  {savePasswordMutation.isPending ? "Saving..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-violet-400" />
                  Payment Methods
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage your saved payment methods for faster checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-white font-medium mb-2">No saved payment methods</p>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                    Add a payment method for faster checkout. Your card details are securely stored by Stripe.
                  </p>
                  <Button className="bg-violet-600 hover:bg-violet-500 gap-2">
                    <CreditCard className="h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
