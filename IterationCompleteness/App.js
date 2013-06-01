Ext.define('Yahoo.app.IterationCompleteness', {
    extend: 'Rally.app.TimeboxScopedApp',
    requires: [ 'Yahoo.app.StoryCompletenessCalculator',
        'Yahoo.app.PSIBurnUpCalculator',
        'Yahoo.app.StoryPopover'],
    componentCls: 'app',

    scopeType: 'iteration',

    addContent: function (scope) {
        this._getStoriesForCurrentIteration(scope);
        this._drawIterationCompletenessChart();
    },

    onScopeChange: function (scope) {
        this._getStoriesForCurrentIteration(scope);
        this._drawIterationCompletenessChart();
    },

    _getStoriesForCurrentIteration: function (scope) {

        Ext.create('Rally.data.WsapiDataStore', {
            model: 'UserStory',
            autoLoad: true,
            fetch: false,
            filters: [ scope.getQueryFilter() ],
            listeners: {
                load: function (store, data, success) {

                    var storyOIDList = [];

                    store.each(function (record) {
                        storyOIDList.push(Rally.util.Ref.getOidFromRef(record.get("_ref")));
                    });

                    this._drawPSIBurnUpChart(storyOIDList);

                },
                scope: this
            }
        });
    },

    _drawIterationCompletenessChart: function () {
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = this
            .add({
                xtype: 'rallychart',

                _haveDataToRender: function () {
                    return true; // HACK
                },

                storeType: 'Rally.data.WsapiDataStore',
                storeConfig: {
                    model: 'UserStory',
                    context: this.getContext()
                        .getDataContext(),
                    filters: [ this.getContext()
                        .getTimeboxScope()
                        .getQueryFilter() ],
                    sorters: [
                        {
                            property: 'Rank',
                            direction: 'DSC'
                        }
                    ],
                    pageSize: 2,
                    fetch: [
                        // Doesn't exist for iteration - (assuming iteration start) 'PlannedStartDate',
                        // Doesn't exist for iteration - (assuming iteration end) 'PlannedEndDate',
                        'PlanEstimate',
                        // Doesn't exist for iteration - (assuming all point when schedule state = Accepted) 'AcceptedLeafStoryPlanEstimateTotal',
                        'Name',
                        'Iteration',
                        'StartDate',
                        'EndDate' ]
                    //,limit: 15
                },

                calculatorType: 'Yahoo.app.StoryCompletenessCalculator',
                calculatorConfig: {},

                chartConfig: this._getIterationCompletenessChartConfig()
            });
    },

    _getIterationCompletenessChartConfig: function () {
        var me = this;
        return {
            chart: {
                type: 'columnrange',
                inverted: true
            },
            title: {
                text: 'Iteration Completeness Report'
            },
            xAxis: {
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                plotLines: [
                    {
                        value: (function () {

                            var todayDate = new Date();
                            var iterationStart = me.getContext().getTimeboxScope().getRecord().get('StartDate');
                            var iterationEnd = me.getContext().getTimeboxScope().getRecord().get('EndDate');

                            if ((iterationEnd >= todayDate) && (todayDate >= iterationStart)) {
                                return Rally.util.DateTime.getDifference(todayDate, iterationStart, 'day');
                            }
                        })(),
                        width: 2,
                        color: "red",
                        zIndex: 100 }
                ],
                endOnTick: true,
                startOnTick: true,
                tickInterval: 1,
                title: {
                    text: null
                },
                labels: {
                    overflow: 'justify',
                    formatter: function () {
                        var displayDate = Rally.util.DateTime.add(me.getContext().getTimeboxScope().getRecord().get('StartDate'), "day", this.value);
                        return Rally.util.DateTime.format(displayDate, 'm/d/Y');
                    }
                }
            },
            tooltip: {
                formatter: function () {
                    var displayDateForLeftValue = Rally.util.DateTime.add(me.getContext().getTimeboxScope().getRecord().get('ReleaseStartDate'), "day", this.point.low);
                    var leftSide = Rally.util.DateTime.format(displayDateForLeftValue, 'm/d/Y');
                    var displayDateForRightValue = Rally.util.DateTime.add(me.getContext().getTimeboxScope().getRecord().get('ReleaseStartDate'), "day", this.point.high);
                    var rightSide = Rally.util.DateTime.format(displayDateForRightValue, 'm/d/Y');
                    return "<b>" + this.x + "</b><br />" + this.point.series.name + "<br />" + "Range date: " + leftSide + " - " + rightSide;
                }

            },
            plotOptions: {
                columnrange: {
                    dataLabels: {
                        enabled: false
                    },
                    events: {
                        click: Ext.bind(function (e) {
                            var feature = e.point.series.data[0].record;
                            if (feature) {
                                this._showFeaturePopover(feature, Ext.get(e.target));
                            }
                        }, this)
                    },
                    cursor: 'pointer'
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
    },

    _drawPSIBurnUpChart: function (storyOidList) {

        if (this.psiBurnUpchart) {
            this.psiBurnUpchart.destroy();
        }

        this.psiBurnUpchart = this.add({
            xtype: 'rallychart',

            storeType: 'Rally.data.lookback.SnapshotStore',
            storeConfig: {
                find: {
                    _TypeHierarchy: 'HierarchicalRequirement',
                    _ItemHierarchy: {$in: storyOidList},
                    Children: null,
                    _ValidFrom: {$gte: Rally.util.DateTime.toIsoString(this.getContext().getTimeboxScope().getRecord().get('StartDate'))}
                },
                fetch: [ 'ScheduleState', 'PlanEstimate' ],
                hydrate: [ 'ScheduleState' ]
            },

            calculatorType: 'Yahoo.app.PSIBurnUpCalculator',
            calculatorConfig: {},

            chartConfig: this._getPSIBurnUpConfig()
        });

    },

    _getPSIBurnUpConfig: function () {
        return {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Iteration Tracking Burnup Chart'
            },
            xAxis: {
                tickInterval: 1
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Stories (points)'
                }
            }
        };

    },

    _showFeaturePopover: function (feature, el) {
        Ext.create('Yahoo.app.StoryPopover', {
            record: feature,
            target: el
        });
    }

});
