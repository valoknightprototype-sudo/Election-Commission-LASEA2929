// Core Excel Database Engine for local election storage using SheetJS

const LOCAL_STORAGE_KEY = 'school_election_excel_db';

const DEFAULT_DATABASE = {
    info: {
        title: "School Student Council Election 2026",
        status: "Active"
    },
    candidates: [
        {
            id: "pres-1",
            name: "Sophia Patel",
            position: "President",
            slogan: '"A Voice for Every Student"',
            avatar: "images/sophia.png",
            manifesto: "I plan to establish a Student Advisory Council, increase funding for school clubs, and organize monthly open-mic town halls to listen to student suggestions directly."
        },
        {
            id: "pres-2",
            name: "Marcus Vance",
            position: "President",
            slogan: '"Building a Greener, Better Campus"',
            avatar: "images/marcus.png",
            manifesto: "My focus will be on environmental initiatives: implementing solar chargers, expanding recycling bins, and starting a community student garden to beautify our school grounds."
        },
        {
            id: "vp-1",
            name: "Aaliyah Jackson",
            position: "Vice President",
            slogan: '"Inclusivity, Transparency, Rights"',
            avatar: "images/aaliyah.png",
            manifesto: "I will work to make sure school policies are transparent, update the student handbook for fairness, and host multicultural festivals to celebrate our diversity."
        },
        {
            id: "vp-2",
            name: "Devon Chen",
            position: "Vice President",
            slogan: '"Uniting Through Innovation & Art"',
            avatar: "images/devon.png",
            manifesto: "I aim to launch a student-run mobile app for event updates, organize creative hackathons, and set up a student art gallery in the main lobby."
        }
    ],
    voters: [], // Stores list of student IDs who have voted
    votes: []   // Stores list of anonymous votes
};

// Fetch the database object from LocalStorage, initializing if not present.
function getDatabase() {
    let dbStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!dbStr) {
        dbStr = JSON.stringify(DEFAULT_DATABASE);
        localStorage.setItem(LOCAL_STORAGE_KEY, dbStr);
    }
    try {
        return JSON.parse(dbStr);
    } catch (e) {
        console.error("Database Parse Error, resetting to default:", e);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DATABASE));
        return JSON.parse(JSON.stringify(DEFAULT_DATABASE));
    }
}

// Save the database object back to local storage
function saveDatabase(db) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
}

// Get the election details (Title, Status)
function getElectionInfo() {
    const db = getDatabase();
    return {
        title: db.info.title || "School Election",
        status: db.info.status || "Active"
    };
}

// Retrieve list of all candidates
function getCandidates() {
    const db = getDatabase();
    return db.candidates || [];
}

// Get candidate details by ID
function getCandidateById(candidateId) {
    const candidates = getCandidates();
    return candidates.find(c => c.id === candidateId) || null;
}

// Checks if a student ID has already voted
function hasVoted(studentId) {
    if (!studentId) return false;
    const db = getDatabase();
    const checkId = studentId.trim().toUpperCase();
    return db.voters.includes(checkId);
}

// Record a ballot in the JSON structure
function recordVote(studentId, selections) {
    if (!studentId) throw new Error("Student ID is required.");
    const idToCheck = studentId.trim().toUpperCase();
    
    const db = getDatabase();
    
    // 1. Double check if voter has already voted (Voter ID check)
    if (db.voters.includes(idToCheck)) {
        throw new Error("This Student ID has already cast a vote!");
    }
    
    // 2. Add voter ID to the voters array (prevents future votes)
    db.voters.push(idToCheck);
    
    // 3. Add vote selections to the votes array (anonymously)
    const newVote = {
        timestamp: new Date().toISOString(),
        selections: { ...selections }
    };
    
    db.votes.push(newVote);
    
    // 4. Save DB back to local storage
    saveDatabase(db);
    return true;
}

// Resets database back to default empty state
function resetDatabase() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DATABASE));
    return true;
}

// Exports the database data to a downloadable Microsoft Excel (.xlsx) file
function exportDatabase() {
    const db = getDatabase();
    
    // 1. Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // 2. Formulate Votes sheet (Anonymous selections)
    const votesRows = db.votes.map(v => ({
        "Timestamp": v.timestamp,
        "President Selection": v.selections["President"] || "Abstained",
        "Vice President Selection": v.selections["Vice President"] || "Abstained"
    }));
    
    // Add default row if empty to establish columns
    if (votesRows.length === 0) {
        votesRows.push({
            "Timestamp": "No Votes Cast",
            "President Selection": "",
            "Vice President Selection": ""
        });
    }
    
    const wsVotes = XLSX.utils.json_to_sheet(votesRows);
    XLSX.utils.book_append_sheet(wb, wsVotes, "Votes");
    
    // 3. Formulate Voters sheet (Double voting checks)
    const votersRows = db.voters.map(id => ({
        "Student ID": id
    }));
    
    if (votersRows.length === 0) {
        votersRows.push({
            "Student ID": "No Registered Votes"
        });
    }
    
    const wsVoters = XLSX.utils.json_to_sheet(votersRows);
    XLSX.utils.book_append_sheet(wb, wsVoters, "Voters");
    
    // 4. Trigger download
    XLSX.writeFile(wb, "election_data.xlsx");
}

// Imports an external Excel arrayBuffer, parses it, and restores local DB
function importDatabase(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Get sheets
    const wsVotes = workbook.Sheets["Votes"];
    const wsVoters = workbook.Sheets["Voters"];
    
    if (!wsVotes || !wsVoters) {
        throw new Error("Invalid Excel Tally: Missing 'Votes' or 'Voters' worksheets.");
    }
    
    // Parse Votes worksheet
    const votesRaw = XLSX.utils.sheet_to_json(wsVotes);
    const votes = votesRaw
        .filter(row => row["Timestamp"] !== "No Votes Cast")
        .map(row => ({
            timestamp: row["Timestamp"] || new Date().toISOString(),
            selections: {
                "President": row["President Selection"] || "",
                "Vice President": row["Vice President Selection"] || ""
            }
        }));
        
    // Parse Voters worksheet
    const votersRaw = XLSX.utils.sheet_to_json(wsVoters);
    const voters = votersRaw
        .filter(row => row["Student ID"] !== "No Registered Votes")
        .map(row => (row["Student ID"] || "").toString().trim().toUpperCase())
        .filter(Boolean);
        
    // Validate integrity of arrays
    if (voters.length !== votes.length) {
        console.warn(`Voters count (${voters.length}) does not match votes count (${votes.length}). Restoring anyway.`);
    }
    
    // Reconstruct database preserving core candidate parameters
    const db = getDatabase();
    db.votes = votes;
    db.voters = voters;
    
    saveDatabase(db);
    return true;
}

// Aggregates vote logs and returns statistics for results display
function getElectionResults() {
    const db = getDatabase();
    const candidates = getCandidates();
    
    // Initialize results count
    const candidatesResults = {};
    candidates.forEach(c => {
        candidatesResults[c.id] = {
            id: c.id,
            name: c.name,
            position: c.position,
            slogan: c.slogan,
            avatar: c.avatar,
            votes: 0
        };
    });
    
    // Count votes
    db.votes.forEach(v => {
        for (const [position, candidateId] of Object.entries(v.selections)) {
            if (candidateId && candidatesResults[candidateId]) {
                candidatesResults[candidateId].votes += 1;
            }
        }
    });
    
    // Group by position
    const resultsByPosition = {};
    candidates.forEach(c => {
        if (!resultsByPosition[c.position]) {
            resultsByPosition[c.position] = [];
        }
        if (!resultsByPosition[c.position].find(item => item.id === c.id)) {
            resultsByPosition[c.position].push(candidatesResults[c.id]);
        }
    });
    
    // Sort candidates in each position by vote count (highest first)
    for (const pos in resultsByPosition) {
        resultsByPosition[pos].sort((a, b) => b.votes - a.votes);
    }
    
    return {
        totalVotesCast: db.votes.length,
        totalRegisteredVoted: db.voters.length,
        results: resultsByPosition
    };
}
