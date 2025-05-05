// Variables to track state
let isWatchingSubmission = false;
let lastSubmissionId = null;

// Start monitoring for submissions
function startMonitoring() {
  // Watch for submission button clicks
  document.addEventListener('click', handlePotentialSubmission);
  
  // Start the observer to watch for DOM changes
  startResultObserver();
}

// Handle clicks that might be submissions
function handlePotentialSubmission(event) {
  // Look for submission button clicks on LeetCode
  const submitButtons = document.querySelectorAll('button[data-e2e-locator="console-submit-button"]');
  if (submitButtons.length > 0) {
    for (const button of submitButtons) {
      if (button.contains(event.target)) {
        console.log('Submit button clicked, watching for results...');
        isWatchingSubmission = true;
        
        // Try to extract submission ID if possible (implementation depends on LeetCode's structure)
        // This is a placeholder - actual implementation will vary
        setTimeout(checkForSubmissionResult, 1000);
      }
    }
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
}

// Check if there's a successful submission result
function checkForSubmissionResult() {
    const resultSpan = document.querySelector('span[data-e2e-locator="submission-result"]');
    
    if (resultSpan && resultSpan.textContent.trim() === 'Accepted') {
      console.log('Problem solved successfully! Your furbaby is happy :3');
      isWatchingSubmission = false;
  
      chrome.runtime.sendMessage({
        type: 'PROBLEM_SOLVED'
      }, response => {
        if (response && response.success) {
          showPetAnimation();
        }
      });
    }
  }
  

// Display pet animation when problem is solved
function showPetAnimation() {
  // First, check if our pet container already exists
  let petContainer = document.getElementById('coding-pet-container');
  
  if (!petContainer) {
    // Create and add the pet container
    petContainer = document.createElement('div');
    petContainer.id = 'coding-pet-container';
    petContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 150px;
      height: 150px;
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    `;
    document.body.appendChild(petContainer);
  
    // Add click event listener
    petContainer.addEventListener('click', showPetInteractionMenu);
  }

  // Update the pet image based on state
  chrome.storage.local.get('petState', ({ petState }) => {
    if (!petState) return;
    
    const petImage = document.createElement('img');
    petImage.src = chrome.runtime.getURL(`assets/pets/${petState.type}/${petState.status}.png`);
    petImage.style.width = '100%';
    petImage.style.height = 'auto';
    
    // Clear container and add the new image
    petContainer.innerHTML = '';
    petContainer.appendChild(petImage);
    
    // Show animation
    petContainer.classList.add('pet-happy-animation');
    setTimeout(() => {
      petContainer.classList.remove('pet-happy-animation');
    }, 2000);
  });
}

// Show interaction menu when pet is clicked
function showPetInteractionMenu(event) {
  const menu = document.createElement('div');
  menu.id = 'pet-interaction-menu';
  menu.style.cssText = `
    position: fixed;
    bottom: 180px;
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