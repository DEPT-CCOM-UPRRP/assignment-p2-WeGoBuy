/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/leaderlist.csv').then(data => {

  // Convert columns to numerical values
  data.forEach(d => {
    Object.keys(d).forEach(attr => {
      if (attr == 'pcgdp') {
        d[attr] = (d[attr] == 'NA') ? null : +d[attr];
      } else if (attr != 'country' && attr != 'leader' && attr != 'gender') {
        d[attr] = +d[attr];
      }
    });
  });

  data.sort((a,b) => a.label - b.label);

  // Filter data where duration > 0
  const filteredData = data.filter(d => d.duration > 0);

  // Initialize state for the visualization
  const state = {
    data: filteredData,
    selectedCountryGroup: 'oecd',
    selectedGender: null,
    selectedLeaders: new Set()
  };

  // Initialize visualizations
  const lexisChart = new LexisChart({ 
    parentElement: '#lexis-chart'
  }, state);

  const barChart = new BarChart({ 
    parentElement: '#bar-chart' 
  }, state);

  const scatterPlot = new ScatterPlot({ 
    parentElement: '#scatter-plot' 
  }, state);

  // Function to filter data based on selected country group
  function filterData() {
    state.data = filteredData.filter(d => d[state.selectedCountryGroup] === 1);
    if (state.selectedGender) {
      state.data = state.data.filter(d => d.gender === state.selectedGender);
    }
    
    // Clear selections when country filter changes
    state.selectedLeaders.clear();

    // Update all visualizations
    updateAllVisualizations();
  }

  // Function to update all visualizations
  function updateAllVisualizations() {
    lexisChart.data = state.data;
    lexisChart.updateVis();

    barChart.data = state.data;
    barChart.updateVis();
    
    scatterPlot.data = state.data;
    scatterPlot.updateVis();
  }

  // Initialize visualizations with filtered data
  filterData();

  // Add event listener to country selector dropdown
  d3.select('#country-selector').on('change', function() {
    state.selectedCountryGroup = this.value;
    state.selectedGender = null; // Reset gender selection
    filterData();
  });

  // Export the state and chart references for other components to use
  window.visState = state;
  window.lexisChart = lexisChart;
  window.barChart = barChart;
  window.scatterPlot = scatterPlot;
});
