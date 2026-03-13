import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Trash2, Plus, Minus, Package, CreditCard, Loader2 } from "lucide-react";

interface CartItem {
  productId: string;
  wcProductId?: number;
  name: string;
  price: string;
  quantity: number;
  imageUrl?: string | null;
}

export default function CartPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [billing, setBilling] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("ff-cart");
    return saved ? JSON.parse(saved) : [];
  });

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("ff-cart", JSON.stringify(newCart));
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newCart = cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveCart(newCart);
  };

  const removeItem = (productId: string) => {
    const newCart = cart.filter(item => item.productId !== productId);
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const handleCheckout = async () => {
    if (!billing.first_name || !billing.last_name || !billing.email) {
      toast({
        title: "Billing Info Required",
        description: "Please fill in your name and email to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout/wc-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({
            wcProductId: item.wcProductId || item.productId,
            quantity: item.quantity,
          })),
          billing,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.checkoutUrl) {
        localStorage.setItem("ff-pending-order", JSON.stringify({
          orderId: data.orderId,
          total: data.total,
          items: cart.length,
        }));

        toast({
          title: "Order Created",
          description: `Order #${data.orderId} created. Redirecting to payment...`,
        });

        window.location.href = data.checkoutUrl;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some products to get started</p>
            <Button asChild>
              <Link href="/products" data-testid="link-browse-products">
                <Package className="h-4 w-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Shopping Cart</h1>
          <p className="text-muted-foreground">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" onClick={clearCart} data-testid="button-clear-cart">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Cart
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card key={item.productId} data-testid={`card-cart-item-${item.productId}`}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover rounded-md" />
                  ) : (
                    <Package className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">${parseFloat(item.price).toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => updateQuantity(item.productId, -1)}
                    data-testid={`button-decrease-${item.productId}`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => updateQuantity(item.productId, 1)}
                    data-testid={`button-increase-${item.productId}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => removeItem(item.productId)}
                  data-testid={`button-remove-${item.productId}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax & Shipping</span>
                <span className="text-sm">Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Estimated Total</span>
                <span>${subtotal.toFixed(2)}+</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {!showBillingForm ? (
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={() => setShowBillingForm(true)}
                  data-testid="button-proceed-checkout"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
              ) : null}
            </CardFooter>
          </Card>

          {showBillingForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={billing.first_name}
                      onChange={(e) => setBilling(b => ({ ...b, first_name: e.target.value }))}
                      placeholder="First name"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={billing.last_name}
                      onChange={(e) => setBilling(b => ({ ...b, last_name: e.target.value }))}
                      placeholder="Last name"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={billing.email}
                    onChange={(e) => setBilling(b => ({ ...b, email: e.target.value }))}
                    placeholder="your@email.com"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={billing.phone}
                    onChange={(e) => setBilling(b => ({ ...b, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    data-testid="input-phone"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || !billing.first_name || !billing.last_name || !billing.email}
                  data-testid="button-checkout"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ${subtotal.toFixed(2)} via Secure Checkout
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Your order will be created on our WooCommerce store and you'll be redirected to a secure checkout page to complete payment via Stripe.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
