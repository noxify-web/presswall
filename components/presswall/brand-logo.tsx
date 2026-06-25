import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: number;
  variant?:
    | "black-back"
    | "white-back"
    | "black-stroke-transparent"
    | "white-stroke-transparent";
}

const LOGO_PATHS = {
  "black-back": "/brand/black-back.png",
  "white-back": "/brand/white-back.png",
  "black-stroke-transparent": "/brand/black-stokre-transparent.png",
  "white-stroke-transparent": "/brand/white-stroke-transparent.png",
} as const;

export function BrandLogo({
  className,
  size = 40,
  variant = "black-back",
}: BrandLogoProps) {
  return (
    <Image
      alt="Presswall"
      className={cn("rounded-md", className)}
      height={size}
      priority
      src={LOGO_PATHS[variant]}
      width={size}
    />
  );
}
