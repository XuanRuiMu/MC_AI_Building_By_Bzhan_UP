/**
 * 即梦AI API 测试脚本 V2
 * 尝试不同的API端点和参数格式
 */

const { Service } = require('@volcengine/openapi');

// 您的密钥信息
const ACCESS_KEY_ID = 'AKLTODdiN2IyNDEzMzg4NGI0YjgwOTAxNTVhMDk1ODQwY2Q';
const SECRET_ACCESS_KEY = 'WVRVNE1HUTFOR0ZpWlRnMk5HTXpPRGszT0dReE5HVXdNemM1TkRNNFpUaw==';

async function testJimengAPI() {
    console.log('🧪 开始测试即梦AI API (V2)...\n');

    // 尝试不同的host配置
    const hosts = [
        'open.volcengineapi.com',
        'visual.volcengineapi.com',
        'cv.volcengineapi.com'
    ];

    // 尝试不同的请求参数格式
    const paramFormats = [
        // 格式1: 直接参数
        {
            req_key: 'jimeng_high_aes_gene',
            prompt: '一座美丽的中国古建筑',
            width: 1024,
            height: 1024,
            seed: -1,
            return_url: true
        },
        // 格式2: 嵌套在json中
        {
            json: {
                req_key: 'jimeng_high_aes_gene',
                prompt: '一座美丽的中国古建筑',
                width: 1024,
                height: 1024,
                seed: -1,
                return_url: true
            }
        },
        // 格式3: 使用不同的req_key
        {
            req_key: 'jimeng_high_aes',
            prompt: '一座美丽的中国古建筑',
            width: 1024,
            height: 1024,
            return_url: true
        }
    ];

    for (const host of hosts) {
        console.log(`\n🌐 尝试 Host: ${host}`);

        try {
            const service = new Service({
                host: host,
                serviceName: 'cv',
                region: 'cn-north-1',
                accessKeyId: ACCESS_KEY_ID,
                secretKey: SECRET_ACCESS_KEY,
            });

            const api = service.createAPI('CVProcess', {
                Version: '2022-08-31',
                method: 'POST',
                contentType: 'json',
            });

            for (let i = 0; i < paramFormats.length; i++) {
                console.log(`  📦 尝试参数格式 ${i + 1}...`);

                try {
                    const response = await api(paramFormats[i]);

                    if (response.code === 10000 || response.code === 0) {
                        console.log('  ✅ 成功！');
                        console.log('  响应:', JSON.stringify(response, null, 2));
                        return;
                    } else {
                        console.log(`  ⚠️  返回码: ${response.code}, 消息: ${response.message}`);
                    }
                } catch (error) {
                    console.log(`  ❌ 错误: ${error.message}`);
                }
            }
        } catch (error) {
            console.log(`  ❌ Host错误: ${error.message}`);
        }
    }

    console.log('\n❌ 所有尝试都失败了');
}

// 也尝试直接HTTP调用，使用不同的body包装方式
async function testDirectHTTP() {
    console.log('\n\n🧪 尝试直接HTTP调用...\n');

    const crypto = require('crypto');

    function hmacSha256(key, message) {
        return crypto.createHmac('sha256', key).update(message).digest();
    }

    function sign(method, host, uri, query, body, xDate) {
        const dateStamp = xDate.substring(0, 8);
        const credentialScope = `${dateStamp}/cn-north-1/cv/request`;

        const canonicalHeaders = `host:${host}\nx-date:${xDate}\n`;
        const signedHeaders = 'host;x-date';
        const payloadHash = crypto.createHash('sha256').update(body).digest('hex');

        const canonicalRequest = [
            method,
            uri,
            query,
            canonicalHeaders,
            signedHeaders,
            payloadHash
        ].join('\n');

        const stringToSign = [
            'HMAC-SHA256',
            xDate,
            credentialScope,
            crypto.createHash('sha256').update(canonicalRequest).digest('hex')
        ].join('\n');

        const kDate = hmacSha256(SECRET_ACCESS_KEY, dateStamp);
        const kRegion = hmacSha256(kDate, 'cn-north-1');
        const kService = hmacSha256(kRegion, 'cv');
        const kSigning = hmacSha256(kService, 'request');
        const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

        return `HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    }

    // 尝试不同的body格式
    const bodyFormats = [
        // 格式1: 标准JSON
        JSON.stringify({
            req_key: 'jimeng_high_aes_gene',
            prompt: '一座美丽的中国古建筑',
            width: 1024,
            height: 1024,
            seed: -1,
            return_url: true
        }),
        // 格式2: 包装在request中
        JSON.stringify({
            request: {
                req_key: 'jimeng_high_aes_gene',
                prompt: '一座美丽的中国古建筑',
                width: 1024,
                height: 1024,
                seed: -1,
                return_url: true
            }
        })
    ];

    const host = 'open.volcengineapi.com';
    const query = 'Action=CVProcess&Version=2022-08-31';
    const xDate = new Date().toISOString().replace(/[:\-]/g, '').replace(/\.\d{3}Z$/, 'Z');

    for (let i = 0; i < bodyFormats.length; i++) {
        console.log(`尝试Body格式 ${i + 1}...`);

        const authorization = sign('POST', host, '/', query, bodyFormats[i], xDate);
        const url = `https://${host}/?${query}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Date': xDate,
                    'Authorization': authorization,
                    'Host': host
                },
                body: bodyFormats[i]
            });

            const data = await response.json();
            console.log(`  状态: ${response.status}, 码: ${data.code || 'N/A'}`);

            if (data.code === 10000 || data.code === 0 || response.ok) {
                console.log('  ✅ 成功！');
                console.log('  响应:', JSON.stringify(data, null, 2));
                return;
            }
        } catch (error) {
            console.log(`  错误: ${error.message}`);
        }
    }
}

// 运行所有测试
async function runAllTests() {
    await testJimengAPI();
    await testDirectHTTP();
}

runAllTests();
