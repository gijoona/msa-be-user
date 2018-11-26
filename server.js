'use strict';

const net = require('net');
const tcpClient = require('./client.js'); // tcpClient 클래스 참조

/**
  tcpServer 클래스
*/
class tcpServer {

  // 생성자
  constructor (name, port, urls) {
    this.logTcpClient = null; // 로그 관리 마이크로서비스 연결 클라이언트

    // 서버정보
    this.context = {
      port: port,
      name: name,
      urls: urls
    };
    this.merge = {};

    // 서버생성
    this.server = net.createServer((socket) => {
      this.onCreate(socket);

      // 에러 이벤트 처리
      socket.on('error', (exception) => {
        this.onClose(exception, socket);
      });

      // 클라이언트 접속 정료 이벤트 처리
      socket.on('close', () => {
        this.onClose(null, socket);
      });

      // 데이터 수신 처리
      socket.on('data', (data) => {
        let key = socket.remoteAddress + ':' + socket.remotePort;
        this.merge[key] = this.merge[key] instanceof Array ? this.merge[key] : [];
        this.merge[key].push(Buffer.from(data));

        let sz = data.toString();
        if (sz.charAt(sz.length - 1) == '¶') {
          let mergeBuf = this.merge[key],
              buf = Buffer.concat(mergeBuf),
              bToS = buf.toString().replace('¶', '');
          if (bToS != "") {
            this.merge[key] = [];
            this.writeLog(bToS);
            this.onRead(socket, JSON.parse(bToS));
          }
        }
      });
    });

    // 서버 객체 에러 처리
    this.server.on('error', (err) => {
      console.log(err);
    });

    // listen
    this.server.listen(port, () => {
      console.log('listen', this.server.address());
    });
  }

  onCreate (socket) {
    console.log('onCreate', socket.remoteAddress, socket.remotePort);
  }

  onClose (err, socket) {
    console.log('onClose', socket.remoteAddress, socket.remotePort, (err || ''));
  }

  // Distributor 접속
  connectToDistributor (host, port, onNoti) {
    var packet = {
      uri: "/distributes",
      method: 'POST',
      key: 0,
      params: this.context
    };
    let isConnectedDistributor = false;

    this.clientDistributor = new tcpClient(
      host,
      port,
      (options) => {  // 접속 이벤트. onCreate
        isConnectedDistributor = true;
        this.clientDistributor.write(packet);
      },
       (options, data) => {
         // 로그 관리 마이크로서비스 연결
         if (this.logTcpClient == null && this.context.name != 'logs') {
           for (let n in data.params) {
             const ms = data.params[n];
             if (ms.name == 'logs') {
               this.connectToLog(ms.host, ms.port);
               break;
             }
           }
         }

         onNoti(data);
       },  // 데이터 수신 이벤트. onRead
       (options) => { isConnectedDistributor = false; }, // 접속 종료 이벤트. onEnd
       (options) => { isConnectedDistributor = false; }  // 에러 처리 이벤트. onError
    );

    //  주기적인 Distributor 접속 시도
    setInterval(() => {
      if (!isConnectedDistributor) {
        this.clientDistributor.connect();
      }
    }, 3000);
  }

  // 로그 관리 마이크로서비스 연결
  connectToLog (host, port) {
    this.logTcpClient = new tcpClient(host, port
      , (options) => {}
      , (options) => { this.logTcpClient = null; }
      , (options) => { this.logTcpClient = null; }
    );
    this.logTcpClient.connect();
  }

  // log 패킷 전달
  writeLog (log) {
    if (this.logTcpClient) {
      const packet = {
        uri: '/logs',
        method: 'POST',
        key: 0,
        params: log
      };
      this.logTcpClient.write(packet);
    } else {
      console.log(log);
    }
  }
}

module.exports = tcpServer;  // export 선언
