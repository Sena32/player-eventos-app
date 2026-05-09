import Image from "next/image";

/** Dimensões intrínsecas maiores que a área exibida (~40px altura) para nitidez em telas HiDPI. */
const INTRINSIC_WIDTH = 280;
const INTRINSIC_HEIGHT = 84;

export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const src = variant === "dark" ? "/logo-dark.png" : "/logo-light.png";

  return (
    <div className="flex min-w-0 shrink-0 items-center">
      <Image
        src={src}
        alt="Player Eventos"
        width={INTRINSIC_WIDTH}
        height={INTRINSIC_HEIGHT}
        /* PNG de marca: sem pipeline de otimização para evitar artefatos ao redimensionar */
        unoptimized
        priority
        className="h-10 w-auto max-w-[min(100%,11rem)] object-contain object-left"
        sizes="(max-width: 1024px) 140px, 176px"
      />
    </div>
  );
}
