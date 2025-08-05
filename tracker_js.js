// PIBG Project Tracker JavaScript
// Author: INMA Tech Sdn Bhd
// Version: 1.0

// Configuration
const CONFIG = {
    phases: {
        milestone1: [1, 2], // Tasks 1-2
        milestone2: [3, 6], // Tasks 3-6
        milestone3: [7, 10], // Tasks 7-10
        milestone4: [11, 14], // Tasks 11-14
        milestone5: [15, 17], // Tasks 15-17
        milestone6: [18, 19]  // Tasks 18-19
    },
    milestoneAmounts: {
        milestone1: 9700,
        milestone2: 7760,
        milestone3: 7760,
        milestone4: 7760,
        milestone5: 7760,
        milestone6: 7760
    },
    totalBudget: 48500,
    storageKey: 'pibgProjectProgress'
};

// Main calculation function
function calculateSummary() {
    const rows = document.querySelectorAll('#projectTable tbody tr');
    let totalTasks = 0;
    let completedTasks = 0;
    let claimableAmount = 0;

    // Calculate individual task progress
    const taskProgress = {};
    
    rows.forEach(row => {
        if (!row.classList.contains('phase-header') && !row.classList.contains('milestone')) {
            const progressInput = row.querySelector('.progress-input');
            const statusSelect = row.querySelector('.status-select');
            const taskNoCell = row.querySelector('.task-no');
            
            if (progressInput && statusSelect && taskNoCell) {
                totalTasks++;
                const taskNo = parseInt(taskNoCell.textContent);
                const progress = parseInt(progressInput.value) || 0;
                const status = statusSelect.value;
                
                taskProgress[taskNo] = progress;
                
                if (status === 'completed') {
                    completedTasks++;
                }
            }
        }
    });

    // Calculate milestone progress
    Object.keys(CONFIG.phases).forEach(milestoneId => {
        const taskRange = CONFIG.phases[milestoneId];
        let totalProgress = 0;
        let taskCount = 0;
        
        for (let taskNo = taskRange[0]; taskNo <= taskRange[1]; taskNo++) {
            if (taskProgress[taskNo] !== undefined) {
                totalProgress += taskProgress[taskNo];
                taskCount++;
            }
        }
        
        const milestoneProgress = taskCount > 0 ? Math.round(totalProgress / taskCount) : 0;
        updateMilestoneDisplay(milestoneId, milestoneProgress);
        
        // Add to claimable amount if milestone completed
        if (milestoneProgress === 100) {
            claimableAmount += CONFIG.milestoneAmounts[milestoneId];
        }
    });

    // Update summary display
    updateSummaryDisplay(totalTasks, completedTasks, claimableAmount);
}

// Update milestone display
function updateMilestoneDisplay(milestoneId, progress) {
    const milestoneElement = document.getElementById(milestoneId);
    const milestoneStatusElement = document.getElementById(milestoneId + '-status');
    
    if (milestoneElement) {
        milestoneElement.textContent = progress + '%';
    }
    
    if (milestoneStatusElement) {
        let status = 'Not Started';
        let bgColor = '#f3f4f6';
        let textColor = '#374151';
        
        if (progress === 100) {
            status = 'Completed';
            bgColor = '#dcfce7';
            textColor = '#166534';
        } else if (progress > 0) {
            status = 'In Progress';
            bgColor = '#fef3c7';
            textColor = '#92400e';
        }
        
        milestoneStatusElement.textContent = status;
        milestoneStatusElement.style.background = bgColor;
        milestoneStatusElement.style.color = textColor;
    }
}

// Update summary display
function updateSummaryDisplay(totalTasks, completedTasks, claimableAmount) {
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Safely update elements if they exist
    updateElementText('totalTasks', totalTasks);
    updateElementText('completedTasks', completedTasks);
    updateElementText('overallProgress', overallProgress + '%');
    updateElementText('totalBudget', 'RM ' + CONFIG.totalBudget.toLocaleString());
    updateElementText('claimableAmount', 'RM ' + claimableAmount.toLocaleString());
}

// Helper function to safely update element text
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

// Export to CSV function
function exportToCSV() {
    showSpinner('Generating CSV...');
    
    setTimeout(() => {
        const table = document.getElementById('projectTable');
        const rows = table.querySelectorAll('tr');
        let csvContent = '';
        
        // Add header
        csvContent += 'PIBG Digital System - Project Tracker\n';
        csvContent += 'Generated: ' + new Date().toLocaleDateString() + '\n';
        csvContent += 'Total Budget: RM ' + CONFIG.totalBudget.toLocaleString() + '\n\n';
        
        // Add table headers
        const headers = ['No', 'Task/Milestone', 'Week', 'Start Date', 'End Date', 'Progress %', 'Status', 'Amount (RM)'];
        csvContent += headers.join(',') + '\n';
        
        // Add data rows
        rows.forEach((row, index) => {
            if (index > 0) { // Skip table header row
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    let rowData = [];
                    
                    cells.forEach((cell, cellIndex) => {
                        if (cellIndex === 5) { // Progress column
                            const input = cell.querySelector('.progress-input');
                            const span = cell.querySelector('.milestone-progress');
                            rowData.push(input ? input.value + '%' : (span ? span.textContent : ''));
                        } else if (cellIndex === 6) { // Status column
                            const select = cell.querySelector('.status-select');
                            const span = cell.querySelector('.milestone-status');
                            const statusText = select ? select.value.replace('-', ' ').toUpperCase() : (span ? span.textContent : '');
                            rowData.push('"' + statusText + '"');
                        } else {
                            let cellText = cell.textContent.trim();
                            // Escape commas and quotes in cell content
                            if (cellText.includes(',') || cellText.includes('"')) {
                                cellText = '"' + cellText.replace(/"/g, '""') + '"';
                            }
                            rowData.push(cellText);
                        }
                    });
                    
                    csvContent += rowData.join(',') + '\n';
                }
            }
        });
        
        // Add summary
        csvContent += '\n';
        csvContent += 'SUMMARY\n';
        csvContent += 'Total Tasks,' + document.getElementById('totalTasks').textContent + '\n';
        csvContent += 'Completed Tasks,' + document.getElementById('completedTasks').textContent + '\n';
        csvContent += 'Overall Progress,' + document.getElementById('overallProgress').textContent + '\n';
        csvContent += 'Amount Claimable,' + document.getElementById('claimableAmount').textContent + '\n';
        
        // Download CSV
        downloadFile(csvContent, 'PIBG_Project_Tracker_' + new Date().toISOString().split('T')[0] + '.csv', 'text/csv');
        
        hideSpinner();
        showSuccessMessage('CSV exported successfully!');
    }, 500);
}

// Save progress to localStorage
function saveProgress() {
    showSpinner('Saving progress...');
    
    setTimeout(() => {
        const progressData = {};
        const rows = document.querySelectorAll('#projectTable tbody tr');
        
        rows.forEach(row => {
            if (!row.classList.contains('phase-header') && !row.classList.contains('milestone')) {
                const progressInput = row.querySelector('.progress-input');
                const statusSelect = row.querySelector('.status-select');
                const taskNoCell = row.querySelector('.task-no');
                
                if (progressInput && statusSelect && taskNoCell) {
                    const taskNo = taskNoCell.textContent;
                    progressData[taskNo] = {
                        progress: progressInput.value,
                        status: statusSelect.value
                    };
                }
            }
        });
        
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(progressData));
        hideSpinner();
        showSuccessMessage('Progress saved successfully!');
    }, 500);
}

// Load progress from localStorage
function loadProgress() {
    showSpinner('Loading progress...');
    
    setTimeout(() => {
        const savedData = localStorage.getItem(CONFIG.storageKey);
        
        if (savedData) {
            const progressData = JSON.parse(savedData);
            const rows = document.querySelectorAll('#projectTable tbody tr');
            
            rows.forEach(row => {
                if (!row.classList.contains('phase-header') && !row.classList.contains('milestone')) {
                    const progressInput = row.querySelector('.progress-input');
                    const statusSelect = row.querySelector('.status-select');
                    const taskNoCell = row.querySelector('.task-no');
                    
                    if (progressInput && statusSelect && taskNoCell) {
                        const taskNo = taskNoCell.textContent;
                        if (progressData[taskNo]) {
                            progressInput.value = progressData[taskNo].progress || 0;
                            statusSelect.value = progressData[taskNo].status || 'not-started';
                        }
                    }
                }
            });
            
            calculateSummary();
            hideSpinner();
            showSuccessMessage('Progress loaded successfully!');
        } else {
            hideSpinner();
            showSuccessMessage('No saved progress found.');
        }
    }, 500);
}

// Utility functions
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType + ';charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showSpinner(message = 'Loading...') {
    // You can implement a loading spinner here
    console.log(message);
}

function hideSpinner() {
    // Hide spinner implementation
    console.log('Hiding spinner');
}

function showSuccessMessage(message) {
    // Create success message element
    const messageEl = document.createElement('div');
    messageEl.className = 'success-message';
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (document.body.contains(messageEl)) {
            document.body.removeChild(messageEl);
        }
    }, 3000);
}

// Auto-save functionality
function enableAutoSave() {
    const inputs = document.querySelectorAll('.progress-input, .status-select');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            // Auto-save after 2 seconds of inactivity
            clearTimeout(window.autoSaveTimeout);
            window.autoSaveTimeout = setTimeout(saveProgress, 2000);
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    calculateSummary();
    loadProgress(); // Auto-load saved progress
    enableAutoSave(); // Enable auto-save functionality
    
    console.log('PIBG Project Tracker initialized successfully!');
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveProgress();
    }
    
    // Ctrl+E to export
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportToCSV();
    }
});

// Export functions for global access
window.calculateSummary = calculateSummary;
window.exportToCSV = exportToCSV;
window.saveProgress = saveProgress;
window.loadProgress = loadProgress;