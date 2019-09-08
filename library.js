'use strict';

const util = require('util');
const controllers = require('./lib/controllers');
const meta = require.main.require('./src/meta');
const helpers = require.main.require('./src/routes/helpers');
const categories = require.main.require('./src/categories')
const groups = require.main.require('./src/groups')


const plugin = {};

groups.getUserGroups = util.promisify(groups.getUserGroups);
categories.getActiveUsers = util.promisify(categories.getActiveUsers);
categories.getRecentReplies = util.promisify(categories.getRecentReplies);

plugin.init = function (params, callback) {
	const router = params.router;
	const hostMiddleware = params.middleware;
	const hostControllers = params.controllers;
	
	// const hostControllers = params.controllers;
	meta.settings.get('category-tags', function(err, settings) {
		if (err) {
			winston.error('[plugin/category-tags] Could not retrieve plugin settings!');
			plugin.settings = {"tags":[""], "categories":{}, "override":{"filter":true, "sort":true}, "popular":{"activeUsers":10.0, "postCount":0.1, "topicCount":0.1, "recentPosts":1.0, "recentPostsTime":604800}};
			return;
		}
		plugin.settings = {"tags":["tag"], "categories":{1:{"tags":[], "override":true}, 2:{"tags":[], "override":true}, 4:{"tags":[], "override":true}}, "override":{"filter":true, "sort":true}, "popular":{"activeUsers":10.0, "postCount":1.0, "topicCount":1.0, "recentPosts":1.0, "recentPostsTime":604800}, "membership":true};
		categories.getAllCategories(1, function (err, allCategories) {
			allCategories.forEach(category => {
				if (plugin.settings.categories[category.cid] == undefined) {
					plugin.settings.categories[category.cid] = {"tags":[], "override":false};
				}
			});
		});
		//plugin.settings = settings;
	});

	router.get('/admin/plugins/category-tags', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
	router.get('/api/admin/plugins/category-tags', controllers.renderAdminPage);
	helpers.setupPageRoute(router, '/categories/*', hostMiddleware, [], hostControllers.categories.list);
	callback();
};



plugin.addAdminNavigation = function (header, callback) {
	header.plugins.push({
		route: '/plugins/category-tags',
		icon: 'fa-tint',
		name: 'category-tags',
	});

	callback(null, header);
};

plugin.addCategory = function(data) {
	plugin.settings.categories[data.category.cid] = {"tags":[], "override":false};
}
plugin.deleteCategory = function(data) {
	delete plugin.settings.categories[data.category.cid];
}

plugin.render = async function (data, callback) {
	if (data.templateData.template.name == 'categories') {
		data.templateData.sort = [
			{"name":"[[category-tags:popular]]", "url":"popular", "selected":false}, 
			{"name":"[[category-tags:new]]", "url":"new", "selected":false}, 
			{"name":"[[category-tags:active]]", "url":"active","selected":false},
			{"name":"[[category-tags:my]]", "url":"my","selected":false},
			{"name":"[[category-tags:nonmember]]", "url":"nonmember","selected":false},
		];
		plugin.settings.tags.forEach(tag => {
			if (data.templateData.url.includes(tag)) {
				data.templateData.categories = data.templateData.categories.filter(filterCategories, tag);	
			}
		});
		if (plugin.settings.membership && data.templateData.url.includes("/my")) {
			data.templateData.sort[3].selected = true;
			data.templateData.selectedSort = {"name":"[[category-tags:my]]"};
			data.templateData.breadcrumbs[1].url = "/categories";
			data.templateData.breadcrumbs.push({"text":"[[category-tags:my]]"});
			var userGroups = await groups.getUserGroups([data.req.uid]);
			data.templateData.categories = data.templateData.categories.filter(category => (userGroups[0].find(group => group.name == category.name) != undefined) || (!!plugin.settings.override.filter && !!plugin.settings.categories[category.cid].override));
		}
		if (plugin.settings.membership && data.templateData.url.includes("/nonmember")) {
			data.templateData.sort[4].selected = true;
			data.templateData.selectedSort = {"name":"[[category-tags:nonmember]]"};
			data.templateData.breadcrumbs[1].url = "/categories";
			data.templateData.breadcrumbs.push({"text":"[[category-tags:nonmember]]"});
			var userGroups = await groups.getUserGroups([data.req.uid]);
			data.templateData.categories = data.templateData.categories.filter(category => (userGroups[0].find(group => group.name == category.name) == undefined) || (!!plugin.settings.override.filter && !!plugin.settings.categories[category.cid].override));
		}
		if (data.templateData.url.includes("/popular")) {
			data.templateData.sort[0].selected = true;
			data.templateData.selectedSort = {"name":"[[category-tags:popular]]"};
			let scores = {};
			data.templateData.breadcrumbs[1].url = "/categories";
			data.templateData.breadcrumbs.push({"text":"[[category-tags:popular]]"});
			scores = await getScores(data.templateData, data.req)
			data.templateData.categories.sort((a, b) => scores[b.cid]-scores[a.cid]);
		}
		if (data.templateData.url.includes("/new")) {
			data.templateData.sort[1].selected = true;
			data.templateData.selectedSort = {"name":"[[category-tags:new]]"};
			data.templateData.breadcrumbs[1].url = "/categories";
			data.templateData.breadcrumbs.push({"text":"[[category-tags:new]]"});
			data.templateData.categories.sort((a, b) => (a.cid<b.cid) ? 1 : ((b.cid<a.cid) ? -1 : 0));
		}
		if (data.templateData.url.includes("/active")) {
			data.templateData.sort[2].selected = true;
			data.templateData.selectedSort = {"name":"[[category-tags:active]]"};
			data.templateData.breadcrumbs[1].url = "/categories";
			data.templateData.breadcrumbs.push({"text":"[[category-tags:active]]"});
			data.templateData.categories.sort((a, b) => {
				if (a.posts[0]==undefined && b.posts[0]==undefined) return 0;
				if (a.posts[0]==undefined) return 1;
				if (b.posts[0]==undefined) return -1;
				return b.posts[0].timestamp-a.posts[0].timestamp;
			});
		}

		if (plugin.settings.override.sort) {
			data.templateData.categories.forEach((category, index) => {
				if (!!plugin.settings.categories[category.cid].override) {
					data.templateData.categories.splice(category.order-1,0,data.templateData.categories.splice(index,1)[0]);
				}
			})
		}
	}
	callback(null, data);
	//return(null, data);
}

function filterCategories (element) {
	return !!plugin.settings.categories[element.cid].tags.includes(this) || (!!plugin.settings.override.filter && !!plugin.settings.categories[element.cid].override);
}

async function getScores(templateData, req) {
	let scores = [];
	await asyncForEach(templateData.categories, async (category) => {
		var score = 0.0;
		var time = req.session.datetime;
		var users = await categories.getActiveUsers(category.cid);
		score += users.length * plugin.settings.popular.activeUsers;
		var replies = await categories.getRecentReplies(category.cid, req.uid, 50);
		replies = replies.filter(x => time-x.timestamp >= plugin.settings.popular.recentPostsTime && !!x.deleted);
		score += replies.length * plugin.settings.popular.recentPosts;
	
		score += category.topic_count * plugin.settings.popular.topicCount;
		score += category.post_count * plugin.settings.popular.postCount;
		scores[category.cid] = score;
	});
	return scores
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  await callback(array[index], index, array);
	}
  }

module.exports = plugin;
