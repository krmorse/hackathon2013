Ext.define('Yahoo.app.FeaturePopover', {
    extend: 'Rally.ui.popover.Popover',
    cls: 'feature-popover',

    placement: 'top',

    config: {
        record: undefined
    },

    initComponent: function() {
        this.callParent(arguments);

        this.add({
            xtype: 'component',
            tpl: Ext.create('Ext.XTemplate',
            '<tpl>' +
                '<div>Release Start Date: {[Rally.util.DateTime.fromIsoString(values.Release.ReleaseStartDate)]}</div>' +
            '</tpl>', {

                }),
            data: this.getRecord().data
        });
    }
});