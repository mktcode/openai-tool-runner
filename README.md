![logo](/assets/logo.png)

# OpenAI Tool Runner (experimental)

This package is a wrapper around the OpenAI API, allowing you to replace the baseURL and use it with Ollama and compatible models. I only tested it with GPT-4o.

It enables running tools in longer sequences without generating a response after each set of tool calls, unlike the standard "Input -> Tool(s) -> Response" flow described in the OpenAI documentation. Instead, it supports "Input -> Tool(s) -> Tool(s) -> ... -> Response." and even the response is actually a tool call.

- **Completer**: Runs a completion with **forced tool calls**.
- **Free Runner**: Executes tools chosen by the LLM until a specific tool is used (or indefinitely).
- **Straight Runner**: Enforces a strict order of tool calls.

In the free runner you define "stop tools" which end the chain of tool calls. You can provide a tool like "final_answer" and display it in a frontend accordingly. You can also choose not to provide a stop tool and let the runner run indefinitely.

The straight runner is more like a fixed workflow.

> [!CAUTION]
> Use this only for experimentation. There is no error handling or other features to make it production-ready. Since it's a small amount of code, you can easily copy and paste it into your project and continue from there.

![animation](/assets/animation.gif)

## Installation

```sh
npm install openai-tool-runner

export OPENAI_TOOL_RUNNER_DEFAULT_MODEL="gpt-4-turbo"
# gpt-4o otherwise, overwrite in createCompleter/Runner
```

## Usage

### createCompleter

```ts
import { createCompleter } from 'openai-tool-runner'

const completer = createCompleter({ apiKey: '...' })
const response = await completer({ messages, toolChain })
```

### createFreeRunner

```ts
import { createFreeRunner, ToolChain } from 'openai-tool-runner'

const toolChain = new ToolChain({
  tools: [
    planResearchTool,
    webSearchTool,
    provideFinalAnswerTool,
    askUserTool,
  ],
  stopWhen: [
    provideFinalAnswerTool,
    askUserTool,
  ]
})

const runner = createFreeRunner({ systemMessage, chatHistory, toolChain })

for await (const message of runner()) {
  console.info(message)
}
```

### createStraightRunner

```ts
import { createStraightRunner, ToolChain } from 'openai-tool-runner'

const toolChain = new ToolChain({
  tools: [
    searchTool,
    analyzeTool,
    provideFinalAnswerTool,
  ],
})

const runner = createStraightRunner({ systemMessage, chatHistory, toolChain })

for await (const message of runner()) {
  console.info(message)
}
```

### create...Message

```ts
import { createSystemMessage, createUserMessage } from 'openai-tool-runner'

const systemMessage = createSystemMessage(`You are...`)
const userMessage = createUserMessage(`What is...`)
```

### ToolChain

```ts
const provideFinalAnswerTool = new ProvideFinalAnswerTool()
const webSearchTool = new WebSearchTool(tavilyApiKey)

const toolChain = new ToolChain({
  tools: [
    webSearchTool,
    provideFinalAnswerTool,
  ],
  stopWhen: [
    provideFinalAnswerTool,
  ]
})

const response = await completer({ messages, toolChain })
```

#### Define a Tool

I chose not to use LangChain, but this isn't very different—just less sophisticated. You can still wrap a LangChain tool in it though.

My initial idea was to make tool responses multi-step using generator functions, unlike LangChain. I had it working initially, but removed it during refactoring. This also involves some frontend considerations.

```ts
import type { ToolInterface } from 'openai-tool-runner'

export class WebSearchTool implements ToolInterface {
  name = 'web_search'
  description = 'Use this tool whenever you need to find information online to become more confident in your answers. Especially good for local information and recent events. You can use this tool mutliple times simultaneously, each call with multiple queries.'
  inputSchema = z.object({
    queries: z.array(z.string()).describe('The queries to search for.'),
  })

  outputSchema = z.object({
    results: z.array(z.any()).describe('The search results.'),
  })

  constructor(private tavilyApiKey: string) {}

  async run(args: z.infer<typeof this.inputSchema>): Promise<z.infer<typeof this.outputSchema>> {
    const { queries } = args

    const searchTool = new TavilySearchResults({
      maxResults: 1,
      apiKey: this.tavilyApiKey,
    })

    const results: string[] = []

    for (const query of queries) {
      results.push(JSON.parse(await searchTool.invoke(query)))
    }

    return { results }
  }
}
```

### Nested Agents

Using a free runner as the main chatbot, with additional free and straight runners as tools, could yield interesting results.

```ts
import { type AgentMessage, type ToolInterface, createCompleter, createRunner, createSystemMessage, createUserMessage } from 'openai-tool-runner'
import { PlanResearchTool, ProvideFinalAnswerTool, WebSearchTool } from './your-tools'

export class ResearchAgentTool implements ToolInterface {
  name = 'research_agent'
  description = 'Use this tool whenever you need to research something online. Especially useful for...'
  inputSchema = z.object({
    prompt: z.string().describe('The prompt for the research agent.'),
  })

  outputSchema = z.object({
    result: z.string().describe('The final result of the research.'),
  })

  constructor(
    private tavilyApiKey: string,
    private chatHistory: AgentMessage[] = [],
  ) {}

  async run(args: z.infer<typeof this.inputSchema>): Promise<z.infer<typeof this.outputSchema>> {
    const systemMessage = createSystemMessage(`You are a research agent. You...`)
    const planResearchTool = new PlanResearchTool()
    const provideFinalAnswerTool = new ProvideFinalAnswerTool()
    const webSearchTool = new WebSearchTool(tavilyApiKey)
    const toolChain = new ToolChain({
      tools: [
        planResearchTool,
        webSearchTool,
        provideFinalAnswerTool,
      ],
      stopWhen: [
        provideFinalAnswerTool,
      ]
    })

    const chatHistory = [...this.chatHistory, createUserMessage(args.prompt)]
    const runner = createRunner({ systemMessage, chatHistory, toolChain })
    const agentMessages: AgentMessage[] = []

    for await (const message of runner()) {
      agentMessages.push(message)
    }

    const result = agentMessages[agentMessages.length - 1].content

    return { result }
  }
}
```

# Streaming

Instead of streaming individual tokens, you can stream entire messages. As models become faster, token streaming may become irrelevant and primarily a frontend animation. Streaming actions that take significant time, like API calls, is more important. The runners are async generators, meaning they yield messages (including tool calls and responses) as they arrive, rather than returning a single result.

I use Nuxt 3 for my frontend, which utilizes h3 and its handy function [`sendIterable`](https://h3.unjs.io/utils/response#senditerableevent-iterable). You can pass the runner to it. For Next.js or other frameworks, there should be similar solutions. Here's a part of an endpoint in my application:

```ts
export default defineEventHandler(async (event) => {
  const { chatHistory }: { chatHistory: AgentMessage[] } = await readBody(event)
  const { openaiApiKey, tavilyApiKey } = useRuntimeConfig(event)

  const systemMessage = createSystemMessage(`You are ...

  Today's date: ${new Date().toISOString().slice(0, 16)}
  Your knowledge cutoff: 2023-10`)

  const webSearchTool = new WebSearchTool(tavilyApiKey)
  const askWebsiteTool = new AskWebsiteTool(openaiApiKey)
  const provideFinalAnswerTool = new ProvideFinalAnswerTool()

  const toolChain = new ToolChain({
    tools: [
      webSearchTool,
      askWebsiteTool,
      provideFinalAnswerTool,
    ],
    stopWhen: [
      provideFinalAnswerTool,
    ]
  })

  return sendIterable(event, createFreeRunner({
    apiKey: openaiApiKey,
    systemMessage,
    chatHistory,
    toolChain
  }))
})
```

You can read the messages using the provided `readToolStream` function:

```ts
import { readToolStream } from 'openai-tool-runner'

let loading = true
const chatHistory = []

const stream = await fetch('/api/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chatHistory }),
}).then((res) => res.body.getReader())

readToolStream(stream, (message) => {
  chatHistory.push(message)
}, () => loading = false)
```

# Development

```sh
git clone https://github.com/mktcode/openai-tool-runner
cd openai-tool-runner
npm i
```

## Testing

This is just a script I used to test the tool runner. It's not a real test suite. Coming soon. Maybe.

```sh
export OPENAI_API_KEY="..."
npm run test
```