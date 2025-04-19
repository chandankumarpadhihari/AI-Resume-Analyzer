const { PDFDocument } = require('pdf-lib');
const mammoth = require('mammoth');
const { Readable } = require('stream');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the multipart form data
    const formData = event.body;
    const file = formData.file;
    
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
        const pdfDoc = await PDFDocument.load(file.buffer);
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
        const buffer = Buffer.from(file.buffer);
        const result = await mammoth.extractRawText({ buffer });
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
      text = file.buffer.toString();
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