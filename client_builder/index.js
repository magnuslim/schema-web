const ncp = require('ncp').ncp;
const fs = require('fs');
const fsx = require('fs-extra');
const ejs = require('ejs');
const changeCase = require('change-case');
const path = require('path');
const pureSchemaFolderName = 'schema';


let exitWithError = (err) => {
	process.stderr.write(err.stack + "\n");
	process.exit(-1);
}

class Builder {
	static run(handlerRoot, targetFolder) {
		try{
			// Clean existing target folder and initialize it.
			this._initTargetFolder(targetFolder);
			
			// Scan handler folder to get all APIs.
			let apiList = fs.readdirSync(handlerRoot);
			let apiInfoList = [];
			
			// Get API info and render schema json file into targetFolder/${pureSchemaFolderName}.
			for(let apiName of apiList) {
				let apiInfo = this._buildApiInfo(apiName);
				apiInfoList.push(apiInfo);
				let pureSchema = this._buildPureSchemaJson(apiName, handlerRoot);
				this._save(pureSchema, `${targetFolder}/${pureSchemaFolderName}/${apiName}.json`);
			}

			// Render API functions in index.js
			let apiContent = this._compileApi(apiInfoList);
			this._save(apiContent, `${targetFolder}/index.js`);
		}
		catch(err) {
			this._deleteFolderRecursive(targetFolder);
			exitWithError(err);
			return false;
		}
        return true;
	}

    static _initTargetFolder(targetFolder) {
		let errDealer = err => err ? exitWithError(err) : null;
		this._deleteFolderRecursive(targetFolder);
		fs.mkdirSync(targetFolder, errDealer);
		fs.mkdirSync(`${targetFolder}/${pureSchemaFolderName}`, errDealer);
        ncp(`${__dirname}/source/lib`, targetFolder + '/lib', errDealer);
		fsx.copy(`${__dirname}/source/package.json`, targetFolder + '/package.json', errDealer);
		fsx.copy(`${__dirname}/source/publish.sh`, targetFolder + '/publish.sh', errDealer);
		fsx.copy(`${__dirname}/source/example.js`, targetFolder + '/example.js', errDealer);
    }

	static _buildApiInfo(apiName) {
        // path.to.your_api.action => pathToYourApiAction
		let apiFuncName = apiName.replace(/\.(.{1})/g, ($1, $2) => $2.toUpperCase());
        apiFuncName = apiFuncName.replace(/_(.{1})/g, ($1, $2) => $2.toUpperCase());
		return {
			name: apiName,
			funcName: apiFuncName
		};
	}

	static _buildPureSchemaJson(apiName, handlerRoot) {
        let schemaFilePath = `${handlerRoot}/${apiName}/schema.js`;
        let schema = require(schemaFilePath);
		if(schema.request  === undefined) throw new Error('miss request schema for file: ' + schemaFilePath);
		if(schema.response === undefined) throw new Error('miss response schema for file: ' + schemaFilePath);
        if(schema.info === undefined) throw new Error('miss info for file: ' + schemaFilePath);
        if(typeof schema.info.auth !== 'boolean') throw new Error('expecting info.auth to be boolean. file: ' + schemaFilePath);
		return JSON.stringify(schema, null, 2);
	}
    

	static _save(source, targetFile) {
		const folder = path.dirname(targetFile);
		fsx.ensureDirSync(folder);
		fs.writeFileSync(targetFile, source);
	}

	static _deleteFolderRecursive(path) {
		if(fs.existsSync(path)) {
			fs.readdirSync(path).forEach(function(file, index){
				var curPath = path + "/" + file;
				if(fs.lstatSync(curPath).isDirectory()) { // recurse
					Builder._deleteFolderRecursive(curPath);
				} else { // delete file
					fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(path);
		}
	};

	static _compileApi(apiInfoList) {
		let template = fs.readFileSync(`${__dirname}/source/template/index.js.tpl`, 'utf-8');
		return ejs.render(template, {apiInfoList});
	}

}

module.exports = Builder;