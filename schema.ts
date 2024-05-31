import type OpenAI from 'openai'
import { z } from 'zod'

export const defaultModel = process.env.LLM_TOOL_RUNNER_DEFAULT_MODEL || 'gpt-4o'

export const openaiSystemMessage = z.object({
  role: z.enum(['system']),
  content: z.string(),
  name: z.string().optional(),
})
export type OpenAISystemMessage = z.infer<typeof openaiSystemMessage>

export const openaiUserMessage = z.object({
  role: z.enum(['user']),
  content: z.string(),
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

export const agentMessageSchema = z.union([openaiSystemMessage, openaiUserMessage, openaiAssistantMessage, openaiToolMessage])
export type AgentMessage = z.infer<typeof agentMessageSchema>

export interface Tool {
  name: string
  description: string
  inputSchema: z.AnyZodObject
  outputSchema: z.AnyZodObject
  run: (args: any) => Promise<any>
}

export interface ToolChainInterface {
  tools: Tool[]
  stopWhen: Tool[]
  toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
  toolMessages: OpenAIToolMessage[]

  run: (message: OpenAIAssistantMessage) => AsyncGenerator<OpenAIToolMessage>
  mustStop: () => boolean
  runTool: (toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) => Promise<OpenAIToolMessage>
}
