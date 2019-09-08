'use strict';

/* globals $, app, socket, define */

define('admin/plugins/category-tags', ['settings'], function (Settings) {
	var ACP = {};

	ACP.init = function () {
		Settings.load('category-tags', $('.category-tags-settings'));

		$('#save').on('click', function () {
			Settings.save('category-tags', $('.category-tags-settings'), function () {
				app.alert({
					type: 'success',
					alert_id: 'category-tags-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function () {
						socket.emit('admin.reload');
					},
				});
			});
		});
	};

	return ACP;
});
