/**
 * 即梦AI 4.0 API 测试脚本
 * 使用异步任务接口
 * 文档：https://www.volcengine.com/docs/85621/1817045
 */

const { Service } = require('@volcengine/openapi');

// 您的密钥信息
const ACCESS_KEY_ID = 'AKLTODdiN2IyNDEzMzg4NGI0YjgwOTAxNTVhMDk1ODQwY2Q';
const SECRET_ACCESS_KEY = 'WVRVNE1HUTFOR0ZpWlRnMk5HTXpPRGszT0dReE5HVXdNemM1TkRNNFpUaw==';

// 配置
const HOST = 'visual.volcengineapi.com';
const SERVICE_NAME = 'cv';
const REGION = 'cn-north-1';

/**
 * 提交生成任务
 */
async function submitTask(service, prompt) {
    console.log('📤 提交生成任务...');

    const submitAPI = service.createAPI('CVSync2AsyncSubmitTask', {
        Version: '2022-08-31',
        method: 'POST',
        contentType: 'json',
    });

    const requestBody = {
        req_key: 'jimeng_t2i_v40',  // 即梦4.0服务标识
        prompt: prompt,
        // 可选参数
        size: 2048 * 2048,  // 2K分辨率
        force_single: true,  // 强制生成单图（延迟更低）
        return_url: true
    };

    console.log('请求参数:', JSON.stringify(requestBody, null, 2));

    const response = await submitAPI(requestBody);
    console.log('提交响应:', JSON.stringify(response, null, 2));

    return response;
}

/**
 * 查询任务结果 - 尝试不同的Action名称
 */
async function queryTask(service, taskId) {
    // 尝试不同的查询接口名称
    const actionNames = ['CVTask', 'GetCVTask', 'QueryCVTask', 'CVGetTask'];
    
    for (const actionName of actionNames) {
        try {
            const queryAPI = service.createAPI(actionName, {
                Version: '2022-08-31',
                method: 'POST',
                contentType: 'json',
            });

            const requestBody = {
                req_key: 'jimeng_t2i_v40',
                task_id: taskId
            };

            const response = await queryAPI(requestBody);
            
            // 检查是否成功（没有Error字段）
            if (!response.ResponseMetadata?.Error) {
                console.log(`✅ 找到正确的查询接口: ${actionName}`);
                return { ...response, _actionName: actionName };
            }
        } catch (error) {
            // 继续尝试下一个
            continue;
        }
    }
    
    // 如果都失败了，使用CVSync2AsyncQueryTask并返回错误
    const queryAPI = service.createAPI('CVSync2AsyncQueryTask', {
        Version: '2022-08-31',
        method: 'POST',
        contentType: 'json',
    });

    const requestBody = {
        req_key: 'jimeng_t2i_v40',
        task_id: taskId
    };

    return await queryAPI(requestBody);
}

/**
 * 轮询等待任务完成
 */
async function waitForTask(service, taskId, maxAttempts = 60) {
    console.log(`⏳ 等待任务完成，task_id: ${taskId}`);

    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 等待3秒

        try {
            const response = await queryTask(service, taskId);
            
            console.log(`\n  第${i + 1}次查询:`);
            
            // 检查是否有错误
            if (response.ResponseMetadata?.Error) {
                console.log(`  接口错误: ${response.ResponseMetadata.Error.Message}`);
                continue;
            }

            // 火山引擎SDK返回的数据在Result字段中
            const resultData = response.Result || response;
            
            console.log('  响应数据:', JSON.stringify(resultData, null, 2).substring(0, 300));

            // 检查状态码
            const code = resultData.code || resultData.status;
            const status = resultData.data?.status;
            
            console.log(`  -> code: ${code}, status: ${status}`);

            if (code === 10000 || code === 0) {
                if (status === 'success') {
                    console.log('✅ 任务完成！');
                    return response;
                } else if (status === 'failed') {
                    throw new Error(`任务失败: ${resultData.data?.message || '未知错误'}`);
                } else if (status === 'processing' || status === 'queued' || !status) {
                    console.log(`    状态: ${status || '处理中'}，继续等待...`);
                    continue;
                }
            } else {
                console.log(`    查询返回非成功码: ${code}`);
                continue;
            }
        } catch (error) {
            console.log(`    查询出错: ${error.message}`);
            continue;
        }
    }

    throw new Error('任务超时');
}

/**
 * 测试即梦AI 4.0
 */
async function testJimengV4() {
    console.log('🧪 开始测试即梦AI 4.0...\n');

    try {
        // 创建服务实例
        const service = new Service({
            host: HOST,
            serviceName: SERVICE_NAME,
            region: REGION,
            accessKeyId: ACCESS_KEY_ID,
            secretKey: SECRET_ACCESS_KEY,
        });

        // 提交任务
        const prompt = '一座美丽的中国古建筑，飞檐翘角，红墙绿瓦';
        const submitResponse = await submitTask(service, prompt);

        const submitData = submitResponse.Result || submitResponse;
        const code = submitData.code || submitData.status;
        
        if (code !== 10000 && code !== 0) {
            console.log('❌ 提交任务失败:', submitData.message);
            return;
        }

        const taskId = submitData.data?.task_id;
        if (!taskId) {
            console.log('❌ 未获取到task_id');
            return;
        }

        console.log(`✅ 任务已提交，task_id: ${taskId}\n`);

        // 轮询等待结果
        const result = await waitForTask(service, taskId);

        console.log('\n📄 最终结果:');
        console.log(JSON.stringify(result, null, 2));

        // 提取图片URL
        const resultData = result.Result || result;
        if (resultData.data?.image_urls && resultData.data.image_urls.length > 0) {
            console.log('\n🖼️  生成的图片URL:');
            resultData.data.image_urls.forEach((url, index) => {
                console.log(`  ${index + 1}. ${url}`);
            });
        }

    } catch (error) {
        console.log('\n❌ 测试失败:', error.message);
        console.log(error.stack);
    }
}

// 运行测试
testJimengV4();
