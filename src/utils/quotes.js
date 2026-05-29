import { letterCount, lastQuoteStorageKey } from '../config/appConfig'
import { quotes } from '../quotes'

function cleanQuote(quoteText) {
  return quoteText.replaceAll('"', '').replaceAll('\n', ' ').trim()
}

export function getRandomQuote() {
  const availableQuotes = quotes.map(cleanQuote).filter(Boolean)
  if (availableQuotes.length === 0) return ''

  let lastQuote = ''

  try {
    lastQuote = sessionStorage.getItem(lastQuoteStorageKey) || ''
  } catch {
    lastQuote = ''
  }

  const nextQuoteOptions =
    availableQuotes.length > 1 ? availableQuotes.filter((quoteText) => quoteText !== lastQuote) : availableQuotes
  const nextQuote = nextQuoteOptions[Math.floor(Math.random() * nextQuoteOptions.length)]

  try {
    sessionStorage.setItem(lastQuoteStorageKey, nextQuote)
  } catch {
    // Ignore storage errors so the quote still works in restricted browser modes.
  }

  return nextQuote
}

export function getQuoteLetters() {
  return Array.from({ length: letterCount }, (_, index) => ({
    id: `letter-${index + 1}`,
    label: `Thư ${index + 1}`,
  }))
}
