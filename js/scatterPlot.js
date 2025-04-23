class ScatterPlot {

  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   */
  constructor(_config, _state) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 720,
      containerHeight: 260,
      margin: {
        top: 30,
        right: 20,
        bottom: 30,
        left: 40
      }
    }
    this.state = _state;
    this.data = _state.data;
    this.filteredGender = null;
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
    vis.xScale = d3.scaleLinear()
      .range([0, vis.config.width]);

    vis.yScale = d3.scaleLinear()
      .domain([25, 95])
      .range([vis.config.height, 0]);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale)
      .tickFormat(d => `$${d}`);

    vis.yAxis = d3.axisLeft(vis.yScale);

    // Append x-axis group
    vis.xAxisG = vis.chartArea.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${vis.config.height})`);

    // Append y-axis group
    vis.yAxisG = vis.chartArea.append('g')
      .attr('class', 'axis y-axis');

    // Add grid lines
    vis.xGrid = vis.chartArea.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${vis.config.height})`);

    vis.yGrid = vis.chartArea.append('g')
      .attr('class', 'grid');

    // Add axis labels
    vis.chartArea.append('text')
      .attr('class', 'axis-title')
      .attr('y', -15)
      .attr('x', 0)
      .text('Age');

    vis.chartArea.append('text')
      .attr('class', 'axis-title')
      .attr('x', vis.config.width)
      .attr('y', vis.config.height + 28)
      .attr('text-anchor', 'end')
      .text('GDP per Capita (US$)');

    // Add chart title
    vis.chartArea.append('text')
      .attr('class', 'chart-title')
      .attr('y', -15)
      .attr('x', vis.config.width / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Age vs. GDP per Capita');

    // Initialize tooltip
    vis.tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip');

    // Add background rect for clearing selection
    vis.chartArea.append('rect')
      .attr('class', 'clear-selection-area')
      .attr('width', vis.config.width)
      .attr('height', vis.config.height)
      .attr('fill', 'transparent')
      .on('click', () => {
        // Clear selection only when clicking on the background
        vis.state.selectedLeaders.clear();
        
        // Update visualizations
        window.lexisChart.updateVis();
        vis.updateVis();
      });
  }

  updateVis() {
    let vis = this;

    // Filter data where pcgdp is not null
    vis.filteredData = vis.data.filter(d => d.pcgdp !== null);

    // Update scales
    const domainPadding = (d3.max(vis.filteredData, d => d.pcgdp) - d3.min(vis.filteredData, d => d.pcgdp)) * 0.05;
    vis.xScale.domain([
      d3.min(vis.filteredData, d => d.pcgdp) - domainPadding,
      d3.max(vis.filteredData, d => d.pcgdp) + domainPadding
    ]);

    // Update grid lines
    vis.xGrid.call(d3.axisBottom(vis.xScale)
      .tickSize(-vis.config.height)
      .tickFormat(''));

    vis.yGrid.call(d3.axisLeft(vis.yScale)
      .tickSize(-vis.config.width)
      .tickFormat(''));
    
    // Render visualization
    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Update axes
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);

    // For proper layering, make sure the background is at the bottom
    vis.chartArea.select('.clear-selection-area').lower();

    // Data join for points
    const points = vis.chartArea.selectAll('.point')
      .data(vis.filteredData, d => d.id);

    // Remove old elements
    points.exit().remove();

    // Create new elements
    const pointsEnter = points.enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => vis.xScale(d.pcgdp))
      .attr('cy', d => vis.yScale(d.start_age))
      .attr('r', 5);

    // Add event listeners
    pointsEnter
      .on('mouseover', (event, d) => {
        // Only add hover effect if point is not inactive
        if (!vis.filteredGender || d.gender === vis.filteredGender) {
          d3.select(event.target)
            .attr('stroke', '#333')
            .attr('stroke-width', 1);

          // Show tooltip
          vis.tooltip
            .classed('show', true)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 15) + 'px')
            .html(`
              <div>
                <strong>${d.leader}</strong> (${d.country})<br>
                <strong>In Office:</strong> ${d.start_year} - ${d.end_year}<br>
                <strong>Age when took office:</strong> ${d.start_age}<br>
                <strong>Duration:</strong> ${d.duration} years<br>
                <strong>GDP per capita:</strong> $${d.pcgdp.toFixed(2)}
              </div>
            `);
        }
      })
      .on('mouseout', (event, d) => {
        // Only add hover effect if point is not inactive
        if (!vis.filteredGender || d.gender === vis.filteredGender) {
          // Keep stroke if selected
          if (!vis.state.selectedLeaders.has(d.id)) {
            d3.select(event.target)
              .attr('stroke', 'none');
          }

          // Hide tooltip
          vis.tooltip.classed('show', false);
        }
      })
      .on('click', (event, d) => {
        // Only allow interaction for active points
        if (!vis.filteredGender || d.gender === vis.filteredGender) {
          event.stopPropagation();
          
          // Toggle selection
          if (vis.state.selectedLeaders.has(d.id)) {
            vis.state.selectedLeaders.delete(d.id);
          } else {
            vis.state.selectedLeaders.add(d.id);
          }
          
          // Update visualizations
          window.lexisChart.updateVis();
          vis.updateSelections();
        }
      });

    // Merge enter and update selections
    const pointsMerged = pointsEnter.merge(points);

    // Update all points
    pointsMerged
      .attr('cx', d => vis.xScale(d.pcgdp))
      .attr('cy', d => vis.yScale(d.start_age))
      .attr('r', 5)
      .classed('inactive', d => vis.filteredGender && d.gender !== vis.filteredGender)
      .classed('selected', d => vis.state.selectedLeaders.has(d.id));
      
    // Additional selection updates
    vis.updateSelections();
  }
  
  updateSelections() {
    let vis = this;
    
    // Update point selection styles
    vis.chartArea.selectAll('.point')
      .classed('selected', d => vis.state.selectedLeaders.has(d.id))
      .attr('stroke', d => vis.state.selectedLeaders.has(d.id) ? '#333' : 'none')
      .attr('stroke-width', d => vis.state.selectedLeaders.has(d.id) ? 1 : 0);
  }
}
