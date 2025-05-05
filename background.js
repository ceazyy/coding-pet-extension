// Set up daily reset alarm
chrome.alarms.create('dailyReset', {
    periodInMinutes: 1440 // 24 hours
  });
  
  // Listen for alarm
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'dailyReset') {
      await performDailyReset();
    }
  });
  
  // Handle the daily reset logic
  async function performDailyReset() {
    const { petState } = await chrome.storage.local.get('petState');
    
    if (!petState) return;
    
    const today = new Date().toDateString();
    if (petState.lastActiveDate !== today) {
      // It's a new day, check if user met their goal yesterday
      const unsolvedYesterday = petState.chonkLevel - petState.solvedToday;
      if (unsolvedYesterday > 0) {
        // Add to backlog
        petState.backlog += unsolvedYesterday;
        
        // If backlog equals chonk level, determine if pet perishes
        if (petState.backlog >= petState.chonkLevel) {
          // 50% chance of survival
          if (Math.random() < 0.5) {
            petState.health = 10; // Almost perished but survived
            petState.status = 'frail';
          } else {
            // Pet perishes - set to critical state
            petState.health = 0;
            petState.status = 'critical';
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
        }
      }
      
      // Reset daily counter
      petState.solvedToday = 0;
      petState.lastActiveDate = today;
      
      // Save updated state
      await chrome.storage.local.set({ petState });
    }
  }
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PROBLEM_SOLVED') {
      handleProblemSolved();
      sendResponse({success: true});
    }
    return true; // Required for async response
  });
  
  // Handle when a problem is solved
  async function handleProblemSolved() {
    const { petState } = await chrome.storage.local.get('petState');
    
    if (!petState) return;
    
    // Update pet state
    petState.solvedToday += 1;
    petState.happiness = Math.min(100, petState.happiness + 10);
    
    // If there's a backlog, reduce it
    if (petState.backlog > 0) {
      petState.backlog -= 1;
      petState.health = Math.min(100, petState.health + 10);
    }
    
    // Update pet status
    if (petState.solvedToday >= petState.chonkLevel) {
      petState.status = 'happy';
    } else if (petState.backlog > 0) {
      petState.status = 'frail';
    } else {
      petState.status = 'normal';
    }
    
    // Save updated state
    await chrome.storage.local.set({ petState });
  }