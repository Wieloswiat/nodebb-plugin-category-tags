'use strict';

/* globals $, app, socket, define */

define('admin/plugins/custom-categories-page', ['settings'], function (Settings) {
	var ACP = {};

	ACP.init = function () {
		Settings.load('custom-categories-page', $('.custom-categories-page-settings'));

		$('#save').on('click', function () {
			Settings.save('custom-categories-page', $('.custom-categories-page-settings'), function () {
				app.alert({
					type: 'success',
					alert_id: 'custom-categories-page-saved',
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
