import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Link as LinkIcon,
  Users,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { Clinic } from "@shared/schema";

const clinicFormSchema = z.object({
  name: z.string().min(2, "Clinic name must be at least 2 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  practiceType: z.string().optional(),
  onboardedBy: z.string().optional(),
  onMap: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type ClinicFormValues = z.infer<typeof clinicFormSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminClinicsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);

  const { data: clinics = [], isLoading, refetch } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
  });

  const form = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      website: "",
      practiceType: "",
      onboardedBy: "",
      onMap: false,
      isActive: true,
    },
  });

  const createClinicMutation = useMutation({
    mutationFn: async (data: ClinicFormValues) => {
      const payload = {
        ...data,
        slug: data.slug || generateSlug(data.name),
        email: data.email || null,
        website: data.website || null,
      };
      const response = await apiRequest("POST", "/api/admin/clinic", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({
        title: "Clinic Created",
        description: "New clinic has been added to the FFNetwork successfully.",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Clinic",
        description: error.message || "An error occurred while creating the clinic.",
        variant: "destructive",
      });
    },
  });

  const updateClinicMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClinicFormValues }) => {
      const payload = {
        ...data,
        slug: data.slug || generateSlug(data.name),
        email: data.email || null,
        website: data.website || null,
      };
      const response = await apiRequest("PUT", `/api/admin/clinic/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({
        title: "Clinic Updated",
        description: "Clinic information has been updated successfully.",
      });
      setEditingClinic(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Clinic",
        description: error.message || "An error occurred while updating the clinic.",
        variant: "destructive",
      });
    },
  });

  const deleteClinicMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/clinic/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({
        title: "Clinic Deleted",
        description: "Clinic has been removed from the FFNetwork.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Clinic",
        description: error.message || "An error occurred while deleting the clinic.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClinicFormValues) => {
    if (editingClinic) {
      updateClinicMutation.mutate({ id: editingClinic.id, data });
    } else {
      createClinicMutation.mutate(data);
    }
  };

  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
    form.reset({
      name: clinic.name,
      slug: clinic.slug || "",
      description: clinic.description || "",
      address: clinic.address || "",
      city: clinic.city || "",
      state: clinic.state || "",
      zipCode: clinic.zipCode || "",
      phone: clinic.phone || "",
      email: clinic.email || "",
      website: clinic.website || "",
      practiceType: clinic.practiceType || "",
      onboardedBy: clinic.onboardedBy || "",
      onMap: clinic.onMap || false,
      isActive: clinic.isActive ?? true,
    });
    setIsAddDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingClinic(null);
    form.reset({
      name: "",
      slug: "",
      description: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      website: "",
      practiceType: "",
      onboardedBy: "",
      onMap: false,
      isActive: true,
    });
    setIsAddDialogOpen(true);
  };

  const filteredClinics = clinics.filter((clinic) =>
    clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.practiceType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeClinics = clinics.filter((c) => c.isActive !== false);
  const onMapClinics = clinics.filter((c) => c.onMap);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">FFNetwork Clinics</h1>
            <p className="text-muted-foreground">Manage Forgotten Formula Network clinics and practitioners</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              data-testid="button-refresh-clinics"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} data-testid="button-add-clinic">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Clinic
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingClinic ? "Edit Clinic" : "Add New Clinic"}</DialogTitle>
                  <DialogDescription>
                    {editingClinic 
                      ? "Update the clinic information below." 
                      : "Add a new clinic to the Forgotten Formula Network."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clinic Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Wellness Center of Austin" 
                                {...field} 
                                data-testid="input-clinic-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL Slug</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="wellness-center-austin" 
                                {...field}
                                data-testid="input-clinic-slug"
                              />
                            </FormControl>
                            <FormDescription>Leave blank to auto-generate</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of the clinic..." 
                              {...field}
                              data-testid="input-clinic-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="practiceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Practice Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-practice-type">
                                  <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="DC">Chiropractor (DC)</SelectItem>
                                <SelectItem value="MD">Medical Doctor (MD)</SelectItem>
                                <SelectItem value="DO">Osteopath (DO)</SelectItem>
                                <SelectItem value="ND">Naturopath (ND)</SelectItem>
                                <SelectItem value="NP">Nurse Practitioner (NP)</SelectItem>
                                <SelectItem value="PA">Physician Assistant (PA)</SelectItem>
                                <SelectItem value="RN">Registered Nurse (RN)</SelectItem>
                                <SelectItem value="LAc">Acupuncturist (LAc)</SelectItem>
                                <SelectItem value="LMT">Massage Therapist (LMT)</SelectItem>
                                <SelectItem value="Nutrition">Nutrition Store</SelectItem>
                                <SelectItem value="Wellness">Wellness Center</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="onboardedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Onboarded By</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Name of person who onboarded" 
                                {...field}
                                data-testid="input-onboarded-by"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123 Main Street" 
                              {...field}
                              data-testid="input-clinic-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Austin" 
                                {...field}
                                data-testid="input-clinic-city"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="TX" 
                                {...field}
                                data-testid="input-clinic-state"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="78701" 
                                {...field}
                                data-testid="input-clinic-zip"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(512) 555-0123" 
                                {...field}
                                data-testid="input-clinic-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="info@clinic.com" 
                                {...field}
                                data-testid="input-clinic-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://www.clinic-website.com" 
                              {...field}
                              data-testid="input-clinic-website"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Active</FormLabel>
                              <FormDescription>Clinic is accepting new members</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-clinic-active"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="onMap"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Show on Map</FormLabel>
                              <FormDescription>Display on public clinic finder</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-clinic-on-map"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createClinicMutation.isPending || updateClinicMutation.isPending}
                        data-testid="button-save-clinic"
                      >
                        {(createClinicMutation.isPending || updateClinicMutation.isPending) && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {editingClinic ? "Update Clinic" : "Add Clinic"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-clinics">{clinics.length}</div>
              <p className="text-xs text-muted-foreground">In the FFNetwork</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clinics</CardTitle>
              <CheckCircle className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-clinics">{activeClinics.length}</div>
              <p className="text-xs text-muted-foreground">Accepting new members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Map</CardTitle>
              <MapPin className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-map-clinics">{onMapClinics.length}</div>
              <p className="text-xs text-muted-foreground">Visible in clinic finder</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>All Clinics</CardTitle>
                <CardDescription>Search and manage FFNetwork clinics</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clinics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-clinics"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredClinics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No clinics found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "Add your first clinic to get started"}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredClinics.map((clinic) => (
                    <div
                      key={clinic.id}
                      className="flex items-start justify-between gap-4 rounded-lg border p-4 hover-elevate"
                      data-testid={`card-clinic-${clinic.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold truncate">{clinic.name}</h4>
                          <div className="flex gap-1">
                            {clinic.isActive !== false ? (
                              <Badge variant="outline" className="text-cyan-600 border-cyan-600">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-600">
                                Inactive
                              </Badge>
                            )}
                            {clinic.onMap && (
                              <Badge variant="secondary">
                                <MapPin className="h-3 w-3 mr-1" />
                                On Map
                              </Badge>
                            )}
                            {clinic.practiceType && (
                              <Badge variant="outline">{clinic.practiceType}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {(clinic.city || clinic.state) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[clinic.city, clinic.state].filter(Boolean).join(", ")}
                            </span>
                          )}
                          {clinic.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {clinic.phone}
                            </span>
                          )}
                          {clinic.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {clinic.email}
                            </span>
                          )}
                          {clinic.slug && (
                            <span className="flex items-center gap-1">
                              <LinkIcon className="h-3 w-3" />
                              /join/{clinic.slug}
                            </span>
                          )}
                        </div>
                        {clinic.onboardedBy && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Onboarded by: {clinic.onboardedBy}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(clinic)}
                          data-testid={`button-edit-clinic-${clinic.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this clinic?")) {
                              deleteClinicMutation.mutate(clinic.id);
                            }
                          }}
                          data-testid={`button-delete-clinic-${clinic.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
