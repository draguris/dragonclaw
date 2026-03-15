/**
 * Agent Loop
 * 
 * The core reasoning cycle:
 * 1. Receive a message from any connector
 * 2. Retrieve relevant memory + skills
 * 3. Build system prompt + conversation
 * 4. Call LLM
 * 5. Parse response for tool calls / actions
 * 6. Execute actions (Binance API, shell, browser, etc.)
 * 7. Return response to connector
 */

import { callLLM } from './llm.js';

export class AgentLoop {
  constructor({ config, skills, memory }) {
    this.config = config;
    this.skills = skills;
    this.memory = memory;
    this.sessions = new Map(); // channelId → message history
  }

  /**
   * Process an incoming message and return a response.
   * 
   * @param {string} channelId - unique identifier for the conversation
   * @param {string} userId - who sent the message
   * @param {string} message - the text content
   * @param {string} platform - 'telegram' | 'discord' | 'dingtalk' | 'feishu' | 'wechat' | 'cli'
   * @returns {string} the agent's response text
   */
  async process(channelId, userId, message, platform = 'cli') {
    // 1. Get or create session history
    if (!this.sessions.has(channelId)) {
      this.sessions.set(channelId, []);
    }
    const history = this.sessions.get(channelId);

    // 2. Find relevant skills
    const relevantSkills = this.skills.findRelevant(message);
    const skillPrompt = this.skills.buildSkillPrompt(relevantSkills);

    // 3. Retrieve relevant memory
    const memories = this.memory.search(message, 5);
    const memoryPrompt = memories.length
      ? `\n\n## Your Memory\n${memories.map(m => `- ${m.content}`).join('\n')}`
      : '';

    // 4. Build system prompt
    const systemPrompt = this._buildSystemPrompt(skillPrompt, memoryPrompt, platform);

    // 5. Add user message to history
    history.push({ role: 'user', content: message });

    // Trim history to last 30 messages to stay within context limits
    while (history.length > 30) history.shift();

    // 6. Call LLM
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    let response;
    try {
      response = await callLLM(this.config.llm, messages);
    } catch (err) {
      response = `抱歉，调用模型时出错: ${err.message}`;
    }

    // 7. Parse for tool executions
    const { text, actions } = this._parseResponse(response);

    // 8. Execute any tool calls
    let finalResponse = text;
    if (actions.length > 0) {
      const results = [];
      for (const action of actions) {
        const result = await this._executeAction(action);
        results.push(result);
      }

      // Feed results back to LLM for final response
      history.push({ role: 'assistant', content: response });
      history.push({
        role: 'user',
        content: `Tool execution results:\n${results.map((r, i) => `[${actions[i].tool}]: ${JSON.stringify(r)}`).join('\n')}\n\nPlease summarize the results for the user.`
      });

      const followUp = [
        { role: 'system', content: systemPrompt },
        ...history,
      ];
      finalResponse = await callLLM(this.config.llm, followUp);
    }

    // 9. Store in history
    history.push({ role: 'assistant', content: finalResponse });

    // 10. Extract and store any new memories
    this._extractMemories(message, finalResponse, userId);

    return finalResponse;
  }

  _buildSystemPrompt(skillPrompt, memoryPrompt, platform) {
    const lang = this.config.agent.language === 'zh'
      ? '请用中文回复，除非用户使用英文。'
      : this.config.agent.language === 'en'
        ? 'Respond in English unless the user writes in Chinese.'
        : '根据用户的语言自动切换中英文。';

    const binanceNote = this.config.binance.apiKey
      ? '用户已配置币安 API 密钥，可以执行现货交易。执行任何交易前必须确认。'
      : '用户尚未配置币安 API 密钥。可以使用免密钥的查询类技能（行情、审计、Meme追踪等）。如需交易，提示用户配置密钥。';

    return `${this.config.agent.persona}

## Rules
- ${lang}
- 回复简洁，不要过度解释。
- 涉及资金操作时，必须先确认再执行。
- ${binanceNote}
- 当前平台: ${platform}
- 你可以执行 shell 命令、调用 API、控制浏览器。
- 如果用户请求的操作需要一个你没有的技能，告诉他们如何安装或者主动帮他们写一个。

## Tool Calling Format
When you need to call a tool, output a JSON block:
\`\`\`tool
{"tool": "binance_spot", "action": "GET", "endpoint": "/api/v3/ticker/price", "params": {"symbol": "BTCUSDT"}}
\`\`\`
Or for shell commands:
\`\`\`tool
{"tool": "shell", "command": "curl -s https://api.example.com/data"}
\`\`\`
${skillPrompt}${memoryPrompt}`;
  }

  _parseResponse(response) {
    const actions = [];
    let text = response;

    // Extract ```tool blocks
    const toolRegex = /```tool\n([\s\S]*?)```/g;
    let match;
    while ((match = toolRegex.exec(response)) !== null) {
      try {
        const action = JSON.parse(match[1].trim());
        actions.push(action);
      } catch (e) {
        // Malformed tool call, skip
      }
    }

    // Remove tool blocks from visible text
    text = response.replace(toolRegex, '').trim();

    return { text, actions };
  }

  async _executeAction(action) {
    switch (action.tool) {
      case 'binance_spot':
      case 'binance_market':
      case 'binance_wallet':
        return await this._executeBinanceAction(action);
      case 'shell':
        return await this._executeShell(action);
      default:
        return { error: `Unknown tool: ${action.tool}` };
    }
  }

  async _executeBinanceAction(action) {
    const { BinanceClient } = await import('./binance-client.js');
    const client = new BinanceClient(this.config.binance);

    try {
      if (action.action === 'GET') {
        return await client.get(action.endpoint, action.params || {});
      } else if (action.action === 'POST') {
        if (this.config.agent.confirmBeforeTrade) {
          return { needsConfirmation: true, message: '此操作需要确认。请回复 CONFIRM 继续。', action };
        }
        return await client.post(action.endpoint, action.params || {});
      }
    } catch (e) {
      return { error: e.message };
    }
  }

  async _executeShell(action) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(action.command, {
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      });
      return { stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (e) {
      return { error: e.message };
    }
  }

  _extractMemories(userMessage, agentResponse, userId) {
    // Simple heuristic: if the user states a preference or fact about themselves, store it
    const prefixPatterns = [
      /我(喜欢|偏好|常用|习惯|叫|是)/,
      /my (name|preference|favorite|usual)/i,
      /i (prefer|like|usually|always)/i,
      /记住/,
      /remember/i,
    ];

    for (const pat of prefixPatterns) {
      if (pat.test(userMessage)) {
        this.memory.add({
          content: userMessage,
          userId,
          type: 'preference',
          timestamp: Date.now(),
        });
        break;
      }
    }
  }
}
