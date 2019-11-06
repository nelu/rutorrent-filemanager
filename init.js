plugin = plugin || {}; // shut up

plugin.ui = {
	fsBrowserContainer: "flm-browser"
};
plugin.ui.fsBrowserTableContainer = plugin.ui.fsBrowserContainer+"-table";




// will be updated on languageLoad
// with missing localisations and methods
var tableSchema = {
	obj: new dxSTable(),
	format: function(table, arr) {
		console.log('valled frm bootstrap format');
		return (arr);
	},
	ondblclick: function(table, arr) {
		console.log('valled frm bootstrap format');
		return (arr);
	},
	onselect: function(table, arr) {
		console.log('valled frm bootstrap format');
		return (arr);
	},
	ondelete: function(table, arr) {
		console.log('valled frm bootstrap format');
		return (arr);
	},
	columns: [
		{
		text: theUILang.Name,
		width: "210px",
		id: "name",
		type: TYPE_STRING
	}, {
		text: theUILang.Size,
		width: "60px",
		id: "size",
		type: TYPE_NUMBER
	}, {
		text: ' ',
		width: "120px",
		id: "time",
		type: TYPE_STRING,
		"align": ALIGN_CENTER
	}, {
		text: ' ',
		width: "80px",
		id: "type",
		type: TYPE_STRING
	}, {
		text: ' ',
		width: "80px",
		id: "perm",
		type: TYPE_NUMBER
	}],
	container: plugin.ui.fsBrowserTableContainer
};

// boostrap ui elements, at a early stage in rutorrent ui load
plugin.ui.setConfig = function ()
{
	plugin.attachPageToTabs(
		$('<div>')
			.attr("id", plugin.ui.fsBrowserContainer)
			.addClass('table_tab')
			.html('<div id="'+plugin.ui.fsBrowserTableContainer+'" class="stable"></div>')
			.get(0),
		"filemanager", );

	theWebUI.tables.flm = tableSchema;
};

// final stage:
//  update/initialize rest ui elements, when localisation is loaded
plugin.ui.init = function () {

	console.log('plugin.ui.init translations loaded');




	plugin.resizeBottom = theWebUI.resizeBottom;
	theWebUI.resizeBottom = function (w, h) {
		plugin.resizeBottom.call(this, w, h);

		window.flm.ui.resize(w, h);
	};





	if(plugin.canChangeTabs())
	{
        plugin.renameTab(plugin.ui.fsBrowserContainer,theUILang.fManager);
        window.flm.ui.init();
	}



	plugin.addAndShowSettings = theWebUI.addAndShowSettings;
	theWebUI.addAndShowSettings = function(arg) {
		if (plugin.enabled) {
			window.flm.ui.settings.onShow(arg);
		}
		plugin.addAndShowSettings.call(theWebUI, arg);
	};



};


// hooks
plugin.setSettings = theWebUI.setSettings;
theWebUI.setSettings = function() {

	if (plugin.enabled) {
		var needsave = false;

		$('#fMan_optPan').find('input,select').each(function(index, ele) {
			var inid = $(ele).attr('id').split('fMan_Opt');
			var inval;

			if ($(ele).attr('type') == 'checkbox') {
				inval = $(ele).is(':checked') ? true : false;
			} else {
				inval = $(ele).val();
			}

			if (inval != theWebUI.settings["webui.fManager." + inid[1]]) {
				theWebUI.settings["webui.fManager." + inid[1]] = theWebUI.fManager.settings[inid[1]] = inval;
				needsave = true;
			}
		});

		if (needsave) {
			theWebUI.save();
			theWebUI.fManager.TableRegenerate();
		}
	}

	plugin.setSettings.call(this);

};



plugin.flmOnShow = theTabs.onShow;
theTabs.onShow = function(id) {

	if (id === plugin.ui.fsBrowserContainer) {
		window.flm.ui.browser.onShow();

	} else {
		if(window.flm)
		{
			window.flm.ui.browser.onHide();
		}
		plugin.flmOnShow.call(this, id);
	}
};




plugin.onRemove = function() {
	theWebUI.fManager.cleanactions();
	this.removePageFromTabs(plugin.ui.fsBrowserContainer);
	$('#fMan_showconsole').remove();
	$('[id^="fMan_"]').remove();
};

plugin.onLangLoaded = function() {
	return plugin.enabled && plugin.ui.init();
};

// plugin init
// 1. early plugin setup of rutorrent components (UI mostly)
if(plugin.canChangeTabs())
{

	plugin.flmConfig = theWebUI.config;
	theWebUI.config = function (data) {
		plugin.ui.setConfig();
		// continue the init of the webUI
		plugin.flmConfig.call(this, data);

	};
}


// 2. delayed loading of the lib
// load view dependencies, first (hopefully)
injectScript('/plugins/filemanager/js/twig.min.js',
    // view engine
    function() {
				injectScript('/plugins/filemanager/js/app.js',
					function() {

					// localisation + app
						plugin.loadLang();
					});

});
plugin.loadMainCSS();

