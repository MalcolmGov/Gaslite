import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GasliteLogo } from "@/components/gaslite-logo";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUpload } from "@/hooks/use-upload";
import { 
  Upload, 
  CheckCircle, 
  Truck, 
  DollarSign, 
  Clock,
  FileText,
  ArrowLeft
} from "lucide-react";

const applicationSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  licenseNumber: z.string().min(5, "License number is required"),
  vehicleRegistration: z.string().min(3, "Vehicle registration is required"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function ApplyPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [licenseDocUrl, setLicenseDocUrl] = useState<string | null>(null);
  const [vehicleDocUrl, setVehicleDocUrl] = useState<string | null>(null);

  const { uploadFile, isUploading: licenseUploading } = useUpload({
    onSuccess: (response) => {
      setLicenseDocUrl(response.objectPath);
      toast({ title: "License uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to upload license", variant: "destructive" });
    },
  });

  const { uploadFile: uploadVehicleDoc, isUploading: vehicleUploading } = useUpload({
    onSuccess: (response) => {
      setVehicleDocUrl(response.objectPath);
      toast({ title: "Vehicle document uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to upload document", variant: "destructive" });
    },
  });

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      licenseNumber: "",
      vehicleRegistration: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      return apiRequest("POST", "/api/driver-applications", {
        ...data,
        licenseDocumentUrl: licenseDocUrl,
        vehicleDocumentUrl: vehicleDocUrl,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit application. Please try again.", variant: "destructive" });
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    submitMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for applying to become a Gaslite driver. We will review your application and get back to you within 2-3 business days.
            </p>
            <a href="/">
              <Button variant="outline" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="/">
              <GasliteLogo size="sm" showFlame />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Become a <span className="text-primary">Gaslite Driver</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our team of licensed delivery drivers and earn flexible income delivering gas to customers in your area.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Competitive Pay</h3>
              <p className="text-sm text-muted-foreground">Earn per delivery plus tips</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Flexible Hours</h3>
              <p className="text-sm text-muted-foreground">Work when it suits you</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Use Your Vehicle</h3>
              <p className="text-sm text-muted-foreground">Be your own boss</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Driver Application Form</CardTitle>
            <CardDescription>
              Please fill out all required fields and upload your documents for verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...form.register("firstName")}
                    data-testid="input-first-name"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...form.register("lastName")}
                    data-testid="input-last-name"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    {...form.register("email")}
                    data-testid="input-email"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0821234567"
                    {...form.register("phone")}
                    data-testid="input-phone"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Home Address *</Label>
                <Textarea
                  id="address"
                  placeholder="123 Main Street, City, Province"
                  {...form.register("address")}
                  data-testid="input-address"
                />
                {form.formState.errors.address && (
                  <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Driver's License Number *</Label>
                  <Input
                    id="licenseNumber"
                    placeholder="License number"
                    {...form.register("licenseNumber")}
                    data-testid="input-license"
                  />
                  {form.formState.errors.licenseNumber && (
                    <p className="text-sm text-destructive">{form.formState.errors.licenseNumber.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleRegistration">Vehicle Registration *</Label>
                  <Input
                    id="vehicleRegistration"
                    placeholder="ABC 123 GP"
                    {...form.register("vehicleRegistration")}
                    data-testid="input-vehicle-reg"
                  />
                  {form.formState.errors.vehicleRegistration && (
                    <p className="text-sm text-destructive">{form.formState.errors.vehicleRegistration.message}</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Driver's License Document</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {licenseDocUrl ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm">License uploaded</span>
                      </div>
                    ) : (
                      <>
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <label className="cursor-pointer">
                          <span className="text-sm text-primary hover:underline">
                            {licenseUploading ? "Uploading..." : "Upload license document"}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                            disabled={licenseUploading}
                            data-testid="input-license-upload"
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Registration Document</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {vehicleDocUrl ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm">Document uploaded</span>
                      </div>
                    ) : (
                      <>
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <label className="cursor-pointer">
                          <span className="text-sm text-primary hover:underline">
                            {vehicleUploading ? "Uploading..." : "Upload vehicle document"}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={(e) => e.target.files?.[0] && uploadVehicleDoc(e.target.files[0])}
                            disabled={vehicleUploading}
                            data-testid="input-vehicle-upload"
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitMutation.isPending}
                data-testid="button-submit-application"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
