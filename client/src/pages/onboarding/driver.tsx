import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import { GasliteLogo } from "@/components/gaslite-logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Home,
  Landmark,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { insertDriverApplicationSchema, type DriverApplication } from "@shared/schema";

const SA_BANKS = [
  { name: "ABSA Bank", branchCode: "632005" },
  { name: "African Bank", branchCode: "430000" },
  { name: "Bidvest Bank", branchCode: "462005" },
  { name: "Capitec Bank", branchCode: "470010" },
  { name: "Discovery Bank", branchCode: "679000" },
  { name: "First National Bank (FNB)", branchCode: "250655" },
  { name: "Investec Bank", branchCode: "580105" },
  { name: "Nedbank", branchCode: "198765" },
  { name: "Standard Bank", branchCode: "051001" },
  { name: "TymeBank", branchCode: "678910" },
];

const ACCOUNT_TYPES = ["Cheque/Current", "Savings", "Transmission"];

const driverSchema = insertDriverApplicationSchema
  .pick({
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    address: true,
    licenseNumber: true,
    vehicleRegistration: true,
  })
  .extend({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid SA phone number required"),
    address: z.string().min(5, "Home address is required"),
    licenseNumber: z.string().min(5, "License number is required"),
    vehicleRegistration: z.string().min(3, "Vehicle registration is required"),
    bankName: z.string().min(1, "Please select your bank"),
    branchCode: z.string().min(1, "Branch code is required"),
    accountNumber: z.string().min(5, "Valid account number required").max(20, "Account number too long"),
    accountType: z.string().min(1, "Please select account type"),
  });

type DriverFormData = z.infer<typeof driverSchema>;

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "License & Vehicle", icon: Car },
  { id: 3, title: "Banking Details", icon: Landmark },
  { id: 4, title: "Documents", icon: FileText },
];

function ApplicationStatusView({ application }: { application: DriverApplication }) {
  const { logout } = useAuth();
  const statusConfig = {
    pending: {
      label: "Under Review",
      description: "Our team is reviewing your application. This typically takes 1-2 business days. You'll see an update here once a decision is made.",
    },
    approved: {
      label: "Approved",
      description: "Your application has been approved! You're now a registered Gaslite driver. Go online to start receiving delivery requests and earning money.",
    },
    rejected: {
      label: "Not Approved",
      description: "Unfortunately, your application was not approved at this time.",
    },
  };

  const status = statusConfig[application.status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <GasliteLogo size="sm" />
            <div className="flex items-center gap-3 flex-wrap">
              <ThemeToggle />
              <Button variant="ghost" size="sm" data-testid="button-logout" onClick={() => logout()}>Sign Out</Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-lg mx-auto px-4 py-12">
        <Card>
          <CardContent className="pt-8 pb-6 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              application.status === "approved" ? "bg-green-500/10" :
              application.status === "rejected" ? "bg-red-500/10" :
              "bg-yellow-500/10"
            }`}>
              {application.status === "approved" ? (
                <CheckCircle className="h-10 w-10 text-green-500" />
              ) : application.status === "rejected" ? (
                <Shield className="h-10 w-10 text-red-500" />
              ) : (
                <Clock className="h-10 w-10 text-yellow-500" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2" data-testid="text-application-status-title">Driver Application</h2>
            <Badge
              variant={application.status === "approved" ? "default" : application.status === "rejected" ? "destructive" : "secondary"}
              className="mb-4"
              data-testid="badge-application-status"
            >
              {status.label}
            </Badge>
            <p className="text-muted-foreground mb-6" data-testid="text-application-status-desc">{status.description}</p>
            <div className="text-left bg-muted/50 rounded-md p-4 space-y-2">
              <div className="flex justify-between gap-4 text-sm flex-wrap">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium" data-testid="text-app-name">{application.firstName} {application.lastName}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm flex-wrap">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium" data-testid="text-app-email">{application.email}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm flex-wrap">
                <span className="text-muted-foreground">License</span>
                <span className="font-medium" data-testid="text-app-license">{application.licenseNumber}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm flex-wrap">
                <span className="text-muted-foreground">Submitted</span>
                <span className="font-medium" data-testid="text-app-date">
                  {application.createdAt ? new Date(application.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                </span>
              </div>
              {application.reviewNotes && (
                <div className="flex justify-between gap-4 text-sm flex-wrap">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="font-medium" data-testid="text-app-review-notes">{application.reviewNotes}</span>
                </div>
              )}
            </div>
            {application.status === "approved" && (
              <div className="mt-6 space-y-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4 text-sm text-green-700 dark:text-green-400">
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <Truck className="h-4 w-4" />
                    You're ready to deliver!
                  </div>
                  <p>Go online on your dashboard to start receiving orders from customers near you. Earn money with every delivery.</p>
                </div>
                <a href="/">
                  <Button className="w-full" data-testid="button-start-delivering">
                    <Truck className="h-4 w-4 mr-2" />
                    Start Delivering
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              </div>
            )}
            {application.status === "rejected" && application.reviewNotes && (
              <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-md p-4 text-sm text-left">
                <span className="font-medium text-red-700 dark:text-red-400">Reason:</span>
                <p className="mt-1 text-muted-foreground">{application.reviewNotes}</p>
              </div>
            )}
            {application.status === "pending" && (
              <a href="/">
                <Button variant="outline" className="mt-6 w-full" data-testid="button-browse-as-customer">
                  <Home className="h-4 w-4 mr-2" />
                  Browse as Customer While You Wait
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function DriverOnboarding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [licenseDocUrl, setLicenseDocUrl] = useState<string | null>(null);
  const [vehicleDocUrl, setVehicleDocUrl] = useState<string | null>(null);

  const { data: appStatus, isLoading: appStatusLoading } = useQuery<{ application: DriverApplication | null; driver: any }>({
    queryKey: ["/api/user/driver-application"],
    refetchInterval: 15000,
  });

  const { uploadFile: uploadLicense, isUploading: licenseUploading } = useUpload({
    onSuccess: (response) => {
      setLicenseDocUrl(response.objectPath);
      toast({ title: "License document uploaded" });
    },
    onError: () => {
      toast({ title: "Upload failed", description: "Please try again or skip this step.", variant: "destructive" });
    },
  });

  const { uploadFile: uploadVehicle, isUploading: vehicleUploading } = useUpload({
    onSuccess: (response) => {
      setVehicleDocUrl(response.objectPath);
      toast({ title: "Vehicle document uploaded" });
    },
    onError: () => {
      toast({ title: "Upload failed", description: "Please try again or skip this step.", variant: "destructive" });
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
      bankName: "",
      branchCode: "",
      accountNumber: "",
      accountType: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      const res = await apiRequest("POST", "/api/onboarding/driver", {
        ...data,
        licenseDocumentUrl: licenseDocUrl,
        vehicleDocumentUrl: vehicleDocUrl,
        bankName: data.bankName,
        branchCode: data.branchCode,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
      });
      return res.json();
    },
    onSuccess: () => {
      localStorage.removeItem("gaslite_intent");
      toast({ title: "Application submitted!", description: "We'll review it within 1-2 business days." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/driver-application"] });
    },
    onError: (error: any) => {
      const msg = error?.message || "Please try again.";
      toast({ title: "Submission failed", description: msg, variant: "destructive" });
    },
  });

  if (appStatusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading your application...</p>
        </div>
      </div>
    );
  }

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
    if (currentStep === 3) {
      return form.trigger(["bankName", "branchCode", "accountNumber", "accountType"]);
    }
    return true;
  };

  const nextStep = async () => {
    const valid = await validateCurrentStep();
    if (valid && currentStep < 4) {
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
          <div className="flex items-center justify-between gap-4 h-16">
            <GasliteLogo size="sm" />
            <div className="flex items-center gap-3 flex-wrap">
              <ThemeToggle />
              <Button variant="ghost" size="sm" data-testid="button-logout" onClick={() => logout()}>Sign Out</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-driver-onboarding-title">Become a Gaslite Driver</h1>
          <p className="text-muted-foreground">
            Complete your application to start earning with flexible deliveries.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map(({ id, title, icon: Icon }, index) => (
            <div key={id} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep > id ? "bg-green-500 text-white" :
                  currentStep === id ? "bg-foreground text-background" :
                  "bg-muted text-muted-foreground"
                }`} data-testid={`step-indicator-${id}`}>
                  {currentStep > id ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-xs text-center ${currentStep === id ? "text-foreground font-medium" : "text-muted-foreground"}`}>{title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mb-5 transition-colors ${currentStep > id ? "bg-green-500" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="text-center p-3 rounded-md bg-muted/50" data-testid="benefit-earn">
            <DollarSign className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs font-medium">Earn R75-R120</p>
            <p className="text-[10px] text-muted-foreground">per delivery</p>
          </div>
          <div className="text-center p-3 rounded-md bg-muted/50" data-testid="benefit-hours">
            <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs font-medium">Flexible Hours</p>
            <p className="text-[10px] text-muted-foreground">work when you want</p>
          </div>
          <div className="text-center p-3 rounded-md bg-muted/50" data-testid="benefit-vehicle">
            <Truck className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xs font-medium">Use Your Vehicle</p>
            <p className="text-[10px] text-muted-foreground">be your own boss</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step {currentStep} of 4: {steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about yourself so we can verify your identity."}
              {currentStep === 2 && "We need your license and vehicle details for verification."}
              {currentStep === 3 && "Add your banking details for earnings settlement."}
              {currentStep === 4 && "Upload your documents to speed up the review process (optional)."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (currentStep < 4) {
                        nextStep();
                      }
                    }
                  }}
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Sipho" className="pl-9" {...field} data-testid="input-driver-firstname" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Ndlovu" {...field} data-testid="input-driver-lastname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input type="email" placeholder="sipho@email.com" className="pl-9" {...field} data-testid="input-driver-email" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input type="tel" placeholder="082 123 4567" className="pl-9" {...field} data-testid="input-driver-phone" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="123 Main Road, Cape Town, 8001" className="pl-9" {...field} data-testid="input-driver-address" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Driver's License Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="e.g. WC-DL-2024-12345" className="pl-9" {...field} data-testid="input-driver-license" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vehicleRegistration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Registration Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="e.g. CA 123-456" className="pl-9" {...field} data-testid="input-driver-vehicle" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="bg-muted/50 rounded-md p-4">
                      <p className="text-sm text-muted-foreground">
                        Make sure your license is valid and your vehicle is roadworthy. We'll verify these details during the review process.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <select
                                className="w-full h-9 pl-9 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  const bank = SA_BANKS.find(b => b.name === e.target.value);
                                  form.setValue("branchCode", bank ? bank.branchCode : "");
                                }}
                                data-testid="select-bank-name"
                              >
                                <option value="">Select your bank</option>
                                {SA_BANKS.map((bank) => (
                                  <option key={bank.name} value={bank.name}>{bank.name}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="branchCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Universal Branch Code</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Auto-filled from bank selection"
                                className="pl-9 bg-muted/50"
                                readOnly
                                {...field}
                                data-testid="input-branch-code"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Enter your account number"
                                className="pl-9"
                                {...field}
                                data-testid="input-account-number"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Type</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <select
                                className="w-full h-9 pl-9 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                                value={field.value}
                                onChange={field.onChange}
                                data-testid="select-account-type"
                              >
                                <option value="">Select account type</option>
                                {ACCOUNT_TYPES.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="bg-muted/50 rounded-md p-4">
                      <p className="text-sm text-muted-foreground">
                        Your banking details are used for earnings settlement. We use universal branch codes — no need to look yours up.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Driver's License Photo/Scan</p>
                      <div className="border-2 border-dashed border-border rounded-md p-6 text-center">
                        {licenseDocUrl ? (
                          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-medium" data-testid="text-license-uploaded">License uploaded</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <label className="cursor-pointer">
                              <span className="text-sm text-foreground hover:underline font-medium">
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
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF (max 10MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Vehicle Registration Document</p>
                      <div className="border-2 border-dashed border-border rounded-md p-6 text-center">
                        {vehicleDocUrl ? (
                          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-medium" data-testid="text-vehicle-uploaded">Document uploaded</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <label className="cursor-pointer">
                              <span className="text-sm text-foreground hover:underline font-medium">
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
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF (max 10MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-md p-4">
                      <p className="text-sm text-muted-foreground">
                        Document uploads are optional but help speed up the review. You can submit without them and upload later.
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

                  {currentStep < 4 ? (
                    <Button type="button" onClick={nextStep} data-testid="button-next-step">
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={submitMutation.isPending}
                      data-testid="button-submit-driver-application"
                      onClick={() => form.handleSubmit((data) => submitMutation.mutate(data))()}
                    >
                      {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                      {!submitMutation.isPending && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By submitting, you agree to Gaslite's Driver Terms and Background Check Policy.
        </p>
      </main>
    </div>
  );
}
