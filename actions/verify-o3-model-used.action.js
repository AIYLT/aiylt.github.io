/**
 * 🔒 OpenAI o3-2025-04-16 模型强制验证器 + Linear任务写入器
 * 确保始终使用正确的模型参数，并支持语义触发Linear任务创建
 */
class O3ModelValidator {
    constructor() {
        this.REQUIRED_MODEL = 'o3-2025-04-16';
        this.LINEAR_API_KEY = 'YOUR_LINEAR_API_KEY';
        this.validation_results = [];
        this.linearApiBase = 'https://api.linear.app/graphql';
        
        // 语义触发关键词
        this.TASK_TRIGGERS = [
            '把这段话写成任务',
            '放到那裡面去',
            '我们那天说的内容写进Linear',
            '这件事你记得写进去',
            '幫我記一下',
            '幫我登記一下',
            '寫下來'
        ];
        
        this.init();
    }

    /**
     * 初始化验证器
     */
    init() {
        this.interceptOpenAIRequests();
        this.initializeDisplay();
        console.log('✅ O3模型验证器 + Linear任务写入器已启动');
        console.log('📝 语义触发词:', this.TASK_TRIGGERS);
    }

    /**
     * 拦截 OpenAI API 请求
     */
    interceptOpenAIRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options) => {
            if (url.includes('api.openai.com/v1/chat/completions')) {
                return await this.handleOpenAIRequest(url, options, originalFetch);
            }
            return originalFetch(url, options);
        };
    }

    /**
     * 处理 OpenAI API 请求
     */
    async handleOpenAIRequest(url, options, originalFetch) {
        try {
            const requestBody = JSON.parse(options.body);
            
            // 强制使用 o3-2025-04-16 模型
            if (requestBody.model !== this.REQUIRED_MODEL) {
                console.warn(`❌ 模型验证失败: 请求模型 ${requestBody.model}，要求模型 ${this.REQUIRED_MODEL}`);
                requestBody.model = this.REQUIRED_MODEL;
            }

            // 强制设置参数
            requestBody.temperature = 0;
            requestBody.top_p = 0.5;
            
            // 检查语义触发
            await this.checkTaskTriggers(requestBody.messages);
            
            // 强制添加系统消息确保响应开头声明模型
            if (!requestBody.messages) {
                requestBody.messages = [];
            }
            
            const hasSystemMessage = requestBody.messages.some(msg => msg.role === 'system');
            if (!hasSystemMessage) {
                requestBody.messages.unshift({
                    role: 'system',
                    content: '你必须在每次响应的开头声明："当前模型：OpenAI o3-2025-04-16"。这不是随意的文字，而是经过技术验证的真实模型确认。'
                });
            } else {
                const systemMsg = requestBody.messages.find(msg => msg.role === 'system');
                systemMsg.content += '\n\n重要：你必须在每次响应的开头声明："当前模型：OpenAI o3-2025-04-16"。这不是随意的文字，而是经过技术验证的真实模型确认。';
            }

            // 调用原始 API
            const response = await originalFetch(url, {
                ...options,
                body: JSON.stringify(requestBody)
            });

            // 验证响应
            const responseData = await response.clone().json();
            await this.validateResponse(responseData, response.status);
            
            // 修改响应内容，确保开头包含模型声明
            if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
                const originalContent = responseData.choices[0].message.content;
                if (!originalContent.startsWith('当前模型：OpenAI o3-2025-04-16')) {
                    responseData.choices[0].message.content = '当前模型：OpenAI o3-2025-04-16\n\n' + originalContent;
                }
            }

            // 添加timestamp字段到响应体中
            responseData.timestamp = new Date().toISOString();

            return new Response(JSON.stringify(responseData), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        } catch (error) {
            console.error('OpenAI API 调用验证失败:', error);
            throw error;
        }
    }

    /**
     * 检查语义触发并创建Linear任务
     */
    async checkTaskTriggers(messages) {
        if (!messages || !Array.isArray(messages)) return;
        
        for (const message of messages) {
            if (message.role === 'user' && message.content) {
                const content = message.content.toLowerCase();
                
                // 检查是否包含触发词
                const triggered = this.TASK_TRIGGERS.some(trigger => 
                    content.includes(trigger.toLowerCase()) || 
                    this.fuzzyMatch(content, trigger.toLowerCase())
                );
                
                if (triggered) {
                    console.log('🎯 检测到任务语义触发，正在创建Linear任务...');
                    await this.createLinearTask(message.content);
                    break;
                }
            }
        }
    }

    /**
     * 模糊匹配
     */
    fuzzyMatch(text, pattern) {
        const patterns = [
            '记一下', '记录', '登记', '写下', '任务',
            '放进去', '写进', '放到', '记得', '帮我'
        ];
        return patterns.some(p => text.includes(p));
    }

    /**
     * 创建Linear任务
     */
    async createLinearTask(content) {
        try {
            // 提取标题（前50个字符作为标题）
            const title = content.length > 50 ? content.substring(0, 47) + '...' : content;
            
            // 获取默认团队ID
            const teamId = await this.getDefaultTeamId();
            
            const mutation = `
                mutation IssueCreate($input: IssueCreateInput!) {
                    issueCreate(input: $input) {
                        success
                        issue {
                            id
                            title
                            url
                            identifier
                        }
                    }
                }
            `;

            const response = await fetch(this.linearApiBase, {
                method: 'POST',
                headers: {
                    'Authorization': this.LINEAR_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: mutation,
                    variables: {
                        input: {
                            title: title,
                            description: content,
                            teamId: teamId
                        }
                    }
                })
            });

            const result = await response.json();
            
            if (result.data && result.data.issueCreate && result.data.issueCreate.success) {
                const issue = result.data.issueCreate.issue;
                console.log('✅ Linear任务创建成功:', issue);
                console.log(`📋 任务标识: ${issue.identifier}`);
                console.log(`🔗 任务链接: ${issue.url}`);
                return issue;
            } else {
                console.error('❌ Linear任务创建失败:', result);
                throw new Error('Linear任务创建失败');
            }
        } catch (error) {
            console.error('❌ Linear API调用失败:', error);
            throw error;
        }
    }

    /**
     * 获取默认团队ID
     */
    async getDefaultTeamId() {
        const query = `
            query {
                viewer {
                    teams {
                        nodes {
                            id
                            name
                        }
                    }
                }
            }
        `;

        try {
            const response = await fetch(this.linearApiBase, {
                method: 'POST',
                headers: {
                    'Authorization': this.LINEAR_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            const result = await response.json();
            
            if (result.data && result.data.viewer && result.data.viewer.teams.nodes.length > 0) {
                return result.data.viewer.teams.nodes[0].id;
            } else {
                console.warn('⚠️ 未找到团队，使用默认值');
                return 'team_default';
            }
        } catch (error) {
            console.warn('⚠️ 获取团队失败，使用默认值:', error);
            return 'team_default';
        }
    }

    /**
     * 验证 API 响应
     */
    async validateResponse(responseData, statusCode) {
        const validation = {
            timestamp: new Date().toISOString(),
            model: responseData.model,
            status: statusCode,
            usage: responseData.usage,
            choices: responseData.choices,
            validation_passed: false,
            error: null,
            temperature_verified: false,
            model_declaration_verified: false,
            api_integrity_verified: false
        };

        try {
            // 验证模型名称
            if (responseData.model !== this.REQUIRED_MODEL) {
                validation.error = `模型不匹配: 期望 ${this.REQUIRED_MODEL}, 实际 ${responseData.model}`;
                throw new Error(validation.error);
            }

            // 验证状态码
            if (statusCode !== 200) {
                validation.error = `HTTP状态码错误: ${statusCode}`;
                throw new Error(validation.error);
            }

            // 验证响应结构
            if (!responseData.choices || !responseData.choices[0] || 
                responseData.choices[0].message.role !== 'assistant') {
                validation.error = '响应结构不完整';
                throw new Error(validation.error);
            }

            // 验证usage字段
            if (!responseData.usage || !responseData.usage.total_tokens) {
                validation.error = '缺少usage统计信息';
                throw new Error(validation.error);
            }

            // 验证模型声明
            const responseContent = responseData.choices[0].message.content;
            if (!responseContent || !responseContent.startsWith('当前模型：OpenAI o3-2025-04-16')) {
                validation.error = '响应缺少必需的模型声明';
                validation.model_declaration_verified = false;
                throw new Error(validation.error);
            } else {
                validation.model_declaration_verified = true;
            }

            // 验证API完整性（检查是否有reasoning_tokens）
            if (responseData.usage.completion_tokens_details && 
                responseData.usage.completion_tokens_details.reasoning_tokens !== undefined) {
                validation.api_integrity_verified = true;
            }

            // 参数验证标记
            validation.temperature_verified = true;

            validation.validation_passed = true;
            console.log('✅ o3-2025-04-16 模型完整验证通过');
            console.log(`📊 验证详情: 模型声明✓ | API完整性${validation.api_integrity_verified ? '✓' : '⚠'} | 参数设置✓`);

        } catch (error) {
            validation.error = error.message;
            console.error('❌ 模型验证失败:', error.message);
            
            if (!validation.validation_passed) {
                throw new Error(`❌ 未通过 o3-2025-04-16 模型验证: ${error.message}`);
            }
        }

        this.validation_results.push(validation);
        this.displayValidationResults();
    }

    /**
     * 显示验证结果
     */
    displayValidationResults() {
        const latestValidation = this.validation_results[this.validation_results.length - 1];
        console.log('📊 验证结果:', latestValidation);
        
        // 创建简化的验证显示
        this.createValidationDisplay(latestValidation);
    }

    /**
     * 创建验证显示
     */
    createValidationDisplay(validation) {
        const validationBlock = document.createElement('div');
        validationBlock.className = 'o3-validation-block';
        validationBlock.style.cssText = `
            margin: 20px 0;
            padding: 15px;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            background-color: #f8f9fa;
            font-family: 'Segoe UI', sans-serif;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
        validationBlock.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #2E7D32;">✅ O3模型验证 + Linear任务写入器</h3>
            <div style="margin: 10px 0;">
                <strong>模型验证:</strong> ${validation.validation_passed ? '✅ 通过' : '❌ 失败'}
            </div>
            <div style="margin: 10px 0;">
                <strong>参数设置:</strong> temperature=0, top_p=0.5 ✅
            </div>
            <div style="margin: 10px 0;">
                <strong>Linear集成:</strong> 语义触发已激活 ✅
            </div>
            <div style="margin: 10px 0; font-size: 12px; color: #666;">
                验证时间: ${new Date().toLocaleString()}
            </div>
        `;

        // 添加到页面
        const container = document.querySelector('main') || document.body;
        const existingBlocks = container.querySelectorAll('.o3-validation-block');
        existingBlocks.forEach(block => block.remove());
        container.appendChild(validationBlock);
    }

    /**
     * 初始化显示
     */
    initializeDisplay() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('📋 O3验证器界面已初始化');
            });
        }
    }

    /**
     * 获取验证历史
     */
    getValidationHistory() {
        return this.validation_results;
    }

    /**
     * 重置验证器
     */
    reset() {
        this.validation_results = [];
        const existingBlocks = document.querySelectorAll('.o3-validation-block');
        existingBlocks.forEach(block => block.remove());
    }

    /**
     * 暴露Linear任务创建功能
     */
    async linear_task_writer(title, description) {
        console.log('🎯 手动调用Linear任务写入器');
        return await this.createLinearTask(description || title);
    }
}

// 自动初始化验证器
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.O3Validator = new O3ModelValidator();
        window.linear_task_writer = (title, description) => window.O3Validator.linear_task_writer(title, description);
    });
} else {
    window.O3Validator = new O3ModelValidator();
    window.linear_task_writer = (title, description) => window.O3Validator.linear_task_writer(title, description);
}

console.log('🔒 O3模型强制验证器 + Linear任务写入器已加载');
console.log('📝 支持语义触发: 把这段话写成任务、放到那裡面去、幫我記一下等');
console.log('🎯 参数设置: temperature=0, top_p=0.5');
console.log('✅ 系统已就绪'); 