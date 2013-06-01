Ext.define('Yahoo.app.FeaturePopover', {
    extend: 'Rally.ui.popover.Popover',
    cls: 'feature-popover',

    placement: 'top',
    height: 125,

    config: {
        record: undefined,
        seriesData: undefined
    },

    initComponent: function () {
        this.callParent(arguments);

        this.add({
            xtype: 'component',
            tpl: Ext.create('Ext.XTemplate',
                '<tpl><div class="body">',
                '<div class="title"><b>{feature.FormattedID} - {feature.Name}</b></div>',
                '<div class="message">{[this.getStatusMessage(values.seriesData)]}</div>',
                '<div>Release Start Date: {[this.formatDate(values.feature.Release.ReleaseStartDate)]}</div>',
                '<div>Release End Date: {[this.formatDate(values.feature.Release.ReleaseDate)]}</div>',
                '<div>Feature Planned Start Date: {[this.formatDate(values.feature.PlannedStartDate)]}</div>',
                '<div>Feature Planned End Date: {[this.formatDate(values.feature.PlannedEndDate)]}</div>',
                '<div>{[this.getForecast(values.seriesData)]}</div>',
                '</div>',
                '</tpl>', {
                    formatDate: function (date) {
                        return (date && Rally.util.DateTime.format(Rally.util.DateTime.fromIsoString(date), 'm/d/Y')) || '-';
                    },
                    getStatusMessage: function(seriesData) {
                        if(seriesData.actual[1] < seriesData.expected[1]) {
                            return 'Late! :-(';
                        } else if (seriesData.actual[1] > seriesData.expected[1]) {
                            return 'Early! :-0';
                        } else {
                            return 'On Schedule. :-)'
                        }
                        return '';
                    },
                    getForecast: function(seriesData) {
                        if(this.getStatusMessage(seriesData).toLowerCase().indexOf('late') >= 0) {
                            return 'Feature Forecast End Date: ' + this.formatDate(Rally.util.DateTime.add(new Date(), 'day', seriesData.forecast));
                        }
                        return '';
                    }
                }),
            data: {feature: this.getRecord().data, seriesData: this.getSeriesData() }
        });
    }
});