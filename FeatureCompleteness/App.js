Ext.define('Yahoo.app.FeatureCompleteness', {
	extend : 'Rally.app.TimeboxScopedApp',
	componentCls : 'app',

	scopeType : 'release',
	
	//
	// Array of Arrays
	// Each item of the Array has two elements
	//  - Actual feature completeness
	//  - Plan feature completeness
	_featuresCompletenessDateForCurrentRelease : [],

	// being called once the page rendered completely
	addContent : function(scope) {

	},

	onScopeChange : function(scope) {

		console.log("Processing release: " + scope.getRecord().get("Name"));

		// Create Wsapi for list of feature that map the currently selected
		// release
		Ext.create('Rally.data.WsapiDataStore', {
			model : 'PortfolioItem/Feature',
			autoLoad : true,
			fetch : [ 'PlannedStartDate', 'PlannedEndDate',
					'LeafStoryPlanEstimateTotal',
					'AcceptedLeafStoryPlanEstimateTotal', 'Name', 'Release',
					'ReleaseDate', 'ReleaseStartDate' ],
			filters : [ scope.getQueryFilter() ],
			sorters : [ {
				property : 'Rank',
				direction : 'ASC'
			} ],
			listeners : {
				load : this._processFeaturesForRelease,
				scope : this
			}
		});

	},

	_processFeaturesForRelease : function(store, featureListRec) {

		this._featuresCompletenessDateForCurrentRelease = [];

		Ext.Array.each(featureListRec, function(record) {

			// Plan completion =
			// - nbDaySpent = number of day elapse since the the beginning of
			// the feature
			// - planStoryPerDay = expected number of story points being
			// completed for a given day for this feature
			// formula = nbDaySpent * planStoryPerDay

			var startDate = record.get("PlannedStartDate");
			var endDate = record.get("PlannedEndDate");
			
			if (startDate === null) {
				startDate = Rally.util.DateTime.fromIsoString(record.get("Release").ReleaseStartDate);
			}
			if (endDate === null) {
				endDate = Rally.util.DateTime.fromIsoString(record.get("Release").ReleaseDate);
			}

			var featureLenghtInDays = Rally.util.DateTime.getDifference(
					endDate, startDate, 'day');
			
			var todayDate = new Date();
			
			var featureNbDaysElapseToDate = Rally.util.DateTime.getDifference(
					endDate, new Date(), 'day');
			
			if (endDate < todayDate) {
				console.log("in the condition")
				featureNbDaysElapseToDate = featureLenghtInDays;
			}
			
			var featurePlanEstimate = record.get("LeafStoryPlanEstimateTotal");
			var featurePlanEstimatePerDay = featurePlanEstimate / featureLenghtInDays;

			var plan = featureNbDaysElapseToDate * featurePlanEstimatePerDay;
			var actual = record.get("AcceptedLeafStoryPlanEstimateTotal");

			var featureObj = ([ plan, actual ]);
			console.log("Inspecting feature: [" + record.get("Name") + "] = ",
					featureObj);

			this._featuresCompletenessDateForCurrentRelease.push(featureObj);
			
//			console.log("startDate: " + startDate);
//			console.log("endDate: " + endDate);
//			console.log("featureLenghtInDays: " + featureLenghtInDays);
//			console.log("featureNbDaysElapseToDate: " + startDate);
//			console.log("startDate: " + startDate);
//			console.log("startDate: " + startDate);
//			console.log("startDate: " + startDate);
			

		}, this);

		console.log("Done");

	}
});
