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
        const runner = createStraightRunner({
            apiKey,
            systemMessage: createSystemMessage('You are a funny assistant.'),
            chatHistory: [],
            toolChain,
            temperature: 0.5
        })
    
        for await (const message of runner()) {
            console.log('Receving message...')
        }
    
        console.log('Done!')
    } catch (error) {
        console.error('An error occurred:', error)
    }
}

main()