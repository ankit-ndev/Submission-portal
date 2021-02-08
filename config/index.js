const nconf = require('nconf');
const path  = require('path');

class ConfigCtrl {
    loadConfig() {
        const environment = process.env.NODE_ENV || nconf.get("environment") || "dev";
        nconf.use('file', { file: path.join(__dirname, `./env/${environment}.json`)});
        nconf.use('common', {type: 'file', file: path.join(__dirname, './common.json')});
    }
}

module.exports = new ConfigCtrl();
