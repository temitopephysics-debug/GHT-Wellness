import React, { useState, useEffect } from "react";
import { 
  Activity, 
  BookOpen, 
  ShoppingBag, 
  User, 
  Search, 
  ChevronRight, 
  Stethoscope, 
  Phone, 
  CheckCircle2,
  Database as DbIcon,
  ShieldCheck,
  Globe,
  Award,
  Menu,
  X,
  Star,
  Eye,
  Leaf,
  ArrowLeft,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CONFIG } from "./config";

import { PackageCard } from "./components/PackageCard";
import { Product, PackageData } from "./types";

interface Blog {
  id: string;
  title: string;
  content: string;
  tags: string[];
  image_url: string;
}

interface Consultation {
  id: string;
  patient_name: string;
  phone: string;
  illness: string;
  symptoms: string;
  ai_recommendation: string;
  recommended_products: string[];
  created_at: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"products" | "recommended" | "blogs" | "consultation" | "history" | "product-detail">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedPackages, setRecommendedPackages] = useState<PackageData[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Robust Session Management (Anonymous RLS)
  const [accessToken] = useState(() => {
    const existing = localStorage.getItem("ght_access_token");
    if (existing) return existing;
    const newToken = crypto.randomUUID();
    localStorage.setItem("ght_access_token", newToken);
    return newToken;
  });

  // Form State - No hardcoding
  const [formData, setFormData] = useState({
    patient_name: "",
    phone: "",
    illness: "",
    symptoms: "",
    distributor_id: CONFIG.defaults.distributorId
  });

  useEffect(() => {
    fetchProducts();
    fetchBlogs();
    fetchRecommendedPackages();
    if (activeTab === "history") fetchHistory();
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("Rate exceeded")) {
          console.warn("Rate limit exceeded for products, retrying in 2s...");
          setTimeout(fetchProducts, 2000);
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("Products data is not an array:", data);
        setProducts([]);
      }
    } catch (e) {
      console.error("Failed to fetch products:", e);
      setProducts([]);
    }
  };

  const fetchBlogs = async () => {
    try {
      const res = await fetch("/api/blogs");
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("Rate exceeded")) {
          console.warn("Rate limit exceeded for blogs, retrying in 2s...");
          setTimeout(fetchBlogs, 2000);
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setBlogs(data);
      } else {
        console.error("Blogs data is not an array:", data);
        setBlogs([]);
      }
    } catch (e) {
      console.error("Failed to fetch blogs:", e);
      setBlogs([]);
    }
  };

  const fetchRecommendedPackages = async () => {
    try {
      const res = await fetch("/api/recommended-packages");
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("Rate exceeded")) {
          console.warn("Rate limit exceeded for packages, retrying in 2s...");
          setTimeout(fetchRecommendedPackages, 2000);
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecommendedPackages(data);
      } else {
        setRecommendedPackages([]);
      }
    } catch (e) {
      console.error("Failed to fetch recommended packages:", e);
      setRecommendedPackages([]);
    }
  };

  const handleConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-access-token": accessToken
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert(`Consultation Submitted!\n\nAI Recommendation: ${data.ai_recommendation}`);
        setFormData({ ...formData, patient_name: "", phone: "", illness: "", symptoms: "" });
        setActiveTab("history");
      }
    } catch (e) {
      alert("Failed to submit consultation. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/my-consultations", {
        headers: { "x-access-token": accessToken }
      });
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("Rate exceeded")) {
          console.warn("Rate limit exceeded for history, retrying in 2s...");
          setTimeout(fetchHistory, 2000);
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setConsultations(data);
      } else {
        setConsultations([]);
      }
    } catch (e) {
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            {CONFIG.company.logoUrl ? (
              <img 
                src={CONFIG.company.logoUrl} 
                alt={CONFIG.company.name} 
                className="h-8 md:h-12 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg">
                <Activity size={18} className="md:hidden" />
                <Activity size={24} className="hidden md:block" />
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="font-bold text-sm md:text-xl tracking-tight text-slate-800 leading-none">{CONFIG.company.name}</h1>
              <p className="text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] font-semibold text-emerald-600 mt-0.5">{CONFIG.company.subtitle}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {CONFIG.navigation.map((item) => {
              const Icon = item.id === "products" ? ShoppingBag : 
                           item.id === "blogs" ? BookOpen : 
                           item.id === "consultation" ? Stethoscope : User;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    activeTab === item.id ? "text-emerald-600" : "text-slate-500 hover:text-emerald-500"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors hidden sm:block">
              <Search size={20} />
            </button>
            <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-1 md:mx-2"></div>
            <div className="hidden xs:flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] md:text-xs font-bold border border-emerald-100">
              <ShieldCheck size={12} className="md:hidden" />
              <ShieldCheck size={14} className="hidden md:block" />
              <span className="whitespace-nowrap">RLS SECURE</span>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {CONFIG.navigation.map((item) => {
                  const Icon = item.id === "products" ? ShoppingBag : 
                               item.id === "blogs" ? BookOpen : 
                               item.id === "consultation" ? Stethoscope : User;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-4 w-full p-4 rounded-2xl text-base font-bold transition-all ${
                        activeTab === item.id 
                          ? "bg-emerald-50 text-emerald-700" 
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon size={22} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 md:space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Premium Health Products</h2>
                  <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-base">Scientifically formulated supplements for your wellness journey.</p>
                </div>
                
                <div className="relative w-full md:w-96 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={20} className="text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search name, benefit, or ailment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4 gap-3 md:gap-8">
                {products
                  .filter((p) => {
                    const query = searchQuery.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(query) ||
                      p.short_desc.toLowerCase().includes(query) ||
                      p.health_benefits.some((b) => b.toLowerCase().includes(query))
                    );
                  })
                  .map((product) => (
                    <div 
                      key={product.id} 
                      className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl md:rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 group relative"
                    >
                    {/* Urgency Badge - Top Center */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white px-4 py-1 rounded-b-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-bounce">
                      Limited Stock - Get it Today
                    </div>

                    {/* Image Section - Optimized Aspect Ratio */}
                    <div className="relative aspect-[2/1] bg-slate-50/30 flex items-center justify-center overflow-hidden border-b border-slate-100">
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-150 transition-transform duration-700 p-4 mix-blend-multiply cursor-zoom-in group-hover:drop-shadow-2xl"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Logo Overlay - Top Left - Increased Size */}
                      <div className="absolute top-2 left-2 md:top-3 md:left-3 z-10">
                        {CONFIG.company.logoUrl ? (
                          <img 
                            src={CONFIG.company.logoUrl} 
                            alt="Logo" 
                            className="h-8 md:h-12 w-auto object-contain drop-shadow-md"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-md">
                            <Activity size={18} className="md:size-6" />
                          </div>
                        )}
                      </div>

                      {/* Quality Stamp - Bottom Right Overlay */}
                      <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 z-10">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-emerald-600/30 flex items-center justify-center bg-white/40 backdrop-blur-sm rotate-12 group-hover:rotate-0 transition-transform duration-500">
                          <div className="text-[6px] md:text-[7px] font-black text-emerald-700 text-center leading-tight uppercase">
                            100%<br/>Purely<br/>Herbal
                          </div>
                        </div>
                      </div>

                      {/* Floating Badges - Top Right */}
                      <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 flex flex-col items-end gap-1 md:gap-1.5">
                        <div className="bg-white/95 backdrop-blur-sm text-slate-900 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-wider border border-slate-200 shadow-md">
                          {product.product_code}
                        </div>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-emerald-600/95 backdrop-blur-sm text-white rounded-md md:rounded-lg text-[8px] md:text-[9px] font-black border border-emerald-500 shadow-md">
                          <Globe size={10} className="md:size-3" />
                          <span>Free Shipping</span>
                        </div>
                      </div>

                      {/* Trust Badges - Bottom Left Overlay */}
                      <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
                        <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200 shadow-sm" title="100% Organic">
                          <Leaf size={14} className="text-emerald-600" />
                        </div>
                        <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200 shadow-sm" title="Tested & Trusted">
                          <ShieldCheck size={14} className="text-blue-600" />
                        </div>
                        <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200 shadow-sm" title="Purely Herbal">
                          <Activity size={14} className="text-orange-600" />
                        </div>
                      </div>

                      {/* Quick View Button Overlay - Responsive & Stable */}
                      <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                        <button 
                          onClick={() => setSelectedProduct(product)}
                          className="bg-white text-slate-900 px-8 py-3 rounded-full font-black text-sm shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-emerald-600 hover:text-white active:scale-95"
                        >
                          Quick View
                        </button>
                      </div>
                    </div>

                    {/* Content Section - Compact & Symmetric */}
                    <div className="p-2 md:p-3 flex flex-col flex-grow space-y-1.5 md:space-y-2">
                      <div className="min-h-[70px] md:min-h-[80px]">
                        <h3 className="text-xl font-black text-slate-900 leading-tight line-clamp-1 hover:text-emerald-700 cursor-pointer mb-0.5">
                          {product.name}
                        </h3>
                        <p className="text-base text-slate-600 line-clamp-2 leading-relaxed font-medium">
                          {product.short_desc}
                        </p>
                      </div>
                      
                      {/* Ratings & Trust Info */}
                      <div className="flex items-center justify-between gap-1 bg-slate-50 p-1 md:p-1.5 rounded-lg md:rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1 md:gap-1.5">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} className="fill-orange-400 text-orange-400 md:size-3" />
                            ))}
                          </div>
                          <span className="text-[8px] md:text-[9px] text-slate-500 font-black">10k+ Sold</span>
                        </div>
                        <div className="hidden xs:flex items-center gap-1 text-[8px] font-black text-emerald-700 uppercase tracking-widest">
                          <Award size={8} className="md:size-2.5" />
                          Organic
                        </div>
                      </div>

                      {/* Health Benefits - Compact List */}
                      <div className="space-y-1 py-0.5 min-h-[40px] md:min-h-[50px]">
                        {product.health_benefits.slice(0, 2).map((benefit, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-sm text-slate-700 font-bold">
                            <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0 mt-0.5 md:size-4" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                        {product.health_benefits.length > 2 && (
                          <button 
                            onClick={() => setSelectedProduct(product)}
                            className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 hover:text-emerald-800 transition-colors flex items-center gap-1 group/btn"
                          >
                            <span className="animate-pulse">+ {product.health_benefits.length - 2} Benefits</span>
                            <ChevronRight size={8} className="md:size-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </div>

                      {/* Price Section - Optimized Spacing */}
                      <div className="pt-1.5 border-t border-slate-100 mt-auto">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-baseline gap-1 flex-wrap">
                              <span className="text-2xl font-black text-slate-900">
                                ₦{(product.price_naira * (1 - product.discount_percent / 100)).toLocaleString()}
                              </span>
                              {product.discount_percent > 0 && (
                                <span className="text-sm text-slate-400 line-through font-bold">
                                  ₦{product.price_naira.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <div className="text-[8px] md:text-[9px] font-black text-red-600 uppercase tracking-tighter mb-0.5">
                                Only 5 Left!
                              </div>
                              <div className="w-12 md:w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 w-[85%] rounded-full" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button - Refined Size */}
                      <div className="pt-0.5 flex flex-col items-center gap-1">
                        <button className="w-full bg-emerald-600 text-white py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-base hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] flex items-center justify-center gap-1 md:gap-2 group/order animate-shimmer">
                          Order
                          <ChevronRight size={14} className="md:size-4 group-hover/order:translate-x-1 transition-transform" />
                        </button>
                        <div className="flex items-center gap-1 text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          <CheckCircle2 size={8} className="md:size-2.5 text-emerald-600" />
                          Pay on Delivery
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {products.filter((p) => {
                  const query = searchQuery.toLowerCase();
                  return (
                    p.name.toLowerCase().includes(query) ||
                    p.short_desc.toLowerCase().includes(query) ||
                    p.health_benefits.some((b) => b.toLowerCase().includes(query))
                  );
                }).length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
                      <Search size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">No products found</h3>
                    <p className="text-slate-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="mt-6 text-emerald-600 font-bold hover:text-emerald-700 underline underline-offset-4"
                    >
                      Clear all search
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "recommended" && (
            <motion.div
              key="recommended"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 pb-20"
            >
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">Expert-Curated Solutions</h2>
                <p className="text-lg text-slate-600 font-medium leading-relaxed">
                  Discover powerful combinations designed to target specific health concerns with maximum synergy.
                </p>
              </div>

              <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 min-[1440px]:grid-cols-4 gap-8 md:gap-10">
                {recommendedPackages.map((pkg) => (
                  <PackageCard 
                    key={pkg.id}
                    data={pkg}
                    allPackages={recommendedPackages}
                    onViewProduct={(product) => {
                      setViewingProduct(product);
                      setActiveTab("product-detail");
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                ))}
                {recommendedPackages.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-slate-500">No recommended packages found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "product-detail" && viewingProduct && (
            <motion.div
              key="product-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 pb-20"
            >
              {/* Breadcrumbs / Back Button */}
              <button 
                onClick={() => setActiveTab("products")}
                className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-bold transition-colors group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Products
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left: Image Gallery Style */}
                <div className="space-y-6">
                  <div className="bg-white rounded-[40px] p-8 md:p-16 border border-slate-100 shadow-sm flex items-center justify-center aspect-square relative overflow-hidden group">
                    <img 
                      src={viewingProduct.image_url} 
                      alt={viewingProduct.name}
                      className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-8 right-8 bg-red-600 text-white px-4 py-2 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl animate-pulse">
                      -{viewingProduct.discount_percent}% OFF
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="aspect-square bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <img 
                          src={viewingProduct.image_url} 
                          alt="Thumbnail" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Product Info */}
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                        {viewingProduct.product_code}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                        In Stock
                      </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-4">
                      {viewingProduct.name}
                    </h1>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={20} className="fill-orange-400 text-orange-400" />
                        ))}
                      </div>
                      <span className="text-slate-500 font-bold">(4.9/5 based on 2,450 reviews)</span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-black text-slate-900">
                      ₦{(viewingProduct.price_naira * (1 - viewingProduct.discount_percent / 100)).toLocaleString()}
                    </span>
                    {viewingProduct.discount_percent > 0 && (
                      <span className="text-2xl text-slate-400 line-through font-bold">
                        ₦{viewingProduct.price_naira.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <p className="text-xl text-slate-600 leading-relaxed font-medium">
                    {viewingProduct.short_desc}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 active:scale-[0.98] flex items-center justify-center gap-3">
                      <ShoppingBag size={24} />
                      Add to Cart
                    </button>
                    <button className="flex-1 bg-white border-2 border-slate-200 text-slate-900 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                      <Phone size={24} />
                      Order via WhatsApp
                    </button>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    {[
                      { icon: ShieldCheck, label: "NAFDAC Reg.", color: "text-blue-600" },
                      { icon: Leaf, label: "100% Herbal", color: "text-emerald-600" },
                      { icon: Award, label: "Premium Quality", color: "text-orange-600" },
                      { icon: Globe, label: "Free Shipping", color: "text-purple-600" }
                    ].map((badge, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 text-center">
                        <badge.icon size={24} className={badge.color} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Details Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t border-slate-200">
                <div className="lg:col-span-2 space-y-12">
                  <section className="space-y-4">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Full Description</h3>
                    <div className="prose prose-slate max-w-none">
                      <p className="text-lg text-slate-700 leading-relaxed">
                        {viewingProduct.long_desc || "No detailed description available for this product yet. Please contact our support for more information."}
                      </p>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Health Benefits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingProduct.health_benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2 size={24} className="text-emerald-600" />
                          </div>
                          <span className="text-lg font-bold text-slate-800 leading-tight">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Usage & Dosage</h3>
                      <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                        <p className="text-slate-700 font-medium leading-relaxed">
                          {viewingProduct.usage || "Follow the instructions on the product packaging or consult with our health experts."}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Safety Warnings</h3>
                      <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100">
                        <p className="text-slate-700 font-medium leading-relaxed">
                          {viewingProduct.warning || "Keep out of reach of children. Consult your doctor if pregnant or nursing."}
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl space-y-6">
                    <h3 className="text-xl font-black uppercase tracking-widest">Product Specs</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between py-3 border-b border-slate-800">
                        <span className="text-slate-400 font-bold">Product Code</span>
                        <span className="font-black">{viewingProduct.product_code}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-slate-800">
                        <span className="text-slate-400 font-bold">Package</span>
                        <span className="font-black">{viewingProduct.package || "Standard"}</span>
                      </div>
                      <div className="space-y-2">
                        <span className="text-slate-400 font-bold block">Ingredients</span>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {viewingProduct.ingredients || "Natural herbal extracts and proprietary blends."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-600 p-8 rounded-[40px] text-white space-y-4">
                    <h3 className="text-xl font-black">Need Help?</h3>
                    <p className="text-emerald-100 font-medium">
                      Speak with a professional health consultant about this product.
                    </p>
                    <button 
                      onClick={() => setActiveTab("consultation")}
                      className="w-full bg-white text-emerald-700 py-4 rounded-2xl font-black hover:bg-emerald-50 transition-colors"
                    >
                      Free Consultation
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "blogs" && (
            <motion.div
              key="blogs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Health & Wellness Blog</h2>
                  <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-base">Expert advice and insights for a healthier lifestyle.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm text-slate-400 bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-slate-200 w-fit">
                  <DbIcon size={14} className="md:size-4" />
                  <span>PostgreSQL Table: blog_posts</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:gap-12">
                {blogs.map((blog) => (
                  <div key={blog.id} className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 overflow-hidden flex flex-col lg:flex-row">
                    <div className="lg:w-2/5 aspect-video lg:aspect-auto">
                      <img 
                        src={blog.image_url} 
                        alt={blog.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-6 md:p-8 lg:p-12 lg:w-3/5 flex flex-col justify-center">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {blog.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">{blog.title}</h3>
                      <p className="text-slate-600 mt-4 md:mt-6 text-sm md:text-base lg:text-lg leading-relaxed line-clamp-4">{blog.content}</p>
                      <button className="mt-6 md:mt-8 text-emerald-600 font-bold flex items-center gap-2 hover:gap-4 transition-all text-sm md:text-base">
                        Read Full Article
                        <ChevronRight size={18} className="md:size-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "consultation" && (
            <motion.div
              key="consultation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-6 md:p-12 shadow-2xl shadow-slate-200/50">
                <div className="text-center mb-8 md:mb-12">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-100 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <Stethoscope size={24} className="md:size-8" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Free Health Consultation</h2>
                  <p className="text-slate-500 mt-2 text-sm md:text-base">Get professional recommendations based on your symptoms.</p>
                </div>

                <form onSubmit={handleConsultation} className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Full Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="John Doe"
                        className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm md:text-base"
                        value={formData.patient_name}
                        onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                      <input 
                        required
                        type="tel" 
                        placeholder="+234..."
                        className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm md:text-base"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Primary Illness (if known)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Hypertension, Diabetes"
                      className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm md:text-base"
                      value={formData.illness}
                      onChange={(e) => setFormData({...formData, illness: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-xs md:text-sm font-bold text-slate-700 ml-1">Describe Symptoms</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Please describe what you are feeling..."
                      className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none text-sm md:text-base"
                      value={formData.symptoms}
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                    ></textarea>
                  </div>

                  <div className="pt-2 md:pt-4">
                    <button 
                      disabled={loading}
                      type="submit"
                      className="w-full bg-emerald-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Submit Consultation"}
                      <ChevronRight size={20} />
                    </button>
                    <p className="text-center text-[10px] md:text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                      <ShieldCheck size={12} />
                      Your data is protected by PostgreSQL Row Level Security
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">My Health Records</h2>
                  <p className="text-slate-500 text-sm">Private history secured by your unique session token.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-mono text-slate-500 border border-slate-200">
                  <ShieldCheck size={14} />
                  TOKEN: {accessToken.slice(0, 8)}...
                </div>
              </div>

              <div className="space-y-6">
                {consultations.length > 0 ? (
                  consultations.map((c) => (
                    <div key={c.id} className="bg-white rounded-3xl border border-slate-200 p-8 hover:border-emerald-200 transition-colors">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Consultation ID: {c.id}</span>
                          <h3 className="text-xl font-bold text-slate-900 mt-1">{c.patient_name}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Symptoms Reported</h4>
                            <p className="text-slate-700 mt-1">{c.symptoms}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Concern</h4>
                            <p className="text-slate-700 mt-1">{c.illness || "Not specified"}</p>
                          </div>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                          <div className="flex items-center gap-2 text-emerald-700 mb-3">
                            <CheckCircle2 size={18} />
                            <h4 className="text-sm font-bold uppercase tracking-wider">AI Recommendation</h4>
                          </div>
                          <p className="text-emerald-900 font-medium leading-relaxed">{c.ai_recommendation}</p>
                          <div className="mt-4 pt-4 border-top border-emerald-200/50">
                            <h5 className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Recommended Products</h5>
                            <div className="flex flex-wrap gap-2">
                              {c.recommended_products.map((p, i) => (
                                <span key={i} className="bg-white px-3 py-1 rounded-full text-xs font-bold text-emerald-700 border border-emerald-200">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  !loading && (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                      <p className="text-slate-400">No records found for your session.</p>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-slate-900 text-white py-12 md:py-20 mt-12 md:mt-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              {CONFIG.company.logoUrl ? (
                <img 
                  src={CONFIG.company.logoUrl} 
                  alt={CONFIG.company.name} 
                  className="h-8 md:h-10 w-auto object-contain brightness-0 invert"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center text-white">
                  <Activity size={20} className="md:size-6" />
                </div>
              )}
              <h1 className="font-bold text-lg md:text-xl tracking-tight">{CONFIG.company.name}</h1>
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed text-sm md:text-base">
              Leading distributor and marketer of professional health products. 
              We are committed to providing high-quality supplements and expert health consultations 
              to improve the well-being of our community.
            </p>
          </div>
          
          <div className="sm:col-span-1">
            <h4 className="font-bold mb-4 md:mb-6 text-sm md:text-base">Quick Links</h4>
            <ul className="space-y-3 md:space-y-4 text-slate-400 text-xs md:text-sm">
              {CONFIG.navigation.map(item => (
                <li key={item.id}>
                  <button onClick={() => setActiveTab(item.id as any)} className="hover:text-emerald-400 transition-colors">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sm:col-span-1">
            <h4 className="font-bold mb-4 md:mb-6 text-sm md:text-base">Contact Us</h4>
            <ul className="space-y-3 md:space-y-4 text-slate-400 text-xs md:text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} />
                {CONFIG.company.phone}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} />
                NAFDAC Registered Products
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 md:mt-20 pt-8 border-t border-slate-800 text-center text-slate-500 text-[10px] md:text-xs">
          © {new Date().getFullYear()} {CONFIG.company.name} {CONFIG.company.subtitle}. All Rights Reserved.
        </div>
      </footer>

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-5xl bg-white rounded-t-[32px] lg:rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[90vh] lg:h-auto lg:max-h-[90vh]"
            >
              {/* Mobile Drag Handle */}
              <div className="lg:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <X size={20} />
              </button>

              {/* Modal Image Section */}
              <div className="w-full lg:w-1/2 bg-slate-50 flex items-center justify-center p-6 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-100 h-[55vh] lg:h-auto shrink-0 overflow-y-auto custom-scrollbar">
                <img 
                  src={selectedProduct.image_url} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain mix-blend-multiply scale-150 md:scale-175 lg:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Modal Content Section */}
              <div className="w-full lg:w-1/2 p-6 lg:p-12 overflow-y-auto bg-white custom-scrollbar pb-12">
                <div className="space-y-6 md:space-y-8">
                  <div>
                    <div className="text-emerald-600 font-black text-[10px] md:text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Award size={14} />
                      Premium Health Product
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <div className="mt-3 md:mt-4 flex items-center gap-3 md:gap-4">
                      <div className="flex items-center gap-0.5 md:gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className="fill-orange-400 text-orange-400 md:w-[18px] md:h-[18px]" />
                        ))}
                      </div>
                      <span className="text-slate-500 font-bold text-sm md:text-base">(120+ Reviews)</span>
                    </div>
                  </div>

                  <p className="text-base md:text-lg text-slate-600 leading-relaxed font-medium">
                    {selectedProduct.short_desc}
                  </p>

                  <div className="space-y-3 md:space-y-4">
                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-[10px] md:text-sm">Key Health Benefits:</h4>
                    <div className="grid grid-cols-1 gap-2 md:gap-3">
                      {selectedProduct.health_benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                          <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0 mt-0.5 md:w-[20px] md:h-[20px]" />
                          <span className="text-slate-800 font-bold leading-snug text-sm md:text-base">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-baseline gap-3 md:gap-4">
                      <span className="text-3xl md:text-5xl font-black text-slate-900">
                        ₦{(selectedProduct.price_naira * (1 - selectedProduct.discount_percent / 100)).toLocaleString()}
                      </span>
                      {selectedProduct.discount_percent > 0 && (
                        <span className="text-lg md:text-2xl text-slate-400 line-through font-bold">
                          ₦{selectedProduct.price_naira.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {selectedProduct.discount_percent > 0 && (
                      <div className="mt-3 bg-red-50 text-red-700 px-3 py-1.5 rounded-xl text-[10px] md:text-sm font-black inline-flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Save {selectedProduct.discount_percent}% with Senior Discount
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-8 border-t border-slate-100">
                    <button className="w-full bg-emerald-600 text-white py-4 md:py-6 rounded-2xl font-black text-lg md:text-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-[0.98] flex items-center justify-center gap-3 md:gap-4">
                      <ShoppingBag size={22} className="md:w-[28px] md:h-[28px]" />
                      Add to Cart
                    </button>
                    <button 
                      onClick={() => {
                        setViewingProduct(selectedProduct);
                        setSelectedProduct(null);
                        setActiveTab("product-detail");
                      }}
                      className="w-full bg-white text-emerald-600 border-2 border-emerald-600 py-3 md:py-4 rounded-2xl font-black text-base md:text-lg hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Info size={20} />
                      View Full Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
