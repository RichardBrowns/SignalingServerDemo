const WebSocket = require('ws');

// 创建WebSocket服务，监听8080端口
const server = new WebSocket.Server({ port: 8080 });

// 存储已连接的用户信息
let users = {};

// 处理新的WebSocket连接
server.on('connection', (socket) => {

    // 处理收到的消息
    socket.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'login':
                // 用户登录，保存用户连接信息
                users[data.name] = socket;
                socket.name = data.name;
                break;

            case 'offer':
                // 转发offer消息给指定用户
                if (users[data.name]) {
                    users[data.name].send(JSON.stringify({
                        type: 'offer',
                        offer: data.offer,
                        name: socket.name
                    }));
                }
                break;

            case 'answer':
                // 转发answer消息给指定用户
                if (users[data.name]) {
                    users[data.name].send(JSON.stringify({
                        type: 'answer',
                        answer: data.answer,
                        name: socket.name
                    }));
                }
                break;

            case 'candidate':
                // 转发ICE候选消息给指定用户
                if (users[data.name]) {
                    users[data.name].send(JSON.stringify({
                        type: 'candidate',
                        candidate: data.candidate,
                        name: socket.name
                    }));
                }
                break;
        }
    });

    // 处理连接关闭事件，删除用户信息
    socket.on('close', () => {
        delete users[socket.name];
    });
});