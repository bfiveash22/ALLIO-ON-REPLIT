interface FFLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FFLogo({ className = "", size = "md" }: FFLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <img
      src="/assets/ff_pma_header_logo.png"
      alt="FF PMA"
      className={`object-contain ${sizeClasses[size]} ${className}`}
    />
  );
}

export function FFLogoFull({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/assets/ff_pma_header_logo.png"
        alt="Forgotten Formula PMA"
        className="h-10 w-10 object-contain"
      />
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-foreground">Forgotten Formula</span>
        <span className="text-[10px] text-muted-foreground leading-none">Private Member Association</span>
      </div>
      <span className="text-[10px] text-muted-foreground/60 font-medium self-end mb-0.5">&times; ALLIO</span>
    </div>
  );
}

export function AllioLogoText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/assets/ff_pma_header_logo.png"
        alt="Forgotten Formula PMA"
        className="h-8 w-8 object-contain"
      />
      <div className="flex flex-col">
        <span className="text-base font-bold tracking-tight text-foreground">Forgotten Formula</span>
        <span className="text-[9px] text-muted-foreground leading-none">Restoring What Medicine Forgot.</span>
      </div>
    </div>
  );
}
