# OpenAI Tool Runner (experimental)

![openai-tool-runner](https://github.com/mktcode/openai-tool-runner/assets/6792578/8f435499-4c66-45e0-b0c2-562279f0daee)

It's just a wrapper around the OpenAI API but technically you could replace the `baseURL` and try it with Ollama and a model that understands the OpenAI tool format. I just needed to run tools in sequence, so they can build on one another, without the assistant generating an answer after one set of tool calls. The OpenAI docs only explain the "Input -> Tool(s) -> Response" flow but I want "Input -> Tool(s) -> Tool(s) -> ... -> Response". I'm sharing here just a few lines of code that work for me.

- A completer that runs a completion. You can force it to generate tool calls.
- A "free" runner that runs tools, picked by the LLM, until a certain tool has been used.
- A "straight" runner that forces the tools to be called in the order provided in the toolchain.

So the runners will never return a normal answer but only tool calls instead. I found that to be handy when recursively continuing the completion process and I just give it a tool like "provide_final_answer" and display that input in the frontend. Then it's up to your prompt engineering, to make it generate a useful flows of tool calls. Can be infinite too, like "Use your tools to browse social media and constantly comment on stuff.". I didn't try such things yet but theoretically it should only stop when the context window is full.

I'm testing this mostly with GPT4o btw. Can't say a lot about 3.5 performance or any other closed or open model.

## Installation

Use this only to try things out. There's no error handling or anything that would make this production ready. It's not much code, so you could also just copy paste it into your project and go on from there.

```bash
npm install openai-tool-runner

export OPENAI_TOOL_RUNNER_DEFAULT_MODEL="gpt-3.5-turbo"
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

(Doesn't do anything... Just for readability.)

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

I didn't want to use langchain but this is not that much different I guess. Just worse. You can wrap a langchain tool in it though. :D

My initial idea was to make tool responses multi-step as well, using generator functions, different form langchain. Had that working (might come back) but it died a refactoring death. Has to do with frontend as well.

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

## Streaming

Instead of streaming individual tokens, you can only stream messages. My theory is that token streaming will be irrelevant anyways, once the models are fast enough and it will be more a frontend animation. Streaming the things that actually DO take time, like API calls etc., is more important I guess. The runners are async generators, which means they yield messages (assistant message with tool calls and tool responses) as they come in, instead of just returning a single result.

I currently use Nuxt 3 for my frontend, which uses h3 and it has this handy function [`sendIterable`](https://h3.unjs.io/utils/response#senditerableevent-iterable). You can pass it the runner. Not sure how to do it in Next.js or other frameworks but there should be similiar solutions. Here's part of an endpoint in my application:

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
