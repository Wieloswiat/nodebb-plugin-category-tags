<form role="form" class="category-tags-settings">
	<div class="row">
		<div class="col-sm-2 col-xs-12 settings-header">[[category-tags:admin.sortingAndFilters]]</div>
		<div class="col-sm-10 col-xs-12">
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect"> 
					<input type="checkbox" class="mdl-switch__input" id="overrideFilter" data-field="overrideFilter" name="overrideFilter" />
					<span class="mdl-switch__label"><strong>[[category-tags:admin.overrideFilter]]</strong></span>
				</label>
			</div>
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect"> 
					<input type="checkbox" class="mdl-switch__input" id="overrideSort" data-field="overrideSort" name="overrideSort" />
					<span class="mdl-switch__label"><strong>[[category-tags:admin.overrideSort]]</strong></span>
				</label>
			</div>
			<div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect"> 
					<input type="checkbox" class="mdl-switch__input" id="membership" data-field="membership" name="membership" />
					<span class="mdl-switch__label"><strong>[[category-tags:admin.membership]]</strong></span>
				</label>
			</div>
		</div>
	</div>
	<div class="row">
		<div class="col-sm-2 col-xs-12 settings-header">[[category-tags:admin.weights]]</div>
		<div class="col-sm-10 col-xs-12">
			<label for="activeUsersWeight">[[category-tags:admin.activeUsersWeight]]</label>
			<input type="number" class="form-control" id="activeUsersWeight" data-field="activeUsersWeight" name="activeUsersWeight" />

			<label for="postCountWeight">[[category-tags:admin.postCountWeight]]</label>
			<input type="number" class="form-control" id="postCountWeight" data-field="postCountWeight" name="postCountWeight" />

			<label for="topicCountWeight">[[category-tags:admin.topicCountWeight]]</label>
			<input type="number" class="form-control" id="topicCountWeight" data-field="topicCountWeight" name="topicCountWeight" />

			<label for="recentPostsWeight">[[category-tags:admin.recentPostsWeight]]</label>
			<input type="number" class="form-control" id="recentPostsWeight" data-field="recentPostsWeight" name="recentPostsWeight" />

			<label for="popularTopicsWeight">[[category-tags:admin.popularTopicsWeight]]</label>
			<input type="number" class="form-control" id="popularTopicsWeight" data-field="popularTopicsWeight" name="popularTopicsWeight" />

			<label for="pageViewsMonthWeight">[[category-tags:admin.pageViewsMonthWeight]]</label>
			<input type="number" class="form-control" id="pageViewsMonthWeight" data-field="pageViewsMonthWeight" name="pageViewsMonthWeight" />

			<label for="pageViewsDayWeight">[[category-tags:admin.pageViewsDayWeight]]</label>
			<input type="number" class="form-control" id="pageViewsDayWeight" data-field="pageViewsDayWeight" name="pageViewsDayWeight" />

			<label for="monthlyPostsWeight">[[category-tags:admin.monthlyPostsWeight]]</label>
			<input type="number" class="form-control" id="monthlyPostsWeight" data-field="monthlyPostsWeight" name="monthlyPostsWeight" />
		</div>
</form>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>
