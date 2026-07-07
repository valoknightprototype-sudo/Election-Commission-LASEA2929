# Digital Voting Machine for School Elections

A beautiful, premium, and fully client-side digital voting machine built for school council elections. This application exports and imports **Microsoft Excel (.xlsx)** spreadsheet workbooks to record votes, leveraging the **SheetJS** library and **HTML5 Local Storage** to persist voting states directly in the browser.

This ensures that the project is completely portable, requires **zero command-line installation or runtime setups**, and runs instantly on school computers by simply opening `public/index.html`.

---

## 🌟 Key Features

1. **Voter Verification & Identity Security**:
   - Students register their sessions using a Student ID Card number.
   - **Double-Voting Prevention**: The system cross-references the student's ID against the registered voter list to ensure each student can only cast a single ballot.
   
2. **True Ballot Secrecy (Electoral Standard)**:
   - To mimic national voting protocols, the system splits spreadsheet tallies into two distinct sheets:
     - **Voters Sheet**: A registry of Student IDs that have already voted (prevents double voting).
     - **Votes Sheet**: An anonymous log of cast ballots with timestamps and selections (preserves absolute voter privacy).
   - There is no link or correlation stored between a Voter ID and their specific votes.

3. **Premium UX & Design**:
   - Indigo and Violet glassmorphism user interface.
   - Micro-interactions, slide-in views, glowing button feedback, and custom checks.
   - Dedicated manifesto review modal to read candidate platforms before voting.
   
4. **Real-time Results Dashboard**:
   - Displays turnout count and percentage rates based on school enrollment.
   - Real-time winners leaderboard featuring projected crown/tie indicators.
   - Premium horizontal bar charts powered by **Chart.js** displaying visual distribution tallies.

5. **Auditing & DB Admin Tools**:
   - **Download Excel Tally**: Exports a native `election_data.xlsx` workbook containing active votes and voters logs.
   - **Upload Excel Tally**: Import previous `.xlsx` spreadsheets in the browser to restore voter turnouts and continue voting.
   - **Reset Database**: Clears ballot histories to start a fresh school election.

---

## 📁 File Structure

```
evm computer/
├── public/
│   ├── css/
│   │   └── style.css       # Premium responsive dark-mode styling
│   ├── js/
│   │   ├── core.js         # Core database library (JSON storage & SheetJS integrations)
│   │   ├── voting.js       # Client state engine for the voting portal
│   │   └── results.js      # Controller for results, charts, and admin functions
│   ├── images/
│   │   ├── sophia.png      # President Candidate 1 Portrait
│   │   ├── marcus.png      # President Candidate 2 Portrait
│   │   ├── aaliyah.png     # Vice President Candidate 1 Portrait
│   │   └── devon.png       # Vice President Candidate 2 Portrait
│   ├── index.html          # Main Voter Portal (Login, ballot, review modal, success)
│   └── results.html        # Public Results Dashboard & Admin Panel
└── README.md               # User documentation
```

---

## 🚀 How to Run the Project

No Node.js, Python, or Web Servers are required!

1. Navigate to the `public/` directory in your file explorer.
2. Double-click [index.html](file:///c:/Users/lask/Desktop/evm%20computer/public/index.html) to open the **Student Voting Portal** in your web browser.
3. Open a second tab and double-click [results.html](file:///c:/Users/lask/Desktop/evm%20computer/public/results.html) to monitor the **Results Dashboard** in real time.

---

## 📊 Excel Database Sheets Layout

The exported `election_data.xlsx` workbook contains the following structured worksheets:

### Worksheet 1: `Votes`
An anonymous listing of ballot records. This preserves student secrecy while providing auditable votes.
| Timestamp | President Selection | Vice President Selection |
| :--- | :--- | :--- |
| 2026-07-07T07:42:00.000Z | Sophia Patel | Devon Chen |
| 2026-07-07T07:43:12.000Z | Marcus Vance | Aaliyah Jackson |

### Worksheet 2: `Voters`
A simple record of Student ID numbers that have already cast a ballot.
| Student ID |
| :--- |
| STU1001 |
| STU1002 |
