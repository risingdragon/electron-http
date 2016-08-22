module.exports = class FormUtil {
	static setDroppable(selector, method) {
		var reader = new FileReader()
		$(reader).on('load', () => {
			method(reader.result)
		})

		var dropArea = $(selector)
		dropArea.on('dragover dragenter', (e) => {
			if (e.preventDefault) { e.preventDefault(); }
			return false
		})

		dropArea.on('drop', (e) => {
			e.preventDefault()
			var file = e.originalEvent.dataTransfer.files[0]
			reader.readAsText(file, 'utf-8')
		})
	}

	static makeKeyValueSet(keySelector, valueSelector) {
		var keys = []
		$(keySelector).each((index, value) => {
			keys.push($(value).val())
		})

		var values = []
		$(valueSelector).each((index, value) => {
			values.push($(value).val())
		})

		var sets = {}
		for (let i=0;i<keys.length;i++) {
			if (keys[i].length == 0) { continue; }
			if (typeof(sets[keys[i]]) != 'undefined') {
				sets[keys[i]] = [ sets[keys[i]] ]
			}
			if ($.isArray(sets[keys[i]])) {
				sets[keys[i]].push(values[i])
			} else {
				sets[keys[i]] = values[i]
			}
		}

		return sets
	}

	static makeAuthorizationHeader(user, password) {
		var buf = new Buffer(user + ':' + password)
		return 'Basic ' + buf.toString('base64')
	}
}
