interface FFLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FFLogo({ className = "", size = "md" }: FFLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-sm",
    md: "h-8 w-8 text-lg",
    lg: "h-12 w-12 text-xl",
  };

  return (
    <div className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold ${sizeClasses[size]} ${className}`}>
      FF
    </div>
  );
}

export function FFLogoFull({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
        <span className="text-white font-bold text-lg">FF</span>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-foreground">Forgotten Formula</span>
        <span className="text-[10px] text-muted-foreground leading-none">Private Member Association</span>
      </div>
    </div>
  );
}

export function AllioLogoText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <span className="text-primary font-bold text-lg">FF</span>
      </div>
      <div className="flex flex-col">
        <span className="text-base font-bold tracking-tight text-foreground">Forgotten Formula</span>
        <span className="text-[9px] text-muted-foreground leading-none">True Healing Ecosystem</span>
      </div>
    </div>
  );
}
