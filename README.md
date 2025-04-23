[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/k1NQx2BL)
[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=19252848)

# P2: Visualizing Political Leaders

This project implements an interactive visualization of political leaders data using D3.js, featuring three linked views:

1. **Lexis Chart**: Displays the age of political leaders and their time in office using arrows
2. **Bar Chart**: Shows the distribution of female and male politicians
3. **Scatter Plot**: Visualizes the relationship between age when elected and GDP per capita

## Features

### Global Filtering
- Filter data by country groups (OECD, EU27, BRICS, G7, G20)
- Gender-based filtering through bar chart interaction

### Lexis Chart
- Arrows represent politicians with start/end points based on year and age
- Highlighted arrows for significant leaders with rotated text labels
- Interactive selection and tooltips
- Four arrow styles: default, highlighted, selected, and hovered

### Bar Chart
- Shows count of politicians by gender
- Acts as an interactive filter for the other views
- Maintains selections across filter changes when appropriate

### Scatter Plot
- Plots politicians by age (y-axis) and GDP per capita (x-axis)
- Filtered to show only data points with available GDP information
- Maintains opacity-based filtering for inactive points
- Interactive selection connected with the Lexis chart

### Connected Views
- Bidirectional linking: selections in one view reflect in others
- Consistent visual styling for selections across views
- Gender filtering affects both Lexis chart and scatter plot

## Implementation Details

The visualization uses the D3.js v6 library with a class-based architecture:

- **main.js**: Central data loading, state management, and view initialization
- **lexisChart.js**: Implementation of the Lexis chart with arrow styling and interactions
- **barChart.js**: Bar chart with aggregation using D3's rollups
- **scatterPlot.js**: Scatter plot with dynamic domain scaling for GDP values

## External Resources

- **D3.js v6**: Used for data visualization and DOM manipulation
- **D3 arrow markers**: Used for styling the arrow ends in the Lexis chart, based on [this Observable notebook](https://observablehq.com/@stvkas/interacting-with-marker-ends) by Steve Kasica

## Known Limitations

- The tooltip positions might need adjustment on different screen sizes
- Large datasets can cause performance issues with many arrows in the Lexis chart
- GDP data is not available for all politicians, limiting the scatter plot points

## Changes Made

Implemented the complete visualization according to the assignment requirements:
- Created three interlinked views with proper interactions
- Applied consistent styling and transitions
- Ensured proper filtering and selection management
- Positioned labels and tooltips for optimal readability
