import OpenAI from 'openai';
import { type AgentMessage, type OpenAISystemMessage, type ToolChainInterface } from './schema';
/**
 * Just to make code a bit more readable. I didn't need createUserMessage, etc. yet.
 */
export declare function createSystemMessage(content: string): OpenAISystemMessage;
/**
 * Gives you a function that runs a single LLM completion.
 * Has a little flag to force the use of tools.
 * Returns the completion message, with tool calls and all.
 */
export declare function createCompleter(options: {
    apiKey: string;
    baseURL?: string;
    model?: string;
    temperature?: number;
    forceTools?: boolean;
}): (messages: AgentMessage[], toolChain?: ToolChainInterface) => Promise<OpenAI.Chat.Completions.ChatCompletionMessage>;
/**
 * Gives you a function that runs a tool chain,
 * until it runs one of its stop tools.
 */
export declare function createRunner(options: {
    apiKey: string;
    baseURL?: string;
    model?: string;
    systemMessage: OpenAISystemMessage;
    chatHistory: AgentMessage[];
    toolChain: ToolChainInterface;
}): () => AsyncGenerator<AgentMessage>;
export declare function readToolStream(reader: ReadableStreamDefaultReader<Uint8Array>, handler: (message: AgentMessage) => void, callback?: () => void): Promise<void>;
