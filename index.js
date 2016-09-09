var path = require("path");
var fs = require("fs");
var cwd = process.cwd();

function factory(exts) {
	function resolve(meta) {
		var cached = getCached(meta);

		if (cached) {
			return cached.then(setPath);
		}

		if (beginsWithDirectory(meta.name) && !hasExtension(meta.name)) {
			var parentPath = getParentPath(meta);

			var result = exts.reduce(function(filePath, ext) {
				if (filePath) {
					return filePath;
				}

				filePath = path.resolve(parentPath, meta.name + "." + ext);
				var stat = getSafeFileStat(filePath);
				return stat && stat.isFile() ? filePath : "";
			}, "");

			if (result) {
				var deferred = Promise.resolve(result);
				setCached(meta, deferred);
				return deferred.then(setPath);
			}
		}
	}

	return {
		resolve: resolve
	};
}

function setPath(filePath) {
	if (filePath) {
		return {
			directory: getDirectory(filePath),
			path: filePath
		};
	}
}

function beginsWithDirectory(input) {
	//https://regex101.com/r/kI4bQ9/2
	return /\W/.test(input);
}

function hasExtension(input) {
	//https://regex101.com/r/kC7wE8/1
	return /(?:[\/]+[\.\w]+\.(\w+))$/.test(input);
}

function getParentPath(input) {
  var referrer = input.referrer;
  return (referrer && input !== referrer && referrer.path) ? getDirectory(referrer.path) : cwd;
}

function getSafeFileStat(filePath) {
	try {
		return fs.statSync(filePath);
	}
	catch(ex) {
		if (ex.code !== "ENOENT") {
			throw ex;
		}
	}
}

var processed = {};

function getDirectory(filePath) {
  return filePath && filePath.replace(/([^/]+)$/gm, "");
}

function getCached(input) {
  var directory = getDirectory(input.referrer && input.referrer.path);

  if (processed[directory]) {
    return processed[directory][input.name];
  }
}

function setCached(input, value) {
  var directory = getDirectory(input.referrer && input.referrer.path);

  if (directory) {
    if (!processed[directory]) {
      processed[directory] = {};
    }

    processed[directory][input.name] = value;
  }
}

module.exports = factory;
