class LexisChart {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   */
  constructor(_config, _state) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 1000,
      containerHeight: 380,
      margin: {
        top: 30,
        right: 15,
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

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Apply clipping mask to 'vis.chart' to clip arrows
    vis.chart = vis.chartArea.append('g')
      .attr('clip-path', 'url(#chart-mask)');

    // Initialize clipping mask that covers the whole chart
    vis.chart.append('defs')
      .append('clipPath')
      .attr('id', 'chart-mask')
      .append('rect')
      .attr('width', vis.config.width + 5)
      .attr('y', -vis.config.margin.top)
      .attr('height', vis.config.height);

    // Helper function to create the arrows and styles for our various arrow heads
    vis.createMarkerEnds();

    // Initialize scales
    vis.xScale = d3.scaleLinear()
      .domain([1950, 2021])
      .range([0, vis.config.width]);

    vis.yScale = d3.scaleLinear()
      .domain([25, 95])
      .range([vis.config.height, 0]);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale)
      .tickFormat(d3.format('d'));

    vis.yAxis = d3.axisLeft(vis.yScale);

    // Append x-axis group
    vis.xAxisG = vis.chartArea.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${vis.config.height})`);

    // Append y-axis group
    vis.yAxisG = vis.chartArea.append('g')
      .attr('class', 'axis y-axis');

    // Add y-axis label
    vis.chartArea.append('text')
      .attr('class', 'axis-title')
      .attr('y', -15)
      .attr('x', 0)
      .text('Age');

    // Add title to the chart
    vis.chartArea.append('text')
      .attr('class', 'chart-title')
      .attr('y', -15)
      .attr('x', vis.config.width / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Political Leaders: Age and Time in Office');

    // Initialize tooltip
    vis.tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip');
  }

  updateVis() {
    let vis = this;
    // Update the visualizations
    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Update axes
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);

    // Data join for arrows
    const arrows = vis.chart.selectAll('.arrow')
      .data(vis.data, d => d.id);

    // Remove old elements
    arrows.exit().remove();

    // Create new elements
    const arrowsEnter = arrows.enter()
      .append('line')
      .attr('class', 'arrow')
      .attr('x1', d => vis.xScale(d.start_year))
      .attr('y1', d => vis.yScale(d.start_age))
      .attr('x2', d => vis.xScale(d.end_year))
      .attr('y2', d => vis.yScale(d.end_age))
      .classed('arrow-highlighted', d => d.label === 1)
      .classed('default-arrow', true);

    // Add event listeners for arrows
    arrowsEnter
      .on('mouseover', (event, d) => {
        // Set hover style
        d3.select(event.target)
          .classed('hovered-arrow', true)
          .classed('default-arrow', false);

        // Calculate position for tooltip - center above the arrow
        const x1 = vis.xScale(d.start_year);
        const y1 = vis.yScale(d.start_age);
        const x2 = vis.xScale(d.end_year);
        const y2 = vis.yScale(d.end_age);
        
        // Use midpoint of the arrow for tooltip positioning
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        // Convert to page coordinates
        const svgRect = vis.svg.node().getBoundingClientRect();
        const tooltipX = svgRect.left + vis.config.margin.left + midX;
        const tooltipY = svgRect.top + vis.config.margin.top + midY - 10; // Position above arrow

        // Show tooltip
        vis.tooltip
          .classed('show', true)
          .style('left', tooltipX + 'px')
          .style('top', tooltipY + 'px')
          .html(`
            <div>
              <strong>${d.leader}</strong> (${d.country})<br>
              <strong>In Office:</strong> ${d.start_year} - ${d.end_year}<br>
              <strong>Age when took office:</strong> ${d.start_age}<br>
              <strong>Duration:</strong> ${d.duration} years<br>
              <strong>GDP per capita:</strong> ${d.pcgdp !== null ? '$' + d.pcgdp.toLocaleString(undefined, {maximumFractionDigits: 2}) : 'Not available'}
            </div>
          `);
      })
      .on('mouseout', (event, d) => {
        // Reset hover style
        d3.select(event.target)
          .classed('hovered-arrow', false)
          .classed('default-arrow', true);

        // Hide tooltip
        vis.tooltip.classed('show', false);
      })
      .on('click', (event, d) => {
        // Toggle selection
        const isSelected = vis.state.selectedLeaders.has(d.id);
        
        if (isSelected) {
          vis.state.selectedLeaders.delete(d.id);
        } else {
          vis.state.selectedLeaders.add(d.id);
        }
        
        // Update arrow styles
        vis.updateSelections();
        
        // Update the other visualizations
        window.scatterPlot.updateVis();
        window.scatterPlot.updateSelections();
      });

    // Merge enter and update selections
    const arrowsMerged = arrowsEnter.merge(arrows);

    // Update arrow positions in case data changed
    arrowsMerged
      .attr('x1', d => vis.xScale(d.start_year))
      .attr('y1', d => vis.yScale(d.start_age))
      .attr('x2', d => vis.xScale(d.end_year))
      .attr('y2', d => vis.yScale(d.end_age));

    // Add highlight labels
    vis.renderLabels();
    
    // Update selections based on the state
    vis.updateSelections();
  }

  renderLabels() {
    let vis = this;
    
    // Remove existing labels
    vis.chartArea.selectAll('.arrow-label').remove();
    
    // Filter data to only highlighted or selected leaders
    // Only include arrows with d.label === 1 (pre-highlighted) or in the selectedLeaders set
    const labelledLeaders = vis.data.filter(d => 
      d.label === 1 || vis.state.selectedLeaders.has(d.id)
    );
    
    // Add labels
    vis.chartArea.selectAll('.arrow-label')
      .data(labelledLeaders, d => d.id)
      .enter()
      .append('text')
      .attr('class', 'arrow-label')
      .each(function(d) {
        // Calculate position for the label
        const x1 = vis.xScale(d.start_year);
        const y1 = vis.yScale(d.start_age);
        const x2 = vis.xScale(d.end_year);
        const y2 = vis.yScale(d.end_age);
        
        // Calculate the midpoint of the arrow for label placement
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        // Set position - match orientation of the arrow but position above it
        // The -8 offset places the text above the arrow consistently
        d3.select(this)
          .attr('x', midX)
          .attr('y', midY)
          .attr('text-anchor', 'middle')
          .attr('dy', -8)
          // Fixed angle for all labels - this looks most consistent with the example
          .attr('transform', `rotate(-20, ${midX}, ${midY})`);
      })
      .text(d => d.leader);
  }

  updateSelections() {
    let vis = this;
    
    // Update arrow selection styles
    vis.chart.selectAll('.arrow')
      .classed('arrow-selected', d => vis.state.selectedLeaders.has(d.id))
      .classed('selected-arrow', d => vis.state.selectedLeaders.has(d.id))
      .classed('highlighted-arrow', d => d.label === 1 && !vis.state.selectedLeaders.has(d.id))
      .classed('default-arrow', d => !vis.state.selectedLeaders.has(d.id) && d.label !== 1);
  }

  /**
   * Create all of the different arrow heads.
   * Styles: default, hover, highlight, highlight-selected
   * To switch between these styles you can switch between the CSS class.
   * We populated an example css class with how to use the marker-end attribute.
   * See link for more info.
   * https://observablehq.com/@stvkas/interacting-with-marker-ends
   */
  createMarkerEnds() {
    let vis = this;
    // Default arrow head
    // id: arrow-head
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#ddd')
      .attr('fill', 'none');

    // Hovered arrow head
    // id: arrow-head-hovered
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head-hovered')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#888')
      .attr('fill', 'none');

    // Highlight arrow head
    // id: arrow-head-highlighted
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head-highlighted')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#aeaeca')
      .attr('fill', 'none');

    // Highlighted-selected arrow head
    // id: arrow-head-highlighted-selected
    vis.chart.append('defs').append('marker')
      .attr('id', 'arrow-head-highlighted-selected')
      .attr('markerUnits', 'strokeWidth')
      .attr('refX', '2')
      .attr('refY', '2')
      .attr('markerWidth', '10')
      .attr('markerHeight', '10')
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L2,2 L 0,4')
      .attr('stroke', '#e89f03')
      .attr('fill', 'none');
  }
}
