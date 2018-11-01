const defaults = {
  "ip": process.env.NODE_ENV === 'development' ? 'localhost' : '35.200.103.250'
};

const distribute = Object.assign(
  {},
  defaults,
  { "port": 9000 });
const service = Object.assign(
  {},
  defaults,
  { "port": 9990 });
const redis = Object.assign(
  {},
  defaults,
  { "ip": "35.200.103.250", "port": 6379 });
const database = Object.assign(
  {},
  defaults,
  {
    "ip": "35.200.103.250",
    "port": null,
    "username": "root",
    "password": "",
    "schima": "monolithic"
  });

const setting = {
  "service": service,
  "distribute": distribute,
  "redis": redis,
  "database": database
};

exports.setting = setting;
