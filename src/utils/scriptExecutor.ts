import { workspace } from 'vscode';
import { HttpRequest } from '../models/httpRequest';
import { HttpResponse } from '../models/httpResponse';
import Logger from '../logger';

export interface ScriptContext {
    response: {
        body: string;
        json: any; // 直接暴露解析后的 JSON 对象
        headers: { [key: string]: string | string[] };
        status: number;
        statusText: string;
    };
    client: {
        global: {
            set: (name: string, value: string) => Promise<void>;
            get: (name: string) => Promise<string | undefined>;
            clear: (name: string) => Promise<void>;
        };
    };
    tests: { [key: string]: boolean };
}

export class ScriptExecutor {
    public static async executeScript(
        script: string, 
        request: HttpRequest, 
        response: HttpResponse
    ): Promise<void> {
        Logger.info('[ScriptExecutor] *** SCRIPT EXECUTION STARTED ***');
        Logger.info('[ScriptExecutor] executeScript called');
        Logger.info('[ScriptExecutor] Script length:', script.length);
        Logger.info('[ScriptExecutor] Script preview:', script.substring(0, 100));
        
        try {
            // Create script context
            const context = await this.createScriptContext(response);
            
            // Create a safe execution environment
            const sandbox = this.createSandbox(context);
            
            // Execute the script in the sandbox
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const paramNames = Object.keys(sandbox);
            const paramValues = Object.values(sandbox);
            
            Logger.info('[ScriptExecutor] Parameter names:', paramNames);
            Logger.info('[ScriptExecutor] Parameter values types:', paramValues.map(v => typeof v));
            Logger.info('[ScriptExecutor] Debug parameter index:', paramNames.indexOf('debug'));
            Logger.info('[ScriptExecutor] Debug parameter value:', typeof paramValues[paramNames.indexOf('debug')]);
            
            const scriptFunction = new AsyncFunction(...paramNames, script);
            
            Logger.info('[ScriptExecutor] About to execute script with sandbox keys:', Object.keys(sandbox));
            Logger.info('[ScriptExecutor] Sandbox values types:', Object.values(sandbox).map(v => typeof v));
            Logger.info('[ScriptExecutor] Debug object before execution:', typeof sandbox.debug);
            await scriptFunction(...paramValues);
            Logger.info('[ScriptExecutor] Script execution completed');
        } catch (error) {
            Logger.error('Script execution error:', error);
            throw error;
        }
    }

    private static async createScriptContext(response: HttpResponse): Promise<ScriptContext> {
        // Parse response body
        let jsonBody: any = undefined;
        try {
            jsonBody = JSON.parse(response.body);
        } catch (error) {
            // Not valid JSON, leave as undefined
        }

        return {
            response: {
                body: response.body,
                json: jsonBody,
                headers: response.headers as { [key: string]: string | string[] },
                status: response.statusCode,
                statusText: response.statusMessage
            },
            client: {
                global: {
                    set: async (name: string, value: string) => {
                        await this.setGlobalVariable(name, value);
                    },
                    get: async (name: string) => {
                        return await this.getGlobalVariable(name);
                    },
                    clear: async (name: string) => {
                        await this.clearGlobalVariable(name);
                    }
                }
            },
            tests: {}
        };
    }

    private static createSandbox(context: ScriptContext): { [key: string]: any } {
        Logger.info('[Script Debug] Creating sandbox...');
        
        const safeConsole = {
            log: (...args: any[]) => {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                Logger.info('[Script] ' + message);
                Logger.info('[Script Debug] Console.log called - ScriptExecutor v2.0 is active');
            },
            error: (...args: any[]) => {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                Logger.error('[Script Error] ' + message);
            },
            warn: (...args: any[]) => {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                Logger.warn('[Script] ' + message);
            },
            info: (...args: any[]) => {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                Logger.info('[Script] ' + message);
            }
        };

        // 添加调试函数
        const debugUtils = {
            getConfig: async () => {
                try {
                    Logger.info('[Script Debug] Getting workspace configuration...');
                    const config = workspace.getConfiguration('rest-client');
                    Logger.info('[Script Debug] Got configuration object');
                    const envVars = config.get('environmentVariables');
                    Logger.info('[Script Debug] Environment variables retrieved:', JSON.stringify(envVars, null, 2));
                    return envVars || {};
                } catch (error) {
                    Logger.error('[Script Debug] Error getting config:', error);
                    return {};
                }
            }
        };

        const sandbox = {
            response: context.response,
            client: context.client,
            tests: context.tests,
            console: safeConsole,
            debug: debugUtils,
            JSON: JSON
        };

        Logger.info('[Script Debug] Sandbox created with keys:', Object.keys(sandbox));
        Logger.info('[Script Debug] Debug object type:', typeof sandbox.debug);
        Logger.info('[Script Debug] Debug object content:', JSON.stringify(sandbox.debug, null, 2));
        Logger.info('[Script Debug] Debug object functions:', Object.getOwnPropertyNames(sandbox.debug));
        
        return sandbox;
    }

    private static async setGlobalVariable(name: string, value: string): Promise<void> {
        try {
            Logger.info(`[Script Variable] Setting global variable: ${name} = ${value}`);
            const config = workspace.getConfiguration('rest-client');
            const envVars = config.get('environmentVariables') as { [key: string]: { [key: string]: string } } || {};
            Logger.info(`[Script Variable] Current environment variables:`, JSON.stringify(envVars, null, 2));
            
            if (!envVars['$shared']) {
                envVars['$shared'] = {};
            }
            envVars['$shared'][name] = value;
            
            Logger.info(`[Script Variable] Updated environment variables:`, JSON.stringify(envVars, null, 2));
            await config.update('environmentVariables', envVars, true);
            Logger.info(`[Script Variable] Configuration updated successfully`);
            
            // 等待配置更新生效 - 增加等待时间
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 验证更新是否成功
            const updatedConfig = workspace.getConfiguration('rest-client');
            const updatedEnvVars = updatedConfig.get('environmentVariables') as { [key: string]: { [key: string]: string } } || {};
            Logger.info(`[Script Variable] Verification - Updated config:`, JSON.stringify(updatedEnvVars, null, 2));
            
            // 检查变量是否正确设置
            const verificationValue = updatedEnvVars['$shared']?.[name];
            if (verificationValue === value) {
                Logger.info(`[Script Variable] ✅ Variable ${name} successfully set to ${value}`);
            } else {
                Logger.error(`[Script Variable] ❌ Variable ${name} verification failed. Expected: ${value}, Got: ${verificationValue}`);
            }
            
            // 额外验证：测试环境变量提供器是否能读取到更新的值
            try {
                const { EnvironmentVariableProvider } = await import('./httpVariableProviders/environmentVariableProvider');
                const provider = EnvironmentVariableProvider.Instance;
                const hasVariable = await provider.has(name);
                Logger.info(`[Script Variable] EnvironmentVariableProvider.has(${name}): ${hasVariable}`);
                
                if (hasVariable) {
                    const { value: providerValue } = await provider.get(name);
                    Logger.info(`[Script Variable] EnvironmentVariableProvider.get(${name}): ${providerValue}`);
                    if (providerValue === value) {
                        Logger.info(`[Script Variable] ✅ EnvironmentVariableProvider successfully retrieved ${name} = ${value}`);
                    } else {
                        Logger.error(`[Script Variable] ❌ EnvironmentVariableProvider value mismatch. Expected: ${value}, Got: ${providerValue}`);
                    }
                } else {
                    Logger.error(`[Script Variable] ❌ EnvironmentVariableProvider does not have variable ${name}`);
                }
            } catch (providerError) {
                Logger.error(`[Script Variable] Error testing EnvironmentVariableProvider:`, providerError);
            }
        } catch (error) {
            Logger.error('Failed to set global variable:', error);
        }
    }

    private static async getGlobalVariable(name: string): Promise<string | undefined> {
        try {
            Logger.info(`[Script Variable] Getting global variable: ${name}`);
            const config = workspace.getConfiguration('rest-client');
            const envVars = config.get('environmentVariables') as { [key: string]: { [key: string]: string } } || {};
            Logger.info(`[Script Variable] Current environment variables:`, JSON.stringify(envVars, null, 2));
            
            const value = envVars['$shared']?.[name];
            Logger.info(`[Script Variable] Retrieved value for ${name}: ${value}`);
            return value;
        } catch (error) {
            Logger.error('Failed to get global variable:', error);
            return undefined;
        }
    }

    private static async clearGlobalVariable(name: string): Promise<void> {
        try {
            const config = workspace.getConfiguration('rest-client');
            const envVars = config.get('environmentVariables') as { [key: string]: { [key: string]: string } } || {};
            if (envVars['$shared']) {
                delete envVars['$shared'][name];
                await config.update('environmentVariables', envVars, true);
            }
        } catch (error) {
            Logger.error('Failed to clear global variable:', error);
        }
    }
}
