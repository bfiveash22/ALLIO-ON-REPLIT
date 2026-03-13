import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search,
  Filter,
  ShoppingCart,
  Star,
  Package,
  Plus,
  Minus,
  Grid3X3,
  LayoutGrid,
  Loader2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataSourceBadge } from "@/components/data-source-badge";

interface WooCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface WooBrand {
  id: number;
  name: string;
  slug: string;
  count: number;
  image?: string;
}


interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  imageUrl?: string | null;
}

interface RolePrice {
  price: string;
  visible: boolean;
}

interface RolePricing {
  [role: string]: RolePrice;
}

interface WooProduct {
  id: number;
  woocommerceId: number;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  onSale: boolean;
  stockStatus: string;
  category: string;
  categorySlug: string;
  categorySlugs: string[];
  brand: string | null;
  brandSlug: string | null;
  imageUrl: string | null;
  productType?: string;
  rating: number;
  reviewCount: number;
  rolePricing?: RolePricing;
}

interface MemberProfile {
  id: string;
  userId: string;
  role: string;
  wpRoles?: string[]; // WordPress roles for custom pricing (e.g., "holtorf")
}

interface WooStatus {
  connected: boolean;
  configured: boolean;
  storeUrl: string | null;
  error?: string;
}

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("ff-cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [sortBy, setSortBy] = useState("popular");
  const [gridCols, setGridCols] = useState<3 | 4>(3);

  const { data: profile } = useQuery<MemberProfile>({
    queryKey: ["/api/profile"],
    staleTime: 60000,
  });

  const userRole = profile?.role || 'member';
  const userWpRoles = profile?.wpRoles || [];

  const { data: wooStatus } = useQuery<WooStatus>({
    queryKey: ["/api/woocommerce/status"],
    staleTime: 60000,
  });

  const { data: wooProducts, isLoading: isLoadingProducts } = useQuery<{ products: WooProduct[]; total: number }>({
    queryKey: ["/api/woocommerce/products?all=true"],
    enabled: wooStatus?.connected === true,
    staleTime: 60000,
  });

  // Get role-based pricing - checks WordPress roles first (like "holtorf"), then app role
  // Case-insensitive matching: normalizes all role keys to lowercase
  const getRolePrice = (product: WooProduct): { price: number; isRolePrice: boolean; matchedRole: string | null } => {
    if (!product.rolePricing) {
      return { price: product.salePrice || product.price, isRolePrice: false, matchedRole: null };
    }
    
    // Normalize rolePricing keys to lowercase for case-insensitive lookup
    const normalizedRolePricing: Record<string, { price: string; visible: boolean }> = {};
    for (const [key, value] of Object.entries(product.rolePricing)) {
      normalizedRolePricing[key.toLowerCase()] = value;
    }
    
    // First check WordPress roles (custom roles like "holtorf" take priority)
    for (const wpRole of userWpRoles) {
      const normalizedRole = wpRole.toLowerCase();
      if (normalizedRolePricing[normalizedRole]?.visible) {
        const rolePrice = parseFloat(normalizedRolePricing[normalizedRole].price);
        if (!isNaN(rolePrice) && rolePrice > 0) {
          return { price: rolePrice, isRolePrice: true, matchedRole: wpRole };
        }
      }
    }
    
    // Then check app role (member, doctor, admin, clinic) - also case-insensitive
    const normalizedUserRole = userRole.toLowerCase();
    if (normalizedRolePricing[normalizedUserRole]?.visible) {
      const rolePrice = parseFloat(normalizedRolePricing[normalizedUserRole].price);
      if (!isNaN(rolePrice) && rolePrice > 0) {
        return { price: rolePrice, isRolePrice: true, matchedRole: userRole };
      }
    }
    
    return { price: product.salePrice || product.price, isRolePrice: false, matchedRole: null };
  };

  const { data: wooCategories, isLoading: isLoadingCategories } = useQuery<WooCategory[]>({
    queryKey: ["/api/woocommerce/categories"],
    enabled: wooStatus?.connected === true,
    staleTime: 60000,
  });

  const { data: wooBrands, isLoading: isLoadingBrands } = useQuery<WooBrand[]>({
    queryKey: ["/api/woocommerce/brands"],
    enabled: wooStatus?.connected === true,
    staleTime: 60000,
  });

  const displayProducts = useMemo(() => {
    if (wooStatus?.connected && wooProducts?.products?.length) {
      return wooProducts.products.map(p => {
        const { price: effectivePrice, isRolePrice, matchedRole } = getRolePrice(p);
        return {
          id: p.woocommerceId,
          name: p.name,
          category: p.category || 'Uncategorized',
          categorySlug: p.categorySlug || 'uncategorized',
          categorySlugs: p.categorySlugs || [p.categorySlug || 'uncategorized'],
          brand: p.brand || null,
          brandSlug: p.brandSlug || null,
          price: p.price,
          effectivePrice,
          isRolePrice,
          matchedRole,
          salePrice: p.salePrice,
          rating: p.rating || 0,
          reviews: p.reviewCount || 0,
          image: p.imageUrl,
          productType: p.productType || 'simple',
          badge: isRolePrice && matchedRole ? `${matchedRole.charAt(0).toUpperCase() + matchedRole.slice(1)} Price` : (p.onSale ? "Sale" : null),
          description: p.description?.replace(/<[^>]*>/g, '').substring(0, 150) || '',
          inStock: p.stockStatus === 'instock',
          rolePricing: p.rolePricing,
        };
      });
    }
    return [];
  }, [wooStatus?.connected, wooProducts?.products, userRole, userWpRoles]);

  const displayCategories = useMemo(() => {
    const totalProducts = wooStatus?.connected && wooProducts?.total 
      ? wooProducts.total 
      : displayProducts.length;
    const allCategory = { id: 0, name: "All Products", slug: "all", count: totalProducts };
    if (wooStatus?.connected && wooCategories?.length) {
      const filtered = wooCategories.filter(c => c.count > 0);
      return [allCategory, ...filtered.sort((a, b) => b.count - a.count)];
    }
    return [allCategory];
  }, [wooStatus?.connected, wooCategories, wooProducts?.total, displayProducts.length]);

  const displayBrands = useMemo(() => {
    const allBrand = { id: 0, name: "All Brands", slug: "all", count: displayProducts.length };
    if (wooStatus?.connected && wooBrands?.length) {
      const filtered = wooBrands.filter(b => b.count > 0);
      return [allBrand, ...filtered.sort((a, b) => b.count - a.count)];
    }
    return [allBrand];
  }, [wooStatus?.connected, wooBrands, displayProducts.length]);

  const filteredProducts = useMemo(() => {
    let filtered = displayProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || 
        product.categorySlugs?.includes(selectedCategory) ||
        product.categorySlug === selectedCategory;
      const matchesBrand = selectedBrand === "all" || 
        product.brandSlug === selectedBrand;
      return matchesSearch && matchesCategory && matchesBrand;
    });

    switch (sortBy) {
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return filtered;
  }, [displayProducts, searchQuery, selectedCategory, selectedBrand, sortBy]);

  const addToCart = (product: typeof displayProducts[0]) => {
    const productIdStr = String(product.id);
    const newCart = [...cart];
    const existingIndex = newCart.findIndex((item) => item.productId === productIdStr);
    
    if (existingIndex >= 0) {
      newCart[existingIndex].quantity += 1;
    } else {
      newCart.push({
        productId: productIdStr,
        name: product.name,
        price: String(product.effectivePrice),
        quantity: 1,
        imageUrl: product.image,
      });
    }
    
    setCart(newCart);
    localStorage.setItem("ff-cart", JSON.stringify(newCart));
  };

  const getCartQuantity = (productId: number) => {
    const item = cart.find((i) => i.productId === String(productId));
    return item?.quantity || 0;
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="text-white/60 hover:text-white gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Healing Products</h1>
                <p className="text-xs text-white/60">
                  {wooStatus?.connected 
                    ? `${wooProducts?.total || displayProducts.length} Products • Synced with WooCommerce`
                    : `${displayProducts.length} Products • Sample Catalog`
                  }
                </p>
              </div>
            </div>
            <Link href="/cart">
              <Button variant="outline" className="border-white/20 text-white gap-2 relative">
                <ShoppingCart className="w-4 h-4" />
                Cart
                {totalCartItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs px-1.5 min-w-5 h-5 flex items-center justify-center">
                    {totalCartItems}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <Button variant="outline" className="border-white/20 text-white gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <h3 className="text-sm font-medium text-white/60 mb-4">
              Categories
              {isLoadingCategories && <Loader2 className="w-3 h-3 ml-2 inline animate-spin" />}
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {displayCategories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  data-testid={`button-category-${cat.slug}`}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    selectedCategory === cat.slug
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Tag className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-sm truncate">{cat.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${selectedCategory === cat.slug ? 'border-cyan-500/50 text-cyan-400' : 'border-white/20'}`}
                  >
                    {cat.count}
                  </Badge>
                </button>
              ))}
            </div>

            {displayBrands.length > 1 && (
              <>
                <h3 className="text-sm font-medium text-white/60 mb-4 mt-6">
                  Brands
                  {isLoadingBrands && <Loader2 className="w-3 h-3 ml-2 inline animate-spin" />}
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {displayBrands.map((brand) => (
                    <button
                      key={brand.slug}
                      onClick={() => setSelectedBrand(brand.slug)}
                      data-testid={`button-brand-${brand.slug}`}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                        selectedBrand === brand.slug
                          ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-sm truncate">{brand.name}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${selectedBrand === brand.slug ? 'border-pink-500/50 text-pink-400' : 'border-white/20'}`}
                      >
                        {brand.count}
                      </Badge>
                    </button>
                  ))}
                </div>
              </>
            )}

            {wooStatus?.connected && (
              <div className="mt-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  WooCommerce Connected
                </p>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/60">
                Showing <span className="text-white font-medium">{filteredProducts.length}</span> of {displayProducts.length} products
              </p>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGridCols(3)}
                    className={`h-8 w-8 p-0 ${gridCols === 3 ? 'bg-white/10' : ''}`}
                    data-testid="button-grid-3"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGridCols(4)}
                    className={`h-8 w-8 p-0 ${gridCols === 4 ? 'bg-white/10' : ''}`}
                    data-testid="button-grid-4"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] bg-slate-800/50 border-white/10 text-white" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingProducts ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="bg-slate-800/30 border-white/10 overflow-hidden">
                    <Skeleton className="aspect-square bg-slate-700/50" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4 bg-slate-700/50" />
                      <Skeleton className="h-4 w-full bg-slate-700/50" />
                      <Skeleton className="h-4 w-1/2 bg-slate-700/50" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
            <div className={`grid gap-5 ${
              gridCols === 4 
                ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'md:grid-cols-2 xl:grid-cols-3'
            }`}>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/products/${product.id}`} data-testid={`product-card-${product.id}`}>
                    <Card className="bg-slate-800/50 border-white/10 overflow-hidden group hover:border-cyan-500/30 transition-colors cursor-pointer h-full flex flex-col">
                      <div className="aspect-square bg-gradient-to-br from-slate-700/30 to-slate-800/50 relative overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-900/20 to-blue-900/20">
                            <Package className="w-16 h-16 text-cyan-500/30" />
                          </div>
                        )}
                        {product.badge && (
                          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
                            {product.badge}
                          </Badge>
                        )}
                        {!product.inStock && (
                          <Badge className="absolute top-3 right-3 bg-slate-600 text-white/80 border-0">
                            Out of Stock
                          </Badge>
                        )}
                        <div className="absolute bottom-3 left-3">
                          <DataSourceBadge source={wooStatus?.connected ? "woocommerce" : "postgresql"} id={`product-${product.id}`} />
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-medium text-white mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-sm text-white/50 mb-3 line-clamp-2 flex-grow">
                          {product.description || "Premium healing product from Forgotten Formula"}
                        </p>
                        <div className="flex items-center gap-2 mb-4">
                          {product.rating > 0 && (
                            <>
                              <div className="flex items-center gap-1 text-amber-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-medium">{product.rating}</span>
                              </div>
                              <span className="text-sm text-white/40">
                                ({product.reviews} reviews)
                              </span>
                            </>
                          )}
                          {product.brand && (
                            <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                              {product.brand}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            {product.isRolePrice ? (
                              <>
                                <span className="text-lg font-bold text-cyan-400">
                                  {product.productType === 'variable' && <span className="text-sm font-medium mr-1 text-white/50">From</span>}
                                  ${product.effectivePrice.toFixed(2)}
                                </span>
                                <span className="text-sm text-white/40 line-through">
                                  ${product.price.toFixed(2)}
                                </span>
                                <span className="text-xs text-cyan-400/70 capitalize">
                                  {product.matchedRole || userRole} pricing
                                </span>
                              </>
                            ) : product.salePrice && product.salePrice < product.price ? (
                              <>
                                <span className="text-lg font-bold text-pink-400">
                                  {product.productType === 'variable' && <span className="text-sm font-medium mr-1 text-white/50">From</span>}
                                  ${product.salePrice.toFixed(2)}
                                </span>
                                <span className="text-sm text-white/40 line-through">
                                  ${product.price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-xl font-bold text-white">
                                {product.productType === 'variable' && <span className="text-sm font-medium mr-1 text-white/50">From</span>}
                                ${product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            disabled={!product.inStock}
                            className={product.inStock 
                              ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 gap-2"
                              : "border-white/10"
                            }
                            data-testid={`add-to-cart-${product.id}`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {product.inStock ? "Add" : "Notify"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
