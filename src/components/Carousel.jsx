import { useEffect, useMemo, useRef, useState } from 'react'

function toTitleCaseFromFilename(filename) {
  const base = filename.replace(/^.*\//, '').replace(/\.[^.]+$/, '')
  const words = base.split(/[-_\s]+/)
  return words
    .map((w) => {
      const lower = w.toLowerCase()
      if (lower === 'crm') return 'CRM'
      if (lower === 'api') return 'API'
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

export default function Carousel({ images = [], intervalMs = 4500 }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef(null)
  const isHoveringRef = useRef(false)

  const slides = useMemo(
    () =>
      images.map((src) => ({
        src,
        caption: toTitleCaseFromFilename(src),
      })),
    [images],
  )

  useEffect(() => {
    const start = () => {
      if (timerRef.current) return
      timerRef.current = setInterval(() => {
        if (isHoveringRef.current) return
        setCurrentIndex((prev) => (prev + 1) % slides.length)
      }, intervalMs)
    }
    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    if (slides.length > 1) start()
    return stop
  }, [slides.length, intervalMs])

  const goTo = (idx) => setCurrentIndex((idx + slides.length) % slides.length)
  const next = () => goTo(currentIndex + 1)
  const prev = () => goTo(currentIndex - 1)

  return (
    <section className="bg-white">
      <div
        className="max-w-7xl mx-auto px-6 lg:px-8"
        onMouseEnter={() => {
          isHoveringRef.current = true
        }}
        onMouseLeave={() => {
          isHoveringRef.current = false
        }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          <div className="relative h-[360px] sm:h-[420px] lg:h-[520px]">
            <div
              className="absolute inset-0 flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {slides.map((slide, idx) => (
                <div key={idx} className="min-w-full h-full bg-gray-50 flex items-center justify-center">
                  <img
                    src={slide.src}
                    alt={slide.caption}
                    className="w-full h-full object-contain p-4"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              ))}
            </div>

            {slides.length > 1 && (
              <>
                <button
                  aria-label="Previous slide"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-navy rounded-full p-3 shadow border border-gray-200"
                  onClick={prev}
                >
                  <i className="fas fa-chevron-left" />
                </button>
                <button
                  aria-label="Next slide"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-navy rounded-full p-3 shadow border border-gray-200"
                  onClick={next}
                >
                  <i className="fas fa-chevron-right" />
                </button>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="text-navy font-semibold text-base sm:text-lg">
                {slides[currentIndex]?.caption || ''}
              </div>
              {slides.length > 1 && (
                <div className="flex items-center gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        currentIndex === i ? 'w-6 bg-electric' : 'w-2 bg-gray-300'
                      }`}
                      onClick={() => goTo(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


