const QwebClientError = require('./error.js');

module.exports = class {
    constructor(protocol, host, port, timeout) {
        this._protocol = protocol;
        this._host = host;
        this._port = port;
        this._timeout = timeout;
    }

    run(name, request) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', `${this._protocol}://${this._host}:${this._port}/${name}`, true);
			xhr.timeout = this._timeout;
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

            let states = sessionStorage.getItem('Qweb-State');
            if (typeof states === 'string') {
                xhr.setRequestHeader('Qweb-State', states);
            }

            xhr.onreadystatechange = () => {
                if (xhr.readyState != 4) {
                    return;
                }

                switch(xhr.status) {
                    case 200:
                        {
                            let response = null;
                            try {
                                response = JSON.parse(xhr.responseText);
                                if (typeof response !== 'object') {
                                    throw new QwebClientError('bad response protocol');
                                }
                                response = response['response'];
                            }
                            catch(err) {
                                let rejectError = (err instanceof QwebClientError) ? err : new QwebClientError(err.message);
                                reject(rejectError);
                                return;
                            }
                            resolve(response);
                        }
                        break;
                    case 500:
                        reject(new QwebClientError('server returned error as 500', (xhr.responseText.length > 0) ? xhr.responseText : '服务器正忙，请稍后再试'));
                        break;
                    default:
                        reject(new QwebClientError(`unexpected status(${xhr.status}) returned by the server`));
                        break;
                }
            };
            xhr.send(JSON.stringify({request:request}));
        });
    }
}