export default function Spinner({ className = 'py-6' }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <span className="w-5 h-5 border-2 border-[#1D7FD8] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
