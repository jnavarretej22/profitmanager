import { useEffect, useState } from "react"

export type Tema = "light" | "dark"

export function useTheme() {
  const [tema, setTema] = useState<Tema>("light")
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true) // eslint-disable-line react-hooks/set-state-in-effect
    const guardado = localStorage.getItem("tema") as Tema | null
    const preferencia = window.matchMedia("(prefers-color-scheme: dark)").matches
    const inicial: Tema = guardado ?? (preferencia ? "dark" : "light")
    setTema(inicial)
    document.documentElement.classList.toggle("dark", inicial === "dark")
  }, [])

  function toggleTema() {
    const nuevo: Tema = tema === "light" ? "dark" : "light"
    setTema(nuevo)
    localStorage.setItem("tema", nuevo)
    document.documentElement.classList.toggle("dark", nuevo === "dark")
  }

  return { tema, toggleTema, montado }
}
