import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { GasliteLogo } from "@/components/gaslite-logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Car,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Truck,
  Clock,
  DollarSign,
  Shield,
} from "lucide-react";
import type { User as AuthUser } from "@shared/models/auth";
import type { DriverApplication } from "@shared/schema";

const driverSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid SA phone number required"),
  address: z.string().min(5, "Home address is required"),
  licenseNumber: z.string().min(5, "License number is required"),
  vehicleRegistration: z.string().min(3, "Vehicle registration is required"),
});

type DriverFormData = z.infer<typeof driverSchema>;

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "License & Vehicle", icon: Car },
  { id: 3, title: "Documents", icon: FileText },
];

function ApplicationStatusView({ application }: { application: DriverApplication }) {
  const statusConfig = {
    pending: { label: "Under Review", color: "bg-yellow-500/10 text-yellow-600", description: "Our team is reviewing your application. This typically takes 1-2 business days." },
    approved: { label: "Approved", color: "bg-green-500/10 text-green-600", description: "Congratulations! Your application has been approved. You can now start accepting deliveries." },
    rejected: { label: "Not Approved", color: "bg-red-500/10 text-red-600", description: "Unfortunately, your application was not approved at this time. Please contact us for more details." },
  };

  const status = statusConfig[application.status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <GasliteLogo size="sm" />
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <main className="max-w-lg mx-auto px-4 py-12">
        <Card>
          <CardContent className="pt-8 pb-6 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${application.status === "approved" ? "bg-green-500/10" : application.status === "rejected" ? "bg-red-500/10" : "bg-yellow-500/10"}`}>
              {application.status === "approved" ? (
                <CheckCircle className="h-10 w-10 text-green-500" />
              ) : application.status === "rejected" ? (
                <Shield className="h-10 w-10 text-red-500" />
              ) : (
                <Clock className="h-10 w-10 text-yellow-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2" data-testid="text-application-status-title">Driver Application</h2>
            <Badge className={`${status.color} mb-4`} data-testid="badge-application-status">
              {status.label}
            </Badge>
            <p className="text-muted-foreground mb-6">{status.description}</p>
            <div className="text-left bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{application.firstName} {application.lastName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{application.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium">{new Date(application.createdAt!).toLocaleDateString()}</span>
              </div>
            </div>
            {application.status === "approved" && (
              <a href="/">
                <Button className="mt-6 w-full" data-testid="button-go-to-dashboard">
                  Go to Driver Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function DriverOnboarding({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [licenseDocUrl, setLicenseDocUrl] = useState<string | null>(null);
  const [vehicleDocUrl, setVehicleDocUrl] = useState<string | null>(null);

  const { data: appStatus } = useQuery<{ application: DriverApplication | null; driver: any }>({
    queryKey: ["/api/user/driver-application"],
  });

  const { uploadFile: uploadLicense, isUploading: licenseUploading } = useUpload({
    onSuccess: (response) => {
      setLicenseDocUrl(response.objectPath);
      toast({ title: "License document uploaded" });
    },
    onError: () => {
      toast({ title: "Upload failed", variant: "destructive" });
    },
  });

  const { uploadFile: uploadVehicle, isUploading: vehicleUploading } = useUpload({
    onSuccess: (response) => {
      setVehicleDocUrl(response.objectPath);
      toast({ title: "Vehicle document uploaded" });
    },
    onError: () => {
      toast({ title: "Upload failed", variant: "destructive" });
    },
  });

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: "",
      address: "",
      licenseNumber: "",
      vehicleRegistration: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      const res = await apiRequest("POST", "/api/onboarding/driver", {
        ...data,
        licenseDocumentUrl: licenseDocUrl,
        vehicleDocumentUrl: vehicleDocUrl,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Application submitted!", description: "We'll review it within 1-2 business days." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/driver-application"] });
    },
    onError: () => {
      toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" });
    },
  });

  if (appStatus?.application) {
    return <ApplicationStatusView application={appStatus.application} />;
  }

  const validateCurrentStep = async () => {
    if (currentStep === 1) {
      return form.trigger(["firstName", "lastName", "email", "phone", "address"]);
    }
    if (currentStep === 2) {
      return form.trigger(["licenseNumber", "vehicleRegistration"]);
    }
    return true;
  };

  const nextStep = async () => {
    const valid = await validateCurrentStep();
    if (valid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <GasliteLogo size="sm" />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" data-testid="text-driver-onboarding-title">Become a Gaslite Driver</h1>
          <p className="text-muted-foreground">
            Complete your application to start earning with flexible deliveries.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {steps.map(({ id, title, icon: Icon }) => (
            <div key={id} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep > id ? "bg-green-500 text-white" :
                currentStep === id ? "bg-primary text-white" :
                "bg-muted text-muted-foreground"
              }`}>
                {currentStep > id ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={`text-xs text-center ${currentStep === id ? "text-primary font-medium" : "text-muted-foreground"}`}>{title}</span>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <DollarSign className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">Earn R75-R120</p>
              <p className="text-[10px] text-muted-foreground">per delivery</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">Flexible Hours</p>
              <p className="text-[10px] text-muted-foreground">work when you want</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Truck className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">Use Your Vehicle</p>
              <p className="text-[10px] text-muted-foreground">be your own boss</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step {currentStep} of 3: {steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about yourself so we can verify your identity."}
              {currentStep === 2 && "We need your license and vehicle details for verification."}
              {currentStep === 3 && "Upload your documents to speed up the review process."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))}>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="firstName" placeholder="Sipho" className="pl-9" {...form.register("firstName")} data-testid="input-driver-firstname" />
                      </div>
                      {form.formState.errors.firstName && <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" placeholder="Ndlovu" {...form.register("lastName")} data-testid="input-driver-lastname" />
                      {form.formState.errors.lastName && <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="sipho@email.com" className="pl-9" {...form.register("email")} data-testid="input-driver-email" />
                    </div>
                    {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" type="tel" placeholder="082 123 4567" className="pl-9" {...form.register("phone")} data-testid="input-driver-phone" />
                    </div>
                    {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Home Address *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="address" placeholder="123 Main Road, Cape Town, 8001" className="pl-9" {...form.register("address")} data-testid="input-driver-address" />
                    </div>
                    {form.formState.errors.address && <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">Driver's License Number *</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="licenseNumber" placeholder="e.g. WC-DL-2024-12345" className="pl-9" {...form.register("licenseNumber")} data-testid="input-driver-license" />
                    </div>
                    {form.formState.errors.licenseNumber && <p className="text-sm text-destructive">{form.formState.errors.licenseNumber.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleRegistration">Vehicle Registration Number *</Label>
                    <div className="relative">
                      <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="vehicleRegistration" placeholder="e.g. CA 123-456" className="pl-9" {...form.register("vehicleRegistration")} data-testid="input-driver-vehicle" />
                    </div>
                    {form.formState.errors.vehicleRegistration && <p className="text-sm text-destructive">{form.formState.errors.vehicleRegistration.message}</p>}
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Make sure your license is valid and your vehicle is roadworthy. We'll verify these details during the review process.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Driver's License Photo/Scan</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      {licenseDocUrl ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">License uploaded</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <label className="cursor-pointer">
                            <span className="text-sm text-primary hover:underline font-medium">
                              {licenseUploading ? "Uploading..." : "Upload license document"}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,.pdf"
                              onChange={(e) => e.target.files?.[0] && uploadLicense(e.target.files[0])}
                              disabled={licenseUploading}
                              data-testid="input-driver-license-upload"
                            />
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Registration Document</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      {vehicleDocUrl ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">Document uploaded</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <label className="cursor-pointer">
                            <span className="text-sm text-primary hover:underline font-medium">
                              {vehicleUploading ? "Uploading..." : "Upload vehicle document"}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,.pdf"
                              onChange={(e) => e.target.files?.[0] && uploadVehicle(e.target.files[0])}
                              disabled={vehicleUploading}
                              data-testid="input-driver-vehicle-upload"
                            />
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Document uploads are optional but help speed up the review process. You can also submit without them.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 mt-6">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep} data-testid="button-prev-step">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep} data-testid="button-next-step">
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitMutation.isPending} data-testid="button-submit-driver-application">
                    {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                    {!submitMutation.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
