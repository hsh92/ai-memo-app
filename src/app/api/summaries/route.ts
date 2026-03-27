import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'

const MODEL_NAME = 'gemini-2.5-flash-lite'
const MAX_CONTENT_LENGTH = 12000

interface SummaryRequestBody {
  title?: string
  content?: string
}

export async function POST(request: Request) {
  try {
    const { title, content } = (await request.json()) as SummaryRequestBody

    const sanitizedTitle = title?.trim() ?? ''
    const sanitizedContent = content?.trim() ?? ''

    if (!sanitizedTitle || !sanitizedContent) {
      return Response.json(
        { error: '요약할 메모 제목과 내용을 모두 입력해 주세요.' },
        { status: 400 }
      )
    }

    if (sanitizedContent.length > MAX_CONTENT_LENGTH) {
      return Response.json(
        { error: '메모가 너무 길어 요약할 수 없습니다. 내용을 조금 줄여 주세요.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return Response.json(
        { error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                '다음 메모를 한국어로 간결하게 요약해 주세요.',
                '요약은 2~3문장으로 작성하고, 핵심 내용만 자연스러운 평문으로 정리해 주세요.',
                '불필요한 인사말, 머리말, 목록 기호는 사용하지 마세요.',
                '',
                `제목: ${sanitizedTitle}`,
                '',
                '본문:',
                sanitizedContent,
              ].join('\n'),
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          '당신은 사용자의 메모를 읽고 핵심만 짧고 명확하게 요약하는 한국어 비서입니다.',
      },
    })

    const summary = response.text?.trim()

    if (!summary) {
      return Response.json(
        { error: 'AI 요약 결과를 받지 못했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 502 }
      )
    }

    return Response.json({ summary })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'AI 요약 생성 중 알 수 없는 오류가 발생했습니다.'

    return Response.json({ error: message }, { status: 500 })
  }
}
