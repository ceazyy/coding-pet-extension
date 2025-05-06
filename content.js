// Variables to track state
let isWatchingSubmission = false;
let lastSubmissionId = null;
let petOverlayActive = false;
let lastSolvedProblem = null;
let isProcessingSubmission = false;

// Add debug logging
console.log("Coding Pet Extension: Content script loaded");

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

// Start monitoring immediately regardless of page
startMonitoring();

// Create the persistent pet overlay
function createPetOverlay() {
  console.log("Creating pet overlay...");
  
  if (petOverlayActive) {
    console.log("Overlay already active");
    return;
  }
  
  let petContainer = document.getElementById('coding-pet-container');
  
  if (!petContainer) {
    petContainer = document.createElement('div');
    petContainer.id = 'coding-pet-container';
    petContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 100px;
      height: 100px;
      z-index: 999999;
      cursor: pointer;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: auto;
    `;
    
    const petImage = document.createElement('img');
    petImage.id = 'pet-image';
    petImage.style.cssText = `
      width: 80%;
      height: 80%;
      object-fit: contain;
    `;
    
    // Set initial image
    const defaultImagePath = chrome.runtime.getURL('assets/pets/cat/normal.png');
    console.log("Setting initial image path:", defaultImagePath);
    petImage.src = defaultImagePath;
    
    // Add error handling for image loading
    petImage.onerror = () => {
      console.error("Failed to load pet image:", petImage.src);
    };
    
    petImage.onload = () => {
      console.log("Pet image loaded successfully");
    };
    
    petContainer.appendChild(petImage);
    petContainer.addEventListener('click', showPetInteractionMenu);
    
    document.body.appendChild(petContainer);
    petOverlayActive = true;
    console.log("Pet overlay created and added to DOM");

    // Initial state update
    updatePetDisplay();
  }
}

// Ensure overlay is created when content script loads
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, creating overlay...");
  createPetOverlay();
});

// Also create overlay immediately in case DOMContentLoaded already fired
createPetOverlay();

// Update the pet display based on current state
async function updatePetDisplay() {
  const petContainer = document.getElementById('coding-pet-container');
  const petImage = document.getElementById('pet-image');
  
  if (!petContainer || !petImage) return;

  try {
    const { petState } = await chrome.storage.local.get('petState');
    if (!petState) return;

    // Get the correct image based on pet state
    let imageState = petState.status || 'normal';
    
    // Override status based on health/happiness if needed
    if (petState.health < 30) {
      imageState = 'frail';
    } else if (petState.status !== 'sleeping' && petState.happiness > 80) {
      imageState = 'happy';
    }

    // Update image source
    const imagePath = `assets/pets/cat/${imageState}.png`;
    petImage.src = chrome.runtime.getURL(imagePath);
    
    // Update container effects
    if (petState.health < 30) {
      petContainer.style.filter = 'grayscale(80%)';
    } else if (petState.happiness < 30) {
      petContainer.style.filter = 'brightness(80%)';
    } else {
      petContainer.style.filter = 'none';
    }

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

// Modify the checkForSubmissionResult function
function checkForSubmissionResult() {
  if (isProcessingSubmission) return;
  
  // Get problem ID and check if already solved
  const problemTitle = document.querySelector('a[href^="/problems/"]');
  if (!problemTitle) return;
  
  const problemId = problemTitle.getAttribute('href');
  const solvedIndicator = document.querySelector('.text-text-secondary');
  const isSolvedBefore = solvedIndicator?.textContent.includes('Solved');
  
  // Check for Accepted submission
  const resultElement = document.querySelector('[data-e2e-locator="submission-result"]');
  if (resultElement && resultElement.textContent === 'Accepted') {
    isProcessingSubmission = true;
    
    // Check if problem was already solved
    chrome.storage.local.get('solvedProblems', async ({ solvedProblems = [] }) => {
      if (solvedProblems.includes(problemId) || (isSolvedBefore && lastSolvedProblem === problemId)) {
        // Show sassy message for trying to trick the pet
        const message = document.createElement('div');
        message.textContent = 'How dare ya trick me, you peasant!';
        message.style.cssText = `
          position: fixed;
          bottom: 130px;
          right: 130px;
          background: #ffffff;
          border: 1px solid #ccc;
          border-radius: 8px;
          padding: 10px;
          z-index: 10002;
          animation: fadeOut 2s forwards;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #333;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
          document.body.removeChild(message);
        }, 2000);
        
        isProcessingSubmission = false;
        isWatchingSubmission = false;
        return;
      }

      // For new solutions, update progress
      const { petState } = await chrome.storage.local.get('petState');
      if (petState) {
        petState.solvedToday += 1;
        petState.happiness = Math.min(100, petState.happiness + 10);
        await chrome.storage.local.set({ petState });
        
        // Store the solved problem ID
        solvedProblems.push(problemId);
        await chrome.storage.local.set({ solvedProblems });
        
        lastSolvedProblem = problemId;
        showPetHappyAnimation();
      }
      
      isProcessingSubmission = false;
      isWatchingSubmission = false;
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
async function showPetInteractionMenu(event) {
  event.preventDefault();
  event.stopPropagation();

  // Remove existing menu if present
  const existingMenu = document.getElementById('pet-interaction-menu');
  if (existingMenu) {
    document.body.removeChild(existingMenu);
    return;
  }

  // Remove any existing menu

  const { petState } = await chrome.storage.local.get('petState');
  
  const menu = document.createElement('div');
  menu.id = 'pet-interaction-menu';
  menu.style.cssText = `
    position: fixed;
    bottom: 130px;
    right: 20px;
    background: #ffffff;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10001;
    color: #333333;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  `;
  
  menu.innerHTML = `
    <div style="margin-bottom: 12px; font-size: 14px;">
      <div style="margin-bottom: 6px; color: #333;">Health: <span style="color: ${getHealthColor(petState.health)}">${petState.health}%</span></div>
      <div style="margin-bottom: 6px; color: #333;">Happiness: <span style="color: ${getHappinessColor(petState.happiness)}">${petState.happiness}%</span></div>
      <div style="margin-bottom: 6px; color: #333;">Progress: <span style="color: #2196F3">${petState.solvedToday}/${petState.chonkLevel}</span></div>
    </div>
    <div class="menu-option" id="let-sleep">Let it sleep</div>
    <div class="menu-option" id="ask-help">Ask for help</div>
  `;

  // Update the CSS for menu options
  const menuStyles = `
    .menu-option {
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 4px;
      color: #333333;
      margin-top: 8px;
      transition: background-color 0.2s;
    }
    
    .menu-option:hover {
      background-color: #f0f0f0;
      color: #000000;
    }
  `;
  
  const styleElement = document.createElement('style');
  styleElement.textContent = menuStyles;
  document.head.appendChild(styleElement);
  
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

// Add helper functions for colors
function getHealthColor(health) {
  if (health < 30) return '#f44336';
  if (health < 70) return '#ff9800';
  return '#4caf50';
}

function getHappinessColor(happiness) {
  if (happiness < 30) return '#f44336';
  if (happiness < 70) return '#ff9800';
  return '#4caf50';
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

// Add this near the other listeners
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.petState) {
    updatePetDisplay();
  }
});

// Remove both existing style declarations and replace with this one
const style = document.createElement('style');
style.textContent = `
  #coding-pet-container {
    transition: filter 0.3s ease, transform 0.3s ease;
  }

  #coding-pet-container:hover {
    transform: scale(1.05);
  }

  #pet-image {
    transition: all 0.3s ease;
  }

  .pet-happy-animation {
    animation: bounce 0.5s ease-in-out 0s 2;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-20px) scale(1.1); }
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

// Add storage for solved problems
chrome.storage.local.get('solvedProblems', ({ solvedProblems = [] }) => {
  lastSolvedProblem = solvedProblems[solvedProblems.length - 1];
});

// Add this CSS for the message animation
const messageStyle = document.createElement('style');
messageStyle.textContent = `
  @keyframes fadeOut {
    0% { opacity: 1; }
    70% { opacity: 1; }
    100% { opacity: 0; }
  }
`;
document.head.appendChild(messageStyle);