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
                '<tpl>',
                   '<div class="body">',
                        '<div class="title"><b>{feature.FormattedID} - {feature.Name}</b></div>',
                        '<div>Release: {[this.formatDate(values.feature.Release.ReleaseStartDate)]} - {[this.formatDate(values.feature.Release.ReleaseDate)]}</div>',
                        '<div>Feature Plan: {[this.formatDate(values.feature.PlannedStartDate)]} - {[this.formatDate(values.feature.PlannedEndDate)]}</div>',
                        '<div class="message">{[this.getStatusMessage(values.seriesData)]}</div>',
                    '</div>',
                '</tpl>', {
                    formatDate: function (date) {
                        return (date && Rally.util.DateTime.format(Rally.util.DateTime.fromIsoString(date), 'm/d/Y')) || '';
                    },
                    getStatusMessage: function(seriesData) {
                        if(seriesData.actual[1] < seriesData.expected[1]) {
                            var forecast = Rally.util.DateTime.add(new Date(), 'day', seriesData.forecast);
                            var releaseEndDate = Rally.util.DateTime.fromIsoString(seriesData.record.get('Release').ReleaseDate);
                            var status = forecast < releaseEndDate ? '<div class="behind">Your feature is behind.' :
                                '<div class="late">Your feature won\'t make it into the PSI';
                            return status + '<div class="forecast">Forecast End:' + Rally.util.DateTime.format(forecast, 'm/d/Y') + '</div></div>';
                        } else if (seriesData.actual[1] > seriesData.expected[1]) {
                            return 'Your feature is ahead of schedule.';
                        } else {
                            return 'Your feature is on schedule.'
                        }
                    }
                }),
            data: {feature: this.getRecord().data, seriesData: this.getSeriesData() }
        });
    }
});