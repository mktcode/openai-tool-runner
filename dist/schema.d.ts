import type OpenAI from 'openai';
import { z } from 'zod';
export declare const defaultModel: string;
export declare const openaiSystemMessage: z.ZodObject<{
    role: z.ZodEnum<["system"]>;
    content: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    role: "system";
    name?: string | undefined;
}, {
    content: string;
    role: "system";
    name?: string | undefined;
}>;
export type OpenAISystemMessage = z.infer<typeof openaiSystemMessage>;
export declare const openaiUserMessageContentItemText: z.ZodObject<{
    type: z.ZodEnum<["text"]>;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "text";
    text: string;
}, {
    type: "text";
    text: string;
}>;
export declare const openaiUserMessageContentItemImage: z.ZodObject<{
    type: z.ZodEnum<["image_url"]>;
    image_url: z.ZodObject<{
        url: z.ZodString;
        detail: z.ZodEnum<["low", "high", "auto"]>;
    }, "strip", z.ZodTypeAny, {
        detail: "auto" | "high" | "low";
        url: string;
    }, {
        detail: "auto" | "high" | "low";
        url: string;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "image_url";
    image_url: {
        detail: "auto" | "high" | "low";
        url: string;
    };
}, {
    type: "image_url";
    image_url: {
        detail: "auto" | "high" | "low";
        url: string;
    };
}>;
export declare const openaiUserMessageContentItem: z.ZodUnion<[z.ZodObject<{
    type: z.ZodEnum<["text"]>;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "text";
    text: string;
}, {
    type: "text";
    text: string;
}>, z.ZodObject<{
    type: z.ZodEnum<["image_url"]>;
    image_url: z.ZodObject<{
        url: z.ZodString;
        detail: z.ZodEnum<["low", "high", "auto"]>;
    }, "strip", z.ZodTypeAny, {
        detail: "auto" | "high" | "low";
        url: string;
    }, {
        detail: "auto" | "high" | "low";
        url: string;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "image_url";
    image_url: {
        detail: "auto" | "high" | "low";
        url: string;
    };
}, {
    type: "image_url";
    image_url: {
        detail: "auto" | "high" | "low";
        url: string;
    };
}>]>;
export type OpenAIUserMessageContentItem = z.infer<typeof openaiUserMessageContentItem>;
export declare const openaiUserMessage: z.ZodObject<{
    role: z.ZodEnum<["user"]>;
    content: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodEnum<["text"]>;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "text";
        text: string;
    }, {
        type: "text";
        text: string;
    }>, z.ZodObject<{
        type: z.ZodEnum<["image_url"]>;
        image_url: z.ZodObject<{
            url: z.ZodString;
            detail: z.ZodEnum<["low", "high", "auto"]>;
        }, "strip", z.ZodTypeAny, {
            detail: "auto" | "high" | "low";
            url: string;
        }, {
            detail: "auto" | "high" | "low";
            url: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "image_url";
        image_url: {
            detail: "auto" | "high" | "low";
            url: string;
        };
    }, {
        type: "image_url";
        image_url: {
            detail: "auto" | "high" | "low";
            url: string;
        };
    }>]>, "many">]>;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string | ({
        type: "text";
        text: string;
    } | {
        type: "image_url";
        image_url: {
            detail: "auto" | "high" | "low";
            url: string;
        };
    })[];
    role: "user";
    name?: string | undefined;
}, {
    content: string | ({
        type: "text";
        text: string;
    } | {
        type: "image_url";
        image_url: {
            detail: "auto" | "high" | "low";
            url: string;
        };
    })[];
    role: "user";
    name?: string | undefined;
}>;
export type OpenAIUserMessage = z.infer<typeof openaiUserMessage>;
export declare const openaiAssistantMessage: z.ZodObject<{
    role: z.ZodEnum<["assistant"]>;
    content: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodOptional<z.ZodString>;
    tool_calls: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["function"]>;
        function: z.ZodObject<{
            name: z.ZodString;
            arguments: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            arguments: string;
        }, {
            name: string;
            arguments: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        function: {
            name: string;
            arguments: string;
        };
        type: "function";
        id: string;
    }, {
        function: {
            name: string;
            arguments: string;
        };
        type: "function";
        id: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    role: "assistant";
    name?: string | undefined;
    content?: string | null | undefined;
    tool_calls?: {
        function: {
            name: string;
            arguments: string;
        };
        type: "function";
        id: string;
    }[] | undefined;
}, {
    role: "assistant";
    name?: string | undefined;
    content?: string | null | undefined;
    tool_calls?: {
        function: {
            name: string;
            arguments: string;
        };
        type: "function";
        id: string;
    }[] | undefined;
}>;
export type OpenAIAssistantMessage = z.infer<typeof openaiAssistantMessage>;
export declare const openaiToolMessage: z.ZodObject<{
    role: z.ZodEnum<["tool"]>;
    content: z.ZodString;
    tool_call_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    role: "tool";
    tool_call_id: string;
}, {
    content: string;
    role: "tool";
    tool_call_id: string;
}>;
export type OpenAIToolMessage = z.infer<typeof openaiToolMessage>;
export declare const agentMessage: z.ZodUnion<[z.ZodObject<{
    role: z.ZodEnum<["system"]>;
    content: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    role: "system";
    name?: string | undefined;
}, {
    content: string;
    role: "system";
    name?: string | undefined;
}>, z.ZodObject<{
    role: z.ZodEnum<["user"]>;
    content: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodEnum<["text"]>;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "text";
        text: string;
    }, {
        type: "text";
        text: string;
    }>, z.ZodObject<{
        type: z.ZodEnum<["image_url"]>;
        image_url: z.ZodObject<{
            url: z.ZodString;
            detail: z.ZodEnum<["low", "high", "auto"]>;
        }, "strip", z.ZodTypeAny, {
            detail: "auto" | "high" | "low";
            url: string;
        }, {
            detail: "auto" | "high" | "low";
            url: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "image_url";
        image_url: {
            detail: "auto" | "high" | "low";
            url: string;
        };
    }, {
        type: "image_url";
        image_url: {
            detail: "auto" | "high" | "low";
            url: string;
        };
    }>]>, "many">]>;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string | ({
        type: "text";
        text: string;
    } | {
        type: "image_url";
        image_url: {
            detail: "auto" | "high" | "low";
            url: string;
        };
    })[];
    role: "user";
    name?: string | undefined;
}, {
    content: string | ({
        type: "text";
        text: string;
    } | {
        type: "image_url";
        image_url: {
            detail: "auto" | "high" | "low";
            url: string;
        };
    })[];
    role: "user";
    name?: string | undefined;
}>, z.ZodObject<{
    role: z.ZodEnum<["assistant"]>;
    content: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodOptional<z.ZodString>;
    tool_calls: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["function"]>;
        function: z.ZodObject<{
            name: z.ZodString;
            arguments: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            arguments: string;
        }, {
            name: string;
            arguments: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        function: {
            name: string;
            arguments: string;
        };
        type: "function";
        id: string;
    }, {
        function: {
            name: string;
            arguments: string;
        };
        type: "function";
        id: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    role: "assistant";
    name?: string | undefined;
    content?: string | null | undefined;
    tool_calls?: {
        function: {
            name: string;
            arguments: string;
        };
        type: "function";
        id: string;
    }[] | undefined;
}, {
    role: "assistant";
    name?: string | undefined;
    content?: string | null | undefined;
    tool_calls?: {
        function: {
            name: string;
            arguments: string;
        };
        type: "function";
        id: string;
    }[] | undefined;
}>, z.ZodObject<{
    role: z.ZodEnum<["tool"]>;
    content: z.ZodString;
    tool_call_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    role: "tool";
    tool_call_id: string;
}, {
    content: string;
    role: "tool";
    tool_call_id: string;
}>]>;
export type AgentMessage = z.infer<typeof agentMessage>;
export interface ToolInterface {
    name: string;
    description: string;
    inputSchema: z.AnyZodObject;
    outputSchema: z.AnyZodObject;
    run: (args: any) => Promise<any>;
}
export interface ToolChainInterface {
    tools: ToolInterface[];
    stopWhen: ToolInterface[];
    toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
    toolMessages: OpenAIToolMessage[];
    run: (message: OpenAIAssistantMessage) => AsyncGenerator<OpenAIToolMessage>;
    mustStop: () => boolean;
    runTool: (toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) => Promise<OpenAIToolMessage>;
}
