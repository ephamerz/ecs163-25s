// Appropriate margins for fitting the window
const scatterMargin = {top: 40, right: 20, bottom: 60, left: 60};
const pieMargin = {top: 40, right: 20, bottom: 20, left: 20};
const sankeyMargin = {top: 300, right: 20, bottom: 20, left: 60};

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

// Custom bar chart dimension
const barWidth = 600 - scatterMargin.left - scatterMargin.right;
const barHeight = 250 - scatterMargin.top - scatterMargin.bottom;

// Custom pie chart dimension
const pieWidth = 350 - pieMargin.left - pieMargin.right;
const pieHeight = 350 - pieMargin.top - pieMargin.bottom;

// Custom Sankey diagram dimension
const sankeyWidth = 700 - sankeyMargin.left - sankeyMargin.right;
const sankeyHeight = 250;

// Graph positions 
const barChartLeft = scatterMargin.left;
const barChartTop = scatterMargin.top;
// Adding custom dimensions and spacing between bar and pie
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

// Tooltip text for a hovering legend
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

// Describing the experience level abbreviations
const experienceDescriptions = {
    "SE": "Senior Level",
    "EX": "Executive Level",
    "MI": "Mid Level",
    "EN": "Entry Level"
};

// Gathering the data for USD salaries column
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

// Formatting the axes by appending x-axis/y-axis to the bars
barGroup.append("g")
    .attr("transform", `translate(0, ${barHeight})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("y", 10)
    .attr("x", -5)
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-40)");

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
    .on("mouseover", function(event, d) {  // Creating a hover effect that will display avg. salary of that bar
        tooltip.style("opacity", 1);
        tooltip.html(`${experienceDescriptions[d.experience_level]}<br>Average Salary: $${d.avg_salary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
        tooltip.style("opacity", 0);
    });

// Title for the bar chart
    barGroup.append("text")
    .attr("x", barWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("class", "title")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Average Salary by Experience Level");

// 2: PIE CHART

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
    // Setting colors up for visibility differences
    const color = d3.scaleOrdinal()
        .domain(companySizeArray.map(d => d.company_size))
        .range(["#FF6347", "#4682B4", "#32CD32"]);
    // Grouping the slices of the pie
    const arcs = pieGroup.selectAll(".arc")
        .data(pie(companySizeArray))
        .enter().append("g")
        .attr("class", "arc");
    // Appending the pie slices and assigning color
    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.company_size))
        .on("mouseover", function(event, d) {  // Hover tool for showing avg. salaries for company sizes
            tooltip.style("opacity", 1);
            tooltip.html(`Company Size: ${d.data.company_size}<br>Average Salary: $${d.data.avg_salary.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        });
    // Creating the text for company size averages
    arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .style("fill", "#fff")
        .style("font-weight", "bold")
        .text(d => `${d.data.company_size}`);

    // Pie chart title
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
    return "Other"; // Defaults to 'Other' group if there is no match
}

// Preparing the Sankey data with the grouped job titles
function prepareSankeyData(data) {
    const experienceLevels = Array.from(new Set(data.map(d => d.experience_level)));
    const companySizes = Array.from(new Set(data.map(d => d.company_size)));
    const groupedJobTitles = Array.from(new Set(data.map(d => mapJobTitle(d.job_title))));
    const nodes = experienceLevels.concat(groupedJobTitles).concat(companySizes).map(name => ({ name }));

    function nodeIndex(name) {
        return nodes.findIndex(n => n.name === name);
    }

    // Gathering counts for experience_level --> grouped_job_title
    const expToJobMap = d3.rollup(data,
        v => v.length,
        d => d.experience_level,
        d => mapJobTitle(d.job_title)
    );
    // A nested map into a flat array to create counts for the link
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

    // Gathering counts for grouped_job_title --> company_size
    const jobToCompMap = d3.rollup(data,
        v => v.length,
        d => mapJobTitle(d.job_title),
        d => d.company_size
    );
    // Nested map for the conversion
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
    // Creating the sankey with d3
    const sankey = d3.sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[0, 0], [sankeyWidth, sankeyHeight]]);

    const {nodes, links} = sankey(sankeyData);

// Drawing links (the flow line) into the Sankey, with specific gradients and strokes for readability
sankeyGroup.append("g")
  .attr("fill", "none")
  .attr("stroke-opacity", 0.5)
  .selectAll("path")
  .data(links)
  .join("path")
  .attr("d", d3.sankeyLinkHorizontal())
  .attr("stroke", d => d3.interpolateCool(d.value / d3.max(links, l => l.value)))
  .attr("stroke-width", d => Math.max(1, d.width))
  .on("mouseover", (event, d) => { // Hovering to show the count
    tooltip.style("opacity", 1)
      .html(`<strong>Link:</strong> ${d.source.name} → ${d.target.name}<br><strong>Count:</strong> ${d.value}`)
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", () => {
    tooltip.style("opacity", 0);
  });

// Drawing nodes (the categories) into the Sankey, specifying color of groups
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
    else if (d.name.includes("Manager") || d.name.includes("Engineer") || d.name.includes("Scientist")) return "#4682B4"; // Job titles blueish
    else return "#FF6347"; // Company sizes are red color
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

}).catch(error => console.log(error));
