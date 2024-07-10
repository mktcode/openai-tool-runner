"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentMessage = exports.openaiToolMessage = exports.openaiAssistantMessage = exports.openaiUserMessage = exports.openaiUserMessageContentItem = exports.openaiUserMessageContentItemImage = exports.openaiUserMessageContentItemText = exports.openaiSystemMessage = exports.defaultModel = void 0;
const zod_1 = require("zod");
exports.defaultModel = process.env.OPENAI_TOOL_RUNNER_DEFAULT_MODEL || 'gpt-4o';
exports.openaiSystemMessage = zod_1.z.object({
    role: zod_1.z.enum(['system']),
    content: zod_1.z.string(),
    name: zod_1.z.string().optional(),
});
exports.openaiUserMessageContentItemText = zod_1.z.object({
    type: zod_1.z.enum(['text']),
    text: zod_1.z.string(),
});
exports.openaiUserMessageContentItemImage = zod_1.z.object({
    type: zod_1.z.enum(['image_url']),
    image_url: zod_1.z.object({
        url: zod_1.z.string(),
        detail: zod_1.z.enum(['low', 'high', 'auto']),
    }),
});
exports.openaiUserMessageContentItem = zod_1.z.union([exports.openaiUserMessageContentItemText, exports.openaiUserMessageContentItemImage]);
exports.openaiUserMessage = zod_1.z.object({
    role: zod_1.z.enum(['user']),
    content: zod_1.z.string().or(zod_1.z.array(exports.openaiUserMessageContentItem)),
    name: zod_1.z.string().optional(),
});
exports.openaiAssistantMessage = zod_1.z.object({
    role: zod_1.z.enum(['assistant']),
    content: zod_1.z.string().optional().nullable(),
    name: zod_1.z.string().optional(),
    tool_calls: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        type: zod_1.z.enum(['function']),
        function: zod_1.z.object({
            name: zod_1.z.string(),
            arguments: zod_1.z.string(),
        }),
    })).optional(),
});
exports.openaiToolMessage = zod_1.z.object({
    role: zod_1.z.enum(['tool']),
    content: zod_1.z.string(),
    tool_call_id: zod_1.z.string(),
});
exports.agentMessage = zod_1.z.union([exports.openaiSystemMessage, exports.openaiUserMessage, exports.openaiAssistantMessage, exports.openaiToolMessage]);
//# sourceMappingURL=schema.js.map