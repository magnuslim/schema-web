module.exports = {
	extract: (req) => {
		let stateStr = req.get('Qweb-State');
		let state = {};

		if(stateStr !== undefined && state !== '') {
			let statePairs = stateStr.split('&');
			for(let statePair of statePairs) {
				let [key, value] = statePair.split('=');
				state[key] = value;
			}
		}

		return state;
	}
};