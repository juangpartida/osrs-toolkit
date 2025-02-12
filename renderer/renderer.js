const { ipcRenderer } = require('electron');

function setLoading(button, isLoading) {
    if (!button) return;
    
    button.disabled = isLoading;
    button.classList.toggle('loading', isLoading);
    
    // Remove existing spinner if any
    const existingSpinner = button.querySelector('.loading-spinner');
    if (existingSpinner) {
        existingSpinner.remove();
    }
    
    if (isLoading) {
        // Save original text
        button.dataset.originalText = button.textContent;
        button.textContent = 'Loading...';
        
        // Add spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        button.appendChild(spinner);
    } else {
        // Restore original text
        button.textContent = button.dataset.originalText || 'Check';
    }
}

function formatNumber(num) {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
}

function getSkillIcon(skillName) {
    const baseUrl = 'https://oldschool.runescape.wiki/images';
    const skillIcons = {
        'Overall': '/8/8c/Overall_icon.png',
        'Attack': '/1/1c/Attack_icon.png',
        'Defence': '/b/b7/Defence_icon.png',
        'Strength': '/1/1b/Strength_icon.png',
        'Hitpoints': '/9/96/Hitpoints_icon.png',
        'Ranged': '/1/19/Ranged_icon.png',
        'Prayer': '/f/f2/Prayer_icon.png',
        'Magic': '/5/5c/Magic_icon.png',
        'Cooking': '/1/1b/Cooking_icon.png',
        'Woodcutting': '/f/f4/Woodcutting_icon.png',
        'Fletching': '/9/93/Fletching_icon.png',
        'Fishing': '/3/3b/Fishing_icon.png',
        'Firemaking': '/9/9b/Firemaking_icon.png',
        'Crafting': '/f/f3/Crafting_icon.png',
        'Smithing': '/3/39/Smithing_icon.png',
        'Mining': '/4/4a/Mining_icon.png',
        'Herblore': '/0/03/Herblore_icon.png',
        'Agility': '/8/86/Agility_icon.png',
        'Thieving': '/4/4a/Thieving_icon.png',
        'Slayer': '/2/28/Slayer_icon.png',
        'Farming': '/1/15/Farming_icon.png',
        'Runecrafting': '/1/16/Runecrafting_icon.png',
        'Hunter': '/d/dd/Hunter_icon.png',
        'Construction': '/f/f3/Construction_icon.png'
    };
    return `${baseUrl}${skillIcons[skillName] || '/8/8c/Overall_icon.png'}`;
}

function updateOutput(data, outputId, error = false) {
    const output = document.getElementById(outputId);
    if (!output) {
        console.error(`Error: Output container ${outputId} not found in the DOM.`);
        return;
    }

    if (error || !data) {
        output.style.color = '#ff0000';
        output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
        return;
    }

    output.style.color = 'var(--osrs-text)';

    // Handle Skills Data
    if (data.stats && outputId === 'output') {
        let skillsHtml = '<div class="skills-grid">';
        for (const [skill, stats] of Object.entries(data.stats)) {
            skillsHtml += `
                <div class="skill-tile">
                    <div class="skill-header">
                        <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
                        <span class="skill-name">${skill}</span>
                    </div>
                    <div class="skill-info">
                        <div class="skill-level">Level: ${stats.level}</div>
                        <div class="skill-xp">XP: ${formatNumber(stats.xp)}</div>
                        <div class="skill-rank">Rank: ${formatNumber(stats.rank)}</div>
                    </div>
                </div>
            `;
        }
        skillsHtml += '</div>';
        output.innerHTML = skillsHtml;
        return;
    }

    // Handle Activities Data
    if (data.activities && outputId === 'ranking-output') {
        let activitiesHtml = '<div class="rankings-section">';
        
        // Group activities by type
        const bosses = [];
        const clues = [];
        const minigames = [];
        const other = [];

        for (const [activity, score] of Object.entries(data.activities)) {
            const activityData = {
                name: activity,
                score: score
            };

            if (activity.includes('Clue Scrolls')) {
                clues.push(activityData);
            } else if (activity.includes('Points') || activity.includes('LMS') || activity.includes('Soul Wars') || activity.includes('Arena')) {
                minigames.push(activityData);
            } else if (activity.includes('Sire') || activity.includes('Hydra') || activity.includes('Boss') || activity.includes('Queen') || activity.includes('King')) {
                bosses.push(activityData);
            } else {
                other.push(activityData);
            }
        }

        // Display Minigames
        if (minigames.length > 0) {
            activitiesHtml += '<h3>Minigames</h3><div class="ranking-grid">';
            minigames.forEach(activity => {
                activitiesHtml += createActivityTile(activity);
            });
            activitiesHtml += '</div>';
        }

        // Display Clue Scrolls
        if (clues.length > 0) {
            activitiesHtml += '<h3>Clue Scrolls</h3><div class="ranking-grid">';
            clues.forEach(activity => {
                activitiesHtml += createActivityTile(activity);
            });
            activitiesHtml += '</div>';
        }

        // Display Bosses
        if (bosses.length > 0) {
            activitiesHtml += '<h3>Bosses</h3><div class="ranking-grid">';
            bosses.forEach(activity => {
                activitiesHtml += createActivityTile(activity);
            });
            activitiesHtml += '</div>';
        }

        // Display Other Activities
        if (other.length > 0) {
            activitiesHtml += '<h3>Other Activities</h3><div class="ranking-grid">';
            other.forEach(activity => {
                activitiesHtml += createActivityTile(activity);
            });
            activitiesHtml += '</div>';
        }

        activitiesHtml += '</div>';
        output.innerHTML = activitiesHtml;
        return;
    }

    // Handle GE Data
    if (outputId === 'ge-output' && !data.error) {
        const geHtml = `
            <div class="ge-item">
                <div class="ge-header">
                    <img src="${data.Icon}" alt="${data.Name}" class="ge-icon">
                    <h3>${data.Name}</h3>
                </div>
                <div class="ge-info">
                    <p class="ge-description">${data.Description}</p>
                    <p class="ge-type">Type: ${data.Type}</p>
                    <div class="ge-price-info">
                        <p class="ge-current-price">Current Price: ${data['Current Price']}</p>
                        <div class="ge-trends">
                            <div class="ge-trend">
                                <span>Today:</span>
                                <span>${data["Today's Change"]}</span>
                            </div>
                            <div class="ge-trend">
                                <span>30 Days:</span>
                                <span>${data["30-Day Trend"]}</span>
                            </div>
                            <div class="ge-trend">
                                <span>90 Days:</span>
                                <span>${data["90-Day Trend"]}</span>
                            </div>
                            <div class="ge-trend">
                                <span>180 Days:</span>
                                <span>${data["180-Day Trend"]}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        output.innerHTML = geHtml;
        return;
    }

    output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
}

function createActivityTile(activity) {
    const displayScore = activity.score === -1 ? "Not Attempted" : formatNumber(activity.score);
    const scoreClass = activity.score === -1 ? "unranked" : "";
    
    return `
        <div class="ranking-tile">
            <div class="ranking-header">
                <span class="ranking-name">${activity.name}</span>
            </div>
            <div class="ranking-info">
                <span class="ranking-score ${scoreClass}">${displayScore}</span>
            </div>
        </div>
    `;
}

async function fetchData(button, input, eventName, outputId) {
    const value = input.value.trim();
    if (!value) {
        updateOutput(`Please enter a valid input for ${eventName}`, outputId, true);
        return;
    }

    setLoading(button, true);
    try {
        console.log(`[RENDERER] Fetching ${eventName} for:`, value);
        const data = await ipcRenderer.invoke(eventName, value);
        console.log(`[RENDERER] Response for ${eventName}:`, data);
        updateOutput(data, outputId);
    } catch (error) {
        console.error(error);
        updateOutput(`Error fetching ${eventName}: ${error.message}`, outputId, true);
    }
    setLoading(button, false);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('quest-button')?.addEventListener('click', () => {
        fetchData(
            document.getElementById('quest-button'),
            document.getElementById('quest-username'),
            'fetch-quest-data',
            'quest-output'
        );
    });

    document.getElementById('skill-button')?.addEventListener('click', () => {
        fetchData(
            document.getElementById('skill-button'),
            document.getElementById('skill-username'),
            'fetch-skill-data',
            'output'
        );
    });

    document.getElementById('ranking-button')?.addEventListener('click', () => {
        fetchData(
            document.getElementById('ranking-button'),
            document.getElementById('ranking-username'),
            'fetch-ranking-data',
            'ranking-output'
        );
    });

    document.getElementById('ge-button')?.addEventListener('click', () => {
        fetchData(
            document.getElementById('ge-button'),
            document.getElementById('item-id'),
            'fetch-ge-data',
            'ge-output'
        );
    });
});
// const { ipcRenderer } = require('electron');

// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// function formatNumber(num) {
//     return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
// }

// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName] || '/8/8c/Overall_icon.png'}`;
// }

// function updateOutput(data, outputId, error = false) {
//     const output = document.getElementById(outputId);
//     if (!output) {
//         console.error(`Error: Output container ${outputId} not found in the DOM.`);
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     // Handle Skills Data
//     if (data.stats && outputId === 'output') {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data.stats)) {
//             skillsHtml += `
//                 <div class="skill-tile">
//                     <div class="skill-header">
//                         <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
//                         <span class="skill-name">${skill}</span>
//                     </div>
//                     <div class="skill-info">
//                         <div class="skill-level">Level: ${stats.level}</div>
//                         <div class="skill-xp">XP: ${formatNumber(stats.xp)}</div>
//                     </div>
//                 </div>
//             `;
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // Handle Activities Data
//     if (data.activities && outputId === 'ranking-output') {
//         let activitiesHtml = '<div class="rankings-section">';
        
//         // Group activities by type
//         const minigames = [];
//         const clues = [];
//         const bosses = [];
//         const other = [];

//         for (const [activity, score] of Object.entries(data.activities)) {
//             const activityData = {
//                 name: activity,
//                 score: score
//             };

//             if (activity.includes('Clue Scrolls')) {
//                 clues.push(activityData);
//             } else if (activity.includes('Points') || activity.includes('LMS') || activity.includes('Soul Wars') || activity.includes('Arena')) {
//                 minigames.push(activityData);
//             } else if (activity.includes('Sire') || activity.includes('Hydra') || activity.includes('Boss') || activity.includes('Queen') || activity.includes('King')) {
//                 bosses.push(activityData);
//             } else {
//                 other.push(activityData);
//             }
//         }

//         // Display Minigames
//         if (minigames.length > 0) {
//             activitiesHtml += '<h3>Minigames</h3><div class="ranking-grid">';
//             minigames.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Clue Scrolls
//         if (clues.length > 0) {
//             activitiesHtml += '<h3>Clue Scrolls</h3><div class="ranking-grid">';
//             clues.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Bosses
//         if (bosses.length > 0) {
//             activitiesHtml += '<h3>Bosses</h3><div class="ranking-grid">';
//             bosses.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Other Activities
//         if (other.length > 0) {
//             activitiesHtml += '<h3>Other Activities</h3><div class="ranking-grid">';
//             other.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         activitiesHtml += '</div>';
//         output.innerHTML = activitiesHtml;
//         return;
//     }

//     output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
// }

// function createActivityTile(activity) {
//     const displayScore = activity.score === -1 ? "Not Attempted" : formatNumber(activity.score);
//     const scoreClass = activity.score === -1 ? "unranked" : "";
    
//     return `
//         <div class="ranking-tile">
//             <div class="ranking-header">
//                 <span class="ranking-name">${activity.name}</span>
//             </div>
//             <div class="ranking-info">
//                 <span class="ranking-score ${scoreClass}">${displayScore}</span>
//             </div>
//         </div>
//     `;
// }

// async function fetchData(button, input, eventName, outputId) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, outputId, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data, outputId);
//     } catch (error) {
//         console.error(error);
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, outputId, true);
//     }
//     setLoading(button, false);
// }

// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button')?.addEventListener('click', () => {
//         fetchData(
//             document.getElementById('quest-button'),
//             document.getElementById('quest-username'),
//             'fetch-quest-data',
//             'quest-output'
//         );
//     });

//     document.getElementById('skill-button')?.addEventListener('click', () => {
//         fetchData(
//             document.getElementById('skill-button'),
//             document.getElementById('skill-username'),
//             'fetch-skill-data',
//             'output'
//         );
//     });

//     document.getElementById('ranking-button')?.addEventListener('click', () => {
//         fetchData(
//             document.getElementById('ranking-button'),
//             document.getElementById('ranking-username'),
//             'fetch-ranking-data',
//             'ranking-output'
//         );
//     });

//     document.getElementById('ge-button')?.addEventListener('click', () => {
//         fetchData(
//             document.getElementById('ge-button'),
//             document.getElementById('item-id'),
//             'fetch-ge-data',
//             'ge-output'
//         );
//     });
// });

// final
// const { ipcRenderer } = require('electron');

// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// function formatNumber(num) {
//     return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
// }

// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName] || '/8/8c/Overall_icon.png'}`;
// }

// function updateOutput(data, outputId, error = false) {
//     const output = document.getElementById(outputId);
//     if (!output) {
//         console.error(`Error: Output container ${outputId} not found in the DOM.`);
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     console.log('Received data:', data); // Debug log

//     output.style.color = 'var(--osrs-text)';

//     // Handle Skills Data
//     if (data.stats && outputId === 'output') {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data.stats)) {
//             skillsHtml += `
//                 <div class="skill-tile">
//                     <div class="skill-header">
//                         <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
//                         <span class="skill-name">${skill}</span>
//                     </div>
//                     <div class="skill-info">
//                         <div class="skill-level">Level: ${stats.level}</div>
//                         <div class="skill-xp">XP: ${formatNumber(stats.xp)}</div>
//                     </div>
//                 </div>
//             `;
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // Handle Rankings Data
//     if (data.rankings && outputId === 'ranking-output') {
//         let activitiesHtml = '<div class="rankings-section">';
        
//         // Group activities by type
//         const minigames = [];
//         const clues = [];
//         const bosses = [];
//         const other = [];

//         for (const [activity, rank] of Object.entries(data.rankings)) {
//             const activityData = {
//                 name: activity,
//                 rank: rank
//             };

//             if (activity.includes('Clue Scrolls')) {
//                 clues.push(activityData);
//             } else if (activity.includes('Points') || activity.includes('LMS') || activity.includes('Soul Wars') || activity.includes('Arena')) {
//                 minigames.push(activityData);
//             } else if (activity.includes('Sire') || activity.includes('Hydra') || activity.includes('Boss') || activity.includes('Queen') || activity.includes('King')) {
//                 bosses.push(activityData);
//             } else {
//                 other.push(activityData);
//             }
//         }

//         // Display Minigames
//         if (minigames.length > 0) {
//             activitiesHtml += '<h3>Minigames</h3><div class="ranking-grid">';
//             minigames.forEach(activity => {
//                 activitiesHtml += createRankingTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Clue Scrolls
//         if (clues.length > 0) {
//             activitiesHtml += '<h3>Clue Scrolls</h3><div class="ranking-grid">';
//             clues.forEach(activity => {
//                 activitiesHtml += createRankingTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Bosses
//         if (bosses.length > 0) {
//             activitiesHtml += '<h3>Bosses</h3><div class="ranking-grid">';
//             bosses.forEach(activity => {
//                 activitiesHtml += createRankingTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Other Activities
//         if (other.length > 0) {
//             activitiesHtml += '<h3>Other Activities</h3><div class="ranking-grid">';
//             other.forEach(activity => {
//                 activitiesHtml += createRankingTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         activitiesHtml += '</div>';
//         output.innerHTML = activitiesHtml;
//         return;
//     }

//     // Handle Grand Exchange Data
//     if (data.item && outputId === 'ge-output') {
//         const item = data.item;
//         const html = `
//             <div class="ge-item">
//                 <div class="ge-header">
//                     <img src="${item.icon}" alt="${item.name}" class="ge-icon">
//                     <h3>${item.name}</h3>
//                 </div>
//                 <div class="ge-info">
//                     <p class="ge-description">${item.description || 'No description available.'}</p>
//                     <div class="ge-price-info">
//                         <p class="ge-current-price">Current Price: ${formatNumber(item.current_price)} coins</p>
//                         <div class="ge-trends">
//                             <div class="ge-trend">
//                                 <span>Today's Change:</span>
//                                 <span class="${item.today_trend > 0 ? 'trend-positive' : item.today_trend < 0 ? 'trend-negative' : 'trend-neutral'}">
//                                     ${item.today_trend > 0 ? '+' : ''}${formatNumber(item.today_trend)}
//                                 </span>
//                             </div>
//                             <div class="ge-trend">
//                                 <span>30 Day Change:</span>
//                                 <span class="${item.day30_trend > 0 ? 'trend-positive' : item.day30_trend < 0 ? 'trend-negative' : 'trend-neutral'}">
//                                     ${item.day30_trend > 0 ? '+' : ''}${formatNumber(item.day30_trend)}
//                                 </span>
//                             </div>
//                             <div class="ge-trend">
//                                 <span>90 Day Change:</span>
//                                 <span class="${item.day90_trend > 0 ? 'trend-positive' : item.day90_trend < 0 ? 'trend-negative' : 'trend-neutral'}">
//                                     ${item.day90_trend > 0 ? '+' : ''}${formatNumber(item.day90_trend)}
//                                 </span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;
//         output.innerHTML = html;
//         return;
//     }

//     // Handle Quest Data
//     if (data.quests && outputId === 'quest-output') {
//         let html = '<div class="quest-list">';
//         for (const quest of data.quests) {
//             html += `
//                 <div class="quest-item">
//                     <span class="quest-name">${quest.name}</span>
//                     <span class="quest-status">${quest.status}</span>
//                 </div>
//             `;
//         }
//         html += '</div>';
//         output.innerHTML = html;
//         return;
//     }

//     output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
// }

// function createRankingTile(activity) {
//     const displayRank = activity.rank === -1 ? "Unranked" : `Rank: ${formatNumber(activity.rank)}`;
//     const rankClass = activity.rank === -1 ? "unranked" : "";
    
//     return `
//         <div class="ranking-tile">
//             <div class="ranking-header">
//                 <span class="ranking-name">${activity.name}</span>
//             </div>
//             <div class="ranking-info">
//                 <span class="ranking-score ${rankClass}">${displayRank}</span>
//             </div>
//         </div>
//     `;
// }

// async function fetchData(button, input, endpoint, outputId) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput('Please enter a valid input', outputId, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${endpoint} for:`, value);
//         const data = await ipcRenderer.invoke(endpoint, value);
        
//         if (data.error) {
//             updateOutput(data.error, outputId, true);
//             return;
//         }
        
//         console.log(`[RENDERER] Response for ${endpoint}:`, data);
//         updateOutput(data, outputId);
//     } catch (error) {
//         console.error(error);
//         updateOutput(`Error fetching ${endpoint}: ${error.message}`, outputId, true);
//     } finally {
//         setLoading(button, false);
//     }
// }

// document.addEventListener('DOMContentLoaded', () => {
//     // Rankings
//     document.getElementById('ranking-button')?.addEventListener('click', () => {
//         fetchData(
//             document.getElementById('ranking-button'),
//             document.getElementById('ranking-username'),
//             'fetch-ranking-data',
//             'ranking-output'
//         );
//     });

//     // Skills
//     document.getElementById('skill-button')?.addEventListener('click', () => {
//         fetchData(
//             document.getElementById('skill-button'),
//             document.getElementById('skill-username'),
//             'fetch-skill-data',
//             'output'
//         );
//     });

//     // Quests
//     document.getElementById('quest-button')?.addEventListener('click', () => {
//         fetchData(
//             document.getElementById('quest-button'),
//             document.getElementById('quest-username'),
//             'fetch-quest-data',
//             'quest-output'
//         );
//     });

//     // Grand Exchange
//     document.getElementById('ge-button')?.addEventListener('click', () => {
//         fetchData(
//             document.getElementById('ge-button'),
//             document.getElementById('item-name'),
//             'fetch-ge-data',
//             'ge-output'
//         );
//     });
// });

// final

// const { ipcRenderer } = require('electron');

// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// function formatNumber(num) {
//     return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
// }

// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName] || '/8/8c/Overall_icon.png'}`;
// }

// function updateOutput(data, outputId, error = false) {
//     const output = document.getElementById(outputId);
//     if (!output) {
//         console.error(`Error: Output container ${outputId} not found in the DOM.`);
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     // Handle Skills Data
//     if (data.stats && outputId === 'output') {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data.stats)) {
//             skillsHtml += `
//                 <div class="skill-tile">
//                     <div class="skill-header">
//                         <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
//                         <span class="skill-name">${skill}</span>
//                     </div>
//                     <div class="skill-info">
//                         <div class="skill-level">Level: ${stats.level}</div>
//                         <div class="skill-xp">XP: ${formatNumber(stats.xp)}</div>
//                     </div>
//                 </div>
//             `;
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // Handle Activities Data
//     if (data.activities && outputId === 'ranking-output') {
//         let activitiesHtml = '<div class="rankings-section">';
        
//         // Group activities by type
//         const minigames = [];
//         const clues = [];
//         const bosses = [];
//         const other = [];

//         for (const [activity, score] of Object.entries(data.activities)) {
//             const activityData = {
//                 name: activity,
//                 score: score
//             };

//             if (activity.includes('Clue Scrolls')) {
//                 clues.push(activityData);
//             } else if (activity.includes('Points') || activity.includes('LMS') || activity.includes('Soul Wars') || activity.includes('Arena')) {
//                 minigames.push(activityData);
//             } else if (activity.includes('Sire') || activity.includes('Hydra') || activity.includes('Boss') || activity.includes('Queen') || activity.includes('King')) {
//                 bosses.push(activityData);
//             } else {
//                 other.push(activityData);
//             }
//         }

//         // Display Minigames
//         if (minigames.length > 0) {
//             activitiesHtml += '<h3>Minigames</h3><div class="ranking-grid">';
//             minigames.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Clue Scrolls
//         if (clues.length > 0) {
//             activitiesHtml += '<h3>Clue Scrolls</h3><div class="ranking-grid">';
//             clues.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Bosses
//         if (bosses.length > 0) {
//             activitiesHtml += '<h3>Bosses</h3><div class="ranking-grid">';
//             bosses.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Other Activities
//         if (other.length > 0) {
//             activitiesHtml += '<h3>Other Activities</h3><div class="ranking-grid">';
//             other.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         activitiesHtml += '</div>';
//         output.innerHTML = activitiesHtml;
//         return;
//     }

//     output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
// }

// function createActivityTile(activity) {
//     const displayScore = activity.score === -1 ? "Not Attempted" : formatNumber(activity.score);
//     const scoreClass = activity.score === -1 ? "unranked" : "";
    
//     return `
//         <div class="ranking-tile">
//             <div class="ranking-header">
//                 <span class="ranking-name">${activity.name}</span>
//             </div>
//             <div class="ranking-info">
//                 <span class="ranking-score ${scoreClass}">Score: ${displayScore}</span>
//             </div>
//         </div>
//     `;
// }

// async function fetchData(button, input, eventName, outputId) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, outputId, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
        
//         if (data.error) {
//             updateOutput(data.error, outputId, true);
//         } else {
//             updateOutput(data, outputId);
//         }
//     } catch (error) {
//         console.error(error);
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, outputId, true);
//     }
//     setLoading(button, false);
// }

// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button')?.addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data', 'quest-output');
//     });

//     document.getElementById('skill-button')?.addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data', 'output');
//     });

//     document.getElementById('ranking-button')?.addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data', 'ranking-output');
//     });

//     document.getElementById('ge-button')?.addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data', 'ge-output');
//     });
// });

// wowkrwewrkwr
// const { ipcRenderer } = require('electron');

// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// function formatNumber(num) {
//     return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
// }

// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName] || '/8/8c/Overall_icon.png'}`;
// }

// function updateOutput(data, outputId, error = false) {
//     const output = document.getElementById(outputId);
//     if (!output) {
//         console.error(`Error: Output container ${outputId} not found in the DOM.`);
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     // Handle Skills Data
//     if (data.stats && outputId === 'output') {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data.stats)) {
//             skillsHtml += `
//                 <div class="skill-tile">
//                     <div class="skill-header">
//                         <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
//                         <span class="skill-name">${skill}</span>
//                     </div>
//                     <div class="skill-info">
//                         <div class="skill-level">Level: ${stats.level}</div>
//                         <div class="skill-xp">XP: ${formatNumber(stats.xp)}</div>
//                     </div>
//                 </div>
//             `;
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // Handle Activities Data
//     if (data.activities && outputId === 'ranking-output') {
//         let activitiesHtml = '<div class="rankings-section">';
        
//         // Group activities by type
//         const bosses = [];
//         const clues = [];
//         const minigames = [];
//         const other = [];

//         for (const [activity, score] of Object.entries(data.activities)) {
//             const activityData = {
//                 name: activity,
//                 score: score
//             };

//             if (activity.includes('Clue Scrolls')) {
//                 clues.push(activityData);
//             } else if (activity.includes('Points') || activity.includes('LMS') || activity.includes('Soul Wars') || activity.includes('Arena')) {
//                 minigames.push(activityData);
//             } else if (activity.includes('Sire') || activity.includes('Hydra') || activity.includes('Boss') || activity.includes('Queen') || activity.includes('King')) {
//                 bosses.push(activityData);
//             } else {
//                 other.push(activityData);
//             }
//         }

//         // Display Minigames
//         if (minigames.length > 0) {
//             activitiesHtml += '<h3>Minigames</h3><div class="ranking-grid">';
//             minigames.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Clue Scrolls
//         if (clues.length > 0) {
//             activitiesHtml += '<h3>Clue Scrolls</h3><div class="ranking-grid">';
//             clues.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Bosses
//         if (bosses.length > 0) {
//             activitiesHtml += '<h3>Bosses</h3><div class="ranking-grid">';
//             bosses.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Other Activities
//         if (other.length > 0) {
//             activitiesHtml += '<h3>Other Activities</h3><div class="ranking-grid">';
//             other.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         activitiesHtml += '</div>';
//         output.innerHTML = activitiesHtml;
//         return;
//     }

//     output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
// }

// function createActivityTile(activity) {
//     const displayScore = activity.score === -1 ? "Not Attempted" : formatNumber(activity.score);
//     const scoreClass = activity.score === -1 ? "unranked" : "";
    
//     return `
//         <div class="ranking-tile">
//             <div class="ranking-header">
//                 <span class="ranking-name">${activity.name}</span>
//             </div>
//             <div class="ranking-info">
//                 <span class="ranking-score ${scoreClass}">Score: ${displayScore}</span>
//             </div>
//         </div>
//     `;
// }

// async function fetchData(button, input, eventName, outputId) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, outputId, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data, outputId);
//     } catch (error) {
//         console.error(error);
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, outputId, true);
//     }
//     setLoading(button, false);
// }

// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data', 'quest-output');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data', 'output');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data', 'ranking-output');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data', 'ge-output');
//     });
// });
// WORKOKODKKDAWKWd

// const { ipcRenderer } = require('electron');

// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// function formatNumber(num) {
//     return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
// }

// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName] || '/8/8c/Overall_icon.png'}`;
// }

// function updateOutput(data, outputId, error = false) {
//     const output = document.getElementById(outputId);
//     if (!output) {
//         console.error(`Error: Output container ${outputId} not found in the DOM.`);
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     // Handle Skills Data
//     if (data.skills && outputId === 'output') {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data.skills)) {
//             skillsHtml += `
//                 <div class="skill-tile">
//                     <div class="skill-header">
//                         <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
//                         <span class="skill-name">${skill}</span>
//                     </div>
//                     <div class="skill-info">
//                         <div class="skill-level">Level: ${stats.Level}</div>
//                         <div class="skill-xp">XP: ${formatNumber(stats.Experience)}</div>
//                     </div>
//                 </div>
//             `;
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // Handle Activities Data
//     if (data.activities && outputId === 'ranking-output') {
//         let activitiesHtml = '<div class="rankings-section">';
        
//         // Group activities by type
//         const bosses = [];
//         const clues = [];
//         const minigames = [];
//         const other = [];

//         for (const [activity, score] of Object.entries(data.activities)) {
//             const activityData = {
//                 name: activity,
//                 score: score
//             };

//             if (activity.includes('Clue Scrolls')) {
//                 clues.push(activityData);
//             } else if (activity.includes('Points') || activity.includes('LMS') || activity.includes('Soul Wars') || activity.includes('Arena')) {
//                 minigames.push(activityData);
//             } else if (activity.includes('Sire') || activity.includes('Hydra') || activity.includes('Boss') || activity.includes('Queen') || activity.includes('King')) {
//                 bosses.push(activityData);
//             } else {
//                 other.push(activityData);
//             }
//         }

//         // Display Minigames
//         if (minigames.length > 0) {
//             activitiesHtml += '<h3>Minigames</h3><div class="ranking-grid">';
//             minigames.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Clue Scrolls
//         if (clues.length > 0) {
//             activitiesHtml += '<h3>Clue Scrolls</h3><div class="ranking-grid">';
//             clues.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Bosses
//         if (bosses.length > 0) {
//             activitiesHtml += '<h3>Bosses</h3><div class="ranking-grid">';
//             bosses.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Other Activities
//         if (other.length > 0) {
//             activitiesHtml += '<h3>Other Activities</h3><div class="ranking-grid">';
//             other.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         activitiesHtml += '</div>';
//         output.innerHTML = activitiesHtml;
//         return;
//     }

//     // Handle GE Data
//     if (outputId === 'ge-output' && !data.error) {
//         const geHtml = `
//             <div class="ge-item">
//                 <div class="ge-header">
//                     <img src="${data.Icon}" alt="${data.Name}" class="ge-icon">
//                     <h3>${data.Name}</h3>
//                 </div>
//                 <div class="ge-info">
//                     <p class="ge-description">${data.Description}</p>
//                     <p class="ge-type">Type: ${data.Type}</p>
//                     <div class="ge-price-info">
//                         <p class="ge-current-price">Current Price: ${data['Current Price']}</p>
//                         <div class="ge-trends">
//                             <div class="ge-trend">
//                                 <span>Today:</span>
//                                 <span class="trend-${data['Today\'s Trend'].Trend.toLowerCase()}">${data['Today\'s Trend'].Change}</span>
//                             </div>
//                             <div class="ge-trend">
//                                 <span>30 Days:</span>
//                                 <span class="trend-${data['30-Day Trend'].Trend.toLowerCase()}">${data['30-Day Trend'].Change}</span>
//                             </div>
//                             <div class="ge-trend">
//                                 <span>90 Days:</span>
//                                 <span class="trend-${data['90-Day Trend'].Trend.toLowerCase()}">${data['90-Day Trend'].Change}</span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;
//         output.innerHTML = geHtml;
//         return;
//     }

//     output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
// }

// function createActivityTile(activity) {
//     const displayScore = activity.score === -1 ? "Not Attempted" : formatNumber(activity.score);
//     const scoreClass = activity.score === -1 ? "unranked" : "";
    
//     return `
//         <div class="ranking-tile">
//             <div class="ranking-header">
//                 <span class="ranking-name">${activity.name}</span>
//             </div>
//             <div class="ranking-info">
//                 <span class="ranking-score ${scoreClass}">Score: ${displayScore}</span>
//             </div>
//         </div>
//     `;
// }

// async function fetchData(button, input, eventName, outputId) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, outputId, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data, outputId);
//     } catch (error) {
//         console.error(error);
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, outputId, true);
//     }
//     setLoading(button, false);
// }

// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data', 'quest-output');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data', 'output');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data', 'ranking-output');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data', 'ge-output');
//     });
// });


// LATEST LATEST VERSION TO WORK

// const { ipcRenderer } = require('electron');

// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// function formatNumber(num) {
//     return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
// }

// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName] || '/8/8c/Overall_icon.png'}`;
// }

// function updateOutput(data, outputId, error = false) {
//     const output = document.getElementById(outputId);
//     if (!output) {
//         console.error(`Error: Output container ${outputId} not found in the DOM.`);
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     // Handle Skills Data
//     if (data.skills && outputId === 'output') {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data.skills)) {
//             skillsHtml += `
//                 <div class="skill-tile">
//                     <div class="skill-header">
//                         <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
//                         <span class="skill-name">${skill}</span>
//                     </div>
//                     <div class="skill-info">
//                         <div class="skill-level">Level: ${stats.Level}</div>
//                         <div class="skill-xp">XP: ${formatNumber(stats.Experience)}</div>
//                     </div>
//                 </div>
//             `;
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // Handle Activities Data (Rankings)
//     if (data.activities && outputId === 'ranking-output') {
//         let activitiesHtml = '<div class="rankings-section">';
        
//         const bosses = [];
//         const clues = [];
//         const minigames = [];
//         const other = [];

//         for (const [activity, score] of Object.entries(data.activities)) {
//             const activityData = {
//                 name: activity,
//                 score: score
//             };

//             if (activity.includes('Clue Scrolls')) {
//                 clues.push(activityData);
//             } else if (activity.includes('Points') || activity.includes('LMS') || activity.includes('Soul Wars') || activity.includes('Arena')) {
//                 minigames.push(activityData);
//             } else if (activity.includes('Sire') || activity.includes('Hydra') || activity.includes('Boss') || activity.includes('Queen') || activity.includes('King')) {
//                 bosses.push(activityData);
//             } else {
//                 other.push(activityData);
//             }
//         }

//         if (minigames.length > 0) {
//             activitiesHtml += '<h3>Minigames</h3><div class="ranking-grid">';
//             minigames.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         if (clues.length > 0) {
//             activitiesHtml += '<h3>Clue Scrolls</h3><div class="ranking-grid">';
//             clues.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         if (bosses.length > 0) {
//             activitiesHtml += '<h3>Bosses</h3><div class="ranking-grid">';
//             bosses.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         if (other.length > 0) {
//             activitiesHtml += '<h3>Other Activities</h3><div class="ranking-grid">';
//             other.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         activitiesHtml += '</div>';
//         output.innerHTML = activitiesHtml;
//         return;
//     }

//     // Handle Grand Exchange Data
//     if (outputId === 'ge-output' && !data.error) {
//         const geHtml = `
//             <div class="ge-item">
//                 <div class="ge-header">
//                     <img src="${data.Icon}" alt="${data.Name}" class="ge-icon">
//                     <h3>${data.Name}</h3>
//                 </div>
//                 <div class="ge-info">
//                     <p class="ge-description">${data.Description}</p>
//                     <p class="ge-type">Type: ${data.Type}</p>
//                     <p class="ge-current-price">Current Price: ${data['Current Price']}</p>
//                     <p class="ge-trend">Today's Trend: ${data["Today's Trend"].Trend} (${data["Today's Trend"].Change})</p>
//                     <p class="ge-trend">30-Day Trend: ${data["30-Day Trend"].Trend} (${data["30-Day Trend"].Change})</p>
//                     <p class="ge-trend">90-Day Trend: ${data["90-Day Trend"].Trend} (${data["90-Day Trend"].Change})</p>
//                 </div>
//             </div>
//         `;
//         output.innerHTML = geHtml;
//         return;
//     }

//     output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
// }

// function createActivityTile(activity) {
//     const displayScore = activity.score === -1 ? "Not Attempted" : formatNumber(activity.score);
    
//     return `
//         <div class="ranking-tile">
//             <div class="ranking-header">
//                 <span class="ranking-name">${activity.name}</span>
//             </div>
//             <div class="ranking-info">
//                 <span class="ranking-score">Score: ${displayScore}</span>
//             </div>
//         </div>
//     `;
// }

// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data', 'ranking-output');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data', 'ge-output');
//     });
// });
// LATEST LATEST VERSION

// LATEST TO WORK

// const { ipcRenderer } = require('electron');

// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// function formatNumber(num) {
//     return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
// }

// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName] || '/8/8c/Overall_icon.png'}`;
// }

// function updateOutput(data, outputId, error = false) {
//     const output = document.getElementById(outputId);
//     if (!output) {
//         console.error(`Error: Output container ${outputId} not found in the DOM.`);
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     // Handle Skills Data
//     if (data.skills && outputId === 'output') {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data.skills)) {
//             skillsHtml += `
//                 <div class="skill-tile">
//                     <div class="skill-header">
//                         <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
//                         <span class="skill-name">${skill}</span>
//                     </div>
//                     <div class="skill-info">
//                         <div class="skill-level">Level: ${stats.Level}</div>
//                         <div class="skill-xp">XP: ${formatNumber(stats.Experience)}</div>
//                     </div>
//                 </div>
//             `;
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // Handle Activities Data
//     if (data.activities && outputId === 'ranking-output') {
//         let activitiesHtml = '<div class="rankings-section">';
        
//         // Group activities by type
//         const bosses = [];
//         const clues = [];
//         const minigames = [];
//         const other = [];

//         for (const [activity, score] of Object.entries(data.activities)) {
//             const activityData = {
//                 name: activity,
//                 score: score
//             };

//             if (activity.includes('Clue Scrolls')) {
//                 clues.push(activityData);
//             } else if (activity.includes('Points') || activity.includes('LMS') || activity.includes('Soul Wars') || activity.includes('Arena')) {
//                 minigames.push(activityData);
//             } else if (activity.includes('Sire') || activity.includes('Hydra') || activity.includes('Boss') || activity.includes('Queen') || activity.includes('King')) {
//                 bosses.push(activityData);
//             } else {
//                 other.push(activityData);
//             }
//         }

//         // Display Minigames
//         if (minigames.length > 0) {
//             activitiesHtml += '<h3>Minigames</h3><div class="ranking-grid">';
//             minigames.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Clue Scrolls
//         if (clues.length > 0) {
//             activitiesHtml += '<h3>Clue Scrolls</h3><div class="ranking-grid">';
//             clues.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Bosses
//         if (bosses.length > 0) {
//             activitiesHtml += '<h3>Bosses</h3><div class="ranking-grid">';
//             bosses.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Other Activities
//         if (other.length > 0) {
//             activitiesHtml += '<h3>Other Activities</h3><div class="ranking-grid">';
//             other.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         activitiesHtml += '</div>';
//         output.innerHTML = activitiesHtml;
//         return;
//     }

//     // Handle GE Data
//     if (outputId === 'ge-output' && !data.error) {
//         const geHtml = `
//             <div class="ge-item">
//                 <div class="ge-header">
//                     <img src="${data.Icon}" alt="${data.Name}" class="ge-icon">
//                     <h3>${data.Name}</h3>
//                 </div>
//                 <div class="ge-info">
//                     <p class="ge-description">${data.Description}</p>
//                     <p class="ge-type">Type: ${data.Type}</p>
//                     <div class="ge-price-info">
//                         <p class="ge-current-price">Current Price: ${data['Current Price']}</p>
//                         <div class="ge-trends">
//                             <div class="ge-trend">
//                                 <span>Today:</span>
//                                 <span class="trend-${data['Today\'s Trend'].Trend.toLowerCase()}">${data['Today\'s Trend'].Change}</span>
//                             </div>
//                             <div class="ge-trend">
//                                 <span>30 Days:</span>
//                                 <span class="trend-${data['30-Day Trend'].Trend.toLowerCase()}">${data['30-Day Trend'].Change}</span>
//                             </div>
//                             <div class="ge-trend">
//                                 <span>90 Days:</span>
//                                 <span class="trend-${data['90-Day Trend'].Trend.toLowerCase()}">${data['90-Day Trend'].Change}</span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         `;
//         output.innerHTML = geHtml;
//         return;
//     }

//     output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
// }

// function createActivityTile(activity) {
//     const displayScore = activity.score === -1 ? "Not Attempted" : formatNumber(activity.score);
//     const scoreClass = activity.score === -1 ? "unranked" : "";
    
//     return `
//         <div class="ranking-tile">
//             <div class="ranking-header">
//                 <span class="ranking-name">${activity.name}</span>
//             </div>
//             <div class="ranking-info">
//                 <span class="ranking-score ${scoreClass}">Score: ${displayScore}</span>
//             </div>
//         </div>
//     `;
// }

// async function fetchData(button, input, eventName, outputId) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, outputId, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data, outputId);
//     } catch (error) {
//         console.error(error);
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, outputId, true);
//     }
//     setLoading(button, false);
// }

// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data', 'quest-output');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data', 'output');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data', 'ranking-output');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data', 'ge-output');
//     });
// });

// LATEST TO WORK

// const { ipcRenderer } = require('electron');

// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// function formatNumber(num) {
//     return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
// }

// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName] || '/8/8c/Overall_icon.png'}`;
// }

// function updateOutput(data, outputId, error = false) {
//     const output = document.getElementById(outputId);
//     if (!output) {
//         console.error(`Error: Output container ${outputId} not found in the DOM.`);
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     // Handle Skills Data
//     if (data.skills && outputId === 'output') {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data.skills)) {
//             skillsHtml += `
//                 <div class="skill-tile">
//                     <div class="skill-header">
//                         <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
//                         <span class="skill-name">${skill}</span>
//                     </div>
//                     <div class="skill-info">
//                         <div class="skill-level">Level: ${stats.Level}</div>
//                         <div class="skill-xp">XP: ${formatNumber(stats.Experience)}</div>
//                     </div>
//                 </div>
//             `;
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // Handle Activities Data
//     if (data.activities && outputId === 'ranking-output') {
//         let activitiesHtml = '<div class="rankings-section">';
        
//         // Group activities by type
//         const bosses = [];
//         const clues = [];
//         const minigames = [];
//         const other = [];

//         for (const [activity, score] of Object.entries(data.activities)) {
//             const activityData = {
//                 name: activity,
//                 score: score
//             };

//             if (activity.includes('Clue Scrolls')) {
//                 clues.push(activityData);
//             } else if (activity.includes('Points') || activity.includes('LMS') || activity.includes('Soul Wars') || activity.includes('Arena')) {
//                 minigames.push(activityData);
//             } else if (activity.includes('Sire') || activity.includes('Hydra') || activity.includes('Boss') || activity.includes('Queen') || activity.includes('King')) {
//                 bosses.push(activityData);
//             } else {
//                 other.push(activityData);
//             }
//         }

//         // Display Minigames
//         if (minigames.length > 0) {
//             activitiesHtml += '<h3>Minigames</h3><div class="ranking-grid">';
//             minigames.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Clue Scrolls
//         if (clues.length > 0) {
//             activitiesHtml += '<h3>Clue Scrolls</h3><div class="ranking-grid">';
//             clues.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Bosses
//         if (bosses.length > 0) {
//             activitiesHtml += '<h3>Bosses</h3><div class="ranking-grid">';
//             bosses.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         // Display Other Activities
//         if (other.length > 0) {
//             activitiesHtml += '<h3>Other Activities</h3><div class="ranking-grid">';
//             other.forEach(activity => {
//                 activitiesHtml += createActivityTile(activity);
//             });
//             activitiesHtml += '</div>';
//         }

//         activitiesHtml += '</div>';
//         output.innerHTML = activitiesHtml;
//         return;
//     }

//     output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
// }

// function createActivityTile(activity) {
//     const displayScore = activity.score === -1 ? "Not Attempted" : formatNumber(activity.score);
//     const scoreClass = activity.score === -1 ? "unranked" : "";
    
//     return `
//         <div class="ranking-tile">
//             <div class="ranking-header">
//                 <span class="ranking-name">${activity.name}</span>
//             </div>
//             <div class="ranking-info">
//                 <span class="ranking-score ${scoreClass}">Score: ${displayScore}</span>
//             </div>
//         </div>
//     `;
// }

// async function fetchData(button, input, eventName, outputId) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, outputId, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data, outputId);
//     } catch (error) {
//         console.error(error);
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, outputId, true);
//     }
//     setLoading(button, false);
// }

// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data', 'output');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data', 'output');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data', 'ranking-output');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data', 'output');
//     });
// });

// THIS ONE WORKS

// const { ipcRenderer } = require('electron');

// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// function formatNumber(num) {
//     return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
// }

// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName] || "/8/8c/Overall_icon.png"}`;
// }

// function updateOutput(data, outputId, error = false) {
//     const output = document.getElementById(outputId);
//     if (!output) {
//         console.error(`Error: Output container ${outputId} not found in the DOM.`);
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     // **Handle Skills Data**
//     if (data.skills && outputId === 'output') {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data.skills)) {
//             skillsHtml += `
//                 <div class="skill-tile">
//                     <div class="skill-header">
//                         <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
//                         <span class="skill-name">${skill}</span>
//                     </div>
//                     <div class="skill-info">
//                         <div class="skill-level">Level: ${stats.Level}</div>
//                         <div class="skill-xp">XP: ${formatNumber(stats.Experience)}</div>
//                     </div>
//                 </div>
//             `;
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // **Handle Rankings Data (Activities)**
//     if (data.activities && outputId === 'ranking-output') {
//         let activitiesHtml = '<div class="activities-list"><h3>Activity Rankings</h3><ul>';
//         for (const [activity, score] of Object.entries(data.activities)) {
//             let displayScore = score === -1 ? "Not Attempted" : formatNumber(score);
//             activitiesHtml += `<li><strong>${activity}:</strong> ${displayScore}</li>`;
//         }
//         activitiesHtml += '</ul></div>';
//         output.innerHTML = activitiesHtml;
//         return;
//     }

//     output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
// }

// // Updated fetch function to support different output containers
// async function fetchData(button, input, eventName, outputId) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, outputId, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data, outputId);
//     } catch (error) {
//         console.error(error);
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, outputId, true);
//     }
//     setLoading(button, false);
// }

// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data', 'output');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data', 'output');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data', 'ranking-output');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data', 'output');
//     });
// });

// working


// const { ipcRenderer } = require('electron');

// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// function formatNumber(num) {
//     return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
// }

// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName]}`;
// }

// function updateOutput(data, outputId, error = false) {
//     const output = document.getElementById(outputId);
//     if (!output) {
//         console.error(`Error: Output container ${outputId} not found in the DOM.`);
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     // Display Skills Data
//     if (data.skills) {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data.skills)) {
//             skillsHtml += `
//                 <div class="skill-tile">
//                     <div class="skill-header">
//                         <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
//                         <span class="skill-name">${skill}</span>
//                     </div>
//                     <div class="skill-info">
//                         <div class="skill-level">Level: ${stats.Level}</div>
//                         <div class="skill-xp">XP: ${formatNumber(stats.Experience)}</div>
//                         <div class="skill-rank">Rank: ${formatNumber(stats.Rank ?? "N/A")}</div>
//                     </div>
//                 </div>
//             `;
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // Display Activities Data
//     if (data.activities) {
//         let activitiesHtml = '<div class="activities-list"><h3>Activity Rankings</h3><ul>';
//         for (const [activity, score] of Object.entries(data.activities)) {
//             let displayScore = score === -1 ? "Not Attempted" : formatNumber(score);
//             activitiesHtml += `<li><strong>${activity}:</strong> ${displayScore}</li>`;
//         }
//         activitiesHtml += '</ul></div>';
//         output.innerHTML = activitiesHtml;
//         return;
//     }

//     output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
// }

// // Updated fetch function to support different output containers
// async function fetchData(button, input, eventName, outputId) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, outputId, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data, outputId);
//     } catch (error) {
//         console.error(error);
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, outputId, true);
//     }
//     setLoading(button, false);
// }

// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data', 'output');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data', 'output');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data', 'ranking-output');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data', 'output');
//     });
// });


// const { ipcRenderer } = require('electron');

// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// function formatNumber(num) {
//     return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "N/A";
// }

// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName]}`;
// }

// function updateOutput(data, error = false) {
//     const output = document.getElementById('output');
//     if (!output) {
//         console.error("Error: Output container not found in the DOM.");
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     if (typeof data === 'object' && data.stats) {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data.stats)) {
//             skillsHtml += `
//                 <div class="skill-tile">
//                     <div class="skill-header">
//                         <img src="${getSkillIcon(skill)}" alt="${skill}" class="skill-icon">
//                         <span class="skill-name">${skill}</span>
//                     </div>
//                     <div class="skill-info">
//                         <div class="skill-level">Level: ${stats.level ?? "N/A"}</div>
//                         <div class="skill-xp">XP: ${formatNumber(stats.xp)}</div>
//                     </div>
//                 </div>
//             `;
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     output.innerHTML = `<p>Unexpected data format received:</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
// }
// // <div class="skill-rank">Rank: ${formatNumber(stats.rank)}</div>

// async function fetchData(button, input, eventName) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Raw skill data response:`, data);

//         if (!data || data.error) {
//             throw new Error(data?.error || "Unknown error occurred");
//         }

//         updateOutput(data);
//     } catch (error) {
//         console.error(error);
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, true);
//     }
//     setLoading(button, false);
// }

// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data');
//     });
// });

// working

// const { ipcRenderer } = require('electron');

// // ✅ Ensure setLoading() is defined before fetchData()
// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// // Helper function to format numbers with commas
// function formatNumber(num) {
//     return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// }

// // Helper function to get skill icon URL
// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName]}`;
// }

// // Helper function to create a skill tile (Rank Removed)
// function createSkillTile(skillName, data) {
//     return `
//         <div class="skill-tile">
//             <div class="skill-header">
//                 <img src="${getSkillIcon(skillName)}" alt="${skillName}" class="skill-icon">
//                 <span class="skill-name">${skillName}</span>
//             </div>
//             <div class="skill-info">
//                 <div class="skill-level">Level: ${data.Level}</div>
//                 <div class="skill-xp">XP: ${formatNumber(data.Experience)}</div>
//             </div>
//         </div>
//     `;
// }

// // Helper function to create a quest item tile
// function createQuestTile(quest) {
//     return `
//         <li class="quest-item">
//             <strong>${quest.Title}</strong> - <span class="quest-status">${quest.Status}</span><br>
//             <span class="quest-details">
//                 Difficulty: ${quest.Difficulty} | 
//                 Quest Points: ${quest["Quest Points"]} | 
//                 Members Only: ${quest["Members Only"]} | 
//                 Eligible to Start: ${quest["Eligible to Start"]}
//             </span>
//         </li>
//     `;
// }

// // Helper function to update the UI output with fetched data
// function updateOutput(data, error = false) {
//     const output = document.getElementById('output');
//     if (!output) {
//         console.error("Error: Output container not found in the DOM.");
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     // ✅ If quest data is received (Array)
//     if (Array.isArray(data)) {
//         if (data.length === 0) {
//             output.innerHTML = "<p>No quest data available.</p>";
//             return;
//         }

//         let questHtml = '<h2>Quest Progress</h2><ul class="quest-list">';
//         data.forEach(quest => {
//             questHtml += createQuestTile(quest);
//         });
//         questHtml += '</ul>';
//         output.innerHTML = questHtml;
//         return;
//     }

//     // ✅ If skill data is received (Object)
//     if (typeof data === 'object' && Object.keys(data).length > 0) {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data)) {
//             skillsHtml += createSkillTile(skill, stats);
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // Default Case (If unknown data format)
//     output.innerHTML = JSON.stringify(data, null, 2);
// }

// // ✅ Ensure fetchData() is defined after setLoading()
// async function fetchData(button, input, eventName) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data);
//     } catch (error) {
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, true);
//     }
//     setLoading(button, false);
// }

// // ✅ Ensure event listeners are correctly attached
// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data');
//     });
// });

// import { ipcRenderer } from 'electron';

// // ✅ Ensure setLoading() is defined before fetchData()
// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// // Helper function to format numbers with commas
// function formatNumber(num) {
//     return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// }

// // Helper function to get skill icon URL
// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName]}`;
// }

// // Helper function to create a skill tile
// function createSkillTile(skillName, data) {
//     return `
//         <div class="skill-tile">
//             <div class="skill-header">
//                 <img src="${getSkillIcon(skillName)}" alt="${skillName}" class="skill-icon">
//                 <span class="skill-name">${skillName}</span>
//             </div>
//             <div class="skill-info">
//                 <div class="skill-level">Level: ${data.level}</div>
//                 <div class="skill-xp">XP: ${formatNumber(data.xp)}</div>
//             </div>
//         </div>
//     `;
// }

// // Helper function to create a quest item tile
// function createQuestTile(quest) {
//     return `
//         <li class="quest-item">
//             <strong>${quest.Title}</strong> - <span class="quest-status">${quest.Status}</span><br>
//             <span class="quest-details">
//                 Difficulty: ${quest.Difficulty} | 
//                 Quest Points: ${quest["Quest Points"]} | 
//                 Members Only: ${quest["Members Only"]} | 
//                 Eligible to Start: ${quest["Eligible to Start"]}
//             </span>
//         </li>
//     `;
// }

// // Helper function to create a ranking tile
// function createRankingTile(activity) {
//     return `
//         <div class="ranking-tile">
//             <span class="ranking-name">${activity.name}</span>
//             <div class="ranking-info">
//                 <span class="ranking-rank">Rank: ${activity.rank >= 0 ? activity.rank.toLocaleString() : "Unranked"}</span>
//                 <span class="ranking-score">Score: ${activity.score >= 0 ? activity.score.toLocaleString() : "N/A"}</span>
//             </div>
//         </div>
//     `;
// }

// // Helper function to update the UI output with fetched data
// function updateOutput(data, outputId, error = false) {
//     const output = document.getElementById(outputId);
//     if (!output) {
//         console.error(`Error: Output container ${outputId} not found in the DOM.`);
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     if (Array.isArray(data)) {
//         if (data.length === 0) {
//             output.innerHTML = "<p>No data available.</p>";
//             return;
//         }

//         if (outputId === "ranking-output") {
//             let rankingHtml = '<h2>Rankings</h2><div class="ranking-list">';
//             data.forEach(activity => {
//                 rankingHtml += createRankingTile(activity);
//             });
//             rankingHtml += '</div>';
//             output.innerHTML = rankingHtml;
//             return;
//         }

//         let questHtml = '<h2>Quest Progress</h2><ul class="quest-list">';
//         data.forEach(quest => {
//             questHtml += createQuestTile(quest);
//         });
//         questHtml += '</ul>';
//         output.innerHTML = questHtml;
//         return;
//     }

//     if (typeof data === 'object' && Object.keys(data).length > 0) {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data)) {
//             skillsHtml += createSkillTile(skill, stats);
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     output.innerHTML = JSON.stringify(data, null, 2);
// }

// // ✅ Ensure fetchData() is defined after setLoading()
// async function fetchData(button, input, eventName, outputId) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, outputId, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data, outputId);
//     } catch (error) {
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, outputId, true);
//     }
//     setLoading(button, false);
// }

// // ✅ Ensure event listeners are correctly attached
// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data', 'output');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data', 'output');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data', 'ranking-output');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data', 'output');
//     });
// });

//---------


// const { ipcRenderer } = require('electron');

// // ✅ Ensure setLoading() is defined before fetchData()
// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// // Helper function to format numbers with commas
// function formatNumber(num) {
//     return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// }

// // Helper function to get skill icon URL
// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName]}`;
// }

// // Helper function to create a skill tile (Rank Removed)
// function createSkillTile(skillName, data) {
//     return `
//         <div class="skill-tile">
//             <div class="skill-header">
//                 <img src="${getSkillIcon(skillName)}" alt="${skillName}" class="skill-icon">
//                 <span class="skill-name">${skillName}</span>
//             </div>
//             <div class="skill-info">
//                 <div class="skill-level">Level: ${data.Level}</div>
//                 <div class="skill-xp">XP: ${formatNumber(data.Experience)}</div>
//             </div>
//         </div>
//     `;
// }

// // Helper function to create a quest item tile
// function createQuestTile(quest) {
//     return `
//         <li class="quest-item">
//             <strong>${quest.Title}</strong> - <span class="quest-status">${quest.Status}</span><br>
//             <span class="quest-details">
//                 Difficulty: ${quest.Difficulty} | 
//                 Quest Points: ${quest["Quest Points"]} | 
//                 Members Only: ${quest["Members Only"]} | 
//                 Eligible to Start: ${quest["Eligible to Start"]}
//             </span>
//         </li>
//     `;
// }

// // Helper function to update the UI output with fetched data
// function updateOutput(data, error = false) {
//     const output = document.getElementById('output');
//     if (!output) {
//         console.error("Error: Output container not found in the DOM.");
//         return;
//     }

//     if (error || !data) {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';

//     // ✅ If quest data is received (Array)
//     if (Array.isArray(data)) {
//         if (data.length === 0) {
//             output.innerHTML = "<p>No quest data available.</p>";
//             return;
//         }

//         let questHtml = '<h2>Quest Progress</h2><ul class="quest-list">';
//         data.forEach(quest => {
//             questHtml += createQuestTile(quest);
//         });
//         questHtml += '</ul>';
//         output.innerHTML = questHtml;
//         return;
//     }

//     // ✅ If skill data is received (Object)
//     if (typeof data === 'object' && Object.keys(data).length > 0) {
//         let skillsHtml = '<div class="skills-grid">';
//         for (const [skill, stats] of Object.entries(data)) {
//             skillsHtml += createSkillTile(skill, stats);
//         }
//         skillsHtml += '</div>';
//         output.innerHTML = skillsHtml;
//         return;
//     }

//     // Default Case (If unknown data format)
//     output.innerHTML = JSON.stringify(data, null, 2);
// }

// // ✅ Ensure fetchData() is defined after setLoading()
// async function fetchData(button, input, eventName) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data);
//     } catch (error) {
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, true);
//     }
//     setLoading(button, false);
// }

// // ✅ Ensure event listeners are correctly attached
// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data');
//     });
// });


// const { ipcRenderer } = require('electron');

// // ✅ Ensure setLoading() is defined before fetchData()
// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// // Helper function to format numbers with commas
// function formatNumber(num) {
//     return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// }

// // Helper function to get skill icon URL
// function getSkillIcon(skillName) {
//     const baseUrl = 'https://oldschool.runescape.wiki/images';
//     const skillIcons = {
//         'Overall': '/8/8c/Overall_icon.png',
//         'Attack': '/1/1c/Attack_icon.png',
//         'Defence': '/b/b7/Defence_icon.png',
//         'Strength': '/1/1b/Strength_icon.png',
//         'Hitpoints': '/9/96/Hitpoints_icon.png',
//         'Ranged': '/1/19/Ranged_icon.png',
//         'Prayer': '/f/f2/Prayer_icon.png',
//         'Magic': '/5/5c/Magic_icon.png',
//         'Cooking': '/1/1b/Cooking_icon.png',
//         'Woodcutting': '/f/f4/Woodcutting_icon.png',
//         'Fletching': '/9/93/Fletching_icon.png',
//         'Fishing': '/3/3b/Fishing_icon.png',
//         'Firemaking': '/9/9b/Firemaking_icon.png',
//         'Crafting': '/f/f3/Crafting_icon.png',
//         'Smithing': '/3/39/Smithing_icon.png',
//         'Mining': '/4/4a/Mining_icon.png',
//         'Herblore': '/0/03/Herblore_icon.png',
//         'Agility': '/8/86/Agility_icon.png',
//         'Thieving': '/4/4a/Thieving_icon.png',
//         'Slayer': '/2/28/Slayer_icon.png',
//         'Farming': '/1/15/Farming_icon.png',
//         'Runecrafting': '/1/16/Runecrafting_icon.png',
//         'Hunter': '/d/dd/Hunter_icon.png',
//         'Construction': '/f/f3/Construction_icon.png'
//     };
//     return `${baseUrl}${skillIcons[skillName]}`;
// }

// // Helper function to create a skill tile (Rank Removed)
// function createSkillTile(skillName, data) {
//     return `
//         <div class="skill-tile">
//             <div class="skill-header">
//                 <img src="${getSkillIcon(skillName)}" alt="${skillName}" class="skill-icon">
//                 <span class="skill-name">${skillName}</span>
//             </div>
//             <div class="skill-info">
//                 <div class="skill-level">Level: ${data.Level}</div>
//                 <div class="skill-xp">XP: ${formatNumber(data.Experience)}</div>
//             </div>
//         </div>
//     `;
// }

// // Helper function to update the UI output with fetched data
// function updateOutput(data, error = false) {
//     const output = document.getElementById('output');
//     if (!output) {
//         console.error("Error: Output container not found in the DOM.");
//         return;
//     }

//     if (error || !data || typeof data !== 'object') {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     if (Object.keys(data).length === 0) {
//         output.innerHTML = "<p>No data available.</p>";
//         return;
//     }

//     let contentHtml = '<div class="skills-grid">';
//     for (const [skill, stats] of Object.entries(data)) {
//         contentHtml += createSkillTile(skill, stats);
//     }
//     contentHtml += '</div>';
//     output.innerHTML = contentHtml;
// }

// // ✅ Ensure fetchData() is defined after setLoading()
// async function fetchData(button, input, eventName) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data);
//     } catch (error) {
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, true);
//     }
//     setLoading(button, false);
// }

// // ✅ Ensure event listeners are correctly attached
// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data');
//     });
// });




// const { ipcRenderer } = require('electron');

// // Helper function to show loading state
// function setLoading(button, isLoading) {
//     if (!button) return;
//     button.disabled = isLoading;
//     button.textContent = isLoading ? 'Loading...' : button.textContent.replace('Loading...', 'Check');
// }

// // Helper function to update the UI output with fetched data
// function updateOutput(data, error = false) {
//     const output = document.getElementById('output');
//     if (!output) {
//         console.error("Error: Output container not found in the DOM.");
//         return;
//     }

//     if (error || !data || typeof data !== 'object') {
//         output.style.color = '#ff0000';
//         output.innerHTML = `<p>Error: ${error ? data : "No valid data received."}</p>`;
//         return;
//     }

//     output.style.color = 'var(--osrs-text)';
//     if (Object.keys(data).length === 0) {
//         output.innerHTML = "<p>No data available.</p>";
//         return;
//     }

//     let contentHtml = '<div class="skills-grid">';
//     for (const [skill, stats] of Object.entries(data)) {
//         contentHtml += `
//             <div class="skill-tile">
//                 <div class="skill-header">
//                     <span class="skill-name">${skill}</span>
//                 </div>
//                 <div class="skill-info">
//                     <div class="skill-level">Level: ${stats.Level}</div>
//                     <div class="skill-xp">XP: ${stats.Experience.toLocaleString()}</div>
//                     <div class="skill-rank">Rank: ${stats.Rank.toLocaleString()}</div>
//                 </div>
//             </div>
//         `;
//     }
//     contentHtml += '</div>';
//     output.innerHTML = contentHtml;
// }

// // Function to fetch data from the backend microservices
// async function fetchData(button, input, eventName) {
//     const value = input.value.trim();
//     if (!value) {
//         updateOutput(`Please enter a valid input for ${eventName}`, true);
//         return;
//     }

//     setLoading(button, true);
//     try {
//         console.log(`[RENDERER] Fetching ${eventName} for:`, value);
//         const data = await ipcRenderer.invoke(eventName, value);
//         console.log(`[RENDERER] Response for ${eventName}:`, data);
//         updateOutput(data);
//     } catch (error) {
//         updateOutput(`Error fetching ${eventName}: ${error.message}`, true);
//     }
//     setLoading(button, false);
// }

// // Event listeners when the document loads
// document.addEventListener('DOMContentLoaded', () => {
//     document.getElementById('quest-button').addEventListener('click', () => {
//         fetchData(document.getElementById('quest-button'), document.getElementById('quest-username'), 'fetch-quest-data');
//     });

//     document.getElementById('skill-button').addEventListener('click', () => {
//         fetchData(document.getElementById('skill-button'), document.getElementById('skill-username'), 'fetch-skill-data');
//     });

//     document.getElementById('ranking-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ranking-button'), document.getElementById('ranking-username'), 'fetch-ranking-data');
//     });

//     document.getElementById('ge-button').addEventListener('click', () => {
//         fetchData(document.getElementById('ge-button'), document.getElementById('item-name'), 'fetch-ge-data');
//     });
// });


