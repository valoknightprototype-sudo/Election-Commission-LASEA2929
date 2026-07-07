// Student Voting Portal Controller

let currentStudentId = "";
let selectedCandidates = {}; // Maps position to candidateId
let candidatesData = [];

// Initialize Page
document.addEventListener("DOMContentLoaded", () => {
    // 1. Check title
    const { title } = getElectionInfo();
    const headerTitle = document.getElementById("header-election-title");
    if (headerTitle) {
        headerTitle.textContent = title;
    }
    
    // 2. Fetch candidates from database
    candidatesData = getCandidates();
    
    // 3. Render the ballot
    renderBallot(candidatesData);
    
    // 4. Force default view
    showStep("step-login");
});

// Show specific step and hide others
function showStep(stepId) {
    const steps = ["step-login", "step-ballot", "step-success"];
    steps.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === stepId) {
                el.classList.add("active");
            } else {
                el.classList.remove("active");
            }
        }
    });
}

// Show validation Toast messages
function showToast(message, isError = false) {
    const toast = document.getElementById("toast-container");
    const toastMsg = document.getElementById("toast-message");
    const toastIcon = document.getElementById("toast-icon");
    
    if (toast && toastMsg) {
        toastMsg.textContent = message;
        
        // Style adjustments
        if (isError) {
            toast.classList.add("error");
            toastIcon.className = "fa-solid fa-triangle-exclamation";
        } else {
            toast.classList.remove("error");
            toastIcon.className = "fa-solid fa-circle-check";
        }
        
        toast.classList.add("active");
        
        // Hide after 3.5 seconds
        setTimeout(() => {
            toast.classList.remove("active");
        }, 3500);
    }
}

// Handle Student ID Login / Verification
function handleLogin(event) {
    event.preventDefault();
    const idInput = document.getElementById("student-id-input");
    const inputVal = idInput.value.trim().toUpperCase();
    
    if (!inputVal) {
        showToast("Please enter a valid Student ID.", true);
        return;
    }
    
    // Student ID pattern validation (e.g. STU followed by digits)
    // Make it flexible, but check if they enter a reasonable ID
    if (inputVal.length < 3) {
        showToast("Student ID must be at least 3 characters long.", true);
        return;
    }
    
    // Check if the student has already voted (reads voters list)
    if (hasVoted(inputVal)) {
        showToast("Verification Failed: Student ID has already cast a ballot.", true);
        return;
    }
    
    // Set active voter session
    currentStudentId = inputVal;
    document.getElementById("voter-badge-id").textContent = currentStudentId;
    
    // Clear selections from previous voters
    selectedCandidates = {};
    updateBallotSelectionUI();
    
    // Transition to ballot
    showToast("Identity verified. Proceeding to digital ballot.", false);
    setTimeout(() => {
        showStep("step-ballot");
    }, 800);
}

// Dynamically generate the Ballot groups and candidate cards
function renderBallot(candidates) {
    const container = document.getElementById("ballot-positions-container");
    if (!container) return;
    
    container.innerHTML = "";
    
    // Group candidates by position
    const grouped = {};
    candidates.forEach(c => {
        if (!grouped[c.position]) {
            grouped[c.position] = [];
        }
        grouped[c.position].push(c);
    });
    
    // Generate sections
    for (const position in grouped) {
        const section = document.createElement("section");
        section.className = "position-section";
        
        const title = document.createElement("h3");
        title.className = "position-title";
        title.innerHTML = `<i class="fa-solid fa-circle-dot" style="color: var(--primary); font-size: 0.8rem;"></i> Selection: ${position}`;
        section.appendChild(title);
        
        const grid = document.createElement("div");
        grid.className = "candidates-grid";
        
        grouped[position].forEach(c => {
            const card = document.createElement("div");
            card.className = "candidate-card";
            card.id = `candidate-card-${c.id}`;
            card.onclick = () => selectCandidate(c.position, c.id);
            
            card.innerHTML = `
                <img src="${c.avatar}" alt="${c.name} Avatar Portrait" class="candidate-avatar" onerror="this.src='https://placehold.co/150?text=${encodeURIComponent(c.name)}'">
                <div class="candidate-name">${c.name}</div>
                <div class="candidate-slogan">${c.slogan}</div>
                <button class="manifesto-btn" onclick="openManifesto(event, '${c.id}')">
                    <i class="fa-regular fa-file-lines"></i> View Platform
                </button>
                <div class="selection-indicator">
                    <i class="fa-solid fa-check"></i>
                </div>
            `;
            grid.appendChild(card);
        });
        
        section.appendChild(grid);
        container.appendChild(section);
    }
}

// Select candidate click handler
function selectCandidate(position, candidateId) {
    selectedCandidates[position] = candidateId;
    updateBallotSelectionUI();
}

// Sync DOM states with the selectedCandidates object
function updateBallotSelectionUI() {
    // 1. Reset all candidate cards active states
    const cards = document.querySelectorAll(".candidate-card");
    cards.forEach(card => card.classList.remove("selected"));
    
    // 2. Select the currently stored candidate cards
    for (const position in selectedCandidates) {
        const id = selectedCandidates[position];
        const card = document.getElementById(`candidate-card-${id}`);
        if (card) {
            card.classList.add("selected");
        }
    }
    
    // 3. Validate if at least one candidate for each position is selected to enable Review button
    // Count unique positions
    const uniquePositions = [...new Set(candidatesData.map(c => c.position))];
    const selectionsMade = Object.keys(selectedCandidates).filter(pos => selectedCandidates[pos] !== null).length;
    
    const reviewBtn = document.getElementById("ballot-review-btn");
    if (reviewBtn) {
        if (selectionsMade === uniquePositions.length) {
            reviewBtn.disabled = false;
        } else {
            reviewBtn.disabled = true;
        }
    }
}

// Open Manifesto Platform Modal Dialog
function openManifesto(event, candidateId) {
    event.stopPropagation(); // Stop click from selecting the card
    const c = getCandidateById(candidateId);
    
    if (c) {
        document.getElementById("manifesto-candidate-name").textContent = c.name + "'s Platform";
        document.getElementById("manifesto-candidate-position").textContent = c.position;
        document.getElementById("manifesto-candidate-text").textContent = c.manifesto;
        document.getElementById("manifesto-modal").classList.add("active");
    }
}

function closeManifestoModal() {
    document.getElementById("manifesto-modal").classList.remove("active");
}

// Review ballot step
function reviewBallot() {
    const reviewContainer = document.getElementById("review-selections-container");
    if (!reviewContainer) return;
    
    reviewContainer.innerHTML = "";
    
    for (const position in selectedCandidates) {
        const candidateId = selectedCandidates[position];
        const c = getCandidateById(candidateId);
        
        if (c) {
            const item = document.createElement("div");
            item.className = "review-selection-item";
            item.innerHTML = `
                <div class="review-pos">${position}</div>
                <div class="review-name"><i class="fa-regular fa-circle-check" style="color: var(--accent-emerald);"></i> ${c.name}</div>
            `;
            reviewContainer.appendChild(item);
        }
    }
    
    document.getElementById("review-modal").classList.add("active");
}

function closeReviewModal() {
    document.getElementById("review-modal").classList.remove("active");
}

// Submit final ballot to Excel database
function submitBallot() {
    try {
        // Record vote in local storage
        recordVote(currentStudentId, selectedCandidates);
        
        // Hide review modal
        closeReviewModal();
        
        // Show success step
        showStep("step-success");
        showToast("Ballot recorded successfully!", false);
    } catch (error) {
        closeReviewModal();
        showToast("Submission Error: " + error.message, true);
    }
}

// Logout session
function cancelVotingSession() {
    currentStudentId = "";
    document.getElementById("student-id-input").value = "";
    showStep("step-login");
}

// Reset session variables and return to login
function restartSession() {
    currentStudentId = "";
    selectedCandidates = {};
    document.getElementById("student-id-input").value = "";
    updateBallotSelectionUI();
    showStep("step-login");
}
