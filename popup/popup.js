// Load pet state when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    updatePetDisplay();
    setupEventListeners();
  });
  
  // Update the pet display with current data
  async function updatePetDisplay() {
    const { petState } = await chrome.storage.local.get('petState');
    
    if (!petState) return;
    
    // Update pet image
    const petImage = document.getElementById('pet-image');
    petImage.src = `../assets/pets/${petState.type}/${petState.status}.png`;
    
    // Update health bar
    const healthBar = document.getElementById('health-bar');
    healthBar.style.width = `${petState.health}%`;
    healthBar.style.backgroundColor = getHealthColor(petState.health);
    
    // Update happiness bar
    const happinessBar = document.getElementById('happiness-bar');
    happinessBar.style.width = `${petState.happiness}%`;
    
    // Update progress text
    document.getElementById('progress-text').textContent = 
      `${petState.solvedToday}/${petState.chonkLevel}`;
    
    // Update backlog text
    document.getElementById('backlog-text').textContent = petState.backlog;
    
    // Set chonk level in settings
    document.getElementById('chonk-level').value = petState.chonkLevel;
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
    document.getElementById('save-settings').addEventListener('click', async () => {
      const chonkLevel = parseInt(document.getElementById('chonk-level').value);
      
      if (isNaN(chonkLevel) || chonkLevel < 1) {
        alert('Please enter a valid number for daily goal (minimum 1)');
        return;
      }
      
      const { petState } = await chrome.storage.local.get('petState');
      if (petState) {
        petState.chonkLevel = chonkLevel;
        await chrome.storage.local.set({ petState });
        updatePetDisplay();
      }
    });
  }