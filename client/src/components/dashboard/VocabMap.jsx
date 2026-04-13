export default function VocabMap({ vocab }) {
  if (!vocab) return null

  const { acquired, frontier, unknown, total } = vocab
  const maxCount = Math.max(acquired, frontier, unknown, 1)

  return (
    <div className="card-warm p-6">
      <h3 className="font-display text-lg text-[#f0e8d8] mb-5">Vocabulary</h3>

      <div className="space-y-4">
        <VocabBar
          label="Acquired"
          count={acquired}
          max={maxCount}
          color="#5a8a5e"
          subtitle="Words you own"
        />
        <VocabBar
          label="Learning"
          count={frontier}
          max={maxCount}
          color="#d4a853"
          subtitle="Words in progress"
        />
        <VocabBar
          label="Encountered"
          count={unknown}
          max={maxCount}
          color="#9a8e7e"
          subtitle="Words seen once"
        />
      </div>

      <div className="mt-5 pt-4 border-t border-[#d4a853]/10 flex items-center justify-between">
        <span className="font-ui text-[#9a8e7e] text-sm">Total words</span>
        <span className="font-display text-[#d4a853] text-xl">{total}</span>
      </div>
    </div>
  )
}

function VocabBar({ label, count, max, color, subtitle }) {
  const width = max > 0 ? (count / max) * 100 : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="font-ui text-sm text-[#f0e8d8]">{label}</span>
          <span className="font-ui text-xs text-[#9a8e7e] ml-2">{subtitle}</span>
        </div>
        <span className="font-display text-lg" style={{ color }}>
          {count}
        </span>
      </div>
      <div className="confidence-bar">
        <div
          className="confidence-bar-fill"
          style={{ width: `${width}%`, background: color, opacity: 0.8 }}
        />
      </div>
    </div>
  )
}
