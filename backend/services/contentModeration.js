const moderationEndpoint = 'https://api.openai.com/v1/moderations'
const moderationModel = 'omni-moderation-latest'
const moderationTimeoutMs = 10_000

export const moderationRejectedMessage = 'Nội dung này chưa phù hợp với không gian cộng đồng. Bạn chỉnh lại rồi thử lại nha.'
export const moderationUnavailableMessage = 'Hệ thống kiểm duyệt đang tạm thời chưa sẵn sàng. Nội dung chưa được đăng, bạn thử lại sau nha.'

export class ModerationUnavailableError extends Error {
  constructor(message = moderationUnavailableMessage, options = {}) {
    super(message, options)
    this.name = 'ModerationUnavailableError'
  }
}

function buildModerationInput({ text = '', image = '' }) {
  const input = []
  const normalizedText = String(text || '').trim()

  if (normalizedText) input.push({ type: 'text', text: normalizedText })
  if (image) input.push({ type: 'image_url', image_url: { url: image } })

  return input
}

export async function moderateCommunityContent(content) {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim()
  if (!apiKey) throw new ModerationUnavailableError()

  const input = buildModerationInput(content)
  if (!input.length) return { flagged: false, categories: [] }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), moderationTimeoutMs)

  try {
    const response = await fetch(moderationEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: moderationModel, input }),
      signal: controller.signal,
    })
    const data = await response.json().catch(() => null)

    if (!response.ok || !Array.isArray(data?.results)) {
      const requestId = response.headers.get('x-request-id') || 'unknown'
      console.error(`OpenAI moderation failed: status=${response.status}, requestId=${requestId}`)
      throw new ModerationUnavailableError()
    }

    const categories = new Set()
    for (const result of data.results) {
      for (const [category, flagged] of Object.entries(result?.categories || {})) {
        if (flagged) categories.add(category)
      }
    }

    return {
      flagged: data.results.some((result) => Boolean(result?.flagged)),
      categories: [...categories],
    }
  } catch (error) {
    if (error instanceof ModerationUnavailableError) throw error
    const reason = error?.name === 'AbortError' ? 'timeout' : 'network-error'
    console.error(`OpenAI moderation unavailable: ${reason}`)
    throw new ModerationUnavailableError(moderationUnavailableMessage, { cause: error })
  } finally {
    clearTimeout(timeout)
  }
}
