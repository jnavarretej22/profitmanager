import Image from "next/image"

// Carrusel hover-to-expand. En desktop cada imagen se expande al pasar el mouse;
// en mobile scrollea horizontalmente.
const IMAGENES = [
  { src: "/images/imagen1.avif", alt: "Coach trabajando con su alumno" },
  { src: "/images/imagen2.jpg",  alt: "Entrenamiento personalizado" },
  { src: "/images/imagen3.avif", alt: "Sesión en gimnasio" },
  { src: "/images/imagen4.jpg",  alt: "Seguimiento de progreso" },
  { src: "/images/imagen5.avif", alt: "Planificación nutricional" },
  { src: "/images/imagen6.avif", alt: "Resultados con coaching" },
]

export function CarruselHero() {
  return (
    <section className="px-4 sm:px-6 pt-10 pb-6">
      <h2
        className="text-2xl sm:text-3xl font-semibold text-center mx-auto"
        style={{ color: "var(--foreground)", letterSpacing: "-0.02em" }}
      >
        Coaches que ya están transformando vidas
      </h2>
      <p
        className="text-sm text-center mt-2 max-w-lg mx-auto"
        style={{ color: "var(--foreground-muted)" }}
      >
        Una mirada al trabajo de los profesionales que confían en ProFit Manager para gestionar su día a día.
      </p>

      {/* Desktop: hover-to-expand. Mobile: scroll horizontal con snap. */}
      <div className="mt-8 sm:mt-10 mx-auto max-w-4xl">
        <div className="hidden md:flex items-center gap-2 h-[400px] w-full">
          {IMAGENES.map((img) => (
            <div
              key={img.src}
              className="relative group flex-grow transition-all w-56 rounded-2xl overflow-hidden h-[400px] duration-500 hover:w-full"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                unoptimized
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Mobile: scroll snap horizontal */}
        <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scroll-smooth">
          {IMAGENES.map((img) => (
            <div
              key={img.src}
              className="relative flex-shrink-0 w-[75%] aspect-[3/4] rounded-2xl overflow-hidden snap-center"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                unoptimized
                className="object-cover object-center"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
