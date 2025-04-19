// Theme functionality
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-toggle i');
  icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// File upload functionality
const resumeFile = document.getElementById('resumeFile');
const fileName = document.getElementById('fileName');
const resumeTextarea = document.getElementById('resume');

resumeFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    fileName.textContent = file.name;
    
    // Clear textarea when file is selected
    resumeTextarea.value = '';
    
    try {
      // For text files, read directly
      if (file.type === 'text/plain') {
        const text = await file.text();
        resumeTextarea.value = text;
      } 
      // For PDF and DOC files, send to server for processing
      else if (file.type === 'application/pdf' || 
               file.type === 'application/msword' || 
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        
        // Show loading state
        fileName.textContent = 'Processing file...';
        
        // Create FormData and append file
        const formData = new FormData();
        formData.append('file', file);
        
        // Send file to server
        const response = await fetch('/.netlify/functions/extract-text', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to process file');
        }
        
        const data = await response.json();
        if (data.text) {
          resumeTextarea.value = data.text;
          fileName.textContent = file.name;
        } else {
          throw new Error('No text content received from server');
        }
      } else {
        throw new Error('Unsupported file type. Please upload a PDF, DOC, DOCX, or TXT file.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file: ' + error.message);
      fileName.textContent = 'No file chosen';
      resumeFile.value = '';
    }
  } else {
    fileName.textContent = 'No file chosen';
  }
});

// Clear file input when textarea is modified
resumeTextarea.addEventListener('input', () => {
  if (resumeFile.value) {
    resumeFile.value = '';
    fileName.textContent = 'No file chosen';
  }
});

// Analysis functionality
async function analyze() {
  const resumeText = document.getElementById('resume').value;
  const job = document.getElementById('job').value;
  const resultBox = document.getElementById('result');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const buttonText = document.getElementById('buttonText');
  const loadingSpinner = document.getElementById('loadingSpinner');

  // Validate inputs
  if (!resumeText) {
    alert('Please enter your resume text or upload a file');
    return;
  }
  if (!job) {
    alert('Please enter the job description');
    return;
  }

  // Show loading state
  analyzeBtn.disabled = true;
  buttonText.textContent = 'Analyzing...';
  loadingSpinner.classList.remove('hidden');
  resultBox.classList.add('hidden');

  try {
    const res = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume: resumeText, job })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error analyzing resume');
    }

    const data = await res.json();
    resultBox.textContent = data.analysis;
    resultBox.classList.remove('hidden');
  } catch (err) {
    console.error('Error during analysis:', err);
    resultBox.textContent = `Error: ${err.message}. Please try again later or contact support if the problem persists.`;
    resultBox.classList.remove('hidden');
  } finally {
    // Reset button state
    analyzeBtn.disabled = false;
    buttonText.textContent = 'Analyze Fit';
    loadingSpinner.classList.add('hidden');
  }
}

// Initialize theme
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
}); 