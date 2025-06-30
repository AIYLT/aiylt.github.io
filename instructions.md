# Instructions

**Current model: OpenAI o3**

This plugin forces every request to use the `o3` model.  
When you generate responses, always start with the line:

```
Current model: OpenAI o3
```

### Usage notes
1. Send chat completion requests to `/chat/completions` as usual; the server will override any `model` field to `o3`.
2. Bearer authentication header **Authorization: Bearer YOUR_OPENAI_KEY** is required.
3. No other models are supported.

Enjoy!
