// Feedback system
class Feedback {
  static feedbackEndpoint = 'https://your-feedback-api.com/feedback';

  static async submitFeedback(feedback) {
    const feedbackData = {
      timestamp: new Date().toISOString(),
      feedback,
      userAgent: navigator.userAgent,
      extensionVersion: chrome.runtime.getManifest().version
    };

    try {
      const response = await fetch(this.feedbackEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      return true;
    } catch (error) {
      console.error('Feedback error:', error);
      return false;
    }
  }

  static showFeedbackForm() {
    const form = document.createElement('div');
    form.innerHTML = `
      <div id="feedback-form" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        width: 300px;
      ">
        <h3 style="margin: 0 0 15px 0; color: #ff69b4;">Send Feedback</h3>
        <textarea id="feedback-text" style="
          width: 100%;
          height: 100px;
          margin-bottom: 10px;
          padding: 8px;
          border: 1px solid #ffb6c1;
          border-radius: 5px;
          resize: vertical;
        " placeholder="Tell us what you think..."></textarea>
        <div style="display: flex; gap: 10px;">
          <button id="submit-feedback" style="
            background: #ff69b4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
          ">Submit</button>
          <button id="cancel-feedback" style="
            background: #f0f0f0;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
          ">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(form);

    // Add event listeners
    document.getElementById('submit-feedback').addEventListener('click', async () => {
      const feedbackText = document.getElementById('feedback-text').value;
      if (feedbackText.trim()) {
        const success = await this.submitFeedback(feedbackText);
        if (success) {
          alert('Thank you for your feedback!');
        } else {
          alert('Failed to submit feedback. Please try again.');
        }
      }
      form.remove();
    });

    document.getElementById('cancel-feedback').addEventListener('click', () => {
      form.remove();
    });
  }
}

// Add feedback button to popup
document.addEventListener('DOMContentLoaded', () => {
  const feedbackButton = document.createElement('button');
  feedbackButton.textContent = 'Send Feedback';
  feedbackButton.style.cssText = `
    background: #ff69b4;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;
    width: 100%;
  `;
  
  feedbackButton.addEventListener('click', () => {
    Feedback.showFeedbackForm();
  });

  document.querySelector('.container').appendChild(feedbackButton);
});

export default Feedback; 