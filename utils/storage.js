// Utility functions for storage operations
const PetStorage = {
    // Save pet state to browser storage
    savePetState: async (petState) => {
      return chrome.storage.local.set({ petState });
    },
    
    // Get current pet state from storage
    getPetState: async () => {
      const data = await chrome.storage.local.get('petState');
      if (data.petState) {
        return data.petState;
      }
      // Default initial state if none exists
      return {
        type: 'cat',
        health: 100,
        happiness: 50,
        chonkLevel: 3, // Default daily goal of 3 problems
        solvedToday: 0,
        lastActiveDate: new Date().toDateString(),
        backlog: 0,
        status: 'normal' // normal, happy, sleeping, frail
      };
    },
    
    // Save user settings
    saveSettings: async (settings) => {
      return chrome.storage.local.set({ settings });
    },
    
    // Get user settings
    getSettings: async () => {
      const data = await chrome.storage.local.get('settings');
      if (data.settings) {
        return data.settings;
      }
      // Default settings
      return {
        petType: 'cat',
        dailyGoal: 3,
        notifications: true
      };
    }
  };
  
  export default PetStorage;