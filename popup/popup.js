// Load pet state when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  console.log("Coding Pet Extension: Popup opened");
  await updatePetDisplay();
  setupEventListeners();
});

// Update the pet display with current data
async function updatePetDisplay() {
  try {
    const { petState } = await chrome.storage.local.get('petState');
    
    if (!petState) {
      console.log("Coding Pet Extension: No pet state found in popup");
      return;
    }
    
    console.log("Coding Pet Extension: Updating popup with pet state:", petState);
    
    // Update pet image - use cat instead of dog
    const petImage = document.getElementById('pet-image');
    if (petImage) {
      petImage.src = `../assets/pets/cat/${petState.status || 'normal'}.png`;
    }
    
    // Update health bar
    const healthBar = document.getElementById('health-bar');
    if (healthBar) {
      healthBar.style.width = `${petState.health}%`;
      healthBar.style.backgroundColor = getHealthColor(petState.health);
    }
    
    // Update happiness bar
    const happinessBar = document.getElementById('happiness-bar');
    if (happinessBar) {
      happinessBar.style.width = `${petState.happiness}%`;
    }
    
    // Update progress text
    const progressText = document.getElementById('progress-text');
    if (progressText) {
      progressText.textContent = `${petState.solvedToday}/${petState.chonkLevel}`;
    }
    
    // Update backlog text
    const backlogText = document.getElementById('backlog-text');
    if (backlogText) {
      backlogText.textContent = petState.backlog;
    }
    
    // Set chonk level in settings
    const chonkInput = document.getElementById('chonk-level');
    if (chonkInput) {
      chonkInput.value = petState.chonkLevel;
    }
  } catch (error) {
    console.error("Coding Pet Extension: Error updating popup display", error);
  }
}

// Get color for health bar based on health value
function getHealthColor(health) {
  if (health < 30) return '#f44336'; // Red
  if (health < 70) return '#ff9800'; // Orange
  return '#4caf50'; // Green
}

// Set up event listeners
function setupEventListeners() {
  // Save settings button
  const saveButton = document.getElementById('save-settings');
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      try {
        const chonkLevelInput = document.getElementById('chonk-level');
        if (!chonkLevelInput) return;
        
        const chonkLevel = parseInt(chonkLevelInput.value);
        
        if (isNaN(chonkLevel) || chonkLevel < 1) {
          alert('Please enter a valid number for daily goal (minimum 1)');
          return;
        }
        
        console.log(`Coding Pet Extension: Saving new chonk level: ${chonkLevel}`);
        
        const { petState } = await chrome.storage.local.get('petState');
        if (petState) {
          petState.chonkLevel = chonkLevel;
          await chrome.storage.local.set({ petState });
          console.log("Coding Pet Extension: Updated chonk level in storage");
          
          // Show confirmation message
          const messageElem = document.createElement('div');
          messageElem.textContent = 'Settings saved!';
          messageElem.style.cssText = `
            color: white;
            background-color: #4caf50;
            padding: 8px;
            border-radius: 4px;
            text-align: center;
            margin-top: 10px;
          `;
          
          const container = document.querySelector('.settings');
          container.appendChild(messageElem);
          
          // Remove message after 2 seconds
          setTimeout(() => {
            container.removeChild(messageElem);
          }, 2000);
          
          // Update display to reflect changes
          await updatePetDisplay();
          
          // Notify content script to update if needed
          notifyContentScript();
        }
      } catch (error) {
        console.error("Coding Pet Extension: Error saving settings", error);
        alert('There was an error saving your settings. Please try again.');
      }
    });
  } else {
    console.error("Coding Pet Extension: Save settings button not found");
  }
}

// Notify content script to update pet display
function notifyContentScript() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'UPDATE_PET_DISPLAY'
      }).catch(err => console.log("Tab not ready yet:", err));
    }
  });
}

// Set up periodic refresh to keep popup in sync
setInterval(updatePetDisplay, 1000);