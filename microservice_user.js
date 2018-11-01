'use strict';

const business = require('./modules/monolithic_user.js');
const cluster = require('cluster'); // cluster 모듈
const conf = require('./conf/config').setting;
// const serverIp = '35.200.103.250';
/**
  Quest 클래스
  MicroService Architecture : Quest
  developer - ijgong
  date - 20181030
  target git - msa_be_quest:develop
*/
class user extends require('./server.js') {
  constructor () {

    // 초기화
    super('user',
      process.argv[2] ? Number(process.argv[2]) : conf.service.port,
      ['POST/user', 'GET/user', 'PUT/user', 'DELETE/user']
    );

    // Distributor 접속
    this.connectToDistributor(conf.distribute.ip, conf.distribute.port, (data) => {
      console.log("Distributor Notification", data);
    });
  }

  onRead (socket, data) { // onRead 구현
    console.log('onRead', socket.remoteAddress, socket.remotePort, data);
    business.onRequest(socket, data.method, data.uri, data.params, (s, packet) => {
      socket.write(JSON.stringify(packet) + '¶');  // 응답 패킷 전송
    });
  }
}

if (cluster.isMaster) { // 부모 프로세스일 경우 자식 프로세스 실행
  cluster.fork();

  // exit 이벤트가 발생하면 새로운 자식 프로세스 실행
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  new user();  // 인스턴스 생성
}
