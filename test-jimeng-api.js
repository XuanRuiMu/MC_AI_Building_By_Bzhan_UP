/**
 * 即梦AI API 测试脚本
 * 用于验证 Access Key ID 和 Secret Access Key 是否有效
 * 参考：https://www.volcengine.com/docs/6369/67269
 */

const crypto = require('crypto');

// 您的密钥信息
const ACCESS_KEY_ID = 'AKLTODdiN2IyNDEzMzg4NGI0YjgwOTAxNTVhMDk1ODQwY2Q';
const SECRET_ACCESS_KEY = 'WVRVNE1HUTFOR0ZpWlRnMk5HTXpPRGszT0dReE5HVXdNemM1TkRNNFpUaw==';

// 火山引擎 API 配置
const SERVICE = 'cv';
const REGION = 'cn-north-1';
const HOST = 'open.volcengineapi.com';

/**
 * 生成 HMAC-SHA256
 */
function hmacSha256(key, message) {
    return crypto.createHmac('sha256', key).update(message).digest();
}

/**
 * 生成火山引擎签名
 * 参考：https://www.volcengine.com/docs/6369/67269
 */
function sign(request, secretAccessKey) {
    // 1. 创建规范请求
    const httpMethod = request.method || 'GET';
    const canonicalUri = request.pathname || '/';
    const canonicalQueryString = request.query || '';

    // 规范头
    const signedHeaders = 'host;x-date';
    const canonicalHeaders = `host:${request.host}\nx-date:${request.xDate}\n`;

    // 请求体哈希
    const body = request.body || '';
    const hashedPayload = crypto.createHash('sha256').update(body).digest('hex');

    const canonicalRequest = [
        httpMethod,
        canonicalUri,
        canonicalQueryString,
        canonicalHeaders,
        signedHeaders,
        hashedPayload
    ].join('\n');

    console.log('Canonical Request:');
    console.log(canonicalRequest);
    console.log('---');

    // 2. 创建待签名字符串
    const algorithm = 'HMAC-SHA256';
    const dateStamp = request.xDate.substring(0, 8);
    const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/request`;
    const stringToSign = [
        algorithm,
        request.xDate,
        credentialScope,
        crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');

    console.log('String to Sign:');
    console.log(stringToSign);
    console.log('---');

    // 3. 计算签名密钥
    const kDate = hmacSha256(secretAccessKey, dateStamp);
    const kRegion = hmacSha256(kDate, REGION);
    const kService = hmacSha256(kRegion, SERVICE);
    const kSigning = hmacSha256(kService, 'request');

    // 4. 计算签名
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    // 5. 创建 Authorization 头
    const authorization = `${algorithm} Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return authorization;
}

/**
 * 测试即梦AI API
 */
async function testJimengAPI() {
    console.log('🧪 开始测试即梦AI API...\n');

    const xDate = new Date().toISOString().replace(/[:\-]/g, '').replace(/\.\d{3}Z$/, 'Z');

    // 请求体 - 业务参数
    const requestBody = {
        req_key: 'jimeng_high_aes_gene',
        prompt: '一座美丽的中国古建筑，飞檐翘角，红墙绿瓦',
        width: 1024,
        height: 1024,
        seed: -1,
        return_url: true
    };

    const body = JSON.stringify(requestBody);

    // Query 参数
    const queryParams = 'Action=CVProcess&Version=2022-08-31';

    // 构建签名请求
    const request = {
        method: 'POST',
        host: HOST,
        pathname: '/',
        query: queryParams,
        xDate: xDate,
        body: body
    };

    // 生成签名
    const authorization = sign(request, SECRET_ACCESS_KEY);

    // 构建完整 URL
    const url = `https://${HOST}/?${queryParams}`;

    console.log('📤 请求信息：');
    console.log('  URL:', url);
    console.log('  X-Date:', xDate);
    console.log('  Authorization:', authorization.substring(0, 60) + '...\n');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Date': xDate,
                'Authorization': authorization,
                'Host': HOST
            },
            body: body
        });

        console.log('📥 响应状态：', response.status, response.statusText);

        const responseData = await response.json();

        if (response.ok) {
            console.log('\n✅ 测试成功！密钥有效');
            console.log('📄 响应数据：');
            console.log(JSON.stringify(responseData, null, 2));

            if (responseData.data?.image_url) {
                console.log('\n🖼️  生成的图片URL:', responseData.data.image_url);
            }
        } else {
            console.log('\n❌ 测试失败');
            console.log('错误信息：', JSON.stringify(responseData, null, 2));
        }
    } catch (error) {
        console.log('\n❌ 请求出错：', error.message);
    }
}

// 运行测试
testJimengAPI();
