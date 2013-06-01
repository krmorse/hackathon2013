Ext
		.define(
				'Yahoo.app.FeatureCompleteness',
				{
					extend : 'Rally.app.TimeboxScopedApp',
					requires : [ 'Yahoo.app.FeatureCompletenessCalculator',
							'Yahoo.app.PSIBurnUpCalculator' ],
					componentCls : 'app',

					scopeType : 'release',

					addContent : function(scope) {
						this._getFeaturesForCurrentRelease(scope);
						this._drawPSICompletenessChart();
					},

					onScopeChange : function(scope) {
						this._getFeaturesForCurrentRelease(scope);
						this._drawPSICompletenessChart();			
					},
					
					_getFeaturesForCurrentRelease : function(scope) {
						
						Ext.create('Rally.data.WsapiDataStore', {
							model : 'PortfolioItem/FEATURE',
							autoLoad : true,
							fetch : false,
							filters : [ scope.getQueryFilter() ],
							listeners : {
								load :function(store, data, success) {
									
									var featureOIDList = [];
									
									store.each(function(record) {
										
										//console.log("Feature OID: " + record.get("ObjectID") + " for feature: "+ record.get("Name") );
										featureOIDList.push(Rally.util.Ref.getOidFromRef(record.get("_ref"))); 
									});
									
									this._drawPSIBurnUpChart(featureOIDList);
									
								}, 
								scope : this
							}
						});
						
						
						
					},
					
					_drawPSICompletenessChart : function() {
						if (this.chart) {
							this.chart.destroy();
						}

						this.chart = this
								.add({
									xtype : 'rallychart',
									
									_haveDataToRender: function () {return true; // HACK
							        },

									storeType : 'Rally.data.WsapiDataStore',
									storeConfig : {
										model : 'PortfolioItemFeature',
										context : this.getContext()
												.getDataContext(),
										filters : [ this.getContext()
												.getTimeboxScope()
												.getQueryFilter() ],
										sorters : [ {
											property : 'Rank',
											direction : 'DSC'
										} ],
										pageSize : 2,
										fetch : [
												'PlannedStartDate',
												'PlannedEndDate',
												'LeafStoryPlanEstimateTotal',
												'AcceptedLeafStoryPlanEstimateTotal',
												'Name', 'Release',
												'ReleaseDate',
												'ReleaseStartDate' ]
							            //,limit: 15
									},

									calculatorType : 'Yahoo.app.FeatureCompletenessCalculator',
									calculatorConfig : {},

									chartConfig : this._getPSICompletenessChartConfig()
								});
					},

					
					_getPSICompletenessChartConfig : function() {
						var me = this;
						return {
							chart : {
								type: 'columnrange',
								inverted: true
							},
							title : {
								text : 'PSI Completeness Report'
							},
							xAxis : {
								title : {
									text : null
								}
							},
							yAxis : {
								min : 0,
//								max : 100,
								plotLines : [ { 
									value: (function() {
										
										var todayDate = new Date();
										var releaseStart = me.getContext().getTimeboxScope().getRecord().get('ReleaseStartDate');
										var releaseEnd = me.getContext().getTimeboxScope().getRecord().get('ReleaseDate');
										
										if ( (releaseEnd >= todayDate) && (todayDate >= releaseStart)) { 
							            	return Rally.util.DateTime.getDifference(todayDate, releaseStart, 'day');
							            } 
										
									})(),
									width: 2, 
									color: "red", 
									zIndex: 100 } ],
								endOnTick: true,
								startOnTick: true,
								tickInterval: 7,
								title : {
									text : null
								},
								labels : {
									overflow : 'justify',
									formatter : function() {
										var displayDate = Rally.util.DateTime.add(me.getContext().getTimeboxScope().getRecord().get('ReleaseStartDate'), "day", this.value);
										return Rally.util.DateTime.format(displayDate, 'm/d/Y');
									}
								}
							},
							tooltip : {
								//valueSuffix : ' %',
								formatter : function() {
									//debugger;
									var displayDateForLeftValue = Rally.util.DateTime.add(me.getContext().getTimeboxScope().getRecord().get('ReleaseStartDate'), "day", this.point.low);
									var leftSide = Rally.util.DateTime.format(displayDateForLeftValue, 'm/d/Y');
									var displayDateForRightValue = Rally.util.DateTime.add(me.getContext().getTimeboxScope().getRecord().get('ReleaseStartDate'), "day", this.point.high);
									var rightSide = Rally.util.DateTime.format(displayDateForRightValue, 'm/d/Y');									
									return "<b>" + this.x + "</b><br />" + this.point.series.name + "<br />" + "Range date: " + leftSide + " - " + rightSide;								
								}
								
							},
//	OLD						plotOptions : {
//								bar : {
//									dataLabels : {
//										enabled : false
//									}
//								}
//							},
							plotOptions: {
//						        columnrange: {
//						        	dataLabels: {
//						        		enabled: true,
//						        		formatter: function () {
//						        			return this.y ;
//						        		}
//						        	}
//						        }
						    },
							legend : {
								layout : 'vertical',
								align : 'right',
								verticalAlign : 'top',
								x : -100,
								y : 100,
								floating : true,
								borderWidth : 1,
								backgroundColor : '#FFFFFF',
								shadow : true,
								reversed : true
							}
						};
					},
					
					_drawPSIBurnUpChart : function(featureOIDList) {

						if (this.psiBurnUpchart) {
							this.psiBurnUpchart.destroy();
						}

						this.psiBurnUpchart = this.add({
							xtype : 'rallychart',

							storeType : 'Rally.data.lookback.SnapshotStore',
							storeConfig : {
								find : {
									_TypeHierarchy : 'HierarchicalRequirement',
									_ItemHierarchy : {$in: featureOIDList},
									Children : null,
									_ValidFrom: {$gte: Rally.util.DateTime.toIsoString(this.getContext().getTimeboxScope().getRecord().get('ReleaseStartDate'))}
								},
								fetch : [ 'ScheduleState', 'PlanEstimate' ],
								hydrate : [ 'ScheduleState' ]
							},

							calculatorType : 'Yahoo.app.PSIBurnUpCalculator',
							calculatorConfig : {},

							chartConfig : this._getPSIBurnUpConfig()
						});

					},

					_getPSIBurnUpConfig : function() {
						return {
							chart : {
								type : 'column'
							},
							title : {
								text : 'PSI Tracking Burnup Chart'
							},
							// subtitle: {
							// text: 'Source: WorldClimate.com'
							// },
							xAxis : {
								tickInterval: 7
							},
							yAxis : {
								min : 0,
								title : {
									text : 'Stories (points)'
								}
							}
//							tooltip : {
//								headerFormat : '<span style="font-size:10px">{point.key}</span><table>',
//								pointFormat : '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' + '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
//								footerFormat : '</table>',
//								shared : true,
//								useHTML : true
//							},
//							plotOptions : {
//								column : {
//									pointPadding : 0.2,
//									borderWidth : 0
//								}
//							}
						};

					}

});
