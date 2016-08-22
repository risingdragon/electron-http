const fs = require('fs')
const http = require('http')
const https = require('https')
const url = require('url')
const ipcRenderer = require('electron').ipcRenderer
const FormUtil = require('./lib/form-util')

window.onload = () => {
	var addHeaderBox = () => {
		var clone = $('div.hide > div.headerbox:first').clone()
		clone.find('input,textarea').val('')
		$('#headers').append(clone)
		return clone
	}

	var addParamBox = () => {
		var clone = $('div.hide > div.parambox:first').clone()
		clone.find('input,textarea').val('')
		$('#params').append(clone)
		return clone
	}

	$('button[name=header-add-btn]').on('click', addHeaderBox)
	$('button[name=param-add-btn]').on('click', addParamBox)

	$('#params,#headers').on('click', 'button[name=delete-btn]', (e) => {
		$(e.target).parents('div:first').remove()
	})

	$('#request-form').on('submit', (e) => {
		ipcRenderer.send('save-settings', getFormData())
		e.preventDefault()

		var _url = $('input[name=url]').val()
		if (_url.length == 0) {
			alert('empty url')
			return
		}

		$('#response-panel').show()
		$('#response-block').empty()

		var headers = FormUtil.makeKeyValueSet('#request-form input[name^=header_names]', '#request-form input[name^=header_values]')
		var params = FormUtil.makeKeyValueSet('#request-form input[name^=names]', '#request-form textarea[name^=values]')

		if ($('input[name=bauser]').val().length > 0) {
			headers['Authorization'] = FormUtil.makeAuthorizationHeader(
				$('input[name=bauser]').val(),
				$('input[name=bapw]').val()
			)
		}

		var options = url.parse(_url)
		options.method = $('input[name=method]').val()
		options.headers = headers

		var responseText = ''
		var callback = (response) => {
			var matched = /charset=(.+)$/g.exec(response.headers['content-type'])
			if (matched == null) {
				response.setEncoding('utf8')
			} else {
				try {
					response.setEncoding(matched[1])
				} catch (e) {
					console.log(e)
				}
			}

			for (let key in response.headers) {
				responseText += key + ':' + response.headers[key] + "\n"
			}

			responseText += "\n"

			response.on('data', (chunk) => {
				responseText += chunk
			})
			response.on('end', () => {
				$('#response-block').text(responseText)
				$('html,body').animate({scrollTop: $('#response-panel').offset().top})
			})
		}

		var req = null
		if (options.protocol == 'https:') {
			req = https.request(options, callback)
		} else {
			req = http.request(options, callback)
		}

		req.end()
	})

	var getFormData = () => {
		var headers = FormUtil.makeKeyValueSet('#request-form input[name^=header_names]', '#request-form input[name^=header_values]')
		var params = FormUtil.makeKeyValueSet('#request-form input[name^=names]', '#request-form textarea[name^=values]')

		var formdata = {
			url: $('input[name=url]').val(),
			ua: $('input[name=ua]').val(),
			method: $('input[name=method]:checked').val(),
			bauser: $('input[name=bauser]').val(),
			bapw: $('input[name=bapw]').val(),
			headers: headers,
			params: params
		}

		return formdata
	}

	$('[name=open-json-btn]').on('click', () => {
		$('textarea[name=jsontext]').val(JSON.stringify(getFormData()))
		$('#jsondialog').modal()
	})

	var setJsonValues = (jsonText) => {
		var formdata = JSON.parse(jsonText)
		$('input[name=type][value=' + formdata.type + ']').prop('checked', true)
		$('input[name=url]').val(formdata.url)
		$('input[name=ua]').val(formdata.ua)
		$('input[name=method][value=' + formdata.method + ']').prop('checked', true)
		$('input[name=bauser]').val(formdata.bauser)
		$('input[name=bapw]').val(formdata.bapw)

		$('#headers').empty()
		for (let key in formdata.headers) {
			let value = formdata.headers[key]
			let box = addHeaderBox()
			box.find('input[name^=header_names]').val(key)
			box.find('input[name^=header_values]').val(value)
		}

		$('#params').empty()
		for (var key in formdata.params) {
			var value = formdata.params[key]
			if ($.isArray(value)) {
				for (let _value of value) {
					let box = addParamBox()
					box.find('input[name^=names]').val(key)
					box.find('textarea[name^=values]').val(_value)
				}
			} else {
				let box = addParamBox()
				box.find('input[name^=names]').val(key)
				box.find('textarea[name^=values]').val(value)
			}
		}
	}

	$('button[name=appy-json-btn]').on('click', () => {
		setJsonValues($('textarea[name=jsontext]').val())
		$('#jsondialog').modal('hide')
	})

	$('button[name=save-btn]').on('click', () => {
		ipcRenderer.send('save', JSON.stringify(getFormData()))
	})

	try {
		setJsonValues(
			fs.readFileSync(__dirname + '/settings.json', { encoding: 'utf8' })
		)
	} catch (err) {
		console.log(err)
	}

	FormUtil.setDroppable('body', setJsonValues)
}
