const { PDFDocument } = require('pdf-lib');
const mammoth = require('mammoth');
const { Readable } = require('stream');
const multipart = require('parse-multipart');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the multipart form data
    const boundary = event.headers['content-type'].split('=')[1];
    const parts = multipart.Parse(Buffer.from(event.body, 'base64'), boundary);
    const file = parts[0];

    if (!file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No file provided' })
      };
    }

    let text = '';

    // Handle different file types
    if (file.type === 'application/pdf') {
      try {
        // For PDF files
        const pdfDoc = await PDFDocument.load(file.data);
        const pages = pdfDoc.getPages();
        for (const page of pages) {
          text += await page.getText();
        }
      } catch (error) {
        console.error('PDF processing error:', error);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Failed to process PDF file' })
        };
      }
    } else if (file.type === 'application/msword' || 
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        // For DOC/DOCX files
        const result = await mammoth.extractRawText({ buffer: file.data });
        text = result.value;
      } catch (error) {
        console.error('DOC processing error:', error);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Failed to process document file' })
        };
      }
    } else if (file.type === 'text/plain') {
      // For text files
      text = file.data.toString();
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unsupported file type' })
      };
    }

    if (!text.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No text content found in file' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ text })
    };
  } catch (error) {
    console.error('Error processing file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 