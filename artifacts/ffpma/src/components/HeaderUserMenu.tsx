import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  ShoppingCart,
  ShoppingBag,
  LogOut,
  Settings,
  CreditCard,
  MapPin,
  Download,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";

interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
}

export function HeaderCartIcon() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const saved = localStorage.getItem("ff-cart");
      if (saved) {
        try {
          const items: CartItem[] = JSON.parse(saved);
          setCartCount(items.reduce((sum, item) => sum + item.quantity, 0));
        } catch {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener("storage", updateCount);
    const interval = setInterval(updateCount, 2000);

    return () => {
      window.removeEventListener("storage", updateCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <Link href="/cart">
      <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/10">
        <ShoppingCart className="h-5 w-5" />
        {cartCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-pink-500 text-white text-[10px] border-0">
            {cartCount > 99 ? "99+" : cartCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}

export function HeaderUserMenu() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10 gap-2">
        <Link href="/login">
          <User className="h-4 w-4" />
          Sign In
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-slate-300 hover:text-white hover:bg-white/10">
          <Avatar className="h-6 w-6">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-amber-500 text-white text-xs">
              {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm max-w-24 truncate">
            {user.firstName || user.email?.split("@")[0] || "Member"}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.firstName || "Member"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/my-account" className="cursor-pointer gap-2">
            <User className="h-4 w-4" />
            My Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/orders" className="cursor-pointer gap-2">
            <ShoppingBag className="h-4 w-4" />
            Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-account?tab=addresses" className="cursor-pointer gap-2">
            <MapPin className="h-4 w-4" />
            Addresses
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-account?tab=downloads" className="cursor-pointer gap-2">
            <Download className="h-4 w-4" />
            Downloads
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-account?tab=payment" className="cursor-pointer gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/my-account?tab=details" className="cursor-pointer gap-2">
            <Settings className="h-4 w-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="cursor-pointer gap-2 text-red-400 focus:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
