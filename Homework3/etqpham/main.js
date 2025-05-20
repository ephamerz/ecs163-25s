// Margins for fitting graphs into window
const scatterMargin = {top: 40, right: 20, bottom: 60, left: 60};
const pieMargin = {top: 40, right: 20, bottom: 20, left: 20};
const sankeyMargin = {top: 300, right: 20, bottom: 20, left: 60};

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

// Custom bar chart dimensions
const barWidth = 600 - scatterMargin.left - scatterMargin.right;
const barHeight = 250 - scatterMargin.top - scatterMargin.bottom;

// Custom pie chart dimensions
const pieWidth = 350 - pieMargin.left - pieMargin.right;
const pieHeight = 350 - pieMargin.top - pieMargin.bottom;

// Custom Sankey diagram dimensions
const sankeyWidth = 700 - sankeyMargin.left - sankeyMargin.right;
const sankeyHeight = 250;

// Position of graphs
const barChartLeft = scatterMargin.left;
const barChartTop = scatterMargin.top;

// Adding a custom dimension and space between the bar and pie
const pieChartLeft = barChartLeft + barWidth + 80;
const pieChartTop = scatterMargin.top + pieHeight / 2.2;

const sankeyLeft = sankeyMargin.left;
const sankeyTop = sankeyMargin.top;

// Creating the main SVG container with specific dimensions, a "box" for graphs
const svg = d3.select("body")
  .append("svg")
  .attr("viewBox", `0 0 ${windowWidth} ${windowHeight}`)
  .attr("preserveAspectRatio", "xMidYMin meet")
  .style("width", "100vw")
  .style("height", "100vh")
  .style("border", "1px solid #ccc");

// Creating groups for each chart, transforms for each specific margin/position
const barGroup = svg.append("g")
  .attr("transform", `translate(${barChartLeft}, ${barChartTop})`);
const pieGroup = svg.append("g")
  .attr("transform", `translate(${pieChartLeft + pieWidth / 2}, ${pieChartTop})`);
const sankeyGroup = svg.append("g")
  .attr("transform", `translate(${sankeyLeft}, ${sankeyTop})`);

// Creating tooltip text for a hovering legend
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "#fff")
    .style("padding", "8px 12px")
    .style("border-radius", "8px")
    .style("pointer-events", "none")
    .style("font-size", "12px");

// Describing the experience level abbreviations for the bar chart 
const experienceDescriptions = {
    "SE": "Senior Level",
    "EX": "Executive Level",
    "MI": "Mid Level",
    "EN": "Entry Level"
};

// To keep track of selected bars in the bar chart for the selection interaction
const selected = new Set();

// Gathering the data for the USD salaries column
d3.csv("ds_salaries.csv").then(data => {
    data.forEach(d => {
        d.salary_in_usd = +d.salary_in_usd;
    });

    // 1: BAR CHART
    // Preparing the bar chart data
    const averageSalaries = d3.rollup(data,
        v => d3.mean(v, d => d.salary_in_usd),
        d => d.experience_level
    );

    // Processing and filtering salary data, computing averages
    const salaryData = Array.from(averageSalaries, ([experience_level, avg_salary]) => ({experience_level, avg_salary}));
    salaryData.sort((a, b) => a.avg_salary - b.avg_salary);

    // Creating band scale for x-axis for mapping experience levels to the bars
    const x = d3.scaleBand()
        .domain(salaryData.map(d => d.experience_level))
        .range([0, barWidth])
        .padding(0.3);

    // Creating linear scale for y-axis for mapping average salaries to bar heights
    const y = d3.scaleLinear()
        .domain([0, d3.max(salaryData, d => d.avg_salary)])
        .range([barHeight, 0])
        .nice();

    // Appending x-axis
    const xAxisGroup = barGroup.append("g")
        .attr("transform", `translate(0, ${barHeight})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("y", 10)
        .attr("x", -5)
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-40)");

    // Appending y-axis
    barGroup.append("g")
        .call(d3.axisLeft(y).tickFormat(d3.format(",.0f")));

    // Creating bars and specific styling for bars, filling with a color that is easy to look at
    barGroup.selectAll("rect")
        .data(salaryData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.experience_level))
        .attr("y", d => y(d.avg_salary))
        .attr("width", x.bandwidth())
        .attr("height", d => barHeight - y(d.avg_salary))
        .attr("fill", "#69b3a2")
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1);
            tooltip.html(`${experienceDescriptions[d.experience_level]}<br>Average Salary: $${d.avg_salary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        }) // Creating a hover effect to display Average Salaries
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        }) // Creating the selection interaction
        .on("click", function(event, d) {
            if (selected.has(d.experience_level)) {
                selected.delete(d.experience_level);
                d3.select(this).attr("fill", "#69b3a2");
            } else {
                selected.add(d.experience_level);
                d3.select(this).attr("fill", "#ff7f0e");
            }
            console.log("Selected experience levels:", Array.from(selected));
        });

    // Creating a title for the bar chart
    barGroup.append("text")
        .attr("x", barWidth / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("class", "title")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Average Salary by Experience Level");

    

// 2: PIE CHART WITH ZOOM TRANSITION

// Preparing and filtering pie chart data, salary in USD and company sizes
const companySizeData = d3.rollup(data,
    v => d3.mean(v, d => d.salary_in_usd),
    d => d.company_size
);

// Converting company sizes into array for processing
const companySizeArray = Array.from(companySizeData, ([company_size, avg_salary]) => ({company_size, avg_salary}));

// Creating pie format for the angles of the pie
const pie = d3.pie()
    .value(d => d.avg_salary)
    .sort(null);

// Specifying the inner arc to make inner "donut" hole
const arc = d3.arc()
    .innerRadius(50)
    .outerRadius(120);

const arcZoom = d3.arc()
    .innerRadius(40)
    .outerRadius(150);

// Setting colors up for visibility difference in pies
const color = d3.scaleOrdinal()
    .domain(companySizeArray.map(d => d.company_size))
    .range(["#FF6347", "#4682B4", "#32CD32"]);

// Grouping up the slices of the pie
const arcs = pieGroup.selectAll(".arc")
    .data(pie(companySizeArray))
    .enter().append("g")
    .attr("class", "arc");

arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.company_size))
    .on("click", function(event, d) {
    const path = d3.select(this);
    const isZoomed = path.classed("zoomed");

    d3.selectAll(".arc path").classed("zoomed", false).transition().duration(500).attr("d", arc);
    d3.selectAll(".arc text").text(d => d.data.company_size);
    infoBox.transition().duration(300).style("opacity", 0);
      // Creating the zoom effect for the view transition
    if (!isZoomed) {
    path.classed("zoomed", true)
        .transition()
        .duration(500)
        .attr("d", arcZoom);

    const total = d3.sum(companySizeArray, d => d.avg_salary);
    const percentage = ((d.data.avg_salary / total) * 100).toFixed(2);
    const avgSalaryFormatted = d.data.avg_salary.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    d3.select(this.parentNode).select("text")
        .text(d.data.company_size);

    // Making the text for the information box
    const infoString = `${d.data.company_size} (${percentage}%)\nAverage Salary:\n$${avgSalaryFormatted}`;
    infoText.text(infoString);

    // Creating the information boxes per slice of pie
    const lines = infoString.split("\n").length;
    const lineHeight = 16;  
    const padding = 20;     

    infoBox.select("rect")
        .attr("width", 250)  
        .attr("height", lines * lineHeight + padding);

    // Positioning the info box next to the slice outside the pie
    const [x, y] = arc.centroid(d);
    const offsetX = x > 0 ? 130 : -170;  
    infoBox.attr("transform", `translate(${x + offsetX},${y})`);

    infoBox.transition().duration(300).style("opacity", 1);
}

});

// Specifying for the info box
const infoBox = pieGroup.append("g")
  .attr("class", "info-box")
  .style("opacity", 0);
// Appending info box
infoBox.append("rect")
  .attr("width", 140)
  .attr("height", 60)
  .attr("fill", "#eee")
  .attr("stroke", "#999")
  .attr("rx", 6)
  .attr("ry", 6);
// Getting the text for the info box
const infoText = infoBox.append("text")
  .attr("x", 10)
  .attr("y", 20)
  .style("font-size", "12px")
  .style("fill", "#333")
  .style("white-space", "pre-line");

// Updating text boxes with information from slice
arcs.append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .style("fill", "#fff")
    .style("font-weight", "bold")
    .text(d => `${d.data.company_size}`);

// Creating the pie chart title
pieGroup.append("text")
    .attr("x", 0)
    .attr("y", -150)
    .attr("text-anchor", "middle")
    .attr("class", "title")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Average Salary by Company Size");

    // 3: SANKEY DIAGRAM 
// Grouping the job titles into groups, since there are too many similar job titles
// These are some basic names given by online research that group each job into a group
const jobTitleGroups = {
    "Engineer": ["Data Engineer", "Machine Learning Engineer", "Software Engineer", "ML Engineer", "Platform Engineer", "Backend Engineer", "Frontend Engineer"],
    "Analyst": ["Data Analyst", "Business Analyst", "Research Analyst", "Marketing Analyst"],
    "Scientist": ["Data Scientist", "ML Scientist", "Research Scientist", "AI Scientist"],
    "Manager": ["Engineering Manager", "Product Manager", "Project Manager", "Data Manager", "Analytics Manager"],
    "Consultant": ["Data Consultant", "Analytics Consultant", "Business Consultant"],
    "Other": ["Data Architect", "Statistician", "Quantitative Researcher", "BI Developer", "Data Specialist"]
};
// This function maps job titles to broader group title, checking if it contains the word
function mapJobTitle(title) {
    for (const [group, titles] of Object.entries(jobTitleGroups)) {
        if (titles.includes(title)) {
            return group;
        }
    }
    return "Other"; // Defaults to the 'Other' group if there is no match
}

// Preparing the Sankey data with the new grouped job titles
function prepareSankeyData(data) {
    const experienceLevels = Array.from(new Set(data.map(d => d.experience_level)));
    const companySizes = Array.from(new Set(data.map(d => d.company_size)));
    const groupedJobTitles = Array.from(new Set(data.map(d => mapJobTitle(d.job_title))));
    const nodes = experienceLevels.concat(groupedJobTitles).concat(companySizes).map(name => ({ name }));

    function nodeIndex(name) {
        return nodes.findIndex(n => n.name === name);
    }

    // Gathering the counts for experience_level -> grouped_job_title
    const expToJobMap = d3.rollup(data,
        v => v.length,
        d => d.experience_level,
        d => mapJobTitle(d.job_title)
    );
    // Creating an array to create the counts for the links (connections between nodes)
    const links1 = [];
    for (const [exp, jobMap] of expToJobMap) {
        for (const [job, count] of jobMap) {
            links1.push({
                source: nodeIndex(exp),
                target: nodeIndex(job),
                value: count
            });
        }
    }

    // Gathering the counts for grouped_job_title -> company_size
    const jobToCompMap = d3.rollup(data,
        v => v.length,
        d => mapJobTitle(d.job_title),
        d => d.company_size
    );
    // Creating an array to create the counts for the links in the second stage
    const links2 = [];
    for (const [job, compMap] of jobToCompMap) {
        for (const [comp, count] of compMap) {
            links2.push({
                source: nodeIndex(job),
                target: nodeIndex(comp),
                value: count
            });
        }
    }

    return {
        nodes,
        links: links1.concat(links2)
    };
}

    const sankeyData = prepareSankeyData(data);
    // Creating the sankey with d3 function 
    const sankey = d3.sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[0, 0], [sankeyWidth, sankeyHeight]]);

    const {nodes, links} = sankey(sankeyData);

// Drawing links into the Sankey, with specific gradients and strokes for readability
sankeyGroup.append("g")
  .attr("fill", "none")
  .attr("stroke-opacity", 0.5)
  .selectAll("path")
  .data(links)
  .join("path")
  .attr("d", d3.sankeyLinkHorizontal())
  .attr("stroke", d => d3.interpolateCool(d.value / d3.max(links, l => l.value)))
  .attr("stroke-width", d => Math.max(1, d.width))
  .on("mouseover", (event, d) => { // Hovering to show the total count for the connection link
    tooltip.style("opacity", 1)
      .html(`<strong>Link:</strong> ${d.source.name} → ${d.target.name}<br><strong>Count:</strong> ${d.value}`)
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", () => {
    tooltip.style("opacity", 0);
  });

// Drawing the nodes (categories) into the Sankey, specifying color of groups
const node = sankeyGroup.append("g")
  .attr("stroke", "#000")
  .selectAll("rect")
  .data(nodes)
  .join("rect")
  .attr("x", d => d.x0)
  .attr("y", d => d.y0)
  .attr("height", d => d.y1 - d.y0)
  .attr("width", d => d.x1 - d.x0)
  .attr("fill", d => {
    if (experienceDescriptions[d.name]) return "#69b3a2"; // Experience levels are green color
    else if (d.name.includes("Manager") || d.name.includes("Engineer") || d.name.includes("Scientist")) return "#4682B4"; // Job titles blue
    else return "#FF6347"; // Company sizes red
  })
  .on("mouseover", (event, d) => { // Hover effect to show the node names
    tooltip.style("opacity", 1)
      .html(`<strong>Node:</strong> ${d.name}`)
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", () => {
    tooltip.style("opacity", 0);
  });

  // Clarifying information for the link lines
  const link = sankeyGroup.append("g")
  .attr("fill", "none")
  .attr("stroke-opacity", 0.7)
  .selectAll("path")
  .data(links)
  .join("path")
  .attr("d", d3.sankeyLinkHorizontal())
  .attr("stroke", d => d3.interpolateCool(d.value / d3.max(links, l => l.value)))
  .attr("stroke-width", d => Math.max(1, d.width))
  .on("mouseover", (event, d) => {
    tooltip.style("opacity", 1)
      .html(`<strong>Link:</strong> ${d.source.name} → ${d.target.name}<br><strong>Count:</strong> ${d.value}`)
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", () => {
    tooltip.style("opacity", 0);
  });

// Labeling the nodes for reading
sankeyGroup.append("g")
  .selectAll("text")
  .data(nodes)
  .join("text")
  .attr("x", d => d.x0 < sankeyWidth / 2 ? d.x1 + 6 : d.x0 - 6)
  .attr("y", d => (d.y1 + d.y0) / 2)
  .attr("dy", "0.35em")
  .attr("text-anchor", d => d.x0 < sankeyWidth / 2 ? "start" : "end")
  .text(d => d.name)
  .style("font-size", "11px");

// Creating a title for the Sankey
sankeyGroup.append("text")
  .attr("x", sankeyWidth / 2)
  .attr("y", -20)
  .attr("text-anchor", "middle")
  .style("font-size", "20px")
  .style("font-weight", "bold")
  .text("Sankey Diagram: Experience Level --> Job Title Group --> Company Size");

  // Using the d3 brush function
const brush = d3.brush()
  .extent([[0, 0], [sankeyWidth, sankeyHeight]])
  .on("start brush end", brushed);

// Adding the brush group on top
sankeyGroup.append("g")
  .attr("class", "brush")
  .call(brush);

function brushed(event) {
  if (!event.selection) {
    node.classed("selected", false);
    node.classed("faded", false);
    link.classed("faded", false);
    return;
  }

  const [[x0, y0], [x1, y1]] = event.selection;

  // Selecting the nodes that are inside the brush axis
  node.classed("selected", d =>
    d.x0 < x1 && d.x1 > x0 && d.y0 < y1 && d.y1 > y0
  );

  const selectedNodes = new Set(node.filter(".selected").data().map(d => d.index));

  // Making the non-selected nodes lighter for readability
  node.classed("faded", d => !selectedNodes.has(d.index));
  
  // Making the non-selected links lighter for readability
  link.classed("faded", d =>
    !selectedNodes.has(d.source.index) && !selectedNodes.has(d.target.index)
  );
}

// Moving the brush to the back so that the hover overlay shows for count
sankeyGroup.select(".brush").lower();

}).catch(error => console.log(error));
