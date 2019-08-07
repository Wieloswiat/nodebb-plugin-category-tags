'use strict';

const controllers = require('./lib/controllers');

const plugin = {};

plugin.init = function (params, callback) {
	const router = params.router;
	const hostMiddleware = params.middleware;
	// const hostControllers = params.controllers;

	// We create two routes for every view. One API call, and the actual route itself.
	// Just add the buildHeader middleware to your route and NodeBB will take care of everything for you.

	router.get('/admin/plugins/custom-categories-page', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
	router.get('/api/admin/plugins/custom-categories-page', controllers.renderAdminPage);

	callback();
};

plugin.addAdminNavigation = function (header, callback) {
	header.plugins.push({
		route: '/plugins/custom-categories-page',
		icon: 'fa-tint',
		name: 'custom-categories-page',
	});

	callback(null, header);
};

module.exports = plugin;
