"use strict";

const LRU = require.main.require("lru-cache");
const _ = require("lodash");
const benchpressjs = require.main.require("benchpressjs");

const meta = require.main.require("./src/meta");
const helpers = require.main.require("./src/routes/helpers");
const categories = require.main.require("./src/categories");
const topics = require.main.require("./src/topics");
const groups = require.main.require("./src/groups");
const privileges = require.main.require("./src/privileges");
const analytics = require.main.require("./src/analytics");
const socket = require.main.require("./src/socket.io/plugins");

const cache = new LRU({
    max: 500,
    maxAge: 24 * 60 * 60 * 1000,
});
socket.categoryTags = {};

const plugin = {};

async function renderAdminPage(req, res) {
    return res.render("admin/plugins/category-tags", {});
}

plugin.init = async function (params) {
    const router = params.router;
    const hostMiddleware = params.middleware;
    const controllers = params.controllers;

    const settings = await meta.settings.get("category-tags-settings");
    if (settings === undefined || _.isEmpty(settings)) {
        plugin.settings = {
            overrideFilter: true,
            overrideSort: true,
            activeUsersWeight: 15000,
            postCountWeight: 1,
            topicCountWeight: 100,
            recentPostsWeight: 10000,
            popularTopicsWeight: 2500,
            pageViewsMonthWeight: 100,
            pageViewsDayWeight: 150,
            monthlyPostsWeight: 2000,
            membership: false,
        };
    } else {
        plugin.settings = settings;
    }
    const tags = await meta.settings.get("category-tags");
    if (tags === undefined || _.isEmpty(tags)) {
        plugin.tags = {
            tags: ["tag"],
            categories: {},
        };
    } else {
        plugin.tags = tags;
    }
    const allCategories = await categories.getAllCategories(1);
    allCategories.forEach((category) => {
        if (plugin.tags.categories[category.cid] === undefined) {
            plugin.tags.categories[category.cid] = {
                tags: [],
                override: false,
            };
        }
    });
    meta.settings.set("category-tags", plugin.tags);

    router.get(
        "/admin/plugins/category-tags",
        hostMiddleware.admin.buildHeader,
        renderAdminPage
    );
    router.get("/api/admin/plugins/category-tags", renderAdminPage);
    helpers.setupPageRoute(
        router,
        "/categories/*",
        hostMiddleware,
        [],
        controllers.categories.list
    );
};

plugin.addAdminNavigation = function (header, callback) {
    header.plugins.push({
        route: "/plugins/category-tags",
        icon: "fa-tint",
        name: "category-tags",
    });

    callback(null, header);
};

plugin.addCategory = function (data) {
    plugin.tags.categories[data.category.cid] = {
        tags: [],
        override: false,
    };
};
plugin.deleteCategory = function (data) {
    return delete plugin.tags.categories[data.category.cid];
};

plugin.getWidgets = function (data, callback) {
    var widget = {
        name: "Sorting and filtering",
        widget: "category-tags-sort",
        description:
            "A menu that lets you choose what filters and sorting methods to use for coategory list",
        content: "",
    };
    data.push(widget);
    callback(null, data);
};
plugin.renderSortWidget = function (widget, callback) {
    var tpl = `
    <div class="btn-group pull-right <!-- IF !sort.length -->hidden<!-- ENDIF !sort.length -->" <!-- IF breadcrumbs.length -->style="margin-top:-50px"<!-- ELSE -->style="margin-top:-50px;top:35px;"<!-- ENDIF breadcrumbs.length --> >
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
        <!-- IF selectedSort.name -->{selectedSort.name}<!-- ELSE -->[[category-tags:sort]]<!-- ENDIF selectedSort.name -->
        <span class="caret"></span>
        </button>
        <ul class="dropdown-menu" role="menu">
            {{{each sort}}}
                <li role="presentation" class="category">
                    <a role="menu-item" href="{config.relative_path}/categories/{sort.url}">
                    <i class="fa fa-fw <!-- IF sort.selected -->fa-check<!-- ENDIF sort.selected -->"></i>{sort.name}
                    </a>
                </li>
            {{{end}}}
        </ul>
    </div>`;
    benchpressjs.compileParse(tpl, widget.templateData, function (err, output) {
        if (err) {
            return callback(err);
        }

        widget.html = output;
        callback(null, widget);
    });
};

plugin.render = async function (data) {
    data.templateData.sort = [
        { name: "[[category-tags:popular]]", url: "popular", selected: false },
        { name: "[[category-tags:new]]", url: "new", selected: false },
        { name: "[[category-tags:active]]", url: "active", selected: false },
        { name: "[[category-tags:my]]", url: "my", selected: false },
        {
            name: "[[category-tags:nonmember]]",
            url: "nonmember",
            selected: false,
        },
    ];
    plugin.tags.tags.forEach((tag) => {
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
        const userGroups = await groups.getUserGroups([data.req.uid]);
        data.templateData.categories = data.templateData.categories.filter(
            (category) =>
                userGroups[0].find((group) => group.name === category.name) !==
                    undefined ||
                (!!plugin.settings.overrideFilter &&
                    !!plugin.settings.categories[category.cid].override)
        );
    }
    if (
        plugin.settings.membership &&
        data.templateData.url.includes("/nonmember")
    ) {
        data.templateData.sort[4].selected = true;
        data.templateData.selectedSort = {
            name: "[[category-tags:nonmember]]",
        };
        data.templateData.breadcrumbs[1].url = "/categories";
        data.templateData.breadcrumbs.push({
            text: "[[category-tags:nonmember]]",
        });
        const userGroups = await groups.getUserGroups([data.req.uid]);
        data.templateData.categories = data.templateData.categories.filter(
            (category) =>
                userGroups[0].find((group) => group.name === category.name) ===
                    undefined ||
                (!!plugin.settings.overrideFilter &&
                    !!plugin.settings.categories[category.cid].override)
        );
    }
    if (data.templateData.url.includes("/popular")) {
        data.templateData.sort[0].selected = true;
        data.templateData.selectedSort = { name: "[[category-tags:popular]]" };
        data.templateData.breadcrumbs[1].url = "/categories";
        data.templateData.breadcrumbs.push({
            text: "[[category-tags:popular]]",
        });
        const scores = await getScores(data.templateData, data.req);
        data.templateData.categories.sort((a, b) => {
            if (plugin.settings.overrideSort) {
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
            plugin.settings.overrideSort &&
            plugin.settings.categories[a.cid].override
                ? -1
                : plugin.settings.overrideSort &&
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
            text: "[[category-tags:active]]",
        });
        data.templateData.categories.sort((a, b) => {
            if (plugin.settings.overrideSort) {
                if (plugin.settings.categories[a.cid].override) return -1;
                if (plugin.settings.categories[b.cid].override) return 1;
            }
            if (!a.posts[0] || !b.posts[0])
                return -1 * !b.posts[0] + 1 * !a.posts[0];
            return b.posts[0].timestamp - a.posts[0].timestamp;
        });
    }
    return null, data;
};

function filterCategories(element) {
    return (
        !!plugin.settings.categories[element.cid].tags.includes(this) ||
        (!!plugin.settings.overrideFilter &&
            !!plugin.settings.categories[element.cid].override)
    );
}

async function getScores(templateData, req) {
    var promises = {};
    templateData.categories.forEach((category) => {
        promises[category.cid] = getScoreForCategory(category);
    });
    return await objectPromise(promises);
}

async function getScoreForCategory(category) {
    let score = 0;
    const cachedScore = cache.get(category.cid);
    if (cachedScore != undefined) {
        return cachedScore;
    }
    const [
        activeUsers,
        categoryAnalytics,
        monthlyPosts,
        popularTopics,
    ] = await Promise.all([
        categories.getActiveUsers(category.cid),
        analytics.getCategoryAnalytics(category.cid),
        analytics.getDailyStatsForSet(
            "analytics:posts:byCid:" + category.cid,
            Date.now(),
            30
        ),
        topics.getSortedTopics({
            sort: "popular",
            cids: [category.cid],
            term: 604800,
        }),
    ]);
    score += activeUsers.length * plugin.settings.activeUsersWeight;

    score +=
        sumOfArray(categoryAnalytics["posts:daily"]) *
        plugin.settings.recentPostsWeight;
    score +=
        sumOfArray(categoryAnalytics["pageviews:daily"]) *
        plugin.settings.pageViewsMonthWeight;
    score +=
        sumOfArray(categoryAnalytics["pageviews:hourly"]) *
        plugin.settings.pageViewsDayWeight;

    score += sumOfArray(monthlyPosts) * plugin.settings.monthlyPostsWeight;
    score += popularTopics.tids.length * plugin.settings.popularTopicsWeight;

    score += category.topic_count * plugin.settings.topicCountWeight;
    score += category.post_count * plugin.settings.postCountWeight;

    cache.set(category.cid, score);
    return score;
}

function sumOfArray(Arr) {
    return Arr.reduce((a, b) => a + b, 0);
}
const objectPromise = (obj) =>
    Promise.all(
        Object.keys(obj).map((key) =>
            Promise.resolve(obj[key]).then((val) => ({ key: key, val: val }))
        )
    ).then((items) => {
        const result = {};
        items.forEach((item) => (result[item.key] = item.val));
        return result;
    });
socket.categoryTags.reloadSettings = async function (socket, data) {
    if (await privileges.isAdministrator(socket.uid)) {
        plugin.settings = await meta.settings.get("category-tags-settings");
    }
};
socket.categoryTags.saveTags = async function (socket, data) {
    if ((await privileges.isAdministrator(socket.uid)) && data != undefined) {
        plugin.tags = data;
        await meta.settings.set("category-tags", plugin.tags);
    }
};
socket.categoryTags.getTagsForCategory = async function (socket, data) {
    if (typeof data.cid === "number") {
        return plugin.tags.categories[data.cid].tags;
    }
};
socket.categoryTags.setTagsForCategory = async function (socket, data) {
    if (
        typeof data.cid === "number" &&
        every(
            await Promise.all([
                privileges.categories.isAdminOrMod(data.cid, socket.uid),
                privileges.categories.can("modmin", data.cid, socket.uid),
            ])
        )
    ) {
        const allowedTags = plugin.tags.tags;
        if (typeof data.tags === "string") {
            data.tags = [data.tags];
        }
        if (data.tags.length > 0) {
            data.tags = data.tags.filter((tag) => allowedTags.includes(tag));
            plugin.tags.categories[data.cid].tags = _.merge(
                plugin.tags.categories[data.cid].tags,
                data.tags
            );
        }
    }
};
module.exports = plugin;
