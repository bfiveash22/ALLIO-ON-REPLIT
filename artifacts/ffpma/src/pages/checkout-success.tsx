import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package, ShoppingBag, Home, Loader2, XCircle, Clock } from "lucide-react";

export default function CheckoutSuccessPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sessionId = params.get("session_id");

  const [pendingOrder, setPendingOrder] = useState<{ orderId?: string; sessionId?: string; total?: string; items?: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ff-pending-order");
    if (saved) {
      setPendingOrder(JSON.parse(saved));
    }
  }, []);

  const { data: stripeSession, isLoading } = useQuery({
    queryKey: ["/api/payments/session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await fetch(`/api/payments/session/${sessionId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch session");
      return response.json();
    },
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.payment_status === "paid") return false;
      return 3000;
    },
  });

  useEffect(() => {
    if (stripeSession?.payment_status === "paid") {
      localStorage.removeItem("ff-cart");
      localStorage.removeItem("ff-pending-order");
    }
  }, [stripeSession]);

  const isPaid = stripeSession?.payment_status === "paid";
  const isFailed = stripeSession?.status === "expired";

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            {isPaid ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : isFailed ? (
              <XCircle className="h-16 w-16 text-red-500" />
            ) : (
              <Clock className="h-16 w-16 text-yellow-500" />
            )}
          </div>
          <CardTitle className="text-2xl" data-testid="text-order-confirmed">
            {isPaid ? "Payment Successful!" : isFailed ? "Payment Failed" : "Processing Payment..."}
          </CardTitle>
          <CardDescription>
            {isPaid
              ? "Thank you for your purchase. Your order has been confirmed and is being processed."
              : isFailed
              ? "Your payment could not be completed. Please try again or contact support."
              : "We're confirming your payment. This should only take a moment."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stripeSession && (
            <div className="bg-muted rounded-md p-4 space-y-2">
              {pendingOrder?.orderId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-sm">#{pendingOrder.orderId.slice(0, 8)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant={isPaid ? "default" : isFailed ? "destructive" : "secondary"}>
                  {stripeSession.payment_status || "pending"}
                </Badge>
              </div>
              {stripeSession.amount_total && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Charged</span>
                  <span className="font-medium">
                    ${(stripeSession.amount_total / 100).toFixed(2)} {stripeSession.currency?.toUpperCase()}
                  </span>
                </div>
              )}
              {stripeSession.customer_email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt sent to</span>
                  <span className="text-sm">{stripeSession.customer_email}</span>
                </div>
              )}
            </div>
          )}

          {!stripeSession && pendingOrder && (
            <div className="bg-muted rounded-md p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-sm">#{pendingOrder.orderId?.slice(0, 8)}</span>
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
            {isPaid ? (
              <>
                <p>A confirmation email will be sent to your registered email address.</p>
                <p className="mt-2">You can track your order and payment history in your dashboard.</p>
              </>
            ) : (
              <p>If you continue to experience issues, please contact our support team.</p>
            )}
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
