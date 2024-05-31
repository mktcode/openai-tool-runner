import type OpenAI from 'openai'
import zodToJsonSchema from 'zod-to-json-schema'
import type { OpenAIAssistantMessage, OpenAIToolMessage, ToolInterface, ToolChainInterface } from './schema'

export class ToolChain implements ToolChainInterface {
  tools: ToolInterface[]
  stopWhen: ToolInterface[]
  toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] = []
  toolMessages: OpenAIToolMessage[] = []

  constructor(options: { tools: ToolInterface[], stopWhen?: ToolInterface[] }) {
    const { tools, stopWhen } = options

    this.tools = tools
    this.stopWhen = stopWhen || []
  }

  async *run(message: OpenAIAssistantMessage) {
    this.toolCalls = message.tool_calls || []
    this.toolMessages = []

    for (const toolCall of this.toolCalls) {
      const toolMessage = await this.runTool(toolCall)
      this.toolMessages.push(toolMessage)
      yield toolMessage
    }
  }

  mustStop() {
    return this.toolCalls.some(toolCall => this.stopWhen.some(tool => tool.name === toolCall.function.name))
  }

  async runTool(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): Promise<OpenAIToolMessage> {
    const tool = this.tools.find(tool => tool.name === toolCall.function.name)

    if (!tool) {
      throw new Error(`Tool not found: ${toolCall.function.name}`)
    }

    const args = JSON.parse(toolCall.function.arguments)
    const input = tool.inputSchema.parse(args)
    const result = await tool.run(input)

    return {
      role: 'tool',
      content: JSON.stringify(result),
      tool_call_id: toolCall.id,
    }
  }

  static toOpenAI(tools: ToolInterface[]) {
    type FunctionString = 'function'
    const type: FunctionString = 'function'

    return tools.map((agent) => {
      return {
        type,
        function: {
          name: agent.name,
          description: agent.description,
          parameters: zodToJsonSchema(agent.inputSchema),
        },
      }
    })
  }

  getToolInput(toolName: string): Record<string, any> | null {
    const args = this.toolCalls.find(toolCall => toolCall.function.name === toolName)?.function.arguments

    if (args) {
      return JSON.parse(args)
    }
    else {
      return null
    }
  }
}
