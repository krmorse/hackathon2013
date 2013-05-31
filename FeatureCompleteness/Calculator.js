Ext.define('Yahoo.app.FeatureCompletenessCalculator', {

    config: {
    },

    constructor: function(config) {
        this.initConfig(config);
        this.callParent(arguments);
    },

    prepareChartData: function(store) {
        var categories = [];
        var actualData = [];
        var plannedData = [];

        store.each(function(record) {
            categories.push(record.get('Name'));

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

            var featureLengthInDays = Rally.util.DateTime.getDifference(
                endDate, startDate, 'day');

            var todayDate = new Date();

            var featureNbDaysElapseToDate = Rally.util.DateTime.getDifference(
                todayDate, startDate, 'day');

            if (todayDate < startDate) {
                featureNbDaysElapseToDate = 0;
            }

            var featurePlanEstimate = record.get("LeafStoryPlanEstimateTotal");
            var featurePlanEstimatePerDay = featurePlanEstimate / featureLengthInDays;

            var plan = 0, actual = 0;
            if(featurePlanEstimate) {
                plan = ((featureNbDaysElapseToDate * featurePlanEstimatePerDay) / featurePlanEstimate) * 100;
                actual = ((record.get("AcceptedLeafStoryPlanEstimateTotal") / featurePlanEstimate) * 100);
            }
            actualData.push(actual);
            plannedData.push(plan);
        });     

        return {
            categories: categories,
            series: [
                {
                    name: 'Actual',
                    data: actualData
                },
                {
                    name: 'Planned',
                    data: plannedData
                }
            ]
        };
    }
});