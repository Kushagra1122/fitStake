"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeFailSchema = exports.executeSuccessSchema = exports.precheckFailSchema = exports.precheckSuccessSchema = exports.abilityParamsSchema = void 0;
const zod_1 = require("zod");
// Input parameters for the auto-stake ability
exports.abilityParamsSchema = zod_1.z.object({
    challengeId: zod_1.z.number().positive(),
    userAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    contractAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    stakeAmount: zod_1.z.string() // Wei amount as string
});
// Precheck success response
exports.precheckSuccessSchema = zod_1.z.object({
    validated: zod_1.z.boolean(),
    challengeId: zod_1.z.number(),
    stakeAmount: zod_1.z.string(),
    message: zod_1.z.string().optional()
});
// Precheck fail response
exports.precheckFailSchema = zod_1.z.object({
    error: zod_1.z.string(),
    reason: zod_1.z.string()
});
// Execute success response
exports.executeSuccessSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    transactionHash: zod_1.z.string(),
    challengeId: zod_1.z.number(),
    userAddress: zod_1.z.string(),
    stakedAmount: zod_1.z.string(),
    blockNumber: zod_1.z.number().optional(),
    message: zod_1.z.string().optional()
});
// Execute fail response
exports.executeFailSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    error: zod_1.z.string(),
    reason: zod_1.z.string()
});
//# sourceMappingURL=schemas.js.map