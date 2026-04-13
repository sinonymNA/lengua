export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl bg-[#242018] border border-[#c4603a]/30">
      <div className="w-10 h-10 rounded-full bg-[#c4603a]/20 flex items-center justify-center">
        <span className="text-[#c4603a] text-xl">!</span>
      </div>
      <p className="font-ui text-[#f0e8d8] text-center">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm px-4 py-2">
          Try again
        </button>
      )}
    </div>
  )
}
