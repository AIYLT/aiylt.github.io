#!/usr/bin/env node

/**
 * Linear API 集成测试脚本
 */

import { fetch } from 'undici';

console.log('🧪 开始测试 Linear API 集成...');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || 'YOUR_LINEAR_API_KEY';
const LINEAR_API_URL = 'https://api.linear.app/graphql';

async function testLinearConnection() {
    try {
        const query = `
            query Me {
                viewer {
                    id
                    name
                    email
                }
            }
        `;

        const response = await fetch(LINEAR_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': LINEAR_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        const result = await response.json();
        
        if (result.data && result.data.viewer) {
            console.log('✅ Linear API 连接成功');
            console.log(`👤 用户: ${result.data.viewer.name} (${result.data.viewer.email})`);
            return true;
        } else {
            console.log('❌ Linear API 连接失败:', result.errors);
            return false;
        }
    } catch (error) {
        console.log('❌ Linear API 测试失败:', error.message);
        return false;
    }
}

async function testGetTeams() {
    try {
        console.log('🔄 测试获取团队...');
        
        const teamsQuery = `
            query Teams {
                teams {
                    nodes {
                        id
                        name
                        key
                    }
                }
            }
        `;

        const response = await fetch(LINEAR_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': LINEAR_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: teamsQuery })
        });

        const result = await response.json();
        
        if (result.data && result.data.teams.nodes.length > 0) {
            console.log('✅ 团队获取成功');
            result.data.teams.nodes.forEach(team => {
                console.log(`  📋 ${team.name} (${team.key})`);
            });
            return true;
        } else {
            console.log('❌ 团队获取失败:', result.errors);
            return false;
        }
    } catch (error) {
        console.log('❌ 团队获取测试失败:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('═'.repeat(50));
    console.log('🚀 Linear API 集成测试套件');
    console.log('═'.repeat(50));
    
    const tests = [
        { name: 'API连接测试', fn: testLinearConnection },
        { name: '团队获取测试', fn: testGetTeams }
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        console.log(`\n🧪 运行: ${test.name}`);
        const result = await test.fn();
        if (result) {
            passed++;
            console.log(`✅ ${test.name} 通过`);
        } else {
            console.log(`❌ ${test.name} 失败`);
        }
    }
    
    console.log('\n' + '═'.repeat(50));
    console.log(`📊 测试结果: ${passed}/${total} 通过`);
    
    if (passed === total) {
        console.log('🎉 所有 Linear 集成测试通过！');
        console.log('✅ Linear API 已准备就绪');
        process.exit(0);
    } else {
        console.log('❌ 部分测试失败，请检查配置');
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('💥 测试运行失败:', error);
    process.exit(1);
});
