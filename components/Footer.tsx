export default function Footer() {
  return (
    <footer className="py-10 text-center text-sm opacity-70">
      <div className="mb-4">
        Con amor — Sofía & Franco · 18 de Octubre de 2025
      </div>
      <div className="flex items-center justify-center gap-2 text-xs opacity-60">
        <span>Hecho con</span>
        <span className="text-red-500 text-base">❤️</span>
        <span>+</span>
        <span className="text-green-600 text-base">🧉</span>
        <span>por Fabri Cauterucci y las tecnologias: </span>
        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-mono">TS</span>
        <span>+</span>
        <span className="bg-yellow-400 text-black px-2 py-1 rounded text-xs font-mono">JS</span>
        <span>+</span>
        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">Supabase</span>
      </div>
    </footer>
  );
}
