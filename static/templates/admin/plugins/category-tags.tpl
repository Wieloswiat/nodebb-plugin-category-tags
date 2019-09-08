<form role="form" class="category-tags-settings">
	<div class="row">
		<div class="col-sm-2 col-xs-12 settings-header">General</div>
		<div class="panel panel-default tag-management">
			<div class="panel-body">
				<!-- IF !tags.length -->
				[[admin/manage/tags:none]]
				<!-- ENDIF !tags.length -->

				<div class="tag-list">
					<!-- BEGIN tags -->
					<div class="tag-row" data-tag="{tags}">
						<div data-value="{tags}">
							<span class="mdl-chip mdl-chip--contact tag-item" data-tag="{tags}">
							    <span class="mdl-chip__text">{tags}</span>
							</span>
						</div>
					</div>
					<!-- END tags -->
				</div>
			</div>
		</div>
	<div class="col-lg-3 acp-sidebar">
		<div class="panel panel-default">
			<div class="panel-heading">[[admin/manage/tags:create-modify]]</div>
			<div class="panel-body">
				<p>[[admin/manage/tags:description]]</p>
				<button class="btn btn-primary btn-block" id="create">[[admin/manage/tags:create]]</button>
				<button class="btn btn-primary btn-block" id="modify">[[admin/manage/tags:modify]]</button>
				<button class="btn btn-primary btn-block" id="rename">[[admin/manage/tags:rename]]</button>
				<button class="btn btn-warning btn-block" id="deleteSelected">[[admin/manage/tags:delete]]</button>
			</div>
		</div>
</form>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>
