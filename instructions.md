# AIYLT 插件使用说明

1. 这是 AIYLT 的 ChatGPT 插件，支持标准 OpenAPI 3.1，端点为 `/hello`。
2. 插件声明文件为 `ai-plugin.json`，API 描述文件为 `openapi.yaml`，均位于 `.well-known` 目录。
3. 部署后请通过如下地址验证：
   - https://aiylt.github.io/.well-known/ai-plugin.json
   - https://aiylt.github.io/.well-known/openapi.yaml
4. 若可正常访问，插件端可直接导入上述 JSON URL。

如需自定义接口，请完善 `openapi.yaml` 文件内容。