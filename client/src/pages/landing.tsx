import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
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
import { SiInstagram, SiFacebook, SiTwitter } from "react-icons/si";

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
      className="relative w-32 h-48 mx-auto"
      animate={{ y: [0, -15, 0], rotateY: [0, 5, 0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 rounded-t-full rounded-b-lg shadow-2xl">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-b from-gray-300 to-gray-500 rounded-full shadow-inner" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-gradient-to-b from-gray-400 to-gray-600 rounded-t-md" />
        <div className="absolute bottom-8 left-4 right-4 h-20 bg-white/20 rounded-lg flex items-center justify-center">
          <Flame className="h-10 w-10 text-white" />
        </div>
        <div className="absolute bottom-2 left-4 right-4 text-center text-xs font-bold text-white/80">GasGo</div>
      </div>
      <motion.div 
        className="absolute -inset-4 bg-orange-500/20 rounded-full blur-2xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  );
}

function GlassmorphismOrderCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-white/5 backdrop-blur-xl rounded-2xl" />
        <div className="relative p-6 rounded-2xl border border-white/30 dark:border-white/10 shadow-2xl w-72">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Order Preview</p>
              <p className="text-xs text-muted-foreground">Live tracking</p>
            </div>
            <Badge className="ml-auto bg-green-500/20 text-green-600 text-xs">Active</Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">19kg Gas Cylinder</span>
              <span className="font-medium">R480</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Service Fee</span>
              <span className="font-medium">R25</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-primary">R505</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-orange-500/10 rounded-xl">
            <div className="flex items-center gap-2 text-sm">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Truck className="h-4 w-4 text-primary" />
              </motion.div>
              <span className="text-muted-foreground">Arriving in</span>
              <span className="font-semibold text-primary">~25 min</span>
            </div>
          </div>
        </div>
      </div>
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

  const products = [
    { size: "9kg", name: "Compact Cylinder", price: 280, popular: false, description: "Perfect for small households" },
    { size: "19kg", name: "Standard Cylinder", price: 480, popular: true, description: "Most popular for families" },
    { size: "48kg", name: "Commercial Cylinder", price: 950, popular: false, description: "Ideal for businesses" },
  ];

  const testimonials = [
    { name: "Sarah M.", location: "Johannesburg", rating: 5, text: "Incredibly fast delivery! Had gas within 30 minutes of ordering." },
    { name: "Thabo K.", location: "Pretoria", rating: 5, text: "The app is so easy to use. Best gas delivery service in SA!" },
    { name: "Priya N.", location: "Durban", rating: 5, text: "Reliable, safe, and affordable. Highly recommend GasGo!" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">GasGo</span>
            </motion.div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#drivers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Drive With Us</a>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <a href="/apply">
                <Button variant="ghost" size="sm" data-testid="link-become-driver">
                  Become a Driver
                </Button>
              </a>
              <a href="/api/login">
                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25" data-testid="button-login">
                  Sign In
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5" />
          <motion.div
            className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"
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
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-full">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">South Africa's #1 Gas Delivery</span>
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent">Gas Delivery</span>
                <br />
                <span className="text-foreground">in Minutes</span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                Order LPG gas cylinders with a tap. Fast, safe delivery by verified drivers within <span className="text-primary font-semibold">30-60 minutes</span>.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                <a href="/api/login">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/30 h-14 px-8 text-lg" data-testid="button-get-started">
                    Order Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg group" data-testid="button-watch-demo">
                  <Play className="mr-2 h-5 w-5 group-hover:text-primary transition-colors" />
                  Watch Demo
                </Button>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 border-2 border-background flex items-center justify-center text-white text-xs font-medium">
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
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-sm font-medium ml-1">4.9/5</span>
                </div>
              </motion.div>
            </motion.div>

            <div className="relative hidden lg:block">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-3xl blur-3xl" />
                <div className="relative bg-gradient-to-br from-card to-card/80 rounded-3xl p-12 border border-border/50 shadow-2xl">
                  <FloatingGasCylinder />
                  <div className="mt-8 text-center">
                    <h3 className="text-2xl font-bold mb-2">Quick & Safe</h3>
                    <p className="text-muted-foreground">Certified LPG delivery to your door</p>
                  </div>
                </div>
              </motion.div>
              <GlassmorphismOrderCard />
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
            <Badge className="mb-4 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20">How It Works</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Get Gas in <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">3 Simple Steps</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From order to delivery in under an hour. It's that simple.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-orange-500/20 via-orange-500 to-orange-500/20" />
            
            {[
              { step: 1, icon: Flame, title: "Choose Your Gas", desc: "Select from 9kg, 19kg, or 48kg cylinders", time: "~2 min" },
              { step: 2, icon: MapPin, title: "Set Location", desc: "We match you with nearby verified drivers", time: "~30 sec" },
              { step: 3, icon: Truck, title: "Track & Receive", desc: "Real-time tracking until it arrives", time: "Live" },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 border-border/50 bg-card/50 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="relative pt-8 pb-6 text-center">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {item.step}
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-20 h-20 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    >
                      <item.icon className="h-10 w-10 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground mb-4">{item.desc}</p>
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">{item.time}</Badge>
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
            <Badge className="mb-4 bg-orange-500/10 text-orange-600">Why GasGo</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Built for <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Trust & Speed</span></h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-2 row-span-2"
            >
              <Card className="h-full bg-gradient-to-br from-orange-500 to-amber-500 text-white border-0 overflow-hidden group">
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
                    <h3 className="text-3xl font-bold mb-4">30-60 Min Delivery</h3>
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
                <Card className="h-full hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 group border-border/50">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
            <Badge className="mb-4 bg-orange-500/10 text-orange-600">Pricing</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Choose Your <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Gas Size</span></h2>
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
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">Most Popular</Badge>
                  </div>
                )}
                <Card className={`h-full overflow-hidden transition-all duration-300 hover:shadow-2xl ${product.popular ? 'ring-2 ring-primary shadow-xl shadow-orange-500/20' : 'hover:shadow-orange-500/10'}`}>
                  <CardContent className="p-8 text-center">
                    <motion.div
                      whileHover={{ scale: 1.05, rotateY: 10 }}
                      className="w-24 h-32 mx-auto mb-6 relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 rounded-t-full rounded-b-lg shadow-xl">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-400 rounded-full" />
                        <div className="absolute bottom-4 left-2 right-2 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{product.size}</span>
                        </div>
                      </div>
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                    <div className="mb-6">
                      <span className="text-sm text-muted-foreground">From</span>
                      <div className="text-4xl font-bold text-primary">R{product.price}</div>
                    </div>
                    <Button className={`w-full ${product.popular ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600' : ''}`} variant={product.popular ? "default" : "outline"}>
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
            <Badge className="mb-4 bg-orange-500/10 text-orange-600">Testimonials</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold">Loved by <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Thousands</span></h2>
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
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-medium">
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
              <Badge className="mb-4 bg-orange-500/10 text-orange-600">Join Our Team</Badge>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Earn Money <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Your Way</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Become a GasGo driver and enjoy flexible hours, competitive earnings, and the freedom to be your own boss.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                {[
                  { icon: DollarSign, title: "Competitive Pay", desc: "Earn per delivery + tips" },
                  { icon: Clock, title: "Flexible Hours", desc: "Work when you want" },
                  { icon: TrendingUp, title: "Growth", desc: "Weekly bonuses available" },
                  { icon: Shield, title: "Support", desc: "24/7 driver support" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href="/apply">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25" data-testid="button-driver-apply">
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
                  <h3 className="text-xl font-bold mb-6">Earnings Calculator</h3>
                  <div className="space-y-6">
                    <div className="p-4 bg-orange-500/10 rounded-xl text-center">
                      <p className="text-sm text-muted-foreground mb-2">Estimated Weekly Earnings</p>
                      <div className="text-4xl font-bold text-primary">R3,500 - R7,000</div>
                      <p className="text-xs text-muted-foreground mt-2">Based on 20-40 deliveries per week</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">R75-R150</div>
                        <p className="text-xs text-muted-foreground">Per Delivery</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">Instant</div>
                        <p className="text-xs text-muted-foreground">Payouts</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-orange-500 to-amber-500 relative overflow-hidden">
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
            <p className="text-xl text-white/80 mb-8">Join thousands of satisfied customers who trust GasGo for their gas delivery needs.</p>
            <a href="/api/login">
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
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">GasGo</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-sm">
                South Africa's fastest and most reliable LPG gas delivery service. Order with confidence.
              </p>
              <div className="flex items-center gap-3">
                <Input placeholder="Enter your email" className="max-w-xs" data-testid="input-newsletter" />
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500" data-testid="button-subscribe">Subscribe</Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/apply" className="hover:text-foreground transition-colors">Become a Driver</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Safety</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>0800 GAS GO</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>hello@gasgo.co.za</span>
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
                  <SiTwitter className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} GasGo. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">SABS Approved</Badge>
              <Badge variant="outline" className="text-xs">SSL Secure</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
