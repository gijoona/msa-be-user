const mongoose = require('mongoose'),
      Schema = mongoose.Schema,
      bcrypt = require('bcrypt-nodejs');

let UserSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    default: 'local'
  },
  username: {
    type: String,
    default: ''
  },
  power_exp: {
    type: Number,
    default: 0
  },
  stamina_exp: {
    type: Number,
    default: 0
  },
  knowledge_exp: {
    type: Number,
    default: 0
  },
  relation_exp: {
    type: Number,
    default: 0
  },
  gender: {
    type: String
  },
  email: {
    type: String
  },
  birthday: {
    type: Date
  },
  height: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number,
    default: 0
  },
  jobType: {
    type: String
  },
  job: {
    type: String
  }
});

// user 저장 시 전처리 - password 암호화
UserSchema.pre('save', function (next) {
  let user = this;
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) return next(err);
      bcrypt.hash(user.password, salt, null, function (err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

// user login 시 password 검증
UserSchema.methods.comparePassword = function (passw, cb) {
  bcrypt.compare(passw, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', UserSchema);
