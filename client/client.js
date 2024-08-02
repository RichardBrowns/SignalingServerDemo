const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;
let peerConnection;
const ws = new WebSocket('ws://localhost:8080');
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// WebSocket连接打开后，发送登录消息
ws.onopen = () => {
    console.log('已连接信令服务器');
    ws.send(JSON.stringify({ type: 'login', name: 'user-1' }));
};

// 处理收到的WebSocket消息
ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    switch (data.type) {
        case 'offer':
            handleOffer(data.offer);
            break;
        case 'answer':
            handleAnswer(data.answer);
            break;
        case 'candidate':
            handleCandidate(data.candidate);
            break;
        default:
            console.log('未知消息类型:', data.type);
    }
};

// 获取本地媒体流
async function startLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (err) {
        console.error('访问媒体设备出错.', err);
    }
}

// 创建RTCPeerConnection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // 处理ICE候选事件，发送候选信息给信令服务器
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({ type: 'candidate', name: 'user-2', candidate: event.candidate }));
        }
    };

    // 处理远程流的track事件，显示远程视频
    peerConnection.ontrack = (event) => {
        if (!remoteStream) {
            remoteStream = new MediaStream();
            remoteVideo.srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };

    // 将本地流的所有track添加到RTCPeerConnection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
}

// 处理收到的offer消息
async function handleOffer(offer) {
    createPeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    ws.send(JSON.stringify({ type: 'answer', name: 'user-1', answer: answer }));
}

// 处理收到的answer消息
async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// 处理收到的ICE候选消息
function handleCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// 启动本地视频流
startLocalStream();