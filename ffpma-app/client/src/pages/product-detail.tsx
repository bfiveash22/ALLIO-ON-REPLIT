import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  ShoppingCart,
  ArrowLeft,
  Minus,
  Plus,
  Info,
  ExternalLink,
  Star,
  Package,
  Tag,
  Check,
  AlertCircle,
  Truck,
  Box,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import DOMPurify from "dompurify";
import ImageZoomModal from "@/components/ImageZoomModal";
import { ZoomIn } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WOOCOMMERCE_SITE_URL = import.meta.env.VITE_WOOCOMMERCE_URL || "https://forgottenformula.com";

interface RolePricing {
  [role: string]: { price: string; visible: boolean };
}

interface ProductVariation {
  id: number;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  onSale: boolean;
  stockStatus: string;
  stockQuantity: number | null;
  sku: string;
  imageUrl: string | null;
  attributes: Array<{ name: string; option: string }>;
  rolePricing?: RolePricing;
}

interface ProductAttribute {
  id: number;
  name: string;
  options: string[];
  visible: boolean;
  variation: boolean;
}

interface ShippingInfo {
  weight: string;
  dimensions: { length: string; width: string; height: string };
  shippingClass: string;
}

interface WooProduct {
  id: number;
  woocommerceId: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  onSale: boolean;
  stockStatus: string;
  stockQuantity: number | null;
  productType: string;
  sku: string;
  category: string;
  categorySlug: string;
  categorySlugs: string[];
  brand: string | null;
  brandSlug: string | null;
  imageUrl: string | null;
  images: Array<{ id: number; src: string; alt: string }>;
  rating: number;
  reviewCount: number;
  attributes: ProductAttribute[];
  shipping: ShippingInfo;
  rolePricing: RolePricing;
  variations?: ProductVariation[];
}

interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  imageUrl?: string | null;
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const productId = parseInt(slug || "0");

  const { data: product, isLoading, error } = useQuery<WooProduct>({
    queryKey: [`/api/woocommerce/products/${productId}`],
    enabled: !!productId && productId > 0,
    staleTime: 60000,
    retry: 1,
  });

  const variationAttributes = product?.attributes?.filter(attr => attr.variation) || [];
  const hasVariations = product?.productType === "variable" && variationAttributes.length > 0;

  const onCarouselSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onCarouselSelect);
    return () => {
      carouselApi.off("select", onCarouselSelect);
    };
  }, [carouselApi, onCarouselSelect]);

  const scrollToSlide = useCallback((index: number) => {
    carouselApi?.scrollTo(index);
  }, [carouselApi]);

  const validImages = useMemo(() => {
    if (!product?.images) return [];
    return product.images.filter(img => img.src && img.src.trim().length > 0);
  }, [product?.images]);

  const hasMultipleImages = validImages.length > 1;

  const selectedVariation = hasVariations && product?.variations
    ? product.variations.find(v =>
        v.attributes.every(attr =>
          selectedAttributes[attr.name] === attr.option
        )
      )
    : null;

  const effectivePrice = selectedVariation
    ? (selectedVariation.salePrice ?? selectedVariation.price)
    : (product?.salePrice ?? product?.price ?? 0);

  const effectiveRegularPrice = selectedVariation?.regularPrice ?? product?.regularPrice ?? product?.price ?? 0;
  const effectiveOnSale = selectedVariation?.onSale ?? product?.onSale ?? false;
  const effectiveStock = selectedVariation?.stockStatus ?? product?.stockStatus ?? "instock";
  const effectiveSku = selectedVariation?.sku || product?.sku;

  const addToCart = () => {
    if (!product) return;

    const savedCart = localStorage.getItem("ff-cart");
    const cart: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

    const variationSuffix = selectedVariation
      ? `-${selectedVariation.id}`
      : "";
    const productIdStr = `${product.woocommerceId}${variationSuffix}`;
    const existingIndex = cart.findIndex((item) => item.productId === productIdStr);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      const variationName = selectedVariation
        ? ` (${selectedVariation.attributes.map(a => a.option).join(", ")})`
        : "";
      cart.push({
        productId: productIdStr,
        name: `${product.name}${variationName}`,
        price: String(effectivePrice),
        quantity: quantity,
        imageUrl: selectedVariation?.imageUrl || product.imageUrl,
      });
    }

    localStorage.setItem("ff-cart", JSON.stringify(cart));

    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} added to your cart.`,
    });
  };

  const buyNow = () => {
    if (!product) return;
    const variationId = selectedVariation?.id || product.woocommerceId;
    const checkoutUrl = `${WOOCOMMERCE_SITE_URL}/?add-to-cart=${variationId}`;
    window.open(checkoutUrl, "_blank");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-8 h-10 w-32 bg-slate-800" />
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-xl bg-slate-800" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4 bg-slate-800" />
              <Skeleton className="h-6 w-1/2 bg-slate-800" />
              <Skeleton className="h-24 w-full bg-slate-800" />
              <Skeleton className="h-12 w-full bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-white/10 bg-slate-800/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
              <h3 className="mb-2 text-lg font-semibold text-white">Product not found</h3>
              <p className="mb-4 text-white/60 text-center max-w-md">
                The product you're looking for doesn't exist or may have been removed.
              </p>
              <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500">
                <Link href="/products">Back to Products</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const inStock = effectiveStock === "instock";
  const hasDescription = product.description && product.description.trim().length > 0;
  const allOptionsSelected = !hasVariations || variationAttributes.every(
    attr => selectedAttributes[attr.name]
  );
  const cleanDescription = hasDescription
    ? DOMPurify.sanitize(product.description)
    : `<p>Experience the healing benefits of ${product.name}. This premium product from Forgotten Formula is crafted with the highest quality ingredients to support your wellness journey.</p><p>As a member of the Forgotten Formula Private Membership Association, you have access to products that embody our commitment to true healing - free from corporate pharmaceutical influence.</p>`;

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 text-white/60 hover:text-white"
          asChild
          data-testid="button-back"
        >
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            {hasMultipleImages ? (
              <>
                <div className="relative" tabIndex={0} aria-label="Product image gallery">
                  <Carousel
                    setApi={setCarouselApi}
                    className="w-full"
                    opts={{ loop: true }}
                  >
                    <CarouselContent>
                      {validImages.map((image, index) => (
                        <CarouselItem key={image.id || index}>
                          <div 
                            className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 cursor-zoom-in group"
                            onClick={() => setIsZoomOpen(true)}
                          >
                            <img
                              src={image.src}
                              alt={image.alt || `${product.name} - Image ${index + 1}`}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              data-testid={`img-product-${index}`}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900/80 rounded-full p-3">
                                <ZoomIn className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            {product.onSale && index === 0 && (
                              <Badge className="absolute left-4 top-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
                                Sale
                              </Badge>
                            )}
                            {!inStock && index === 0 && (
                              <Badge className="absolute right-4 top-4 bg-slate-600 text-white/80 border-0">
                                Out of Stock
                              </Badge>
                            )}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 bg-slate-900/80 border-white/20 text-white hover:bg-slate-800 hover:text-white focus:ring-2 focus:ring-cyan-400" />
                    <CarouselNext className="right-2 bg-slate-900/80 border-white/20 text-white hover:bg-slate-800 hover:text-white focus:ring-2 focus:ring-cyan-400" />
                  </Carousel>
                  <div 
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10"
                    role="tablist"
                    aria-label="Image slides"
                  >
                    {validImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => scrollToSlide(index)}
                        className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-1 focus:ring-offset-slate-900 ${
                          currentSlide === index
                            ? "w-6 bg-cyan-400"
                            : "w-2 bg-white/40 hover:bg-white/60"
                        }`}
                        data-testid={`carousel-dot-${index}`}
                        aria-label={`Go to slide ${index + 1}`}
                        aria-current={currentSlide === index ? "true" : undefined}
                        role="tab"
                        aria-selected={currentSlide === index}
                      />
                    ))}
                  </div>
                </div>
                <div 
                  className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10"
                  role="tablist"
                  aria-label="Image thumbnails"
                >
                  {validImages.map((image, index) => (
                    <button
                      key={image.id || index}
                      onClick={() => scrollToSlide(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                        currentSlide === index
                          ? "border-cyan-400 ring-2 ring-cyan-400/30"
                          : "border-white/10 hover:border-white/30"
                      }`}
                      data-testid={`thumbnail-${index}`}
                      aria-label={`View image ${index + 1}`}
                      aria-current={currentSlide === index ? "true" : undefined}
                      role="tab"
                      aria-selected={currentSlide === index}
                    >
                      <img
                        src={image.src}
                        alt={image.alt || `Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div 
                className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 cursor-zoom-in group"
                onClick={() => (validImages[0]?.src || product.imageUrl) && setIsZoomOpen(true)}
              >
                {(validImages[0]?.src || product.imageUrl) ? (
                  <>
                    <img
                      src={validImages[0]?.src || product.imageUrl || ""}
                      alt={validImages[0]?.alt || product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      data-testid="img-product"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900/80 rounded-full p-3">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-cyan-900/20 to-blue-900/20">
                    <Package className="w-32 h-32 text-cyan-500/30" />
                  </div>
                )}
                {product.onSale && (
                  <Badge className="absolute left-4 top-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
                    Sale
                  </Badge>
                )}
                {!inStock && (
                  <Badge className="absolute right-4 top-4 bg-slate-600 text-white/80 border-0">
                    Out of Stock
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {product.category && (
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                  <Tag className="w-3 h-3 mr-1" />
                  {product.category}
                </Badge>
              )}
              {product.brand && (
                <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                  {product.brand}
                </Badge>
              )}
            </div>

            <h1
              className="mb-4 text-3xl font-bold tracking-tight text-white"
              data-testid="text-product-name"
            >
              {product.name}
            </h1>

            {product.rating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-medium">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-white/40">({product.reviewCount} reviews)</span>
              </div>
            )}

            <Separator className="my-6 bg-white/10" />

            <div className="mb-6">
              {effectiveOnSale && effectivePrice < effectiveRegularPrice ? (
                <div className="flex items-baseline gap-4">
                  <span
                    className="text-4xl font-bold text-pink-400"
                    data-testid="text-sale-price"
                  >
                    {formatPrice(effectivePrice)}
                  </span>
                  <span className="text-xl text-white/40 line-through">
                    {formatPrice(effectiveRegularPrice)}
                  </span>
                  <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                    Save {Math.round(((effectiveRegularPrice - effectivePrice) / effectiveRegularPrice) * 100)}%
                  </Badge>
                </div>
              ) : (
                <span
                  className="text-4xl font-bold text-white"
                  data-testid="text-price"
                >
                  {formatPrice(effectivePrice)}
                </span>
              )}
              {hasVariations && !allOptionsSelected && (
                <p className="text-sm text-white/50 mt-2">Select options to see price</p>
              )}
            </div>

            {hasVariations && (
              <div className="mb-6 space-y-4">
                {variationAttributes.map((attr) => (
                  <div key={attr.id} className="space-y-2">
                    <label className="text-sm font-medium text-white/80">{attr.name}</label>
                    <Select
                      value={selectedAttributes[attr.name] || ""}
                      onValueChange={(value) =>
                        setSelectedAttributes((prev) => ({ ...prev, [attr.name]: value }))
                      }
                    >
                      <SelectTrigger
                        className="w-full bg-slate-800/50 border-white/20 text-white"
                        data-testid={`select-${attr.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <SelectValue placeholder={`Choose ${attr.name}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/20">
                        {attr.options.map((option) => (
                          <SelectItem
                            key={option}
                            value={option}
                            className="text-white hover:bg-slate-700"
                          >
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-4 flex items-center gap-4 flex-wrap">
              {inStock ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">In Stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Out of Stock</span>
                </div>
              )}
              {effectiveSku && (
                <span className="text-white/50 text-sm">SKU: {effectiveSku}</span>
              )}
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-lg border border-white/20 bg-slate-800/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-white hover:bg-white/10"
                    data-testid="button-decrease-qty"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span
                    className="w-12 text-center font-medium text-white"
                    data-testid="text-quantity"
                  >
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-white hover:bg-white/10"
                    data-testid="button-increase-qty"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  onClick={addToCart}
                  disabled={!inStock || !allOptionsSelected}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {!allOptionsSelected ? "Select Options" : "Add to Cart"}
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
                onClick={buyNow}
                disabled={!inStock || !allOptionsSelected}
                data-testid="button-buy-now"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Buy Now on forgottenformula.com
              </Button>

              {product.shipping?.shippingClass && (
                <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-lg border border-white/10">
                  <Truck className="w-5 h-5 text-cyan-400" />
                  <div className="text-sm text-white/70">
                    {product.shipping.shippingClass.includes("heavy") ? (
                      <span>Heavy Package (&gt; 8 lbs)</span>
                    ) : product.shipping.shippingClass.includes("base") ? (
                      <span>Standard Package (&lt; 8 lbs)</span>
                    ) : (
                      <span className="capitalize">{product.shipping.shippingClass.replace(/-/g, " ")}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start bg-slate-800/50 border border-white/10">
              <TabsTrigger
                value="description"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                data-testid="tab-description"
              >
                <Info className="mr-2 h-4 w-4" />
                Description
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                data-testid="tab-details"
              >
                <Package className="mr-2 h-4 w-4" />
                Product Details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <Card className="border-white/10 bg-slate-800/30">
                <CardContent className="pt-6">
                  <div
                    className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-white/80 prose-strong:text-white prose-a:text-cyan-400"
                    dangerouslySetInnerHTML={{ __html: cleanDescription }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="details" className="mt-6">
              <Card className="border-white/10 bg-slate-800/30">
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-white/60">Product ID</span>
                        <span className="text-white font-medium">{product.woocommerceId}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-white/60">Category</span>
                        <span className="text-white font-medium">{product.category}</span>
                      </div>
                      {product.brand && (
                        <div className="flex justify-between py-2 border-b border-white/10">
                          <span className="text-white/60">Brand</span>
                          <span className="text-white font-medium">{product.brand}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-white/60">Stock Status</span>
                        <span className={`font-medium ${inStock ? "text-emerald-400" : "text-amber-400"}`}>
                          {inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                      {effectiveSku && (
                        <div className="flex justify-between py-2 border-b border-white/10">
                          <span className="text-white/60">SKU</span>
                          <span className="text-white font-medium">{effectiveSku}</span>
                        </div>
                      )}
                      {product.rating > 0 && (
                        <div className="flex justify-between py-2 border-b border-white/10">
                          <span className="text-white/60">Rating</span>
                          <span className="text-white font-medium flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-current" />
                            {product.rating.toFixed(1)} ({product.reviewCount})
                          </span>
                        </div>
                      )}
                      {product.categorySlugs && product.categorySlugs.length > 1 && (
                        <div className="flex justify-between py-2 border-b border-white/10">
                          <span className="text-white/60">Categories</span>
                          <span className="text-white font-medium text-right">
                            {product.categorySlugs.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {product.shipping && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="flex items-center gap-2 text-white font-medium mb-4">
                        <Box className="w-4 h-4 text-cyan-400" />
                        Shipping Information
                      </h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        {product.shipping.weight && (
                          <div className="flex justify-between py-2 px-3 bg-slate-800/30 rounded-lg">
                            <span className="text-white/60">Weight</span>
                            <span className="text-white font-medium">{product.shipping.weight} lbs</span>
                          </div>
                        )}
                        {product.shipping.dimensions?.length && (
                          <div className="flex justify-between py-2 px-3 bg-slate-800/30 rounded-lg">
                            <span className="text-white/60">Dimensions</span>
                            <span className="text-white font-medium">
                              {product.shipping.dimensions.length}" × {product.shipping.dimensions.width}" × {product.shipping.dimensions.height}"
                            </span>
                          </div>
                        )}
                        {product.shipping.shippingClass && (
                          <div className="flex justify-between py-2 px-3 bg-slate-800/30 rounded-lg md:col-span-2">
                            <span className="text-white/60">Shipping Class</span>
                            <span className="text-white font-medium">
                              {product.shipping.shippingClass.includes("heavy") 
                                ? "Heavy Package (> 8 lbs)" 
                                : product.shipping.shippingClass.includes("base")
                                ? "Standard Package (< 8 lbs)"
                                : product.shipping.shippingClass.replace(/-/g, " ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ImageZoomModal
        images={validImages.length > 0 ? validImages : product.imageUrl ? [{ src: product.imageUrl, alt: product.name }] : []}
        currentIndex={currentSlide}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        onIndexChange={(index) => {
          setCurrentSlide(index);
          scrollToSlide(index);
        }}
        productName={product.name}
      />
    </div>
  );
}
