import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_MARK_SRC = "/brand/logo-mark.svg";

type LogoProps = {
  size?: number;
  className?: string;
};

export function Logo({ size = 32, className }: LogoProps) {
  return (
    <Image
      src={LOGO_MARK_SRC}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}

type LogoMarkProps = {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  textClassName?: string;
};

const ICON_SIZE = {
  sm: 24,
  md: 28,
  lg: 32,
} as const;

export function LogoMark({
  showText = true,
  size = "md",
  className,
  textClassName,
}: LogoMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logo
        size={ICON_SIZE[size]}
        className="transition-transform group-hover:scale-[1.03]"
      />
      {showText && (
        <span className={cn("text-sm font-semibold tracking-tightish", textClassName)}>
          FormForge
        </span>
      )}
    </span>
  );
}
