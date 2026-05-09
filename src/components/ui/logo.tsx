import Image from "next/image";
export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
    const src =
      variant === "dark"
        ? "/logo-dark.png"
        : "/logo-light.png";
  
    return (
      <div className="flex items-center gap-3">
        <Image src={src} alt="Player Eventos" className="h-10 w-auto" width={100} height={100} />
      </div>
    );
  }