'use strict';

var Controllers = {};
const nconf = require('nconf');

const categories = require.main.require('./src/categories');
const meta = require.main.require('./src/meta');
const helpers = require.main.require('./src/controllers/helpers');

Controllers.renderAdminPage = function (req, res/* , next */) {
	/*
		Make sure the route matches your path to template exactly.

		If your route was:
			myforum.com/some/complex/route/
		your template should be:
			templates/some/complex/route.tpl
		and you would render it like so:
			res.render('some/complex/route');
	*/

	res.render('admin/plugins/category-tags', {});
};
Controllers.categories = async function (req, res) {
	res.locals.metaTags = [{
		name: 'title',
		content: String(meta.config.title || 'NodeBB'),
	}, {
		property: 'og:type',
		content: 'website',
	}];

	const categoryData = await categories.getCategoriesByPrivilege('categories:cid', req.uid, 'find');
	const tree = categories.getTree(categoryData, 0);
	await categories.getRecentTopicReplies(categoryData, req.uid);

	const data = {
		title: meta.config.homePageTitle || '[[pages:home]]',
		categories: tree,
	};

	if (req.originalUrl.startsWith(nconf.get('relative_path') + '/api/categories') || req.originalUrl.startsWith(nconf.get('relative_path') + '/categories')) {
		data.title = '[[pages:categories]]';
		data.breadcrumbs = helpers.buildBreadcrumbs([{ text: data.title }]);
		res.locals.metaTags.push({
			property: 'og:title',
			content: '[[pages:categories]]',
		});
	}

	data.categories.forEach(function (category) {
		if (category && Array.isArray(category.posts) && category.posts.length && category.posts[0]) {
			category.teaser = {
				url: nconf.get('relative_path') + '/post/' + category.posts[0].pid,
				timestampISO: category.posts[0].timestampISO,
				pid: category.posts[0].pid,
				topic: category.posts[0].topic,
			};
		}
	});

	res.render('category-tags', data);
}
module.exports = Controllers;
