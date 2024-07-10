import type OpenAI from 'openai'
import { z } from 'zod'

export const defaultModel = process.env.OPENAI_TOOL_RUNNER_DEFAULT_MODEL || 'gpt-4o'

export const openaiSystemMessage = z.object({
  role: z.enum(['system']),
  content: z.string(),
  name: z.string().optional(),
})
export type OpenAISystemMessage = z.infer<typeof openaiSystemMessage>

export const openaiUserMessageContentItemText = z.object({
  type: z.enum(['text']),
  text: z.string(),
})

export const openaiUserMessageContentItemImage = z.object({
  type: z.enum(['image_url']),
  image_url: z.object({
    url: z.string(),
    detail: z.enum(['low', 'high', 'auto']),
  }),
})

export const openaiUserMessageContentItem = z.union([openaiUserMessageContentItemText, openaiUserMessageContentItemImage])

export type OpenAIUserMessageContentItem = z.infer<typeof openaiUserMessageContentItem>

export const openaiUserMessage = z.object({
  role: z.enum(['user']),
  content: z.string().or(z.array(openaiUserMessageContentItem)),
  name: z.string().optional(),
})
export type OpenAIUserMessage = z.infer<typeof openaiUserMessage>

export const openaiAssistantMessage = z.object({
  role: z.enum(['assistant']),
  content: z.string().optional().nullable(),
  name: z.string().optional(),
  tool_calls: z.array(z.object({
    id: z.string(),
    type: z.enum(['function']),
    function: z.object({
      name: z.string(),
      arguments: z.string(),
    }),
  })).optional(),
})
export type OpenAIAssistantMessage = z.infer<typeof openaiAssistantMessage>

export const openaiToolMessage = z.object({
  role: z.enum(['tool']),
  content: z.string(),
  tool_call_id: z.string(),
})
export type OpenAIToolMessage = z.infer<typeof openaiToolMessage>

export const agentMessage = z.union([openaiSystemMessage, openaiUserMessage, openaiAssistantMessage, openaiToolMessage])
export type AgentMessage = z.infer<typeof agentMessage>

export interface ToolInterface {
  name: string
  description: string
  inputSchema: z.AnyZodObject
  outputSchema: z.AnyZodObject
  run: (args: any) => Promise<any>
}

export interface ToolChainInterface {
  tools: ToolInterface[]
  stopWhen: ToolInterface[]
  toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
  toolMessages: OpenAIToolMessage[]

  run: (message: OpenAIAssistantMessage) => AsyncGenerator<OpenAIToolMessage>
  mustStop: () => boolean
  runTool: (toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) => Promise<OpenAIToolMessage>
}
