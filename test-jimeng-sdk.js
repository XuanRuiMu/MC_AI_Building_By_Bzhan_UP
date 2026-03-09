/**
 * 即梦AI API 测试脚本 - 使用官方SDK
 */

const { Service } = require('@volcengine/openapi');

// 您的密钥信息
const ACCESS_KEY_ID = 'AKLTODdiN2IyNDEzMzg4NGI0YjgwOTAxNTVhMDk1ODQwY2Q';
const SECRET_ACCESS_KEY = 'WVRVNE1HUTFOR0ZpWlRnMk5HTXpPRGszT0dReE5HVXdNemM1TkRNNFpUaw==';

async function testJimengAPI() {
    console.log('🧪 开始测试即梦AI API (使用官方SDK)...\n');

    try {
        // 创建服务实例
        const service = new Service({
            host: 'open.volcengineapi.com',
            serviceName: 'cv',
            region: 'cn-north-1',
            accessKeyId: ACCESS_KEY_ID,
            secretKey: SECRET_ACCESS_KEY,
        });

        // 创建 API 调用
        const api = service.createAPI('CVProcess', {
            Version: '2022-08-31',
            method: 'POST',
            contentType: 'json',
        });

        // 请求参数
        const params = {
            req_key: 'jimeng_high_aes_gene',
            prompt: '一座美丽的中国古建筑，飞檐翘角，红墙绿瓦',
            width: 1024,
            height: 1024,
            seed: -1,
            return_url: true
        };

        console.log('📤 请求参数：');
        console.log(JSON.stringify(params, null, 2));
        console.log('\n');

        // 发送请求
        const response = await api(params);

        console.log('✅ 测试成功！密钥有效');
        console.log('📄 响应数据：');
        console.log(JSON.stringify(response, null, 2));

        if (response.data?.image_url) {
            console.log('\n🖼️  生成的图片URL:', response.data.image_url);
        }
    } catch (error) {
        console.log('❌ 测试失败');
        console.log('错误信息：', error.message);
        if (error.response) {
            console.log('响应数据：', JSON.stringify(error.response, null, 2));
        }
    }
}

// 运行测试
testJimengAPI();
