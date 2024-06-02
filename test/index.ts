import { z } from 'zod'
import { createStraightRunner, createSystemMessage, ToolChain, ToolInterface } from '../src'

const apiKey = process.env.OPENAI_API_KEY as string

if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required')
}

class JokeTool implements ToolInterface {
    name = 'joke'
    description = 'A tool that tells jokes.'
    inputSchema = z.object({
        topic: z.string()
    })
    outputSchema = z.object({
        setup: z.string(),
        punchline: z.string()
    })

    async run(args: z.infer<typeof this.inputSchema>): Promise<z.infer<typeof this.outputSchema>> {
        console.info('Running joke tool with args:', args)
        return {
            setup: 'Why did the chicken cross the road?',
            punchline: 'To get to the other side!'
        }
    }
}

const toolChain = new ToolChain({
    tools: [
        new JokeTool()
    ]
});

async function main() {
    const runner = createStraightRunner({
        apiKey,
        systemMessage: createSystemMessage('You are a helpful assistant.'),
        chatHistory: [],
        toolChain
    })

    for await (const message of runner()) {
        console.log('Message:', message)
    }
}

main()