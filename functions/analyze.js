const OpenAI = require('openai');

exports.handler = async function(event, context) {
  console.log('Function called');
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { resume, job } = JSON.parse(event.body);
    console.log('Received data:', { resume: resume.substring(0, 50) + '...', job: job.substring(0, 50) + '...' });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        analysis: "Test response: Function is working!",
        received: {
          resumeLength: resume.length,
          jobLength: job.length
        }
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
