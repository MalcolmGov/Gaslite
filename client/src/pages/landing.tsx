import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { DemoWalkthrough } from "@/components/demo-walkthrough";
import { img9kg, img19kg, img48kg, getProductImage } from "@/lib/product-images";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GasliteLogo, GasliteLogoIcon } from "@/components/gaslite-logo";
import { 
  Flame, 
  Truck, 
  Clock, 
  Shield, 
  MapPin, 
  CreditCard,
  Star,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  Users,
  Zap,
  Award,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Play,
  Sparkles
} from "lucide-react";
import { SiInstagram, SiFacebook, SiX } from "react-icons/si";


function AnimatedCounter({ target, duration = 2000, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function FloatingGasCylinder() {
  return (
    <motion.div
      className="relative w-36 h-52 mx-auto"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div 
        className="absolute -inset-6 bg-blue-500/30 rounded-full blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <img 
        src={img19kg} 
        alt="LPG Gas Cylinder" 
        className="relative w-full h-full object-contain drop-shadow-2xl rounded-xl"
      />
    </motion.div>
  );
}

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });
  const [demoOpen, setDemoOpen] = useState(false);

  const products = [
    { size: "9kg", name: "Compact Cylinder", price: 233, popular: false, description: "Perfect for small households" },
    { size: "19kg", name: "Standard Cylinder", price: 523, popular: true, description: "Most popular for families" },
    { size: "48kg", name: "Commercial Cylinder", price: 1316, popular: false, description: "Ideal for businesses" },
  ];

  const testimonials = [
    { name: "Sarah M.", location: "Johannesburg", rating: 5, text: "Incredibly fast delivery! The driver was at my door before I knew it." },
    { name: "Thabo K.", location: "Pretoria", rating: 5, text: "The app is so easy to use. Best gas delivery service in SA!" },
    { name: "Priya N.", location: "Durban", rating: 5, text: "Reliable, safe, and affordable. Highly recommend Gaslite!" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <GasliteLogo size="md" showTagline showFlame />
            </motion.div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#drivers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Drive With Us</a>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <a href="/auth/signup" onClick={() => localStorage.setItem("gaslite_intent", "driver")}>
                <Button variant="ghost" size="sm" data-testid="link-become-driver">
                  Become a Driver
                </Button>
              </a>
              <a href="/auth/signin">
                <Button variant="outline" size="sm" data-testid="button-signin">
                  Sign In
                </Button>
              </a>
              <a href="/auth/signup" onClick={() => localStorage.setItem("gaslite_intent", "customer")}>
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25" data-testid="button-signup">
                  Sign Up
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-400/5" />
          <motion.div
            className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], x: [0, -50, 0] }}
            transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="space-y-8"
              initial="initial"
              animate={heroInView ? "animate" : "initial"}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">South Africa's #1 Gas Delivery</span>
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 bg-clip-text text-transparent">Gas Delivery</span>
                <br />
                <span className="text-foreground">in Minutes</span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                Order LPG gas cylinders with a tap. <span className="text-primary font-semibold">Fast, safe delivery</span> by verified drivers straight to your door.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                <a href="/auth/signup" onClick={() => localStorage.setItem("gaslite_intent", "customer")}>
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 shadow-xl shadow-blue-500/30 h-14 px-8 text-lg" data-testid="button-get-started">
                    Order Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg group" data-testid="button-watch-demo" onClick={() => setDemoOpen(true)}>
                  <Play className="mr-2 h-5 w-5 group-hover:text-primary transition-colors" />
                  Watch Demo
                </Button>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-background flex items-center justify-center text-white text-xs font-medium">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-primary"><AnimatedCounter target={10000} suffix="+" /></span>
                    <span className="text-muted-foreground ml-1">happy customers</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-cyan-400 text-cyan-400" />
                  ))}
                  <span className="text-sm font-medium ml-1">4.9/5</span>
                </div>
              </motion.div>
            </motion.div>

            <div className="hidden lg:flex items-start gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-400/20 rounded-3xl blur-3xl" />
                <div className="relative bg-gradient-to-br from-card to-card/80 rounded-3xl p-10 border border-border/50 shadow-2xl">
                  <FloatingGasCylinder />
                  <div className="mt-6 text-center">
                    <h3 className="text-xl font-bold mb-1">Quick & Safe</h3>
                    <p className="text-muted-foreground text-sm">Certified LPG delivery</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-white/5 backdrop-blur-xl rounded-2xl" />
                  <div className="relative p-5 rounded-2xl border border-white/30 dark:border-white/10 shadow-2xl w-64">
                    <div className="flex items-center gap-3 mb-3">
                      <GasliteLogoIcon className="h-8 w-8" />
                      <div>
                        <p className="font-semibold text-sm">Order Preview</p>
                        <p className="text-xs text-muted-foreground">Live tracking</p>
                      </div>
                      <Badge className="ml-auto bg-green-500/20 text-green-600 text-xs">Active</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">19kg Gas Cylinder</span>
                        <span className="font-medium">R523</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span className="font-medium">R29</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Total</span>
                        <span className="font-bold text-primary">R552</span>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-blue-500/10 rounded-xl">
                      <div className="flex items-center gap-2 text-xs">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Truck className="h-3 w-3 text-primary" />
                        </motion.div>
                        <span className="text-muted-foreground">Arriving in</span>
                        <span className="font-semibold text-primary">~25 min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <motion.div 
              className="w-1 h-2 rounded-full bg-primary"
              animate={{ y: [0, 12, 0], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      <section id="how-it-works" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Badge className="mb-4 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">How It Works</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Get Gas in <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">3 Simple Steps</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From order to delivery in under an hour. It's that simple.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent rounded-full" />
            
            {[
              { step: 1, icon: Flame, title: "Choose Your Gas", desc: "Select from 9kg, 19kg, or 48kg cylinders", time: "~2s" },
              { step: 2, icon: CreditCard, title: "Pay Securely", desc: "Complete payment with card checkout", time: "Instant" },
              { step: 3, icon: Truck, title: "Track & Receive", desc: "Real-time tracking until it arrives", time: "Live" },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -8 }}
                className="relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-blue-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card className="relative overflow-visible group hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 border-2 border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-900 backdrop-blur-xl rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="relative pt-12 pb-8 px-6 text-center">
                    <motion.div 
                      className="absolute -top-5 left-1/2 -translate-x-1/2"
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full blur-md opacity-50" />
                        <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30 ring-4 ring-white dark:ring-gray-900">
                          {item.step}
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 3 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="relative w-20 h-20 mx-auto mb-6"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-400/20 rounded-2xl blur-lg" />
                      <div className="relative w-full h-full bg-gradient-to-br from-blue-500/10 to-cyan-400/10 dark:from-blue-500/20 dark:to-cyan-400/20 rounded-2xl flex items-center justify-center border border-blue-500/10">
                        <item.icon className="h-9 w-9 text-blue-500" />
                      </div>
                    </motion.div>
                    <h3 className="text-xl font-bold mb-3 text-black dark:text-white">{item.title}</h3>
                    <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed mb-5">{item.desc}</p>
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-4 py-1 font-semibold text-sm">{item.time}</Badge>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-blue-500/10 text-blue-600">Why Gaslite</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Built for <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">Trust & Speed</span></h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-2 row-span-2"
            >
              <Card className="h-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white border-0 overflow-hidden group">
                <CardContent className="p-8 h-full flex flex-col justify-between relative">
                  <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                  <div>
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6"
                    >
                      <Clock className="h-8 w-8" />
                    </motion.div>
                    <h3 className="text-3xl font-bold mb-4">Rapid Delivery</h3>
                    <p className="text-white/80 text-lg">Our drivers are strategically located across major cities for lightning-fast delivery.</p>
                  </div>
                  <div className="mt-8 flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold"><AnimatedCounter target={45} /></div>
                      <div className="text-white/70 text-sm">Avg. Minutes</div>
                    </div>
                    <div className="w-px h-12 bg-white/30" />
                    <div className="text-center">
                      <div className="text-4xl font-bold"><AnimatedCounter target={98} suffix="%" /></div>
                      <div className="text-white/70 text-sm">On-Time Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {[
              { icon: Shield, title: "Verified Drivers", value: "100%", desc: "Background checked" },
              { icon: Award, title: "Quality Gas", value: "SABS", desc: "Certified suppliers" },
              { icon: Users, title: "Customers", value: "10K+", desc: "Happy users" },
              { icon: Zap, title: "Instant Updates", value: "Real-time", desc: "Track every step" },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group border-border/50">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-cyan-400/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">{item.value}</div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-blue-500/10 text-blue-600">Pricing</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Choose Your <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">Gas Size</span></h2>
            <p className="text-lg text-muted-foreground">Transparent pricing. No hidden fees.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {products.map((product, index) => (
              <motion.div
                key={product.size}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {product.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg">Most Popular</Badge>
                  </div>
                )}
                <Card className={`h-full overflow-hidden transition-all duration-300 hover:shadow-2xl ${product.popular ? 'ring-2 ring-primary shadow-xl shadow-blue-500/20' : 'hover:shadow-blue-500/10'}`}>
                  <CardContent className="p-8 text-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="mx-auto mb-6 flex items-center justify-center p-4"
                      style={{ height: "180px" }}
                    >
                      <img
                        src={getProductImage(product.size) || ""}
                        alt={`${product.size} Gas Cylinder`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                    <div className="mb-6">
                      <span className="text-sm text-muted-foreground">From</span>
                      <div className="text-4xl font-bold text-primary">R{product.price}</div>
                    </div>
                    <Button className={`w-full ${product.popular ? 'bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500' : ''}`} variant={product.popular ? "default" : "outline"}>
                      Order Now
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-blue-500/10 text-blue-600">Testimonials</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold">Loved by <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">Thousands</span></h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-cyan-400 text-cyan-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-medium">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="drivers" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-blue-500/10 text-blue-600">Join Our Team</Badge>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Earn Money <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">Your Way</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Become a Gaslite driver and enjoy flexible hours, competitive pay, and the freedom to be your own boss.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                {[
                  { icon: DollarSign, title: "Competitive Pay", desc: "Earn per delivery + tips" },
                  { icon: Clock, title: "Flexible Hours", desc: "Work when you want" },
                  { icon: TrendingUp, title: "Growth", desc: "Weekly bonuses available" },
                  { icon: Shield, title: "Support", desc: "24/7 driver support" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-cyan-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href="/auth/signup" onClick={() => localStorage.setItem("gaslite_intent", "driver")}>
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 shadow-lg shadow-blue-500/25" data-testid="button-driver-apply">
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6">Why Drive With Us</h3>
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-500/10 rounded-xl text-center">
                      <p className="text-sm text-muted-foreground mb-2">Flexible Delivery Schedule</p>
                      <div className="text-4xl font-bold text-primary">Your Hours</div>
                      <p className="text-xs text-muted-foreground mt-2">Work when it suits you</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">10km</div>
                        <p className="text-xs text-muted-foreground">Delivery Radius</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">24/7</div>
                        <p className="text-xs text-muted-foreground">Support</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-cyan-500/20" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row items-center justify-between gap-12"
          >
            <div className="text-center lg:text-left flex-1">
              <Badge className="mb-4 bg-white/10 text-white border-white/20">Download App</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Get Gaslite on Your Phone
              </h2>
              <p className="text-lg text-gray-300 mb-6 max-w-md">
                Scan the QR code to install our app directly on your device. No app store needed - instant access to gas delivery.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-gray-400">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Works on iOS & Android</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>No download required</span>
                </div>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-3xl blur-xl opacity-30" />
              <div className="relative bg-white p-6 rounded-2xl shadow-2xl">
                <div className="w-48 h-48 rounded-xl flex items-center justify-center">
                  <QRCodeSVG
                    value={window.location.origin}
                    size={180}
                    level="M"
                    includeMargin={false}
                    imageSettings={{
                      src: "",
                      height: 0,
                      width: 0,
                      excavate: false,
                    }}
                  />
                </div>
                <p className="text-center text-gray-600 text-sm mt-3 font-medium">Scan to install</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-500 to-cyan-400 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to Order?</h2>
            <p className="text-xl text-white/80 mb-8">Join thousands of satisfied customers who trust Gaslite for their gas delivery needs.</p>
            <a href="/auth/signup" onClick={() => localStorage.setItem("gaslite_intent", "customer")}>
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg shadow-xl" data-testid="button-cta-order">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      <footer className="bg-card py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="mb-4">
                <GasliteLogo size="lg" showTagline showFlame />
              </div>
              <p className="text-muted-foreground mb-6 max-w-sm">
                South Africa's fastest and most reliable LPG gas delivery service. Order with confidence.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/auth/signup" onClick={() => localStorage.setItem("gaslite_intent", "driver")} className="hover:text-foreground transition-colors">Become a Driver</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Safety</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>0800 GASLITE</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>support@gaslite.co.za</span>
                </li>
              </ul>
              <div className="flex items-center gap-3 mt-6">
                <Button variant="ghost" size="icon" className="hover:text-primary">
                  <SiFacebook className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:text-primary">
                  <SiInstagram className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:text-primary">
                  <SiX className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Gaslite. All rights reserved.</p>
            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              <a href="/legal/terms" className="hover:text-foreground transition-colors" data-testid="link-terms">Terms of Service</a>
              <a href="/legal/privacy" className="hover:text-foreground transition-colors" data-testid="link-privacy">Privacy Policy</a>
              <a href="/legal/refund" className="hover:text-foreground transition-colors" data-testid="link-refund">Refund Policy</a>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">SABS Approved</Badge>
              <Badge variant="outline" className="text-xs">SSL Secure</Badge>
            </div>
          </div>
          <div className="text-center mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <a
                href="https://www.movedigital.africa"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                data-testid="link-move-digital"
              >
                Move Digital
              </a>
            </p>
          </div>
        </div>
      </footer>

      <DemoWalkthrough open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
}
