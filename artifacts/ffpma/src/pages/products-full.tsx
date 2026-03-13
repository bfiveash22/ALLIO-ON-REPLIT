import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category } from "@shared/schema";
import { Search, Filter, ShoppingCart, FileCheck, Eye, Lock } from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  imageUrl?: string | null;
}

// Extended product type with role-based pricing fields from API
interface ProductWithPricing extends Product {
  displayPrice?: string | null;
  priceVisible?: boolean;
  showAllPrices?: boolean;
  userRole?: string;
  clinicPricingHidden?: boolean;
  priceTier?: string;
}

export default function ProductsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  const quickAddToCart = (product: ProductWithPricing) => {
    if (!product.displayPrice || !product.priceVisible) {
      toast({
        title: "Cannot add to cart",
        description: "Price not available for this product. View details for more options.",
        variant: "destructive",
      });
      return;
    }

    const savedCart = localStorage.getItem("ff-cart");
    const cart: CartItem[] = savedCart ? JSON.parse(savedCart) : [];
    
    const existingIndex = cart.findIndex(item => item.productId === product.id);
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.displayPrice,
        quantity: 1,
        imageUrl: product.imageUrl,
      });
    }

    localStorage.setItem("ff-cart", JSON.stringify(cart));
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart.`,
    });
  };

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithPricing[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = filteredProducts?.sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return Number(a.displayPrice || a.retailPrice || 0) - Number(b.displayPrice || b.retailPrice || 0);
      case "price-high":
        return Number(b.displayPrice || b.retailPrice || 0) - Number(a.displayPrice || a.retailPrice || 0);
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(price));
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            CGMP manufactured, whole plant, organic therapeutics with
            Certificates of Analysis.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-products"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger
                className="w-48"
                data-testid="select-category"
              >
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {productsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="border-card-border">
                <CardHeader className="pb-2">
                  <Skeleton className="aspect-square w-full rounded-md" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="mb-4 h-4 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedProducts && sortedProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedProducts.map((product) => (
              <Card
                key={product.id}
                className="group relative border-card-border hover-elevate"
                data-testid={`card-product-${product.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="relative aspect-square overflow-hidden rounded-md bg-gradient-to-br from-muted to-muted/50">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10" />
                      </div>
                    )}
                    {product.hasCoa && (
                      <Badge
                        variant="secondary"
                        className="absolute right-2 top-2"
                      >
                        <FileCheck className="mr-1 h-3 w-3" />
                        COA
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">
                      {product.name}
                    </CardTitle>
                  </div>
                  {product.shortDescription && (
                    <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                      {product.shortDescription}
                    </p>
                  )}
                  <div className="mb-4">
                    {product.priceVisible && product.displayPrice ? (
                      <div>
                        <p
                          className="text-lg font-semibold text-primary"
                          data-testid={`price-${product.id}`}
                        >
                          {formatPrice(product.displayPrice)}
                        </p>
                        {product.priceTier && product.priceTier !== 'member' && product.priceTier !== 'guest' && (
                          <p className="text-xs text-muted-foreground">
                            {product.priceTier === 'admin' ? 'Retail' : 
                             product.priceTier === 'doctor' ? 'Doctor Price' : 
                             product.priceTier === 'clinic' ? 'Wholesale' : 'Your Price'}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="h-4 w-4" />
                        <p className="text-sm">
                          {!isAuthenticated 
                            ? 'Sign in to view pricing'
                            : product.clinicPricingHidden 
                              ? 'Contact your clinic' 
                              : 'Price not available'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      asChild
                      data-testid={`button-view-${product.id}`}
                    >
                      <Link href={`/products/${product.slug}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    {isAuthenticated && product.priceVisible && product.displayPrice && (
                      <Button
                        size="icon"
                        onClick={() => quickAddToCart(product)}
                        data-testid={`button-add-cart-${product.id}`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-card-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No products found</h3>
              <p className="mb-4 text-center text-muted-foreground">
                {searchQuery
                  ? `No products matching "${searchQuery}"`
                  : "No products available in this category"}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
