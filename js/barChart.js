class BarChart {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   */
  constructor(_config, _state) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 240,
      containerHeight: 260,
      margin: {
        top: 30,
        right: 5,
        bottom: 20,
        left: 40
      }
    }
    this.state = _state;
    this.data = _state.data;
    this.initVis();
  }

  initVis() {
    let vis = this;

    // Calculate inner chart size
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Initialize scales
    vis.xScale = d3.scaleBand()
      .range([0, vis.config.width])
      .padding(0.1);

    vis.yScale = d3.scaleLinear()
      .range([vis.config.height, 0]);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale);

    // Append axes
    vis.xAxisG = vis.chartArea.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${vis.config.height})`);

    vis.yAxisG = vis.chartArea.append('g')
      .attr('class', 'axis y-axis');

    // Add y-axis grid lines
    vis.yGrid = vis.chartArea.append('g')
      .attr('class', 'grid');

    // Add y-axis label
    vis.chartArea.append('text')
      .attr('class', 'axis-title')
      .attr('y', -15)
      .attr('x', 0)
      .text('Gender');

    // Add chart title
    vis.chartArea.append('text')
      .attr('class', 'chart-title')
      .attr('y', -15)
      .attr('x', vis.config.width / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
  }

  updateVis() {
    let vis = this;

    // Aggregate data by gender
    const genderCounts = d3.rollups(
      vis.data,
      v => v.length,
      d => d.gender
    );

    // Convert to array of objects
    vis.aggregatedData = Array.from(genderCounts, ([gender, count]) => ({ gender, count }));
    
    // Update scales
    vis.xScale.domain(vis.aggregatedData.map(d => d.gender));
    vis.yScale.domain([0, d3.max(vis.aggregatedData, d => d.count)]);

    // Update grid lines
    vis.yGrid.call(d3.axisLeft(vis.yScale)
      .tickSize(-vis.config.width)
      .tickFormat(''));
    
    // Render the visualization
    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Update axes
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);

    // Data join for bars
    const bars = vis.chartArea.selectAll('.bar')
      .data(vis.aggregatedData, d => d.gender);

    // Remove old elements
    bars.exit().remove();

    // Create new elements
    const barsEnter = bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => vis.xScale(d.gender))
      .attr('width', vis.xScale.bandwidth());

    // Add event listeners
    barsEnter
      .on('mouseover', (event, d) => {
        d3.select(event.target)
          .attr('stroke-width', 1);
      })
      .on('mouseout', (event, d) => {
        d3.select(event.target)
          .attr('stroke-width', 0);
      })
      .on('click', (event, d) => {
        // Toggle gender filter
        if (vis.state.selectedGender === d.gender) {
          vis.state.selectedGender = null;
        } else {
          vis.state.selectedGender = d.gender;
        }
        
        // Update UI
        vis.chartArea.selectAll('.bar')
          .classed('selected', d => d.gender === vis.state.selectedGender);
          
        // Filter data and update other charts
        if (vis.state.selectedGender) {
          // Filter the data
          const filteredData = window.visState.data.filter(d => d.gender === vis.state.selectedGender);
          
          // Only keep selected leaders that have matching gender
          const selectedLeaders = new Set();
          for (const id of vis.state.selectedLeaders) {
            const leader = window.visState.data.find(d => d.id === id);
            if (leader && leader.gender === vis.state.selectedGender) {
              selectedLeaders.add(id);
            }
          }
          vis.state.selectedLeaders = selectedLeaders;
          
          // Update lexis chart with filtered data
          window.lexisChart.data = filteredData;
          window.lexisChart.updateVis();
          
          // Update scatter plot with filtered data but don't hide points
          window.scatterPlot.data = window.visState.data; // Keep all data but mark inactive
          window.scatterPlot.filteredGender = vis.state.selectedGender;
          window.scatterPlot.updateVis();
        } else {
          // Reset to show all data
          window.lexisChart.data = window.visState.data;
          window.lexisChart.updateVis();
          
          window.scatterPlot.data = window.visState.data;
          window.scatterPlot.filteredGender = null;
          window.scatterPlot.updateVis();
        }
      });

    // Merge enter and update selections
    const barsMerged = barsEnter.merge(bars);

    // Update all bars
    barsMerged
      .attr('x', d => vis.xScale(d.gender))
      .attr('y', d => vis.yScale(d.count))
      .attr('width', vis.xScale.bandwidth())
      .attr('height', d => vis.config.height - vis.yScale(d.count))
      .classed('selected', d => d.gender === vis.state.selectedGender);
  }
}
