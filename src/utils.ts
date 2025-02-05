import OpenAI from 'openai'
import { defaultModel, type AgentMessage, type OpenAISystemMessage, type ToolChainInterface } from './schema'
import { ToolChain } from './toolchain'

export function createSystemMessage(content: string): OpenAISystemMessage {
  return {
    role: 'system',
    content,
  }
}

export function createUserMessage(content: string): AgentMessage {
  return {
    role: 'user',
    content,
  }
}

/**
 * Gives you a function that runs a single LLM completion.
 * Has a little flag to force the use of tools.
 * Returns the completion message, with tool calls and all.
 */
export function createCompleter(options: {
  apiKey: string
  baseURL?: string
  model?: string
  temperature?: number
  forceTools?: boolean
  forceTool?: string
}) {
  const {
    apiKey,
    baseURL = 'https://api.openai.com/v1',
    model = defaultModel,
    temperature = 0.2,
    forceTools = false,
    forceTool,
  } = options

  const openai = new OpenAI({ apiKey, baseURL })

  return async (messages: AgentMessage[], toolChain?: ToolChainInterface) => {
    const completionOptions: OpenAI.ChatCompletionCreateParams = {
      model,
      messages,
      temperature,
    }

    if (toolChain) {
      completionOptions.tools = ToolChain.toOpenAI(toolChain.tools)

      if (forceTool) {
        completionOptions.tool_choice = {
          type: 'function',
          function: {
            name: forceTool,
          },
        }
      } else if (forceTools) {
        completionOptions.tool_choice = 'required'
      }
    }

    const completion = await openai.chat.completions.create(completionOptions)

    return completion.choices[0].message
  }
}

/**
 * Gives you a function that runs a tool chain,
 * until it runs one of its stop tools.
 */
export function createFreeRunner(options: {
  apiKey: string
  baseURL?: string
  model?: string
  temperature?: number
  systemMessage: OpenAISystemMessage
  chatHistory: AgentMessage[]
  toolChain: ToolChainInterface
}) {
  const {
    apiKey,
    baseURL,
    model,
    temperature,
    systemMessage,
    chatHistory,
    toolChain
  } = options

  const completer = createCompleter({ apiKey, baseURL, model, temperature, forceTools: true })

  return async function* runner(): AsyncGenerator<AgentMessage> {
    const messageWithToolCalls = await completer([systemMessage, ...chatHistory], toolChain)

    chatHistory.push(messageWithToolCalls)
    yield messageWithToolCalls

    for await (const toolMessage of toolChain.run(messageWithToolCalls)) {
      chatHistory.push(toolMessage)
      yield toolMessage
    }

    if (!toolChain.mustStop()) {
      yield * runner()
    }
  }
}

/**
 * Gives you a function that runs a tool chain,
 * in the order provided.
 */
export function createStraightRunner(options: {
  apiKey: string
  baseURL?: string
  model?: string
  temperature?: number
  systemMessage: OpenAISystemMessage
  chatHistory: AgentMessage[]
  toolChain: ToolChainInterface
}) {
  const {
    apiKey,
    baseURL,
    model,
    temperature,
    systemMessage,
    chatHistory,
    toolChain
  } = options
  return async function* runner(): AsyncGenerator<AgentMessage> {
    for (const tool of toolChain.tools) {
      const completer = createCompleter({ apiKey, baseURL, model, temperature, forceTool: tool.name })
      const messageWithToolCalls = await completer([systemMessage, ...chatHistory], toolChain)

      chatHistory.push(messageWithToolCalls)
      yield messageWithToolCalls

      for await (const toolMessage of toolChain.run(messageWithToolCalls)) {
        chatHistory.push(toolMessage)
        yield toolMessage
      }
    }
  }
}

export async function readToolStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  handler: (message: AgentMessage) => void,
  callback?: () => void,
) {
  const decoder = new TextDecoder('utf-8')

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      if (callback) {
        callback()
      }
      break
    }

    const rawMessagesString = decoder.decode(value)
    const messagesJsonString = `[${rawMessagesString.replace(/}\s*?{/g, '},{')}]` // Why no valid json? WHY?!
    const messages = JSON.parse(messagesJsonString)

    for (const message of messages) {
      handler(message)
    }
  }
}