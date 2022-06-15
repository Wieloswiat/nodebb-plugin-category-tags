"use strict";

/* globals $, app, socket, define */

define("admin/plugins/category-tags", ["settings"], function (Settings) {
    var ACP = {};

    ACP.init = function () {
        Settings.load("category-tags-settings-2.0", $(".category-tags-settings"));
        $("#save").on("click", function (e) {
            e.preventDefault();
            Settings.save(
                "category-tags-settings-2.0",
                $(".category-tags-settings"),
                function () {
                    socket.emit(
                        "plugins.categoryTags.reloadSettings",
                        {},
                        () => {
                            app.alert({
                                type: "success",
                                alert_id: "category-tags-saved",
                                title: "Settings Saved",
                                message: "no reload needed",
                            });
                            ajaxify.refresh();
                        }
                    );
                }
            );
        });
    };

    return ACP;
});
