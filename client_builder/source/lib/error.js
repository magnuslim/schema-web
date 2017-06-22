module.exports = class extends Error {
    constructor(underlyingMessage, displayMessage = '服务器正忙，请稍后再试') {
        super(underlyingMessage);
        this.displayMessage = displayMessage;
        Object.seal(this);
    }
}