/**
 * 即梦AI 4.0 图片生成服务
 * 文档：https://www.volcengine.com/docs/85621/1817045
 * 
 * 即梦AI使用异步任务接口：
 * 1. 提交任务 (CVSync2AsyncSubmitTask) -> 获取 task_id
 * 2. 轮询查询 (CVTask 或其他接口) -> 获取生成结果
 */

/**
 * 将字符串转换为ArrayBuffer
 */
function stringToBuffer(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

/**
 * 将ArrayBuffer转换为十六进制字符串
 */
function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * 使用Web Crypto API生成HMAC-SHA256
 */
async function hmacSha256(key, message) {
    const keyBuffer = typeof key === 'string' ? stringToBuffer(key) : key;
    const messageBuffer = typeof message === 'string' ? stringToBuffer(message) : message;
    
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
    return signature;
}

/**
 * 使用Web Crypto API生成SHA256哈希
 */
async function sha256(message) {
    const messageBuffer = typeof message === 'string' ? stringToBuffer(message) : message;
    const hashBuffer = await crypto.subtle.digest('SHA-256', messageBuffer);
    return hashBuffer;
}

/**
 * 生成火山引擎API签名
 * 参考：https://www.volcengine.com/docs/6369/67269
 */
async function generateSignature(method, host, uri, queryString, body, accessKeyId, secretKey, xDate) {
    const dateStamp = xDate.substring(0, 8);
    const credentialScope = `${dateStamp}/cn-north-1/cv/request`;
    
    // 规范头
    const signedHeaders = 'host;x-date';
    const canonicalHeaders = `host:${host}\nx-date:${xDate}\n`;
    
    // 请求体哈希
    const bodyHashBuffer = await sha256(body);
    const payloadHash = bufferToHex(bodyHashBuffer);
    
    // 规范请求
    const canonicalRequest = [
        method,
        uri,
        queryString,
        canonicalHeaders,
        signedHeaders,
        payloadHash
    ].join('\n');
    
    // 待签名字符串
    const canonicalRequestHashBuffer = await sha256(canonicalRequest);
    const canonicalRequestHash = bufferToHex(canonicalRequestHashBuffer);
    
    const stringToSign = [
        'HMAC-SHA256',
        xDate,
        credentialScope,
        canonicalRequestHash
    ].join('\n');
    
    // 计算签名
    const kDate = await hmacSha256(secretKey, dateStamp);
    const kRegion = await hmacSha256(kDate, 'cn-north-1');
    const kService = await hmacSha256(kRegion, 'cv');
    const kSigning = await hmacSha256(kService, 'request');
    
    const signatureBuffer = await hmacSha256(kSigning, stringToSign);
    const signature = bufferToHex(signatureBuffer);
    
    // Authorization头
    return `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

/**
 * 提交即梦AI生图任务（通过代理服务器）
 * @param {string} prompt - 生成提示词
 * @param {string} accessKeyId - Access Key ID
 * @param {string} secretAccessKey - Secret Access Key
 * @returns {Promise<string>} task_id
 */
export async function submitJimengTask(prompt, accessKeyId, secretAccessKey) {
    if (!accessKeyId || !secretAccessKey) {
        throw new Error("即梦AI密钥未配置");
    }

    console.log('[Jimeng AI] 通过代理提交任务:', prompt.substring(0, 50) + '...');
    
    // 使用代理服务器
    const proxyUrl = 'http://localhost:3002/api/jimeng/submit';
    
    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt,
            accessKeyId,
            secretAccessKey
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`代理服务器错误: ${error.error || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Jimeng AI] 代理返回:', JSON.stringify(data, null, 2));
    
    // 检查API错误
    if (data.ResponseMetadata?.Error) {
        const error = data.ResponseMetadata.Error;
        throw new Error(`即梦AI API错误: ${error.Code} - ${error.Message}`);
    }
    
    // 处理响应
    const resultData = data.Result || data;
    const code = resultData.code !== undefined ? resultData.code : resultData.status;
    
    if (code !== 10000 && code !== 0 && code !== undefined) {
        throw new Error(`提交任务失败: ${resultData.message || JSON.stringify(resultData)}`);
    }
    
    const taskId = resultData.data?.task_id || resultData.task_id;
    if (!taskId) {
        console.error('[Jimeng AI] 响应数据:', resultData);
        throw new Error('未获取到task_id，响应结构: ' + JSON.stringify(Object.keys(resultData)));
    }
    
    console.log('[Jimeng AI] 任务已提交，task_id:', taskId);
    return taskId;
}

/**
 * 查询即梦AI任务状态（通过代理服务器）
 * @param {string} taskId - 任务ID
 * @param {string} accessKeyId - Access Key ID
 * @param {string} secretAccessKey - Secret Access Key
 * @returns {Promise<Object>} 任务状态
 */
export async function queryJimengTask(taskId, accessKeyId, secretAccessKey) {
    console.log('[Jimeng AI] 通过代理查询任务:', taskId);
    
    // 使用代理服务器
    const proxyUrl = 'http://localhost:3002/api/jimeng/query';
    
    const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            taskId,
            accessKeyId,
            secretAccessKey
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`代理服务器错误: ${error.error || response.statusText}`);
    }
    
    const data = await response.json();
    return data;
}

/**
 * 等待即梦AI任务完成并获取结果
 * @param {string} taskId - 任务ID
 * @param {string} accessKeyId - Access Key ID
 * @param {string} secretAccessKey - Secret Access Key
 * @param {Function} onProgress - 进度回调 (attempt, status)
 * @param {number} maxAttempts - 最大轮询次数
 * @returns {Promise<string[]>} 图片URL列表
 */
export async function waitForJimengTask(
    taskId,
    accessKeyId,
    secretAccessKey,
    onProgress = null,
    maxAttempts = 60
) {
    console.log('[Jimeng AI] 等待任务完成...');
    
    for (let i = 0; i < maxAttempts; i++) {
        // 等待3秒
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
            const response = await queryJimengTask(taskId, accessKeyId, secretAccessKey);
            
            // 检查错误
            if (response.ResponseMetadata?.Error) {
                const errorMsg = response.ResponseMetadata.Error.Message;
                console.log(`[Jimeng AI] 查询接口错误: ${errorMsg}`);
                
                if (onProgress) {
                    onProgress(i + 1, 'error');
                }
                
                continue;
            }
            
            const resultData = response.Result || response;
            const code = resultData.code || resultData.status;
            const status = resultData.data?.status;
            
            if (onProgress) {
                onProgress(i + 1, status || 'processing');
            }
            
            console.log(`[Jimeng AI] 第${i + 1}次查询: code=${code}, status=${status}`);
            
            if (code === 10000 || code === 0) {
                // 根据官方文档：status 可能为 in_queue, generating, done, failed
                if (status === 'done') {
                    const imageUrls = resultData.data?.image_urls || [];
                    console.log('[Jimeng AI] 任务完成，生成图片数:', imageUrls.length);
                    return imageUrls;
                } else if (status === 'failed') {
                    throw new Error(`任务失败: ${resultData.data?.message || '未知错误'}`);
                } else if (status === 'generating') {
                    console.log('[Jimeng AI] 图片生成中...');
                } else if (status === 'in_queue') {
                    console.log('[Jimeng AI] 任务排队中...');
                }
            }
        } catch (error) {
            console.log(`[Jimeng AI] 查询出错: ${error.message}`);
            
            if (onProgress) {
                onProgress(i + 1, 'error');
            }
        }
    }
    
    throw new Error('任务超时，请稍后重试');
}

/**
 * 使用即梦AI生成图片（完整流程）
 * @param {string} prompt - 生成提示词
 * @param {string} accessKeyId - Access Key ID
 * @param {string} secretAccessKey - Secret Access Key
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<string>} 图片URL
 */
export async function generateImageWithJimeng(
    prompt,
    accessKeyId,
    secretAccessKey,
    onProgress = null
) {
    console.log('[generateImageWithJimeng] Starting with prompt:', prompt.substring(0, 50) + '...');
    console.log('[generateImageWithJimeng] AccessKeyId:', accessKeyId.substring(0, 20) + '...');
    
    // 1. 提交任务
    console.log('[generateImageWithJimeng] Submitting task...');
    const taskId = await submitJimengTask(prompt, accessKeyId, secretAccessKey);
    console.log('[generateImageWithJimeng] Task submitted, ID:', taskId);
    
    // 2. 等待任务完成
    console.log('[generateImageWithJimeng] Waiting for task completion...');
    const imageUrls = await waitForJimengTask(
        taskId,
        accessKeyId,
        secretAccessKey,
        onProgress
    );
    
    console.log('[generateImageWithJimeng] Task completed, URLs:', imageUrls);
    
    if (!imageUrls || imageUrls.length === 0) {
        throw new Error('未获取到生成的图片，可能是查询接口暂时不可用');
    }
    
    return imageUrls[0];  // 返回第一张图片
}

/**
 * 检查即梦AI配置是否有效
 * @param {string} accessKeyId - Access Key ID
 * @param {string} secretAccessKey - Secret Access Key
 * @returns {Promise<boolean>}
 */
export async function validateJimengConfig(accessKeyId, secretAccessKey) {
    try {
        // 尝试提交一个简单的任务来验证配置
        await submitJimengTask('test', accessKeyId, secretAccessKey);
        return true;
    } catch (error) {
        console.error('[Jimeng AI] 配置验证失败:', error.message);
        return false;
    }
}
