import { useState, useEffect, useMemo, RefObject } from "react"

interface UseVirtualOptions {
  itemCount: number
  itemHeight: number
  overscan?: number
}

export function useVirtual(
  containerRef: RefObject<HTMLDivElement | null>,
  { itemCount, itemHeight, overscan = 10 }: UseVirtualOptions
) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(500) // Default fallback height

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Initialize container clientHeight
    setContainerHeight(container.clientHeight || 500)

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    const handleResize = () => {
      setContainerHeight(container.clientHeight || 500)
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize)

    // ResizeObserver to track dynamic height changes of the container
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height || 500)
        }
      })
      resizeObserver.observe(container)
    }

    return () => {
      container.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [containerRef])

  const { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const end = Math.min(itemCount - 1, Math.floor((scrollTop + containerHeight) / itemHeight) + overscan)

    const topSpacer = start * itemHeight
    const bottomSpacer = Math.max(0, (itemCount - 1 - end) * itemHeight)

    return {
      startIndex: start,
      endIndex: end,
      topSpacerHeight: topSpacer,
      bottomSpacerHeight: bottomSpacer,
    }
  }, [scrollTop, containerHeight, itemCount, itemHeight, overscan])

  return {
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
  }
}
