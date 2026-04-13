export default function FeedbackPanel({ isCorrect, reaction, translation, onContinue }) {
  return (
    <div
      className={`max-w-2xl mx-auto w-full rounded-xl p-6 border animate-slide-up ${
        isCorrect
          ? 'bg-[#5a8a5e]/10 border-[#5a8a5e]/30'
          : 'bg-[#d4a853]/8 border-[#d4a853]/20'
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="text-2xl flex-shrink-0">{isCorrect ? '✓' : '~'}</span>
        <div className="flex-1">
          <p
            className={`font-ui text-sm font-medium mb-2 ${
              isCorrect ? 'text-[#5a8a5e]' : 'text-[#d4a853]'
            }`}
          >
            {isCorrect ? 'Bien hecho!' : 'Keep trying'}
          </p>
          <p className="font-body text-[#f0e8d8] leading-relaxed">{reaction}</p>
          {translation && (
            <p className="font-ui text-sm text-[#9a8e7e] italic mt-2">
              "{translation}"
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onContinue}
        className="btn-primary text-sm px-6 py-2.5 mt-4 w-full sm:w-auto"
      >
        Continue →
      </button>
    </div>
  )
}
