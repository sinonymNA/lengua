import { useTypewriter } from '../../hooks/useTypewriter.js'

export default function NarrationBlock({ text, opacity = 1, onDone, skip }) {
  const { displayedText, done } = useTypewriter(text, 35, onDone)

  if (!text || opacity === 0) return null

  return (
    <div
      className="relative max-w-2xl mx-auto px-6 py-5 rounded-lg border-l-2 border-[#d4a853]/20 bg-[#242018]/60"
      style={{ opacity }}
    >
      <p
        className="font-body text-lg leading-relaxed text-[#f0e8d8]"
        style={{ opacity: opacity < 1 ? 0.5 : 1 }}
      >
        {displayedText}
        {!done && <span className="animate-pulse text-[#d4a853]"> |</span>}
      </p>
      {!done && skip && (
        <button
          onClick={skip}
          className="absolute bottom-2 right-4 font-ui text-xs text-[#9a8e7e] hover:text-[#d4a853] transition-colors"
        >
          skip
        </button>
      )}
    </div>
  )
}
