// Edge runtime handler — returns MOCK_BRIEF when no API key configured
export const config = { runtime: 'edge' }

const MOCK_BRIEF = {
  headline: 'Precision at the Edge of the Known',
  mandate: "Build for the moment when the familiar gives way to something that hasn't been named yet.",
  visualDirection: [
    'Dark ground with surfaces that emerge',
    'Typography at scale, not decoration',
    'Color as temperature — warm ochre against deep black',
  ],
  recommendedService: 'App Development — this needs to exist as software.',
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return new Response(JSON.stringify(MOCK_BRIEF), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { prompt } = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `You are a creative director at Mirage Studios (miragestudios.io). A potential client has described what they want to build. Write them a creative brief in JSON format with these exact keys: headline (a poetic 5-8 word title), mandate (1-2 sentences, evocative, precise), visualDirection (array of 3 short phrases), recommendedService (one of: App Development, AI Consulting, Marketing, Photogrammetry).

Client description: ${prompt}

Return only valid JSON, no markdown.`,
          },
        ],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''

    let brief
    try {
      brief = JSON.parse(text)
    } catch {
      brief = MOCK_BRIEF
    }

    return new Response(JSON.stringify(brief), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify(MOCK_BRIEF), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
