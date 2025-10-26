import { z } from "zod";
import { abilityParamsSchema, precheckSuccessSchema, precheckFailSchema, executeSuccessSchema, executeFailSchema } from './schemas';
/**
 * Vincent Ability for Auto-Staking to Fitness Challenges
 *
 * IMPORTANT: stakeAmount must be passed as a string representing Wei (not ETH)
 * Example: "1000000000000000000" for 1 ETH, not "1"
 *
 * The ability validates that:
 * 1. Challenge exists and is active
 * 2. Stake amount matches the challenge requirement exactly
 * 3. User has not already joined the challenge
 * 4. PKP has sufficient funds to cover stake + gas
 */
export declare const vincentAbility: any;
export declare const bundledVincentAbility: {
    ipfsCid: string;
    vincentAbility: any;
    vincentAbilityApiVersion: string;
    metadata: {
        name: string;
        description: string;
        version: string;
        packageName: string;
        packageVersion: string;
        abilityName: string;
        apiVersion: string;
        supportedPolicies: {};
        params: {
            challengeId: string;
            userAddress: string;
            contractAddress: string;
            stakeAmount: string;
        };
    };
};
export type AbilityParams = z.infer<typeof abilityParamsSchema>;
export type PrecheckSuccess = z.infer<typeof precheckSuccessSchema>;
export type PrecheckFail = z.infer<typeof precheckFailSchema>;
export type ExecuteSuccess = z.infer<typeof executeSuccessSchema>;
export type ExecuteFail = z.infer<typeof executeFailSchema>;
//# sourceMappingURL=vincent-ability.d.ts.map