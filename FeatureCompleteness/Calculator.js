Ext.define('Yahoo.app.FeatureCompletenessCalculator', {

    prepareChartData: function(store) {
        var categories = [];
        var actualData = [];
        var expectedData = [];
        var forecastData = [];

        store.each(function(record) {
            categories.push(record.get('Name'));

            // Plan completion = featureNbDaysElapseToDate * planStoryPerDay
            // - featureNbDaysElapseToDate = number of day elapse since the the beginning of
            // the feature
            // - featurePlanEstimatePerDay = expected number of story points being
            // completed for a given day for this feature

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
            var featureActualEstimate = record.get("AcceptedLeafStoryPlanEstimateTotal");
            var featurePlanEstimatePerDay = featurePlanEstimate / featureLengthInDays;
            var featureActualEstimatePerDay = featureActualEstimate / featureLengthInDays;

            var plan = 0, actual = 0, forecast = 0;
            if(featurePlanEstimate) {
                plan = ((featureNbDaysElapseToDate * featurePlanEstimatePerDay) / featurePlanEstimate) * 100;
                actual = (featureActualEstimate / featurePlanEstimate) * 100;
                forecast = ((featurePlanEstimate - featureActualEstimate) / featureActualEstimatePerDay) * 100 + actual;
            }
            actualData.push(actual);
            expectedData.push(plan);
            forecastData.push(forecast);
        });

        return {
            categories: categories,
            series: [
                {
                    name: 'Actual',
                    data: actualData
                },
                {
                    name: 'Expected',
                    data: expectedData
                }
            ]
        };
    }
});