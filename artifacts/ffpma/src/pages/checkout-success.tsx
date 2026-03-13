import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ShoppingBag, Home, Loader2 } from "lucide-react";

export default function CheckoutSuccessPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sessionId = params.get("session_id");
  const wcOrderId = params.get("order_id");

  const [pendingOrder, setPendingOrder] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ff-pending-order");
    if (saved) {
      setPendingOrder(JSON.parse(saved));
    }
  }, []);

  const { data: stripeSession, isLoading: stripeLoading } = useQuery({
    queryKey: ["/api/checkout/session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await fetch(`/api/checkout/session/${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch session");
      return response.json();
    },
    enabled: !!sessionId,
  });

  const orderId = wcOrderId || pendingOrder?.orderId;
  const { data: wcOrder, isLoading: wcLoading } = useQuery({
    queryKey: ["/api/checkout/wc-order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await fetch(`/api/checkout/wc-order/${orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order");
      return response.json();
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'completed' || data?.status === 'processing') return false;
      return 5000;
    },
  });

  useEffect(() => {
    const isPaid = stripeSession?.payment_status === "paid" ||
      wcOrder?.status === "completed" || wcOrder?.status === "processing";
    if (isPaid) {
      localStorage.removeItem("ff-cart");
      localStorage.removeItem("ff-pending-order");
    }
  }, [stripeSession, wcOrder]);

  const isLoading = stripeLoading || wcLoading;
  const orderData = stripeSession || wcOrder;
  const isPaid = stripeSession?.payment_status === "paid" ||
    wcOrder?.status === "completed" || wcOrder?.status === "processing";

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-cyan-500" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-order-confirmed">
            {isPaid ? "Order Confirmed!" : "Order Created"}
          </CardTitle>
          <CardDescription>
            {isPaid
              ? "Thank you for your purchase. Your order has been received and is being processed."
              : "Your order has been created. Please complete payment to finalize your purchase."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderData && (
            <div className="bg-muted rounded-md p-4 space-y-2">
              {wcOrder?.id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-sm">#{wcOrder.id}</span>
                </div>
              )}
              {sessionId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session</span>
                  <span className="font-mono text-sm">{sessionId?.slice(0, 20)}...</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium capitalize ${isPaid ? 'text-cyan-600' : 'text-yellow-600'}`}>
                  {wcOrder?.status || stripeSession?.payment_status || 'pending'}
                </span>
              </div>
              {(wcOrder?.total || stripeSession?.amount_total) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">
                    ${wcOrder?.total || (stripeSession.amount_total / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {wcOrder?.line_items && (
                <div className="mt-3 pt-3 border-t space-y-1">
                  <span className="text-sm font-medium">Items:</span>
                  {wcOrder.line_items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                      <span>${item.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!orderData && pendingOrder && (
            <div className="bg-muted rounded-md p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-sm">#{pendingOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">${pendingOrder.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{pendingOrder.items}</span>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>A confirmation email will be sent to your registered email address.</p>
            <p className="mt-2">You can track your order status in your dashboard.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/orders" data-testid="link-view-orders">
              <ShoppingBag className="h-4 w-4 mr-2" />
              View Orders
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/products" data-testid="link-continue-shopping">
              <Package className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
          <Button asChild variant="ghost" className="flex-1">
            <Link href="/" data-testid="link-home">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
