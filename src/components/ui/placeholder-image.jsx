export function PlaceholderImage({ text, width = 400, height = 200 }) {
  return (
    <div
      className="w-full bg-white/5 flex items-center justify-center"
      style={{ width, height }}
    >
      <span className="text-white/40 font-mono text-sm">{text}</span>
    </div>
  )
} 