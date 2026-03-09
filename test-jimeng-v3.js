/**
 * 即梦AI API 测试脚本 V3
 * 参考火山引擎视觉智能服务文档
 */

const { Service } = require('@volcengine/openapi');

// 您的密钥信息
const ACCESS_KEY_ID = 'AKLTODdiN2IyNDEzMzg4NGI0YjgwOTAxNTVhMDk1ODQwY2Q';
const SECRET_ACCESS_KEY = 'WVRVNE1HUTFOR0ZpWlRnMk5HTXpPRGszT0dReE5HVXdNemM1TkRNNFpUaw==';

async function testWithVisualService() {
    console.log('🧪 使用视觉智能服务配置测试...\n');

    try {
        // 使用视觉智能服务的配置
        const service = new Service({
            host: 'visual.volcengineapi.com',
            serviceName: 'visual',  // 服务名改为 visual
            region: 'cn-north-1',
            accessKeyId: ACCESS_KEY_ID,
            secretKey: SECRET_ACCESS_KEY,
        });

        // 创建 API - 尝试不同的Action名称
        const apiConfigs = [
            { Action: 'CVProcess', Version: '2022-08-31' },
            { Action: 'JimengHighAesGene', Version: '2022-08-31' },
            { Action: 'GenerateImage', Version: '2022-08-31' },
        ];

        const requestBody = {
            req_key: 'jimeng_high_aes_gene',
            prompt: '一座美丽的中国古建筑，飞檐翘角，红墙绿瓦',
            width: 1024,
            height: 1024,
            seed: -1,
            return_url: true
        };

        for (const config of apiConfigs) {
            console.log(`尝试 Action: ${config.Action}`);

            try {
                const api = service.createAPI(config.Action, {
                    Version: config.Version,
                    method: 'POST',
                    contentType: 'json',
                });

                const response = await api(requestBody);
                console.log(`  返回码: ${response.code}, 消息: ${response.message}`);

                if (response.code === 10000 || response.code === 0) {
                    console.log('  ✅ 成功！');
                    console.log('  响应:', JSON.stringify(response, null, 2));
                    return true;
                }
            } catch (error) {
                console.log(`  错误: ${error.message}`);
            }
        }
    } catch (error) {
        console.log('配置错误:', error.message);
    }

    return false;
}

// 尝试使用OpenAPI的通用调用方式
async function testGenericOpenAPI() {
    console.log('\n🧪 使用通用OpenAPI调用方式...\n');

    const axios = require('axios');
    const crypto = require('crypto');

    // 使用axios进行调用
    const requestBody = {
        req_key: 'jimeng_high_aes_gene',
        prompt: '一座美丽的中国古建筑',
        width: 1024,
        height: 1024,
        return_url: true
    };

    // 尝试直接调用，不带签名（测试是否支持其他认证方式）
    try {
        console.log('尝试不带签名的调用...');
        const response = await axios.post(
            'https://visual.volcengineapi.com/?Action=CVProcess&Version=2022-08-31',
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        console.log('响应:', response.data);
    } catch (error) {
        console.log('错误:', error.response?.data || error.message);
    }
}

// 尝试使用不同的服务名和region
async function testDifferentConfigs() {
    console.log('\n🧪 尝试不同的服务配置...\n');

    const configs = [
        { host: 'open.volcengineapi.com', serviceName: 'cv', region: 'cn-north-1' },
        { host: 'visual.volcengineapi.com', serviceName: 'visual', region: 'cn-north-1' },
        { host: 'open.volcengineapi.com', serviceName: 'jimeng', region: 'cn-north-1' },
    ];

    const requestBody = {
        req_key: 'jimeng_high_aes_gene',
        prompt: '一座美丽的中国古建筑',
        width: 1024,
        height: 1024,
        return_url: true
    };

    for (const config of configs) {
        console.log(`尝试: host=${config.host}, service=${config.serviceName}`);

        try {
            const service = new Service({
                host: config.host,
                serviceName: config.serviceName,
                region: config.region,
                accessKeyId: ACCESS_KEY_ID,
                secretKey: SECRET_ACCESS_KEY,
            });

            const api = service.createAPI('CVProcess', {
                Version: '2022-08-31',
                method: 'POST',
                contentType: 'json',
            });

            const response = await api(requestBody);
            console.log(`  码: ${response.code}, 消息: ${response.message}`);

            if (response.code === 10000 || response.code === 0) {
                console.log('  ✅ 找到正确配置！');
                console.log('  响应:', JSON.stringify(response, null, 2));
                return;
            }
        } catch (error) {
            console.log(`  错误: ${error.message}`);
        }
    }
}

// 运行所有测试
async function runAllTests() {
    await testWithVisualService();
    await testGenericOpenAPI();
    await testDifferentConfigs();
}

runAllTests();
