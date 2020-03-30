"use strict";

const util = require("util");
const benchpressjs = require.main.require("benchpressjs");

const controllers = require("./lib/controllers");
const meta = require.main.require("./src/meta");
const helpers = require.main.require("./src/routes/helpers");
const categories = require.main.require("./src/categories");
const topics = require.main.require("./src/topics");
const groups = require.main.require("./src/groups");
const analytics = require.main.require("./src/analytics");
var app;

const plugin = {};

groups.getUserGroups = util.promisify(groups.getUserGroups);
categories.getActiveUsers = util.promisify(categories.getActiveUsers);
categories.getRecentReplies = util.promisify(categories.getRecentReplies);

plugin.init = function(params, callback) {
    app = params.app;
    const router = params.router;
    const hostMiddleware = params.middleware;
    const hostControllers = params.controllers;

    // const hostControllers = params.controllers;
    meta.settings.get("category-tags", function(err, settings) {
        if (err) {
            winston.error(
                "[plugin/category-tags] Could not retrieve plugin settings!"
            );
            plugin.settings = {
                tags: ["tag"],
                categories: {
                    1: { tags: [], override: true },
                    2: { tags: [], override: true },
                    4: { tags: [], override: true }
                },
                override: {
                    filter: true,
                    sort: true
                },
                popular: {
                    activeUsers: 5000,
                    postCount: 1,
                    topicCount: 100,
                    recentPosts: 15000,
                    recentPostsTime: 604800000,
                    popularTopics: 1000,
                    pageViewsWeek: 10000,
                    pageViewsDay: 5000
                },
                membership: true
            };
            return;
        }
        plugin.settings = {
            tags: ["tag"],
            categories: {
                1: { tags: [], override: true },
                2: { tags: [], override: true },
                4: { tags: [], override: true }
            },
            override: {
                filter: true,
                sort: true
            },
            popular: {
                activeUsers: 5000,
                postCount: 1,
                topicCount: 100,
                recentPosts: 15000,
                recentPostsTime: 604800000,
                recentPostsTime: 604800000,
                popularTopics: 1000,
                pageViewsWeek: 10000,
                pageViewsDay: 5000
            },
            membership: true
        };
        categories.getAllCategories(1, function(err, allCategories) {
            allCategories.forEach(category => {
                if (plugin.settings.categories[category.cid] == undefined) {
                    plugin.settings.categories[category.cid] = {
                        tags: [],
                        override: false
                    };
                }
            });
        });
        //plugin.settings = settings;
    });

    router.get(
        "/admin/plugins/category-tags",
        hostMiddleware.admin.buildHeader,
        controllers.renderAdminPage
    );
    router.get("/api/admin/plugins/category-tags", controllers.renderAdminPage);
    helpers.setupPageRoute(
        router,
        "/categories/*",
        hostMiddleware,
        [],
        hostControllers.categories.list
    );
    callback();
};

plugin.addAdminNavigation = function(header, callback) {
    header.plugins.push({
        route: "/plugins/category-tags",
        icon: "fa-tint",
        name: "category-tags"
    });

    callback(null, header);
};

plugin.addCategory = function(data) {
    plugin.settings.categories[data.category.cid] = {
        tags: [],
        override: false
    };
};
plugin.deleteCategory = function(data) {
    delete plugin.settings.categories[data.category.cid];
};

plugin.getWidgets = function(data, callback) {
    var widget = {
        name: "Sorting and filtering",
        widget: "category-tags",
        description:
            "A menu that lets you choose what filters and sorting methods to use for coategory list",
        content: ""
    };
    data.push(widget);
    callback(null, data);
};
plugin.renderWidget = function(widget, callback) {
    var tpl =
        '<div class="btn-group pull-right <!-- IF !sort.length -->hidden<!-- ENDIF !sort.length -->"<!-- IF breadcrumbs.length -->style="margin-top:-50px"<!-- ELSE -->style="margin-top:-50px;top:35px;"<!-- ENDIF breadcrumbs.length -->><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">{selectedSort.name} <span class="caret"></span></button><ul class="dropdown-menu" role="menu">{{{each sort}}}<li role="presentation" class="category"><a role="menu-item" href="{config.relative_path}/categories/{sort.url}"><i class="fa fa-fw <!-- IF sort.selected -->fa-check<!-- ENDIF sort.selected -->"></i>{sort.name}</a></li>{{{end}}}</ul></div>';
    benchpressjs.compileParse(tpl, widget.templateData, function(err, output) {
        if (err) {
            return callback(err);
        }

        widget.html = output;
        callback(null, widget);
    });
};

plugin.render = async function(data) {
    data.templateData.sort = [
        { name: "[[category-tags:popular]]", url: "popular", selected: false },
        { name: "[[category-tags:new]]", url: "new", selected: false },
        { name: "[[category-tags:active]]", url: "active", selected: false },
        { name: "[[category-tags:my]]", url: "my", selected: false },
        {
            name: "[[category-tags:nonmember]]",
            url: "nonmember",
            selected: false
        }
    ];
    plugin.settings.tags.forEach(tag => {
        if (data.templateData.url.includes(tag)) {
            data.templateData.categories = data.templateData.categories.filter(
                filterCategories,
                tag
            );
        }
    });
    if (plugin.settings.membership && data.templateData.url.includes("/my")) {
        data.templateData.sort[3].selected = true;
        data.templateData.selectedSort = { name: "[[category-tags:my]]" };
        data.templateData.breadcrumbs[1].url = "/categories";
        data.templateData.breadcrumbs.push({ text: "[[category-tags:my]]" });
        var userGroups = await groups.getUserGroups([data.req.uid]);
        data.templateData.categories = data.templateData.categories.filter(
            category =>
                userGroups[0].find(group => group.name == category.name) !=
                    undefined ||
                (!!plugin.settings.override.filter &&
                    !!plugin.settings.categories[category.cid].override)
        );
    }
    if (
        plugin.settings.membership &&
        data.templateData.url.includes("/nonmember")
    ) {
        data.templateData.sort[4].selected = true;
        data.templateData.selectedSort = {
            name: "[[category-tags:nonmember]]"
        };
        data.templateData.breadcrumbs[1].url = "/categories";
        data.templateData.breadcrumbs.push({
            text: "[[category-tags:nonmember]]"
        });
        var userGroups = await groups.getUserGroups([data.req.uid]);
        data.templateData.categories = data.templateData.categories.filter(
            category =>
                userGroups[0].find(group => group.name == category.name) ==
                    undefined ||
                (!!plugin.settings.override.filter &&
                    !!plugin.settings.categories[category.cid].override)
        );
    }
    if (data.templateData.url.includes("/popular")) {
        data.templateData.sort[0].selected = true;
        data.templateData.selectedSort = { name: "[[category-tags:popular]]" };
        let scores = {};
        data.templateData.breadcrumbs[1].url = "/categories";
        data.templateData.breadcrumbs.push({
            text: "[[category-tags:popular]]"
        });
        scores = await getScores(data.templateData, data.req);
        data.templateData.categories.sort((a, b) => {
            if (plugin.settings.override.sort) {
                if (plugin.settings.categories[a.cid].override) return -1;
                if (plugin.settings.categories[b.cid].override) return 1;
            }
            return scores[b.cid] - scores[a.cid];
        });
    }
    if (data.templateData.url.includes("/new")) {
        data.templateData.sort[1].selected = true;
        data.templateData.selectedSort = { name: "[[category-tags:new]]" };
        data.templateData.breadcrumbs[1].url = "/categories";
        data.templateData.breadcrumbs.push({ text: "[[category-tags:new]]" });
        data.templateData.categories.sort((a, b) =>
            plugin.settings.override.sort &&
            plugin.settings.categories[a.cid].override
                ? -1
                : plugin.settings.override.sort &&
                  plugin.settings.categories[b.cid].override
                ? 1
                : a.cid < b.cid
                ? 1
                : b.cid < a.cid
                ? -1
                : 0
        );
    }
    if (data.templateData.url.includes("/active")) {
        data.templateData.sort[2].selected = true;
        data.templateData.selectedSort = { name: "[[category-tags:active]]" };
        data.templateData.breadcrumbs[1].url = "/categories";
        data.templateData.breadcrumbs.push({
            text: "[[category-tags:active]]"
        });
        data.templateData.categories.sort((a, b) => {
            if (plugin.settings.override.sort) {
                if (plugin.settings.categories[a.cid].override) return -1;
                if (plugin.settings.categories[b.cid].override) return 1;
            }
            if (!a.posts[0] || !b.posts[0])
                return -1 * !b.posts[0] + 1 * !a.posts[0];
            return b.posts[0].timestamp - a.posts[0].timestamp;
        });
    }
    //callback(null, data);
    return null, data;
};

function filterCategories(element) {
    return (
        !!plugin.settings.categories[element.cid].tags.includes(this) ||
        (!!plugin.settings.override.filter &&
            !!plugin.settings.categories[element.cid].override)
    );
}

async function getScores(templateData, req) {
    var promises = {};
    const time = Date.now();
    templateData.categories.forEach(category => {
        promises[category.cid] = getScoreForCategory(
            category.cid,
            req.uid,
            time
        );
    });
    return await objectPromise(promises);
}

async function getScoreForCategory(category, uid, time) {
    let score = 0;
    const [
        activeUsers,
        recentReplies,
        categoryAnalytics,
        popularTopics
    ] = await Promise.all([
        categories.getActiveUsers(category.cid),
        categories.getRecentReplies(category.cid, uid, 250),
        analytics.getCategoryAnalytics(category.cid),
        topics.getSortedTopics({
            sort: "popular",
            cids: [category.cid],
            term: 604800
        })
    ]);
    score += activeUsers.length * plugin.settings.popular.activeUsers;
    const replies = recentReplies.filter(
        x =>
            time - x.timestamp <= plugin.settings.popular.recentPostsTime &&
            time - x.timestamp > 0 &&
            !x.deleted
    );
    score += replies.length * plugin.settings.popular.recentPosts;

    score +=
        sumOfArray(categoryAnalytics["pageviews:daily"]) *
        plugin.settings.popular.pageViewsWeek;
    score +=
        sumOfArray(categoryAnalytics["pageviews:hourly"]) *
        plugin.settings.popular.pageViewsDay;

    score += popularTopics.length * plugin.settings.popular.popularTopics;

    score += category.topic_count * plugin.settings.popular.topicCount;
    score += category.post_count * plugin.settings.popular.postCount;
    return score;
}

function sumOfArray(Arr) {
    return Arr.reduce((a, b) => a + b, 0);
}
const objectPromise = obj =>
    Promise.all(
        Object.keys(obj).map(key =>
            Promise.resolve(obj[key]).then(val => ({ key: key, val: val }))
        )
    ).then(items => {
        let result = {};
        items.forEach(item => (result[item.key] = item.val));
        return result;
    });
module.exports = plugin;
