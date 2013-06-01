Ext.define('Yahoo.app.FeatureCompletenessCalculator', {

    prepareChartData: function (store) {
        var categories = [];
        var actualData = [];
        var expectedData = [];
        var forecastData = [];
        var boundaryData = [];

        store.each(function (record) {
            var featureName = record.get('Name');
            categories.push(featureName);

            // Plan completion = featureNbDaysElapseToDate * planStoryPerDay
            // - featureNbDaysElapseToDate = number of day elapse since the the beginning of
            // the feature
            // - featurePlanEstimatePerDay = expected number of story points being
            // completed for a given day for this feature

            var startDate, endDate, Rst, Rend, featurePlanEstimate, featureActualEstimate;

            //assuming portfolioitem
            startDate = record.get("PlannedStartDate");
            endDate = record.get("PlannedEndDate");

            Rst = Rally.util.DateTime.fromIsoString(record.get("Release").ReleaseStartDate);
            Rend = Rally.util.DateTime.fromIsoString(record.get("Release").ReleaseDate);

            if (startDate === null) {
                startDate = Rst;
            }
            if (endDate === null) {
                endDate = Rend;
            }

            featurePlanEstimate = record.get("LeafStoryPlanEstimateTotal");
            featureActualEstimate = record.get("AcceptedLeafStoryPlanEstimateTotal");

            var featureLengthInDays = Math.ceil((Rally.util.DateTime.getDifference(
                endDate, startDate, 'hour') / 24)); // See note below to explain the +1

            // NOTE
            // We add 1 day to featureLengthInDays because it seems that Rally define a feature that 
            // Last one day as actually lasting 1 day - 1 seconds and 
            // the Rally.util.DateTime.getDifferent API seems to consider this as 0 days :-(
            // Here is what Rally return for a feature Start/End Data that last one day
            //  - StartDate = Sat Jun 29 2013 01:00:00 GMT-0600 (MDT)
            //  - EndDate = Sun Jun 30 2013 00:59:59 GMT-0600 (MDT)

            var todayDate = new Date();

            var featureNbDaysElapseToDate;
            if (endDate < todayDate) {
                // We are looking at a feature that already ended (end date is before today's date),
                // SO we are assuming that we've spend all the day for this feature
                //console.log("INFO: We are looking at a feature that already ended");
                featureNbDaysElapseToDate = featureLengthInDays;
            } else if (todayDate < startDate) {
                // We are looking at a feature that hasn't started yet,
                // SO we are assuming that we've spend any day on this feature
                //console.log("INFO: We are looking at a feature that hasn't started yet");
                featureNbDaysElapseToDate = 0;
            } else {
                // We are looking at a feature that is currently in progress
                //console.log("INFO: We are looking at a featre that is currently in progress");
                featureNbDaysElapseToDate = Rally.util.DateTime.getDifference(todayDate, startDate, 'day');
            }

            var featurePlanEstimatePerDay = featurePlanEstimate / featureLengthInDays;
            var featureActualEstimatePerDay = featureActualEstimate / featureLengthInDays;

            var plan = [], actual = [], forecast = [], boundary = [];

            //  0                                                                     Rx
            // Rst                                                                   Rend
            //  | ---------------------ReleaseTotalNbDays----------------------------- |
            //  |                   Fst                                    Fend        |
            //  | NbDaysFromOrigin   |-----FTotalNbDays---------------------|          |
            //  |                                                           |          |
            //  |                   Est                          Eend       |          |
            //  | NbDaysFromOrigin   |-----FExpectedNbDays---------|        |          |
            //  |                   0%                            %Fx (n%)  Fx (100%)  |
            //  |                                                           |          |         
            //  |                   Ast                   Aend              |          |
            //  | NbDaysFromOrigin   |-----FActualNbDays---|                |          |
            //  |                   0%                    %Fx (m%)         100%        |

            var nbDaysFromOrigin = Rally.util.DateTime.getDifference(
                startDate, Rst, 'day');

            // Create boundary of the feature (Fst, Fend)
            var Fst = nbDaysFromOrigin;
            var Fend = nbDaysFromOrigin + featureLengthInDays;

            // Create expected (Est, Eend)
            var Est = nbDaysFromOrigin;
            var FExpectedNbDays = Fst;
            var Eend = Fst;
            if (featurePlanEstimate) {
                FExpectedNbDays = ((featureNbDaysElapseToDate * featurePlanEstimatePerDay) / featurePlanEstimate);
                Eend = nbDaysFromOrigin + ( FExpectedNbDays * featureLengthInDays );
            }

            // Create actual (Ast, Aend)
            var Ast = nbDaysFromOrigin;
            var FActualNbDays = Fst;
            var Aend = Fst;
            if (featurePlanEstimate) {
                FActualNbDays = (featureActualEstimate / featurePlanEstimate);
                Aend = nbDaysFromOrigin + ( FActualNbDays * featureLengthInDays );
            }

            boundary = [ Fst, Fend ];
            plan = [ Est, Eend ];
            actual = [ Ast, Aend];
            if (featurePlanEstimate) {
                forecast = ((featurePlanEstimate - featureActualEstimate) / featureActualEstimatePerDay) * 100 + actual;
            }

            actualData.push(actual);//{y: actual, record: record});
            expectedData.push(plan);
            forecastData.push(forecast);
            boundaryData.push(boundary);
        });

        return {
            categories: categories,
            series: [
                {
                    name: 'Feature Actual',
                    data: actualData
                },
                {
                    name: 'Feature Expected',
                    data: expectedData
                },
                {
                    name: 'Feature Boundaries',
                    data: boundaryData
                }
            ]
        };
    }
});
