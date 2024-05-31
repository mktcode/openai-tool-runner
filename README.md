# LLM Tool Runner (experimental)

It's just a wrapper around the OpenAI API but technically you could replace the `baseURL` and try it with Ollama or whatever. I currently prefer the big, commercial models and I hope everyone adapts to OpenAI's API design. It doesn't use it's assistants API though, because that felt a bit too company/product specific. I just needed to run tools in sequence, so they can build on one another, without the assistant asking all the time for confirmation or things it could easily find online and so on. The OpenAI docs only explain the "Input -> Tool(s) -> Response" flow but I want "Input -> Tool(s) -> Tool(s) -> ... -> Response". I'm sharing here just a few lines of code that work for me.

Maybe I will add more functionality but for now it's just this:

- A completer that runs a completion. You can force it to use tools.
- A runner that creates a completer with forced tool use, runs it in a loop and stops when certain tools you sepcify are used.

So the runner will never return a normal answer but only tool calls instead. I found that to be handy when recursivley continuing the completion process and I just give it a tool like "provide_final_answer" and display that input as an answer in the frontend. Then it's up to your prompt engineering in the system instructions, to make it generate a useful flow of tool calls. Can be infinite too, like "Use your tools to browse social media and constantly comment on stuff.". I didn't try such things yet but theoretically it should only stop when the context window is full. No error handling yet.

## Installation

```bash
npm install llm-tool-runner

# gpt-4o otherwise, overwrite in createCompleter/Runner
export LLM_TOOL_RUNNER_DEFAULT_MODEL="gpt-3.5-turbo"
```

## Usage

### createCompleter ([Docs](https://github.com/mktcode/website/blob/a22396f1006cb3db1273ab5c6e3dd9b01a82d4f9/server/utils/llm-tool-runner/utils.ts#L14-L55))

```ts
import { createCompleter } from 'llm-tool-runner/utils'

const completer = createCompleter({ apiKey: '...' })
const response = await completer({ messages, toolChain })
```

### createRunner ([Docs](https://github.com/mktcode/website/blob/a22396f1006cb3db1273ab5c6e3dd9b01a82d4f9/server/utils/llm-tool-runner/utils.ts#L57-L95))

```ts
import { createRunner } from 'llm-tool-runner/utils'

const runner = createRunner({ systemMessage, chatHistory, toolChain })

for await (const message of runner()) {
  console.info(message)
}
```

### createSystemMessage ([Docs](https://github.com/mktcode/website/blob/a22396f1006cb3db1273ab5c6e3dd9b01a82d4f9/server/utils/llm-tool-runner/utils.ts#L4-L12))

```ts
import { createSystemMessage } from 'llm-tool-runner/utils'

const systemMessage = createSystemMessage(`You are...`)
```

### ToolChain ([Docs](https://github.com/mktcode/website/blob/a22396f1006cb3db1273ab5c6e3dd9b01a82d4f9/server/utils/llm-tool-runner/toolchain.ts))

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

#### Define a Tool ([Docs](https://github.com/mktcode/website/blob/a22396f1006cb3db1273ab5c6e3dd9b01a82d4f9/server/utils/llm-tool-runner/schema.ts#L45-L51))

```ts
import type { Tool } from 'llm-tool-runner/schema'

export class WebSearchTool implements Tool {
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

### Nested "Agents"

```ts
import type { AgentMessage, Tool } from 'llm-tool-runner/schema'
import { createCompleter, createRunner, createSystemMessage } from 'llm-tool-runner/utils'
import { PlanResearchTool, ProvideFinalAnswerTool, WebSearchTool } from './your-tools'

export class ResearchAgentTool implements Tool {
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

    const chatHistory = [...this.chatHistory, {
      role: 'user',
      content: args.prompt,
    }]
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
