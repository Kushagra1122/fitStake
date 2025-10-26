import { z } from 'zod';
export declare const abilityParamsSchema: z.ZodObject<{
    challengeId: z.ZodNumber;
    userAddress: z.ZodString;
    contractAddress: z.ZodString;
    stakeAmount: z.ZodString;
}, "strip", z.ZodTypeAny, {
    challengeId: number;
    userAddress: string;
    contractAddress: string;
    stakeAmount: string;
}, {
    challengeId: number;
    userAddress: string;
    contractAddress: string;
    stakeAmount: string;
}>;
export declare const precheckSuccessSchema: z.ZodObject<{
    validated: z.ZodBoolean;
    challengeId: z.ZodNumber;
    stakeAmount: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    challengeId: number;
    stakeAmount: string;
    validated: boolean;
    message?: string | undefined;
}, {
    challengeId: number;
    stakeAmount: string;
    validated: boolean;
    message?: string | undefined;
}>;
export declare const precheckFailSchema: z.ZodObject<{
    error: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error: string;
    reason: string;
}, {
    error: string;
    reason: string;
}>;
export declare const executeSuccessSchema: z.ZodObject<{
    success: z.ZodBoolean;
    transactionHash: z.ZodString;
    challengeId: z.ZodNumber;
    userAddress: z.ZodString;
    stakedAmount: z.ZodString;
    blockNumber: z.ZodOptional<z.ZodNumber>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    challengeId: number;
    userAddress: string;
    success: boolean;
    transactionHash: string;
    stakedAmount: string;
    message?: string | undefined;
    blockNumber?: number | undefined;
}, {
    challengeId: number;
    userAddress: string;
    success: boolean;
    transactionHash: string;
    stakedAmount: string;
    message?: string | undefined;
    blockNumber?: number | undefined;
}>;
export declare const executeFailSchema: z.ZodObject<{
    success: z.ZodBoolean;
    error: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error: string;
    reason: string;
    success: boolean;
}, {
    error: string;
    reason: string;
    success: boolean;
}>;
//# sourceMappingURL=schemas.d.ts.map