# LLM Providers

DragonClaw supports any LLM through two code paths: OpenAI-compatible and Anthropic Messages API.

## Supported Providers

| Provider | Endpoint | Default Model | Cost/1M tokens | Notes |
|----------|----------|---------------|----------------|-------|
| DeepSeek | `api.deepseek.com/v1` | `deepseek-chat` | ~$0.14 | Cheapest, excellent Chinese |
| Qwen | `dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-max` | ~$0.40 | Alibaba Cloud, good reasoning |
| Kimi | `api.moonshot.cn/v1` | `moonshot-v1-128k` | ~$0.55 | 128K context window |
| GLM | `open.bigmodel.cn/api/paas/v4` | `glm-4-flash` | ~$0.10 | Zhipu AI, fast inference |
| OpenAI | `api.openai.com/v1` | `gpt-4o` | ~$5.00 | Best general reasoning |
| Anthropic | `api.anthropic.com/v1` | `claude-sonnet-4-20250514` | ~$3.00 | Best instruction following |
| OpenRouter | `openrouter.ai/api/v1` | `deepseek/deepseek-chat` | varies | Access any model |
| Local | user-defined | user-defined | free | Ollama, vLLM, etc. |

## Why Chinese Providers?

For DragonClaw's use case — Chinese-language conversations about crypto trading — Chinese LLMs offer:

1. **10-20x lower cost** than Claude or GPT
2. **Better Chinese fluency** for nuanced financial language
3. **Lower latency** for users in Asia-Pacific
4. **No geoblocking** issues

## Local Models

Point DragonClaw at any OpenAI-compatible endpoint:

```yaml
llm:
  provider: local
  baseUrl: http://localhost:11434/v1  # Ollama
  model: qwen2.5:32b
  apiKey: not-needed
```

Works with Ollama, vLLM, text-generation-webui, LM Studio, or any server implementing the `/v1/chat/completions` endpoint.

## Reliability Features

All LLM calls include:
- **60-second timeout** — prevents hanging on slow responses
- **3 retries** — exponential backoff on 429 (rate limit) and 500+ errors
- **Structured errors** — `LLMError` class with status code, provider name, retryable flag
- **Logging** — every call logs provider, model, elapsed time, response length
