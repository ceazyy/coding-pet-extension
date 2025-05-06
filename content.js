// Variables to track state
let isWatchingSubmission = false;
let lastSubmissionId = null;
let petOverlayActive = false;

// Start monitoring for submissions
function startMonitoring() {
  console.log("Coding Pet Extension: Monitoring started on LeetCode");
  
  // Create and add pet overlay immediately
  createPetOverlay();
  
  // Watch for submission button clicks
  document.addEventListener('click', handlePotentialSubmission);
  
  // Start the observer to watch for DOM changes
  startResultObserver();
}

// Create the persistent pet overlay
function createPetOverlay() {
  if (petOverlayActive) return;
  
  // Create pet container if it doesn't exist
  let petContainer = document.getElementById('coding-pet-container');
  
  if (!petContainer) {
    // Create and add the pet container
    petContainer = document.createElement('div');
    petContainer.id = 'coding-pet-container';
    petContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 100px;
      height: 100px;
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(petContainer);
  
    // Add click event listener
    petContainer.addEventListener('click', showPetInteractionMenu);
    
    // Set initial pet state
    updatePetDisplay();
    
    // Mark overlay as active
    petOverlayActive = true;
    
    console.log("Coding Pet Extension: Pet overlay created");
  }
}

// Update the pet display based on current state
async function updatePetDisplay() {
  const petContainer = document.getElementById('coding-pet-container');
  if (!petContainer) return;
  
  try {
    const { petState } = await chrome.storage.local.get('petState');
    
    if (!petState) {
      console.log("Coding Pet Extension: No pet state found, using default");
      // Use default cat image if no state
      const petImage = document.createElement('img');
      petImage.src = chrome.runtime.getURL(`assets/pets/cat/normal.png`);
      petImage.style.width = '100%';
      petImage.style.height = 'auto';
      
      // Clear container and add the new image
      petContainer.innerHTML = '';
      petContainer.appendChild(petImage);
      return;
    }
    
    console.log("Coding Pet Extension: Updating pet display with state:", petState);
    
    // Use cat instead of dog
    const petType = 'cat';
    const petStatus = petState.status || 'normal';
    
    const petImage = document.createElement('img');
    // Use the runtime URL to get the path right
    petImage.src = chrome.runtime.getURL(`assets/pets/${petType}/${petStatus}.png`);
    petImage.style.width = '100%';
    petImage.style.height = 'auto';
    
    // Clear container and add the new image
    petContainer.innerHTML = '';
    petContainer.appendChild(petImage);
  } catch (error) {
    console.error("Coding Pet Extension: Error updating pet display", error);
  }
}

// Handle clicks that might be submissions
function handlePotentialSubmission(event) {
  // Look for submission button clicks on LeetCode
  const submitButtons = document.querySelectorAll('button[data-e2e-locator="console-submit-button"]');
  if (submitButtons.length > 0) {
    for (const button of submitButtons) {
      if (button.contains(event.target)) {
        console.log('Coding Pet Extension: Submit button clicked, watching for results...');
        isWatchingSubmission = true;
        
        // Update the pet to "sleeping" state while waiting
        updatePetToSleeping();
        
        // Try to extract submission ID if possible
        setTimeout(checkForSubmissionResult, 1000);
      }
    }
  }
}

// Update pet to sleeping state
async function updatePetToSleeping() {
  try {
    const { petState } = await chrome.storage.local.get('petState');
    
    if (petState) {
      petState.status = 'sleeping';
      await chrome.storage.local.set({ petState });
      updatePetDisplay();
    } else {
      // Create default pet state
      const defaultPetState = {
        type: 'cat',
        health: 100,
        happiness: 50,
        chonkLevel: 3,
        solvedToday: 0,
        lastActiveDate: new Date().toDateString(),
        backlog: 0,
        status: 'sleeping'
      };
      await chrome.storage.local.set({ petState: defaultPetState });
      updatePetDisplay();
    }
  } catch (error) {
    console.error("Coding Pet Extension: Error updating pet to sleeping", error);
  }
}

// Start the mutation observer to watch for submission results
function startResultObserver() {
  const observer = new MutationObserver((mutations) => {
    if (!isWatchingSubmission) return;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        checkForSubmissionResult();
      }
    }
  });
  
  // Watch for changes in the main content area
  observer.observe(document.body, { childList: true, subtree: true });
  console.log("Coding Pet Extension: Result observer started");
}

// Check if there's a successful submission result
function checkForSubmissionResult() {
  // Look for success indicators in the DOM
  const resultElements = document.querySelectorAll('data-e2e-locator="submission-result"');
  
  let accepted = false;
  
  // Check text content of result elements
  for (const el of resultElements) {
    if (el.textContent.includes('Accepted')) {
      accepted = true;
      break;
    }
  }
  
  // Check for success elements
  if (accepted) {
    console.log('Coding Pet Extension: Problem solved successfully!');
    isWatchingSubmission = false;
    
    // Notify background script about solved problem
    chrome.runtime.sendMessage({
      type: 'PROBLEM_SOLVED'
    }, response => {
      console.log("Coding Pet Extension: Got response from background", response);
      if (response && response.success) {
        // Show pet animation/notification
        showPetHappyAnimation();
      }
    });
  }
}

// Show happy animation when problem is solved
async function showPetHappyAnimation() {
  try {
    // Update pet state to happy
    const { petState } = await chrome.storage.local.get('petState');
    
    if (petState) {
      petState.status = 'happy';
      await chrome.storage.local.set({ petState });
      updatePetDisplay();
      
      // Add bounce animation
      const petContainer = document.getElementById('coding-pet-container');
      if (petContainer) {
        petContainer.classList.add('pet-happy-animation');
        setTimeout(() => {
          petContainer.classList.remove('pet-happy-animation');
          
          // After animation ends, update to normal state if appropriate
          setTimeout(async () => {
            const { petState } = await chrome.storage.local.get('petState');
            if (petState && petState.status === 'happy') {
              petState.status = 'normal';
              await chrome.storage.local.set({ petState });
              updatePetDisplay();
            }
          }, 500);
        }, 2000);
      }
    }
  } catch (error) {
    console.error("Coding Pet Extension: Error showing happy animation", error);
  }
}

// Show interaction menu when pet is clicked
function showPetInteractionMenu(event) {
  // Remove any existing menu
  const existingMenu = document.getElementById('pet-interaction-menu');
  if (existingMenu) {
    document.body.removeChild(existingMenu);
    return;
  }
  
  const menu = document.createElement('div');
  menu.id = 'pet-interaction-menu';
  menu.style.cssText = `
    position: fixed;
    bottom: 130px;
    right: 20px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10001;
  `;
  
  menu.innerHTML = `
    <div class="menu-option" id="let-sleep">Let it sleep</div>
    <div class="menu-option" id="ask-help">Ask for help</div>
  `;
  
  document.body.appendChild(menu);
  
  // Add event listeners to menu options
  document.getElementById('let-sleep').addEventListener('click', () => {
    document.body.removeChild(menu);
  });
  
  document.getElementById('ask-help').addEventListener('click', () => {
    // In MVP, we'll just show a placeholder for the help feature
    alert('Help feature coming soon in the next version!');
    document.body.removeChild(menu);
  });
  
  // Close menu when clicking elsewhere
  document.addEventListener('click', function closeMenu(e) {
    if (!menu.contains(e.target) && e.target.id !== 'coding-pet-container') {
      document.body.removeChild(menu);
      document.removeEventListener('click', closeMenu);
    }
  });
  
  // Prevent the click from propagating
  event.stopPropagation();
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Coding Pet Extension: Content script received message", message);
  
  if (message.type === 'UPDATE_PET_DISPLAY') {
    updatePetDisplay();
    sendResponse({success: true});
  }
  
  return true; // Required for async response
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  .pet-happy-animation {
    animation: bounce 0.5s ease-in-out 0s 2;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  
  .menu-option {
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 4px;
  }
  
  .menu-option:hover {
    background-color: #f0f0f0;
  }
`;
document.head.appendChild(style);

// Start monitoring when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMonitoring);
} else {
  startMonitoring();
}