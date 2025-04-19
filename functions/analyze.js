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

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Create the analysis prompt
    const prompt = `Analyze how well this resume matches the job description and provide specific feedback:

Resume:
${resume}

Job Description:
${job}

Please provide:
1. Overall match percentage (0-100%)
2. Key strengths that match the job requirements
3. Areas for improvement
4. Specific skills or experiences that are missing
5. Recommendations for improvement

Format the response in a clear, structured way.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert resume analyzer and career coach. Provide detailed, constructive feedback on resume-job match."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const analysis = completion.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        analysis: analysis,
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
      body: JSON.stringify({ 
        error: error.message,
        details: 'Please ensure you have set up your OpenAI API key in Netlify environment variables.'
      })
    };
  }
};
