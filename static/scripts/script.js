let currentTransform = { k: 1, x: 0, y: 0 };
        let svg, g;

        document.getElementById('generate-btn').addEventListener('click', generateRoadmap);
        const loading = document.getElementById('loading');
        const schoolLoading = document.getElementById('schoolLoading');
        const hustleLoading = document.getElementById('hustleLoading');
        const mentalHealthLoading = document.getElementById('mentalHealthLoading');
        // Toggle between views
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const view = this.getAttribute('data-view');
                if (view === 'markdown') {
                    document.getElementById('markdown-view').style.display = 'block';
                    document.getElementById('mindmap-view').style.display = 'none';
                    document.getElementById('controls').style.display = 'none';
                } else {
                    document.getElementById('markdown-view').style.display = 'none';
                    document.getElementById('mindmap-view').style.display = 'block';
                    document.getElementById('controls').style.display = 'flex';
                }
            });
        });


        // Event listeners for generating side hustles and mental health reports
        const jobRole = document.getElementById('job-role').value.trim();
        document.getElementById("generateSchoolsBtn").addEventListener("click", function () {
            if (!jobRole) return alert("Please generate a roadmap first.");
            schoolLoading.style.display = 'block';
            generateSchools(jobRole);
        });

        document.getElementById("generateSideHustlesBtn").addEventListener("click", function () {
            if (!jobRole) return alert("Please generate a roadmap first.");
            hustleLoading.style.display = 'block';
            generateSideHustles(jobRole);
        });

        document.getElementById("generateMentalHealthBtn").addEventListener("click", function () {
            if (!jobRole) return alert("Please generate a roadmap first.");
            mentalHealthLoading.style.display = 'block';
            generateMentalHealthReport(jobRole);
        });

        function generateRoadmap() {
            const jobRole = document.getElementById('job-role').value.trim();
            loading.style.display = 'block';
            if (!jobRole) {
                alert('Please enter a job role');
                return;
            }

            // Show loading indicator
            document.getElementById('loading').style.display = 'block';
            document.getElementById('view-toggle').style.display = 'none';
            document.getElementById('controls').style.display = 'none';
            document.getElementById('mindmap-view').innerHTML = '';
            document.getElementById('markdown-view').innerHTML = '';
            document.getElementById('legend').innerHTML = '';

            // Send request to the backend
            const formData = new FormData();
            formData.append('job_role', jobRole);

            fetch('/generate-roadmap', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Hide loading indicator
                document.getElementById('loading').style.display = 'none';

                if (data.error) {
                    alert('Error: ' + data.error);
                    return;
                }

                // Display toggle buttons
                document.getElementById('view-toggle').style.display = 'flex';
                document.getElementById('controls').style.display = 'flex';

                // Set markdown content
                document.getElementById('markdown-view').textContent = data.markdown;

                // Convert markdown to mindmap with enhanced parsing
                convertToMindmap(data.markdown);
            })
            .catch(error => {
                document.getElementById('loading').style.display = 'none';
                alert('Error: ' + error.message);
            });
            
        }

        function parseMarkdown(markdownText) {
            const lines = markdownText.split('\n');
            const root = { name: "Roadmap", children: [], details: [] };

            let currentLevel1 = null;
            let currentLevel2 = null;
            let currentLevel3 = null;
            let currentLevel4 = null;
            let currentNode = null;
            let inCodeBlock = false;

            // Regex patterns for better parsing
            const headingPattern = /^(#{1,5})\s+(.+)$/;
            const listItemPattern = /^(\s*)[-*]\s+(.+)$/;
            const boldPattern = /\*\*([^*]+)\*\*/g;
            const italicPattern = /\*([^*]+)\*/g;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Skip empty lines
                if (line === '') continue;

                // Handle code blocks
                if (line.startsWith('```')) {
                    inCodeBlock = !inCodeBlock;
                    continue;
                }

                // Skip code block contents
                if (inCodeBlock) continue;

                // Check for heading
                const headingMatch = line.match(headingPattern);
                if (headingMatch) {
                    const level = headingMatch[1].length;
                    let name = headingMatch[2];

                    // Remove formatting for node name
                    name = name.replace(boldPattern, '\$1').replace(italicPattern, '\$1');

                    switch (level) {
                        case 1: // # Main heading
                            root.name = name;
                            currentNode = root;
                            break;
                        case 2: // ## Level 1
                            currentLevel1 = { name, children: [], details: [] };
                            root.children.push(currentLevel1);
                            currentLevel2 = null;
                            currentLevel3 = null;
                            currentLevel4 = null;
                            currentNode = currentLevel1;
                            break;
                        case 3: // ### Level 2
                            if (currentLevel1) {
                                currentLevel2 = { name, children: [], details: [] };
                                currentLevel1.children.push(currentLevel2);
                                currentLevel3 = null;
                                currentLevel4 = null;
                                currentNode = currentLevel2;
                            }
                            break;
                        case 4: // #### Level 3
                            if (currentLevel2) {
                                currentLevel3 = { name, children: [], details: [] };
                                currentLevel2.children.push(currentLevel3);
                                currentLevel4 = null;
                                currentNode = currentLevel3;
                            }
                            break;
                        case 5: // ##### Level 4
                            if (currentLevel3) {
                                currentLevel4 = { name, children: [], details: [] };
                                currentLevel3.children.push(currentLevel4);
                                currentNode = currentLevel4;
                            }
                            break;
                    }
                } else {
                    // Handle list items
                    const listMatch = line.match(listItemPattern);
                    if (listMatch) {
                        const indentation = listMatch[1].length;
                        let content = listMatch[2];

                        // Store the original formatted content for tooltips
                        const formattedContent = content;

                        // Remove formatting for node name
                        content = content.replace(boldPattern, '\$1').replace(italicPattern, '\$1');

                        if (currentNode) {
                            // Based on indentation, determine list hierarchy
                            const listItem = {
                                name: content,
                                children: [],
                                details: [],
                                formattedContent
                            };

                            if (indentation > 2) {
                                // This is a nested list item, add to the last child of the current node
                                if (currentNode.children.length > 0) {
                                    const lastChild = currentNode.children[currentNode.children.length - 1];
                                    lastChild.children.push(listItem);
                                } else {
                                    currentNode.children.push(listItem);
                                }
                            } else {
                                // This is a top-level list item
                                currentNode.children.push(listItem);
                            }
                        }
                    } else if (currentNode && line.length > 0) {
                        // Other content (paragraphs, etc.) gets added to details
                        currentNode.details.push(line);
                    }
                }
            }

            return root;
        }

        function convertToMindmap(markdownText) {
            // Parse markdown with enhanced recognition
            const root = parseMarkdown(markdownText);

            // Create the mindmap
            createMindmap(root);

            // Create the legend
            createLegend();
        }

        function createLegend() {
            const legendContainer = document.getElementById('legend');
            legendContainer.innerHTML = '';

            const levels = [
                { label: 'Main Topic', color: '#3498db' },
                { label: 'Section', color: '#2ecc71' },
                { label: 'Sub-Section', color: '#e74c3c' },
                { label: 'Topic', color: '#9b59b6' },
                { label: 'Skill/Element', color: '#f39c12' }
            ];

            levels.forEach(level => {
                const item = document.createElement('div');
                item.className = 'legend-item';

                const colorBox = document.createElement('div');
                colorBox.className = 'legend-color';
                colorBox.style.backgroundColor = level.color;

                const label = document.createElement('span');
                label.textContent = level.label;

                item.appendChild(colorBox);
                item.appendChild(label);
                legendContainer.appendChild(item);
            });
        }

        function createMindmap(data) {
            // Clear previous mindmap
            document.getElementById('mindmap-view').innerHTML = '';

            // Set the dimensions and margins of the diagram
            const container = document.getElementById('mindmap-view');
            const width = container.clientWidth - 40;
            const height = 650;
            const margin = {top: 50, right: 120, bottom: 50, left: 120};

            // Create the SVG container
            svg = d3.select("#mindmap-view").append("svg")
                .attr("width", width)
                .attr("height", height)
                .call(d3.zoom().on("zoom", function(event) {
                    currentTransform = event.transform;
                    g.attr("transform", event.transform);
                }));

            // Add a background rect to capture zoom events
            svg.append("rect")
                .attr("width", width)
                .attr("height", height)
                .attr("fill", "white");

            // Create the group that will contain the mindmap
            g = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // Setup zoom controls
            document.getElementById('zoom-in').onclick = function() {
                currentTransform.k *= 1.2;
                svg.call(d3.zoom().transform, d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(currentTransform.k));
            };
            document.getElementById('zoom-out').onclick = function() {
                currentTransform.k /= 1.2;
                svg.call(d3.zoom().transform, d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(currentTransform.k));
            };
            document.getElementById('zoom-reset').onclick = function() {
                svg.call(d3.zoom().transform, d3.zoomIdentity.translate(margin.left, margin.top).scale(1));
                currentTransform = { k: 1, x: margin.left, y: margin.top };
            };

            // Define a tree layout
            const treemap = d3.tree()
                .size([height - margin.top - margin.bottom, width - margin.left - margin.right])
                .nodeSize([25, 180]); // Adjust node sizing for better spacing

            // Create hierarchy from the data
            const root = d3.hierarchy(data, d => d.children);

            // Assign initial positions
            root.x0 = height / 2;
            root.y0 = 0;

            // Apply the tree layout
            const treeData = treemap(root);

            // Compute nodes and links
            const nodes = treeData.descendants();
            const links = treeData.descendants().slice(1);

            // Create tooltip
            const tooltip = d3.select("#tooltip");

            // Create the links
            g.selectAll('path.link')
                .data(links)
                .enter().append('path')
                .attr("class", "link")
                .attr('d', d => {
                    return `M${d.y},${d.x}C${(d.y + d.parent.y) / 2},${d.x} ${(d.y + d.parent.y) / 2},${d.parent.x} ${d.parent.y},${d.parent.x}`;
                });

            // Create the nodes
            const node = g.selectAll('g.node')
                .data(nodes)
                .enter().append('g')
                .attr('class', 'node')
                .attr("transform", d => `translate(${d.y},${d.x})`)
                .on("mouseover", function(event, d) {
                    // Show tooltip with details if available
                    if (d.data.details && d.data.details.length > 0 || d.data.formattedContent) {
                        let content = d.data.formattedContent || d.data.details.join("<br>");

                        tooltip.html(`<strong>${d.data.name}</strong><br>${content}`)
                            .style("left", (event.pageX + 15) + "px")
                            .style("top", (event.pageY - 28) + "px")
                            .style("opacity", 1);
                    }
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0);
                })
                .on("click", function(event, d) {
                    // Show sidebar with section info and fetch YouTube courses
                    showSidebar(d.data.name);
                    fetchYouTubeCourses(d.data.name);
                    fetchResearchPapers(d.data.name + " career");
                });

            // Add circles for nodes
            node.append('circle')
                .attr('r', d => {
                    // Size based on level and number of children
                    const baseSize = Math.max(4, 12 - d.depth * 2);
                    return baseSize + (d.children ? Math.min(d.children.length, 4) : 0);
                })
                .style("fill", d => {
                    // Color based on depth
                    if (d.depth === 0) return "#3498db"; // Main topic
                    if (d.depth === 1) return "#2ecc71"; // Sections
                    if (d.depth === 2) return "#e74c3c"; // Sub-sections
                    if (d.depth === 3) return "#9b59b6"; // Topics
                    return "#f39c12"; // Details
                })
                .style("stroke", d => {
                    // Stroke based on depth
                    if (d.depth === 0) return "#2980b9";
                    if (d.depth === 1) return "#27ae60";
                    if (d.depth === 2) return "#c0392b";
                    if (d.depth === 3) return "#8e44ad";
                    return "#e67e22";
                });

            // Add node labels
            node.append('text')
                .attr("dy", d => d.children ? "-1em" : "0.35em")
                .attr("x", d => d.children ? 0 : 13)
                .attr("text-anchor", d => d.children ? "middle" : "start")
                .text(d => {
                    // Truncate long labels
                    const name = d.data.name;
                    return name.length > 30 ? name.substring(0, 27) + '...' : name;
                })
                .style("font-size", d => Math.max(10, 14 - d.depth) + "px")
                .style("font-weight", d => d.depth < 2 ? "bold" : "normal");
        }

        function showSidebar(sectionName) {
            const sidebar = document.getElementById('sidebar');
            sidebar.style.display = 'block';
            const sidebarTitle = document.getElementById('sidebar-title');
            const sidebarContent = document.getElementById('sidebar-content');
            const courseList = document.getElementById('course-list');

            sidebarTitle.textContent = sectionName;
            sidebarContent.innerHTML = `<p>General information about ${sectionName} will be displayed here.</p>`;
            courseList.innerHTML = '';

            sidebar.classList.add('active');
        }

        function fetchYouTubeCourses(sectionName) {
            fetch(`/fetch-youtube-courses?query=${encodeURIComponent(sectionName)}`)
                .then(response => response.json())
                .then(data => {
                    const courseList = document.getElementById('course-list');
                    courseList.innerHTML = '';

                    if (data.items && data.items.length > 0) {
                        data.items.forEach(item => {
                            const listItem = document.createElement('li');
                            const link = document.createElement('a');
                            link.href = `https://www.youtube.com/watch?v=${item.id.videoId}`;
                            link.target = '_blank';
                            link.textContent = item.snippet.title;
                            listItem.appendChild(link);
                            courseList.appendChild(listItem);
                        });
                    } else {
                        courseList.innerHTML = '<li>No courses found.</li>';
                    }
                })
                .catch(error => {
                    console.error('Error fetching YouTube courses:', error);
                });
        }


        function fetchResearchPapers(query) {
            fetch(`/fetch-research-papers?query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                const paperList = document.getElementById('research-paper-list');
                paperList.innerHTML = ''; // Clear previous results

                if (!data || data.length === 0) {
                paperList.innerHTML = '<li>No research papers found.</li>';
                } else {
                data.forEach(paper => {
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = paper.link;
                    link.target = '_blank';
                    link.textContent = paper.title;
                    li.appendChild(link);
                    paperList.appendChild(li);
                });
                }
            })
            .catch(error => {
                console.error('Error fetching papers:', error);
            });
        }

        async function generateSchools(jobRole) {
            document.getElementById("schoolLoading").style.display = "block";
            const response = await fetch("/generate-school-recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `job_role=${encodeURIComponent(jobRole)}`
            });
            schoolLoading.style.display = 'none';
            const data = await response.json();
            document.getElementById("schoolLoading").style.display = "none";
        
            if (data.markdown) {
                document.getElementById("schoolResults").innerHTML = marked.parse(data.markdown);
            } else {
                document.getElementById("schoolResults").innerHTML = `<p>Error: ${data.error}</p>`;
            }
        }

        async function generateSideHustles(jobRole) {
            document.getElementById("hustleLoading").style.display = "block";
            const response = await fetch("/generate-side-hustles", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `job_role=${encodeURIComponent(jobRole)}`
            });
            hustleLoading.style.display = 'none';
            const data = await response.json();
            document.getElementById("hustleLoading").style.display = "none";
        
            if (data.markdown) {
                document.getElementById("hustleResults").innerHTML = marked.parse(data.markdown);
            } else {
                document.getElementById("hustleResults").innerHTML = `<p>Error: ${data.error}</p>`;
            }
        }
        
        async function generateMentalHealthReport(jobRole) {
            document.getElementById("mentalHealthLoading").style.display = "block";
            const response = await fetch("/generate-mental-health-report", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `job_role=${encodeURIComponent(jobRole)}`
            });
            mentalHealthLoading.style.display = 'none';
            const data = await response.json();
            document.getElementById("mentalHealthLoading").style.display = "none";
        
            if (data.markdown) {
                document.getElementById("mentalHealthResults").innerHTML = marked.parse(data.markdown);
            } else {
                document.getElementById("mentalHealthResults").innerHTML = `<p>Error: ${data.error}</p>`;
            }
        }