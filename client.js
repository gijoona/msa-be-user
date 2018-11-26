'use strict'; // Strict 모드 사용

const net = require('net');

/**
  tcpClient 클래스
*/
class tcpClient {

  /**
    생성자
  */
  constructor (host, port, onCreate, onRead, onEnd, onError) {
    this.options = {
      host: host,
      port: port
    };

    this.onCreate = onCreate;
    this.onRead = onRead;
    this.onEnd = onEnd;
    this.onError = onError;
  }

  /**
    접속 함수
  */
  connect () {
    this.client = net.connect(this.options, () => {
      if (this.onCreate) {

        // 접속완료 이벤트 콜백
        this.onCreate(this.options);
      }
    });

    // 데이터수신 처리
    this.client.on('data', (data) => {
      this.merge = this.merge instanceof Array ? this.merge : [];
      this.merge.push(Buffer.from(data));

      let sz = data.toString();
      if (sz.charAt(sz.length - 1) == '¶') {
        let mergeBuf = this.merge,
            buf = Buffer.concat(mergeBuf),
            bToS = buf.toString().replace('¶', '');
        if (bToS != "") {
          this.merge = [];
          this.onRead(this.options, JSON.parse(bToS));
        }
      }
    });

    // 접속종료 처리
    this.client.on('close', () => {
      if (this.onEnd) {
        this.onEnd(this.options);
      }
    });

    // 에러발생 처리
    this.client.on('error', (err) => {
      if (this.onError) {
        this.onError(this.options, err);
      }
    });
  }

  /**
    데이터 발송
  */
  write (packet) {
    this.client.write(JSON.stringify(packet) + '¶');
  }
}

module.exports = tcpClient;
