import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  Truck,
  Bell,
  Navigation,
  Package,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Flame,
  Clock,
  Shield,
  ChevronRight,
} from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Browse & Order",
    subtitle: "Choose your gas cylinder",
    description: "Pick from our range of LPG cylinders — 9kg, 19kg, or 48kg. Add to cart, enter your delivery address with Google Maps autocomplete, and place your order in seconds.",
    icon: ShoppingBag,
    accentFrom: "from-blue-500",
    accentTo: "to-cyan-400",
    features: [
      { icon: Flame, text: "3 cylinder sizes available" },
      { icon: MapPin, text: "Address autocomplete powered by Google" },
      { icon: CreditCard, text: "Secure card payment" },
    ],
    visual: (
      <div className="relative p-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          {[
            { name: "9kg Cylinder", price: "R233", size: "9kg" },
            { name: "19kg Cylinder", price: "R523", size: "19kg" },
            { name: "48kg Cylinder", price: "R1,316", size: "48kg" },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between bg-background rounded-md p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Flame className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-500">{item.price}</span>
                <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: 2,
    title: "Instant Matching",
    subtitle: "We find your nearest driver",
    description: "Your order is instantly broadcast to verified drivers within 10km. The closest available driver accepts and heads to the depot to collect your gas.",
    icon: Bell,
    accentFrom: "from-amber-500",
    accentTo: "to-orange-400",
    features: [
      { icon: Navigation, text: "GPS-based driver matching (10km radius)" },
      { icon: Bell, text: "Instant sound alert to nearby drivers" },
      { icon: Shield, text: "All drivers verified & background-checked" },
    ],
    visual: (
      <div className="relative p-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-500/10">
              Finding driver...
            </Badge>
            <span className="text-xs text-muted-foreground">Within 10km</span>
          </div>
          <div className="relative h-32 bg-background rounded-md overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-40" />
              </div>
              <svg className="absolute w-24 h-24 text-amber-300/30 dark:text-amber-500/20" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              </svg>
              <div className="absolute top-5 right-8 w-2 h-2 bg-blue-500 rounded-full" />
              <div className="absolute bottom-8 left-6 w-2 h-2 bg-blue-500 rounded-full" />
              <div className="absolute top-10 left-10 w-2 h-2 bg-blue-500 rounded-full opacity-60" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 bg-background rounded-md p-2.5">
            <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium">Driver found!</p>
              <p className="text-[10px] text-muted-foreground">2.3km away - ETA 8 min to depot</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: 3,
    title: "Live Tracking",
    subtitle: "Watch your delivery in real time",
    description: "Track your driver's live location on a map as they pick up your gas and drive to your door. See real-time status updates at every step.",
    icon: Navigation,
    accentFrom: "from-emerald-500",
    accentTo: "to-teal-400",
    features: [
      { icon: MapPin, text: "Live GPS tracking on interactive map" },
      { icon: Clock, text: "Real-time ETA updates" },
      { icon: Truck, text: "Status: picked up → on the way → delivered" },
    ],
    visual: (
      <div className="relative p-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-1 mb-3">
            {["Order Placed", "Assigned", "Picked Up", "On the Way", "Delivered"].map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${
                    i < 3 ? "bg-green-500 text-white" : i === 3 ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {i < 3 ? <CheckCircle className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className={`text-[8px] mt-0.5 text-center leading-tight ${i === 3 ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
                {i < 4 && <div className={`h-0.5 flex-1 mx-0.5 ${i < 3 ? "bg-green-500" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
          <div className="relative h-28 bg-background rounded-md overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute h-px bg-border" style={{ top: `${(i + 1) * 16}%`, left: 0, right: 0 }} />
              ))}
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute w-px bg-border" style={{ left: `${(i + 1) * 16}%`, top: 0, bottom: 0 }} />
              ))}
            </div>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
              <path d="M 30 70 Q 80 30, 130 50 T 170 35" fill="none" stroke="currentColor" className="text-emerald-400/40" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
            <div className="absolute" style={{ top: "28%", left: "78%" }}>
              <div className="relative">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-sm whitespace-nowrap font-medium">
                  Driver
                </div>
              </div>
            </div>
            <div className="absolute" style={{ top: "60%", left: "15%" }}>
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 bg-background rounded-md p-2.5">
            <Truck className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium">On the way</span>
            <span className="text-xs text-muted-foreground ml-auto">ETA ~12 min</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: 4,
    title: "Delivered!",
    subtitle: "Gas at your door",
    description: "Your driver arrives with your gas cylinder. Payment is handled securely by card — it's that simple.",
    icon: Package,
    accentFrom: "from-violet-500",
    accentTo: "to-purple-400",
    features: [
      { icon: Package, text: "SABS-certified cylinders delivered safely" },
      { icon: CreditCard, text: "Paid securely by card" },
      { icon: Clock, text: "Average delivery under 45 minutes" },
    ],
    visual: (
      <div className="relative p-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-green-500/20">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-semibold text-sm">Order Delivered!</h4>
            <p className="text-xs text-muted-foreground mt-1">19kg Gas Cylinder</p>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>38 min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                <span>R523 card</span>
              </div>
            </div>
            <div className="flex gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="w-5 h-5 text-amber-400">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Rate your delivery</p>
          </div>
        </div>
      </div>
    ),
  },
];

interface DemoWalkthroughProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoWalkthrough({ open, onOpenChange }: DemoWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setCurrentStep(0);
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden" data-testid="dialog-demo-walkthrough">
        <DialogTitle className="sr-only">How Gaslite Works</DialogTitle>

        <div className={`bg-gradient-to-br ${step.accentFrom} ${step.accentTo} p-4 pb-3`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Flame className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-white/90 text-sm font-medium">How Gaslite Works</span>
            </div>
            <div className="flex items-center gap-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                  }`}
                  data-testid={`button-step-dot-${i}`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step.visual}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-5 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.accentFrom} ${step.accentTo} flex items-center justify-center shadow-md`}>
                  <step.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Step {step.number} of {steps.length}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg leading-tight" data-testid={`text-step-title-${currentStep}`}>{step.title}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              <div className="space-y-2 pt-1">
                {step.features.map((feature) => (
                  <div key={feature.text} className="flex items-center gap-2.5 text-sm">
                    <feature.icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{feature.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              disabled={currentStep === 0}
              className="gap-1"
              data-testid="button-demo-prev"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                size="sm"
                onClick={goNext}
                className={`gap-1 bg-gradient-to-r ${step.accentFrom} ${step.accentTo} text-white border-0`}
                data-testid="button-demo-next"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <a href="/auth/signup" onClick={() => localStorage.setItem("gaslite_intent", "customer")}>
                <Button
                  size="sm"
                  className="gap-1 bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-0"
                  data-testid="button-demo-get-started"
                >
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
