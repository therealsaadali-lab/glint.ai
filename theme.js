// theme.js - The core theme management logic (Bulletproof Fix)

// Function to apply theme (used on ALL pages)
function applyTheme(themeName) {
  try {
    // Ensure themeName is valid - only allow dark and light
    if (!themeName || themeName === 'null' || !['dark', 'light'].includes(themeName)) {
      themeName = 'light'; // Fallback to light (white theme)
      console.log('⚠️ No valid theme found in localStorage, defaulting to light');
    }
    
    // Remove all existing theme classes
    document.documentElement.className = '';
    
    // Add theme class (only dark or light)
    document.documentElement.classList.add(themeName);
    
    // Save to localStorage
    localStorage.setItem('theme', themeName);
    
    console.log('✅ Theme applied:', themeName, 'HTML class:', document.documentElement.className);
    
  } catch (err) {
    console.error('⚠️ Error in applyTheme:', err);
  }
}

// Function to initialize the theme on page load
function initializeTheme() {
  try {
    // Load saved theme, default to 'light'
    let savedTheme = localStorage.getItem('theme') || 'light';
    
    // If saved theme is not dark or light, default to light
    if (!['dark', 'light'].includes(savedTheme)) {
      savedTheme = 'light';
    }
    
    console.log('🔍 Initializing theme, saved theme:', savedTheme);
    applyTheme(savedTheme);
    
  } catch (err) {
    console.error('⚠️ Error in initializeTheme:', err);
  }
}

// Expose applyTheme globally
window.applyTheme = applyTheme;

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, initializing theme');
  initializeTheme();
});