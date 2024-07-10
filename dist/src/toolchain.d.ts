import type OpenAI from 'openai';
import type { OpenAIAssistantMessage, OpenAIToolMessage, ToolInterface, ToolChainInterface } from './schema';
export declare class ToolChain implements ToolChainInterface {
    tools: ToolInterface[];
    stopWhen: ToolInterface[];
    toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
    toolMessages: OpenAIToolMessage[];
    constructor(options: {
        tools: ToolInterface[];
        stopWhen?: ToolInterface[];
    });
    run(message: OpenAIAssistantMessage): AsyncGenerator<{
        content: string;
        role: "tool";
        tool_call_id: string;
    }, void, unknown>;
    mustStop(): boolean;
    runTool(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): Promise<OpenAIToolMessage>;
    static toOpenAI(tools: ToolInterface[]): {
        type: "function";
        function: {
            name: string;
            description: string;
            parameters: import("zod-to-json-schema").JsonSchema7Type & {
                $schema?: string | undefined;
                definitions?: {
                    [key: string]: import("zod-to-json-schema").JsonSchema7Type;
                } | undefined;
            };
        };
    }[];
    getToolInput(toolName: string): Record<string, any> | null;
}
