import { useState, useRef } from 'react'

export default function ChoiceButtons({ choices, onSelect, disabled }) {
  const [selected, setSelected] = useState(null)
  const startTimeRef = useRef(Date.now())

  function handleSelect(choice) {
    if (disabled || selected) return
    const timeTaken = Date.now() - startTimeRef.current
    setSelected(choice.id)
    onSelect(choice, timeTaken)
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-3 animate-slide-up">
      <p className="font-ui text-xs text-[#9a8e7e] uppercase tracking-widest mb-4">
        How do you respond?
      </p>
      {choices.map((choice, i) => (
        <button
          key={choice.id}
          onClick={() => handleSelect(choice)}
          disabled={disabled || !!selected}
          className={`w-full text-left p-5 rounded-xl border transition-all duration-200 group ${
            selected === choice.id
              ? choice.is_best
                ? 'bg-[#5a8a5e]/15 border-[#5a8a5e]/50 shadow-[0_0_16px_rgba(90,138,94,0.2)]'
                : 'bg-[#c4603a]/10 border-[#c4603a]/30'
              : selected
              ? 'bg-[#242018]/40 border-[#3a342e] opacity-40 cursor-not-allowed'
              : 'bg-[#242018] border-[#3a342e] hover:border-[#d4a853]/40 hover:bg-[#2a2318] hover:shadow-warm cursor-pointer'
          }`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-start gap-3">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-ui text-xs font-medium transition-colors ${
                selected === choice.id
                  ? choice.is_best
                    ? 'bg-[#5a8a5e] text-[#f0e8d8]'
                    : 'bg-[#c4603a]/50 text-[#f0e8d8]'
                  : 'bg-[#3a342e] text-[#9a8e7e] group-hover:bg-[#d4a853]/20 group-hover:text-[#d4a853]'
              }`}
            >
              {choice.id.toUpperCase()}
            </span>
            <div>
              <p
                className={`font-body text-lg transition-colors ${
                  selected === choice.id
                    ? choice.is_best
                      ? 'text-[#f0e8d8]'
                      : 'text-[#f0e8d8]'
                    : 'text-[#f0e8d8] group-hover:text-[#d4a853]'
                }`}
              >
                {choice.spanish}
              </p>
              <p className="font-ui text-xs text-[#9a8e7e] mt-0.5">{choice.english}</p>
            </div>

            {/* Outcome indicator */}
            {selected === choice.id && (
              <span className="ml-auto flex-shrink-0 text-lg">
                {choice.is_best ? '✓' : '✕'}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
