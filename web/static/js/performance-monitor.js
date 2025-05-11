/**
 * performance-monitor.js
 * Monitors and displays performance statistics for Three.js
 */

// Stats.js should be loaded in index.html
// <script src="https://cdnjs.cloudflare.com/ajax/libs/stats.js/r17/Stats.min.js"></script>

let stats; // Performance monitor
let performanceMonitorEnabled = false;
let loadStartTime; // Timestamp when loading started
let loadEndTime; // Timestamp when loading completed
let loadingSteps = {
    startLoad: false,
    gridLoaded: false,
    warehouseLoaded: false,
    robotLoaded: false,
    simulationReady: false
};

let performanceMode = 'balanced'; // 'low', 'balanced', or 'high'

/**
 * Initialize the performance monitor
 */
function initPerformanceMonitor() {
    // Record load start time
    loadStartTime = performance.now();
    loadingSteps.startLoad = true;
    
    // Initialize Stats.js
    if (typeof Stats !== 'undefined') {
        stats = new Stats();
        stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        stats.dom.style.position = 'absolute';
        stats.dom.style.top = '60px';
        stats.dom.style.left = '5px';
        document.body.appendChild(stats.dom);
        stats.dom.style.display = 'none';
    } else {
        console.warn("Stats.js not loaded. Performance monitoring will be limited.");
    }
    
    // Create loading indicator
    createLoadingIndicator();
}

/**
 * Create a loading indicator with progress information
 */
function createLoadingIndicator() {
    const loadingContainer = document.createElement('div');
    loadingContainer.id = 'loadingContainer';
    loadingContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const loadingBox = document.createElement('div');
    loadingBox.style.cssText = `
        background-color: #fff;
        border-radius: 8px;
        padding: 20px;
        width: 300px;
        text-align: center;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Loading Simulation';
    title.style.margin = '0 0 20px 0';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'loadingProgressBar';
    progressBar.style.cssText = `
        width: 100%;
        height: 10px;
        background-color: #eee;
        border-radius: 5px;
        overflow: hidden;
        margin-bottom: 10px;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.id = 'loadingProgressFill';
    progressFill.style.cssText = `
        width: 0%;
        height: 100%;
        background-color: #4CAF50;
        transition: width 0.3s;
    `;
    
    const progressText = document.createElement('div');
    progressText.id = 'loadingProgressText';
    progressText.textContent = 'Initializing...';
    
    progressBar.appendChild(progressFill);
    loadingBox.appendChild(title);
    loadingBox.appendChild(progressBar);
    loadingBox.appendChild(progressText);
    loadingContainer.appendChild(loadingBox);
    
    document.body.appendChild(loadingContainer);
}

/**
 * Update the loading progress
 * @param {string} step - The loading step that completed
 * @param {string} message - Message to display
 */
function updateLoadingProgress(step, message) {
    if (!loadingSteps.hasOwnProperty(step)) return;
    
    // Mark step as completed
    loadingSteps[step] = true;
    
    // Calculate progress
    const totalSteps = Object.keys(loadingSteps).length;
    const completedSteps = Object.values(loadingSteps).filter(v => v).length;
    const progressPercentage = (completedSteps / totalSteps) * 100;
    
    // Update UI
    const progressFill = document.getElementById('loadingProgressFill');
    const progressText = document.getElementById('loadingProgressText');
    
    if (progressFill) {
        progressFill.style.width = `${progressPercentage}%`;
    }
    
    if (progressText) {
        progressText.textContent = message || `Loading: ${Math.round(progressPercentage)}%`;
    }
    
    // Check if all steps are complete
    if (completedSteps === totalSteps) {
        loadEndTime = performance.now();
        const loadTime = ((loadEndTime - loadStartTime) / 1000).toFixed(2);
        
        // Display final message with load time
        if (progressText) {
            progressText.textContent = `Loaded in ${loadTime} seconds`;
        }
        
        // Hide loading screen after a short delay
        setTimeout(() => {
            const loadingContainer = document.getElementById('loadingContainer');
            if (loadingContainer) {
                loadingContainer.style.opacity = '0';
                loadingContainer.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    loadingContainer.remove();
                }, 500);
            }
            
            // Show the stats panel if enabled
            if (performanceMonitorEnabled && stats) {
                stats.dom.style.display = 'block';
            }
            
            // Log performance data
            console.log(`3D Visualization Loading Time: ${loadTime} seconds`);
        }, 1000);
    }
}

/**
 * Update the performance monitor
 */
function updatePerformanceMonitor() {
    if (performanceMonitorEnabled && stats) {
        stats.update();
    }
}

/**
 * Toggle the performance monitor visibility
 */
function togglePerformanceMonitor() {
    performanceMonitorEnabled = !performanceMonitorEnabled;
    if (stats) {
        stats.dom.style.display = performanceMonitorEnabled ? 'block' : 'none';
    }
}

/**
 * Set up the performance options panel
 */
function setupPerformanceOptions() {
    // Create the options panel
    const optionsPanel = document.createElement('div');
    optionsPanel.className = 'performance-options';
    optionsPanel.innerHTML = `
        <div class="panel-header">Performance Options</div>
        <div class="panel-content">
            <div class="option-group">
                <label class="toggle-switch">
                    <input type="checkbox" id="toggle-stats" ${performanceMonitorEnabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">Performance Monitor</span>
                </label>
            </div>
            <div class="option-group">
                <span class="option-label">Quality:</span>
                <div class="radio-buttons">
                    <label>
                        <input type="radio" name="quality" value="low" ${performanceMode === 'low' ? 'checked' : ''}>
                        <span>Low</span>
                    </label>
                    <label>
                        <input type="radio" name="quality" value="balanced" ${performanceMode === 'balanced' ? 'checked' : ''}>
                        <span>Balanced</span>
                    </label>
                    <label>
                        <input type="radio" name="quality" value="high" ${performanceMode === 'high' ? 'checked' : ''}>
                        <span>High</span>
                    </label>
                </div>
            </div>
            <div class="option-group">
                <span class="option-label">Shadows:</span>
                <div class="radio-buttons">
                    <label>
                        <input type="radio" name="shadows" value="off">
                        <span>Off</span>
                    </label>
                    <label>
                        <input type="radio" name="shadows" value="low">
                        <span>Low</span>
                    </label>
                    <label>
                        <input type="radio" name="shadows" value="high" checked>
                        <span>High</span>
                    </label>
                </div>
            </div>
            <div class="option-group">
                <label class="toggle-switch">
                    <input type="checkbox" id="simplified-view">
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">Simplified View</span>
                </label>
            </div>
        </div>
    `;
    
    // Style the options panel
    optionsPanel.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 250px;
        background-color: rgba(30, 30, 30, 0.85);
        border-radius: 5px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 100;
        overflow: hidden;
    `;
    
    // Add CSS for panel elements
    const style = document.createElement('style');
    style.textContent = `
        .performance-options .panel-header {
            padding: 10px;
            background-color: rgba(40, 40, 40, 0.9);
            font-weight: bold;
            border-bottom: 1px solid #444;
            cursor: pointer;
        }
        .performance-options .panel-content {
            padding: 10px;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }
        .performance-options.expanded .panel-content {
            max-height: 300px;
        }
        .performance-options .option-group {
            margin-bottom: 15px;
        }
        .performance-options .option-label {
            display: block;
            margin-bottom: 5px;
        }
        .performance-options .radio-buttons {
            display: flex;
            justify-content: space-between;
        }
        .performance-options .radio-buttons label {
            flex: 1;
            text-align: center;
            background-color: rgba(60, 60, 60, 0.85);
            padding: 4px 0;
            border-radius: 3px;
            cursor: pointer;
            margin: 0 2px;
        }
        .performance-options .radio-buttons input[type="radio"] {
            display: none;
        }
        .performance-options .radio-buttons input[type="radio"]:checked + span {
            color: #4CAF50;
            font-weight: bold;
        }
        .performance-options .toggle-switch {
            position: relative;
            display: inline-block;
            width: 100%;
            height: 30px;
        }
        .performance-options .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .performance-options .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            width: 50px;
            height: 24px;
            background-color: #ccc;
            border-radius: 24px;
            transition: .4s;
        }
        .performance-options .toggle-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            border-radius: 50%;
            transition: .4s;
        }
        .performance-options .toggle-switch input:checked + .toggle-slider {
            background-color: #4CAF50;
        }
        .performance-options .toggle-switch input:checked + .toggle-slider:before {
            transform: translateX(26px);
        }
        .performance-options .toggle-label {
            position: absolute;
            left: 60px;
            top: 2px;
        }
    `;
    document.head.appendChild(style);
    
    // Add to document
    document.body.appendChild(optionsPanel);
    
    // Make panel expandable/collapsible
    const panelHeader = optionsPanel.querySelector('.panel-header');
    panelHeader.addEventListener('click', () => {
        optionsPanel.classList.toggle('expanded');
    });
    
    // Expand panel by default
    optionsPanel.classList.add('expanded');
    
    // Add event listeners
    const toggleStatsCheckbox = document.getElementById('toggle-stats');
    if (toggleStatsCheckbox) {
        toggleStatsCheckbox.addEventListener('change', function() {
            performanceMonitorEnabled = this.checked;
            togglePerformanceMonitor();
        });
    }
    
    // Add event listeners for quality options
    const qualityRadios = document.querySelectorAll('input[name="quality"]');
    qualityRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                setPerformanceMode(this.value);
            }
        });
    });
    
    // Add event listeners for shadow options
    const shadowRadios = document.querySelectorAll('input[name="shadows"]');
    shadowRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                setShadowQuality(this.value);
            }
        });
    });
    
    // Add simplified view option
    const simplifiedViewOption = document.createElement('div');
    simplifiedViewOption.className = 'option-group';
    simplifiedViewOption.innerHTML = `
        <label class="toggle-switch">
            <input type="checkbox" id="simplified-view">
            <span class="toggle-slider"></span>
            <span class="toggle-label">Simplified View</span>
        </label>
    `;
    
    // Append to panel content
    const panelContent = optionsPanel.querySelector('.panel-content');
    if (panelContent) {
        panelContent.appendChild(simplifiedViewOption);
    }
    
    // Add event listener for simplified view
    const simplifiedViewCheckbox = document.getElementById('simplified-view');
    if (simplifiedViewCheckbox) {
        simplifiedViewCheckbox.addEventListener('change', function() {
            if (typeof toggleSimplifiedView === 'function') {
                toggleSimplifiedView(this.checked);
            }
        });
    }
}

/**
 * Set the performance mode and update renderer settings
 * @param {string} mode - 'low', 'balanced', or 'high'
 */
function setPerformanceMode(mode) {
    performanceMode = mode;
    
    // Update renderer settings based on mode
    if (typeof renderer !== 'undefined' && renderer) {
        switch (mode) {
            case 'low':
                renderer.setPixelRatio(1);
                updateShadowResolution(512);
                break;
                
            case 'balanced':
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                updateShadowResolution(1024);
                break;
                
            case 'high':
                renderer.setPixelRatio(window.devicePixelRatio);
                updateShadowResolution(2048);
                break;
        }
    }
    
    console.log(`Performance mode set to: ${mode}`);
}

/**
 * Set shadow quality
 * @param {string} quality - 'off', 'low', or 'high'
 */
function setShadowQuality(quality) {
    if (typeof renderer !== 'undefined' && renderer) {
        switch (quality) {
            case 'off':
                renderer.shadowMap.enabled = false;
                break;
                
            case 'low':
                renderer.shadowMap.enabled = true;
                updateShadowResolution(512);
                break;
                
            case 'high':
                renderer.shadowMap.enabled = true;
                updateShadowResolution(performanceMode === 'high' ? 2048 : 1024);
                break;
        }
    }
    
    console.log(`Shadow quality set to: ${quality}`);
}

/**
 * Update shadow map resolution for all shadow-casting lights
 * @param {number} resolution - Shadow map resolution
 */
function updateShadowResolution(resolution) {
    if (typeof scene !== 'undefined' && scene) {
        scene.traverse(function(object) {
            if (object.isLight && object.castShadow) {
                object.shadow.mapSize.width = resolution;
                object.shadow.mapSize.height = resolution;
                // Force shadow map to update
                object.shadow.map = null;
            }
        });
    }
}
        <div class="option-header">Performance Options</div>
        <div class="option-row">
            <label for="shadows-toggle">Shadows</label>
            <input type="checkbox" id="shadows-toggle" checked>
        </div>
        <div class="option-row">
            <label for="antialiasing-toggle">Antialiasing</label>
            <input type="checkbox" id="antialiasing-toggle" checked>
        </div>
        <div class="option-row">
            <label for="detail-level">Detail Level</label>
            <select id="detail-level">
                <option value="high">High</option>
                <option value="medium" selected>Medium</option>
                <option value="low">Low</option>
            </select>
        </div>
        <div class="option-row">
            <button id="performance-monitor-toggle">Show FPS Monitor</button>
        </div>
    `;
    
    // Add to the DOM
    document.body.appendChild(optionsPanel);
    
    // Add event listeners
    document.getElementById('shadows-toggle').addEventListener('change', e => {
        renderer.shadowMap.enabled = e.target.checked;
    });
    
    document.getElementById('antialiasing-toggle').addEventListener('change', e => {
        // This requires recreating the renderer, which is complex
        // For simplicity, we'll just show a message
        alert('Changing antialiasing requires reloading the page.');
    });
    
    document.getElementById('detail-level').addEventListener('change', e => {
        const level = e.target.value;
        updateDetailLevel(level);
    });
    
    document.getElementById('performance-monitor-toggle').addEventListener('click', () => {
        togglePerformanceMonitor();
        document.getElementById('performance-monitor-toggle').textContent = 
            performanceMonitorEnabled ? 'Hide FPS Monitor' : 'Show FPS Monitor';
    });
}

/**
 * Update the detail level of 3D objects
 * @param {string} level - Detail level ('high', 'medium', 'low')
 */
function updateDetailLevel(level) {
    let gridSize, gridDivisions;
    
    switch (level) {
        case 'high':
            gridSize = 50;
            gridDivisions = 50;
            break;
        case 'medium':
            gridSize = 40;
            gridDivisions = 40;
            break;
        case 'low':
            gridSize = 30;
            gridDivisions = 30;
            break;
    }
    
    // Update grid
    config.gridSize = gridSize;
    config.gridDivisions = gridDivisions;
    
    // Remove old grid
    const grid = scene.getObjectByName('grid');
    if (grid) {
        scene.remove(grid);
        if (grid.geometry) grid.geometry.dispose();
    }
    
    // Add new grid if enabled
    if (config.showGrid) {
        addGrid();
    }
}

// Add CSS styles for the performance options panel
const styleElement = document.createElement('style');
styleElement.textContent = `
.performance-options {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    z-index: 1000;
}

.option-header {
    font-weight: bold;
    margin-bottom: 10px;
    text-align: center;
}

.option-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.option-row button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
}

.option-row button:hover {
    background-color: #2980b9;
}

.option-row select, .option-row input {
    margin-left: 10px;
}
`;
document.head.appendChild(styleElement);

// Add event listener to monitor frame rate
document.addEventListener('DOMContentLoaded', () => {
    // After a small delay to ensure UI is fully loaded
    setTimeout(() => {
        // Add simplified view toggle to the performance panel
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggle-simplified-view';
        toggleBtn.textContent = 'Enable Simplified View';
        toggleBtn.style.cssText = 'margin-top: 10px; display: block; width: 100%; padding: 5px;';
        
        // Find or create a container for the button
        const panel = document.getElementById('performancePanel');
        if (panel) {
            panel.appendChild(toggleBtn);
            
            // Add event listener
            toggleBtn.addEventListener('click', () => {
                const isEnabled = toggleBtn.classList.contains('enabled');
                if (!isEnabled) {
                    toggleBtn.classList.add('enabled');
                    toggleBtn.textContent = 'Disable Simplified View';
                    if (typeof toggleSimplifiedView === 'function') {
                        toggleSimplifiedView(true);
                    }
                } else {
                    toggleBtn.classList.remove('enabled');
                    toggleBtn.textContent = 'Enable Simplified View';
                    if (typeof toggleSimplifiedView === 'function') {
                        toggleSimplifiedView(false);
                    }
                }
            });
        }
    }, 1000);
});
