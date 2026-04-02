import app from './../../app.js';
import config from './../../config.js';
import Base_layers_class from './../../core/base-layers.js';
import Helper_class from './../../libs/helpers.js';
import Dialog_class from './../../libs/popup.js';
import alertify from './../../../../node_modules/alertifyjs/build/alertify.min.js';
import canvasToBlob from './../../../../node_modules/blueimp-canvas-to-blob/js/canvas-to-blob.min.js';
import filesaver from './../../../../node_modules/file-saver/dist/FileSaver.min.js';
import GIF from './../../../../node_modules/gif.js.optimized/';
import CanvasToTIFF from './../../libs/canvastotiff.js';
import Tools_settings_class from "../tools/settings";

var instance = null;

/** 
 * manages files / save
 * 
 * @author ViliusL
 */
class File_save_class {
	
	constructor() {
		//singleton
		if (instance) {
			return instance;
		}
		instance = this;

		this.Base_layers = new Base_layers_class();
		this.Helper = new Helper_class();
		this.POP = new Dialog_class();
		this.Tools_settings = new Tools_settings_class();

		this.set_events();

		//save types config
		this.SAVE_TYPES = {
			PNG: "Portable Network Graphics",
			JPG: "JPG/JPEG Format",
			//AVIF: "AV1 Image File Format", //just uncomment it in future to make it work
			JSON: "Full layers data",
			WEBP: "Weppy File Format",
			GIF: "Graphics Interchange Format",
			BMP: "Windows Bitmap",
			TIFF: "Tag Image File Format",
		};

		this.default_extension = 'PNG';
		this.last_save_dialog_type = null;
	}

	set_events() {
		document.addEventListener('keydown', (event) => {
			var code = event.key.toLowerCase();
			if (this.Helper.is_input(event.target))
				return;

			if (code == "s") {
				if(event.shiftKey){
					//export
					this.save();
				}
				else{
					//save
					this.export();
				}
				event.preventDefault();
			}
		}, false);
	}

	/**
	 * saves as non destructive mode (including layers, RAW)
	 */
	save(){
		var types = JSON.parse(JSON.stringify(this.SAVE_TYPES));
		for(var i in types){
			if(i != 'JSON'){
				delete types[i];
			}
		}

		this.save_general(types, 'Save as');

	}

	/**
	 * save as encoded image
	 */
	export(){
		var types = JSON.parse(JSON.stringify(this.SAVE_TYPES));
		delete types.JSON;

		this.save_general(types, 'Export');
	}

	save_general(file_types, title) {
		var _this = this;

		//find default format
		var save_default = null;
		var save_default_cookie = this.Helper.getCookie('save_default');

		for(var i in file_types) {
			if(save_default_cookie == i){
				save_default = i;
				break;
			}
		}
		if(save_default == null){
			save_default = Object.keys(file_types)[0];
		}
		save_default = save_default + " - " + file_types[save_default];

		var calc_size_value = false;
		var calc_size = false;
		if (config.WIDTH * config.HEIGHT < 1000000) {
			calc_size_value = true;
			calc_size = true;
		}

		var file_name = config.layers[0].name;
		var parts = file_name.split('.');
		if (parts.length > 1)
			file_name = parts[parts.length - 2];
		file_name = file_name.replace(/ /g, "-");
		file_name = this.Helper.escapeHtml(file_name);

		var save_types = [];
		for(var i in file_types) {
			save_types.push(i + " - " + file_types[i]);
		}

		var save_layers_types = [
			'All',
			'Selected',
			'Separated',
			'Separated (original types)',
		];
		var resolution = this.Tools_settings.get_setting('resolution');

		var settings = {
			title: title,
			params: [
				{name: "name", title: "File name:", value: file_name},
				{name: "type", title: "Save as type:", values: save_types, value: save_default},
				{name: "quality", title: "Quality:", value: 90, range: [1, 100]},
				{name: "max_dimension", title: "Max dimension (px):", value: 2560},
				{name: "lossless", title: "Lossless mode:", value: false},
				{title: "File size:", html: '<span id="file_size">-</span>'},
				{title: "Resolution:",  value: resolution},
				{name: "calc_size", title: "Show file size:", value: calc_size_value},
				{name: "layers", title: "Save layers:", values: save_layers_types},
				{name: "delay", title: "Gif delay:", value: 400},
			],
			on_change: function (params, canvas_preview, w, h) {
				_this.save_dialog_onchange(true);
			},
			on_finish: function (params) {
				if (params.layers == 'Separated' || params.layers == 'Separated (original types)') {
					var active_layer = config.layer.id;
					var original_layer_type = params.layers;

					//alter params
					params.layers = 'Selected';

					for (var i in config.layers) {
						if (config.layers[i].visible == false)
							continue;

						//detect type
						if (original_layer_type == 'Separated (original types)') {
							//detect type from file name
							params.type = _this.SAVE_TYPES[_this.default_extension];
							for (var j in _this.SAVE_TYPES) {
								if (_this.Helper.strpos(config.layers[i].name.toLowerCase(), '.' + j.toLowerCase()) !== false) {
									params.type = j;
									break;
								}
							}
						}
						
						new app.Actions.Select_layer_action(config.layers[i].id, true).do();
						_this.save_action(params, true);
					}
					new app.Actions.Select_layer_action(active_layer, true).do();
				}
				else {
					_this.save_action(params);
				}
			},
		};
		this.POP.show(settings);
		this.last_save_dialog_type = null;
		this.save_dialog_onchange(false);

		document.getElementById("pop_data_name").select();

		if (calc_size == true) {
			//calc size once
			this.save_dialog_onchange(true);
		}
		else{
			this.save_dialog_onchange(false);
		}
	}

	save_data_url() {
		var max = 10 * 1000 * 1000;
		if (config.WIDTH * config.WIDTH > 10 * 1000 * 1000) {
			alertify.error('Size is too big, max ' + this.Helper.number_format(max, 0) + ' pixels.');
			return;
		}

		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext("2d");
		canvas.width = config.WIDTH;
		canvas.height = config.HEIGHT;

		this.disable_canvas_smooth(ctx);

		//ask data
		this.Base_layers.convert_layers_to_canvas(ctx, null, false);
		var data_url = canvas.toDataURL();

		max = 1000 * 1000;
		if (data_url.length > max) {
			alertify.error('Size is too big, max ' + this.Helper.number_format(max, 0) + ' bytes.');
			return;
		}

		var settings = {
			title: 'Data URL',
			params: [
				{name: "url", title: "URL:", type: "textarea", value: data_url},
			],
		};
		this.POP.show(settings);
	}

	update_file_size(file_size) {
		if (typeof file_size == 'string') {
			document.getElementById('file_size').innerHTML = file_size;
			return;
		}

		if (file_size > 1024 * 1024)
			file_size = this.Helper.number_format(file_size / 1024 / 1024, 2) + ' MB';
		else if (file_size > 1024)
			file_size = this.Helper.number_format(file_size / 1024, 2) + ' KB';
		else
			file_size = (file_size) + ' B';
		document.getElementById('file_size').innerHTML = file_size;
	}

	/**
	 * /activated on save dialog parameters change - used for calculating file size
	 *
	 * @param {boolean} calculate_file_size
	 */
	save_dialog_onchange(calculate_file_size) {
		var _this = this;
		var user_response = this.POP.get_params();

		//detect type
		var type = this.get_type_from_response(user_response);
		if (this.last_save_dialog_type !== type) {
			this.apply_export_preset(type);
			this.last_save_dialog_type = type;
			user_response = this.POP.get_params();
		}
		var quality = this.get_quality_from_response(user_response, type);
		var lossless = this.get_lossless_from_response(user_response);

		if (type == 'JPG' || type == 'WEBP' || type == 'AVIF')
			document.getElementById('popup-tr-quality').style.display = '';
		else
			document.getElementById('popup-tr-quality').style.display = 'none';

		if (type == 'PNG' || type == 'WEBP')
			document.getElementById('popup-tr-lossless').style.display = '';
		else
			document.getElementById('popup-tr-lossless').style.display = 'none';

		if (type != 'JSON' && type != 'GIF')
			document.getElementById('popup-tr-max_dimension').style.display = '';
		else
			document.getElementById('popup-tr-max_dimension').style.display = 'none';

		if (type == 'GIF')
			document.getElementById('popup-tr-delay').style.display = '';
		else
			document.getElementById('popup-tr-delay').style.display = 'none';

		if (type == 'JSON' || type == 'GIF')
			document.getElementById('popup-tr-layers').style.display = 'none';
		else
			document.getElementById('popup-tr-layers').style.display = '';

		if (user_response.layers == 'Separated')
			document.getElementById('pop_data_name').disabled = true;
		else
			document.getElementById('pop_data_name').disabled = false;

		if (user_response.layers == 'Separated (original types)') {
			if(document.getElementById('popup-group-type')) {
				document.getElementById('popup-group-type').style.opacity = "0.5";
			}
			document.getElementById('popup-tr-quality').style.display = '';
		}
		else {
			if(document.getElementById('popup-group-type')) {
				document.getElementById('popup-group-type').style.opacity = "1";
			}
		}

		if(calculate_file_size == false){
			return;
		}

		this.update_file_size('...');

		if (user_response.calc_size == false || user_response.layers == 'Separated'
			|| user_response.layers == 'Separated (original types)') {

			document.getElementById('file_size').innerHTML = '-';
			return;
		}

		if (lossless == true && (type == 'PNG' || type == 'WEBP')) {
			document.getElementById('file_size').innerHTML = '-';
			return;
		}

		if (type != 'JSON') {
			var export_data = this.get_export_canvas(user_response, type);
			var canvas = export_data.canvas;
			var ctx = export_data.ctx;
		}

		if (type != 'JSON' && (type == 'JPG' || config.TRANSPARENCY == false)) {
			//add white background
			ctx.globalCompositeOperation = 'destination-over';
			this.fillCanvasBackground(ctx, '#ffffff');
			ctx.globalCompositeOperation = 'source-over';
		}

		//calc size
		if (type == 'PNG') {
			//png
			canvas.toBlob(function (blob) {
				_this.update_file_size(blob.size);
			});
		}
		else if (type == 'JPG') {
			//jpg
			canvas.toBlob(function (blob) {
				_this.update_file_size(blob.size);
			}, "image/jpeg", quality);
		}
		else if (type == 'WEBP') {
			//WEBP
			var data_header = "image/webp";

			//check support
			if (this.check_format_support(canvas, data_header, false) == false) {
				this.update_file_size('-');
				return;
			}

			canvas.toBlob(function (blob) {
				_this.update_file_size(blob.size);
			}, data_header, quality);
		}
		else if (type == 'AVIF') {
			//AVIF
			var data_header = "image/avif";

			//check support
			if (this.check_format_support(canvas, data_header, false) == false) {
				this.update_file_size('-');
				return;
			}

			canvas.toBlob(function (blob) {
				_this.update_file_size(blob.size);
			}, data_header, quality);
		}
		else if (type == 'BMP') {
			//bmp
			var data_header = "image/bmp";

			//check support
			if (this.check_format_support(canvas, data_header, false) == false) {
				this.update_file_size('-');
				return;
			}

			canvas.toBlob(function (blob) {
				_this.update_file_size(blob.size);
			}, data_header);
		}
		else if (type == 'TIFF') {
			//tiff
			var data_header = "image/tiff";

			CanvasToTIFF.toBlob(canvas, function(blob) {
				_this.update_file_size(blob.size);
			}, data_header);
		}
		else if (type == 'JSON') {
			//json
			var data_json = this.export_as_json();

			var blob = new Blob([data_json], {type: "text/plain"});
			this.update_file_size(blob.size);
		}
		else if (type == 'GIF') {
			//gif
			this.update_file_size('-');
		}
	}
	
	/**
	 * saves data in requested way
	 * 
	 * @param {object} user_response parameters
	 * @param {boolean} autoname if use name from layer, false by default
	 */
	save_action(user_response, autoname) {
		var fname = user_response.name;
		if(autoname === true && user_response.layers == 'Selected'){
			fname = config.layer.name;
		}

		var delay = parseInt(user_response.delay);
		if (delay < 0 || isNaN(delay) == true)
			delay = 400;

		//detect type
		var type = this.get_type_from_response(user_response);
		var quality = this.get_quality_from_response(user_response, type);
		var lossless = this.get_lossless_from_response(user_response);

		//detect type from file name
		for(var i in this.SAVE_TYPES) {
			if (this.Helper.strpos(fname, '.' + i.toLowerCase()) !== false) {
				type = i;
			}
		}

		//save default type as cookie
		if(this.Helper.getCookie('save_default') == '' || this.Helper.getCookie('save_default') != type){
			this.Helper.setCookie('save_default', type);
		}

		if (type != 'JSON') {
			var export_data = this.get_export_canvas(user_response, type);
			var canvas = export_data.canvas;
			var ctx = export_data.ctx;
		}

		if (type != 'JSON' && (type == 'JPG' || config.TRANSPARENCY == false)) {
			//add white background
			ctx.globalCompositeOperation = 'destination-over';
			this.fillCanvasBackground(ctx, '#ffffff');
			ctx.globalCompositeOperation = 'source-over';
		}

		if (type == 'PNG') {
			//png - default format
			if (this.Helper.strpos(fname, '.png') == false)
				fname = fname + ".png";

			if (lossless == true) {
				this.save_via_server_optimizer(canvas, 'PNG', fname);
				return;
			}

			//simple save example
			//var link = document.createElement('a');
			//link.download = fname;
			//link.href = canvas.toDataURL();
			//link.click();

			//save using lib
			canvas.toBlob(function (blob) {
				filesaver.saveAs(blob, fname);
			});
		}
		else if (type == 'JPG') {
			//jpg
			if (this.Helper.strpos(fname, '.jpg') == false)
				fname = fname + ".jpg";

			canvas.toBlob(function (blob) {
				filesaver.saveAs(blob, fname);
			}, "image/jpeg", quality);
		}
		else if (type == 'WEBP') {
			//WEBP
			if (this.Helper.strpos(fname, '.webp') == false)
				fname = fname + ".webp";
			var data_header = "image/webp";

			//check support
			if (this.check_format_support(canvas, data_header) == false)
				return false;

			if (lossless == true) {
				this.save_via_server_optimizer(canvas, 'WEBP', fname);
				return;
			}

			canvas.toBlob(function (blob) {
				filesaver.saveAs(blob, fname);
			}, data_header, quality);
		}
		else if (type == 'AVIF') {
			//AVIF
			if (this.Helper.strpos(fname, '.avif') == false)
				fname = fname + ".avif";
			var data_header = "image/avif";

			//check support
			if (this.check_format_support(canvas, data_header) == false)
				return false;

			canvas.toBlob(function (blob) {
				filesaver.saveAs(blob, fname);
			}, data_header, quality);
		}
		else if (type == 'BMP') {
			//bmp
			if (this.Helper.strpos(fname, '.bmp') == false)
				fname = fname + ".bmp";
			var data_header = "image/bmp";

			//check support
			if (this.check_format_support(canvas, data_header) == false)
				return false;

			canvas.toBlob(function (blob) {
				filesaver.saveAs(blob, fname);
			}, data_header);
		}
		else if (type == 'TIFF') {
			//tiff
			if (this.Helper.strpos(fname, '.tiff') == false)
				fname = fname + ".tiff";
			var data_header = "image/tiff";

			CanvasToTIFF.toBlob(canvas, function(blob) {
				filesaver.saveAs(blob, fname);
			}, data_header);
		}
		else if (type == 'JSON') {
			//json - full data with layers
			if (this.Helper.strpos(fname, '.json') == false)
				fname = fname + ".json";

			var data_json = this.export_as_json();

			var blob = new Blob([data_json], {type: "text/plain"});
			//var data = window.URL.createObjectURL(blob); //html5
			filesaver.saveAs(blob, fname);
		}
		else if (type == 'GIF') {
			//gif
			var cores = navigator.hardwareConcurrency || 4;
			var gif_settings = {
				workers: cores,
				quality: 10, //1-30, lower is better
				repeat: 0,
				width: config.WIDTH,
				height: config.HEIGHT,
				dither: 'FloydSteinberg-serpentine',
				workerScript: './src/js/libs/gifjs/gif.worker.js',
			};
			if (config.TRANSPARENCY == true) {
				gif_settings.transparent = 'rgba(0,0,0,0)';
			}
			var gif = new GIF(gif_settings);

			//add frames
			for (var i = 0; i < config.layers.length; i++) {
				if (config.layers[i].visible == false)
					continue;

				ctx.clearRect(0, 0, config.WIDTH, config.HEIGHT);
				if (config.TRANSPARENCY == false) {
					this.fillCanvasBackground(ctx, '#ffffff');
				}
				this.Base_layers.convert_layers_to_canvas(ctx, config.layers[i].id, false);

				gif.addFrame(ctx, {copy: true, delay: delay});
			}
			gif.render();
			gif.on('finished', function (blob) {
				filesaver.saveAs(blob, fname);
			});
		}
	}
	
	fillCanvasBackground(ctx, color, width = config.WIDTH, height = config.HEIGHT) {
		ctx.beginPath();
		ctx.rect(0, 0, width, height);
		ctx.fillStyle = color;
		ctx.fill();
	}

	get_type_from_response(user_response) {
		var type = user_response.type || '';
		var parts = type.split(" ");
		return parts[0];
	}

	get_quality_from_response(user_response, type) {
		var quality = parseInt(user_response.quality);
		if (quality > 100 || quality < 1 || isNaN(quality) == true)
			quality = 90;
		if (user_response.lossless == true && (type == 'PNG' || type == 'WEBP')) {
			return 1;
		}
		return quality / 100;
	}

	get_lossless_from_response(user_response) {
		return user_response.lossless === true
			|| user_response.lossless === 'true'
			|| user_response.lossless === 1
			|| user_response.lossless === '1';
	}

	get_max_dimension_from_response(user_response) {
		var max_dimension = parseInt(user_response.max_dimension);
		if (isNaN(max_dimension) || max_dimension < 1) {
			return 0;
		}
		return max_dimension;
	}

	apply_export_preset(type) {
		var quality_field = document.getElementById('pop_data_quality');
		var max_dimension_field = document.getElementById('pop_data_max_dimension');
		if (!quality_field || !max_dimension_field) {
			return;
		}

		if (type == 'JPG') {
			quality_field.value = 80;
			max_dimension_field.value = 2560;
		}
		else if (type == 'WEBP') {
			quality_field.value = 75;
			max_dimension_field.value = 2560;
		}
		else if (type == 'PNG') {
			max_dimension_field.value = 2560;
		}
	}

	get_export_canvas(user_response, type) {
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext("2d");
		canvas.width = config.WIDTH;
		canvas.height = config.HEIGHT;
		this.disable_canvas_smooth(ctx);

		if (user_response.layers == 'Selected' && type != 'GIF' && config.layer.type != null) {
			var layer = config.layer;
			var initial_x = null;
			var initial_y = null;

			if (layer.x != null && layer.y != null && layer.width != null && layer.height != null) {
				initial_x = layer.x;
				initial_y = layer.y;
				layer.x = 0;
				layer.y = 0;
				canvas.width = layer.width;
				canvas.height = layer.height;
			}

			this.Base_layers.convert_layers_to_canvas(ctx, layer.id, false);

			if (initial_x != null) {
				layer.x = initial_x;
				layer.y = initial_y;
			}
		}
		else {
			this.Base_layers.convert_layers_to_canvas(ctx, null, false);
		}

		var max_dimension = this.get_max_dimension_from_response(user_response);
		if (type != 'GIF' && type != 'JSON' && max_dimension > 0) {
			var largest_dimension = Math.max(canvas.width, canvas.height);
			if (largest_dimension > max_dimension) {
				var ratio = max_dimension / largest_dimension;
				var target_width = Math.max(1, Math.round(canvas.width * ratio));
				var target_height = Math.max(1, Math.round(canvas.height * ratio));
				var resized_canvas = document.createElement('canvas');
				var resized_ctx = resized_canvas.getContext("2d");
				resized_canvas.width = target_width;
				resized_canvas.height = target_height;
				resized_ctx.drawImage(canvas, 0, 0, target_width, target_height);
				canvas = resized_canvas;
				ctx = resized_ctx;
			}
		}

		return {
			canvas: canvas,
			ctx: ctx,
		};
	}

	save_via_server_optimizer(canvas, type, fname) {
		var _this = this;
		var input_mime = "image/png";
		var output_type = (type || 'PNG').toLowerCase();
		var optimizer_url = './api/optimize.php';

		canvas.toBlob(async function (blob) {
			if (!blob) {
				alertify.error('Failed to prepare image for optimization.');
				return;
			}

			var form = new FormData();
			form.append('type', output_type);
			form.append('file', blob, 'image.' + (output_type == 'webp' ? 'png' : output_type));

			try {
				var response = await fetch(optimizer_url, {
					method: 'POST',
					body: form,
				});
				if (!response.ok) {
					throw new Error('Optimizer responded with ' + response.status);
				}
				var optimized_blob = await response.blob();
				if (!optimized_blob || optimized_blob.size === 0) {
					throw new Error('Optimizer returned empty file');
				}
				filesaver.saveAs(optimized_blob, fname);
			}
			catch (e) {
				// Fallback to local export if backend optimizer is unavailable.
				alertify.warning('Lossless optimizer unavailable, saved local file.');
				if (output_type == 'webp') {
					canvas.toBlob(function (local_blob) {
						filesaver.saveAs(local_blob, fname);
					}, "image/webp", 1);
				}
				else {
					filesaver.saveAs(blob, fname);
				}
			}
		}, input_mime);
	}
	
	check_format_support(canvas, data_header, show_error) {
		var data = canvas.toDataURL(data_header);
		var actualType = data.replace(/^data:([^;]*).*/, '$1');

		if (data_header != actualType && data_header != "text/plain") {
			if (show_error == undefined || show_error == true) {
				//error - no support
				alertify.error('Your browser does not support this format.');
			}
			return false;
		}
		return true;
	}
	
	/**
	 * exports all layers to JSON
	 */
	export_as_json() {
		//get date
		var today = new Date();
		var yyyy = today.getFullYear();
		var mm = today.getMonth() + 1; //January is 0!
		var dd = today.getDate();
		if (dd < 10)
			dd = '0' + dd;
		if (mm < 10)
			mm = '0' + mm;
		var today = yyyy + '-' + mm + '-' + dd;

		//data
		var export_data = {};
		export_data.info = {
			width: config.WIDTH,
			height: config.HEIGHT,
			about: 'Image data with multi-layers. Can be opened using miniPaint - '
				+ 'https://github.com/viliusle/miniPaint',
			date: today,
			version: VERSION,
			layer_active: config.layer.id,
			guides: config.guides,
		};

		//fonts
		export_data.user_fonts = config.user_fonts;

		//layers
		export_data.layers = [];
		for (var i in config.layers) {
			var layer = {};
			for (var j in config.layers[i]) {
				if (j[0] == '_' || j == 'link_canvas') {
					//private data
					continue;
				}

				layer[j] = config.layers[i][j];
			}
			export_data.layers.push(layer);
		}

		//image data
		export_data.data = [];
		for (var i in config.layers) {
			if (config.layers[i].type != 'image')
				continue;

			var canvas = document.createElement('canvas');
			canvas.width = config.layers[i].width_original;
			canvas.height = config.layers[i].height_original;
			this.disable_canvas_smooth(canvas.getContext("2d"));

			canvas.getContext('2d').drawImage(config.layers[i].link, 0, 0);

			var data_tmp = canvas.toDataURL("image/png");
			export_data.data.push(
				{
					id: config.layers[i].id,
					data: data_tmp,
				}
			);
			canvas.width = 1;
			canvas.height = 1;
		}

		return JSON.stringify(export_data, null, "\t");
	}
	
	/**
	 * removes smoothing, because it look ugly during zoom
	 * 
	 * @param {ctx} ctx
	 */
	disable_canvas_smooth(ctx) {
		ctx.webkitImageSmoothingEnabled = false;
		ctx.oImageSmoothingEnabled = false;
		ctx.msImageSmoothingEnabled = false;
		ctx.imageSmoothingEnabled = false;
	}

}

export default File_save_class;
