"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentMessageSchema = exports.openaiToolMessage = exports.openaiAssistantMessage = exports.openaiUserMessage = exports.openaiSystemMessage = exports.defaultModel = void 0;
const zod_1 = require("zod");
exports.defaultModel = process.env.LLM_TOOL_RUNNER_DEFAULT_MODEL || 'gpt-4o';
exports.openaiSystemMessage = zod_1.z.object({
    role: zod_1.z.enum(['system']),
    content: zod_1.z.string(),
    name: zod_1.z.string().optional(),
});
exports.openaiUserMessage = zod_1.z.object({
    role: zod_1.z.enum(['user']),
    content: zod_1.z.string(),
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
exports.agentMessageSchema = zod_1.z.union([exports.openaiSystemMessage, exports.openaiUserMessage, exports.openaiAssistantMessage, exports.openaiToolMessage]);
//# sourceMappingURL=schema.js.map