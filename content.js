// Variables to track state
let isWatchingSubmission = false;
let lastSubmissionId = null;
let petOverlayActive = false;
let lastSolvedProblem = null;
let isProcessingSubmission = false;
let isDragging = false;
let velocityY = 0;
let lastTimestamp = 0;

// Helper function for transform
function setTranslate(xPos, yPos, el) {
  el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

// Add debug logging
console.log("Coding Pet Extension: Content script loaded");

// Start monitoring for submissions
function startMonitoring() {
  console.log("Coding Pet Extension: Monitoring started on LeetCode");
  createPetOverlay();
  document.addEventListener('click', handlePotentialSubmission);
  startResultObserver();
  requestAnimationFrame(updatePetPhysics);
}

// Start monitoring immediately
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
      width: 120px;
      height: 120px;
      z-index: 999999;
      cursor: grab;
      background-color: transparent;
      pointer-events: auto;
      user-select: none;
      transform-origin: center center;
    `;
    
    const petImage = document.createElement('img');
    petImage.id = 'pet-image';
    petImage.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      pointer-events: none;
      transition: transform 0.2s ease;
    `;
    
    updatePetDisplay();
    petContainer.appendChild(petImage);
    
    // Add drag functionality
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    petContainer.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      
      if (e.target === petContainer) {
        isDragging = true;
        velocityY = 0;
        petContainer.style.cursor = 'grabbing';
        petImage.src = chrome.runtime.getURL('assets/pets/cat/pick.png');
      }
    }
    
    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        setTranslate(currentX, currentY, petContainer);
      }
    }
    
    function dragEnd(e) {
      if (!isDragging) return;
      
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      petContainer.style.cursor = 'grab';
      
      // Calculate the max Y offset so the pet lands 20px from the bottom
      const petHeight = petContainer.offsetHeight;
      const maxY = window.innerHeight - petHeight - 20;
      
      // Set initial velocity for falling animation
      velocityY = 0;
      lastTimestamp = performance.now();
      
      // Update pet image based on state
      updatePetDisplay();
    }
    
    document.body.appendChild(petContainer);
    petOverlayActive = true;
  }
}

// Physics update function
function updatePetPhysics(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  const petContainer = document.getElementById('coding-pet-container');
  if (!petContainer || isDragging) {
    requestAnimationFrame(updatePetPhysics);
    return;
  }

  const currentTransform = new WebKitCSSMatrix(getComputedStyle(petContainer).transform);
  const currentY = currentTransform.m42;
  
  // Apply gravity
  const gravity = 980; // pixels per second squared
  velocityY += gravity * deltaTime;
  
  // Calculate new position
  const newY = currentY + velocityY * deltaTime;
  
  // Check for ground collision
  const petHeight = petContainer.offsetHeight;
  const maxY = window.innerHeight - petHeight - 20;
  
  if (newY > maxY) {
    velocityY = 0;
    setTranslate(currentTransform.m41, maxY, petContainer);
  } else {
    setTranslate(currentTransform.m41, newY, petContainer);
  }
  
  requestAnimationFrame(updatePetPhysics);
}

// Update the pet display based on current state
async function updatePetDisplay() {
  const petContainer = document.getElementById('coding-pet-container');
  const petImage = document.getElementById('pet-image');
  
  if (!petContainer || !petImage) return;

  try {
    const { petState } = await chrome.storage.local.get('petState');
    if (!petState) return;

    let imagePath;
    const isLeetCode = window.location.hostname.includes('leetcode.com');
    const progressPercentage = (petState.solvedToday / petState.chonkLevel) * 100;
    
    if (!isLeetCode) {
      // When not on LeetCode, show sleeping.gif if daily goal is met
      imagePath = petState.solvedToday >= petState.chonkLevel 
        ? 'assets/pets/cat/Sleeping.gif'
        : 'assets/pets/cat/frail.png';
    } else {
      // On LeetCode
      if (petState.solvedToday === 0) {
        imagePath = 'assets/pets/cat/frail.png';
      } else if (petState.solvedToday >= petState.chonkLevel) {
        imagePath = 'assets/pets/cat/happy.png';
      } else if (progressPercentage >= 80) {
        imagePath = 'assets/pets/cat/Normal.gif';
      } else {
        imagePath = 'assets/pets/cat/frail.png';
      }
    }
    
    petImage.src = chrome.runtime.getURL(imagePath);
    
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
          border-radius: 50%;
          padding: 10px;
          z-index: 10002;
          animation: fadeOut 5s forwards;
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
    existingMenu.remove();
    return;
  }

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

  document.body.appendChild(menu);
  
  // Add event listeners to menu options
  document.getElementById('let-sleep').addEventListener('click', () => {
    menu.remove();
  });
  
  document.getElementById('ask-help').addEventListener('click', () => {
    alert('Help feature coming soon in the next version!');
    menu.remove();
  });
  
  // Close menu when clicking elsewhere
  const handleClickOutside = (e) => {
    if (!menu.contains(e.target) && e.target.id !== 'coding-pet-container') {
      menu.remove();
      document.removeEventListener('click', handleClickOutside);
    }
  };
  
  // Add click listener with a small delay to prevent immediate triggering
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
  }, 0);
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