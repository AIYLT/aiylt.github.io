# 🔧 O3 Validator v2.0 配置指南

## Linear API 密钥配置

为了安全起见，Linear API密钥需要单独配置：

### 方法1: 在HTML页面中设置
```html
<script>
    // 在加载验证器之前设置
    window.LINEAR_API_KEY = 'YOUR_LINEAR_API_KEY_HERE';
</script>
<script src="actions/verify-o3-model-used.action.min.js"></script>
```

### 方法2: 通过GitHub Secrets设置（推荐）
1. 在GitHub仓库中设置Secret: `LINEAR_API_KEY`
2. 值为: `YOUR_LINEAR_API_KEY_HERE`

### 功能验证
配置完成后，您可以：
- `createIssue('标题', '描述')` - 创建Linear Issue
- `searchIssues('关键词')` - 搜索Issues
- 查看实时监控仪表板

## 特性说明
✅ OpenAI o3-2025-04-16 强制验证
✅ 温度参数锁定为0
✅ 最高级别实时监控
✅ Linear项目管理集成
✅ 性能缓存系统
✅ 错误追踪报告

## 技术支持
- 团队: My-zjf (MY)
- 用户: 智鉴富 (legend@my-zjf.com)
