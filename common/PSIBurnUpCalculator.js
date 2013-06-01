Ext.define('Yahoo.app.PSIBurnUpCalculator', {
	
	extend: "Rally.data.lookback.calculator.TimeSeriesCalculator",

	getMetrics: function () {
        return [
            {
                "field": "PlanEstimate",
                "as": "Planned",
                "display": "line",
                "f": "sum"
            },
            {
                "field": "PlanEstimate",
                "as": "Accepted",
                "f": "filteredSum",
                "filterField": "ScheduleState",
                "filterValues": ["Accepted", "Released"],
                "display": "column"
            }
        ];
    }
	
});