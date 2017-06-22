const Client = require('.');

//如果后端使用，需要模拟 sessionStorage 和 XMLHttpRequest，前端忽略这段
if(typeof sessionStorage === 'undefined') {
    global.sessionStorage = require('./lib/session_storage_emulator.js');
}
if(typeof XMLHttpRequest === 'undefined') {
    global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
}

async function run() {
    let client = new Client('http', 'localhost', 3000, 30); // 协议，地址，端口，超时时间
    let response = await client.accountLogin({
        account: '13800138001',
        password: '123456'
    });
    console.log(response);
}

run().catch((err) => {
    console.log(err.stack);
});
