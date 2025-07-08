#!/usr/bin/env node

/**
 * O3 Validator 生产环境构建脚本
 * 包含代码优化、监控配置、Linear集成
 */

import fs from 'fs';
import path from 'path';

console.log('🔨 开始生产环境构建...');

// 1. 读取验证器源文件
const validatorPath = 'actions/verify-o3-model-used.action.js';
let validatorCode = fs.readFileSync(validatorPath, 'utf8');

// 2. 生产环境优化
console.log('⚡ 优化代码...');

// 移除开发环境日志（保留重要监控日志）
validatorCode = validatorCode.replace(/console\.log\('🎯[^']*'\);?\n?/g, '');
validatorCode = validatorCode.replace(/console\.log\('🔒[^']*'\);?\n?/g, '');

// 添加生产环境配置
const prodConfig = `
// 生产环境配置
const PRODUCTION_CONFIG = {
    version: "2.0.0",
    enableLogging: false,
    enableMetrics: true,
    cacheEnabled: true,
    linearIntegration: true,
    domainWhitelist: ['aiylt.github.io', 'localhost'],
    monitoringLevel: 'MAXIMUM',
    apiEndpoints: {
        linear: 'https://api.linear.app/graphql',
        monitoring: 'https://api.monitoring.example.com/metrics'
    },
    buildTime: '${new Date().toISOString()}',
    commitHash: '${process.env.GITHUB_SHA || 'local'}'
};

// 注入配置到全局
if (typeof window !== 'undefined') {
    window.PRODUCTION_CONFIG = PRODUCTION_CONFIG;
}
`;

validatorCode = prodConfig + validatorCode;

// 3. 创建生产版本
fs.writeFileSync('actions/verify-o3-model-used.action.min.js', validatorCode);

// 4. 生成性能优化的index.html
console.log('📄 优化index.html...');
let indexHtml = fs.readFileSync('index.html', 'utf8');

// 替换为压缩版本
indexHtml = indexHtml.replace(
    'verify-o3-model-used.action.js',
    'verify-o3-model-used.action.min.js'
);

// 添加性能优化标签
const performanceOptimizations = `
    <!-- 性能优化 -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link rel="preconnect" href="https://api.openai.com">
    <link rel="preconnect" href="https://api.linear.app">
    
    <!-- 监控和分析 -->
    <script>
        // 性能监控
        window.performance.mark('app-start');
        
        // 错误报告
        window.addEventListener('error', function(e) {
            if (window.O3Monitor) {
                window.O3Monitor.recordError(e.error, { context: 'global' });
            }
        });
        
        // 页面加载完成
        window.addEventListener('load', function() {
            window.performance.mark('app-loaded');
            console.log('🚀 O3 Validator with Linear Integration v2.0 已加载');
        });
    </script>
`;

indexHtml = indexHtml.replace('<head>', '<head>' + performanceOptimizations);

fs.writeFileSync('index.html', indexHtml);

// 5. 创建安全配置
console.log('�� 创建安全配置...');
const htaccess = `
# O3 Validator 安全配置

# 安全头
<IfModule mod_headers.c>
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self' https://api.openai.com https://api.linear.app; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>

# 缓存优化
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/json "access plus 1 day"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# Gzip 压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# 防止访问敏感文件
<Files ~ "^\.">
    Order allow,deny
    Deny from all
</Files>
`;

fs.writeFileSync('.htaccess', htaccess);

// 6. 创建robots.txt
const robotsTxt = `
User-agent: *
Allow: /
Disallow: /.github/
Disallow: /scripts/
Disallow: /test-validator.js

Sitemap: https://aiylt.github.io/sitemap.xml
`;

fs.writeFileSync('robots.txt', robotsTxt);

// 7. 生成部署清单
const manifest = {
    name: "O3 Model Validator with Linear Integration",
    version: "2.0.0",
    description: "强制使用OpenAI o3-2025-04-16模型的验证器，集成Linear项目管理和高级监控",
    build_time: new Date().toISOString(),
    commit_hash: process.env.GITHUB_SHA || 'local',
    features: [
        "O3 Model Validation (Temperature=0)",
        "Advanced Real-time Monitoring",
        "Linear API Integration",
        "Performance Caching System",
        "Interactive Dashboard",
        "Error Tracking & Reporting",
        "Security Headers",
        "Production Optimizations"
    ],
    endpoints: {
        main: "https://aiylt.github.io",
        api: "https://aiylt.github.io/.well-known/openapi.yaml",
        monitoring: "Real-time dashboard on page"
    },
    linear_integration: {
        enabled: true,
        api_key_configured: true,
        supported_operations: [
            "create_issue",
            "search_issues",
            "update_issue",
            "get_teams",
            "analytics"
        ]
    }
};

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));

// 8. 统计信息
console.log('📊 构建统计:');
const stats = {
    'verify-o3-model-used.action.min.js': fs.statSync('actions/verify-o3-model-used.action.min.js').size,
    'index.html': fs.statSync('index.html').size,
    '.htaccess': fs.statSync('.htaccess').size,
    'manifest.json': fs.statSync('manifest.json').size
};

Object.entries(stats).forEach(([file, size]) => {
    console.log(`   ${file}: ${(size / 1024).toFixed(2)} KB`);
});

console.log('');
console.log('✅ 生产环境构建完成!');
console.log('🚀 已优化: 性能、安全、监控、Linear集成');
console.log('📦 文件已准备好部署到 GitHub Pages');

