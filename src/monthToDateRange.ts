interface DateRange {
  startDate: Date
  endDate: Date
}

const parseMonthValue = (monthValue: string): number => {
  if (!isNaN(parseInt(monthValue))) {
    return parseInt(monthValue)
  } else {
    const monthName =
      monthValue.charAt(0).toUpperCase() + monthValue.slice(1).toLowerCase()
    const monthNumber = new Date(`2000 ${monthName}`).getMonth() + 1
    if (isNaN(monthNumber)) {
      throw new Error(
        'Invalid month value. Please specify a valid month (1-12) or month name.'
      )
    }
    return monthNumber
  }
}

const generateDateRange = (month: number): DateRange => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const monthIndex = month - 1
  const targetYear =
    currentDate.getMonth() < monthIndex ? currentYear - 1 : currentYear

  const startDate = new Date(Date.UTC(targetYear, monthIndex, 1))
  const endDate = new Date(Date.UTC(targetYear, monthIndex + 1, 0))

  return { startDate, endDate }
}

export const monthToDateRange = (monthValue: string) => {
  try {
    const month = parseMonthValue(monthValue)
    const dateRange = generateDateRange(month)

    return {
      from: dateRange.endDate,
      to: dateRange.startDate
    }
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}
