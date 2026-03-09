/**
 * 即梦AI API 代理服务器
 * 解决浏览器CORS限制问题
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Volcengine API配置
const SERVICE = 'cv';  // 视觉智能服务
const REGION = 'cn-north-1';  // 华北1
const HOST = 'visual.volcengineapi.com';

/**
 * 生成HMAC-SHA256
 */
function hmacSha256(key, message) {
    return crypto.createHmac('sha256', key).update(message).digest();
}

/**
 * 生成SHA256哈希
 */
function sha256(message) {
    return crypto.createHash('sha256').update(message).digest();
}

/**
 * 生成Volcengine API签名
 * 参考文档：https://www.volcengine.com/docs/6369/67269
 */
function generateSignature(method, uri, queryString, headers, body, secretAccessKey, date) {
    // 1. 创建Canonical Request
    const headerKeys = Object.keys(headers).sort();
    const canonicalHeaders = headerKeys.map(k => `${k.toLowerCase()}:${headers[k]}\n`).join('');
    const signedHeaders = headerKeys.map(k => k.toLowerCase()).join(';');
    
    const bodyHash = body ? sha256(body).toString('hex') : sha256('').toString('hex');
    
    const canonicalRequest = [
        method,
        uri,
        queryString,
        canonicalHeaders,
        signedHeaders,
        bodyHash
    ].join('\n');
    
    console.log('[Jimeng Proxy] Canonical Request:', canonicalRequest);
    
    // 2. 创建String to Sign
    const credentialScope = `${date.substring(0, 8)}/${REGION}/${SERVICE}/request`;
    const stringToSign = [
        'HMAC-SHA256',
        date,
        credentialScope,
        sha256(canonicalRequest).toString('hex')
    ].join('\n');
    
    console.log('[Jimeng Proxy] String to Sign:', stringToSign);
    
    // 3. 计算签名 - 修正：直接使用 SecretKey，不加前缀
    const kDate = hmacSha256(secretAccessKey, date.substring(0, 8));
    const kRegion = hmacSha256(kDate, REGION);
    const kService = hmacSha256(kRegion, SERVICE);
    const kSigning = hmacSha256(kService, 'request');
    const signature = hmacSha256(kSigning, stringToSign).toString('hex');
    
    console.log('[Jimeng Proxy] Signature:', signature.substring(0, 20) + '...');
    
    return signature;
}

/**
 * 创建请求头
 * 参考：https://www.volcengine.com/docs/6369/67269
 */
function createHeaders(method, uri, queryString, body, accessKeyId, secretAccessKey) {
    // 生成日期格式：YYYYMMDD'T'HHMMSS'Z'
    const now = new Date();
    const date = now.toISOString().replace(/[:\-]/g, '').replace(/\.\d{3}Z$/, 'Z');
    
    const headers = {
        'X-Date': date,
        'Host': HOST
    };
    
    if (body) {
        headers['Content-Type'] = 'application/json';
    }
    
    const signature = generateSignature(method, uri, queryString, headers, body, secretAccessKey, date);
    const credentialScope = `${date.substring(0, 8)}/${REGION}/${SERVICE}/request`;
    
    const headerKeys = Object.keys(headers).sort().map(k => k.toLowerCase()).join(';');
    headers['Authorization'] = `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${headerKeys}, Signature=${signature}`;
    
    console.log('[Jimeng Proxy] Headers:', JSON.stringify(headers, null, 2));
    
    return headers;
}

// 提交任务接口
app.post('/api/jimeng/submit', async (req, res) => {
    try {
        const { prompt, accessKeyId, secretAccessKey } = req.body;
        
        if (!prompt || !accessKeyId || !secretAccessKey) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const uri = '/';
        const queryString = 'Action=CVSync2AsyncSubmitTask&Version=2022-08-31';
        const url = `https://${HOST}${uri}?${queryString}`;
        
        // 根据即梦AI 4.0 文档，请求参数格式
        const body = JSON.stringify({
            req_key: 'jimeng_t2i_v40',
            prompt: prompt,
            size: 2048 * 2048,  // 2K分辨率，默认
            return_url: true
        });
        
        const headers = createHeaders('POST', uri, queryString, body, accessKeyId, secretAccessKey);
        
        console.log('[Jimeng Proxy] Submitting task...');
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        });
        
        const data = await response.json();
        console.log('[Jimeng Proxy] Submit response:', JSON.stringify(data, null, 2));
        
        // 检查是否有错误
        if (data.ResponseMetadata?.Error) {
            console.error('[Jimeng Proxy] API Error:', data.ResponseMetadata.Error);
        }
        
        res.json(data);
    } catch (error) {
        console.error('[Jimeng Proxy] Submit error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// 查询任务接口 - 使用官方文档的正确接口 CVSync2AsyncGetResult
app.post('/api/jimeng/query', async (req, res) => {
    try {
        const { taskId, accessKeyId, secretAccessKey } = req.body;
        
        if (!taskId || !accessKeyId || !secretAccessKey) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        
        const uri = '/';
        // 官方文档正确接口：Action=CVSync2AsyncGetResult, Version=2022-08-31
        const queryString = 'Action=CVSync2AsyncGetResult&Version=2022-08-31';
        const url = `https://${HOST}${uri}?${queryString}`;
        
        // 官方文档请求参数
        const reqJson = JSON.stringify({
            return_url: true
        });
        
        const body = JSON.stringify({
            req_key: 'jimeng_t2i_v40',
            task_id: taskId,
            req_json: reqJson
        });
        
        const headers = createHeaders('POST', uri, queryString, body, accessKeyId, secretAccessKey);
        
        console.log('[Jimeng Proxy] Querying task with CVSync2AsyncGetResult:', taskId);
        console.log('[Jimeng Proxy] Request body:', body);
        
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        });
        
        const data = await response.json();
        console.log('[Jimeng Proxy] Query response:', JSON.stringify(data, null, 2));
        
        res.json(data);
        
    } catch (error) {
        console.error('[Jimeng Proxy] Query error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`[Jimeng Proxy] Server running on port ${PORT}`);
    console.log(`[Jimeng Proxy] Submit endpoint: http://localhost:${PORT}/api/jimeng/submit`);
    console.log(`[Jimeng Proxy] Query endpoint: http://localhost:${PORT}/api/jimeng/query`);
});
