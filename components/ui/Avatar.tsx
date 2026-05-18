import Image from "next/image"
import { cn, iniciales, avatarGradient } from "@/lib/utils"

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl"

const sizeMap: Record<AvatarSize, { container: string; text: string; px: number }> = {
  xs: { container: "h-7 w-7",  text: "text-xs",  px: 28 },
  sm: { container: "h-8 w-8",  text: "text-xs",  px: 32 },
  md: { container: "h-11 w-11", text: "text-sm",  px: 44 },
  lg: { container: "h-[72px] w-[72px]", text: "text-xl", px: 72 },
  xl: { container: "h-24 w-24", text: "text-3xl", px: 96 },
}

interface AvatarProps {
  nombre: string
  apellido: string
  fotoUrl?: string | null
  size?: AvatarSize
  className?: string
}

export function Avatar({ nombre, apellido, fotoUrl, size = "md", className }: AvatarProps) {
  const { container, text } = sizeMap[size]
  const initials = iniciales(nombre, apellido)
  const gradient = avatarGradient(nombre)

  if (fotoUrl) {
    const { px } = sizeMap[size]
    return (
      <span className={cn("relative flex-shrink-0 rounded-full overflow-hidden inline-block", container, className)}>
        <Image
          src={fotoUrl}
          alt={`${nombre} ${apellido}`}
          width={px}
          height={px}
          unoptimized
          className="h-full w-full object-cover"
        />
      </span>
    )
  }

  return (
    <span
      className={cn(
        "flex-shrink-0 rounded-full inline-flex items-center justify-center font-bold select-none",
        `bg-gradient-to-br ${gradient}`,
        container,
        text,
        className
      )}
      style={{ color: "white", letterSpacing: "-0.01em" }}
      aria-label={`${nombre} ${apellido}`}
    >
      {initials}
    </span>
  )
}
