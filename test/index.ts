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
        topic: z.string(),
        setup: z.string(),
        punchline: z.string()
    })

    async run(args: z.infer<typeof this.inputSchema>): Promise<z.infer<typeof this.outputSchema>> {
        return {
            topic: args.topic,
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
    try {
        console.assert(toolChain.tools.length === 1, 'Expected one tool in the tool chain.')
        console.assert(toolChain.stopWhen.length === 0, 'Expected no stop tools in the tool chain.')
        console.assert(toolChain.toolCalls.length === 0, 'Expected no tool calls in the tool chain before running.')
        console.assert(toolChain.toolMessages.length === 0, 'Expected no tool messages in the tool chain before running.')

        const runner = createStraightRunner({
            apiKey,
            systemMessage: createSystemMessage('You are a funny assistant.'),
            chatHistory: [],
            toolChain,
            temperature: 0.5
        })
    
        for await (const _ of runner()) {
            console.info('Receving message...')
        }

        console.assert(toolChain.toolCalls.length === 1, 'Expected one tool call in the tool chain after running.')
        console.assert(toolChain.toolMessages.length === 1, 'Expected one tool message in the tool chain after running.')

        console.info('Done!')
    } catch (error) {
        console.error('An error occurred:', error)
    }
}

main()