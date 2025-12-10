"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AppLogo } from '@/components/NeoUI';
import { 
  TrendingUp, 
  Bot, 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  CheckCircle,
  Zap,
  Shield,
  BarChart3,
  Wallet,
  Target,
  Clock,
  ChevronDown,
  Star,
  Play,
  Github,
  Twitter,
  Check,
  X,
  Crown,
  Users,
  Infinity as InfinityIcon
} from 'lucide-react';

const FloatingCoin = ({ delay = 0, x = 0, size = 40 }: { delay?: number; x?: number; size?: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%` }}
    initial={{ y: -100, opacity: 0, rotate: 0 }}
    animate={{ 
      y: [null, 800], 
      opacity: [0, 1, 1, 0],
      rotate: 360
    }}
    transition={{ 
      duration: 8,
      delay,
      repeat: Infinity,
      ease: "linear"
    }}
  >
    <div 
      className="rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 border-2 border-black shadow-neo-sm flex items-center justify-center font-black"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      $
    </div>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, description, color, delay }: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className="bg-white border-4 border-black shadow-neo p-6 relative group"
  >
    <div className={`w-14 h-14 ${color} border-2 border-black shadow-neo-sm flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform`}>
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-black uppercase mb-2">{title}</h3>
    <p className="text-gray-600 font-medium">{description}</p>
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <Sparkles className="w-5 h-5 text-brand-orange" />
    </div>
  </motion.div>
);

const StatCard = ({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    whileInView={{ scale: 1, opacity: 1 }}
    viewport={{ once: true }}
    className="text-center"
  >
    <div className="bg-white border-4 border-black shadow-neo p-6 inline-block mb-2">
      <Icon className="w-8 h-8 mx-auto mb-2 text-brand-orange" />
      <div className="text-4xl font-black">{value}</div>
    </div>
    <p className="font-bold text-gray-600 uppercase text-sm">{label}</p>
  </motion.div>
);

const TestimonialCard = ({ name, role, text, avatar }: { name: string; role: string; text: string; avatar: string }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className="bg-white border-4 border-black shadow-neo p-6 min-w-[300px] md:min-w-[400px]"
  >
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-gray-700 font-medium mb-4 italic">&ldquo;{text}&rdquo;</p>
    <div className="flex items-center gap-3">
      <img src={avatar} alt={name} className="w-12 h-12 rounded-full border-2 border-black" />
      <div>
        <div className="font-black">{name}</div>
        <div className="text-sm text-gray-500">{role}</div>
      </div>
    </div>
  </motion.div>
);

const PricingCard = ({ 
  name, 
  price, 
  period, 
  description, 
  features, 
  notIncluded,
  popular, 
  color,
  buttonText,
  delay
}: { 
  name: string; 
  price: string; 
  period: string;
  description: string;
  features: string[]; 
  notIncluded?: string[];
  popular?: boolean;
  color: string;
  buttonText: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`relative ${popular ? 'md:-mt-4 md:mb-4' : ''}`}
  >
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
        <span className="bg-brand-orange border-2 border-black shadow-neo-sm px-4 py-1 font-black text-sm uppercase flex items-center gap-1">
          <Crown className="w-4 h-4" /> Most Popular
        </span>
      </div>
    )}
    <div className={`bg-white border-4 ${popular ? 'border-brand-orange' : 'border-black'} shadow-neo p-6 h-full flex flex-col`}>
      <div className={`w-12 h-12 ${color} border-2 border-black shadow-neo-sm flex items-center justify-center mb-4`}>
        {name === 'Free' && <Zap className="w-6 h-6" />}
        {name === 'Pro' && <Star className="w-6 h-6" />}
        {name === 'Team' && <Users className="w-6 h-6" />}
      </div>
      
      <h3 className="text-2xl font-black uppercase mb-1">{name}</h3>
      <p className="text-gray-500 text-sm mb-4">{description}</p>
      
      <div className="mb-6">
        <span className="text-4xl font-black">{price}</span>
        <span className="text-gray-500 font-bold">/{period}</span>
      </div>
      
      <div className="flex-1 space-y-3 mb-6">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{feature}</span>
          </div>
        ))}
        {notIncluded?.map((feature, i) => (
          <div key={i} className="flex items-start gap-2 opacity-40">
            <X className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <span className="text-sm font-medium line-through">{feature}</span>
          </div>
        ))}
      </div>
      
      <Link href="/signup">
        <motion.button
          whileHover={{ x: -2, y: -2, boxShadow: '6px 6px 0px 0px #1D1D1D' }}
          whileTap={{ x: 2, y: 2, boxShadow: '0px 0px 0px 0px #000' }}
          className={`w-full ${popular ? 'bg-brand-orange' : 'bg-white'} border-2 border-black shadow-neo px-6 py-3 font-bold`}
        >
          {buttonText}
        </motion.button>
      </Link>
    </div>
  </motion.div>
);

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    { icon: Wallet, title: "Track Everything", description: "Monitor semua transaksi income & expense dengan mudah dan cepat.", color: "bg-brand-orange" },
    { icon: Bot, title: "AI Assistant", description: "Cukup ketik 'Makan siang 50rb' dan AI akan mencatatnya otomatis.", color: "bg-brand-accent" },
    { icon: Target, title: "Savings Goals", description: "Set target tabungan dan pantau progress menuju impianmu.", color: "bg-brand-green" },
    { icon: CreditCard, title: "Bill Kanban", description: "Kelola tagihan dengan drag-and-drop board yang intuitif.", color: "bg-yellow-300" },
    { icon: BarChart3, title: "Smart Analytics", description: "Visualisasi keuangan dengan charts yang beautiful.", color: "bg-blue-400" },
    { icon: Shield, title: "Multi-User", description: "Kolaborasi dengan partner atau keluarga dalam satu akun.", color: "bg-pink-400" },
  ];

  const testimonials = [
    { name: "Andi Pratama", role: "Freelancer", text: "Akhirnya nemu app yang ga ribet! AI-nya keren banget, tinggal ketik langsung ke-record.", avatar: "https://i.pravatar.cc/150?u=andi" },
    { name: "Sarah Dewi", role: "Entrepreneur", text: "Bill Kanban feature is a game changer! Ga pernah telat bayar tagihan lagi.", avatar: "https://i.pravatar.cc/150?u=sarah" },
    { name: "Budi Santoso", role: "Software Engineer", text: "Design brutalist-nya fresh banget. Beda dari app finance lain yang boring.", avatar: "https://i.pravatar.cc/150?u=budi" },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "Rp 0",
      period: "bulan",
      description: "Untuk personal use",
      features: [
        "Unlimited transactions",
        "Basic analytics dashboard",
        "1 savings goal",
        "Bill reminders",
        "Export CSV"
      ],
      notIncluded: [
        "AI Assistant",
        "Multi-user collaboration",
        "Priority support"
      ],
      color: "bg-gray-100",
      buttonText: "Start Free",
      popular: false
    },
    {
      name: "Pro",
      price: "Rp 49K",
      period: "bulan",
      description: "Untuk yang serius manage keuangan",
      features: [
        "Everything in Free",
        "Unlimited AI Assistant",
        "Unlimited savings goals",
        "Advanced analytics",
        "Debt tracking",
        "Budget alerts",
        "Priority support"
      ],
      color: "bg-brand-orange",
      buttonText: "Go Pro",
      popular: true
    },
    {
      name: "Team",
      price: "Rp 99K",
      period: "bulan",
      description: "Untuk keluarga atau tim kecil",
      features: [
        "Everything in Pro",
        "Up to 5 team members",
        "Shared wallets",
        "Role permissions",
        "Team analytics",
        "Activity logs",
        "Dedicated support"
      ],
      color: "bg-brand-accent",
      buttonText: "Start Team",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] overflow-hidden">
      {/* Floating Coins Background */}
      {mounted && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <FloatingCoin delay={0} x={10} size={30} />
          <FloatingCoin delay={2} x={25} size={40} />
          <FloatingCoin delay={4} x={45} size={25} />
          <FloatingCoin delay={1} x={65} size={35} />
          <FloatingCoin delay={3} x={80} size={28} />
          <FloatingCoin delay={5} x={90} size={32} />
        </div>
      )}

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b-4 border-black"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AppLogo className="w-12 h-12" />
            <span className="text-2xl font-black tracking-tighter">SAVERY</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="font-bold hover:text-brand-orange transition-colors">Features</a>
            <a href="#pricing" className="font-bold hover:text-brand-orange transition-colors">Pricing</a>
            <a href="#testimonials" className="font-bold hover:text-brand-orange transition-colors">Reviews</a>
          </div>

          <Link href="/login">
            <motion.button
              whileHover={{ x: -2, y: -2, boxShadow: '6px 6px 0px 0px #1D1D1D' }}
              whileTap={{ x: 2, y: 2, boxShadow: '0px 0px 0px 0px #000' }}
              className="bg-brand-orange border-2 border-black shadow-neo px-6 py-3 font-bold flex items-center gap-2"
            >
              Launch App <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6">
        <motion.div style={{ opacity }} className="absolute inset-0 pointer-events-none">
          <motion.div style={{ y: y1 }} className="absolute top-20 left-10">
            <div className="w-20 h-20 bg-brand-accent/20 border-2 border-brand-accent rotate-12" />
          </motion.div>
          <motion.div style={{ y: y2 }} className="absolute top-40 right-20">
            <div className="w-16 h-16 bg-brand-green/20 border-2 border-brand-green -rotate-12" />
          </motion.div>
          <motion.div style={{ y: y1 }} className="absolute bottom-40 left-1/4">
            <div className="w-12 h-12 bg-brand-orange/20 border-2 border-brand-orange rotate-45" />
          </motion.div>
        </motion.div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="inline-block mb-6"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="bg-brand-orange border-2 border-black shadow-neo-sm px-4 py-2 font-black text-sm uppercase">
                Money Management Made Fun
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-none mb-6">
              <span className="block">Manage Your</span>
              <span className="block text-brand-orange relative">
                Money
                <motion.span 
                  className="absolute -right-4 -top-4 text-2xl"
                  animate={{ rotate: [0, 20, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  💰
                </motion.span>
              </span>
              <span className="block">Like a Pro</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-2xl mx-auto mb-8">
              Track expenses, set savings goals, dan get AI-powered insights. 
              <span className="font-bold text-black"> Brutalist design </span> 
              yang bikin ngatur duit jadi seru!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-black text-white border-4 border-black px-8 py-4 font-black text-lg flex items-center gap-2 shadow-neo hover:bg-gray-900"
                >
                  <Play className="w-5 h-5" /> Start Free
                </motion.button>
              </Link>
              <a href="#pricing">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white border-4 border-black px-8 py-4 font-black text-lg flex items-center gap-2 shadow-neo hover:bg-gray-50"
                >
                  <Sparkles className="w-5 h-5" /> View Pricing
                </motion.button>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-16"
          >
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center text-gray-400"
            >
              <span className="text-sm font-bold uppercase mb-2">Scroll to explore</span>
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-black text-white relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 opacity-10"
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          style={{ 
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)',
            backgroundSize: '100% 100%'
          }}
        />
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="10K+" label="Active Users" icon={TrendingUp} />
            <StatCard value="50M+" label="Tracked (IDR)" icon={Wallet} />
            <StatCard value="99%" label="Happy Users" icon={Star} />
            <StatCard value="24/7" label="AI Assistant" icon={Bot} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="bg-brand-accent text-white border-2 border-black shadow-neo-sm px-4 py-2 font-black text-sm uppercase inline-block mb-4">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fitur lengkap untuk manage keuangan personal atau bareng tim
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-brand-orange/5 to-brand-accent/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="bg-brand-green border-2 border-black shadow-neo-sm px-4 py-2 font-black text-sm uppercase inline-block mb-4">
              Pricing
            </span>
            <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Pilih plan yang sesuai dengan kebutuhanmu. Upgrade atau downgrade kapan saja.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={plan.name} {...plan} delay={index * 0.1} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white border-2 border-black shadow-neo-sm px-6 py-3">
              <InfinityIcon className="w-5 h-5 text-brand-orange" />
              <span className="font-bold">Semua plan termasuk <span className="text-brand-orange">14 hari free trial</span></span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="bg-black text-white border-2 border-black px-4 py-2 font-black text-sm uppercase inline-block mb-4">
              How It Works
            </span>
            <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
              Simple as 1-2-3
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Sign Up", description: "Buat akun gratis dalam hitungan detik", icon: Zap },
              { step: "02", title: "Track", description: "Catat transaksi manual atau via AI assistant", icon: Clock },
              { step: "03", title: "Grow", description: "Lihat insight dan capai financial goals-mu", icon: TrendingUp },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white border-4 border-black shadow-neo p-8 text-center relative z-10">
                  <div className="text-6xl font-black text-brand-orange/20 absolute top-4 right-4">
                    {item.step}
                  </div>
                  <div className="w-16 h-16 bg-brand-orange border-2 border-black shadow-neo-sm flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black uppercase mb-2">{item.title}</h3>
                  <p className="text-gray-600 font-medium">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 z-20">
                    <ArrowRight className="w-8 h-8 text-brand-orange" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-24 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-gray-900 border-4 border-gray-700 shadow-neo-lg p-4 md:p-8 rounded-lg">
              <div className="bg-gradient-to-br from-orange-50 to-purple-50 border-2 border-black p-4 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Balance", value: "Rp 76.625.000", color: "bg-white" },
                    { label: "Net Worth", value: "Rp 61.500.000", color: "bg-brand-dark text-white" },
                    { label: "Income", value: "Rp 15.000.000", color: "bg-brand-accent" },
                    { label: "Expense", value: "Rp 3.875.000", color: "bg-brand-orange" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className={`${stat.color} border-2 border-black shadow-neo-sm p-4`}
                    >
                      <div className="text-xs font-bold uppercase opacity-70">{stat.label}</div>
                      <div className="text-lg md:text-xl font-black">{stat.value}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            
            <motion.div
              animate={{ rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-8 -right-8 bg-yellow-300 border-2 border-black shadow-neo px-4 py-2 font-black text-sm"
            >
              Live Preview!
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-brand-accent/10 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="bg-brand-orange border-2 border-black shadow-neo-sm px-4 py-2 font-black text-sm uppercase inline-block mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-black uppercase">
              What Users Say
            </h2>
          </motion.div>

          <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 snap-x">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-black text-white border-4 border-black shadow-neo-lg p-8 md:p-12 text-center relative overflow-hidden"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-20 -right-20 w-40 h-40 border-4 border-white/10 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-10 -left-10 w-32 h-32 border-4 border-white/10 rounded-full"
            />
            
            <div className="relative z-10">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                🚀
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black uppercase mb-4">
                Ready to Start?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-xl mx-auto">
                Join ribuan pengguna yang sudah manage keuangan mereka dengan SAVERY. Mulai gratis sekarang!
              </p>
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-brand-orange text-black border-4 border-brand-orange px-10 py-5 font-black text-xl inline-flex items-center gap-3"
                >
                  Launch App Now <ArrowRight className="w-6 h-6" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 px-6 border-t-4 border-brand-orange">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <AppLogo className="w-10 h-10" />
              <span className="text-xl font-black">SAVERY</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-brand-orange transition-colors">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-brand-orange transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
            
            <div className="text-sm text-gray-400">
              Made with 💰 by{' '}
              <a href="https://rsquareidea.my.id" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline font-bold">
                RSQUARE
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
