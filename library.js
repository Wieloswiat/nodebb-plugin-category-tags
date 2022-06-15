"use strict";

const LRU = require.main.require("lru-cache");
const _ = require.main.require("lodash");
const benchpressjs = require.main.require("benchpressjs");

const meta = require.main.require("./src/meta");
const helpers = require.main.require("./src/routes/helpers");
const categories = require.main.require("./src/categories");
const topics = require.main.require("./src/topics");
const groups = require.main.require("./src/groups");
const privileges = require.main.require("./src/privileges");
const analytics = require.main.require("./src/analytics");
const socket = require.main.require("./src/socket.io/plugins");
const slugify = require.main.require("./src/slugify");
const cache = new LRU({
    max: 1024,
    maxAge: 24 * 60 * 60 * 1000,
});
socket.categoryTags = {};

const plugin = {};

async function renderAdminPage(req, res) {
    let pluginCategories = {};
    for (const [cid, value] of Object.entries(plugin.settings.categories)) {
        pluginCategories[cid] = {
            ...value,
            name: await categories.getCategoryField(cid, "name")
        }
    }
    
    return res.render("admin/plugins/category-tags", {categoryTags: plugin.settings.tags, categories: pluginCategories});
}

plugin.init = async function (params) {
    const router = params.router;
    const hostMiddleware = params.middleware;
    const controllers = params.controllers;
    let settings = await meta.settings.get("category-tags-settings-2.0", plugin.settings);
    if (settings === undefined || _.isEmpty(settings)) {
        plugin.settings = {
            overrideFilter: "on",
            overrideSort: "on",
            activeUsersWeight: 15000,
            postCountWeight: 1,
            topicCountWeight: 100,
            recentPostsWeight: 10000,
            popularTopicsWeight: 2500,
            pageViewsMonthWeight: 100,
            pageViewsDayWeight: 150,
            monthlyPostsWeight: 2000,
            membership: "off",
            tags: [{name: "tag", color: "#000000"}],
            categories: {},
        };
        await meta.settings.set("category-tags-settings-2.0", plugin.settings);
    } else {
        await reloadSettings({bypassAllChecks: true});
    }
    plugin.settings = _.mapValues(plugin.settings, (value) =>
        value === "on" ? true : value === "off" ? false : value
    );
    const allCategories = await categories.getAllCategories(1);
    allCategories.forEach((category) => {
        if (plugin.settings.categories[category.cid] === undefined) {
            plugin.settings.categories[category.cid] = {
                tags: [],
                override: false,
            };
        }
    });

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

plugin.addAdminNavigation = async function (header) {
    header.plugins.push({
        route: "/plugins/category-tags",
        icon: "fa-tint",
        name: "category-tags",
    });

    return header;
};

plugin.addCategory = async function (data) {
    const allCategories = await categories.getAllCategories(1);
    allCategories.forEach((category) => {
        if (plugin.settings.categories[category.cid] === undefined) {
            plugin.settings.categories[category.cid] = {
                tags: [],
                override: false,
            };
        }
    });
};
plugin.deleteCategory = function (data) {
    return delete plugin.settings.categories[data.category.cid];
};

plugin.getWidgets = async function (data) {
    const sort_widget = {
        name: "Category sort",
        widget: "category-tags-sort",
        description:
            "A menu that lets you choose what sorting methods to use for category list",
        content: "",
    };
    const filter_widget = {
        name: "Category filter",
        widget: "category-tags-tags",
        description:
            "A menu that lets you choose what tag filters to use for category list",
        content: "",
    };
    const tag_and_sort_widget = {
        name: "Category tag and sort",
        widget: "category-tags-tags-and-sort",
        description:
            "A combination of sorting and filtering widgets",
        content: "",
    }
    data.push(sort_widget);
    data.push(filter_widget);
    data.push(tag_and_sort_widget);
    return data;
};
plugin.renderSortWidget = async function (widget) {
    var tpl = `
    <div class="pull-right <!-- IF !sort.length -->hidden<!-- ENDIF !sort.length --> <!-- IF breadcrumbs.length -->sort-button-breadcrumbs<!-- ELSE -->sort-button<!-- ENDIF breadcrumbs.length -->" >
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
    widget.html = await benchpressjs.compileRender(tpl, widget.templateData);
    return widget;
};
plugin.renderTagsWidget = async function (widget) {
    var tpl = `
    <div class="pull-right <!-- IF !tags.length -->hidden<!-- ENDIF !tags.length --> <!-- IF breadcrumbs.length -->tags-button-breadcrumbs<!-- ELSE -->tags-button<!-- ENDIF breadcrumbs.length -->" >
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">
        <!-- IF selectedTags.length -->{selectedTags}<!-- ELSE -->[[category-tags:tags]]<!-- ENDIF selectedTags.length -->
        <span class="caret"></span>
        </button>
        <ul class="dropdown-menu" role="menu">
            {{{each tags}}}
                <li role="presentation" class="category">
                    <a role="menu-item" href="{../url}">
                    <i class="fa fa-fw <!-- IF ../selected -->fa-check<!-- ENDIF ../selected -->"></i>{../name}
                    </a>
                </li>
            {{{end}}}
        </ul>
    </div>`;
    widget.html = await benchpressjs.compileRender(tpl, widget.templateData);
    return widget;
};

plugin.renderTagsAndSortWidget = async function (widget) {
    var tpl = `
    <div class="pull-right btn-group tag-sort-group" >
        <div class="dropdown btn-group">
            <button type="button" class="btn btn-default dropdown-toggle <!-- IF !tags.length -->hidden<!-- ENDIF !tags.length --> <!-- IF breadcrumbs.length -->tags-button-breadcrumbs<!-- ELSE -->tags-button<!-- ENDIF breadcrumbs.length -->" data-toggle="dropdown">
            <!-- IF selectedTags.length -->{selectedTags}<!-- ELSE -->[[category-tags:tags]]<!-- ENDIF selectedTags.length -->
            <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" role="menu">
                {{{each tags}}}
                    <li role="presentation" class="category">
                        <a role="menu-item" href="{../url}">
                        <i class="fa fa-fw <!-- IF ../selected -->fa-check<!-- ENDIF ../selected -->"></i>{../name}
                        </a>
                    </li>
                {{{end}}}
            </ul>
        </div>
        <div class="dropdown btn-group">
            <button type="button" class="btn btn-default dropdown-toggle <!-- IF !sort.length -->hidden<!-- ENDIF !sort.length --> <!-- IF breadcrumbs.length -->sort-button-breadcrumbs<!-- ELSE -->sort-button<!-- ENDIF breadcrumbs.length -->" data-toggle="dropdown">
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
        </div>
    </div>`;
    widget.html = await benchpressjs.compileRender(tpl, widget.templateData);
    return widget;
}


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
    data.templateData.tags = plugin.settings.tags.map((tag) => ({
        name: tag.name,
        selected: false,
        url: data.templateData.url[data.templateData.url.length]==="/" ? 
        data.templateData.url + slugify(tag.name) + "/" : 
        data.templateData.url + "/" + slugify(tag.name) + "/"
    }));
    data.templateData.selectedTags = [];
    plugin.settings.tags.forEach((tag, i) => {
        if (data.templateData.url.match("/" + slugify(tag.name) + "($|/)")) {
            data.templateData.tags[i].selected = true;
            data.templateData.tags[i].url = data.templateData.url.replace("/" + slugify(tag.name), "");
            data.templateData.selectedTags.push(tag.name);
            data.templateData.categories = data.templateData.categories.filter(
                filterCategories,
                tag
            );
        }
    });
    data.templateData.selectedTags =
        data.templateData.selectedTags.length > 0
            ? data.templateData.selectedTags
            : false;
    data.templateData.multipleTags =
        data.templateData.selectedTags.length > 1 ? true : false;
    if (plugin.settings.membership && data.templateData.url.includes("/my")) {
        data.templateData.sort[3].selected = true;
        data.templateData.selectedSort = { name: "[[category-tags:my]]", url: "my" };
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
            url: "nonmember"
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
        data.templateData.selectedSort = { name: "[[category-tags:popular]]", url: "popular" };
        data.templateData.breadcrumbs[1].url = "/categories";
        data.templateData.breadcrumbs.push({
            text: "[[category-tags:popular]]",
        });
        const scores = await getScores(data.templateData, data.req);
        data.templateData.categories.sort((a, b) => {
            if (plugin.settings.overrideSort) {
                try {
                    if (plugin.settings.categories[a.cid].override) return -1;
                    if (plugin.settings.categories[b.cid].override) return 1;
                } catch (e) {}
            }
            return scores[b.cid] - scores[a.cid];
        });
    }
    if (data.templateData.url.includes("/new")) {
        data.templateData.sort[1].selected = true;
        data.templateData.selectedSort = { name: "[[category-tags:new]]", url: "new" };
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
        data.templateData.selectedSort = { name: "[[category-tags:active]]", url: "active" };
        data.templateData.breadcrumbs[1].url = "/categories";
        data.templateData.breadcrumbs.push({
            text: "[[category-tags:active]]",
        });
        data.templateData.categories.sort((a, b) => {
            if (plugin.settings.overrideSort) {
                try {
                    if (plugin.settings.categories[a.cid].override) return -1;
                    if (plugin.settings.categories[b.cid].override) return 1;
                } catch (e) {}
            }
            if (!a.posts[0] || !b.posts[0])
                return -1 * !b.posts[0] + 1 * !a.posts[0];
            return b.posts[0].timestamp - a.posts[0].timestamp;
        });
    }
    return data;
};

function filterCategories(element) {
    return (
        !!plugin.settings.categories[element.cid].tags.includes(this.name) ||
        (!!plugin.settings.overrideFilter &&
            !!plugin.settings.categories[element.cid].override)
    );
}

async function getScores(templateData, req) {
    var promises = {};
    templateData.categories.forEach((category) => {
        promises[category.cid] = getScoreForCategory(category);
    });
    return objectPromise(promises);
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
socket.categoryTags.reloadSettings = reloadSettings;
async function reloadSettings(socket, data) {
    let privilege;
    if (!socket.bypassAllChecks) privilege = await Promise.all([privileges.users.isAdministrator(socket.uid), privileges.admin.can("admin:settings", socket.uid)]);
    if (socket.bypassAllChecks || privilege.some(element => element)) {
        const settings = await meta.settings.get("category-tags-settings-2.0");
        
        plugin.settings = {};
        plugin.settings = _.mapValues(settings, (value) =>
            value === "on" ? true : value === "off" ? false : value
        );
        for (const [key, value] of Object.entries(plugin.settings)) {
            const found = key.match(/categories\s*:\s*(?<cid>\d+)\s*:\s*(?<type>override|tags).*/iu);
            if (!found){
                continue;
            }
            if (plugin.settings.categories[found.groups.cid]===undefined)
                plugin.settings.categories[found.groups.cid] = {};
            plugin.settings.categories[found.groups.cid][found.groups.type] = value;
            delete plugin.settings[key];
        }
    }
};
socket.categoryTags.getTagsForCategory = async function (socket, data) {
    if (typeof data.cid === "number") {
        return plugin.settings.categories[data.cid].tags;
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
        const allowedTags = plugin.settings.tags.map(tag => tag.name);
        if (typeof data.tags === "string") {
            data.tags = [data.tags];
        }
        if (data.tags.length > 0) {
            data.tags = data.tags.filter((tag) => allowedTags.includes(tag));
            plugin.settings.categories[data.cid].tags = _.merge(
                plugin.settings.categories[data.cid].tags,
                data.tags
            );
        }
    }
};
module.exports = plugin;
