// Initialize pet state when extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Coding Pet Extension: Initializing pet state");
  
  // Check if pet state already exists
  const { petState } = await chrome.storage.local.get('petState');
  
  if (!petState) {
    // Create default pet state with cat instead of dog
    const defaultPetState = {
      type: 'cat',
      health: 100,
      happiness: 50,
      chonkLevel: 3, // Default daily goal of 3 problems
      solvedToday: 0,
      lastActiveDate: new Date().toDateString(),
      backlog: 0,
      status: 'normal' // normal, happy, sleeping, frail
    };
    
    await chrome.storage.local.set({ petState: defaultPetState });
    console.log("Coding Pet Extension: Default pet state initialized");
  }
});

// Set up daily reset alarm
chrome.alarms.create('dailyReset', {
  periodInMinutes: 1440 // 24 hours
});

// Listen for alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyReset') {
    console.log("Coding Pet Extension: Daily reset alarm triggered");
    await performDailyReset();
  }
});

// Handle the daily reset logic
async function performDailyReset() {
  try {
    const { petState } = await chrome.storage.local.get('petState');
    
    if (!petState) return;
    
    const today = new Date().toDateString();
    if (petState.lastActiveDate !== today) {
      console.log(`Coding Pet Extension: New day detected. Last active: ${petState.lastActiveDate}, Today: ${today}`);
      
      // It's a new day, check if user met their goal yesterday
      const unsolvedYesterday = petState.chonkLevel - petState.solvedToday;
      if (unsolvedYesterday > 0) {
        console.log(`Coding Pet Extension: User didn't meet goal. Unsolved: ${unsolvedYesterday}`);
        
        // Add to backlog
        petState.backlog += unsolvedYesterday;
        
        // If backlog equals chonk level, determine if pet perishes
        if (petState.backlog >= petState.chonkLevel) {
          console.log("Coding Pet Extension: Backlog equals chonk level - determining fate");
          
          // 50% chance of survival
          if (Math.random() < 0.5) {
            petState.health = 10; // Almost perished but survived
            petState.status = 'frail';
            console.log("Coding Pet Extension: Pet survived but is frail");
          } else {
            // Pet perishes - set to critical state
            petState.health = 0;
            petState.status = 'frail'; // Using frail for now until we have a critical image
            console.log("Coding Pet Extension: Pet is in critical condition");
            
            // Send a notification
            chrome.notifications.create({
              type: 'basic',
              iconUrl: '/assets/icon-128.png',
              title: 'Your coding pet needs you!',
              message: 'Your pet is in critical condition! Solve problems to save it!'
            });
          }
        } else {
          // Just reduce health and make pet frail
          petState.health = Math.max(0, petState.health - 20);
          petState.status = 'frail';
          console.log(`Coding Pet Extension: Pet health reduced to ${petState.health}`);
        }
      }
      
      // Reset daily counter
      petState.solvedToday = 0;
      petState.lastActiveDate = today;
      
      // Save updated state
      await chrome.storage.local.set({ petState });
      console.log("Coding Pet Extension: Updated pet state after daily reset", petState);
      
      // Notify any open tabs to update
      notifyAllTabs();
    }
  } catch (error) {
    console.error("Coding Pet Extension: Error in daily reset", error);
  }
}

// Notify all tabs to update pet display
function notifyAllTabs() {
  chrome.tabs.query({url: "*://leetcode.com/*"}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'UPDATE_PET_DISPLAY'
      }).catch(err => console.log("Tab not ready yet:", err));
    }
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Coding Pet Extension: Background received message", message);
  
  if (message.type === 'PROBLEM_SOLVED') {
    handleProblemSolved().then(() => {
      sendResponse({success: true});
    }).catch(err => {
      console.error("Coding Pet Extension: Error handling problem solved", err);
      sendResponse({success: false, error: err.message});
    });
    return true; // Required for async response
  }
  
  return false;
});

// Handle when a problem is solved
async function handleProblemSolved() {
  try {
    const { petState } = await chrome.storage.local.get('petState');
    
    if (!petState) {
      console.error("Coding Pet Extension: No pet state found when handling solved problem");
      return;
    }
    
    console.log("Coding Pet Extension: Handling solved problem, current state:", petState);
    
    // Update pet state
    petState.solvedToday += 1;
    petState.happiness = Math.min(100, petState.happiness + 10);
    
    // If there's a backlog, reduce it
    if (petState.backlog > 0) {
      petState.backlog -= 1;
      petState.health = Math.min(100, petState.health + 10);
      console.log(`Coding Pet Extension: Reduced backlog to ${petState.backlog}`);
    }
    
    // Update pet status
    if (petState.solvedToday >= petState.chonkLevel) {
      petState.status = 'happy';
    } else if (petState.backlog > 0) {
      petState.status = 'frail';
    } else {
      petState.status = 'normal';
    }
    
    console.log(`Coding Pet Extension: Updated pet status to ${petState.status}`);
    
    // Save updated state
    await chrome.storage.local.set({ petState });
    console.log("Coding Pet Extension: Updated pet state after problem solved", petState);
    
    return true;
  } catch (error) {
    console.error("Coding Pet Extension: Error handling problem solved", error);
    throw error;
  }
}