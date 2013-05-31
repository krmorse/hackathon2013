Ext.define('Yahoo.app.FeatureCompleteness', {
    extend: 'Rally.app.TimeboxScopedApp',
    requires: ['Yahoo.app.FeatureCompletenessCalculator'],
    componentCls: 'app',

    scopeType: 'release',

    addContent: function (scope) {
        //render components
        this._drawChart();
    },

    onScopeChange: function (scope) {
        //refresh components
        this._drawChart();
    },

    _drawChart: function () {
        if (this.chart) {
            //refresh
            this.chart.destroy();
        }

        this.chart = this.add({
            xtype: 'rallychart',

            storeType: 'Rally.data.WsapiDataStore',
            storeConfig: {
                model: 'PortfolioItemFeature',
                context: this.getContext().getDataContext(),
                filters: [this.getContext().getTimeboxScope().getQueryFilter()],
                sorters: [
                    {
                        property: 'Rank',
                        direction: 'DESC'
                    }
                ],
                pageSize: 50,
                fetch: [ 'PlannedStartDate', 'PlannedEndDate',
                    'LeafStoryPlanEstimateTotal',
                    'AcceptedLeafStoryPlanEstimateTotal', 'Name', 'Release',
                    'ReleaseDate', 'ReleaseStartDate' ]
            },

            calculatorType: 'Yahoo.app.FeatureCompletenessCalculator',
            calculatorConfig: {
            },

            chartConfig: this._getChartConfig()
        });
    },

    _getChartConfig: function () {
        return {
            chart: {
                type: 'bar'
            },
            title: {
                text: 'Feature Completeness Report'
            },
            xAxis: {
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                max: 100,
                title: {
                    text: '% Complete',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
                valueSuffix: ' %'
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: false
                    }
                }
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                x: -100,
                y: 100,
                floating: true,
                borderWidth: 1,
                backgroundColor: '#FFFFFF',
                shadow: true,
                reversed: true
            }
        };
    }
});
