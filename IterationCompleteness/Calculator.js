Ext.define('Yahoo.app.StoryCompletenessCalculator', {

    prepareChartData: function (store) {
    	
    	
    	// Compute to total number of story point being schedule
    	var totalPlanEstimatesForCurrentIteration = 0;
    	store.each(function (record, currentIndex) {
    		totalPlanEstimatesForCurrentIteration += record.get("PlanEstimate"); 
    	});
    	
    	var categories = [];
        var actualData = [];
        var expectedData = [];
        
        var currentOrigin = 0; // Define the current origin in days
        var totalExpectedStoryPointBurn = 0; // Total number of point expected 
        var allStoriesScheduleToDateHaveBeenAccepted = true;

        store.each(function (record) {
        	
            var featureName = record.get('Name');
            categories.push(featureName);
            
            // Plan completion = featureNbDaysElapseToDate * planStoryPerDay
            // - featureNbDaysElapseToDate = number of day elapse since the the beginning of
            // the feature
            // - featurePlanEstimatePerDay = expected number of story points being
            // completed for a given day for this feature

            var startDate, endDate, Rst, Rend, featurePlanEstimate, featureActualEstimate;

            startDate = Rally.util.DateTime.fromIsoString(record.get('Iteration').StartDate);
            endDate = Rally.util.DateTime.fromIsoString(record.get('Iteration').EndDate);
            Rst = startDate;
            Rend = endDate;
            
            featurePlanEstimate = record.get("PlanEstimate"); 
            
            var hasStoryBeenAccepted = record.get("ScheduleState") === "Accepted";
            featureActualEstimate = !hasStoryBeenAccepted ? 0 : featurePlanEstimate;         
            
            // Because stories do not have an start/end date we are going to assume that
            // people are working on the most important story first before moving to the next one
            // startDate = Rst + currentOrigin 
            // endDate = startDate + nbDays(storyPlanEstimate / iterationDailyBurnRate)
            IterationTotalNbDays = Rally.util.DateTime.getDifference(Rend, Rst, 'day');
            iterationDailyBurnRate = totalPlanEstimatesForCurrentIteration / IterationTotalNbDays;
            startDate = Rally.util.DateTime.add(Rst, "day", currentOrigin);
            endDate = Rally.util.DateTime.add(startDate, "day", Math.ceil((featurePlanEstimate / iterationDailyBurnRate)));
            totalExpectedStoryPointBurn += featurePlanEstimate;
            currentOrigin = totalExpectedStoryPointBurn / iterationDailyBurnRate;

//            console.log("x iterationStart=" + Rst);
//            console.log("x iterationEnd=" + Rend);
//            console.log("x IterationTotalNbDays=" + IterationTotalNbDays);           
//            console.log("x iterationDailyBurnRate=" + iterationDailyBurnRate);
//            console.log("x storyPlanEstimate=" + featurePlanEstimate);
//            console.log("x storyPointAccepted=" + featureActualEstimate);
//            console.log("x totalExpectedStoryPointBurn=" + totalExpectedStoryPointBurn);
//            console.log("x startDate=" + startDate);
//            console.log("x endDate=" + endDate);
//            console.log("x currentOrigin=" + currentOrigin);

            // NOTE
            // We add 1 day to featureLengthInDays because it seems that Rally define a feature that 
            // Last one day as actually lasting 1 day - 1 seconds and 
            // the Rally.util.DateTime.getDifferent API seems to consider this as 0 days :-(
            // Here is what Rally return for a feature Start/End Data that last one day
            //  - StartDate = Sat Jun 29 2013 01:00:00 GMT-0600 (MDT)
            //  - EndDate = Sun Jun 30 2013 00:59:59 GMT-0600 (MDT)
            var featureLengthInDays = Math.ceil((Rally.util.DateTime.getDifference(
                endDate, startDate, 'hour') / 24)); // See note below to explain the +1

            var featureNbDaysElapseToDate = featureLengthInDays;
            
            // NOTE: I don't think we need this logic
            // But I can't guarantee it as I can't test
            // The code when looking at future iterations with already schedule stories
//            if (endDate < todayDate) {
//                // We are looking at a feature that already ended (end date is before today's date),
//                // SO we are assuming that we've spend all the day for this feature
//                console.log("INFO: We are looking at a feature that already ended");
//                featureNbDaysElapseToDate = featureLengthInDays;
//            } else if (todayDate < startDate) {
//                // We are looking at a feature that hasn't started yet,
//                // SO we are assuming that we've spend any day on this feature
//                console.log("INFO: We are looking at a feature that hasn't started yet");
//                featureNbDaysElapseToDate = 0;
//            } else {
//                // We are looking at a feature that is currently in progress
//                console.log("INFO: We are looking at a feature that is currently in progress");
//                //featureNbDaysElapseToDate = Rally.util.DateTime.getDifference(todayDate, startDate, 'day');
//                featureNbDaysElapseToDate = featureLengthInDays;
//            }

            var featurePlanEstimatePerDay = featurePlanEstimate / featureLengthInDays;
            var featureActualEstimatePerDay = featureActualEstimate / featureLengthInDays;

            var plan = [], actual = [];

            //  0                                                                     Ix
            // Ist                                                                   Iend
            //  | ---------------------IterationTotalNbDays--------------------------- |
            //  |                                                           |          |
            //  |                   Est                          Eend       |          |
            //  | NbDaysFromOrigin   |-----FExpectedNbDays---------|        |          |
            //  |                   0%                            %Fx (n%)  Fx (100%)  |
            //  |                                                           |          |         
            //  |                   Ast                   Aend              |          |
            //  | NbDaysFromOrigin   |-----FActualNbDays---|                |          |
            //  |                   0%                    %Fx (m%)         100%        |

            var nbDaysFromOrigin = Rally.util.DateTime.getDifference(startDate, Rst, 'day');

            // Create expected (Est, Eend)
            var Est = nbDaysFromOrigin;
            var FExpectedNbDays = nbDaysFromOrigin;
            var Eend = nbDaysFromOrigin;
            if (featurePlanEstimate) {
                FExpectedNbDays = ((featureNbDaysElapseToDate * featurePlanEstimatePerDay) / featurePlanEstimate);
                Eend = nbDaysFromOrigin + ( FExpectedNbDays * featureLengthInDays );
            }

            plan = [ Est, Eend ];
            //actual = [ Ast, Aend];

            var storyStatusColor;
            var todayDate = new Date();
            var storyStatus;
            
            // Are we looking at story in the future?
            if ((endDate >= todayDate) && (startDate >= Rst)) {
            	
            	if (hasStoryBeenAccepted) {
            		if (allStoriesScheduleToDateHaveBeenAccepted) {
            			storyStatusColor = "green";
                    	storyStatus = "AHEAD";
            		} else {
            			storyStatusColor = "red";
                    	storyStatus = "NOT-HIGEST-PRIORITY";
            		}
	
                } else {
                	storyStatusColor = "black";
                	storyStatus = "ONTRACK";
                }
            	
            } else {
            	
            	if (featureActualEstimate > 0) {
                	storyStatusColor = "green";
                	storyStatus = "DONE";
                } else {
                	storyStatusColor = "orange";
                	storyStatus = "LATE";
                }
            	
            }
            
            allStoriesScheduleToDateHaveBeenAccepted = allStoriesScheduleToDateHaveBeenAccepted && hasStoryBeenAccepted;
            
            //actualData.push({ low: actual[0], high: actual[1], color: "green"});//{y: actual, record: record});
            expectedData.push({ low: plan[0], high: plan[1], color: storyStatusColor, storyStatus: storyStatus, record: record});
            
//            console.log("[" + featureName + "] Rst=" + Rst);
//            console.log("[" + featureName + "] Rend=" + Rend);
//            console.log("[" + featureName + "] FeatureCalendarStartDate=" + startDate);
//            console.log("[" + featureName + "] FeatureCalendarEndDate=" + endDate);
//            console.log("[" + featureName + "] nbDaysFromOrigin=" + nbDaysFromOrigin);
//            console.log("[" + featureName + "] featureLengthInDays=" + featureLengthInDays);
//            console.log("[" + featureName + "] featureNbDaysElapseToDate=" + featureNbDaysElapseToDate);
//            console.log("[" + featureName + "] featurePlanEstimatePerDay=" + featurePlanEstimatePerDay);
//            console.log("[" + featureName + "] featurePlanEstimate=" + featurePlanEstimate);
//            console.log("[" + featureName + "] Est=" + Est);
//            console.log("[" + featureName + "] FExpectedNbDays=" + FExpectedNbDays);
//            console.log("[" + featureName + "] Eend=" + Eend);
//            console.log("[" + featureName + "] Ast=" + Ast);
//            console.log("[" + featureName + "] FActualNbDays=" + FActualNbDays);
//            console.log("[" + featureName + "] Aend=" + Aend);
            
            
        });

        return {
            categories: categories,
            series: [
//                {
//                    name: 'Story actual completion date',
//                    data: actualData
//                },
                {
                    name: 'Story expected plan date',
                    data: expectedData
                }
            ]
        };
    }
});
