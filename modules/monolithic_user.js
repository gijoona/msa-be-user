const _ = require('underscore'),
      conf = require('../conf/config').setting,
      mongoose = require('mongoose'),
      ObjectId = require('mongoose').Types.ObjectId,
      User = require('../models/User'),
      Quest = require('../models/Quest'),
      ReceiptQuest = require('../models/ReceiptQuest');

mongoose.Promise = require('bluebird');
mongoose.connect('mongodb+srv://gijoona:mongodb77@cluster-quester-euzkr.gcp.mongodb.net/quester', { promiseLibrary: require('bluebird') })
        .then(() => console.log('connection successful!!!'))
        .catch((err) => console.error(err));

const redis = require('redis').createClient(conf.redis.port, conf.redis.ip);  // redis 모듈 로드
redis.on('error', function (err) {  // Redis 에러 처리
  console.log('Redis Error ' + err);
});
/*
  TODO :: 필수 수정사항
  데이터 조회 시 전달할 수 있는 데이터량의 한계가 있음
  scrollpaging 또는 pagenation등을 적용하여 조회 시 데이터를 제한할 필요가 있음.
  receiptQuest 정보를 users collection의 subDoc이 아니라 별도의 collection으로 처리하는게 나을 것으로 보임
*/

/**
  사용자관리 REST API
  사용자등록: {
    method: POST,
    url: /quest
    parameter: {
      code: 코드
      category: '코드 카테고리',
      name: '코드명',
      description: '코드 설명',
      useyn: '사용여부'
    },
    result: {
      errorcode: '에러코드',
      errormessage: '에러메시지'
    }
  }
  사용자수정: {
    method: PUT
    url: /quest,
    parameter: {
      id: 코드아이디
      code: 코드,
      category: 코드 카테고리,
      name: 코드명,
      description: 코드 설명,
      useyn: 사용여부
    },
    result: {
      errorcode: 에러코드
      errormessage: 에러메시지
    }
  }
  사용자조회: {
    method: GET,
    url: /quest,
    parameter: {
      useyn: 사용여부
    },
    result: {
      errorcode: '에러코드',
      errormessage: '에러메시지',
      results: [{  //'코드목록'
        id: '고유번호',
        code: 코드,
        category: '코드 카테고리',
        name: '코드명',
        description: '코드 설명'
        useyn: 사용여부
      }, ...]
    }
  }
  사용자삭제: {
    method: DELETE,
    url: /quest,
    parameter: {
      id: '코드고유번호'
    },
    result: {
      errorcode: '에러코드',
      errormessage: '에러메시지'
    }
  }
*/
exports.onRequest = function (res, method, pathname, params, cb) {
  // 메서드별로 기능 분기
  switch (method) {
    case 'POST':
      return register(method, pathname, params, (response) => {
        process.nextTick(cb, res, response);
      });
    case 'GET':
      return inquiry(method, pathname, params, (response) => {
        process.nextTick(cb, res, response);
      });
    case 'PUT':
      return modify(method, pathname, params, (response) => {
        process.nextTick(cb, res, response);
      });
    case 'DELETE':
      return unregister(method, pathname, params, (response) => {
        process.nextTick(cb, res, response);
      });
    default:
      // 정의되지 않은 메서드면 null 리턴
      return process.nextTick(cb, res, null);
  }
}

function register (method, pathname, params, cb) {
  let parameters = params.data;
  let response = {
    key: params.key,
    errorcode: 0,
    errormessage: 'success'
  };
  if (parameters.length > 0) {
    for (let param of parameters) {
      if (param.code == null || param.category == null || param.name == null || param.description == null || param.useyn == null) {
        response.errorcode = 1;
        response.errormessage = 'Invalid Parameters';
      }
    }
    if (response.errorcode == 1) {
      cb(response);
    } else {
      var connection = mysql.createConnection(conn);
      connection.connect();
      connection.query('insert into code(code, category, name, description, useyn) values ?',
        [parameters.map(param => [param.code, param.category, param.name, param.description, param.useyn])],
        (error, results, fields) => {
          if (error) {
            response.errorcode = 1;
            response.errormessage = error;
          } else {  // Redis에 상품 정보 저장
            // const id = results[1][0].id;
            // redis.set(id, JSON.stringify(params));
          }
          cb(response);
        }
      );
      connection.end();
    }
  } else {
    response.errorcode = 1;
    response.errormessage = 'Empty Insert Data';
    cb(response);
  }
}

// params{userInfo:{}, receiptQuest:{}}
function modify (method, pathname, params, cb) {
  let parameters = params.data;
  let response = {
    key: params.key,
    errorcode: 0,
    errormessage: 'success'
  };

  redis.get(params.authorization, function (err, data) {
    let session = JSON.parse(data);
    User.findById(session['_id'], function (err, userDoc) {
      let userInfo = parameters.userInfo,
          questData = parameters.questInfo,
          query = questData['_id'] ? { '_id': questData['_id'] } : { '_id': mongoose.Types.ObjectId() };

      userInfo.quests = userDoc.quests;
      /* update or insert 처리
      option 참고
      upsert: 객체가 없을 경우 새로운 객체를 생성
      new: 변경된 객체를 반환
      setDefaultsOnInsert: 새로운 객체 생성 시 schema model의 기본값을 참조해서 생성
      */
      ReceiptQuest.findOneAndUpdate(query, questData, { upsert: true, new: true, setDefaultsOnInsert: true }, function (err, quest) {
        if (err) {
          console.error(err);
        } else {
          if (!questData['_id']) {
            userInfo.quests.push(quest);
          }
        }

        userDoc.update(userInfo, function (err, result) {
          if (err) {
            console.error(err);
            response.errorcode = 1;
            response.errormessage = err;
            cb(response);
          }

          if (result) {
            response.results = result;
            cb(response);
          } else {
            response.errorcode = 1;
            response.errormessage = 'Empty User Information';
            cb(response);
          }
        });
      });
    });
  });
}

function inquiry (method, pathname, params, cb) {
  let parameters = params.data;
  let response = {
    key: params.key,
    errorcode: 0,
    errormessage: 'success'
  };

  redis.get(params.authorization, function (err, data) {
    let userInfo = JSON.parse(data);

    User.findById(userInfo['_id']).populate('quests').exec((err, user) => {
      /*
      수령 퀘스트데이터 추가
      수령한 퀘스트를 분류(complete: 완료, process: 진행 중). findMany 활용
      */
      let questGroup = {
        complete: [],
        process: []
      }
      for (let quest of user.quests) {
        // 사용자 정보의 quests에서 해당 퀘스트정보를 추출
        if(!quest.state || quest.state === 'process') {
          // quest.state = 'process';
          questGroup.process.push(quest);
        } else {
          questGroup.complete.push(quest);
        }
      }
      response.quests = questGroup;
      user.quests = [];

      /*
        레벨데이터 추가
        "레벨산출공식" 적용 - ROUNDDOWN(LOG(경험치, 2))
        MongoDB document를 toJSON()으로 가져와서 처리
         - MongoDB document에서 직접 데이터를 get, set하는 것처럼 보이지만 내부적으로 get/set을 생성하여 처리하는 것이기 때문에
           JSON으로 받지않고 처리할 경우 별도의 로직이 필요.
      */
      let userData = user.toJSON();
      userData.powerLevel = calcLevel(userData.powerExp);
      userData.powerMaxExp = getMaxExp(userData.powerExp);
      userData.staminaLevel = calcLevel(userData.staminaExp);
      userData.staminaMaxExp = getMaxExp(userData.staminaExp);
      userData.knowledgeLevel = calcLevel(userData.knowledgeExp);
      userData.knowledgeMaxExp = getMaxExp(userData.knowledgeExp);
      userData.relationLevel = calcLevel(userData.relationExp);
      userData.relationMaxExp = getMaxExp(userData.relationExp);

      response.results = userData;
      cb(response);
    });
  });
}

function unregister (method, pathname, params, cb) {
  let parameters = params.data;
  var response = {
    key: params.key,
    errorcode: 0,
    errormessage: 'success'
  };

  if (parameters.id == null) {
    response.errorcode = 1;
    response.errormessage = 'Invalid Parameters';
    cb(response);
  } else {
    var connection = mysql.createConnection(conn);
    connection.connect();
    connection.query('delete from code where id = ?',
    parameters.id,
    (error, results, fields) => {
      if (error) {
        response.errorcode = 1;
        response.errormessage = error;
      } else {
        redis.del(parameters.id);
      }
      cb(response);
    });
    connection.end();
  }
}

/*
  레벨 산출용 함수
  "레벨산출공식" 적용 - ROUNDDOWN(LOG(경험치, 2))
  산출결과가 Infinity경우 0을 반환
  추후 util로 추출하는 것을 고려
*/
function calcLevel (exp) {
  let lv = Math.floor(Math.log2(exp));
  return isFinite(lv) ? lv : 0;
}

/*
  레벨구간별 습득가능경험치 산출용 함수
  "레벨구간별 습득가능경험치": ROUNDUP(POW(2, ROUNDDOWN(LOG(경험치, 2)) - 1)/100)
  산출결과가 Infinity경우 1을 반환
  추후 util로 추출하는 것을 고려
*/
function getMaxExp (exp) {
  let maxExp = Math.ceil(Math.pow(2, Math.floor(Math.log2(exp)) - 1)/100);
  if (isFinite(maxExp)) {
    maxExp = maxExp > 0 ? maxExp : 1;
  } else {
    maxExp = 1;
  }
  return maxExp;
}
