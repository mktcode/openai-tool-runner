import OpenAI from 'openai'
import { defaultModel, type AgentMessage, type OpenAISystemMessage, type ToolChainInterface } from './schema'
import { ToolChain } from './toolchain'

/**
 * Just to make code a bit more readable. I didn't need createUserMessage, etc. yet.
 */
export function createSystemMessage(content: string): OpenAISystemMessage {
  return {
    role: 'system',
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
}) {
  const {
    apiKey,
    baseURL = 'https://api.openai.com/v1',
    model = defaultModel,
    temperature = 0.2,
    forceTools = false
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

      if (forceTools) {
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
export function createRunner(options: {
  apiKey: string
  baseURL?: string
  model?: string
  systemMessage: OpenAISystemMessage
  chatHistory: AgentMessage[]
  toolChain: ToolChainInterface
}) {
  const {
    apiKey,
    baseURL,
    model,
    systemMessage,
    chatHistory,
    toolChain
  } = options

  const completer = createCompleter({ apiKey, baseURL, model, forceTools: true })

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
