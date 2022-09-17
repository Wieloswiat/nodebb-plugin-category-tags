<div class="row">
<div class="col-sm-2 col-xs-12 settings-header">Category Tags</div>
<div class="col-sm-10 col-xs-12">
<form role="form" class="category-tags-settings">
		<div class="row">
			<div class="col-sm-2 col-xs-12 settings-header">[[category-tags:admin.sortingAndFilters]]</div>
			<div class="col-sm-10 col-xs-12">
				<div class="checkbox">
					<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect"> 
						<input type="checkbox" class="mdl-switch__input" id="overrideFilter" data-key="overrideFilter" name="overrideFilter" />
						<span class="mdl-switch__label"><strong>[[category-tags:admin.overrideFilter]]</strong></span>
					</label>
				</div>
				<div class="checkbox">
					<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect"> 
						<input type="checkbox" class="mdl-switch__input" id="overrideSort" data-key="overrideSort" name="overrideSort" />
						<span class="mdl-switch__label"><strong>[[category-tags:admin.overrideSort]]</strong></span>
					</label>
				</div>
				<div class="checkbox">
					<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect"> 
						<input type="checkbox" class="mdl-switch__input" id="membership" data-key="membership" name="membership" />
						<span class="mdl-switch__label"><strong>[[category-tags:admin.membership]]</strong></span>
					</label>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="col-sm-2 col-xs-12 settings-header">[[category-tags:admin.weights]]</div>
			<div class="col-sm-10 col-xs-12">
				<label for="activeUsersWeight">[[category-tags:admin.activeUsersWeight]]</label>
				<input type="number" class="form-control" id="activeUsersWeight" data-key="activeUsersWeight" name="activeUsersWeight" />

				<label for="postCountWeight">[[category-tags:admin.postCountWeight]]</label>
				<input type="number" class="form-control" id="postCountWeight" data-key="postCountWeight" name="postCountWeight" />

				<label for="topicCountWeight">[[category-tags:admin.topicCountWeight]]</label>
				<input type="number" class="form-control" id="topicCountWeight" data-key="topicCountWeight" name="topicCountWeight" />

				<label for="recentPostsWeight">[[category-tags:admin.recentPostsWeight]]</label>
				<input type="number" class="form-control" id="recentPostsWeight" data-key="recentPostsWeight" name="recentPostsWeight" />

				<label for="popularTopicsWeight">[[category-tags:admin.popularTopicsWeight]]</label>
				<input type="number" class="form-control" id="popularTopicsWeight" data-key="popularTopicsWeight" name="popularTopicsWeight" />

				<label for="pageViewsMonthWeight">[[category-tags:admin.pageViewsMonthWeight]]</label>
				<input type="number" class="form-control" id="pageViewsMonthWeight" data-key="pageViewsMonthWeight" name="pageViewsMonthWeight" />

				<label for="pageViewsDayWeight">[[category-tags:admin.pageViewsDayWeight]]</label>
				<input type="number" class="form-control" id="pageViewsDayWeight" data-key="pageViewsDayWeight" name="pageViewsDayWeight" />

				<label for="monthlyPostsWeight">[[category-tags:admin.monthlyPostsWeight]]</label>
				<input type="number" class="form-control" id="monthlyPostsWeight" data-key="monthlyPostsWeight" name="monthlyPostsWeight" />
			</div>
		<div class="row">
			<div class="col-sm-2 col-xs-12 settings-header">Tags</div>
			<div class="col-sm-10 col-xs-12">
				<div class="form-group" data-type="sorted-list" data-sorted-list="tags" data-item-template="admin/plugins/partials/tags-sorted-list/item" data-form-template="admin/plugins/partials/tags-sorted-list/form">
					<input hidden="text" name="tags">
					<ul data-type="list" class="list-group"></ul>
					<button id="add-tag" type="button" data-type="add" class="btn btn-info">Add Item</button>
				</div>
			</div>
		</div>
		<div class="row">
			<h1>[[admin/manage/categories:settings]]</h1>
				{{{ each categories }}}
				<div class="row">
					<div class="col-sm-2 col-xs-12 settings-header">{../name}</div>
					<div class="col-sm-10 col-xs-12">
						<div class="checkbox">
							<label for="categories:{@key}:override" class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
								<input type="checkbox" class="mdl-switch__input" id="categories:{@key}:override" data-key="categories:{@key}:override" name="categories:{@key}:override">
								<span class="mdl-switch__label"><strong>override</strong></span>
							</label>
						</div>
						<select class="form-contol" data-type="select" name="categories:{@key}:tags" data-key="categories:{@key}:tags" multiple>
							{{{ each categoryTags }}}
							<option value="{../name}">{../name}</option>
							{{{ end }}}
						</select>
					</div>
				</div>
				{{{ end }}}
		</div>
	</form>
</div>
</div>
<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>
