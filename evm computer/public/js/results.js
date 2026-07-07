// Results Page Controller

let presidentChartInstance = null;
let vpChartInstance = null;
const TOTAL_SCHOOL_POPULATION = 120; // Simulated school voter count for turnout calculations

document.addEventListener("DOMContentLoaded", () => {
    // 1. Check title
    const { title } = getElectionInfo();
    const headerTitle = document.getElementById("header-results-title");
    if (headerTitle) {
        headerTitle.textContent = title;
    }
    
    // 2. Load statistics and build visualizations
    refreshDashboard();
});

// Toast Helper
function showToast(message, isError = false) {
    const toast = document.getElementById("toast-container");
    const toastMsg = document.getElementById("toast-message");
    const toastIcon = document.getElementById("toast-icon");
    
    if (toast && toastMsg) {
        toastMsg.textContent = message;
        
        if (isError) {
            toast.classList.add("error");
            toastIcon.className = "fa-solid fa-triangle-exclamation";
        } else {
            toast.classList.remove("error");
            toastIcon.className = "fa-solid fa-circle-check";
        }
        
        toast.classList.add("active");
        setTimeout(() => {
            toast.classList.remove("active");
        }, 3000);
    }
}

// Compute statistics and re-render dashboard components
function refreshDashboard() {
    try {
        const data = getElectionResults();
        
        // 1. Set stats numbers
        document.getElementById("stat-total-votes").textContent = data.totalVotesCast;
        
        // Compute turnout percentage
        const turnoutRate = Math.round((data.totalRegisteredVoted / TOTAL_SCHOOL_POPULATION) * 100);
        document.getElementById("stat-turnout-rate").textContent = `${turnoutRate}%`;
        
        // 2. Build projected winners leaderboard
        renderWinners(data.results);
        
        // 3. Render charts
        renderCharts(data.results);
        
    } catch (error) {
        console.error("Dashboard refresh error:", error);
        showToast("Error loading results data: " + error.message, true);
    }
}

// Render Projected Winners for each position
function renderWinners(results) {
    const container = document.getElementById("projected-winners-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    let hasVotes = false;
    for (const position in results) {
        if (results[position].some(c => c.votes > 0)) {
            hasVotes = true;
            break;
        }
    }
    
    if (!hasVotes) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1rem; font-style: italic;">
            <i class="fa-solid fa-hourglass-start" style="margin-right: 0.5rem;"></i> Awaiting first ballots. Projected winners will be listed here.
        </div>`;
        return;
    }
    
    for (const position in results) {
        const candidates = results[position];
        if (candidates.length === 0) continue;
        
        // The first candidate in the sorted array has the highest votes
        const leader = candidates[0];
        
        // Check if there is a tie
        const isTie = candidates.length > 1 && candidates[0].votes === candidates[1].votes && candidates[0].votes > 0;
        
        const item = document.createElement("div");
        item.className = "leader-item";
        
        let labelHTML = `<span class="leader-name">${leader.name}</span>`;
        if (leader.votes > 0) {
            if (isTie) {
                labelHTML += `<span class="winner-badge" style="background: linear-gradient(135deg, #9ca3af, #4b5563); color: white;">Tied Leader</span>`;
            } else {
                labelHTML += `<span class="winner-badge">Leading <i class="fa-solid fa-crown" style="font-size: 0.6rem;"></i></span>`;
            }
        } else {
            labelHTML += `<span class="winner-badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted);">No Votes</span>`;
        }
        
        item.innerHTML = `
            <div class="leader-candidate">
                <img src="${leader.avatar}" alt="${leader.name} Avatar Portrait" class="leader-avatar" onerror="this.src='https://placehold.co/80?text=${encodeURIComponent(leader.name)}'">
                <div>
                    ${labelHTML}
                    <div class="leader-pos">${position}</div>
                </div>
            </div>
            <div class="leader-votes">${leader.votes} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted);">votes</span></div>
        `;
        container.appendChild(item);
    }
}

// Draw Charts using Chart.js
function renderCharts(resultsByPosition) {
    const configGlobalStyles = {
        color: '#9ca3af',
        font: {
            family: "'Plus Jakarta Sans', sans-serif"
        }
    };
    
    // Group and sort data for charting (sort alphabetically or by name to keep positions stable)
    // We sort by ID so the candidates don't switch rows randomly as votes update
    const presData = [...(resultsByPosition["President"] || [])].sort((a, b) => a.id.localeCompare(b.id));
    const vpData = [...(resultsByPosition["Vice President"] || [])].sort((a, b) => a.id.localeCompare(b.id));
    
    // Setup President Chart
    const ctxPres = document.getElementById("presidentChart");
    if (ctxPres) {
        if (presidentChartInstance) presidentChartInstance.destroy();
        
        presidentChartInstance = new Chart(ctxPres, {
            type: 'bar',
            data: {
                labels: presData.map(c => c.name),
                datasets: [{
                    label: 'Votes',
                    data: presData.map(c => c.votes),
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.45)', // Indigo
                        'rgba(16, 185, 129, 0.45)'  // Emerald
                    ],
                    borderColor: [
                        'rgba(99, 102, 241, 1)',
                        'rgba(16, 185, 129, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleColor: '#fff',
                        bodyColor: '#e5e7eb',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            ...configGlobalStyles,
                            stepSize: 1,
                            precision: 0
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: configGlobalStyles
                    }
                }
            }
        });
    }
    
    // Setup VP Chart
    const ctxVp = document.getElementById("vpChart");
    if (ctxVp) {
        if (vpChartInstance) vpChartInstance.destroy();
        
        vpChartInstance = new Chart(ctxVp, {
            type: 'bar',
            data: {
                labels: vpData.map(c => c.name),
                datasets: [{
                    label: 'Votes',
                    data: vpData.map(c => c.votes),
                    backgroundColor: [
                        'rgba(139, 92, 246, 0.45)', // Violet
                        'rgba(244, 63, 94, 0.45)'   // Rose
                    ],
                    borderColor: [
                        'rgba(139, 92, 246, 1)',
                        'rgba(244, 63, 94, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1f2937',
                        titleColor: '#fff',
                        bodyColor: '#e5e7eb',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            ...configGlobalStyles,
                            stepSize: 1,
                            precision: 0
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: configGlobalStyles
                    }
                }
            }
        });
    }
}

// ADMIN PANEL: Reset DB
function handleResetElection() {
    if (confirm("WARNING: Are you sure you want to delete ALL cast ballots and registered voters? This action cannot be undone.")) {
        resetDatabase();
        refreshDashboard();
        showToast("Election database reset successfully.");
    }
}

// ADMIN PANEL: Download Excel file
function handleExportExcel() {
    try {
        exportDatabase();
        showToast("Excel spreadsheet exported successfully.");
    } catch (e) {
        showToast("Export failed: " + e.message, true);
    }
}

// ADMIN PANEL: Trigger Import File Input click
function triggerFileInput() {
    const input = document.getElementById("excel-file-input");
    if (input) input.click();
}

// ADMIN PANEL: Handle selected Excel file
function handleImportExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const arrayBuffer = e.target.result;
            importDatabase(arrayBuffer);
            
            // Refresh
            refreshDashboard();
            showToast("Database restored from Excel successfully!");
        } catch (error) {
            showToast("Import failed: " + error.message, true);
        } finally {
            // Reset input so file change triggers again for same file
            event.target.value = "";
        }
    };
    
    reader.onerror = function() {
        showToast("Error reading file.", true);
    };
    
    reader.readAsArrayBuffer(file);
}
