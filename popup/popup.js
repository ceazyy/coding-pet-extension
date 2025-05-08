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
async function setupEventListeners() {
  const saveButton = document.getElementById('save-settings');
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      try {
        const chonkLevelInput = document.getElementById('chonk-level');
        if (!chonkLevelInput) return;
        
        const chonkLevel = parseInt(chonkLevelInput.value);
        
        if (isNaN(chonkLevel) || chonkLevel < 1) {
          alert('Feed him something, you peasant (minimum 1)');
          return;
        }

        // Get both pet state and settings
        const { petState, settings } = await chrome.storage.local.get(['petState', 'settings']);
        
        // Update both states
        const updatedSettings = {
          ...settings,
          dailyGoal: chonkLevel
        };

        const updatedPetState = {
          ...petState,
          chonkLevel: chonkLevel
        };

        // Save both states
        await chrome.storage.local.set({ 
          settings: updatedSettings,
          petState: updatedPetState 
        });

        // Show success message
        showSaveSuccess();
        
        // Update display
        await updatePetDisplay();
        
        // Notify content script
        notifyContentScript();

      } catch (error) {
        console.error("Coding Pet Extension: Error saving settings", error);
        alert('There was an error saving your settings. Please try again.');
      }
    });
  }
}

// Separate function for success message
function showSaveSuccess() {
  const messageElem = document.createElement('div');
  messageElem.textContent = 'Settings saved!';
  messageElem.classList.add('save-message');
  
  const container = document.querySelector('.settings');
  container.appendChild(messageElem);
  
  setTimeout(() => {
    container.removeChild(messageElem);
  }, 2000);
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
setInterval(updatePetDisplay, 5000);