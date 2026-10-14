export const convertNumberToWords = (num: number): string => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  if (num === 0) return "Zero"
  if (num < 10) return ones[num]
  if (num < 20) return teens[num - 10]
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
  if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + convertNumberToWords(num % 100) : "")
  if (num < 100000) return convertNumberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + convertNumberToWords(num % 1000) : "")
  if (num < 10000000) return convertNumberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + convertNumberToWords(num % 100000) : "")
  return convertNumberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + convertNumberToWords(num % 10000000) : "")
}

export const formatDate = (dateString: string | number | Date): string => {
  if (!dateString) return ""
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return ""
  try {
    // Try to parse as ISO date string first
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      // If not valid ISO, try parsing as DD/MM/YYYY
      const parts = dateString.split("/")
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // months are 0-indexed
        const year = parseInt(parts[2], 10)
        return new Date(year, month, day).toISOString().split("T")[0]
      }
      return ""
    }
    return date.toISOString().split("T")[0]
  } catch {
    return ""
  }
}

/**
 * Safely parse date inputs (string, Date, timestamp) into a valid local Date object.
 */
export const parseLocalDate = (dateInput: string | Date | number | null | undefined): Date | null => {
  if (!dateInput) return null
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput
  }
  if (typeof dateInput === "number") {
    const d = new Date(dateInput)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim()
    if (!trimmed) return null
    // Format YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10)
      const m = parseInt(isoMatch[2], 10) - 1
      const d = parseInt(isoMatch[3], 10)
      return new Date(y, m, d)
    }
    // Format DD/MM/YYYY
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (ddmmyyyyMatch) {
      const d = parseInt(ddmmyyyyMatch[1], 10)
      const m = parseInt(ddmmyyyyMatch[2], 10) - 1
      const y = parseInt(ddmmyyyyMatch[3], 10)
      return new Date(y, m, d)
    }
    const parsed = new Date(trimmed)
    return isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

/**
 * Calendar-year based week calculation (starts on Jan 1st every year).
 * Week 1: Jan 1 - Jan 7
 * Week 2: Jan 8 - Jan 14
 * Week 3: Jan 15 - Jan 21
 * ...
 */
export const getCalendarWeekNumber = (
  dateInput: string | Date | number | null | undefined
): { weekNumber: number; year: number } | null => {
  const date = parseLocalDate(dateInput)
  if (!date) return null

  const year = date.getFullYear()
  const utcDate = Date.UTC(year, date.getMonth(), date.getDate())
  const utcStartOfYear = Date.UTC(year, 0, 1)

  const diffDays = Math.floor((utcDate - utcStartOfYear) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return null

  const weekNumber = Math.floor(diffDays / 7) + 1
  return { weekNumber, year }
}

/**
 * Given a calendar year and week number (1 - 53), returns the start and end date strings (YYYY-MM-DD)
 * and formatted display label.
 */
export const getWeekDateRange = (
  year: number,
  weekNumber: number
): { startDate: string; endDate: string; label: string } => {
  const startDayOffset = (weekNumber - 1) * 7
  const startDateObj = new Date(year, 0, 1 + startDayOffset)
  let endDateObj = new Date(year, 0, 1 + startDayOffset + 6)
  if (endDateObj.getFullYear() > year) {
    endDateObj = new Date(year, 11, 31)
  }

  const pad = (n: number) => String(n).padStart(2, "0")
  const startDate = `${startDateObj.getFullYear()}-${pad(startDateObj.getMonth() + 1)}-${pad(startDateObj.getDate())}`
  const endDate = `${endDateObj.getFullYear()}-${pad(endDateObj.getMonth() + 1)}-${pad(endDateObj.getDate())}`

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const startDay = pad(startDateObj.getDate())
  const endDay = pad(endDateObj.getDate())
  const startMonth = monthNames[startDateObj.getMonth()]
  const endMonth = monthNames[endDateObj.getMonth()]

  const label = `Week ${weekNumber} (${startDay} ${startMonth} – ${endDay} ${endMonth})`

  return {
    startDate,
    endDate,
    label,
  }
}

