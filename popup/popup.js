// Load pet state when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  const chonkLevelInput = document.getElementById('chonk-level');
  const chonkValue = document.getElementById('chonk-value');
  const solvedToday = document.getElementById('solved-today');
  const dailyGoal = document.getElementById('daily-goal');
  const statusMessage = document.getElementById('status-message');

  // Load initial state
  const { petState } = await chrome.storage.local.get('petState');
  if (petState) {
    updateUI(petState);
  } else {
    // Create default state
    const defaultState = {
      type: 'cat',
      chonkLevel: 3,
      solvedToday: 0,
      lastActiveDate: new Date().toDateString()
    };
    await chrome.storage.local.set({ petState: defaultState });
    updateUI(defaultState);
  }

  // Handle chonk level changes
  chonkLevelInput.addEventListener('input', async (e) => {
    const newValue = parseInt(e.target.value);
    chonkValue.textContent = newValue;
    
    const { petState } = await chrome.storage.local.get('petState');
    if (petState) {
      petState.chonkLevel = newValue;
      await chrome.storage.local.set({ petState });
      updateUI(petState);
      
      // Notify content script to update pet display
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'UPDATE_PET_DISPLAY'
          }).catch(err => console.log("Tab not ready yet:", err));
        }
      });
    }
  });

  // Update UI based on pet state
  function updateUI(state) {
    solvedToday.textContent = state.solvedToday;
    dailyGoal.textContent = state.chonkLevel;
    chonkLevelInput.value = state.chonkLevel;
    chonkValue.textContent = state.chonkLevel;

    // Update status message
    if (state.solvedToday === 0) {
      statusMessage.textContent = "Your pet is waiting for you to code!";
    } else if (state.solvedToday >= state.chonkLevel) {
      statusMessage.textContent = "Your pet is super happy! 🎉";
    } else {
      statusMessage.textContent = `Keep going! ${state.chonkLevel - state.solvedToday} more to go!`;
    }
  }

  // Listen for state changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.petState) {
      updateUI(changes.petState.newValue);
    }
  });
});

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