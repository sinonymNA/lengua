export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#1a1614]">
      <div className="text-center">
        <h1 className="font-display text-4xl text-[#d4a853] tracking-widest mb-6 animate-pulse">
          LENGUA
        </h1>
        <div className="flex items-center gap-2 justify-center">
          <div className="w-2 h-2 rounded-full bg-[#d4a853] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#d4a853] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#d4a853] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        {message && (
          <p className="font-ui text-[#9a8e7e] text-sm mt-4">{message}</p>
        )}
      </div>
    </div>
  )
}
