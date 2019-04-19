queue()
    .defer(d3.json, "/GunViolence/AllData")
    .defer(d3.json, "static/geojson/us-states.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson, statesJson) {

	//Clean projectsJson data
	var gunViolenceProjects = projectsJson;
	var dateFormat = d3.time.format("%m/%d/%Y");
	gunViolenceProjects.forEach(function(d) {
    console.log(d["date"]);
		d["date"] = dateFormat.parse(d["date"]);
      console.log(d["date"]);
		d["date"].setDate(1);
		d["n_killed"] = +d["n_killed"];
		d["n_injured"] = +d["n_injured"];
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(gunViolenceProjects);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["date"]; });
	//var resourceTypeDim = ndx.dimension(function(d) { return d["resource_type"]; });
	//var povertyLevelDim = ndx.dimension(function(d) { return d["poverty_level"]; });
	var stateDim = ndx.dimension(function(d) { return d["state"]; });
	//var totalDonationsDim  = ndx.dimension(function(d) { return d["total_donations"]; });
  var totalKilledDim  = ndx.dimension(function(d) { return d["n_killed"]; });
  var totalInjuredDim = ndx.dimension(function(d) { return d["n_injured"]; });

	//Calculate metrics
	var numProjectsByDate = dateDim.group();
	//var numProjectsByResourceType = resourceTypeDim.group();
	//var numProjectsByPovertyLevel = povertyLevelDim.group();
	var totalKilledByState = stateDim.group().reduceSum(function(d) {
		return d["n_killed"];
	//var totalInjuredByState = stateDim.group().reduceSum(function(d) {
		//return d["n_injured"];
	});

	var all = ndx.groupAll();
	//var totalDonations = ndx.groupAll().reduceSum(function(d) {return d["total_donations"];});
  var totalKilled = ndx.groupAll().reduceSum(function(d) {return d["n_killed"];});
  var totalInjured = ndx.groupAll().reduceSum(function(d) {return d["n_injured"];});
	var max_state = totalKilledByState.top(1)[0].value;
    //var max_state = totalInjuredByState.top(1)[0].value;

	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["date"];
	var maxDate = dateDim.top(1)[0]["date"];

    //Charts
	var timeChart = dc.barChart("#time-chart");
	//var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
	//var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
	var usChart = dc.geoChoroplethChart("#us-chart");
	//var numberProjectsND = dc.numberDisplay("#number-projects-nd");
	var totalKilledND = dc.numberDisplay("#total-kills-nd");
	var totalInjuredNd = dc.numberDisplay("#total-injured-nd")

//	numberProjectsND
//		.formatNumber(d3.format("d"))
//		.valueAccessor(function(d){return d; })
//		.group(all);

    totalInjuredNd
        .formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(totalInjured)
		//.formatNumber(d3.format(".3s"));


	totalKilledND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(totalKilled)
		//.formatNumber(d3.format(".3s"));

	timeChart
		.width(600)
		.height(160)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(dateDim)
		.group(numProjectsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.xAxisLabel("Year")
		.yAxis().ticks(4);

	//resourceTypeChart
  //      .width(300)
  //      .height(250)
  //      .dimension(resourceTypeDim)
  //      .group(numProjectsByResourceType)
  //      .xAxis().ticks(4);

	//povertyLevelChart
	//	.width(300)
	//	.height(250)
  //      .dimension(povertyLevelDim)
  //      .group(numProjectsByPovertyLevel)
  //      .xAxis().ticks(4);


	usChart.width(1000)
		.height(330)
		.dimension(stateDim)
		.group(totalKilledByState)
		.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
		.colorDomain([0, max_state])
		.overlayGeoJson(statesJson["features"], "state", function (d) {
			return d.properties.name;
		})
		.projection(d3.geo.albersUsa()
    				.scale(600)
    				.translate([340, 150]))
		.title(function (p) {
			return "State: " + p["key"]
					+ "\n"
					+ "Total Killed: " + p["value"];
		})

    dc.renderAll();
};
